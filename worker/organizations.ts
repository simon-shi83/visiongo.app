/**
 * Organizations and memberships.
 *
 * The website is the only place that knows who belongs to which organization.
 * Desktop access tokens carry the organization the user selected, so
 * VisionCloud and VisionTrainer never look memberships up themselves.
 *
 * - Every user has a personal organization (users.tenant_id) that they administer.
 * - Enterprise organizations are created by a platform administrator.
 * - Members are invited by email and join when they sign in with that verified email.
 */

import type { Env, TenantSummary, User } from './types';
import { json, requireDatabase } from './reliability';
import { getUserById, verifySessionCookie } from './auth';

type MemberRole = 'admin' | 'member';
type MemberStatus = 'invited' | 'active' | 'removed';

interface OrganizationRow {
  id: string;
  name: string;
  type: 'personal' | 'enterprise';
  status: 'active' | 'suspended';
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
  await requireDatabase(env).prepare(
    "UPDATE organization_members SET user_id = ?, status = 'active', joined_at = ?, updated_at = ? WHERE email = ? AND status = 'invited'"
  ).bind(user.id, timestamp, timestamp, user.email.toLowerCase()).run();
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
    return tenant ? { tenant, tenants } : null;
  }
  const row = await requireDatabase(env).prepare('SELECT last_tenant_id FROM users WHERE id = ?')
    .bind(user.id).first<{ last_tenant_id: string | null }>();
  const tenant = find(row?.last_tenant_id) || find(user.tenantId) || tenants[0];
  return tenant ? { tenant, tenants } : null;
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

async function loadOrganization(env: Env, orgId: string): Promise<OrganizationRow | null> {
  return requireDatabase(env).prepare('SELECT id, name, type, status FROM organizations WHERE id = ?')
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
  const session = await verifySessionCookie(request.headers.get('Cookie'), env.SESSION_SECRET);
  const user = session ? await getUserById(env, session.userId) : null;
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const platformAdmin = user.role === 'super_admin';

  if (url.pathname === '/api/orgs' && request.method === 'GET') {
    const tenants = await listTenants(env, user);
    const resolved = await resolveTenant(env, user);
    let organizations: OrganizationRow[] | undefined;
    if (platformAdmin) {
      const { results } = await requireDatabase(env).prepare(
        "SELECT id, name, type, status FROM organizations WHERE type = 'enterprise' ORDER BY name"
      ).all<OrganizationRow>();
      organizations = results || [];
    }
    return json({ tenants, current_tenant_id: resolved?.tenant.tenant_id ?? null,
                  is_platform_admin: platformAdmin, organizations });
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
    await db.batch([
      db.prepare("INSERT INTO organizations (id, name, type, status, created_by, created_at) VALUES (?, ?, 'enterprise', 'active', ?, ?)")
        .bind(id, name, user.id, timestamp),
      db.prepare("INSERT INTO organization_members (org_id, email, user_id, role, status, invited_by, created_at, joined_at, updated_at) VALUES (?, ?, NULL, 'admin', 'invited', ?, ?, NULL, ?)")
        .bind(id, adminEmail, user.id, timestamp, timestamp),
    ]);
    await recordEvent(env, id, user.id, 'organization.created', adminEmail, name);
    return json({ organization: { id, name, type: 'enterprise', status: 'active' } }, 201);
  }

  const match = url.pathname.match(/^\/api\/orgs\/([A-Za-z0-9_-]{1,128})\/(members|members\/role|members\/remove|status)$/);
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
    return json({ organization, members: results || [] });
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
    if (existing && existing.status !== 'removed') return json({ error: 'This email is already a member or invited' }, 409);
    await db.prepare(
      `INSERT INTO organization_members (org_id, email, user_id, role, status, invited_by, created_at, joined_at, updated_at)
       VALUES (?, ?, NULL, ?, 'invited', ?, ?, NULL, ?)
       ON CONFLICT(org_id, email) DO UPDATE SET user_id = NULL, role = excluded.role, status = 'invited',
         invited_by = excluded.invited_by, joined_at = NULL, updated_at = excluded.updated_at`
    ).bind(orgId, email, role, user.id, timestamp, timestamp).run();
    await recordEvent(env, orgId, user.id, 'member.invited', email, role);
    return json({ member: { email, role, status: 'invited' } }, 201);
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
