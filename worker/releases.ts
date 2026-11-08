import type { Env } from './types';
import { getSessionUser } from './auth';
import { json, requireDatabase } from './reliability';

// Release manifests of SDK/schemas/releases.json (releases 1). Public reads of
// GET /api/releases/{studio|edge|runtime}?platform=&channel=; the GitHub release
// listing of the download page keeps /api/releases and /api/releases/vision*.
export const MANIFEST_PRODUCTS = new Set(['studio', 'edge', 'runtime']);
const VERSION = /^\d{1,5}(\.\d{1,5}){0,3}$/;
const NAME = /^[a-z0-9][a-z0-9-]{0,31}$/;
const SHA256 = /^[0-9a-f]{64}$/;

interface ManifestRow {
  product: string;
  platform: string;
  channel: string;
  latest: string;
  min_supported: string;
  url: string | null;
  sha256: string | null;
  notes_url: string | null;
  published_at: string | null;
}

/** SDK ReleaseManifest: optional fields are left out when empty. */
function manifest(row: ManifestRow): Record<string, string> {
  const body: Record<string, string> = { product: row.product, platform: row.platform, channel: row.channel,
                                         latest: row.latest, min_supported: row.min_supported };
  for (const key of ['url', 'sha256', 'notes_url', 'published_at'] as const) {
    if (row[key]) body[key] = row[key] as string;
  }
  return body;
}

function httpsUrl(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 1024) return undefined;
  try {
    return new URL(value).protocol === 'https:' ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Handles GET /api/releases/{studio|edge|runtime}; null for any other path. */
export async function handleReleaseManifest(request: Request, env: Env, url: URL): Promise<Response | null> {
  const match = url.pathname.match(/^\/api\/releases\/([a-z]+)$/);
  if (request.method !== 'GET' || !match || !MANIFEST_PRODUCTS.has(match[1])) return null;
  const platform = url.searchParams.get('platform') || '';
  const channel = url.searchParams.get('channel') || 'stable';
  if (!NAME.test(platform) || !NAME.test(channel)) return json({ error: 'platform is required' }, 400);
  const row = await requireDatabase(env).prepare(
    'SELECT product, platform, channel, latest, min_supported, url, sha256, notes_url, published_at FROM release_manifests WHERE product = ? AND platform = ? AND channel = ?'
  ).bind(match[1], platform, channel).first<ManifestRow>();
  if (!row) return json({ error: 'No release is published for this platform and channel' }, 404);
  return Response.json(manifest(row), { headers: { 'Cache-Control': 'public, max-age=300' } });
}

/** Platform administrators list (GET) and publish (POST) manifests at /api/admin/releases. */
export async function handleReleaseAdmin(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (url.pathname !== '/api/admin/releases') return null;
  const user = await getSessionUser(env, request.headers.get('Cookie'));
  if (!user) return json({ error: 'Unauthorized' }, 401);
  if (user.role !== 'super_admin') return json({ error: 'Only platform administrators can publish releases' }, 403);
  const db = requireDatabase(env);
  if (request.method === 'GET') {
    const { results } = await db.prepare(
      'SELECT product, platform, channel, latest, min_supported, url, sha256, notes_url, published_at, updated_at, updated_by FROM release_manifests ORDER BY product, platform, channel'
    ).all();
    return json({ releases: results || [] });
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return json({ error: 'A JSON object is required' }, 400);
  const product = String(body.product ?? '');
  const platform = String(body.platform ?? '');
  const channel = String(body.channel ?? 'stable');
  const latest = String(body.latest ?? '');
  const minSupported = String(body.min_supported ?? '');
  const downloadUrl = httpsUrl(body.url);
  const notesUrl = httpsUrl(body.notes_url);
  const sha256 = body.sha256 === undefined || body.sha256 === null || body.sha256 === '' ? null : String(body.sha256).toLowerCase();
  if (!MANIFEST_PRODUCTS.has(product) || !NAME.test(platform) || !NAME.test(channel)) {
    return json({ error: 'product must be studio, edge or runtime; platform and channel are required' }, 400);
  }
  if (!VERSION.test(latest) || !VERSION.test(minSupported) || compareVersions(minSupported, latest) > 0) {
    return json({ error: 'latest and min_supported must be versions such as 6.1.0, min_supported not above latest' }, 400);
  }
  if (downloadUrl === undefined || notesUrl === undefined || (sha256 !== null && !SHA256.test(sha256))) {
    return json({ error: 'url and notes_url must be https; sha256 must be 64 hex digits' }, 400);
  }
  const timestamp = new Date().toISOString();
  const publishedAt = typeof body.published_at === 'string' && body.published_at ? body.published_at.slice(0, 64) : timestamp;
  await db.prepare(
    `INSERT INTO release_manifests (product, platform, channel, latest, min_supported, url, sha256, notes_url, published_at, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(product, platform, channel) DO UPDATE SET latest = excluded.latest, min_supported = excluded.min_supported,
       url = excluded.url, sha256 = excluded.sha256, notes_url = excluded.notes_url, published_at = excluded.published_at,
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`
  ).bind(product, platform, channel, latest, minSupported, downloadUrl, sha256, notesUrl, publishedAt, timestamp, user.id).run();
  return json({ release: manifest({ product, platform, channel, latest, min_supported: minSupported, url: downloadUrl,
                                    sha256, notes_url: notesUrl, published_at: publishedAt }) });
}

/** "6.1.0" style versions: negative, zero or positive as a is older, equal or newer. */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] || 0) - (right[i] || 0);
    if (diff) return diff;
  }
  return 0;
}
