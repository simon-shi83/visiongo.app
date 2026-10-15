// Organizations, memberships and organization-bound desktop tokens.
// Wire shapes follow SDK/schemas/identity.json; when the VisionAgent SDK is
// checked out next to this repository the golden samples are compared too.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const { default: worker } = await vite.ssrLoadModule('/worker/index.ts');
const auth = await vite.ssrLoadModule('/worker/auth.ts');
const { buildImportSql } = await import('./import-organizations.mjs');
const databases = [];
after(async () => { for (const db of databases) db.close(); await vite.close(); });

const migrations = fs.readdirSync('migrations').filter(file => file.endsWith('.sql')).sort();

function wrap(sqlite) {
  const prepare = sql => {
    let parameters = [];
    const statement = () => sqlite.prepare(sql);
    const api = {
      bind(...values) { parameters = values; return api; },
      async first() { return statement().get(...parameters) || null; },
      async all() { return { success: true, results: statement().all(...parameters) }; },
      async run() { const result = statement().run(...parameters); return { success: true, meta: { changes: result.changes } }; },
    };
    return api;
  };
  return { sqlite, prepare, async batch(statements) { sqlite.exec('BEGIN'); try { const results = []; for (const stmt of statements) results.push(await stmt.run()); sqlite.exec('COMMIT'); return results; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } } };
}

function database(files = migrations) {
  const sqlite = new DatabaseSync(':memory:');
  databases.push(sqlite);
  for (const file of files) sqlite.exec(fs.readFileSync(`migrations/${file}`, 'utf8'));
  return wrap(sqlite);
}

const keys = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', keys.privateKey)).toString('base64');
const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${pkcs8.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;

function environment() {
  return { DB: database(), SESSION_SECRET: 'test-session-secret', DESKTOP_TOKEN_PRIVATE_KEY: privateKeyPem,
           ASSETS: { fetch: async () => new Response('Not Found', { status: 404 }) } };
}

function addUser(env, id, email, role = 'member') {
  const tenant = `vg_tenant_${id}`;
  env.DB.sqlite.prepare('INSERT INTO users (id, tenant_id, role, google_sub, auth_provider, email, display_name, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(`vg_usr_${id}`, tenant, role, `google-${id}`, 'google', email, id, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
  return { id: `vg_usr_${id}`, tenant };
}

async function cookieFor(userId) {
  const { cookieHeader } = await auth.createSessionCookie(userId, 'subject', 'test-session-secret');
  return cookieHeader.split(';')[0];
}

async function call(env, path, { body, cookie, method } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const response = await worker.fetch(new Request(`https://visiongo.app${path}`, {
    method: method || (body === undefined ? 'GET' : 'POST'), headers,
    body: body === undefined ? undefined : JSON.stringify(body) }), env, { waitUntil() {} });
  return { status: response.status, body: await response.json().catch(() => null) };
}

function base64UrlDecode(part) {
  return Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

async function verifiedClaims(token) {
  const [header, payload, signature] = token.split('.');
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', keys.publicKey, base64UrlDecode(signature),
                                           new TextEncoder().encode(`${header}.${payload}`));
  assert.ok(valid, 'access token signature');
  return JSON.parse(base64UrlDecode(payload).toString('utf8'));
}

const verifier = 'v'.repeat(64);
const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))).toString('base64url');

async function desktopLogin(env, userId, tenantId) {
  const cookie = await cookieFor(userId);
  const code = await call(env, '/api/auth/desktop-code', { cookie, body: { code_challenge: challenge, code_challenge_method: 'S256', ...(tenantId ? { tenant_id: tenantId } : {}) } });
  if (code.status !== 200) return code;
  return call(env, '/api/auth/token', { body: { grant_type: 'authorization_code', code: code.body.code, code_verifier: verifier } });
}

async function enterprise(env, admin, name = '某工厂 A') {
  const created = await call(env, '/api/orgs', { cookie: await cookieFor(admin), body: { name, admin_email: 'boss@factory.example' } });
  assert.equal(created.status, 201);
  return created.body.organization.id;
}

test('migration turns every existing tenant into a personal organization the user administers', () => {
  const db = database(migrations.filter(file => file < '0005'));
  db.sqlite.prepare('INSERT INTO users (id, tenant_id, role, google_sub, email, display_name, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run('vg_usr_old', 'vg_tenant_old', 'org_admin', 'g-old', 'Old@Example.com', '老用户', '2025-01-01', '2025-01-01');
  db.sqlite.exec(fs.readFileSync('migrations/0005_organizations.sql', 'utf8'));
  assert.deepEqual({ ...db.sqlite.prepare('SELECT id, name, type, status FROM organizations').get() },
                   { id: 'vg_tenant_old', name: '老用户', type: 'personal', status: 'active' });
  const member = db.sqlite.prepare('SELECT email, user_id, role, status FROM organization_members').get();
  assert.deepEqual({ ...member }, { email: 'old@example.com', user_id: 'vg_usr_old', role: 'admin', status: 'active' });
  assert.equal(db.sqlite.prepare('SELECT role FROM users').get().role, 'member');
});

test('desktop token carries the selected organization, both audiences and the effective role', async () => {
  const env = environment();
  const root = addUser(env, 'root', 'root@visiongo.app', 'super_admin');
  const boss = addUser(env, 'boss', 'Boss@Factory.example');
  const orgId = await enterprise(env, root.id);

  // Personal organization by default; the invitation is accepted on first use.
  const personal = await desktopLogin(env, boss.id);
  assert.equal(personal.status, 200);
  assert.equal(personal.body.tenant_id, boss.tenant);
  assert.equal(personal.body.tenant_type, 'personal');
  assert.equal(personal.body.role, 'org_admin');
  assert.deepEqual(personal.body.tenants.map(item => [item.tenant_id, item.type, item.role]),
                   [[boss.tenant, 'personal', 'org_admin'], [orgId, 'enterprise', 'org_admin']]);

  const chosen = await desktopLogin(env, boss.id, orgId);
  assert.equal(chosen.status, 200);
  const claims = await verifiedClaims(chosen.body.access_token);
  assert.deepEqual(claims.aud, ['visioncloud', 'visiontrainer']);
  assert.equal(claims.sub, boss.id);
  assert.equal(claims.tenant_id, orgId);
  assert.equal(claims.tenant_name, '某工厂 A');
  assert.equal(claims.tenant_type, 'enterprise');
  assert.equal(claims.role, 'org_admin');
  assert.equal(chosen.body.token_type, 'Bearer');
  assert.ok(chosen.body.refresh_token.startsWith('vg_rf_'));

  // The last used organization becomes the default for the next sign-in.
  assert.equal((await desktopLogin(env, boss.id)).body.tenant_id, orgId);

  // Platform administrators keep super_admin in every organization.
  const rootClaims = await verifiedClaims((await desktopLogin(env, root.id)).body.access_token);
  assert.equal(rootClaims.role, 'super_admin');
});

test('organizations the user does not belong to are refused at every step', async () => {
  const env = environment();
  const root = addUser(env, 'root', 'root@visiongo.app', 'super_admin');
  const outsider = addUser(env, 'eve', 'eve@example.com');
  const orgId = await enterprise(env, root.id);
  const cookie = await cookieFor(outsider.id);
  assert.equal((await call(env, '/api/auth/desktop-code', { cookie, body: { code_challenge: challenge, tenant_id: orgId } })).status, 403);

  const code = await call(env, '/api/auth/desktop-code', { cookie, body: { code_challenge: challenge } });
  const token = await call(env, '/api/auth/token', { body: { grant_type: 'authorization_code', code: code.body.code, code_verifier: verifier, tenant_id: orgId } });
  assert.equal(token.status, 403);
  assert.equal(token.body.error, 'invalid_tenant');

  const own = await desktopLogin(env, outsider.id);
  const switched = await call(env, '/api/auth/switch-tenant', { body: { refresh_token: own.body.refresh_token, tenant_id: orgId } });
  assert.equal(switched.status, 403);
  assert.equal((await call(env, `/api/orgs/${orgId}/members`, { cookie })).status, 403);
});

test('a removed member can no longer refresh into the organization but can switch back to personal', async () => {
  const env = environment();
  const root = addUser(env, 'root', 'root@visiongo.app', 'super_admin');
  const boss = addUser(env, 'boss', 'boss@factory.example');
  const alice = addUser(env, 'alice', 'alice@factory.example');
  const orgId = await enterprise(env, root.id);
  await desktopLogin(env, boss.id);
  const bossCookie = await cookieFor(boss.id);
  assert.equal((await call(env, `/api/orgs/${orgId}/members`, { cookie: bossCookie, body: { email: 'Alice@Factory.example', role: 'member' } })).status, 201);

  const session = await desktopLogin(env, alice.id, orgId);
  assert.equal(session.status, 200);
  assert.equal((await verifiedClaims(session.body.access_token)).role, 'member');
  const refreshed = await call(env, '/api/auth/refresh', { body: { refresh_token: session.body.refresh_token } });
  assert.equal(refreshed.status, 200);
  assert.equal(refreshed.body.tenant_id, orgId);
  assert.equal(refreshed.body.refresh_token, undefined);

  assert.equal((await call(env, `/api/orgs/${orgId}/members/remove`, { cookie: bossCookie, body: { email: 'alice@factory.example' } })).status, 200);
  const revoked = await call(env, '/api/auth/refresh', { body: { refresh_token: session.body.refresh_token } });
  assert.equal(revoked.status, 403);
  assert.equal(revoked.body.error, 'tenant_access_revoked');

  const back = await call(env, '/api/auth/switch-tenant', { body: { refresh_token: session.body.refresh_token, tenant_id: alice.tenant } });
  assert.equal(back.status, 200);
  assert.equal(back.body.tenant_id, alice.tenant);
  assert.deepEqual(back.body.tenants.map(item => item.tenant_id), [alice.tenant]);
  const events = env.DB.sqlite.prepare('SELECT action, target_email FROM organization_events WHERE org_id = ? ORDER BY created_at, rowid').all(orgId);
  assert.deepEqual(events.map(row => row.action), ['organization.created', 'member.invited', 'member.removed']);
});

test('refresh tokens issued before organizations stay bound to the personal organization', async () => {
  const env = environment();
  const user = addUser(env, 'old', 'old@example.com');
  const legacy = await auth.createDesktopRefreshToken({ id: user.id }, 'test-session-secret', undefined);
  const refreshed = await call(env, '/api/auth/refresh', { body: { refresh_token: legacy } });
  assert.equal(refreshed.status, 200);
  assert.equal(refreshed.body.tenant_id, user.tenant);
});

test('organization administration keeps an administrator and stays inside its permissions', async () => {
  const env = environment();
  const root = addUser(env, 'root', 'root@visiongo.app', 'super_admin');
  const boss = addUser(env, 'boss', 'boss@factory.example');
  const bob = addUser(env, 'bob', 'bob@factory.example');
  const orgId = await enterprise(env, root.id);
  await desktopLogin(env, boss.id);
  const bossCookie = await cookieFor(boss.id);
  const bobCookie = await cookieFor(bob.id);

  assert.equal((await call(env, '/api/orgs', { cookie: bobCookie, body: { name: 'x', admin_email: 'bob@factory.example' } })).status, 403);
  assert.equal((await call(env, `/api/orgs/${orgId}/members/role`, { cookie: bossCookie, body: { email: 'boss@factory.example', role: 'member' } })).status, 409);
  assert.equal((await call(env, `/api/orgs/${orgId}/members/remove`, { cookie: bossCookie, body: { email: 'boss@factory.example' } })).status, 409);

  await call(env, `/api/orgs/${orgId}/members`, { cookie: bossCookie, body: { email: 'bob@factory.example' } });
  assert.equal((await call(env, `/api/orgs/${orgId}/members`, { cookie: bossCookie, body: { email: 'bob@factory.example' } })).status, 409);
  await desktopLogin(env, bob.id);
  assert.equal((await call(env, `/api/orgs/${orgId}/members`, { cookie: bobCookie, body: { email: 'mallory@example.com' } })).status, 403);

  assert.equal((await call(env, `/api/orgs/${boss.tenant}/members`, { cookie: bossCookie, body: { email: 'bob@factory.example' } })).status, 400);
  assert.equal((await call(env, `/api/orgs/${orgId}/status`, { cookie: bossCookie, body: { status: 'suspended' } })).status, 403);
  assert.equal((await call(env, `/api/orgs/${orgId}/status`, { cookie: await cookieFor(root.id), body: { status: 'suspended' } })).status, 200);
  assert.deepEqual((await desktopLogin(env, bob.id)).body.tenants.map(item => item.tenant_id), [bob.tenant]);

  const members = await call(env, `/api/orgs/${orgId}/members`, { cookie: bossCookie });
  assert.deepEqual(members.body.members.map(item => [item.email, item.role, item.status]),
                   [['boss@factory.example', 'admin', 'active'], ['bob@factory.example', 'member', 'active']]);
});

test('cross-site writes to organization endpoints are rejected', async () => {
  const env = environment();
  const root = addUser(env, 'root', 'root@visiongo.app', 'super_admin');
  const response = await worker.fetch(new Request('https://visiongo.app/api/orgs', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example', Cookie: await cookieFor(root.id) },
    body: JSON.stringify({ name: 'x', admin_email: 'a@b.example' }) }), env, { waitUntil() {} });
  assert.equal(response.status, 403);
  assert.equal(env.DB.sqlite.prepare("SELECT count(*) AS n FROM organizations WHERE type = 'enterprise'").get().n, 0);
});

test('token responses only use fields of the SDK identity contract', async (t) => {
  const golden = '../SDK/tests/golden/identity/token_response.json';
  if (!fs.existsSync(golden)) { t.skip('VisionAgent SDK is not checked out next to this repository'); return; }
  const contract = JSON.parse(fs.readFileSync(golden, 'utf8'));
  const env = environment();
  const user = addUser(env, 'u', 'u@example.com');
  const response = await desktopLogin(env, user.id);
  for (const key of Object.keys(response.body)) assert.ok(key in contract, `unexpected field ${key}`);
  for (const key of Object.keys(response.body.tenants[0])) assert.ok(key in contract.tenants[0], `unexpected tenant field ${key}`);
});

test('VisionCloud organizations import as invitations that activate on the next sign-in', async () => {
  const env = environment();
  const boss = addUser(env, 'boss', 'boss@factory.example');
  const exported = {
    organizations: [{ id: 'org_1a2b3c4d', name: "O'Brien 工厂", status: 'active' }, { id: 'org_dead', name: '已停用', status: 'suspended' }],
    members: [{ org_id: 'org_1a2b3c4d', email: 'Boss@Factory.example', role: 'admin' }],
    admins_without_email: [{ org_id: 'org_dead', name: '已停用', admin_username: 'admin_org_dead' }],
  };
  const { sql, summary } = buildImportSql(exported, '2026-10-15T00:00:00Z');
  assert.deepEqual([summary.organizations, summary.members, summary.admins, summary.withoutAdmin.length], [2, 1, 1, 1]);
  env.DB.sqlite.exec(sql);
  env.DB.sqlite.exec(sql); // re-running changes nothing
  assert.equal(env.DB.sqlite.prepare("SELECT count(*) AS n FROM organizations WHERE type = 'enterprise'").get().n, 2);
  assert.equal(env.DB.sqlite.prepare('SELECT name FROM organizations WHERE id = ?').get('org_1a2b3c4d').name, "O'Brien 工厂");

  const session = await desktopLogin(env, boss.id, 'org_1a2b3c4d');
  assert.equal(session.status, 200);
  assert.equal((await verifiedClaims(session.body.access_token)).role, 'org_admin');
  assert.ok(!session.body.tenants.some(item => item.tenant_id === 'org_dead'));

  assert.throws(() => buildImportSql({ organizations: [{ id: 'vg_tenant_x', name: 'x' }] }));
  assert.throws(() => buildImportSql({ organizations: [], members: [{ org_id: 'org_x', email: 'a@b.example', role: 'admin' }] }));
});
