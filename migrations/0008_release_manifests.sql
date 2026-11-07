-- Release manifests of the desktop and station software (SDK releases 1):
-- the newest release of a product per platform and channel, and the oldest
-- one still served. Each edition keeps its own rows; platform administrators
-- maintain them through /api/admin/releases.
CREATE TABLE IF NOT EXISTS release_manifests (
  product TEXT NOT NULL,
  platform TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'stable',
  latest TEXT NOT NULL,
  min_supported TEXT NOT NULL,
  url TEXT,
  sha256 TEXT,
  notes_url TEXT,
  published_at TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT,
  PRIMARY KEY (product, platform, channel)
);
