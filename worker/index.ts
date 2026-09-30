/**
 * VISIONGO Cloudflare Worker (Phase 3)
 *
 * Edge Routing Architecture:
 * - /api/health: Edge status and health check
 * - /api/releases: Normalized releases for VisionStudio, VisionRuntime, VisionEdge
 * - /api/download/:product/:assetId: Secure binary proxy with download analytics and optional user history
 * - /api/contact: Enterprise contact and demo inquiry submission
 * - /api/auth/google: Google Sign-In verification and D1 user onboarding
 * - /api/auth/me: Current authenticated session query
 * - /api/auth/logout: Session termination
 * - /api/user/downloads: Authenticated user download history
 * - Fallback: Hardened static asset routing. Non-existent API and asset routes strictly 404.
 */

import { Env, isValidProduct, SupportedProduct } from './types';
import { GitHubReleaseProvider, GitHubDownloadProvider } from './github';
import { recordDownloadAnalytics } from './analytics';
import {
  verifyGoogleIdToken,
  createSessionCookie,
  verifySessionCookie,
  getOrCreateUser,
  getUserById,
  recordUserDownloadHistory,
  getUserDownloadHistory,
} from './auth';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // =========================================================================
    // 1. Health check endpoint: GET /api/health
    // =========================================================================
    if (url.pathname === '/api/health') {
      const cf = (request as unknown as { cf?: { colo?: string } }).cf;
      return new Response(
        JSON.stringify({
          status: 'healthy',
          service: 'VISIONGO Edge Platform',
          timestamp: new Date().toISOString(),
          edgeRegion: cf?.colo || 'local',
          analyticsConfigured: Boolean(env.DOWNLOADS_ANALYTICS),
          d1Configured: Boolean(env.DB),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    // =========================================================================
    // 2. Releases API: GET /api/releases or GET /api/releases/:product
    // =========================================================================
    if (url.pathname.startsWith('/api/releases') && request.method === 'GET') {
      try {
        const releaseProvider = new GitHubReleaseProvider(env);
        const includePrereleases = url.searchParams.get('includePrereleases') === 'true';

        const segments = url.pathname.split('/').filter(Boolean);
        // /api/releases -> segments = ['api', 'releases']
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

        // /api/releases/:product -> segments = ['api', 'releases', ':product']
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

    // =========================================================================
    // 3. Download Proxy: GET /api/download/:product/:assetId
    // =========================================================================
    if (url.pathname.startsWith('/api/download/') && request.method === 'GET') {
      const segments = url.pathname.split('/').filter(Boolean);
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

      // Check if this download was initiated by an authenticated user
      const cookieHeader = request.headers.get('Cookie');
      const session = await verifySessionCookie(cookieHeader, env.SESSION_SECRET || 'visiongo-session-secret-2026');
      if (session?.userId) {
        // Associate download with user in D1 non-blockingly
        const recordUserTask = recordUserDownloadHistory(
          env,
          session.userId,
          productParam as SupportedProduct,
          result.version || 'v1.0.0',
          result.filename
        );
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(recordUserTask);
        }
      }

      // Record download event to Workers Analytics Engine (Privacy-preserving: HMAC hash, zero raw IP)
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

    // =========================================================================
    // 4. Contact & Enterprise Inquiry API: POST /api/contact
    // =========================================================================
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
          websiteUrl?: string; // Honeypot field
        };

        // If honeypot is populated, silently acknowledge without processing
        if (body.websiteUrl) {
          return new Response(
            JSON.stringify({ success: true, referenceId: `VG-${Date.now().toString(36).toUpperCase()}` }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const email = (body.email || '').trim();
        const content = (body.message || body.projectScope || '').trim();

        if (!email || !content) {
          return new Response(
            JSON.stringify({ error: 'Work email and project details are required.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return new Response(
            JSON.stringify({ error: 'Please enter a valid work email address.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const referenceId = `VG-${Date.now().toString(36).toUpperCase()}`;

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

    // =========================================================================
    // 5. Authentication APIs: /api/auth/*
    // =========================================================================

    // POST /api/auth/google - Verify Google ID token and establish session
    if (url.pathname === '/api/auth/google' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { credential?: string };
        if (!body.credential) {
          return new Response(
            JSON.stringify({ error: 'Google credential token is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const profile = await verifyGoogleIdToken(body.credential, env.GOOGLE_CLIENT_ID);
        if (!profile) {
          return new Response(
            JSON.stringify({ error: 'Invalid or expired Google credential' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Onboard or load user in D1
        const user = await getOrCreateUser(env, profile);

        // Create secure signed session cookie
        const { cookieHeader } = await createSessionCookie(
          user.id,
          user.googleSub,
          env.SESSION_SECRET || 'visiongo-session-secret-2026'
        );

        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              createdAt: user.createdAt,
            },
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': cookieHeader,
            },
          }
        );
      } catch (err) {
        console.error('[Auth Google Error]:', err);
        return new Response(
          JSON.stringify({ error: 'Authentication failed due to server error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // GET /api/auth/me - Retrieve current authenticated user
    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      const cookieHeader = request.headers.get('Cookie');
      const session = await verifySessionCookie(cookieHeader, env.SESSION_SECRET || 'visiongo-session-secret-2026');

      if (!session) {
        return new Response(JSON.stringify({ user: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }

      const user = await getUserById(env, session.userId);
      if (!user) {
        return new Response(JSON.stringify({ user: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }

      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }
      );
    }

    // POST /api/auth/logout - Terminate session
    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      const expiredCookie = 'vg_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': expiredCookie,
        },
      });
    }

    // GET /api/user/downloads - Retrieve authenticated user's download history
    if (url.pathname === '/api/user/downloads' && request.method === 'GET') {
      const cookieHeader = request.headers.get('Cookie');
      const session = await verifySessionCookie(cookieHeader, env.SESSION_SECRET || 'visiongo-session-secret-2026');

      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const downloads = await getUserDownloadHistory(env, session.userId);
      return new Response(JSON.stringify({ success: true, downloads }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // =========================================================================
    // 6. Strict API 404 Guard: Any unhandled /api/* must NEVER return HTML SPA
    // =========================================================================
    if (url.pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'API route not found', path: url.pathname }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 7. Static Assets & Direct SEO Route Handling
    // =========================================================================

    // Handle robots.txt and sitemap.xml directly
    if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status >= 400) {
        return new Response('Not Found', { status: 404 });
      }
      return assetRes;
    }

    // Guard static assets: Non-existent /assets/* files must 404, never return HTML SPA
    if (url.pathname.startsWith('/assets/')) {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status >= 400 || assetRes.headers.get('Content-Type')?.includes('text/html')) {
        return new Response('Asset Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
      }
      return assetRes;
    }

    // Known direct public routes: Fetch prerendered snapshot directly if available
    const knownDirectRoutes = [
      '/products/visionstudio',
      '/products/visionruntime',
      '/products/visionedge',
      '/products/visioncloud',
      '/solutions',
      '/developers',
      '/downloads',
      '/resources',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
    ];

    const cleanPath = url.pathname.replace(/\/$/, '');
    if (knownDirectRoutes.includes(cleanPath)) {
      // Fetch /route/index.html snapshot directly to ensure instant HTTP 200 without redirect
      const snapshotReq = new Request(new URL(`${cleanPath}/index.html`, request.url), request);
      const snapshotRes = await env.ASSETS.fetch(snapshotReq);
      if (snapshotRes.status === 200) {
        const headers = new Headers(snapshotRes.headers);
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('X-Frame-Options', 'DENY');
        headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        headers.set('Content-Type', 'text/html; charset=utf-8');

        return new Response(snapshotRes.body, {
          status: 200,
          headers,
        });
      }
    }

    // Fallback: serve root SPA document via Cloudflare Workers Assets
    const response = await env.ASSETS.fetch(request);

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
