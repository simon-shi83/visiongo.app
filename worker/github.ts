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

  private inferPlatform(filename: string): PlatformType {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.exe') || lower.endsWith('.msi') || lower.includes('win') || lower.includes('windows')) {
      return 'windows';
    }
    if (
      lower.endsWith('.deb') ||
      lower.endsWith('.rpm') ||
      lower.endsWith('.appimage') ||
      lower.endsWith('.tar.gz') ||
      lower.includes('linux') ||
      lower.includes('ubuntu')
    ) {
      return 'linux';
    }
    if (lower.endsWith('.dmg') || lower.endsWith('.pkg') || lower.includes('darwin') || lower.includes('macos')) {
      return 'macos';
    }
    return 'generic';
  }

  private inferArch(filename: string): ArchitectureType {
    const lower = filename.toLowerCase();
    if (lower.includes('arm64') || lower.includes('aarch64')) {
      return 'arm64';
    }
    if (lower.includes('x86_64') || lower.includes('x64') || lower.includes('amd64')) {
      return 'x64';
    }
    return 'universal';
  }

  public async getProductReleases(
    product: SupportedProduct,
    includePrereleases = false
  ): Promise<ProductRelease[]> {
    const cacheKey = `${product}:${includePrereleases}`;
    const cached = releaseCache.get(cacheKey);
    const ttl = this.env.DOWNLOADS_CACHE_TTL_SEC
      ? parseInt(this.env.DOWNLOADS_CACHE_TTL_SEC, 10) * 1000
      : DEFAULT_CACHE_TTL_MS;

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const token = this.env.GITHUB_RELEASE_TOKEN;
    const repo = this.getRepoName(product);

    // If no token is configured yet, return fallback preview data or empty
    if (!token) {
      const fallback = getFallbackReleases(product);
      releaseCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
      return fallback;
    }

    try {
      const apiUrl = `https://api.github.com/repos/${this.org}/${repo}/releases?per_page=10`;
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'VISIONGO-WebWorker/1.0',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        console.warn(`[GitHub API] Failed to fetch releases for ${repo}: HTTP ${response.status}`);
        // If 404 or unauthorized, return empty or fallback
        const fallback = getFallbackReleases(product);
        releaseCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
        return fallback;
      }

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
          platform: this.inferPlatform(a.name),
          arch: this.inferArch(a.name),
          downloadUrl: `/api/download/${product}/${a.id}`,
        }));

        normalized.push({
          product,
          version: r.tag_name,
          name: r.name || r.tag_name,
          publishedAt: r.published_at || new Date().toISOString(),
          description: r.body || '',
          prerelease: r.prerelease,
          assets,
        });
      }

      // If repository has no releases yet, fallback to sample placeholder data so downloads page renders gracefully
      const finalResult = normalized.length > 0 ? normalized : getFallbackReleases(product);
      releaseCache.set(cacheKey, { data: finalResult, timestamp: Date.now() });
      return finalResult;
    } catch (err) {
      console.error(`[GitHub API Error] Error fetching releases for ${product}:`, err);
      const fallback = getFallbackReleases(product);
      return fallback;
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

    // Check fallback sample assets for evaluation and testing
    const fallbackList = getFallbackReleases(product);
    for (const rel of fallbackList) {
      const match = rel.assets.find((a) => a.id === assetId);
      if (match && !token) {
        const dummyText = `VISIONGO Industrial Software Package (Evaluation Preview)
Product: ${product}
Version: ${rel.version}
Asset: ${match.name}
Platform: ${match.platform} (${match.arch})
Target Domain: https://visiongo.app
Released: ${rel.publishedAt}

This evaluation package was requested via https://visiongo.app/downloads.
To connect this endpoint to live private GitHub Release binaries:
Set the GITHUB_RELEASE_TOKEN secret using:
  wrangler secret put GITHUB_RELEASE_TOKEN
`;
        const encoder = new TextEncoder();
        const buffer = encoder.encode(dummyText);
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(buffer);
            controller.close();
          },
        });

        return {
          stream,
          filename: match.name,
          contentType: 'text/plain; charset=utf-8',
          size: buffer.byteLength,
          version: rel.version,
          platform: match.platform,
          arch: match.arch,
        };
      }
    }

    if (!token) {
      console.warn('[GitHub Download] Missing GITHUB_RELEASE_TOKEN secret');
      return null;
    }

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

      if (!metaRes.ok) {
        console.warn(`[GitHub Download] Asset ${assetId} not found in ${repo}: ${metaRes.status}`);
        return null;
      }

      const meta = (await metaRes.json()) as { name: string; content_type: string; size: number };
      const filename = meta.name || `visiongo-${product}-${assetId}.bin`;
      const platform = this.inferPlatform(filename);
      const arch = this.inferArch(filename);

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

      if (!downloadRes.ok || !downloadRes.body) {
        return null;
      }

      return {
        stream: downloadRes.body,
        filename,
        contentType: meta.content_type || 'application/octet-stream',
        size: meta.size || undefined,
        platform,
        arch,
      };
    } catch (err) {
      console.error(`[GitHub Download Error] Asset download failed:`, err);
      return null;
    }
  }
}

/**
 * High-fidelity fallback releases when GitHub token is not yet configured
 * or the private repository has not made its first public release tag.
 */
function getFallbackReleases(product: SupportedProduct): ProductRelease[] {
  const publishedDate = '2026-09-28T08:00:00Z';

  if (product === 'visionstudio') {
    return [
      {
        product: 'visionstudio',
        version: 'v1.0.0',
        name: 'VisionStudio 1.0.0 — General Availability',
        publishedAt: publishedDate,
        description: `### VisionStudio v1.0.0 Release Notes

We are proud to announce the general availability release of **VisionStudio**, the engineering workspace for designing, configuring, and testing industrial vision pipelines.

#### Highlights
- **Zero-Latency Visual Pipeline Graph**: Drag-and-drop node graph with live hardware preview.
- **Recipe Exporter**: One-click deterministic recipe compilation for VisionRuntime deployment.
- **Air-Gapped Operation**: Completely standalone, zero telemetry, and zero mandatory cloud connectivity.
- **Camera Calibration Tools**: Built-in checkerboard & circle grid intrinsic/extrinsic solvers.

#### Supported Platforms
- Windows 10/11 x64
- Ubuntu 22.04 / 24.04 LTS x86_64`,
        prerelease: false,
        assets: [
          {
            id: '101',
            name: 'VisionStudio-Setup-1.0.0-x64.exe',
            size: 142606336, // ~136 MB
            contentType: 'application/vnd.microsoft.portable-executable',
            platform: 'windows',
            arch: 'x64',
            downloadUrl: '/api/download/visionstudio/101',
          },
          {
            id: '102',
            name: 'VisionStudio-1.0.0-x86_64.AppImage',
            size: 154140672, // ~147 MB
            contentType: 'application/x-executable',
            platform: 'linux',
            arch: 'x64',
            downloadUrl: '/api/download/visionstudio/102',
          },
          {
            id: '103',
            name: 'visionstudio_1.0.0_amd64.deb',
            size: 138412032, // ~132 MB
            contentType: 'application/vnd.debian.binary-package',
            platform: 'linux',
            arch: 'x64',
            downloadUrl: '/api/download/visionstudio/103',
          },
        ],
      },
    ];
  }

  if (product === 'visionruntime') {
    return [
      {
        product: 'visionruntime',
        version: 'v1.0.0',
        name: 'VisionRuntime 1.0.0 — Production Core',
        publishedAt: publishedDate,
        description: `### VisionRuntime v1.0.0 Release Notes

Production-ready deterministic execution engine for industrial factory automation.

#### Key Features
- **Sub-Millisecond Jitter**: Real-time thread isolation and zero-copy shared memory buffer rings.
- **Industrial Fieldbus**: Native support for GenICam, GigE Vision, USB3 Vision, Modbus TCP, and OPC UA.
- **Headless CLI & Daemon**: Designed for 24/7 continuous operation on IPCs and edge servers without X11/Wayland overhead.

#### Requirements
- Linux: Kernel 5.15+ (PREEMPT_RT recommended for hard real-time triggers)
- Windows: Windows 10/11 Pro/Enterprise or Windows Server 2022`,
        prerelease: false,
        assets: [
          {
            id: '201',
            name: 'visionruntime-1.0.0-linux-x86_64.tar.gz',
            size: 68157440, // ~65 MB
            contentType: 'application/gzip',
            platform: 'linux',
            arch: 'x64',
            downloadUrl: '/api/download/visionruntime/201',
          },
          {
            id: '202',
            name: 'visionruntime-1.0.0-linux-arm64.tar.gz',
            size: 64225280, // ~61 MB
            contentType: 'application/gzip',
            platform: 'linux',
            arch: 'arm64',
            downloadUrl: '/api/download/visionruntime/202',
          },
          {
            id: '203',
            name: 'VisionRuntime-Core-1.0.0-win64.zip',
            size: 72351744, // ~69 MB
            contentType: 'application/zip',
            platform: 'windows',
            arch: 'x64',
            downloadUrl: '/api/download/visionruntime/203',
          },
        ],
      },
    ];
  }

  if (product === 'visionedge') {
    return [
      {
        product: 'visionedge',
        version: 'v1.0.0',
        name: 'VisionEdge 1.0.0 — On-site AI Gateway',
        publishedAt: publishedDate,
        description: `### VisionEdge v1.0.0 Release Notes

On-site AI Gateway for autonomous machine learning verification and drift compensation.

#### Features
- **Air-Gapped Anomaly Detection**: Unsupervised feature verification running completely on local edge NPU/GPU.
- **Dual-Loop Drift Compensation**: Autonomous baseline tracking without line stoppage.
- **Safe Auto-Rollback**: Immediate fallback to certified golden recipes upon statistical divergence.`,
        prerelease: false,
        assets: [
          {
            id: '301',
            name: 'visionedge-gateway-1.0.0-linux-x86_64.tar.gz',
            size: 89128960, // ~85 MB
            contentType: 'application/gzip',
            platform: 'linux',
            arch: 'x64',
            downloadUrl: '/api/download/visionedge/301',
          },
          {
            id: '302',
            name: 'visionedge-gateway-1.0.0-linux-arm64.tar.gz',
            size: 84934656, // ~81 MB
            contentType: 'application/gzip',
            platform: 'linux',
            arch: 'arm64',
            downloadUrl: '/api/download/visionedge/302',
          },
        ],
      },
    ];
  }

  return [];
}
