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

import { Env, isValidProduct, SupportedProduct, SUPPORTED_DOWNLOAD_PRODUCTS, ProductRelease, User } from './types';
import { GitHubReleaseProvider, GitHubDownloadProvider } from './github';
import { recordDownloadAnalytics } from './analytics';
import { receiveInquiry, dispatchInquiries } from './contacts';
import { allowRequest, json } from './reliability';
import { isPublicPath, localizedPath, stripLocalePath } from '../shared/routing';
import { safeReturnPath, startGitHubOAuth, consumeGitHubOAuth, clearGitHubStateCookie } from './githubOAuth';
import { effectiveRole, handleOrganizationApi, rememberTenant, resolveTenant, ResolvedTenant } from './organizations';
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

// Desktop sign-in endpoints of SDK/schemas/identity.json plus the legacy page flow.
const DESKTOP_TOKEN_PATHS = new Set(['/api/auth/token', '/api/auth/refresh', '/api/auth/switch-tenant']);
const DESKTOP_HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };

/** SDK IdentityErrorResponse. */
function desktopError(status: number, error: string, description: string): Response {
  return new Response(JSON.stringify({ error, error_description: description }), { status, headers: DESKTOP_HEADERS });
}

/** SDK IdentityTokenResponse for the resolved organization. */
async function desktopTokenResponse(env: Env, user: User, resolved: ResolvedTenant,
                                    options: { refresh: boolean; remember: boolean }): Promise<Response> {
  const token = await createDesktopAccessToken(env, user, resolved.tenant);
  const body: Record<string, unknown> = {
    access_token: token.accessToken,
    token_type: 'Bearer',
    expires_in: token.expiresIn,
    tenant_id: token.tenantId,
  };
  if (options.refresh) {
    body.refresh_token = await createDesktopRefreshToken(user, env.SESSION_SECRET, resolved.tenant.tenant_id);
  }
  if (options.remember) await rememberTenant(env, user.id, resolved.tenant.tenant_id);
  Object.assign(body, {
    user_id: user.id,
    username: user.displayName || user.email.split('@')[0],
    email: user.email,
    role: effectiveRole(user, resolved.tenant),
    tenant_name: resolved.tenant.name,
    tenant_type: resolved.tenant.type,
    tenants: resolved.tenants,
  });
  return new Response(JSON.stringify(body), { status: 200, headers: DESKTOP_HEADERS });
}

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Browser writes must originate from this site; desktop token contracts are unchanged.
    if (request.method === 'POST' && (url.pathname === '/api/contact' || url.pathname.startsWith('/api/auth/email/')
        || url.pathname === '/api/orgs' || url.pathname.startsWith('/api/orgs/'))) {
      const origin = request.headers.get('Origin');
      if (origin && origin !== url.origin) return json({ error: 'Invalid request origin.' }, 403);
      const address = request.headers.get('CF-Connecting-IP');
      if (address && !await allowRequest(env, 'website-write', address, 30, 600)) return json({ error: 'Too many requests. Please retry later.' }, 429);
    }

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
          const results = await Promise.allSettled(SUPPORTED_DOWNLOAD_PRODUCTS.map(product => releaseProvider.getProductReleases(product, includePrereleases)));
          const releases = {} as Record<SupportedProduct, ProductRelease[]>;
          const errors: Partial<Record<SupportedProduct, string>> = {};
          results.forEach((result, index) => {
            const product = SUPPORTED_DOWNLOAD_PRODUCTS[index];
            releases[product] = result.status === 'fulfilled' ? result.value : [];
            if (result.status === 'rejected') errors[product] = 'Release service unavailable. Please retry.';
          });
          const failed = Object.keys(errors).length;
          return Response.json({ success: failed < results.length, releases, errors, updatedAt: new Date().toISOString() }, {
            status: failed === results.length ? 503 : 200,
            headers: { 'Cache-Control': failed ? 'no-store' : 'public, max-age=300, s-maxage=600' },
          });
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
          result.version || 'unknown',
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
          version: result.version || 'unknown',
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
      const safeFilename = result.filename.replace(/[\x00-\x1f\x7f"\\]/g, '_').replace(/[^\x20-\x7e]/g, '_');
      const encodedFilename = encodeURIComponent(result.filename).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
      downloadHeaders.set('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`);
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
      return receiveInquiry(request, env, ctx);
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

        if (!await allowRequest(env, 'email-code', email, 1, 60)) return json({ error: '请稍后再申请验证码' }, 429);
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
        const delivered = await sendVerificationEmail(env, email, code);
        if (!delivered.success) {
          await env.DB!.prepare('DELETE FROM email_verification_codes WHERE email = ? AND code = ?').bind(email, code).run();
          return json({ error: '验证码发送失败，请稍后重试' }, 503);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: '验证码已发送至您的邮箱，10分钟内有效',
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

        if (!await allowRequest(env, 'email-register', email, 10, 600)) return json({ error: '尝试次数过多，请稍后重试' }, 429);
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

        if (!await allowRequest(env, 'email-login', email, 10, 600)) return json({ error: '尝试次数过多，请稍后重试' }, 429);
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

    // Browser-bound, expiring, one-use GitHub OAuth state with PKCE.
    if (url.pathname === '/api/auth/github' && request.method === 'GET') {
      const returnPath = safeReturnPath(url.searchParams.get('returnUrl'));
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.DB || !env.SESSION_SECRET) {
        const redirect = new URL(returnPath, url.origin);
        redirect.searchParams.set('auth_notice', 'github_not_configured');
        return Response.redirect(redirect.toString(), 302);
      }
      const flow = await startGitHubOAuth(env, returnPath);
      const authorize = new URL('https://github.com/login/oauth/authorize');
      authorize.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, scope: 'user:email',
        redirect_uri: `${url.origin}/api/auth/github/callback`, state: flow.state,
        code_challenge: flow.challenge, code_challenge_method: 'S256' }).toString();
      return new Response(null, { status: 302, headers: { Location: authorize.toString(), 'Set-Cookie': flow.cookie, 'Cache-Control': 'no-store' } });
    }

    if (url.pathname === '/api/auth/github/callback' && request.method === 'GET') {
      const redirect = (path: string, error?: string, sessionCookie?: string) => {
        const destination = new URL(safeReturnPath(path), url.origin);
        if (error) destination.searchParams.set('auth_error', error);
        const headers = new Headers({ Location: destination.toString(), 'Cache-Control': 'no-store' });
        headers.append('Set-Cookie', clearGitHubStateCookie);
        if (sessionCookie) headers.append('Set-Cookie', sessionCookie);
        return new Response(null, { status: 302, headers });
      };
      let returnPath = '/my';
      try {
        const flow = await consumeGitHubOAuth(env, url.searchParams.get('state'), request.headers.get('Cookie'));
        if (!flow) return redirect('/my', 'github_invalid_state');
        returnPath = flow.return_path;
        const code = url.searchParams.get('code');
        if (!code) return redirect(returnPath, 'github_cancelled');
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST', signal: AbortSignal.timeout(10000),
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
            redirect_uri: `${url.origin}/api/auth/github/callback`, code_verifier: flow.code_verifier, code }),
        });
        const token = await tokenRes.json() as { access_token?: string };
        if (!tokenRes.ok || !token.access_token) return redirect(returnPath, 'github_token_failed');
        const headers = { Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'VISIONGO-Website-Auth', Accept: 'application/json' };
        const userRes = await fetch('https://api.github.com/user', { headers, signal: AbortSignal.timeout(10000) });
        const profile = await userRes.json() as { id: number; login: string; name?: string; avatar_url?: string };
        if (!userRes.ok || !profile.id || !profile.login) return redirect(returnPath, 'github_profile_failed');
        const emailsRes = await fetch('https://api.github.com/user/emails', { headers, signal: AbortSignal.timeout(10000) });
        if (!emailsRes.ok) return redirect(returnPath, 'github_email_failed');
        const emails = await emailsRes.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
        const email = emails.find(item => item.primary && item.verified) || emails.find(item => item.verified);
        if (!email) return redirect(returnPath, 'github_email_failed');
        const user = await getOrCreateGitHubUser(env, { ...profile, email: email.email });
        const session = await createSessionCookie(user.id, user.githubId || user.email, env.SESSION_SECRET);
        return redirect(returnPath, undefined, session.cookieHeader);
      } catch {
        console.error('[GitHub] OAuth callback failed');
        return redirect(returnPath, 'github_server_error');
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
          user.googleSub!,
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

    // OPTIONS for public desktop auth endpoints (VisionStudio)
    if (DESKTOP_TOKEN_PATHS.has(url.pathname) && request.method === 'OPTIONS') {
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

    // POST /api/auth/desktop-code - Mint a 5-minute authorization code for the PKCE flow.
    // Authentication comes from the HttpOnly website session cookie. An optional
    // tenant_id selects the organization the desktop session acts in.
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
          tenant_id?: string;
        };
        if (!body.code_challenge) {
          return new Response(JSON.stringify({ error: 'code_challenge is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }
        let tenantId: string | undefined;
        if (body.tenant_id) {
          const resolved = await resolveTenant(env, user, body.tenant_id);
          if (!resolved) {
            return new Response(JSON.stringify({ error: 'You are not an active member of this organization' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
            });
          }
          tenantId = resolved.tenant.tenant_id;
        }
        const method = body.code_challenge_method === 'plain' ? 'plain' : 'S256';
        const code = await createDesktopAuthCode(user, body.code_challenge, method, env.SESSION_SECRET, tenantId);
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

    // POST /api/auth/token - Exchange authorization code + code_verifier (SDK identity Token).
    if (url.pathname === '/api/auth/token' && request.method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as {
          grant_type?: string;
          code?: string;
          code_verifier?: string;
          tenant_id?: string;
        };
        if (body.grant_type !== 'authorization_code' || !body.code || !body.code_verifier) {
          return desktopError(400, 'invalid_request', 'grant_type=authorization_code, code, and code_verifier are required');
        }

        const authCode = await verifyDesktopAuthCode(body.code, env.SESSION_SECRET);
        if (!authCode) {
          return desktopError(400, 'invalid_grant', 'Authorization code is invalid or expired');
        }

        const isPkceValid = await verifyPkceChallenge(body.code_verifier, authCode.codeChallenge, authCode.codeChallengeMethod);
        if (!isPkceValid) {
          return desktopError(400, 'invalid_grant', 'PKCE code_verifier verification failed');
        }

        const user = await getUserById(env, authCode.userId);
        if (!user) {
          return desktopError(400, 'invalid_grant', 'User not found');
        }

        // The organization chosen on the authorization page wins over the client's preference.
        const resolved = await resolveTenant(env, user, authCode.tenantId || body.tenant_id);
        if (!resolved) {
          return desktopError(403, 'invalid_tenant', 'The user is not an active member of the requested organization');
        }
        return await desktopTokenResponse(env, user, resolved, { refresh: true, remember: true });
      } catch (err) {
        console.error('[Token Exchange Error]:', err);
        return desktopError(500, 'server_error', 'Failed to exchange authorization code');
      }
    }

    // POST /api/auth/refresh - New access token for the organization the refresh token is bound to.
    // Membership is checked again, so a removed member stops receiving tokens.
    if (url.pathname === '/api/auth/refresh' && request.method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as {
          refresh_token?: string;
        };
        if (!body.refresh_token) {
          return desktopError(400, 'invalid_request', 'refresh_token is required');
        }

        const refreshPayload = await verifyDesktopRefreshToken(body.refresh_token, env.SESSION_SECRET);
        if (!refreshPayload) {
          return desktopError(401, 'invalid_grant', 'Refresh token is invalid or expired');
        }

        const user = await getUserById(env, refreshPayload.userId);
        if (!user) {
          return desktopError(401, 'invalid_grant', 'User not found');
        }

        // Refresh tokens issued before organizations are bound to the personal organization.
        const resolved = await resolveTenant(env, user, refreshPayload.tenantId || user.tenantId);
        if (!resolved) {
          return desktopError(403, 'tenant_access_revoked', 'The user is no longer an active member of this organization');
        }
        return await desktopTokenResponse(env, user, resolved, { refresh: false, remember: false });
      } catch (err) {
        console.error('[Token Refresh Error]:', err);
        return desktopError(500, 'server_error', 'Failed to refresh token');
      }
    }

    // POST /api/auth/switch-tenant - Rebind the desktop session to another organization.
    if (url.pathname === '/api/auth/switch-tenant' && request.method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as {
          refresh_token?: string;
          tenant_id?: string;
        };
        if (!body.refresh_token || !body.tenant_id) {
          return desktopError(400, 'invalid_request', 'refresh_token and tenant_id are required');
        }
        const refreshPayload = await verifyDesktopRefreshToken(body.refresh_token, env.SESSION_SECRET);
        if (!refreshPayload) {
          return desktopError(401, 'invalid_grant', 'Refresh token is invalid or expired');
        }
        const user = await getUserById(env, refreshPayload.userId);
        if (!user) {
          return desktopError(401, 'invalid_grant', 'User not found');
        }
        const resolved = await resolveTenant(env, user, body.tenant_id);
        if (!resolved) {
          return desktopError(403, 'invalid_tenant', 'The user is not an active member of the requested organization');
        }
        return await desktopTokenResponse(env, user, resolved, { refresh: true, remember: true });
      } catch (err) {
        console.error('[Switch Tenant Error]:', err);
        return desktopError(500, 'server_error', 'Failed to switch organization');
      }
    }

    // POST /api/auth/desktop-token - Mint a short-lived Cloud access token (legacy page flow).
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
        const resolved = await resolveTenant(env, user);
        if (!resolved) throw new Error('No active organization');
        const token = await createDesktopAccessToken(env, user, resolved.tenant);
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

    // Organizations and members for the account page (session cookie).
    const organizationResponse = await handleOrganizationApi(request, env, url);
    if (organizationResponse) return organizationResponse;

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

    // Public routes and download deep links share the same route registry as SSR.
    if (isPublicPath(url.pathname)) {
      if (url.searchParams.get('lang') === 'zh') {
        return Response.redirect(new URL(localizedPath(`${url.pathname}${url.search}`, 'zh'), url.origin).toString(), 301);
      }
      const locale = url.pathname === '/zh' || url.pathname.startsWith('/zh/') ? 'zh' : 'en';
      const plain = stripLocalePath(url.pathname);
      const snapshot = localizedPath(plain.startsWith('/downloads/') ? '/downloads' : plain, locale);
      const assetPath = snapshot === '/' ? '/home.html' : `${snapshot}.html`;
      const response = await env.ASSETS.fetch(new Request(new URL(assetPath, request.url)));
      if (response.status !== 200) return json({ error: 'Page snapshot unavailable.' }, 503);
      const headers = new Headers(response.headers);
      headers.delete('location');
      applySecurityHeaders(headers);
      return new Response(response.body, { status: 200, headers });
    }

    // E. Authenticated client application routes: /my, /account, /desktop/*
    if (url.pathname === '/my' || url.pathname === '/account' || url.pathname === '/auth/desktop') {
      const spaRes = await env.ASSETS.fetch(new Request(new URL(`${url.pathname}.html`, request.url)));
      if (spaRes.status !== 200) return json({ error: 'Account page unavailable.' }, 503);
      const headers = new Headers(spaRes.headers);
      headers.delete('location');
      applySecurityHeaders(headers);
      headers.set('Cache-Control', 'no-store');
      headers.set('X-Robots-Tag', 'noindex, follow');
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
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try { return await handleRequest(request, env, ctx); }
    catch { console.error('[Worker] Request failed'); return json({ error: 'Service temporarily unavailable. Please retry.' }, 503); }
  },
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.DB) return;
    ctx.waitUntil((async () => {
      await env.DB!.batch([
        env.DB!.prepare('DELETE FROM github_oauth_states WHERE expires_at <= ?').bind(Date.now()),
        env.DB!.prepare('DELETE FROM request_limits WHERE expires_at <= ?').bind(Date.now()),
        env.DB!.prepare('DELETE FROM email_verification_codes WHERE expires_at <= ?').bind(Date.now()),
      ]);
      await dispatchInquiries(env);
    })());
  },
};
