/**
 * Organizations and memberships.
 *
 * The website is the only place that knows who belongs to which organization.
 * Desktop access tokens carry the organization the user selected, so
 * VisionCloud and VisionWeb never look memberships up themselves.
 *
 * - Every user has a personal organization (users.tenant_id) that they administer.
 * - Enterprise organizations are created by a platform administrator.
 * - Members are added by email: an existing account joins at once, any other email
 *   joins when it signs up or signs in with that verified email.
 */

import type { Env, TenantSummary, User } from './types';
import { json, requireDatabase } from './reliability';
import { getSessionUser } from './auth';
import { cloudApiUrl, handleCloudAccountApi, reportAiDataAuthorization, retryAiDataAuthorizationReport } from './cloudAccounts';

type MemberRole = 'admin' | 'member';
type MemberStatus = 'invited' | 'active' | 'removed';

export interface OrganizationRow {
  id: string;
  name: string;
  type: 'personal' | 'enterprise';
  status: 'active' | 'suspended';
  /** 1 when the organization lets VisionCloud use its data for AI (0007). */
  ai_data_authorized?: number;
  /** Members and pending invitations (platform administrator listing only). */
  member_count?: number;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 256;

function now(): string {
  return new Date().toISOString();
}

function personalName(user: User): string {
  return user.displayName || user.email.split('@')[0];
}

async function recordEvent(env: Env, orgId: string, actor: string | null, action: string,
                           targetEmail?: string, detail?: string): Promise<void> {
  await requireDatabase(env).prepare(
    'INSERT INTO organization_events (id, org_id, actor_user_id, action, target_email, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(`evt_${crypto.randomUUID()}`, orgId, actor, action, targetEmail ?? null, detail ?? null, now()).run();
}

/** Creates the personal organization of a user who signed up before organizations existed. */
export async function ensurePersonalOrganization(env: Env, user: User): Promise<void> {
  const db = requireDatabase(env);
  const timestamp = now();
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO organizations (id, name, type, status, created_by, created_at) VALUES (?, ?, 'personal', 'active', ?, ?)")
      .bind(user.tenantId, personalName(user), user.id, timestamp),
    db.prepare("INSERT OR IGNORE INTO organization_members (org_id, email, user_id, role, status, invited_by, created_at, joined_at, updated_at) VALUES (?, ?, ?, 'admin', 'active', NULL, ?, ?, ?)")
      .bind(user.tenantId, user.email.toLowerCase(), user.id, timestamp, timestamp, timestamp),
  ]);
}

/**
 * Activates pending invitations for the user's email. Every sign-in method
 * accepts only provider-verified or code-verified emails, so the email proves
 * ownership of the invitation.
 */
async function acceptInvitations(env: Env, user: User): Promise<void> {
  const timestamp = now();
  const { results } = await requireDatabase(env).prepare(
    "UPDATE organization_members SET user_id = ?, status = 'active', joined_at = ?, updated_at = ? WHERE email = ? AND status = 'invited' RETURNING org_id"
  ).bind(user.id, timestamp, timestamp, user.email.toLowerCase()).all<{ org_id: string }>();
  const joined = results?.[0]?.org_id;
  if (joined) await preferOrganization(env, user.id, joined);
}

/**
 * Someone who joins an enterprise organization works in it from then on: it becomes
 * the default of the next desktop sign-in, unless they already chose another
 * enterprise organization (a personal organization picked by default is replaced).
 */
async function preferOrganization(env: Env, userId: string, orgId: string): Promise<void> {
  await requireDatabase(env).prepare(
    `UPDATE users SET last_tenant_id = ? WHERE id = ? AND (last_tenant_id IS NULL OR last_tenant_id = tenant_id
       OR last_tenant_id NOT IN (SELECT id FROM organizations WHERE type = 'enterprise'))`
  ).bind(orgId, userId).run();
}

/** Active organizations the user may act in; the personal organization comes first. */
export async function listTenants(env: Env, user: User): Promise<TenantSummary[]> {
  await ensurePersonalOrganization(env, user);
  await acceptInvitations(env, user);
  const { results } = await requireDatabase(env).prepare(
    `SELECT o.id, o.name, o.type, m.role FROM organization_members m
     JOIN organizations o ON o.id = m.org_id
     WHERE m.user_id = ? AND m.status = 'active' AND o.status = 'active'
     ORDER BY CASE o.type WHEN 'personal' THEN 0 ELSE 1 END, o.name`
  ).bind(user.id).all<{ id: string; name: string; type: 'personal' | 'enterprise'; role: MemberRole }>();
  return (results || []).map(row => ({
    tenant_id: row.id,
    name: row.name,
    type: row.type,
    role: row.role === 'admin' ? 'org_admin' : 'member',
  }));
}

export interface ResolvedTenant {
  tenant: TenantSummary;
  tenants: TenantSummary[];
  /** The selected organization's data authorization for VisionCloud AI (token claim ai_data_authorized). */
  aiDataAuthorized: boolean;
}

/** Whether the organization lets VisionCloud use its data for AI; off unless an administrator turned it on. */
export async function aiDataAuthorized(env: Env, orgId: string): Promise<boolean> {
  const row = await requireDatabase(env).prepare('SELECT ai_data_authorized FROM organizations WHERE id = ?')
    .bind(orgId).first<{ ai_data_authorized: number | null }>();
  return row?.ai_data_authorized === 1;
}

/**
 * Picks the organization for a desktop token. An explicit request must name an
 * organization the user is an active member of; otherwise the last used one,
 * else the personal organization. Returns null when the request is not allowed.
 */
export async function resolveTenant(env: Env, user: User, requested?: string | null): Promise<ResolvedTenant | null> {
  const tenants = await listTenants(env, user);
  const find = (id?: string | null) => (id ? tenants.find(item => item.tenant_id === id) : undefined);
  if (requested) {
    const tenant = find(requested);
    return tenant ? { tenant, tenants, aiDataAuthorized: await aiDataAuthorized(env, tenant.tenant_id) } : null;
  }
  const row = await requireDatabase(env).prepare('SELECT last_tenant_id FROM users WHERE id = ?')
    .bind(user.id).first<{ last_tenant_id: string | null }>();
  // Without a remembered choice an enterprise organization comes before the personal one:
  // that is where invited engineers' work and AI data authorization live.
  const tenant = find(row?.last_tenant_id) || tenants.find(item => item.type === 'enterprise') || find(user.tenantId) || tenants[0];
  return tenant ? { tenant, tenants, aiDataAuthorized: await aiDataAuthorized(env, tenant.tenant_id) } : null;
}

export async function rememberTenant(env: Env, userId: string, tenantId: string): Promise<void> {
  await requireDatabase(env).prepare('UPDATE users SET last_tenant_id = ? WHERE id = ?').bind(tenantId, userId).run();
}

/** Role claim of the desktop token: platform administrators keep super_admin everywhere. */
export function effectiveRole(user: User, tenant: TenantSummary): 'member' | 'org_admin' | 'super_admin' {
  return user.role === 'super_admin' ? 'super_admin' : tenant.role;
}

// ===========================================================================
// Browser API for the account page (session cookie). Not used by desktop clients.
// ===========================================================================

export async function loadOrganization(env: Env, orgId: string): Promise<OrganizationRow | null> {
  return requireDatabase(env).prepare('SELECT id, name, type, status, ai_data_authorized FROM organizations WHERE id = ?')
    .bind(orgId).first<OrganizationRow>();
}

async function isActiveAdmin(env: Env, orgId: string, userId: string): Promise<boolean> {
  const row = await requireDatabase(env).prepare(
    "SELECT 1 AS ok FROM organization_members WHERE org_id = ? AND user_id = ? AND status = 'active' AND role = 'admin'"
  ).bind(orgId, userId).first<{ ok: number }>();
  return !!row;
}

async function activeAdminCount(env: Env, orgId: string): Promise<number> {
  const row = await requireDatabase(env).prepare(
    "SELECT count(*) AS n FROM organization_members WHERE org_id = ? AND status = 'active' AND role = 'admin'"
  ).bind(orgId).first<{ n: number }>();
  return row?.n ?? 0;
}

async function accountIdByEmail(env: Env, email: string): Promise<string | null> {
  const row = await requireDatabase(env).prepare('SELECT id FROM users WHERE LOWER(email) = ? ORDER BY created_at, id LIMIT 1')
    .bind(email.toLowerCase()).first<{ id: string }>();
  return row?.id ?? null;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  return body && typeof body === 'object' ? body as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseRole(value: unknown): MemberRole | null {
  return value === 'admin' || value === 'member' ? value : null;
}

/** Handles /api/orgs and /api/orgs/{id}/...; returns null for other paths. */
export async function handleOrganizationApi(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (url.pathname !== '/api/orgs' && !url.pathname.startsWith('/api/orgs/')) return null;
  const user = await getSessionUser(env, request.headers.get('Cookie'));
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const platformAdmin = user.role === 'super_admin';
  const credits = await handleCloudAccountApi(request, env, url, user);
  if (credits) return credits;

  if (url.pathname === '/api/orgs' && request.method === 'GET') {
    const tenants = await listTenants(env, user);
    const resolved = await resolveTenant(env, user);
    let organizations: OrganizationRow[] | undefined;
    if (platformAdmin) {
      const { results } = await requireDatabase(env).prepare(
        `SELECT o.id, o.name, o.type, o.status,
                (SELECT count(*) FROM organization_members m WHERE m.org_id = o.id AND m.status <> 'removed') AS member_count
         FROM organizations o WHERE o.type = 'enterprise' ORDER BY o.name`
      ).all<OrganizationRow>();
      organizations = results || [];
    }
    return json({ tenants, current_tenant_id: resolved?.tenant.tenant_id ?? null,
                  is_platform_admin: platformAdmin, organizations, credits_available: cloudApiUrl(env) !== null,
                  // Where platform administrators open VisionCloud accounts and add credits.
                  cloud_admin_url: platformAdmin && cloudApiUrl(env) ? `${cloudApiUrl(env)}/v1/admin` : null });
  }

  if (url.pathname === '/api/orgs' && request.method === 'POST') {
    if (!platformAdmin) return json({ error: 'Only platform administrators can create organizations' }, 403);
    const body = await readBody(request);
    const name = text(body.name);
    const adminEmail = text(body.admin_email).toLowerCase();
    if (!name || name.length > MAX_NAME || !EMAIL.test(adminEmail)) {
      return json({ error: 'name and a valid admin_email are required' }, 400);
    }
    const db = requireDatabase(env);
    const id = `org_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const timestamp = now();
    const account = await accountIdByEmail(env, adminEmail);
    await db.batch([
      db.prepare("INSERT INTO organizations (id, name, type, status, created_by, created_at) VALUES (?, ?, 'enterprise', 'active', ?, ?)")
        .bind(id, name, user.id, timestamp),
      db.prepare("INSERT INTO organization_members (org_id, email, user_id, role, status, invited_by, created_at, joined_at, updated_at) VALUES (?, ?, ?, 'admin', ?, ?, ?, ?, ?)")
        .bind(id, adminEmail, account, account ? 'active' : 'invited', user.id, timestamp, account ? timestamp : null, timestamp),
    ]);
    if (account) await preferOrganization(env, account, id);
    await recordEvent(env, id, user.id, 'organization.created', adminEmail, name);
    return json({ organization: { id, name, type: 'enterprise', status: 'active' } }, 201);
  }

  const match = url.pathname.match(/^\/api\/orgs\/([A-Za-z0-9_-]{1,128})\/(members|members\/role|members\/remove|status|ai-data-authorization)$/);
  if (!match) return json({ error: 'Not found' }, 404);
  const [, orgId, action] = match;
  const organization = await loadOrganization(env, orgId);
  if (!organization) return json({ error: 'Organization not found' }, 404);
  const admin = platformAdmin || await isActiveAdmin(env, orgId, user.id);
  if (!admin) return json({ error: 'Organization administrator required' }, 403);
  const db = requireDatabase(env);

  if (action === 'members' && request.method === 'GET') {
    const { results } = await db.prepare(
      `SELECT m.email, m.user_id, m.role, m.status, m.joined_at, u.display_name
       FROM organization_members m LEFT JOIN users u ON u.id = m.user_id
       WHERE m.org_id = ? AND m.status <> 'removed'
       ORDER BY CASE m.role WHEN 'admin' THEN 0 ELSE 1 END, m.email`
    ).bind(orgId).all();
    const sync = await db.prepare('SELECT ai_data_authorized_at, ai_data_authorization_synced_at FROM organizations WHERE id = ?')
      .bind(orgId).first<{ ai_data_authorized_at: string | null; ai_data_authorization_synced_at: string | null }>();
    const cloudSynced = sync ? await retryAiDataAuthorizationReport(env, user, orgId, sync) : null;
    return json({ organization: { ...organization, cloud_synced: cloudSynced }, members: results || [] });
  }

  // The organization's administrators decide whether VisionCloud may use its data
  // for AI; desktop tokens issued from now on carry the choice (ai_data_authorized),
  // and VisionCloud is told at once (SDK credits 3).
  if (action === 'ai-data-authorization' && request.method === 'POST') {
    const authorized = (await readBody(request)).authorized;
    if (typeof authorized !== 'boolean') return json({ error: 'authorized must be true or false' }, 400);
    const timestamp = now();
    await db.prepare('UPDATE organizations SET ai_data_authorized = ?, ai_data_authorized_at = ?, ai_data_authorized_by = ? WHERE id = ?')
      .bind(authorized ? 1 : 0, timestamp, user.id, orgId).run();
    await recordEvent(env, orgId, user.id, 'organization.ai_data_authorization', undefined, authorized ? 'on' : 'off');
    const cloudSynced = await reportAiDataAuthorization(env, user, orgId);
    if (cloudSynced === false) await recordEvent(env, orgId, user.id, 'organization.ai_data_authorization_unconfirmed');
    return json({ organization: { ...organization, ai_data_authorized: authorized ? 1 : 0, cloud_synced: cloudSynced } });
  }

  if (action === 'status' && request.method === 'POST') {
    const status = (await readBody(request)).status;
    if (!platformAdmin) return json({ error: 'Only platform administrators can change organization status' }, 403);
    if (organization.type !== 'enterprise' || (status !== 'active' && status !== 'suspended')) {
      return json({ error: 'status must be active or suspended for an enterprise organization' }, 400);
    }
    await db.prepare('UPDATE organizations SET status = ? WHERE id = ?').bind(status, orgId).run();
    await recordEvent(env, orgId, user.id, `organization.${status}`);
    return json({ organization: { ...organization, status } });
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (organization.type !== 'enterprise') {
    return json({ error: 'A personal organization has no other members' }, 400);
  }
  const body = await readBody(request);
  const email = text(body.email).toLowerCase();
  if (!EMAIL.test(email)) return json({ error: 'A valid email is required' }, 400);
  const existing = await db.prepare('SELECT role, status FROM organization_members WHERE org_id = ? AND email = ?')
    .bind(orgId, email).first<{ role: MemberRole; status: MemberStatus }>();
  const timestamp = now();

  if (action === 'members') {
    const role = parseRole(body.role ?? 'member');
    if (!role) return json({ error: 'role must be admin or member' }, 400);
    if (existing && existing.status !== 'removed') return json({ error: '该邮箱已经是成员或已被邀请' }, 409);
    // An email that already has an account joins at once (it would on its next sign-in anyway).
    const account = await accountIdByEmail(env, email);
    const status: MemberStatus = account ? 'active' : 'invited';
    await db.prepare(
      `INSERT INTO organization_members (org_id, email, user_id, role, status, invited_by, created_at, joined_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(org_id, email) DO UPDATE SET user_id = excluded.user_id, role = excluded.role, status = excluded.status,
         invited_by = excluded.invited_by, joined_at = excluded.joined_at, updated_at = excluded.updated_at`
    ).bind(orgId, email, account, role, status, user.id, timestamp, account ? timestamp : null, timestamp).run();
    if (account) await preferOrganization(env, account, orgId);
    await recordEvent(env, orgId, user.id, account ? 'member.added' : 'member.invited', email, role);
    return json({ member: { email, role, status } }, 201);
  }

  if (!existing || existing.status === 'removed') return json({ error: 'Member not found' }, 404);
  const losesAdmin = existing.role === 'admin' && existing.status === 'active';

  if (action === 'members/role') {
    const role = parseRole(body.role);
    if (!role) return json({ error: 'role must be admin or member' }, 400);
    if (losesAdmin && role === 'member' && await activeAdminCount(env, orgId) <= 1) {
      return json({ error: 'An organization needs at least one active administrator' }, 409);
    }
    await db.prepare('UPDATE organization_members SET role = ?, updated_at = ? WHERE org_id = ? AND email = ?')
      .bind(role, timestamp, orgId, email).run();
    await recordEvent(env, orgId, user.id, 'member.role_changed', email, `${existing.role}->${role}`);
    return json({ member: { email, role, status: existing.status } });
  }

  // members/remove
  if (losesAdmin && await activeAdminCount(env, orgId) <= 1) {
    return json({ error: 'An organization needs at least one active administrator' }, 409);
  }
  await db.prepare("UPDATE organization_members SET status = 'removed', updated_at = ? WHERE org_id = ? AND email = ?")
    .bind(timestamp, orgId, email).run();
  await recordEvent(env, orgId, user.id, 'member.removed', email);
  return json({ member: { email, status: 'removed' } });
}
