import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createDatabase } from './database.mjs';
import worker from '../server-build/index.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = resolve(root, 'dist');
// The production service has a dedicated HTTPS ingress. FRP may rewrite proxy
// protocol headers, so use its configured public origin for redirects and CSRF.
if (!process.env.PUBLIC_ORIGIN) throw new Error('PUBLIC_ORIGIN is required');
const publicOrigin = new URL(process.env.PUBLIC_ORIGIN);
const allowedHost = new RegExp(`^(${[publicOrigin.hostname, `www.${publicOrigin.hostname}`, 'localhost', '127.0.0.1']
  .map(host => host.replace(/[.]/g, '\\.')).join('|')})(:\\d+)?$`, 'i');
const DB = createDatabase(process.env.DATABASE_PATH || resolve(root, 'data/website.sqlite'), resolve(root, 'migrations'));
const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2', '.pdf':'application/pdf' };
const env = { ...process.env, PUBLIC_ORIGIN: publicOrigin.origin, DB, ASSETS: { async fetch(request) {
  try {
    const filename = resolve(assets, '.' + decodeURIComponent(new URL(request.url).pathname));
    if (!filename.startsWith(assets + sep)) return new Response('Not Found', { status: 404 });
    const info = await stat(filename);
    if (!info.isFile()) return new Response('Not Found', { status: 404 });
    return new Response(request.method === 'HEAD' ? null : await readFile(filename), { headers: { 'Content-Type': types[extname(filename)] || 'application/octet-stream', 'Content-Length': String(info.size) } });
  } catch { return new Response('Not Found', { status: 404 }); }
} } };
if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET is required');
const pending = new Set();
const ctx = { waitUntil(task) {
  const tracked = Promise.resolve(task).catch(() => console.error('Background task failed')).finally(() => pending.delete(tracked));
  pending.add(tracked);
} };
const server = createServer(async (incoming, outgoing) => {
  try {
    const host = incoming.headers.host || '';
    if (!allowedHost.test(host)) { outgoing.writeHead(400).end(); return; }
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    headers.set('CF-Connecting-IP', incoming.headers['x-real-ip'] || incoming.socket.remoteAddress || '127.0.0.1');
    headers.set('x-forwarded-proto', publicOrigin.protocol.slice(0, -1));
    // Keep a www host visible so the Worker issues its canonical redirect.
    const origin = host.toLowerCase().startsWith(`www.${publicOrigin.hostname}`) ? `${publicOrigin.protocol}//www.${publicOrigin.host}` : publicOrigin.origin;
    const controller = new AbortController();
    outgoing.on('close', () => { if (!outgoing.writableFinished) controller.abort(); });
    let body;
    if (incoming.method !== 'GET' && incoming.method !== 'HEAD') {
      const chunks = []; let size = 0;
      for await (const chunk of incoming) {
        size += chunk.length;
        if (size > 1_048_576) { outgoing.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }
    const request = new Request(`${origin}${incoming.url}`, { method: incoming.method, headers, body, signal: controller.signal });
    const response = await worker.fetch(request, env, ctx);
    outgoing.statusCode = response.status;
    for (const [key, value] of response.headers) if (key !== 'set-cookie') outgoing.setHeader(key, value);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) outgoing.setHeader('set-cookie', cookies);
    if (incoming.method === 'HEAD' || !response.body) outgoing.end();
    else await pipeline(Readable.fromWeb(response.body), outgoing);
  } catch (error) {
    if (!outgoing.destroyed) {
      console.error('HTTP request failed:', error.name);
      if (!outgoing.headersSent) outgoing.writeHead(500, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
      outgoing.end('{"error":"Service temporarily unavailable"}');
    }
  }
});
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
server.listen(Number(process.env.PORT || 8600), '127.0.0.1', () => console.log('VISIONGO website listening on loopback port', process.env.PORT || 8600));
let scheduling = false;
const timer = setInterval(async () => {
  if (scheduling) return;
  scheduling = true;
  try { await worker.scheduled({}, env, ctx); await Promise.all([...pending]); }
  catch { console.error('Scheduled maintenance failed'); }
  finally { scheduling = false; }
}, 300_000);
for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => {
  clearInterval(timer);
  const force = setTimeout(() => process.exit(1), 25_000); force.unref();
  server.close(async () => { await Promise.all([...pending]); DB.close(); process.exit(0); });
});
