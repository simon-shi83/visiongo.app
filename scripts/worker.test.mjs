import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const { default: worker } = await vite.ssrLoadModule('/worker/index.ts');
const auth = await vite.ssrLoadModule('/worker/auth.ts');
const oauth = await vite.ssrLoadModule('/worker/githubOAuth.ts');
const { dispatchInquiries } = await vite.ssrLoadModule('/worker/contacts.ts');
const { GitHubReleaseProvider, GitHubDownloadProvider, inferPlatform, inferArch } = await vite.ssrLoadModule('/worker/github.ts');
const databases = [];
after(async () => { for (const db of databases) db.close(); await vite.close(); });
function database() {
  const sqlite = new DatabaseSync(':memory:');
  databases.push(sqlite);
  for (const file of fs.readdirSync('migrations').filter(file => file.endsWith('.sql')).sort()) sqlite.exec(fs.readFileSync(`migrations/${file}`, 'utf8'));
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
function environment() { return { DB: database(), SESSION_SECRET: 'test-session-secret', ASSETS: { fetch: async () => new Response('Not Found', { status: 404 }) } }; }
async function request(path, body, env = environment(), headers = {}) {
  const pending = [];
  const response = await worker.fetch(new Request(`https://visiongo.app${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) }), env, { waitUntil(task) { pending.push(task); } });
  await Promise.all(pending);
  return response;
}
async function mockFetch(fn, action) { const original = globalThis.fetch; globalThis.fetch = fn; try { return await action(); } finally { globalThis.fetch = original; } }
const form = () => ({ name: 'Test Engineer', email: 'engineer@example.com', product: 'visionstudio', message: 'Evaluate matching on representative samples.', locale: 'en', source: '/products/visionstudio', submissionId: crypto.randomUUID() });

test('inquiries are durable, retain product and source, and retries do not duplicate rows', async () => {
  const env = environment(); const body = form();
  const first = await request('/api/contact', body, env); assert.equal(first.status, 201);
  const receipt = await first.json();
  const second = await request('/api/contact', body, env); assert.equal(second.status, 201); assert.equal((await second.json()).referenceId, receipt.referenceId);
  const rows = env.DB.sqlite.prepare('SELECT * FROM contact_inquiries').all(); assert.equal(rows.length, 1);
  assert.equal(rows[0].product, 'visionstudio'); assert.equal(rows[0].source, body.source); assert.equal(rows[0].notification_status, 'pending');
});
test('inquiry validation, spam trap and storage failures never create a false customer receipt', async () => {
  assert.equal((await request('/api/contact', { ...form(), email: 'invalid' })).status, 400);
  const env = environment(); assert.equal((await request('/api/contact', { ...form(), websiteUrl: 'bot' }, env)).status, 200);
  assert.equal(env.DB.sqlite.prepare('SELECT count(*) AS n FROM contact_inquiries').get().n, 0);
  assert.equal((await request('/api/contact', form(), { ...env, DB: undefined })).status, 503);
  env.DB.sqlite.exec('DROP TABLE contact_inquiries'); assert.equal((await request('/api/contact', form(), env)).status, 503);
});
test('notification failures stay in the outbox and are retried with an idempotency key', async () => {
  const env = environment(); const receipt = await (await request('/api/contact', form(), env)).json(); env.RESEND_API_KEY = 'test-key';
  const keys = [];
  await mockFetch(async (_url, options) => { keys.push(options.headers['Idempotency-Key']); return new Response('{}', { status: 503 }); }, () => dispatchInquiries(env));
  let row = env.DB.sqlite.prepare('SELECT * FROM contact_inquiries').get(); assert.equal(row.notification_status, 'pending'); assert.equal(row.notification_attempts, 1);
  env.DB.sqlite.exec('UPDATE contact_inquiries SET next_attempt_at = 0');
  await mockFetch(async (_url, options) => { keys.push(options.headers['Idempotency-Key']); return Response.json({ id: 'email-id' }); }, () => dispatchInquiries(env));
  row = env.DB.sqlite.prepare('SELECT * FROM contact_inquiries').get(); assert.equal(row.notification_status, 'sent'); assert.deepEqual(keys, [receipt.referenceId, receipt.referenceId]);
});
test('missing or failing email service reports failure without code disclosure', async () => {
  const env = environment(); const response = await request('/api/auth/email/send-code', { email: 'new@example.com' }, env);
  assert.equal(response.status, 503); assert.equal('devCode' in await response.json(), false);
  assert.equal(env.DB.sqlite.prepare('SELECT count(*) AS n FROM email_verification_codes').get().n, 0);
  env.RESEND_API_KEY = 'test-key';
  await mockFetch(async () => new Response('{}', { status: 500 }), async () => {
    assert.equal((await request('/api/auth/email/send-code', { email: 'other@example.com' }, env)).status, 503);
  });
});
test('verification codes are delivered without disclosure and consumed only once', async () => {
  const env = environment(); env.RESEND_API_KEY = 'test-key';
  await mockFetch(async () => Response.json({ id: 'email-id' }), async () => {
    const response = await request('/api/auth/email/send-code', { email: 'new@example.com' }, env); assert.equal(response.status, 200); assert.equal('devCode' in await response.json(), false);
  });
  const record = env.DB.sqlite.prepare('SELECT * FROM email_verification_codes').get();
  const result = await Promise.all([auth.verifyAndConsumeCode(env, record.email, record.code), auth.verifyAndConsumeCode(env, record.email, record.code)]);
  assert.deepEqual(result, [true, false]);
});
test('database failures do not create ephemeral identities; fake GitHub login is gone', async () => {
  const env = { SESSION_SECRET: 'test-secret' };
  await assert.rejects(auth.getOrCreateUser(env, { sub: 'subject', email: 'user@example.com' }));
  await assert.rejects(auth.getOrCreateGitHubUser(env, { id: 42, login: 'test-user', email: 'user@example.com' }));
  await assert.rejects(auth.registerUserWithEmail(env, 'user@example.com', 'password'));
  assert.equal((await request('/api/auth/github/direct', { email: 'user@example.com' })).status, 404);
});
test('email registration and password login persist the same identity', async () => {
  const env = environment();
  await auth.saveVerificationCode(env, 'user@example.com', '123456');
  const registration = await request('/api/auth/email/register', { email: 'user@example.com', code: '123456', password: 'long-password' }, env);
  assert.equal(registration.status, 200); const user = (await registration.json()).user;
  const login = await request('/api/auth/email/login', { email: 'user@example.com', password: 'long-password' }, env);
  assert.equal(login.status, 200); assert.equal((await login.json()).user.id, user.id);
  assert.equal((await request('/api/auth/email/login', { email: 'user@example.com', password: 'wrong-password' }, env)).status, 401);
});
test('OAuth state is browser-bound, expires, consumes once and preserves safe desktop query parameters', async () => {
  const env = environment(); const path = '/auth/desktop?challenge=abc&returnUrl=http%3A%2F%2F127.0.0.1%3A3001';
  const flow = await oauth.startGitHubOAuth(env, path);
  assert.equal(await oauth.consumeGitHubOAuth(env, flow.state, 'wrong-cookie'), null);
  const cookies = flow.cookie.split(';')[0];
  const record = await oauth.consumeGitHubOAuth(env, flow.state, cookies); assert.equal(record.return_path, path);
  assert.equal(await oauth.consumeGitHubOAuth(env, flow.state, cookies), null);
  const expired = await oauth.startGitHubOAuth(env, '/my'); env.DB.sqlite.exec('UPDATE github_oauth_states SET expires_at = 0');
  assert.equal(await oauth.consumeGitHubOAuth(env, expired.state, expired.cookie.split(';')[0]), null);
  for (const path of ['//evil.example', '/\\evil.example', 'https://evil.example', '/api/auth/logout']) assert.equal(oauth.safeReturnPath(path), '/my');
});
test('GitHub callback uses PKCE and establishes only a verified persisted identity', async () => {
  const env = environment(); env.GITHUB_CLIENT_ID = 'client'; env.GITHUB_CLIENT_SECRET = 'secret';
  const start = await request('/api/auth/github?returnUrl=/my', undefined, env); const authorization = new URL(start.headers.get('Location'));
  assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
  const state = authorization.searchParams.get('state'); const cookie = start.headers.get('Set-Cookie').split(';')[0];
  await mockFetch(async (url, options) => {
    if (String(url).includes('access_token')) { assert.ok(JSON.parse(options.body).code_verifier); return Response.json({ access_token: 'provider-token' }); }
    if (String(url).endsWith('/emails')) return Response.json([{ email: 'github@example.com', primary: true, verified: true }]);
    return Response.json({ id: 42, login: 'test-user' });
  }, async () => {
    const callback = await request(`/api/auth/github/callback?code=provider-code&state=${state}`, undefined, env, { Cookie: cookie }); assert.equal(callback.status, 302); assert.match(callback.headers.get('Set-Cookie'), /vg_session=/);
    const replay = await request(`/api/auth/github/callback?code=provider-code&state=${state}`, undefined, env, { Cookie: cookie }); assert.match(replay.headers.get('Location'), /github_invalid_state/);
  });
  assert.equal(env.DB.sqlite.prepare('SELECT count(*) AS n FROM users').get().n, 1);
});
test('release and download providers never serve mock packages without credentials', async () => {
  await assert.rejects(new GitHubReleaseProvider({}).getProductReleases('visionstudio'));
  await assert.rejects(new GitHubDownloadProvider({}).getDownloadStream('visionstudio', '101'));
  const response = await request('/api/releases'); assert.equal(response.status, 503); const data = await response.json();
  assert.equal(Object.keys(data.errors).length, 3); assert.deepEqual(data.releases.visionstudio, []);
});
test('upstream failures are distinct from a successful empty release list', async () => {
  await mockFetch(async () => new Response('{}', { status: 401 }), async () => {
    await assert.rejects(new GitHubReleaseProvider({ GITHUB_RELEASE_TOKEN: 'token', GITHUB_ORG: 'test-failure' }).getProductReleases('visionstudio'));
  });
  await mockFetch(async () => Response.json([]), async () => {
    assert.deepEqual(await new GitHubReleaseProvider({ GITHUB_RELEASE_TOKEN: 'token', GITHUB_ORG: 'test-empty' }).getProductReleases('visionstudio'), []);
  });
});
test('one unavailable product does not suppress published releases from another product', async () => {
  const env = environment(); env.GITHUB_RELEASE_TOKEN = 'token'; env.GITHUB_ORG = 'test-partial';
  await mockFetch(async url => String(url).includes('/VisionStudio/') ? Response.json([{ tag_name: 'v1.0', name: 'Release', published_at: '2026-10-14T00:00:00Z', prerelease: false, draft: false, assets: [{ id: 42, name: 'studio-linux-arm64.tar.gz', size: 100, content_type: 'application/gzip', digest: `sha256:${'a'.repeat(64)}` }] }]) : new Response('{}', { status: 503 }), async () => {
    const response = await request('/api/releases', undefined, env); assert.equal(response.status, 200); const data = await response.json(); assert.equal(data.releases.visionstudio[0].assets[0].arch, 'arm64'); assert.equal(data.releases.visionstudio[0].assets[0].digest, `sha256:${'a'.repeat(64)}`); assert.ok(data.errors.visionruntime);
  });
});
test('asset inference distinguishes Darwin and does not invent universal architecture', () => {
  assert.equal(inferPlatform('studio-darwin-arm64.tar.gz'), 'macos'); assert.equal(inferPlatform('studio-win-x64.zip'), 'windows'); assert.equal(inferArch('studio-linux.tar.gz'), 'unknown');
});
test('unknown API routes and missing assets return actual 404s', async () => {
  const api = await request('/api/unknown'); assert.equal(api.status, 404); assert.match(api.headers.get('Content-Type'), /json/);
  const asset = await request('/assets/missing.js'); assert.equal(asset.status, 404); assert.doesNotMatch(asset.headers.get('Content-Type'), /html/);
});

test('rate limits and origin checks reject abuse without storing raw addresses', async () => {
  const env = environment();
  const response = await request('/api/contact', form(), env, { Origin: 'https://other.example' }); assert.equal(response.status, 403);
  for (let index = 0; index < 5; index++) assert.equal((await request('/api/contact', form(), env)).status, 201);
  assert.equal((await request('/api/contact', form(), env)).status, 429);
  const rows = env.DB.sqlite.prepare('SELECT key FROM request_limits').all(); assert.ok(rows.length); assert.ok(rows.every(row => !row.key.includes('engineer@example.com')));
});
test('public snapshots, localized articles, download deep links and private routes have correct HTTP semantics', async () => {
  const env = environment();
  env.ASSETS.fetch = async req => {
    const pathname = new URL(req.url).pathname;
    const filename = `dist${pathname}`;
    return fs.existsSync(filename) && fs.statSync(filename).isFile() ? new Response(fs.readFileSync(filename), { headers: { 'Content-Type': 'text/html' } }) : new Response('Not found', { status: 404 });
  };
  for (const pathname of ['/', '/zh', '/resources/getting-started', '/zh/resources/sdk-contracts', '/downloads/visionstudio/v1.0']) assert.equal((await request(pathname, undefined, env)).status, 200, pathname);
  const unknown = await request('/resources/unknown', undefined, env); assert.equal(unknown.status, 404); assert.match(unknown.headers.get('X-Robots-Tag'), /noindex/);
  for (const pathname of ['/my', '/account', '/auth/desktop']) { const response = await request(pathname, undefined, env); assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store'); assert.match(response.headers.get('X-Robots-Tag'), /noindex/); }
  const legacy = await request('/downloads?lang=zh', undefined, env); assert.equal(legacy.status, 301); assert.equal(legacy.headers.get('Location'), 'https://visiongo.app/zh/downloads');
});


test('historical demo identities can no longer use signed sessions', async () => {
  const env = environment();
  env.DB.sqlite.prepare('INSERT INTO users (id, google_sub, github_id, email, created_at, last_login_at, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run('legacy-demo', 'github:gh_demo_1092834', 'gh_demo_1092834', 'demo@example.com', '2026-10-14', '2026-10-14', 'demo-tenant');
  const session = await auth.createSessionCookie('legacy-demo', 'gh_demo_1092834', env.SESSION_SECRET);
  const response = await request('/api/auth/me', undefined, env, { Cookie: session.cookieHeader.split(';')[0] });
  assert.equal(response.status, 200); assert.equal((await response.json()).user, null);
});


test('Google verification requires the configured audience, verified email and finite future expiry', async () => {
  const valid = { sub: 'subject', email: 'google@example.com', email_verified: true, aud: 'client', exp: Math.floor(Date.now() / 1000) + 600 };
  for (const payload of [valid, { ...valid, aud: 'other' }, { ...valid, email_verified: false }, { ...valid, exp: 1 }, { ...valid, exp: 'invalid' }]) {
    await mockFetch(async () => Response.json(payload), async () => {
      const result = await auth.verifyGoogleIdToken('provider-credential', 'client');
      assert.equal(!!result, payload === valid);
    });
  }
});
test('anonymous downloads stream real bytes and provider failures are not mistaken for missing files', async () => {
  const env = environment(); env.DB = undefined; env.GITHUB_RELEASE_TOKEN = 'token';
  await mockFetch(async (_url, options) => options.headers.Accept === 'application/octet-stream' ? new Response('real-binary-content') : Response.json({ name: 'studio-linux-x64.tar.gz', content_type: 'application/gzip', size: 19 }), async () => {
    const response = await request('/api/download/visionstudio/42', undefined, env); assert.equal(response.status, 200); assert.equal(await response.text(), 'real-binary-content'); assert.match(response.headers.get('Content-Disposition'), /studio-linux-x64/);
  });
  await mockFetch(async () => new Response('{}', { status: 503 }), async () => {
    assert.equal((await request('/api/download/visionstudio/42', undefined, env)).status, 503);
  });
  await mockFetch(async () => new Response('{}', { status: 404 }), async () => {
    assert.equal((await request('/api/download/visionstudio/42', undefined, env)).status, 404);
  });
});
