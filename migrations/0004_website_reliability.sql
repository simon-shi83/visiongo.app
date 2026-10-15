-- Durable inquiries, notification outbox, one-use OAuth state and abuse limits.
CREATE TABLE contact_inquiries (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  country TEXT NOT NULL,
  product TEXT NOT NULL,
  message TEXT NOT NULL,
  locale TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'pending',
  notification_attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_contact_notifications ON contact_inquiries(notification_status, next_attempt_at);

CREATE TABLE github_oauth_states (
  state TEXT PRIMARY KEY,
  return_path TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE request_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
