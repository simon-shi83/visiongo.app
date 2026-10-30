/**
 * Sign-in methods of this edition (AUTH_METHODS): the China edition uses email,
 * the international edition Google and GitHub. A disabled method is refused by
 * its endpoints, not only hidden on the page. Unset: every method (development, tests).
 */
import type { Env } from './types';

export type AuthMethod = 'email' | 'google' | 'github';
const ALL: AuthMethod[] = ['email', 'google', 'github'];

export function authMethods(env: Env): AuthMethod[] {
  if (env.AUTH_METHODS === undefined) return ALL;
  const listed = env.AUTH_METHODS.split(',').map(item => item.trim().toLowerCase());
  return ALL.filter(method => listed.includes(method));
}

export function methodEnabled(env: Env, method: AuthMethod): boolean {
  return authMethods(env).includes(method);
}

export function methodDisabledResponse(): Response {
  return Response.json({ error: 'auth_method_disabled' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
}
