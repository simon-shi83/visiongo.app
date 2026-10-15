/**
 * GitHub implementation of ReleaseProvider and DownloadProvider.
 * Interacts with private GitHub Releases via authenticated REST API,
 * normalizes responses, applies caching, and proxies binary asset streams.
 */

import {
  Env,
  SupportedProduct,
  ProductRelease,
  ReleaseAsset,
  ReleaseProvider,
  DownloadProvider,
  DownloadStreamResult,
  PlatformType,
  ArchitectureType,
} from './types';

// In-memory cache for Worker execution context
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const releaseCache = new Map<string, CacheEntry<ProductRelease[]>>();
const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function inferPlatform(filename: string): PlatformType {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.dmg') || lower.endsWith('.pkg') || /darwin|macos/.test(lower)) return 'macos';
  if (lower.endsWith('.exe') || lower.endsWith('.msi') || /(?:^|[-_.])(win(?:dows)?)(?:[-_.]|$)/.test(lower)) return 'windows';
  if (/linux|ubuntu/.test(lower) || /\.(deb|rpm|appimage)$/.test(lower)) return 'linux';
  return 'generic';
}

export function inferArch(filename: string): ArchitectureType {
    const lower = filename.toLowerCase();
    if (lower.includes('arm64') || lower.includes('aarch64')) {
      return 'arm64';
    }
    if (lower.includes('x86_64') || lower.includes('x64') || lower.includes('amd64')) {
      return 'x64';
    }
    return lower.includes('universal') ? 'universal' : 'unknown';
  }


export class GitHubReleaseProvider implements ReleaseProvider {
  private env: Env;
  private org: string;
  private repoMap: Record<SupportedProduct, string>;

  constructor(env: Env) {
    this.env = env;
    this.org = env.GITHUB_ORG || 'simon-shi83';
    this.repoMap = {
      visionstudio: env.VISIONSTUDIO_REPO || 'VisionStudio',
      visionruntime: env.VISIONRUNTIME_REPO || 'VisionRuntime',
      visionedge: env.VISIONEDGE_REPO || 'VisionEdge',
    };
  }

  private getRepoName(product: SupportedProduct): string {
    return this.repoMap[product] || product;
  }

  public async getProductReleases(
    product: SupportedProduct,
    includePrereleases = false
  ): Promise<ProductRelease[]> {
    if (!this.env.GITHUB_RELEASE_TOKEN) throw new Error('Release provider is not configured');
    const cacheKey = `${this.org}/${this.getRepoName(product)}:${includePrereleases}`;
    const cached = releaseCache.get(cacheKey);
    const ttl = this.env.DOWNLOADS_CACHE_TTL_SEC
      ? parseInt(this.env.DOWNLOADS_CACHE_TTL_SEC, 10) * 1000
      : DEFAULT_CACHE_TTL_MS;

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const token = this.env.GITHUB_RELEASE_TOKEN;
    const repo = this.getRepoName(product);

    try {
      const apiUrl = `https://api.github.com/repos/${this.org}/${repo}/releases?per_page=10`;
      const response = await fetch(apiUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'VISIONGO-WebWorker/1.0',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) throw new Error(`Release service returned HTTP ${response.status}`);

      const rawReleases = (await response.json()) as Array<{
        id: number;
        tag_name: string;
        name: string | null;
        body: string | null;
        published_at: string | null;
        prerelease: boolean;
        draft: boolean;
        assets: Array<{
          id: number;
          name: string;
          size: number;
          content_type: string;
          digest?: string | null;
        }>;
      }>;

      const normalized: ProductRelease[] = [];

      for (const r of rawReleases) {
        if (r.draft) continue;
        if (r.prerelease && !includePrereleases) continue;

        const assets: ReleaseAsset[] = (r.assets || []).map((a) => ({
          id: String(a.id),
          name: a.name,
          size: a.size,
          contentType: a.content_type || 'application/octet-stream',
          platform: inferPlatform(a.name),
          arch: inferArch(a.name),
          digest: a.digest && /^sha256:[a-f0-9]{64}$/.test(a.digest) ? a.digest : undefined,
          downloadUrl: `/api/download/${product}/${a.id}`,
        }));

        normalized.push({
          product,
          version: r.tag_name,
          name: r.name || r.tag_name,
          publishedAt: r.published_at || '',
          description: r.body || '',
          prerelease: r.prerelease,
          assets,
        });
      }

      releaseCache.set(cacheKey, { data: normalized, timestamp: Date.now() });
      return normalized;
    } catch (err) {
      console.error(`[GitHub] Release request failed for ${product}`);
      throw err;
    }
  }

  public async getAllReleases(
    includePrereleases = false
  ): Promise<Record<SupportedProduct, ProductRelease[]>> {
    const [studio, runtime, edge] = await Promise.all([
      this.getProductReleases('visionstudio', includePrereleases),
      this.getProductReleases('visionruntime', includePrereleases),
      this.getProductReleases('visionedge', includePrereleases),
    ]);

    return {
      visionstudio: studio,
      visionruntime: runtime,
      visionedge: edge,
    };
  }
}

export class GitHubDownloadProvider implements DownloadProvider {
  private env: Env;
  private org: string;
  private repoMap: Record<SupportedProduct, string>;

  constructor(env: Env) {
    this.env = env;
    this.org = env.GITHUB_ORG || 'simon-shi83';
    this.repoMap = {
      visionstudio: env.VISIONSTUDIO_REPO || 'VisionStudio',
      visionruntime: env.VISIONRUNTIME_REPO || 'VisionRuntime',
      visionedge: env.VISIONEDGE_REPO || 'VisionEdge',
    };
  }

  public async getDownloadStream(
    product: SupportedProduct,
    assetId: string
  ): Promise<DownloadStreamResult | null> {
    // Validate assetId is strictly numeric
    if (!/^\d+$/.test(assetId)) {
      return null;
    }

    const token = this.env.GITHUB_RELEASE_TOKEN;
    const repo = this.repoMap[product] || product;

    if (!token) throw new Error('Download provider is not configured');

    const assetMetaUrl = `https://api.github.com/repos/${this.org}/${repo}/releases/assets/${assetId}`;

    try {
      // Step 1: Query asset metadata to get proper filename and size
      const metaRes = await fetch(assetMetaUrl, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'VISIONGO-WebWorker/1.0',
        },
      });

      if (metaRes.status === 404) return null;
      if (!metaRes.ok) throw new Error('Download metadata service unavailable');

      const meta = (await metaRes.json()) as { name: string; content_type: string; size: number };
      const filename = meta.name || `visiongo-${product}-${assetId}.bin`;
      const platform = inferPlatform(filename);
      const arch = inferArch(filename);

      // Step 2: Request the raw binary stream.
      // GitHub release asset endpoint redirects (302) to S3/CDN. We follow redirects.
      const downloadRes = await fetch(assetMetaUrl, {
        headers: {
          'Accept': 'application/octet-stream',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'VISIONGO-WebWorker/1.0',
        },
        redirect: 'follow',
      });

      if (!downloadRes.ok || !downloadRes.body) throw new Error('Binary download service unavailable');

      return {
        stream: downloadRes.body,
        filename,
        contentType: meta.content_type || 'application/octet-stream',
        size: meta.size || undefined,
        platform,
        arch,
      };
    } catch (err) {
      console.error('[GitHub] Binary request failed');
      throw err;
    }
  }
}
