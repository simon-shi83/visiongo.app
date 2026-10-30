// China edition adapter: deploy/database.mjs must behave like the D1 subset the
// Worker uses, and track migrations so applied files cannot change silently.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { createDatabase } from '../deploy/database.mjs';

const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const { default: worker } = await vite.ssrLoadModule('/worker/index.ts');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'visiongo-deploy-'));
const opened = [];
after(async () => { for (const db of opened) db.close(); fs.rmSync(scratch, { recursive: true, force: true }); await vite.close(); });

function copyMigrations(name) {
  const dir = path.join(scratch, name);
  fs.mkdirSync(dir);
  for (const file of fs.readdirSync('migrations')) fs.copyFileSync(path.join('migrations', file), path.join(dir, file));
  return dir;
}
function open(file, migrations) { const db = createDatabase(file, migrations); opened.push(db); return db; }

test('migrations run once per file and an edited applied migration refuses to start', () => {
  const migrations = copyMigrations('migrations-a');
  const file = path.join(scratch, 'a', 'website.sqlite');
  open(file, migrations).close(); opened.pop();
  open(file, migrations).close(); opened.pop();
  const first = fs.readdirSync(migrations).sort()[0];
  fs.appendFileSync(path.join(migrations, first), '\n-- edited\n');
  assert.throws(() => createDatabase(file, migrations), /Applied migration changed/);
});

test('first, all, run and batch match the D1 shapes the Worker relies on', async () => {
  const db = open(path.join(scratch, 'b', 'website.sqlite'), copyMigrations('migrations-b'));
  const insert = db.prepare('INSERT INTO request_limits (key, count, expires_at) VALUES (?, ?, ?)');
  const run = await insert.bind('k1', 1, 10).run();
  assert.equal(run.success, true); assert.equal(run.meta.changes, 1);
  assert.deepEqual({ ...await db.prepare('SELECT count FROM request_limits WHERE key = ?').bind('k1').first() }, { count: 1 });
  assert.equal(await db.prepare('SELECT count FROM request_limits WHERE key = ?').bind('k1').first('count'), 1);
  assert.equal(await db.prepare('SELECT count FROM request_limits WHERE key = ?').bind('none').first(), null);
  const { results } = await db.prepare('SELECT key FROM request_limits').all();
  assert.deepEqual(results.map(row => row.key), ['k1']);
  await assert.rejects(db.batch([insert.bind('k2', 1, 10), insert.bind('k1', 1, 10)]));
  assert.equal((await db.prepare('SELECT count(*) AS n FROM request_limits').first()).n, 1, 'failed batch rolls back');
});

test('the Worker stores and reads data through the adapter', async () => {
  const env = { DB: open(path.join(scratch, 'c', 'website.sqlite'), copyMigrations('migrations-c')), SESSION_SECRET: 'test-session-secret',
                PUBLIC_ORIGIN: 'https://visiongo.com.cn', ASSETS: { fetch: async () => new Response('Not Found', { status: 404 }) } };
  const pending = [];
  const body = { name: 'Test Engineer', email: 'engineer@example.com', product: 'visionstudio', message: 'Evaluate matching on representative samples.', locale: 'zh', source: '/zh/contact', submissionId: crypto.randomUUID() };
  const post = () => worker.fetch(new Request('https://visiongo.com.cn/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://visiongo.com.cn' }, body: JSON.stringify(body) }), env, { waitUntil(task) { pending.push(task); } });
  const first = await post(); assert.equal(first.status, 201);
  const second = await post(); assert.equal(second.status, 201);
  assert.equal((await second.json()).referenceId, (await first.json()).referenceId);
  await Promise.all(pending);
  assert.equal((await env.DB.prepare('SELECT count(*) AS n FROM contact_inquiries').first()).n, 1);
});
