/**
 * Desktop sign-ins (SDK identity 4): refresh tokens are recorded, rotated at
 * every use and revocable per computer or all at once.
 *
 * - A family is one sign-in on one computer. Each refresh marks the presented
 *   token used and issues its successor in the same family.
 * - A used token presented again revokes the family (the token was copied),
 *   except within REUSE_GRACE_MS of its rotation while the successor is still
 *   unused: then the reply to that refresh was lost, and the successor is
 *   replaced instead.
 */
import type { Env, User } from './types';
import { json, requireDatabase } from './reliability';
import {
  DESKTOP_REFRESH_TOKEN_LIFETIME_MS,
  createDesktopRefreshToken,
  getSessionUser,
  verifyDesktopRefreshToken,
  type DesktopRefreshTokenPayload,
} from './auth';

const REUSE_GRACE_MS = 60 * 1000;
const DEVICE_NAME_MAX = 128;

interface TokenRow {
  jti: string;
  family_id: string;
  user_id: string;
  device_name: string | null;
  used_at: string | null;
  replaced_by: string | null;
  revoked_at: string | null;
}

export type InspectedRefreshToken =
  | { ok: true; payload: DesktopRefreshTokenPayload; row: TokenRow; replaceSuccessor: string | null }
  | { ok: false; error: 'invalid_grant' | 'refresh_token_reused'; description: string };

export function deviceName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return name ? Array.from(name).slice(0, DEVICE_NAME_MAX).join('') : null;
}

/** Records and signs the first refresh token of a new sign-in on a computer. */
export async function issueRefreshToken(env: Env, user: User, tenantId: string, device: string | null): Promise<string> {
  const db = requireDatabase(env);
  // A user's long-expired rows are dropped as a new sign-in is recorded.
  await db.prepare('DELETE FROM desktop_refresh_tokens WHERE user_id = ? AND expires_at < ?')
    .bind(user.id, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).run();
  return insertToken(env, user, tenantId, crypto.randomUUID(), device);
}

async function insertToken(env: Env, user: Pick<User, 'id'>, tenantId: string, familyId: string,
                           device: string | null): Promise<string> {
  const jti = crypto.randomUUID();
  const now = Date.now();
  const exp = now + DESKTOP_REFRESH_TOKEN_LIFETIME_MS;
  await requireDatabase(env).prepare(
    'INSERT INTO desktop_refresh_tokens (jti, family_id, user_id, tenant_id, device_name, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(jti, familyId, user.id, tenantId, device, new Date(now).toISOString(), new Date(exp).toISOString()).run();
  return createDesktopRefreshToken(user, env.SESSION_SECRET, tenantId, jti, exp);
}

async function tokenRow(env: Env, jti: string): Promise<TokenRow | null> {
  return requireDatabase(env).prepare(
    'SELECT jti, family_id, user_id, device_name, used_at, replaced_by, revoked_at FROM desktop_refresh_tokens WHERE jti = ?'
  ).bind(jti).first<TokenRow>();
}

/**
 * Checks a presented refresh token without using it up, so a refusal later
 * (a removed member) leaves the token usable for switching organizations.
 * A replayed token revokes its family here.
 */
export async function inspectRefreshToken(env: Env, token: string): Promise<InspectedRefreshToken> {
  const invalid = { ok: false, error: 'invalid_grant', description: 'Refresh token is invalid, expired or revoked' } as const;
  const payload = await verifyDesktopRefreshToken(token, env.SESSION_SECRET);
  if (!payload) return invalid;
  const row = await tokenRow(env, payload.jti);
  if (!row || row.user_id !== payload.userId || row.revoked_at) return invalid;
  if (!row.used_at) return { ok: true, payload, row, replaceSuccessor: null };

  if (Date.now() - Date.parse(row.used_at) <= REUSE_GRACE_MS && row.replaced_by) {
    const successor = await tokenRow(env, row.replaced_by);
    if (successor && !successor.used_at && !successor.revoked_at) return { ok: true, payload, row, replaceSuccessor: successor.jti };
  }
  await revokeFamily(env, row.family_id);
  console.warn(`[Desktop Session] Used refresh token presented again; sign-in ${row.family_id} of user ${row.user_id} revoked`);
  return { ok: false, error: 'refresh_token_reused', description: 'Refresh token was already used; sign in again' };
}

/**
 * Uses up an inspected token and returns its successor, bound to tenantId.
 * Null when a concurrent request used it first.
 */
export async function rotateRefreshToken(env: Env, user: User, inspected: Extract<InspectedRefreshToken, { ok: true }>,
                                         tenantId: string): Promise<string | null> {
  const db = requireDatabase(env);
  const now = new Date().toISOString();
  if (inspected.replaceSuccessor) {
    const replaced = await db.prepare(
      'UPDATE desktop_refresh_tokens SET revoked_at = ? WHERE jti = ? AND used_at IS NULL AND revoked_at IS NULL'
    ).bind(now, inspected.replaceSuccessor).run();
    if (!replaced.meta.changes) return null;
  } else {
    const used = await db.prepare(
      'UPDATE desktop_refresh_tokens SET used_at = ? WHERE jti = ? AND used_at IS NULL AND revoked_at IS NULL'
    ).bind(now, inspected.row.jti).run();
    if (!used.meta.changes) return null;
  }
  const token = await insertToken(env, user, tenantId, inspected.row.family_id, inspected.row.device_name);
  const successor = (await verifyDesktopRefreshToken(token, env.SESSION_SECRET))!.jti;
  await db.prepare('UPDATE desktop_refresh_tokens SET replaced_by = ? WHERE jti = ?').bind(successor, inspected.row.jti).run();
  return token;
}

/** Revokes one sign-in; returns how many of its tokens could still be used. */
export async function revokeFamily(env: Env, familyId: string): Promise<number> {
  return revokeWhere(env, 'family_id = ?', familyId);
}

/** Revokes every desktop sign-in of a user (sign out everywhere, password reset). */
export async function revokeUserSessions(env: Env, userId: string): Promise<number> {
  return revokeWhere(env, 'user_id = ?', userId);
}

async function revokeWhere(env: Env, where: string, value: string): Promise<number> {
  const db = requireDatabase(env);
  const now = new Date().toISOString();
  const live = await db.prepare(
    `UPDATE desktop_refresh_tokens SET revoked_at = ? WHERE ${where} AND revoked_at IS NULL AND used_at IS NULL AND expires_at > ?`
  ).bind(now, value, now).run();
  await db.prepare(`UPDATE desktop_refresh_tokens SET revoked_at = ? WHERE ${where} AND revoked_at IS NULL`).bind(now, value).run();
  return live.meta.changes ?? 0;
}

/** POST /api/auth/revoke (SDK IdentityRevokeRequest): sign out on this computer, or everywhere. */
export async function revokeWithRefreshToken(env: Env, token: string, scope: 'device' | 'all'): Promise<number | null> {
  const payload = await verifyDesktopRefreshToken(token, env.SESSION_SECRET);
  if (!payload) return null;
  const row = await tokenRow(env, payload.jti);
  if (!row || row.user_id !== payload.userId) return null;
  return scope === 'all' ? revokeUserSessions(env, row.user_id) : revokeFamily(env, row.family_id);
}

interface SessionRow {
  family_id: string;
  device_name: string | null;
  tenant_id: string;
  tenant_name: string | null;
  signed_in_at: string;
  last_used_at: string;
}

/**
 * /api/account/desktop-sessions: the signed-in user's desktop sign-ins, and
 * POST .../revoke {family_id} or {all: true} to end them from the browser.
 */
export async function handleDesktopSessionApi(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith('/api/account/desktop-sessions')) return null;
  const user = await getSessionUser(env, request.headers.get('Cookie'));
  if (!user) return json({ error: 'unauthorized' }, 401);
  const db = requireDatabase(env);

  if (url.pathname === '/api/account/desktop-sessions' && request.method === 'GET') {
    const now = new Date().toISOString();
    // The live token of a sign-in is its newest unused one.
    const { results } = await db.prepare(
      `SELECT t.family_id, t.device_name, t.tenant_id, o.name AS tenant_name,
              (SELECT MIN(created_at) FROM desktop_refresh_tokens f WHERE f.family_id = t.family_id) AS signed_in_at,
              t.created_at AS last_used_at
         FROM desktop_refresh_tokens t LEFT JOIN organizations o ON o.id = t.tenant_id
        WHERE t.user_id = ? AND t.revoked_at IS NULL AND t.used_at IS NULL AND t.expires_at > ?
        ORDER BY t.created_at DESC`
    ).bind(user.id, now).all<SessionRow>();
    return json({ sessions: results || [] });
  }

  if (url.pathname === '/api/account/desktop-sessions/revoke' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { family_id?: unknown; all?: unknown };
    if (body.all === true) return json({ revoked: await revokeUserSessions(env, user.id) });
    if (typeof body.family_id !== 'string' || !body.family_id) return json({ error: 'family_id or all is required' }, 400);
    const owner = await db.prepare('SELECT user_id FROM desktop_refresh_tokens WHERE family_id = ? LIMIT 1')
      .bind(body.family_id).first<{ user_id: string }>();
    if (!owner || owner.user_id !== user.id) return json({ error: 'not_found' }, 404);
    return json({ revoked: await revokeFamily(env, body.family_id) });
  }
  return json({ error: 'not_found' }, 404);
}
