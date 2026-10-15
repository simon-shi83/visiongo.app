-- Organizations and memberships. The website is the only source of who belongs
-- to which organization; desktop access tokens carry the selected organization.
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_by TEXT,
  created_at TEXT NOT NULL
);

-- One row per invited email. user_id is filled when the invitee signs in with
-- that verified email. Removed rows are kept for the audit trail.
CREATE TABLE IF NOT EXISTS organization_members (
  org_id TEXT NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'removed')),
  invited_by TEXT,
  created_at TEXT NOT NULL,
  joined_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (org_id, email)
);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON organization_members(email, status);

CREATE TABLE IF NOT EXISTS organization_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  target_email TEXT,
  detail TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_org_events_org ON organization_events(org_id, created_at);

-- Organization the desktop session used last; the default for the next sign-in.
ALTER TABLE users ADD COLUMN last_tenant_id TEXT;

-- Every existing user's tenant_id becomes a personal organization they administer.
INSERT OR IGNORE INTO organizations (id, name, type, status, created_by, created_at)
SELECT tenant_id, COALESCE(NULLIF(display_name, ''), email), 'personal', 'active', id, created_at
FROM users WHERE tenant_id IS NOT NULL AND tenant_id <> '';

INSERT OR IGNORE INTO organization_members
  (org_id, email, user_id, role, status, invited_by, created_at, joined_at, updated_at)
SELECT tenant_id, LOWER(email), id, 'admin', 'active', NULL, created_at, created_at, created_at
FROM users WHERE tenant_id IS NOT NULL AND tenant_id <> '';

-- users.role is now platform-wide only; roles inside an organization live in
-- organization_members. Every former org_admin administers its personal organization.
UPDATE users SET role = 'member' WHERE role = 'org_admin';
