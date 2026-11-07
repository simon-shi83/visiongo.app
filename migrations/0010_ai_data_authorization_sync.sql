-- When VisionCloud confirmed the organization's current AI data authorization
-- (SDK credits 3). Behind ai_data_authorized_at the report is retried.
ALTER TABLE organizations ADD COLUMN ai_data_authorization_synced_at TEXT;
