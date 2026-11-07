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
  assert.deepEqual(claims.aud, ['visioncloud', 'visionweb']);
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
  assert.notEqual(refreshed.body.refresh_token, session.body.refresh_token);  // rotated (identity 4)

  assert.equal((await call(env, `/api/orgs/${orgId}/members/remove`, { cookie: bossCookie, body: { email: 'alice@factory.example' } })).status, 200);
  const revoked = await call(env, '/api/auth/refresh', { body: { refresh_token: refreshed.body.refresh_token } });
  assert.equal(revoked.status, 403);
  assert.equal(revoked.body.error, 'tenant_access_revoked');

  // The refused refresh did not use the token up: it still switches back to the personal organization.
  const back = await call(env, '/api/auth/switch-tenant', { body: { refresh_token: refreshed.body.refresh_token, tenant_id: alice.tenant } });
  assert.equal(back.status, 200);
  assert.equal(back.body.tenant_id, alice.tenant);
  assert.deepEqual(back.body.tenants.map(item => item.tenant_id), [alice.tenant]);
  const events = env.DB.sqlite.prepare('SELECT action, target_email FROM organization_events WHERE org_id = ? ORDER BY created_at, rowid').all(orgId);
  assert.deepEqual(events.map(row => row.action), ['organization.created', 'member.invited', 'member.removed']);
});

test('a refresh token that was never recorded is refused, even when correctly signed', async () => {
  const env = environment();
  const user = addUser(env, 'old', 'old@example.com');
  const unrecorded = await auth.createDesktopRefreshToken({ id: user.id }, 'test-session-secret', undefined);
  const refreshed = await call(env, '/api/auth/refresh', { body: { refresh_token: unrecorded } });
  assert.deepEqual([refreshed.status, refreshed.body.error], [401, 'invalid_grant']);
});

test('refresh tokens rotate; a replayed one ends that sign-in but not the others', async () => {
  const env = environment();
  const user = addUser(env, 'rot', 'rot@example.com');
  const first = await desktopLogin(env, user.id);
  const other = await desktopLogin(env, user.id);  // a second computer
  const rows = () => env.DB.sqlite.prepare('SELECT family_id, used_at, revoked_at FROM desktop_refresh_tokens').all();
  assert.equal(new Set(rows().map(row => row.family_id)).size, 2);

  const second = await call(env, '/api/auth/refresh', { body: { refresh_token: first.body.refresh_token } });
  assert.equal(second.status, 200);
  const third = await call(env, '/api/auth/refresh', { body: { refresh_token: second.body.refresh_token } });
  assert.equal(third.status, 200);

  // The first token is two rotations old: a copy of it is being replayed.
  const replay = await call(env, '/api/auth/refresh', { body: { refresh_token: first.body.refresh_token } });
  assert.deepEqual([replay.status, replay.body.error], [401, 'refresh_token_reused']);
  assert.equal((await call(env, '/api/auth/refresh', { body: { refresh_token: third.body.refresh_token } })).status, 401);
  assert.equal((await call(env, '/api/auth/refresh', { body: { refresh_token: other.body.refresh_token } })).status, 200);
});

test('a refresh whose answer was lost is repeated within the grace period', async () => {
  const env = environment();
  const user = addUser(env, 'lost', 'lost@example.com');
  const login = await desktopLogin(env, user.id);
  const lost = await call(env, '/api/auth/refresh', { body: { refresh_token: login.body.refresh_token } });
  assert.equal(lost.status, 200);
  // The client never saw `lost` and presents its token again.
  const again = await call(env, '/api/auth/refresh', { body: { refresh_token: login.body.refresh_token } });
  assert.equal(again.status, 200);
  assert.equal((await call(env, '/api/auth/refresh', { body: { refresh_token: lost.body.refresh_token } })).status, 401);
  assert.equal((await call(env, '/api/auth/refresh', { body: { refresh_token: again.body.refresh_token } })).status, 200);

  // Past the grace period the same replay ends the sign-in.
  const env2 = environment();
  const late = addUser(env2, 'late', 'late@example.com');
  const login2 = await desktopLogin(env2, late.id);
  assert.equal((await call(env2, '/api/auth/refresh', { body: { refresh_token: login2.body.refresh_token } })).status, 200);
  env2.DB.sqlite.prepare('UPDATE desktop_refresh_tokens SET used_at = ? WHERE used_at IS NOT NULL').run('2026-01-01T00:00:00.000Z');
  assert.equal((await call(env2, '/api/auth/refresh', { body: { refresh_token: login2.body.refresh_token } })).body.error, 'refresh_token_reused');
});

test('desktop sign-ins are revoked from the desktop and from the account page', async () => {
  const env = environment();
  const user = addUser(env, 'dev', 'dev@example.com');
  const cookie = await cookieFor(user.id);
  const code = async name => {
    const issued = await call(env, '/api/auth/desktop-code', { cookie, body: { code_challenge: challenge, code_challenge_method: 'S256' } });
    return call(env, '/api/auth/token', { body: { grant_type: 'authorization_code', code: issued.body.code, code_verifier: verifier, device_name: name } });
  };
  const office = await code('OFFICE-PC');
  const line = await code(' LINE-3\u0007 ');
  const lab = await code('LAB');

  const listed = await call(env, '/api/account/desktop-sessions', { cookie });
  assert.deepEqual(listed.body.sessions.map(item => item.device_name).sort(), ['LAB', 'LINE-3', 'OFFICE-PC']);
  assert.equal((await call(env, '/api/account/desktop-sessions')).status, 401);

  // Sign-out on one computer.
  const device = await call(env, '/api/auth/revoke', { body: { refresh_token: office.body.refresh_token, scope: 'device' } });
  assert.deepEqual([device.status, device.body.revoked], [200, 1]);
  assert.equal((await call(env, '/api/auth/refresh', { body: { refresh_token: office.body.refresh_token } })).status, 401);

  // The account page ends another; someone else's sign-in is not found.
  const lineFamily = listed.body.sessions.find(item => item.device_name === 'LINE-3').family_id;
  const stranger = addUser(env, 'stranger', 'stranger@example.com');
  assert.equal((await call(env, '/api/account/desktop-sessions/revoke', { cookie: await cookieFor(stranger.id), body: { family_id: lineFamily } })).status, 404);
  assert.equal((await call(env, '/api/account/desktop-sessions/revoke', { cookie, body: { family_id: lineFamily } })).body.revoked, 1);
  assert.equal((await call(env, '/api/auth/refresh', { body: { refresh_token: line.body.refresh_token } })).status, 401);
  assert.equal((await call(env, '/api/auth/refresh', { body: { refresh_token: lab.body.refresh_token } })).status, 200);

  // Everywhere.
  const again = await code('LAB-2');
  assert.equal((await call(env, '/api/auth/revoke', { body: { refresh_token: again.body.refresh_token, scope: 'all' } })).body.revoked, 2);
  assert.deepEqual((await call(env, '/api/account/desktop-sessions', { cookie })).body.sessions, []);
  assert.equal((await call(env, '/api/auth/revoke', { body: { refresh_token: 'vg_rf_forged', scope: 'all' } })).status, 401);
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
  env.CLOUD_BASE_URL = 'https://api.visiongo.com.cn';
  const user = addUser(env, 'u', 'u@example.com');
  const response = await desktopLogin(env, user.id);
  for (const key of Object.keys(response.body)) assert.ok(key in contract, `unexpected field ${key}`);
  for (const key of Object.keys(response.body.tenants[0])) assert.ok(key in contract.tenants[0], `unexpected tenant field ${key}`);
});

test('the edition names the VisionCloud its clients use only when configured', async () => {
  const env = environment();
  const user = addUser(env, 'c', 'c@example.com');
  assert.equal((await desktopLogin(env, user.id)).body.cloud_base_url, undefined);
  env.CLOUD_BASE_URL = 'https://api.visiongo.com.cn';
  assert.equal((await desktopLogin(env, user.id)).body.cloud_base_url, 'https://api.visiongo.com.cn');
  env.CLOUD_BASE_URL = 'http://api.visiongo.com.cn/v1';
  assert.equal((await desktopLogin(env, user.id)).body.cloud_base_url, undefined);
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

// ---------------------------------------------------------------------------
// Organization credits read from VisionCloud (SDK schemas/credits.json).
// ---------------------------------------------------------------------------

const creditsGolden = name => {
  const file = `../SDK/tests/golden/credits/${name}`;
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
};

/** Runs action with fetch answering VisionCloud requests via cloud(url, init); records the requests. */
async function withCloud(cloud, action) {
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), authorization: new Headers(init.headers).get('Authorization') });
    return cloud(String(url), init);
  };
  try { return { result: await action(), requests }; } finally { globalThis.fetch = original; }
}

const cloudJson = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function creditsSetup() {
  const env = { ...environment(), CLOUD_API_URL: 'https://cloud.example.test/' };
  const root = addUser(env, 'root', 'root@visiongo.app', 'super_admin');
  const boss = addUser(env, 'boss', 'boss@factory.example');
  const bob = addUser(env, 'bob', 'bob@factory.example');
  const eve = addUser(env, 'eve', 'eve@elsewhere.example');
  const orgId = await enterprise(env, root.id);
  await call(env, '/api/orgs', { cookie: await cookieFor(boss.id) });  // accept the admin invitation
  await call(env, `/api/orgs/${orgId}/members`, { cookie: await cookieFor(boss.id), body: { email: 'bob@factory.example', role: 'member' } });
  await call(env, '/api/orgs', { cookie: await cookieFor(bob.id) });
  return { env, root, boss, bob, eve, orgId };
}

test('organization credits are unavailable without CLOUD_API_URL', async () => {
  const env = environment();
  const boss = addUser(env, 'boss', 'boss@factory.example');
  const cookie = await cookieFor(boss.id);
  assert.equal((await call(env, '/api/orgs', { cookie })).body.credits_available, false);
  const response = await call(env, `/api/orgs/${boss.tenant}/credits`, { cookie });
  assert.deepEqual([response.status, response.body.error], [404, 'credits_unavailable']);
});

test('administrators read the account with a token for that organization; members only their usage', async () => {
  const { env, boss, bob, eve, orgId } = await creditsSetup();
  const account = creditsGolden('account.json') || { tenant_id: orgId, opened: false, notices: [] };
  const usage = creditsGolden('usage_summary.json') || { totals: {}, by_user: [], by_endpoint: [] };
  const cloud = url => (url.includes('/usage') ? cloudJson({ ...usage, by_user: [{ ...usage.by_user[0], user_id: bob.id }] })
                                               : url.includes('/transactions') ? cloudJson({ items: [] }) : cloudJson(account));

  const admin = await withCloud(cloud, async () => [
    await call(env, `/api/orgs/${orgId}/credits`, { cookie: await cookieFor(boss.id) }),
    await call(env, `/api/orgs/${orgId}/credits/transactions?type=consumption&limit=5&evil=1`, { cookie: await cookieFor(boss.id) }),
  ]);
  const [credits, ledger] = admin.result;
  assert.equal(credits.status, 200);
  assert.equal(credits.body.viewer_is_admin, true);
  assert.equal(admin.requests[0].url, `https://cloud.example.test/v1/accounts/${orgId}`);
  assert.equal(admin.requests[1].url, `https://cloud.example.test/v1/accounts/${orgId}/transactions?type=consumption&limit=5`);
  const claims = await verifiedClaims(admin.requests[0].authorization.replace('Bearer ', ''));
  assert.deepEqual([claims.sub, claims.tenant_id, claims.role], [boss.id, orgId, 'org_admin']);
  assert.ok(claims.aud.includes('visioncloud'));
  assert.equal(ledger.status, 200);
  if (creditsGolden('account.json')) {
    for (const key of Object.keys(credits.body)) assert.ok(key in account || key === 'viewer_is_admin', `unexpected field ${key}`);
  }

  const member = await withCloud(cloud, async () => [
    await call(env, `/api/orgs/${orgId}/credits`, { cookie: await cookieFor(bob.id) }),
    await call(env, `/api/orgs/${orgId}/credits/usage?from=1&to=2`, { cookie: await cookieFor(bob.id) }),
  ]);
  const [denied, mine] = member.result;
  assert.equal(denied.status, 403);
  assert.equal(member.requests.length, 1);  // the account was never requested
  assert.equal(mine.status, 200);
  assert.equal(mine.body.viewer_is_admin, false);
  assert.deepEqual(mine.body.users[bob.id], { name: 'bob', email: 'bob@factory.example' });
  assert.equal((await verifiedClaims(member.requests[0].authorization.replace('Bearer ', ''))).role, 'member');

  const outsider = await withCloud(cloud, async () => call(env, `/api/orgs/${orgId}/credits/usage`, { cookie: await cookieFor(eve.id) }));
  assert.equal(outsider.result.status, 403);
  assert.equal(outsider.requests.length, 0);
});

test('platform administrators read any organization; VisionCloud errors and outages are reported', async () => {
  const { env, root, orgId } = await creditsSetup();
  const ok = await withCloud(() => cloudJson({ tenant_id: orgId, opened: false, notices: [] }),
                             async () => call(env, `/api/orgs/${orgId}/credits`, { cookie: await cookieFor(root.id) }));
  assert.equal(ok.result.status, 200);
  assert.equal((await verifiedClaims(ok.requests[0].authorization.replace('Bearer ', ''))).role, 'super_admin');

  const refused = await withCloud(() => cloudJson({ error: 'tenant_access_denied', error_description: 'x' }, 403),
                                  async () => call(env, `/api/orgs/${orgId}/credits`, { cookie: await cookieFor(root.id) }));
  assert.deepEqual([refused.result.status, refused.result.body.error], [403, 'tenant_access_denied']);
  for (const cloud of [() => cloudJson({ detail: 'boom' }, 500), () => { throw new TypeError('fetch failed'); }]) {
    const down = await withCloud(cloud, async () => call(env, `/api/orgs/${orgId}/credits`, { cookie: await cookieFor(root.id) }));
    assert.deepEqual([down.result.status, down.result.body.error], [502, 'cloud_unavailable']);
  }
});

test('data authorization for VisionCloud AI is off by default and set by the organization administrators', async () => {
  const env = environment();
  const root = addUser(env, 'root', 'root@visiongo.app', 'super_admin');
  const boss = addUser(env, 'boss', 'Boss@Factory.example');
  const worker = addUser(env, 'worker', 'worker@factory.example');
  const orgId = await enterprise(env, root.id);
  const bossCookie = await cookieFor(boss.id);
  await desktopLogin(env, boss.id);  // accepts the invitation
  assert.equal((await call(env, `/api/orgs/${orgId}/members`, { cookie: bossCookie, body: { email: 'worker@factory.example', role: 'member' } })).status, 201);
  await desktopLogin(env, worker.id);

  // Off for a new organization: the token and the token response say so.
  const before = await desktopLogin(env, worker.id, orgId);
  assert.equal(before.body.ai_data_authorized, false);
  assert.equal((await verifiedClaims(before.body.access_token)).ai_data_authorized, false);

  // Members cannot change it; the value must be a boolean.
  const workerCookie = await cookieFor(worker.id);
  assert.equal((await call(env, `/api/orgs/${orgId}/ai-data-authorization`, { cookie: workerCookie, body: { authorized: true } })).status, 403);
  assert.equal((await call(env, `/api/orgs/${orgId}/ai-data-authorization`, { cookie: bossCookie, body: { authorized: 'yes' } })).status, 400);

  const turnedOn = await call(env, `/api/orgs/${orgId}/ai-data-authorization`, { cookie: bossCookie, body: { authorized: true } });
  assert.equal(turnedOn.status, 200);
  assert.equal(turnedOn.body.organization.ai_data_authorized, 1);
  const shown = await call(env, `/api/orgs/${orgId}/members`, { cookie: bossCookie });
  assert.equal(shown.body.organization.ai_data_authorized, 1);
  const after = await desktopLogin(env, worker.id, orgId);
  assert.equal(after.body.ai_data_authorized, true);
  assert.equal((await verifiedClaims(after.body.access_token)).ai_data_authorized, true);
  const event = env.DB.sqlite.prepare("SELECT actor_user_id, detail FROM organization_events WHERE action = 'organization.ai_data_authorization'").get();
  assert.deepEqual({ ...event }, { actor_user_id: boss.id, detail: 'on' });

  // A personal organization's owner decides for it too.
  const personal = await call(env, `/api/orgs/${worker.tenant}/ai-data-authorization`, { cookie: workerCookie, body: { authorized: true } });
  assert.equal(personal.status, 200);
});

test('existing organizations are not authorized after the migration', () => {
  const db = database(migrations.filter(file => file < '0007'));
  db.sqlite.prepare("INSERT INTO organizations (id, name, type, status, created_at) VALUES ('org_old', '旧组织', 'enterprise', 'active', '2026-01-01')").run();
  db.sqlite.exec(fs.readFileSync('migrations/0007_ai_data_authorization.sql', 'utf8'));
  assert.equal(db.sqlite.prepare('SELECT ai_data_authorized FROM organizations').get().ai_data_authorized, 0);
});

test('platform administrators publish release manifests that desktop clients read per platform', async () => {
  const env = environment();
  const root = addUser(env, 'root', 'root@visiongo.app', 'super_admin');
  const member = addUser(env, 'member', 'member@example.com');
  const release = { product: 'edge', platform: 'windows-x64', latest: '6.2.0', min_supported: '6.1.0',
                    url: 'https://visiongo.com.cn/downloads/visionedge', sha256: 'A'.repeat(64) };
  assert.equal((await call(env, '/api/releases/edge?platform=windows-x64')).status, 404);
  assert.equal((await call(env, '/api/admin/releases', { body: release })).status, 401);
  assert.equal((await call(env, '/api/admin/releases', { cookie: await cookieFor(member.id), body: release })).status, 403);
  const rootCookie = await cookieFor(root.id);
  for (const bad of [{ ...release, product: 'visionedge' }, { ...release, latest: 'v6' }, { ...release, min_supported: '7.0.0' },
                     { ...release, url: 'http://example.com/edge' }, { ...release, sha256: 'xyz' }]) {
    assert.equal((await call(env, '/api/admin/releases', { cookie: rootCookie, body: bad })).status, 400, JSON.stringify(bad));
  }
  const published = await call(env, '/api/admin/releases', { cookie: rootCookie, body: release });
  assert.equal(published.status, 200);
  const read = await call(env, '/api/releases/edge?platform=windows-x64&channel=stable');
  assert.equal(read.status, 200);
  // SDK ReleaseManifest: snake_case wire names, the optional fields only when set.
  assert.deepEqual(Object.keys(read.body).sort(), ['channel', 'latest', 'min_supported', 'platform', 'product', 'published_at', 'sha256', 'url']);
  assert.equal(read.body.sha256, 'a'.repeat(64));
  assert.equal((await call(env, '/api/releases/edge?platform=linux-x64')).status, 404);
  assert.equal((await call(env, '/api/releases/edge')).status, 400);
  await call(env, '/api/admin/releases', { cookie: rootCookie, body: { ...release, latest: '6.3.0', url: '' } });
  const updated = await call(env, '/api/releases/edge?platform=windows-x64');
  assert.equal(updated.body.latest, '6.3.0');
  assert.equal(updated.body.url, undefined);
  const listed = await call(env, '/api/admin/releases', { cookie: rootCookie });
  assert.equal(listed.body.releases.length, 1);
  assert.equal(listed.body.releases[0].updated_by, root.id);
});

test('the key set publishes the current signing key and the earlier ones of a rotation', async () => {
  const env = { ...environment(), DESKTOP_TOKEN_KEY_ID: 'website-desktop-2',
                DESKTOP_TOKEN_PUBLIC_KEYS: JSON.stringify([{ kty: 'RSA', kid: 'website-desktop-1', n: 'abc', e: 'AQAB' },
                                                          { kty: 'EC', kid: 'bad' }]) };
  const set = await call(env, '/.well-known/jwks.json');
  assert.equal(set.status, 200);
  assert.deepEqual(set.body.keys.map(key => key.kid), ['website-desktop-2', 'website-desktop-1']);
  assert.ok(set.body.keys.every(key => !('d' in key) && key.alg === 'RS256'));
  const publicKey = await crypto.subtle.importKey('jwk', { kty: 'RSA', n: set.body.keys[0].n, e: set.body.keys[0].e },
                                                  { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const root = addUser(env, 'root', 'root@visiongo.app', 'super_admin');
  const token = (await desktopLogin(env, root.id)).body.access_token;
  const [header, payload, signature] = token.split('.');
  assert.equal(JSON.parse(base64UrlDecode(header).toString('utf8')).kid, 'website-desktop-2');
  assert.ok(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, base64UrlDecode(signature),
                                       new TextEncoder().encode(`${header}.${payload}`)));
});

test('error answers carry a registered code and keep the fields they had', async () => {
  const env = environment();
  const missing = await call(env, '/api/no-such-route');
  assert.deepEqual([missing.status, missing.body.code, missing.body.error], [404, 'NOT_FOUND', 'API route not found']);
  const unauthorized = await call(env, '/api/orgs');
  assert.deepEqual([unauthorized.body.code, unauthorized.body.message], ['UNAUTHORIZED', 'Unauthorized']);
  // Identity errors keep the OAuth shape and add the code.
  const token = await call(env, '/api/auth/token', { body: { grant_type: 'authorization_code', code: 'x', code_verifier: verifier } });
  assert.equal(typeof token.body.error, 'string');
  assert.equal(token.body.message, token.body.error_description);
  assert.ok(['INVALID_REQUEST', 'UNAUTHORIZED'].includes(token.body.code));
});

test('a change of the AI data authorization is reported to VisionCloud with a matching signed token', async () => {
  const { env, boss, orgId } = await creditsSetup();
  const cookie = await cookieFor(boss.id);
  const sent = [];
  const accept = (url, init) => {
    sent.push({ url, body: JSON.parse(init.body) });
    return cloudJson({ tenant_id: orgId, authorized: false, applied: true, retired_cards: 0, retired_skills: 0, withdrawn_shared_copies: 0 });
  };
  const off = await withCloud(accept, async () => call(env, `/api/orgs/${orgId}/ai-data-authorization`, { cookie, body: { authorized: false } }));
  assert.equal(off.result.status, 200);
  assert.equal(off.result.body.organization.cloud_synced, true);
  assert.equal(sent[0].url, `https://cloud.example.test/v1/accounts/${orgId}/ai-data-authorization`);
  const saved = env.DB.sqlite.prepare('SELECT ai_data_authorized_at FROM organizations WHERE id = ?').get(orgId).ai_data_authorized_at;
  assert.deepEqual(sent[0].body, { authorized: false, changed_at: Date.parse(saved) });
  const claims = await verifiedClaims(off.requests[0].authorization.replace('Bearer ', ''));
  assert.deepEqual([claims.sub, claims.tenant_id, claims.role, claims.ai_data_authorized], [boss.id, orgId, 'org_admin', false]);
  if (fs.existsSync('../SDK/tests/golden/credits/ai_data_authorization_request.json')) {
    const golden = JSON.parse(fs.readFileSync('../SDK/tests/golden/credits/ai_data_authorization_request.json', 'utf8'));
    assert.deepEqual(Object.keys(sent[0].body).sort(), Object.keys(golden).sort());
  }
});

test('an unconfirmed report is retried when an administrator opens the organization', async () => {
  const { env, boss, orgId } = await creditsSetup();
  const cookie = await cookieFor(boss.id);
  const down = await withCloud(() => { throw new TypeError('fetch failed'); },
                               async () => call(env, `/api/orgs/${orgId}/ai-data-authorization`, { cookie, body: { authorized: true } }));
  assert.equal(down.result.status, 200);  // the setting is saved anyway
  assert.equal(down.result.body.organization.cloud_synced, false);
  assert.equal(down.requests.length, 3);
  const refused = await withCloud(() => cloudJson({ error: 'tenant_access_denied' }, 403),
                                  async () => call(env, `/api/orgs/${orgId}/members`, { cookie }));
  assert.deepEqual([refused.result.body.organization.cloud_synced, refused.requests.length], [false, 1]);
  const back = await withCloud(() => cloudJson({ tenant_id: orgId, authorized: true, applied: true, retired_cards: 0, retired_skills: 0, withdrawn_shared_copies: 0 }),
                               async () => call(env, `/api/orgs/${orgId}/members`, { cookie }));
  assert.equal(back.result.body.organization.cloud_synced, true);
  const again = await withCloud(() => { throw new Error('not asked again'); }, async () => call(env, `/api/orgs/${orgId}/members`, { cookie }));
  assert.deepEqual([again.result.body.organization.cloud_synced, again.requests.length], [true, 0]);
});

test('credits use the VisionCloud the desktops are given when no server address is set', async () => {
  const { env, boss, orgId } = await creditsSetup();
  delete env.CLOUD_API_URL;
  env.CLOUD_BASE_URL = 'https://api.example.test';
  const read = await withCloud(() => cloudJson({ tenant_id: orgId, opened: false, notices: [] }),
                               async () => call(env, `/api/orgs/${orgId}/credits`, { cookie: await cookieFor(boss.id) }));
  assert.equal(read.result.status, 200);
  assert.equal(read.requests[0].url, `https://api.example.test/v1/accounts/${orgId}`);
});
