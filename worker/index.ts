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
  createDesktopAccessToken,
  createDesktopAuthCode,
  verifyDesktopAuthCode,
  verifyPkceChallenge,
  createDesktopRefreshToken,
  verifyDesktopRefreshToken,
  generateVerificationCode,
  saveVerificationCode,
  verifyAndConsumeCode,
  sendVerificationEmail,
  getUserByEmail,
  registerUserWithEmail,
  loginUserWithEmail,
  getOrCreateGitHubUser,
} from './auth';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // =========================================================================
    // Canonical Host, Protocol, and URL Normalization (301 Permanent Redirect)
    // =========================================================================
    const hostname = url.hostname.toLowerCase();
    const forwardedProto = request.headers.get('x-forwarded-proto') || (url.protocol ? url.protocol.replace(':', '') : 'https');
    
    // In production, force HTTPS and root domain visiongo.app
    const isProductionCustomDomain = hostname === 'www.visiongo.app' || hostname === 'visiongo.app';
    if (isProductionCustomDomain && (hostname === 'www.visiongo.app' || forwardedProto === 'http')) {
      const redirectUrl = new URL(request.url);
      redirectUrl.hostname = 'visiongo.app';
      redirectUrl.protocol = 'https:';
      return Response.redirect(redirectUrl.toString(), 301);
    }

    // Redirect /index.html -> / (skip for internal worker/SPA fetches)
    if (url.pathname === '/index.html' && !request.headers.get('x-internal-spa')) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = '/';
      return Response.redirect(redirectUrl.toString(), 301);
    }

    // Normalize trailing slash on non-root paths: /downloads/ -> /downloads
    // (Only for GET/HEAD requests, skip API routes)
    if (
      url.pathname.length > 1 &&
      url.pathname.endsWith('/') &&
      !url.pathname.startsWith('/api/') &&
      (request.method === 'GET' || request.method === 'HEAD')
    ) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = url.pathname.slice(0, -1);
      return Response.redirect(redirectUrl.toString(), 301);
    }

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
      const session = await verifySessionCookie(cookieHeader, env.SESSION_SECRET);
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

    // GET /api/auth/config - Public auth configuration
    if (url.pathname === '/api/auth/config' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          googleClientId: env.GOOGLE_CLIENT_ID || null,
          githubClientId: env.GITHUB_CLIENT_ID || null,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
          },
        }
      );
    }

    // POST /api/auth/email/send-code - Send 6-digit verification code to email
    if (url.pathname === '/api/auth/email/send-code' && request.method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as { email?: string; purpose?: string };
        const email = (body.email || '').trim().toLowerCase();
        const purpose = body.purpose === 'login' ? 'login' : 'register';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          return new Response(
            JSON.stringify({ error: '请输入有效的邮箱地址' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (purpose === 'register') {
          const existing = await getUserByEmail(env, email);
          if (existing) {
            return new Response(
              JSON.stringify({ error: '该邮箱已被注册，请直接登录' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }

        const code = generateVerificationCode();
        await saveVerificationCode(env, email, code, purpose);
        await sendVerificationEmail(env, email, code);

        return new Response(
          JSON.stringify({
            success: true,
            message: '验证码已发送至您的邮箱，10分钟内有效',
            devCode: !env.RESEND_API_KEY ? code : undefined,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        console.error('[Send Code Error]:', err);
        return new Response(
          JSON.stringify({ error: '发送验证码失败，请稍后重试' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // POST /api/auth/email/register - Register with verified email and password
    if (url.pathname === '/api/auth/email/register' && request.method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as {
          email?: string;
          code?: string;
          password?: string;
          displayName?: string;
        };

        const email = (body.email || '').trim().toLowerCase();
        const code = (body.code || '').trim();
        const password = body.password || '';
        const displayName = (body.displayName || '').trim();

        if (!email || !code || !password) {
          return new Response(
            JSON.stringify({ error: '邮箱、验证码和密码为必填项' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (password.length < 6) {
          return new Response(
            JSON.stringify({ error: '密码长度不能少于 6 位' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const isCodeValid = await verifyAndConsumeCode(env, email, code, 'register');
        if (!isCodeValid) {
          return new Response(
            JSON.stringify({ error: '验证码错误或已过期，请重新获取' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const regResult = await registerUserWithEmail(env, email, password, displayName);
        if (regResult.error || !regResult.user) {
          return new Response(
            JSON.stringify({ error: regResult.error || '注册失败' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const user = regResult.user;
        const { cookieHeader } = await createSessionCookie(
          user.id,
          user.email,
          env.SESSION_SECRET
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
        console.error('[Register Error]:', err);
        return new Response(
          JSON.stringify({ error: '注册发生服务异常，请重试' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // POST /api/auth/email/login - Authenticate with email & password
    if (url.pathname === '/api/auth/email/login' && request.method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';

        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: '请输入邮箱和密码' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const loginResult = await loginUserWithEmail(env, email, password);
        if (loginResult.error || !loginResult.user) {
          return new Response(
            JSON.stringify({ error: loginResult.error || '邮箱或密码错误' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const user = loginResult.user;
        const { cookieHeader } = await createSessionCookie(
          user.id,
          user.email,
          env.SESSION_SECRET
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
        console.error('[Email Login Error]:', err);
        return new Response(
          JSON.stringify({ error: '登录服务异常，请稍后重试' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // GET /api/auth/github - Start GitHub OAuth flow
    if (url.pathname === '/api/auth/github' && request.method === 'GET') {
      const returnUrl = url.searchParams.get('returnUrl') || '/account';
      if (!env.GITHUB_CLIENT_ID) {
        return Response.redirect(`${url.origin}${returnUrl}?auth_notice=github_not_configured`, 302);
      }
      const state = btoa(JSON.stringify({ returnUrl, t: Date.now() }));
      const redirectUri = `${url.origin}/api/auth/github/callback`;
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
        env.GITHUB_CLIENT_ID
      )}&scope=user:email&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
      return Response.redirect(githubAuthUrl, 302);
    }

    // GET /api/auth/github/callback - GitHub OAuth callback handler
    if (url.pathname === '/api/auth/github/callback' && request.method === 'GET') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      let returnUrl = '/account';
      if (state) {
        try {
          const parsed = JSON.parse(atob(state));
          if (parsed.returnUrl) returnUrl = parsed.returnUrl;
        } catch {
          // Ignore state decoding error
        }
      }

      if (!code) {
        return Response.redirect(`${url.origin}${returnUrl}?auth_error=github_cancelled`, 302);
      }

      try {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        });

        const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
        if (!tokenData.access_token) {
          return Response.redirect(`${url.origin}${returnUrl}?auth_error=github_token_failed`, 302);
        }

        const userRes = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'User-Agent': 'VISIONGO-Website-Auth',
            'Accept': 'application/json',
          },
        });
        const ghUser = (await userRes.json()) as {
          id: number;
          login: string;
          name?: string;
          email?: string;
          avatar_url?: string;
        };

        let email = ghUser.email;
        if (!email) {
          const emailsRes = await fetch('https://api.github.com/user/emails', {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'User-Agent': 'VISIONGO-Website-Auth',
              'Accept': 'application/json',
            },
          });
          if (emailsRes.ok) {
            const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
            const primary = emails.find(e => e.primary && e.verified) || emails[0];
            if (primary) email = primary.email;
          }
        }

        const user = await getOrCreateGitHubUser(env, {
          id: ghUser.id,
          login: ghUser.login,
          name: ghUser.name,
          email: email || `${ghUser.login}@users.noreply.github.com`,
          avatar_url: ghUser.avatar_url,
        });

        const { cookieHeader } = await createSessionCookie(
          user.id,
          user.githubId || user.email,
          env.SESSION_SECRET
        );

        return new Response(null, {
          status: 302,
          headers: {
            'Location': returnUrl,
            'Set-Cookie': cookieHeader,
          },
        });
      } catch (err) {
        console.error('[GitHub Callback Error]:', err);
        return Response.redirect(`${url.origin}${returnUrl}?auth_error=github_server_error`, 302);
      }
    }

    // POST /api/auth/github/direct - Direct / Simulated GitHub sign-in for dev and demo
    if (url.pathname === '/api/auth/github/direct' && request.method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as {
          login?: string;
          name?: string;
          email?: string;
        };

        const user = await getOrCreateGitHubUser(env, {
          id: 'gh_demo_1092834',
          login: body.login || 'visiongo-developer',
          name: body.name || 'Industrial Vision Engineer',
          email: body.email || 'developer@visiongo.app',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        });

        const { cookieHeader } = await createSessionCookie(
          user.id,
          user.githubId || user.email,
          env.SESSION_SECRET
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
        console.error('[GitHub Direct Error]:', err);
        return new Response(
          JSON.stringify({ error: 'GitHub 登录遇到错误' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

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
          env.SESSION_SECRET
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
      const session = await verifySessionCookie(cookieHeader, env.SESSION_SECRET);

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

    // OPTIONS for public auth endpoints (Desktop client / Studio)
    if ((url.pathname === '/api/auth/token' || url.pathname === '/api/auth/refresh') && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // POST /api/auth/desktop-code - Mint a 5-minute single-use authorization code for PKCE flow.
    // Authentication comes from the HttpOnly website session cookie.
    if (url.pathname === '/api/auth/desktop-code' && request.method === 'POST') {
      const cookieHeader = request.headers.get('Cookie');
      const session = await verifySessionCookie(cookieHeader, env.SESSION_SECRET);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
      const user = await getUserById(env, session.userId);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Authenticated user no longer exists' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
      try {
        const body = (await request.json().catch(() => ({}))) as {
          code_challenge?: string;
          code_challenge_method?: string;
        };
        if (!body.code_challenge) {
          return new Response(JSON.stringify({ error: 'code_challenge is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }
        const method = body.code_challenge_method === 'plain' ? 'plain' : 'S256';
        const code = await createDesktopAuthCode(user, body.code_challenge, method, env.SESSION_SECRET);
        return new Response(
          JSON.stringify({
            code,
            expires_in: 300,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          }
        );
      } catch (err) {
        console.error('[Desktop Code Error]:', err);
        return new Response(JSON.stringify({ error: 'Failed to create authorization code' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
    }

    // POST /api/auth/token - Exchange authorization code + code_verifier for Access & Refresh tokens.
    if (url.pathname === '/api/auth/token' && request.method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as {
          grant_type?: string;
          code?: string;
          code_verifier?: string;
        };
        if (body.grant_type !== 'authorization_code' || !body.code || !body.code_verifier) {
          return new Response(
            JSON.stringify({ error: 'invalid_request', error_description: 'grant_type=authorization_code, code, and code_verifier are required' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
            }
          );
        }

        const authCode = await verifyDesktopAuthCode(body.code, env.SESSION_SECRET);
        if (!authCode) {
          return new Response(
            JSON.stringify({ error: 'invalid_grant', error_description: 'Authorization code is invalid or expired' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
            }
          );
        }

        const isPkceValid = await verifyPkceChallenge(body.code_verifier, authCode.codeChallenge, authCode.codeChallengeMethod);
        if (!isPkceValid) {
          return new Response(
            JSON.stringify({ error: 'invalid_grant', error_description: 'PKCE code_verifier verification failed' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
            }
          );
        }

        const user = await getUserById(env, authCode.userId);
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'invalid_grant', error_description: 'User not found' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
            }
          );
        }

        const token = await createDesktopAccessToken(env, user);
        const refreshToken = await createDesktopRefreshToken(user, env.SESSION_SECRET);

        return new Response(
          JSON.stringify({
            access_token: token.accessToken,
            token_type: 'Bearer',
            expires_in: token.expiresIn,
            refresh_token: refreshToken,
            tenant_id: token.tenantId,
            user_id: user.id,
            username: user.displayName || user.email.split('@')[0],
            email: user.email,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-store',
            },
          }
        );
      } catch (err) {
        console.error('[Token Exchange Error]:', err);
        return new Response(
          JSON.stringify({ error: 'server_error', error_description: 'Failed to exchange authorization code' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
          }
        );
      }
    }

    // POST /api/auth/refresh - Refresh desktop access token using refresh_token.
    if (url.pathname === '/api/auth/refresh' && request.method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as {
          refresh_token?: string;
        };
        if (!body.refresh_token) {
          return new Response(
            JSON.stringify({ error: 'invalid_request', error_description: 'refresh_token is required' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
            }
          );
        }

        const refreshPayload = await verifyDesktopRefreshToken(body.refresh_token, env.SESSION_SECRET);
        if (!refreshPayload) {
          return new Response(
            JSON.stringify({ error: 'invalid_grant', error_description: 'Refresh token is invalid or expired' }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
            }
          );
        }

        const user = await getUserById(env, refreshPayload.userId);
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'invalid_grant', error_description: 'User not found' }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
            }
          );
        }

        const token = await createDesktopAccessToken(env, user);
        return new Response(
          JSON.stringify({
            access_token: token.accessToken,
            token_type: 'Bearer',
            expires_in: token.expiresIn,
            tenant_id: token.tenantId,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-store',
            },
          }
        );
      } catch (err) {
        console.error('[Token Refresh Error]:', err);
        return new Response(
          JSON.stringify({ error: 'server_error', error_description: 'Failed to refresh token' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
          }
        );
      }
    }

    // POST /api/auth/desktop-token - Mint a short-lived Cloud access token.
    // Authentication comes exclusively from the HttpOnly website session cookie.
    if (url.pathname === '/api/auth/desktop-token' && request.method === 'POST') {
      const cookieHeader = request.headers.get('Cookie');
      const session = await verifySessionCookie(cookieHeader, env.SESSION_SECRET);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
      const user = await getUserById(env, session.userId);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Authenticated user no longer exists' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
      try {
        const token = await createDesktopAccessToken(env, user);
        return new Response(JSON.stringify({
          access_token: token.accessToken,
          token_type: 'Bearer',
          expires_in: token.expiresIn,
          tenant_id: token.tenantId,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      } catch (err) {
        console.error('[Desktop Token Error]:', err);
        return new Response(JSON.stringify({ error: 'Desktop authorization is not configured' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
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
      const session = await verifySessionCookie(cookieHeader, env.SESSION_SECRET);

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

    // A. Handle robots.txt and sitemap.xml directly
    if (url.pathname === '/robots.txt') {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status >= 400) return new Response('User-agent: *\nAllow: /\nSitemap: https://visiongo.app/sitemap.xml\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      const headers = new Headers(assetRes.headers);
      headers.set('Content-Type', 'text/plain; charset=utf-8');
      headers.set('Cache-Control', 'public, max-age=3600');
      return new Response(assetRes.body, { status: 200, headers });
    }

    if (url.pathname === '/sitemap.xml') {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status >= 400) return new Response('Not Found', { status: 404 });
      const headers = new Headers(assetRes.headers);
      headers.set('Content-Type', 'application/xml; charset=utf-8');
      headers.set('Cache-Control', 'public, max-age=3600');
      return new Response(assetRes.body, { status: 200, headers });
    }

    // B. Static asset files (e.g. /assets/*, images, fonts, icons)
    const isStaticAsset =
      url.pathname.startsWith('/assets/') ||
      /\.(svg|png|jpg|jpeg|gif|ico|webp|woff|woff2|ttf|css|js|map|json|txt|xml)$/i.test(url.pathname);

    if (isStaticAsset) {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status >= 400 || (url.pathname.startsWith('/assets/') && assetRes.headers.get('Content-Type')?.includes('text/html'))) {
        return new Response('Asset Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
      }
      return assetRes;
    }

    // Security headers helper for all HTML responses
    const applySecurityHeaders = (headers: Headers, is404 = false) => {
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      headers.set('Content-Type', 'text/html; charset=utf-8');
      if (is404) {
        headers.set('X-Robots-Tag', 'noindex, nofollow');
        headers.set('Cache-Control', 'no-store');
      } else {
        headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    };

    // C. Root route: /
    if (url.pathname === '/') {
      let homeRes = await env.ASSETS.fetch(new Request(new URL('/home.html', request.url)));
      if (homeRes.status !== 200) {
        homeRes = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
      }
      if (homeRes.status !== 200) {
        homeRes = await env.ASSETS.fetch(new Request(new URL('/', request.url)));
      }
      const headers = new Headers(homeRes.headers);
      headers.delete('location'); // Strip any redirect location header
      applySecurityHeaders(headers);
      return new Response(homeRes.body, { status: 200, headers });
    }

    // D. Known public routes: Return corresponding pre-rendered HTML snapshot with status 200
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

    if (knownDirectRoutes.includes(url.pathname)) {
      // Try fetching ${url.pathname}.html or ${url.pathname}/index.html from dist
      let snapshotRes = await env.ASSETS.fetch(new Request(new URL(`${url.pathname}.html`, request.url)));
      if (snapshotRes.status !== 200) {
        snapshotRes = await env.ASSETS.fetch(new Request(new URL(`${url.pathname}/index.html`, request.url)));
      }
      if (snapshotRes.status !== 200) {
        snapshotRes = await env.ASSETS.fetch(new Request(new URL(url.pathname, request.url)));
      }

      if (snapshotRes.status === 200) {
        const headers = new Headers(snapshotRes.headers);
        applySecurityHeaders(headers);
        return new Response(snapshotRes.body, { status: 200, headers });
      }
    }

    // E. Authenticated client application routes: /my, /account, /desktop/*
    if (url.pathname === '/my' || url.pathname === '/account' || url.pathname.startsWith('/desktop')) {
      let spaRes = await env.ASSETS.fetch(new Request(new URL('/my.html', request.url)));
      if (spaRes.status !== 200) {
        spaRes = await env.ASSETS.fetch(new Request(new URL('/account.html', request.url)));
      }
      if (spaRes.status !== 200) {
        const spaReq = new Request(new URL('/index.html', request.url), {
          headers: new Headers({
            ...Object.fromEntries(request.headers),
            'x-internal-spa': 'true',
          }),
        });
        spaRes = await env.ASSETS.fetch(spaReq);
      }
      const headers = new Headers(spaRes.headers);
      headers.delete('location');
      applySecurityHeaders(headers);
      return new Response(spaRes.body, { status: 200, headers });
    }

    // F. Unknown route -> Return custom 404.html with real HTTP 404 status!
    const notFoundReq = new Request(new URL('/404.html', request.url), request);
    const notFoundRes = await env.ASSETS.fetch(notFoundReq);
    const notFoundHeaders = new Headers(notFoundRes.headers);
    applySecurityHeaders(notFoundHeaders, true);

    return new Response(notFoundRes.body, {
      status: 404,
      statusText: 'Not Found',
      headers: notFoundHeaders,
    });
  },
};
