/**
 * Privacy-preserving download analytics for VISIONGO using Cloudflare Workers Analytics Engine.
 *
 * Privacy Guarantees:
 * 1. Raw visitor IP addresses are NEVER stored in Analytics Engine or exposed anywhere.
 * 2. An HMAC-SHA256 hash is computed using a server-side secret (DOWNLOAD_ANALYTICS_SECRET)
 *    to generate a non-reversible pseudonymous identifier for deduplicating repeated downloads.
 * 3. Geolocation is derived purely from request.cf headers (country, region, city).
 * 4. Analytics recording is non-blocking and will never interrupt or fail a software download.
 */

import { Env, SupportedProduct, PlatformType, ArchitectureType } from './types';

export interface DownloadEventDetails {
  product: SupportedProduct;
  version: string;
  assetName: string;
  platform?: PlatformType;
  arch?: ArchitectureType;
  assetSize?: number;
  statusCode: number;
  status: 'success' | 'failed' | 'not_found';
}

/**
 * Derives a pseudonymous HMAC-SHA256 client token from the visitor's connecting IP address.
 * Never stores raw IP.
 */
async function generatePseudonymousClientId(
  clientIp: string,
  secretKey: string
): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey || 'default-fallback-salt-visiongo-2026');
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(clientIp));
    const hashArray = Array.from(new Uint8Array(signature));
    // Return first 16 bytes (32 hex characters) for compact storage
    return hashArray
      .slice(0, 16)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return 'anon-unknown';
  }
}

/**
 * Records a download event to Cloudflare Workers Analytics Engine in a non-blocking manner.
 */
export async function recordDownloadAnalytics(
  env: Env,
  request: Request,
  details: DownloadEventDetails,
  ctx?: ExecutionContext
): Promise<void> {
  // If Analytics Engine binding is not configured in this environment, exit gracefully
  if (!env.DOWNLOADS_ANALYTICS) {
    return;
  }

  const recordTask = async () => {
    try {
      const clientIp =
        request.headers.get('CF-Connecting-IP') ||
        request.headers.get('x-forwarded-for') ||
        '0.0.0.0';

      const pseudoClientId = await generatePseudonymousClientId(
        clientIp,
        env.DOWNLOAD_ANALYTICS_SECRET || 'visiongo-anon-key'
      );

      const cf = (request as unknown as { cf?: Record<string, string> }).cf || {};
      const country = cf.country || 'UNKNOWN';
      const region = cf.region || 'UNKNOWN';
      const city = cf.city || '';

      /**
       * Analytics Engine Schema:
       * - blobs[0]: product ('visionstudio' | 'visionruntime' | 'visionedge')
       * - blobs[1]: version (e.g. 'v1.0.0')
       * - blobs[2]: asset name (e.g. 'VisionStudio-Setup-1.0.0-x64.exe')
       * - blobs[3]: platform ('windows' | 'linux' | 'macos' | 'generic')
       * - blobs[4]: architecture ('x64' | 'arm64' | 'universal')
       * - blobs[5]: country (ISO 2-letter country code)
       * - blobs[6]: region / state
       * - blobs[7]: status ('success' | 'failed' | 'not_found')
       * - blobs[8]: pseudonymous client ID (HMAC hash)
       * - blobs[9]: city (optional)
       *
       * - doubles[0]: asset size in bytes
       * - doubles[1]: HTTP status code (200, 404, 500)
       *
       * - indexes[0]: product (allows fast indexed queries by product)
       */
      env.DOWNLOADS_ANALYTICS?.writeDataPoint({
        blobs: [
          details.product,
          details.version,
          details.assetName,
          details.platform || 'generic',
          details.arch || 'universal',
          country,
          region,
          details.status,
          pseudoClientId,
          city,
        ],
        doubles: [details.assetSize || 0, details.statusCode],
        indexes: [details.product],
      });
    } catch (err) {
      // Analytics failure MUST NOT fail or log sensitive info
      console.warn('[Analytics Engine] Non-fatal analytics recording exception:', err);
    }
  };

  // Run in background if ExecutionContext is provided, otherwise execute without blocking
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(recordTask());
  } else {
    recordTask().catch(() => {});
  }
}
