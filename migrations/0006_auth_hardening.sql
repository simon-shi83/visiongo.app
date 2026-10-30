-- Migration: 0006_auth_hardening.sql
-- Password hashes record their PBKDF2 iteration count (NULL: the former 50000) and are
-- upgraded on the next sign-in; session_version voids older sessions after a password reset.
ALTER TABLE users ADD COLUMN password_iterations INTEGER;
ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
