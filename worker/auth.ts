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

import { Env, User, UserDownloadRecord, SupportedProduct } from './types';

export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface SessionPayload {
  userId: string;
  googleSub: string;
  exp: number; // Unix timestamp in ms
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

    if (!payload.sub || !payload.email) {
      return null;
    }

    // Verify Audience if GOOGLE_CLIENT_ID is configured
    if (expectedClientId && payload.aud && payload.aud !== expectedClientId) {
      console.warn(`[Auth] Google token audience mismatch: expected ${expectedClientId}, got ${payload.aud}`);
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
 * Creates a signed session cookie string using HMAC-SHA256.
 */
export async function createSessionCookie(
  userId: string,
  googleSub: string,
  secretKey: string
): Promise<{ cookieHeader: string; sessionPayload: SessionPayload }> {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const sessionPayload: SessionPayload = { userId, googleSub, exp };

  const encoder = new TextEncoder();
  const payloadJson = JSON.stringify(sessionPayload);
  const payloadB64 = btoa(payloadJson).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const keyData = encoder.encode(secretKey || 'visiongo-session-secret-2026');
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
  secretKey: string
): Promise<SessionPayload | null> {
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|;\s*)vg_session=([^;]+)/);
  if (!match) return null;

  const token = match[1];
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey || 'visiongo-session-secret-2026');
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Reconstruct signature binary
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
      return null; // Expired session
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Upserts a user in Cloudflare D1. Falls back to mock state if DB is not bound.
 */
export async function getOrCreateUser(
  env: Env,
  profile: GoogleProfile
): Promise<User> {
  const now = new Date().toISOString();

  if (env.DB) {
    try {
      const existing = await env.DB.prepare(
        'SELECT id, google_sub, email, display_name, avatar_url, created_at, last_login_at FROM users WHERE google_sub = ?'
      )
        .bind(profile.sub)
        .first<{
          id: string;
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
          googleSub: existing.google_sub,
          email: existing.email,
          displayName: profile.name || existing.display_name || undefined,
          avatarUrl: profile.picture || existing.avatar_url || undefined,
          createdAt: existing.created_at,
          lastLoginAt: now,
        };
      }

      // Create new user with internal UUID
      const newUserId = `vg_usr_${crypto.randomUUID().slice(0, 12)}`;
      await env.DB.prepare(
        'INSERT INTO users (id, google_sub, email, display_name, avatar_url, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(newUserId, profile.sub, profile.email, profile.name || null, profile.picture || null, now, now)
        .run();

      return {
        id: newUserId,
        googleSub: profile.sub,
        email: profile.email,
        displayName: profile.name,
        avatarUrl: profile.picture,
        createdAt: now,
        lastLoginAt: now,
      };
    } catch (err) {
      console.warn('[D1 Auth Warning] Failed to query D1 database, using fallback:', err);
    }
  }

  // Graceful fallback when D1 is not yet provisioned
  return {
    id: `vg_usr_demo_${profile.sub.slice(0, 8)}`,
    googleSub: profile.sub,
    email: profile.email,
    displayName: profile.name || profile.email.split('@')[0],
    avatarUrl: profile.picture,
    createdAt: now,
    lastLoginAt: now,
  };
}

/**
 * Loads a user by their internal UUID from D1.
 */
export async function getUserById(env: Env, userId: string): Promise<User | null> {
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        'SELECT id, google_sub, email, display_name, avatar_url, created_at, last_login_at FROM users WHERE id = ?'
      )
        .bind(userId)
        .first<{
          id: string;
          google_sub: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          last_login_at: string;
        }>();

      if (row) {
        return {
          id: row.id,
          googleSub: row.google_sub,
          email: row.email,
          displayName: row.display_name || undefined,
          avatarUrl: row.avatar_url || undefined,
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at,
        };
      }
    } catch (err) {
      console.warn('[D1 getUserById Warning]:', err);
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
