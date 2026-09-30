/**
 * VISIONGO Cloudflare Worker
 *
 * Handles:
 * - /api/releases: Normalized GitHub Releases for VisionStudio, VisionRuntime, VisionEdge
 * - /api/download/:product/:assetId: Secure private asset stream proxy with non-blocking privacy analytics
 * - /api/contact: Enterprise contact / demo inquiry submission
 * - /api/health: Edge status and health check
 * - Fallback: Static single-page application assets with hardened security headers
 */

import { Env, isValidProduct, SupportedProduct } from './types';
import { GitHubReleaseProvider, GitHubDownloadProvider } from './github';
import { recordDownloadAnalytics } from './analytics';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Health check endpoint
    if (url.pathname === '/api/health') {
      const cf = (request as unknown as { cf?: { colo?: string } }).cf;
      return new Response(
        JSON.stringify({
          status: 'healthy',
          service: 'VISIONGO Edge Platform',
          timestamp: new Date().toISOString(),
          edgeRegion: cf?.colo || 'local',
          analyticsConfigured: Boolean(env.DOWNLOADS_ANALYTICS),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    // 2. Releases API: GET /api/releases or GET /api/releases/:product
    if (url.pathname.startsWith('/api/releases') && request.method === 'GET') {
      try {
        const releaseProvider = new GitHubReleaseProvider(env);
        const includePrereleases = url.searchParams.get('includePrereleases') === 'true';

        const segments = url.pathname.split('/').filter(Boolean);
        // /api/releases -> segments = ['api', 'releases']
        // /api/releases/:product -> segments = ['api', 'releases', ':product']
        if (segments.length === 2) {
          const allReleases = await releaseProvider.getAllReleases(includePrereleases);
          return new Response(
            JSON.stringify({
              success: true,
              releases: allReleases,
              updatedAt: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300, s-maxage=600',
              },
            }
          );
        }

        if (segments.length === 3) {
          const productParam = segments[2].toLowerCase();
          if (!isValidProduct(productParam)) {
            return new Response(
              JSON.stringify({ error: `Invalid product: '${productParam}'. Must be one of visionstudio, visionruntime, visionedge.` }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const productReleases = await releaseProvider.getProductReleases(productParam, includePrereleases);
          return new Response(
            JSON.stringify({
              success: true,
              product: productParam,
              releases: productReleases,
              updatedAt: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300, s-maxage=600',
              },
            }
          );
        }
      } catch (err) {
        console.error('[API Releases Error]:', err);
        return new Response(
          JSON.stringify({ error: 'Unable to retrieve release metadata at this time.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. Download Proxy: GET /api/download/:product/:assetId
    if (url.pathname.startsWith('/api/download/') && request.method === 'GET') {
      const segments = url.pathname.split('/').filter(Boolean);
      // /api/download/:product/:assetId -> segments = ['api', 'download', ':product', ':assetId']
      if (segments.length !== 4) {
        return new Response(
          JSON.stringify({ error: 'Invalid download endpoint format. Expected /api/download/:product/:assetId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const productParam = segments[2].toLowerCase();
      const assetId = segments[3];

      // Strict validation: Reject arbitrary products or non-numeric asset IDs
      if (!isValidProduct(productParam)) {
        return new Response(
          JSON.stringify({ error: 'Invalid download product' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!/^\d+$/.test(assetId)) {
        return new Response(
          JSON.stringify({ error: 'Invalid asset ID' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const downloadProvider = new GitHubDownloadProvider(env);
      const result = await downloadProvider.getDownloadStream(productParam as SupportedProduct, assetId);

      if (!result) {
        // Record failed attempt in analytics non-blockingly
        await recordDownloadAnalytics(
          env,
          request,
          {
            product: productParam as SupportedProduct,
            version: 'unknown',
            assetName: `asset-${assetId}`,
            statusCode: 404,
            status: 'not_found',
          },
          ctx
        );

        return new Response(
          JSON.stringify({
            error: 'Release asset not found or download authorization unavailable.',
            code: 'ASSET_NOT_FOUND',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Record successful download event to Workers Analytics Engine
      recordDownloadAnalytics(
        env,
        request,
        {
          product: productParam as SupportedProduct,
          version: result.version || 'v1.0.0',
          assetName: result.filename,
          platform: result.platform,
          arch: result.arch,
          assetSize: result.size,
          statusCode: 200,
          status: 'success',
        },
        ctx
      );

      // Stream the binary asset directly to the client with sanitized headers
      const downloadHeaders = new Headers();
      downloadHeaders.set('Content-Disposition', `attachment; filename="${result.filename}"`);
      downloadHeaders.set('Content-Type', result.contentType || 'application/octet-stream');
      if (result.size) {
        downloadHeaders.set('Content-Length', String(result.size));
      }
      downloadHeaders.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      downloadHeaders.set('X-Content-Type-Options', 'nosniff');

      return new Response(result.stream, {
        status: 200,
        headers: downloadHeaders,
      });
    }

    // 4. Contact & Enterprise Inquiry API: POST /api/contact
    if (url.pathname === '/api/contact' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          name?: string;
          email?: string;
          company?: string;
          country?: string;
          product?: string;
          message?: string;
          projectScope?: string;
          // Honeypot field for bot spam prevention
          websiteUrl?: string;
        };

        // If honeypot is populated, silently acknowledge without processing
        if (body.websiteUrl) {
          return new Response(
            JSON.stringify({ success: true, referenceId: `VG-${Date.now().toString(36).toUpperCase()}` }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const email = (body.email || '').trim();
        const name = (body.name || '').trim();
        const content = (body.message || body.projectScope || '').trim();

        if (!email || !content) {
          return new Response(
            JSON.stringify({ error: 'Work email and project details are required.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Basic email syntax validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return new Response(
            JSON.stringify({ error: 'Please enter a valid work email address.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const referenceId = `VG-${Date.now().toString(36).toUpperCase()}`;

        // Return a structured response confirming receipt
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Inquiry received. A VISIONGO systems architect will follow up within 24 hours.',
            referenceId,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON payload' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 5. Fallback: serve static assets via Cloudflare Workers Assets
    const response = await env.ASSETS.fetch(request);

    // Add security and modern web performance headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
