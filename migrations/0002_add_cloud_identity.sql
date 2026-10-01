-- Add the stable tenant and authorization role used by desktop access tokens.
ALTER TABLE users ADD COLUMN tenant_id TEXT;
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member';

UPDATE users
SET tenant_id = 'vg_tenant_' || substr(replace(id, 'vg_usr_', ''), 1, 12)
WHERE tenant_id IS NULL OR tenant_id = '';

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
