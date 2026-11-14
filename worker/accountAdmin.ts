/**
 * Account self-service and platform-administrator account management.
 *
 * - /api/account/password: the signed-in user changes (or, without one, sets) their password.
 * - /api/admin/users...: platform administrators find accounts, create email accounts,
 *   reset passwords and issue sign-up / reset codes that are shown on screen instead of
 *   emailed. This keeps an edition usable while its email delivery is not configured.
 *
 * Temporary passwords and codes are returned once in the response and never stored in
 * clear; only who did what is recorded (organization_events, org_id "platform").
 */

import type { Env, User } from './types';
import { allowRequest, json, requireDatabase } from './reliability';
import {
  createSessionCookie,
  equalStrings,
  generateSalt,
  generateVerificationCode,
  getSession,
  getUserByEmail,
  hashPassword,
  passwordPolicyError,
  PASSWORD_ITERATIONS,
  registerUserWithEmail,
  resetPassword,
  saveVerificationCode,
} from './auth';
import { methodEnabled } from './authMethods';
import { revokeUserSessions } from './desktopSessions';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Codes an administrator hands over by chat or phone stay valid for a day. */
export const ADMIN_CODE_TTL_MS = 24 * 60 * 60 * 1000;
/** Setting a first password needs a recent sign-in, as there is no old password to check. */
const FRESH_SIGN_IN_MS = 30 * 60 * 1000;
const PLATFORM_EVENTS = 'platform';

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  return body && typeof body === 'object' ? body as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function recordPlatformEvent(env: Env, actor: string, action: string, targetEmail: string): Promise<void> {
  await requireDatabase(env).prepare(
    'INSERT INTO organization_events (id, org_id, actor_user_id, action, target_email, detail, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)'
  ).bind(`evt_${crypto.randomUUID()}`, PLATFORM_EVENTS, actor, action, targetEmail, new Date().toISOString()).run();
}

/** 12 characters without look-alikes (0/O, 1/l/I), always with letters and digits. */
export function temporaryPassword(): string {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = letters + digits;
  const pick = (alphabet: string) => {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return alphabet[value[0] % alphabet.length];
  };
  for (;;) {
    let password = '';
    for (let i = 0; i < 12; i++) password += pick(all);
    if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) return password;
  }
}

async function hasPassword(env: Env, userId: string): Promise<boolean> {
  const row = await requireDatabase(env).prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(userId).first<{ password_hash: string | null }>();
  return !!row?.password_hash;
}

/** /api/account/password: GET tells whether a password exists; POST changes or sets it. */
export async function handleAccountApi(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (url.pathname !== '/api/account/password') return null;
  const session = await getSession(env, request.headers.get('Cookie'));
  if (!session) return json({ error: 'Unauthorized' }, 401);
  const { user } = session;

  if (request.method === 'GET') {
    return json({ has_password: await hasPassword(env, user.id), email_sign_in: methodEnabled(env, 'email') });
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const body = await readBody(request);
  const current = typeof body.current_password === 'string' ? body.current_password : '';
  const next = typeof body.new_password === 'string' ? body.new_password : '';
  const weak = passwordPolicyError(next);
  if (weak) return json({ error: weak }, 400);
  if (!await allowRequest(env, 'account-password', user.id, 10, 600)) return json({ error: '尝试次数过多，请稍后重试' }, 429);

  const record = await getUserByEmail(env, user.email);
  if (!record || record.id !== user.id) return json({ error: 'Unauthorized' }, 401);
  if (record.passwordHash && record.passwordSalt) {
    const computed = await hashPassword(current, record.passwordSalt, record.passwordIterations);
    if (!equalStrings(computed, record.passwordHash)) return json({ error: '当前密码不正确' }, 400);
  } else if (Date.now() - session.signedInAt > FRESH_SIGN_IN_MS) {
    return json({ error: '为安全起见，请退出后重新登录，再设置密码' }, 401);
  }

  const salt = generateSalt();
  const hash = await hashPassword(next, salt, PASSWORD_ITERATIONS);
  const version = (user.sessionVersion || 0) + 1;
  // Other browsers are signed out; this one gets a fresh cookie. Desktop sign-ins stay.
  await requireDatabase(env).prepare(
    "UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, session_version = ?, auth_provider = COALESCE(auth_provider, 'email') WHERE id = ?"
  ).bind(hash, salt, PASSWORD_ITERATIONS, version, user.id).run();
  const { cookieHeader } = await createSessionCookie(user.id, user.email, env.SESSION_SECRET, version);
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store', 'Set-Cookie': cookieHeader } });
}

interface AdminUserRow {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  auth_provider: string | null;
  has_password: number;
  created_at: string;
  last_login_at: string | null;
}

/** /api/admin/users[...] for platform administrators; null for other paths. */
export async function handleAdminUsersApi(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (url.pathname !== '/api/admin/users' && !url.pathname.startsWith('/api/admin/users/')) return null;
  const session = await getSession(env, request.headers.get('Cookie'));
  if (!session) return json({ error: 'Unauthorized' }, 401);
  const admin: User = session.user;
  if (admin.role !== 'super_admin') return json({ error: 'Only platform administrators can manage accounts' }, 403);
  const db = requireDatabase(env);

  if (url.pathname === '/api/admin/users' && request.method === 'GET') {
    const query = (url.searchParams.get('q') || '').trim().toLowerCase().slice(0, 254);
    const pattern = `%${query.replace(/[\\%_]/g, character => `\\${character}`)}%`;
    const { results } = await db.prepare(
      `SELECT id, email, display_name, role, auth_provider, CASE WHEN password_hash IS NULL THEN 0 ELSE 1 END AS has_password,
              created_at, last_login_at
       FROM users WHERE LOWER(email) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(display_name, '')) LIKE ? ESCAPE '\\'
       ORDER BY created_at DESC LIMIT 50`
    ).bind(pattern, pattern).all<AdminUserRow>();
    return json({ users: results || [], email_sign_in: methodEnabled(env, 'email'), email_delivery: !!env.RESEND_API_KEY });
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  // Accounts made here sign in with email and password, which only some editions offer.
  if (!methodEnabled(env, 'email')) return json({ error: '本站未开启邮箱密码登录，不能在这里创建账号或设置密码' }, 400);
  const body = await readBody(request);
  const email = text(body.email).toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return json({ error: '请输入有效的邮箱地址' }, 400);
  const existing = await getUserByEmail(env, email);

  if (url.pathname === '/api/admin/users') {
    if (existing) return json({ error: '该邮箱已有账号，可以为它重置密码' }, 409);
    const password = temporaryPassword();
    const created = await registerUserWithEmail(env, email, password, text(body.display_name).slice(0, 128));
    if (!created.user) return json({ error: created.error || '创建失败' }, 400);
    await recordPlatformEvent(env, admin.id, 'account.created_by_admin', email);
    return json({ user: { id: created.user.id, email }, temporary_password: password }, 201);
  }

  if (url.pathname === '/api/admin/users/reset-password') {
    if (!existing) return json({ error: '该邮箱还没有账号' }, 404);
    const password = temporaryPassword();
    await resetPassword(env, email, password);
    await revokeUserSessions(env, existing.id);
    await recordPlatformEvent(env, admin.id, 'account.password_reset_by_admin', email);
    return json({ user: { id: existing.id, email }, temporary_password: password });
  }

  if (url.pathname === '/api/admin/users/code') {
    const purpose = body.purpose === 'reset' ? 'reset' : 'register';
    if (purpose === 'register' && existing) return json({ error: '该邮箱已有账号，请生成“重置密码”验证码' }, 409);
    if (purpose === 'reset' && !existing) return json({ error: '该邮箱还没有账号，请生成“注册”验证码' }, 404);
    const code = generateVerificationCode();
    await saveVerificationCode(env, email, code, purpose, ADMIN_CODE_TTL_MS);
    await recordPlatformEvent(env, admin.id, `account.${purpose}_code_by_admin`, email);
    return json({ email, purpose, code, expires_at: new Date(Date.now() + ADMIN_CODE_TTL_MS).toISOString() });
  }

  return json({ error: 'Not found' }, 404);
}
