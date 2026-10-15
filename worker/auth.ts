/**
 * Google Authentication, Secure Sessions, and D1 Data Access Layer for VISIONGO.
 *
 * Security Principles:
 * - Server-side verification of Google ID token via official tokeninfo API.
 * - Minimum scopes only: openid, email, profile. Zero password handling.
 * - Internal user IDs (UUID) are decoupled from Google sub and email.
 * - Sessions are HttpOnly, Secure, SameSite=Lax signed HMAC-SHA256 cookies.
 * - Anonymous downloads remain 100% accessible without authentication.
 */

import { Env, TenantSummary, User, UserDownloadRecord, SupportedProduct } from './types';
import { requireDatabase } from './reliability';

export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface SessionPayload {
  userId: string;
  googleSub?: string;
  authSubject?: string;
  exp: number; // Unix timestamp in ms
}

export interface DesktopAccessToken {
  accessToken: string;
  expiresIn: number;
  tenantId: string;
}

// Every service that accepts the desktop token; each one requires its own name.
const DESKTOP_TOKEN_AUDIENCE = ['visioncloud', 'visiontrainer'];
const DESKTOP_TOKEN_LIFETIME_SECONDS = 10 * 60;

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToBytes(pem: string): Uint8Array {
  const normalized = pem.replace(/\\n/g, '\n');
  const body = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  if (!body) throw new Error('DESKTOP_TOKEN_PRIVATE_KEY is empty or invalid');
  const binary = atob(body);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

/**
 * Create a short-lived RS256 desktop token for the selected organization.
 * Claims follow SDK IdentityAccessTokenClaims: tenant_id is the organization
 * and role the effective role in it (super_admin stays platform-wide).
 */
export async function createDesktopAccessToken(env: Env, user: User, tenant: TenantSummary): Promise<DesktopAccessToken> {
  if (!env.DESKTOP_TOKEN_PRIVATE_KEY) {
    throw new Error('DESKTOP_TOKEN_PRIVATE_KEY is not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = DESKTOP_TOKEN_LIFETIME_SECONDS;
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: env.DESKTOP_TOKEN_KEY_ID || 'website-desktop-1',
  };
  const payload = {
    iss: env.DESKTOP_TOKEN_ISSUER || 'https://visiongo.app',
    aud: DESKTOP_TOKEN_AUDIENCE,
    sub: user.id,
    tenant_id: tenant.tenant_id,
    role: user.role === 'super_admin' ? 'super_admin' : tenant.role,
    tenant_name: tenant.name,
    tenant_type: tenant.type,
    username: user.displayName || user.email.split('@')[0],
    email: user.email,
    iat: now,
    exp: now + expiresIn,
    jti: crypto.randomUUID(),
  };
  const encoder = new TextEncoder();
  const encodedHeader = base64Url(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64Url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(env.DESKTOP_TOKEN_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(signingInput)
  );
  return {
    accessToken: `${signingInput}.${base64Url(new Uint8Array(signature))}`,
    expiresIn,
    tenantId: tenant.tenant_id,
  };
}

/**
 * Verifies a Google ID token server-side.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedClientId?: string
): Promise<GoogleProfile | null> {
  if (!idToken || typeof idToken !== 'string') {
    return null;
  }

  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      console.warn(`[Auth] Google token verification failed: HTTP ${res.status}`);
      return null;
    }

    const payload = (await res.json()) as {
      sub: string;
      email: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
      aud?: string;
      exp?: string | number;
    };

    if (!payload.sub || !payload.email || !expectedClientId || payload.aud !== expectedClientId ||
        ![true, 'true'].includes(payload.email_verified ?? false) || !payload.exp || !Number.isFinite(Number(payload.exp)) || Number(payload.exp) * 1000 <= Date.now()) {
      return null;
    }


    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    console.error('[Auth Error] Error verifying Google token:', err);
    return null;
  }
}

/**
 * Derives a PBKDF2 hash using Web Crypto API.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 50000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateVerificationCode(): string {
  const values = new Uint32Array(1);
  do { crypto.getRandomValues(values); } while (values[0] >= 4294800000);
  return String(100000 + values[0] % 900000);
}

export async function saveVerificationCode(env: Env, email: string, code: string, purpose = 'register'): Promise<void> {
  const db = requireDatabase(env);
  await db.batch([
    db.prepare('DELETE FROM email_verification_codes WHERE email = ? AND purpose = ?').bind(email.toLowerCase().trim(), purpose),
    db.prepare('INSERT INTO email_verification_codes (id, email, code, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(`code_${crypto.randomUUID()}`, email.toLowerCase().trim(), code, purpose, Date.now() + 600000, new Date().toISOString()),
  ]);
}

export async function verifyAndConsumeCode(env: Env, email: string, code: string, purpose = 'register'): Promise<boolean> {
  // Atomic consumption prevents concurrent requests reusing a verification code.
  const record = await requireDatabase(env).prepare(
    'DELETE FROM email_verification_codes WHERE email = ? AND purpose = ? AND code = ? AND expires_at > ? RETURNING id'
  ).bind(email.toLowerCase().trim(), purpose, code.trim(), Date.now()).first<{ id: string }>();
  return !!record;
}

export async function sendVerificationEmail(
  env: Env,
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) return { success: false, error: 'Email service is not configured' };

  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'VISIONGO <auth@visiongo.app>',
          to: [email],
          subject: `[VISIONGO] 注册验证码: ${code}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #09090b; color: #f4f4f5; border-radius: 16px; border: 1px solid #27272a;">
              <h2 style="color: #10b981; margin-top: 0; font-size: 20px;">VISIONGO 工业视觉智能平台</h2>
              <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">您正在申请注册或登录 VISIONGO 账户。请在页面中输入以下 6 位验证码：</p>
              <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff;">${code}</span>
              </div>
              <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        console.warn(`[Resend Error] Status ${res.status}`);
      } else {
        return { success: true };
      }
    } catch (err) {
      console.warn('[Resend Request Error]', err);
    }
  }

  return { success: false, error: 'Email delivery failed' };
}

/**
 * Creates a signed session cookie string using HMAC-SHA256.
 */
export async function createSessionCookie(
  userId: string,
  authSubject: string,
  secretKey?: string
): Promise<{ cookieHeader: string; sessionPayload: SessionPayload }> {
  if (!secretKey) throw new Error('SESSION_SECRET is not configured');
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const sessionPayload: SessionPayload = { userId, googleSub: authSubject, authSubject, exp };

  const encoder = new TextEncoder();
  const payloadJson = JSON.stringify(sessionPayload);
  const payloadB64 = btoa(payloadJson).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const keyData = encoder.encode(secretKey);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payloadB64));
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  const sigB64 = btoa(String.fromCharCode(...sigArray)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const token = `${payloadB64}.${sigB64}`;
  const maxAgeSec = 30 * 24 * 60 * 60;
  const cookieHeader = `vg_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;

  return { cookieHeader, sessionPayload };
}

/**
 * Verifies and parses a signed session cookie.
 */
export async function verifySessionCookie(
  cookieHeader: string | null,
  secretKey?: string
): Promise<SessionPayload | null> {
  if (!cookieHeader || !secretKey) return null;

  const match = cookieHeader.match(/(?:^|;\s*)vg_session=([^;]+)/);
  if (!match) return null;

  const token = match[1];
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const binarySig = atob(sigB64.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, encoder.encode(payloadB64));
    if (!isValid) return null;

    const decodedJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(decodedJson) as SessionPayload;

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Queries user by email across D1.
 */
export async function getUserByEmail(
  env: Env,
  email: string
): Promise<(User & { passwordHash?: string; passwordSalt?: string }) | null> {
  requireDatabase(env);
  const normalizedEmail = email.toLowerCase().trim();

  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        'SELECT id, tenant_id, role, google_sub, github_id, auth_provider, email, display_name, avatar_url, password_hash, password_salt, created_at, last_login_at FROM users WHERE LOWER(email) = ?'
      )
        .bind(normalizedEmail)
        .first<{
          id: string;
          tenant_id: string;
          role: 'super_admin' | 'org_admin' | 'member';
          google_sub: string | null;
          github_id: string | null;
          auth_provider: 'google' | 'github' | 'email' | null;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          password_hash: string | null;
          password_salt: string | null;
          created_at: string;
          last_login_at: string;
        }>();

      if (row) {
        return {
          id: row.id,
          tenantId: row.tenant_id,
          role: row.role,
          googleSub: row.google_sub || undefined,
          githubId: row.github_id || undefined,
          authProvider: row.auth_provider || 'email',
          email: row.email,
          displayName: row.display_name || undefined,
          avatarUrl: row.avatar_url || undefined,
          passwordHash: row.password_hash || undefined,
          passwordSalt: row.password_salt || undefined,
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at,
        };
      }
    } catch (err) {
      throw err;
    }
  }

  return null;
}

/**
 * Registers a new user via verified email and password.
 */
export async function registerUserWithEmail(
  env: Env,
  email: string,
  password: string,
  displayName?: string
): Promise<{ user?: User; error?: string }> {
  requireDatabase(env);
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await getUserByEmail(env, normalizedEmail);
  if (existing) {
    return { error: '该邮箱已被注册，请直接登录' };
  }

  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  const now = new Date().toISOString();
  const newUserId = `vg_usr_${crypto.randomUUID().slice(0, 12)}`;
  const tenantId = `vg_tenant_${crypto.randomUUID().slice(0, 12)}`;
  const finalDisplayName = displayName?.trim() || normalizedEmail.split('@')[0];

  const newUser: User & { passwordHash: string; passwordSalt: string } = {
    id: newUserId,
    tenantId,
    role: 'member',
    email: normalizedEmail,
    displayName: finalDisplayName,
    authProvider: 'email',
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now,
    lastLoginAt: now,
  };

  if (env.DB) {
    try {
      const syntheticSub = `email:${normalizedEmail}`;
      await env.DB.prepare(
        'INSERT INTO users (id, tenant_id, role, google_sub, auth_provider, email, display_name, password_hash, password_salt, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(
          newUserId,
          tenantId,
          'member',
          syntheticSub,
          'email',
          normalizedEmail,
          finalDisplayName,
          hash,
          salt,
          now,
          now
        )
        .run();
    } catch (err) {
      throw err;
    }
  }

  return { user: newUser };
}

/**
 * Validates email and password, returning user if valid.
 */
export async function loginUserWithEmail(
  env: Env,
  email: string,
  password: string
): Promise<{ user?: User; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const userRecord = await getUserByEmail(env, normalizedEmail);
  if (!userRecord || !userRecord.passwordHash || !userRecord.passwordSalt) {
    return { error: '邮箱或密码错误，请重试' };
  }

  const computedHash = await hashPassword(password, userRecord.passwordSalt);
  if (computedHash !== userRecord.passwordHash) {
    return { error: '邮箱或密码错误，请重试' };
  }

  const now = new Date().toISOString();
  if (env.DB) {
    try {
      await env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
        .bind(now, userRecord.id)
        .run();
    } catch {
      // Ignore update error
    }
  }
  userRecord.lastLoginAt = now;

  return { user: userRecord };
}

export interface GitHubProfile {
  id: string | number;
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

/**
 * Upserts a GitHub OAuth user into D1.
 */
export async function getOrCreateGitHubUser(
  env: Env,
  profile: GitHubProfile
): Promise<User> {
  requireDatabase(env);
  const now = new Date().toISOString();
  const githubId = String(profile.id);
  const email = (profile.email || `${profile.login}@users.noreply.github.com`).toLowerCase().trim();
  const displayName = profile.name || profile.login;
  const avatarUrl = profile.avatar_url;

  if (env.DB) {
    try {
      const existing = await env.DB.prepare(
        'SELECT id, tenant_id, role, google_sub, github_id, email, display_name, avatar_url, created_at, last_login_at FROM users WHERE github_id = ? OR (google_sub = ?)'
      )
        .bind(githubId, `github:${githubId}`)
        .first<{
          id: string;
          tenant_id: string;
          role: 'super_admin' | 'org_admin' | 'member';
          google_sub: string | null;
          github_id: string | null;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          last_login_at: string;
        }>();

      if (existing) {
        await env.DB.prepare(
          'UPDATE users SET last_login_at = ?, display_name = ?, avatar_url = ?, github_id = ? WHERE id = ?'
        )
          .bind(now, displayName, avatarUrl || existing.avatar_url, githubId, existing.id)
          .run();

        return {
          id: existing.id,
          tenantId: existing.tenant_id,
          role: existing.role,
          githubId,
          authProvider: 'github',
          email: existing.email,
          displayName,
          avatarUrl: avatarUrl || existing.avatar_url || undefined,
          createdAt: existing.created_at,
          lastLoginAt: now,
        };
      }

      const newUserId = `vg_usr_${crypto.randomUUID().slice(0, 12)}`;
      const tenantId = `vg_tenant_${crypto.randomUUID().slice(0, 12)}`;
      const syntheticSub = `github:${githubId}`;
      await env.DB.prepare(
        'INSERT INTO users (id, tenant_id, role, google_sub, github_id, auth_provider, email, display_name, avatar_url, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(newUserId, tenantId, 'member', syntheticSub, githubId, 'github', email, displayName, avatarUrl || null, now, now)
        .run();

      return {
        id: newUserId,
        tenantId,
        role: 'member',
        githubId,
        authProvider: 'github',
        email,
        displayName,
        avatarUrl,
        createdAt: now,
        lastLoginAt: now,
      };
    } catch (err) {
      throw err;
    }
  }

  throw new Error('Identity persistence unavailable');
}

/**
 * Upserts a Google user in Cloudflare D1. Database errors fail authentication.
 */
export async function getOrCreateUser(
  env: Env,
  profile: GoogleProfile
): Promise<User> {
  requireDatabase(env);
  const now = new Date().toISOString();

  if (env.DB) {
    try {
      const existing = await env.DB.prepare(
        'SELECT id, tenant_id, role, google_sub, email, display_name, avatar_url, created_at, last_login_at FROM users WHERE google_sub = ?'
      )
        .bind(profile.sub)
        .first<{
          id: string;
          tenant_id: string;
          role: 'super_admin' | 'org_admin' | 'member';
          google_sub: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          last_login_at: string;
        }>();

      if (existing) {
        await env.DB.prepare(
          'UPDATE users SET last_login_at = ?, display_name = ?, avatar_url = ? WHERE id = ?'
        )
          .bind(now, profile.name || existing.display_name, profile.picture || existing.avatar_url, existing.id)
          .run();

        return {
          id: existing.id,
          tenantId: existing.tenant_id,
          role: existing.role,
          googleSub: existing.google_sub,
          authProvider: 'google',
          email: existing.email,
          displayName: profile.name || existing.display_name || undefined,
          avatarUrl: profile.picture || existing.avatar_url || undefined,
          createdAt: existing.created_at,
          lastLoginAt: now,
        };
      }

      // Create new user with internal UUID
      const newUserId = `vg_usr_${crypto.randomUUID().slice(0, 12)}`;
      const tenantId = `vg_tenant_${crypto.randomUUID().slice(0, 12)}`;
      await env.DB.prepare(
        'INSERT INTO users (id, tenant_id, role, google_sub, auth_provider, email, display_name, avatar_url, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(newUserId, tenantId, 'member', profile.sub, 'google', profile.email, profile.name || null, profile.picture || null, now, now)
        .run();

      return {
        id: newUserId,
        tenantId,
        role: 'member',
        googleSub: profile.sub,
        authProvider: 'google',
        email: profile.email,
        displayName: profile.name,
        avatarUrl: profile.picture,
        createdAt: now,
        lastLoginAt: now,
      };
    } catch (err) {
      throw err;
    }
  }

  throw new Error('Identity persistence unavailable');
}

/**
 * Loads a user by their internal UUID from D1.
 */
export async function getUserById(env: Env, userId: string): Promise<User | null> {
  requireDatabase(env);
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        'SELECT id, tenant_id, role, google_sub, github_id, auth_provider, email, display_name, avatar_url, created_at, last_login_at FROM users WHERE id = ?'
      )
        .bind(userId)
        .first<{
          id: string;
          tenant_id: string;
          role: 'super_admin' | 'org_admin' | 'member';
          google_sub: string | null;
          github_id: string | null;
          auth_provider: 'google' | 'github' | 'email' | null;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          last_login_at: string;
        }>();

      if (row) {
        // Reject historical sessions minted by the removed unauthenticated demo endpoint.
        if (row.github_id === 'gh_demo_1092834' || row.google_sub === 'github:gh_demo_1092834') return null;
        return {
          id: row.id,
          tenantId: row.tenant_id,
          role: row.role,
          googleSub: row.google_sub || undefined,
          githubId: row.github_id || undefined,
          authProvider: row.auth_provider || 'google',
          email: row.email,
          displayName: row.display_name || undefined,
          avatarUrl: row.avatar_url || undefined,
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at,
        };
      }
    } catch (err) {
      throw err;
    }
  }

  return null;
}

/**
 * Records an authenticated software download in D1.
 */
export async function recordUserDownloadHistory(
  env: Env,
  userId: string,
  product: SupportedProduct,
  version: string,
  assetName: string
): Promise<void> {
  if (!env.DB || !userId) return;

  try {
    const historyId = `dl_${crypto.randomUUID().slice(0, 12)}`;
    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO user_download_history (id, user_id, product, version, asset_name, downloaded_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(historyId, userId, product, version, assetName, now)
      .run();
  } catch (err) {
    console.warn('[D1 Download History] Non-fatal error recording history:', err);
  }
}

/**
 * Retrieves download history for an authenticated user.
 */
export async function getUserDownloadHistory(
  env: Env,
  userId: string
): Promise<UserDownloadRecord[]> {
  if (!env.DB || !userId) return [];

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, user_id, product, version, asset_name, downloaded_at FROM user_download_history WHERE user_id = ? ORDER BY downloaded_at DESC LIMIT 50'
    )
      .bind(userId)
      .all<{
        id: string;
        user_id: string;
        product: string;
        version: string;
        asset_name: string;
        downloaded_at: string;
      }>();

    return (results || []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      product: r.product as SupportedProduct,
      version: r.version,
      assetName: r.asset_name,
      downloadedAt: r.downloaded_at,
    }));
  } catch (err) {
    console.warn('[D1 getUserDownloadHistory Warning]:', err);
    return [];
  }
}

// =========================================================================
// OAuth 2.0 PKCE & Refresh Token Utilities for Desktop Client
// =========================================================================

export interface DesktopAuthCodePayload {
  type: 'desktop_auth_code';
  userId: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256' | 'plain';
  /** Organization chosen on the authorization page; absent for older pages. */
  tenantId?: string;
  exp: number; // Unix ms
  jti: string;
}

export interface DesktopRefreshTokenPayload {
  type: 'desktop_refresh_token';
  userId: string;
  /** Organization the session is bound to; absent in tokens issued before organizations. */
  tenantId?: string;
  exp: number; // Unix ms
  jti: string;
}

export async function createDesktopAuthCode(
  user: User,
  codeChallenge: string,
  codeChallengeMethod: 'S256' | 'plain' = 'S256',
  secretKey?: string,
  tenantId?: string
): Promise<string> {
  if (!secretKey) throw new Error('SESSION_SECRET is not configured');
  const payload: DesktopAuthCodePayload = {
    type: 'desktop_auth_code',
    userId: user.id,
    codeChallenge,
    codeChallengeMethod,
    tenantId,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes lifetime
    jti: crypto.randomUUID(),
  };

  const signed = await signHmacSha256(JSON.stringify(payload), secretKey);
  return `vg_ac_${signed}`;
}

export async function verifyDesktopAuthCode(
  code: string,
  secretKey?: string
): Promise<DesktopAuthCodePayload | null> {
  if (!secretKey || !code || !code.startsWith('vg_ac_')) return null;
  const tokenBody = code.slice('vg_ac_'.length);
  const jsonStr = await verifyHmacSha256(tokenBody, secretKey);
  if (!jsonStr) return null;

  try {
    const payload = JSON.parse(jsonStr) as DesktopAuthCodePayload;
    if (payload.type !== 'desktop_auth_code') return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function verifyPkceChallenge(
  codeVerifier: string,
  codeChallenge: string,
  method: 'S256' | 'plain' = 'S256'
): Promise<boolean> {
  if (!codeVerifier || !codeChallenge) return false;
  if (method === 'plain') {
    return codeVerifier === codeChallenge;
  }
  if (method === 'S256') {
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier));
    const calculatedChallenge = base64Url(new Uint8Array(hash));
    return calculatedChallenge === codeChallenge;
  }
  return false;
}

export async function createDesktopRefreshToken(
  user: User,
  secretKey: string | undefined,
  tenantId: string
): Promise<string> {
  if (!secretKey) throw new Error('SESSION_SECRET is not configured');
  const payload: DesktopRefreshTokenPayload = {
    type: 'desktop_refresh_token',
    userId: user.id,
    tenantId,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    jti: crypto.randomUUID(),
  };

  const signed = await signHmacSha256(JSON.stringify(payload), secretKey);
  return `vg_rf_${signed}`;
}

export async function verifyDesktopRefreshToken(
  refreshToken: string,
  secretKey?: string
): Promise<DesktopRefreshTokenPayload | null> {
  if (!secretKey || !refreshToken || !refreshToken.startsWith('vg_rf_')) return null;
  const tokenBody = refreshToken.slice('vg_rf_'.length);
  const jsonStr = await verifyHmacSha256(tokenBody, secretKey);
  if (!jsonStr) return null;

  try {
    const payload = JSON.parse(jsonStr) as DesktopRefreshTokenPayload;
    if (payload.type !== 'desktop_refresh_token') return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

async function signHmacSha256(payloadStr: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const payloadB64 = base64Url(encoder.encode(payloadStr));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payloadB64));
  const sigB64 = base64Url(new Uint8Array(sigBuffer));
  return `${payloadB64}.${sigB64}`;
}

async function verifyHmacSha256(token: string, secretKey: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  try {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const binarySig = atob(sigB64.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) sigBytes[i] = binarySig.charCodeAt(i);

    const isValid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, encoder.encode(payloadB64));
    if (!isValid) return null;

    const decoded = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    return decoded;
  } catch {
    return null;
  }
}
