import type { Env } from './types';

export function requireDatabase(env: Env): D1Database {
  if (!env.DB) throw new Error('DB binding is not configured');
  return env.DB;
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

// Only a keyed digest is stored; the counter never contains email or raw IP.
export async function allowRequest(env: Env, scope: string, subject: string, limit: number, seconds: number): Promise<boolean> {
  const db = requireDatabase(env);
  if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${scope}:${subject}`));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const now = Date.now();
  const window = Math.floor(now / (seconds * 1000));
  const counter = await db.prepare(
    'INSERT INTO request_limits (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count'
  ).bind(`${scope}:${hash}:${window}`, (window + 1) * seconds * 1000).first<{ count: number }>();
  return !!counter && counter.count <= limit;
}
