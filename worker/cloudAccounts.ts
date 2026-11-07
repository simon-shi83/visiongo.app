/**
 * Organization credits, ledger and usage kept by VisionCloud, for the account page.
 *
 * The browser calls /api/orgs/{id}/credits[/transactions|/usage] with its session
 * cookie; this module checks the membership, signs a desktop access token for the
 * user and that organization (aud visioncloud) and reads VisionCloud's
 * /v1/accounts/{id} endpoints (SDK schemas/credits.json; fields checked against
 * SDK/tests/golden/credits). The browser never talks to VisionCloud.
 *
 * - credits and transactions: organization administrators and platform administrators;
 * - usage: every active member; VisionCloud returns a member's own usage only.
 */
import { createDesktopAccessToken } from './auth';
import { requireDatabase } from './reliability';
import { loadOrganization, resolveTenant } from './organizations';
import type { Env, TenantSummary, User } from './types';

const CLOUD_TIMEOUT_MS = 10_000;
const PATH = /^\/api\/orgs\/([A-Za-z0-9_-]{1,128})\/credits(?:\/(transactions|usage))?$/;
// Query parameters forwarded to VisionCloud, per view (SDK credits endpoints).
const FORWARDED: Record<string, string[]> = {
  account: [],
  transactions: ['type', 'from', 'to', 'cursor', 'limit'],
  usage: ['from', 'to'],
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/**
 * VisionCloud base URL of this edition, or null when the edition has none.
 * CLOUD_API_URL names it for the server; without it the address the desktop
 * clients are given (CLOUD_BASE_URL) is the same VisionCloud.
 */
export function cloudApiUrl(env: Env): string | null {
  const value = (env.CLOUD_API_URL || env.CLOUD_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!value) return null;
  try {
    return new URL(value).protocol === 'https:' || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

/** The organization as the token's tenant, with the caller's role in it; null when not allowed. */
async function tenantFor(env: Env, user: User, orgId: string): Promise<TenantSummary | null> {
  const resolved = await resolveTenant(env, user, orgId);
  if (resolved) return resolved.tenant;
  if (user.role !== 'super_admin') return null;
  // Platform administrators read any organization; the token keeps role super_admin.
  const organization = await loadOrganization(env, orgId);
  return organization ? { tenant_id: organization.id, name: organization.name, type: organization.type, role: 'org_admin' } : null;
}

/** user_id -> display name and email of the users in a usage summary. */
async function usageUsers(env: Env, ids: string[]): Promise<Record<string, { name: string; email: string }>> {
  if (!ids.length) return {};
  const placeholders = ids.map(() => '?').join(',');
  const { results } = await requireDatabase(env).prepare(
    `SELECT id, display_name, email FROM users WHERE id IN (${placeholders})`
  ).bind(...ids).all<{ id: string; display_name: string | null; email: string }>();
  const users: Record<string, { name: string; email: string }> = {};
  for (const row of results || []) users[row.id] = { name: row.display_name || row.email.split('@')[0], email: row.email };
  return users;
}

/** Handles /api/orgs/{id}/credits*; returns null for other paths. */
export async function handleCloudAccountApi(request: Request, env: Env, url: URL, user: User): Promise<Response | null> {
  const match = url.pathname.match(PATH);
  if (!match) return null;
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const [, orgId, view = 'account'] = match;

  const base = cloudApiUrl(env);
  if (!base) return json({ error: 'credits_unavailable' }, 404);
  const tenant = await tenantFor(env, user, orgId);
  if (!tenant) return json({ error: 'Organization membership required' }, 403);
  const admin = user.role === 'super_admin' || tenant.role === 'org_admin';
  if (view !== 'usage' && !admin) return json({ error: 'Organization administrator required' }, 403);

  const query = new URLSearchParams();
  for (const name of FORWARDED[view]) {
    const value = url.searchParams.get(name);
    if (value !== null && value.length <= 64) query.set(name, value);
  }
  const suffix = view === 'account' ? '' : `/${view}`;
  const target = `${base}/v1/accounts/${encodeURIComponent(orgId)}${suffix}${query.size ? `?${query}` : ''}`;

  let response: Response;
  try {
    const token = await createDesktopAccessToken(env, user, tenant);
    response = await fetch(target, {
      headers: { Authorization: `Bearer ${token.accessToken}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(CLOUD_TIMEOUT_MS),
    });
  } catch (error) {
    console.error('[Cloud Accounts] request failed:', error);
    return json({ error: 'cloud_unavailable' }, 502);
  }
  const body = await response.json().catch(() => null) as Record<string, any> | null;
  if (!response.ok || !body) {
    // VisionCloud answers SDK CreditsErrorResponse; anything else is an outage.
    if (body && typeof body.error === 'string' && response.status < 500) return json(body, response.status);
    return json({ error: 'cloud_unavailable' }, 502);
  }
  if (view === 'usage' && Array.isArray(body.by_user)) {
    body.users = await usageUsers(env, body.by_user.map((row: { user_id: string }) => row.user_id).slice(0, 1000));
  }
  return json({ ...body, viewer_is_admin: admin });
}

const REPORT_ATTEMPTS = [0, 500, 1500];  // delays before each attempt, ms
const REPORT_TIMEOUT_MS = 4_000;

/**
 * Reports the organization's AI data authorization to VisionCloud (SDK credits
 * 3) with a token signed for the reporting administrator in that organization,
 * whose ai_data_authorized claim says the same. Retried a few times; a report
 * still unconfirmed is sent again when an administrator next opens the
 * organization (retryAiDataAuthorizationReport). True once VisionCloud
 * confirmed the setting now saved; null when the edition has no VisionCloud.
 */
export async function reportAiDataAuthorization(env: Env, user: User, orgId: string,
                                                attempts: number[] = REPORT_ATTEMPTS): Promise<boolean | null> {
  const base = cloudApiUrl(env);
  if (!base) return null;
  const db = requireDatabase(env);
  const row = await db.prepare('SELECT ai_data_authorized, ai_data_authorized_at FROM organizations WHERE id = ?')
    .bind(orgId).first<{ ai_data_authorized: number | null; ai_data_authorized_at: string | null }>();
  const tenant = await tenantFor(env, user, orgId);
  if (!row || !row.ai_data_authorized_at || !tenant) return false;
  const authorized = row.ai_data_authorized === 1;
  const body = JSON.stringify({ authorized, changed_at: Date.parse(row.ai_data_authorized_at) });
  const target = `${base}/v1/accounts/${encodeURIComponent(orgId)}/ai-data-authorization`;

  for (const delay of attempts) {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    try {
      const token = await createDesktopAccessToken(env, user, tenant, authorized);
      const response = await fetch(target, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body,
        signal: AbortSignal.timeout(REPORT_TIMEOUT_MS),
      });
      if (response.ok) {
        // Confirmed for this change only: a newer change is reported by its own request.
        await db.prepare('UPDATE organizations SET ai_data_authorization_synced_at = ? WHERE id = ? AND ai_data_authorized_at = ?')
          .bind(new Date().toISOString(), orgId, row.ai_data_authorized_at).run();
        return true;
      }
      console.warn(`[Cloud Accounts] AI data authorization report for ${orgId} refused with ${response.status}`);
      if (response.status < 500 && response.status !== 429) return false;
    } catch (error) {
      console.warn(`[Cloud Accounts] AI data authorization report for ${orgId} failed:`, error);
    }
  }
  return false;
}

/** Sends an unconfirmed report again; the organization row says whether one is pending. */
export async function retryAiDataAuthorizationReport(env: Env, user: User, orgId: string,
                                                     organization: { ai_data_authorized_at?: string | null; ai_data_authorization_synced_at?: string | null }): Promise<boolean | null> {
  if (!cloudApiUrl(env) || !organization.ai_data_authorized_at) return null;
  if (organization.ai_data_authorization_synced_at && organization.ai_data_authorization_synced_at >= organization.ai_data_authorized_at) return true;
  return reportAiDataAuthorization(env, user, orgId, [0]);  // one attempt: the page is waiting
}
