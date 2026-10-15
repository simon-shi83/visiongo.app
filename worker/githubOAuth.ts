import type { Env } from './types';
import { requireDatabase } from './reliability';

const COOKIE = '__Host-vg_github_state';
const COOKIE_OPTIONS = 'Path=/; HttpOnly; Secure; SameSite=Lax';
export const clearGitHubStateCookie = `${COOKIE}=; ${COOKIE_OPTIONS}; Max-Age=0`;

export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/my';
  const parsed = new URL(value, 'https://visiongo.app');
  if (!['/my', '/account', '/auth/desktop'].includes(parsed.pathname)) return '/my';
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export async function startGitHubOAuth(env: Env, returnPath: string): Promise<{ state: string; challenge: string; cookie: string }> {
  const db = requireDatabase(env);
  const state = crypto.randomUUID();
  const verifier = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const challenge = btoa(String.fromCharCode(...digest)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await db.prepare('INSERT INTO github_oauth_states (state, return_path, code_verifier, expires_at) VALUES (?, ?, ?, ?)')
    .bind(state, safeReturnPath(returnPath), verifier, Date.now() + 10 * 60 * 1000).run();
  return { state, challenge, cookie: `${COOKIE}=${state}; ${COOKIE_OPTIONS}; Max-Age=600` };
}

export async function consumeGitHubOAuth(env: Env, state: string | null, cookies: string | null): Promise<{ return_path: string; code_verifier: string } | null> {
  const cookie = cookies?.split(';').map(item => item.trim()).find(item => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!state || !cookie || state !== cookie) return null;
  return requireDatabase(env).prepare('DELETE FROM github_oauth_states WHERE state = ? AND expires_at > ? RETURNING return_path, code_verifier')
    .bind(state, Date.now()).first<{ return_path: string; code_verifier: string }>();
}
