-- Whether an organization lets VisionCloud use its data for AI. Off by default,
-- also for every existing organization: VisionCloud keeps all its AI functions
-- off for an organization until an administrator turns this on.
ALTER TABLE organizations ADD COLUMN ai_data_authorized INTEGER NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN ai_data_authorized_at TEXT;
ALTER TABLE organizations ADD COLUMN ai_data_authorized_by TEXT;
