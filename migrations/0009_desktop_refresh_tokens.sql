-- Desktop refresh tokens (SDK identity 4). Every refresh rotates the token:
-- the presented one is marked used and replaced_by names its successor. A
-- family is one sign-in on one computer; presenting a used token again
-- revokes the whole family. Tokens issued before this table existed have no
-- row and are refused, so every desktop signs in once more.
CREATE TABLE IF NOT EXISTS desktop_refresh_tokens (
  jti TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  device_name TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  replaced_by TEXT,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_desktop_refresh_tokens_family ON desktop_refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS idx_desktop_refresh_tokens_user ON desktop_refresh_tokens (user_id, revoked_at);
