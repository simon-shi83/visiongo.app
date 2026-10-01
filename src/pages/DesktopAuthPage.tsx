import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Laptop, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { SeoHead } from '../components/SeoHead';

export const DesktopAuthPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [params, setParams] = useState<{
    redirectUri: string;
    state: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  } | null>(null);
  const [redirected, setRedirected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUri = urlParams.get('redirect_uri') || '';
    const state = urlParams.get('state') || '';
    const codeChallenge = urlParams.get('code_challenge') || undefined;
    const codeChallengeMethod = urlParams.get('code_challenge_method') || undefined;

    // Validate redirectUri matches loopback localhost pattern for security
    if (redirectUri && !/^http:\/\/(127\.0\.0\.1|localhost):\d{4,5}\/visionxr\/login$/.test(redirectUri)) {
      setErrorMsg('非法的重定向地址，必须为本机桌面客户端回环端口。');
      return;
    }

    setParams({ redirectUri, state, codeChallenge, codeChallengeMethod });
  }, []);

  const handleAuthorize = async () => {
    if (!user || !params || !params.redirectUri) return;
    setErrorMsg('');
    try {
      const callbackUrl = new URL(params.redirectUri);
      callbackUrl.searchParams.set('state', params.state);

      if (params.codeChallenge) {
        // Modern PKCE flow: fetch short-lived authorization code without leaking JWT into URL
        const response = await fetch('/api/auth/desktop-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code_challenge: params.codeChallenge,
            code_challenge_method: params.codeChallengeMethod || 'S256',
          }),
        });
        const body = (await response.json()) as { code?: string; error?: string };
        if (!response.ok || !body.code) {
          throw new Error(body.error || '获取桌面授权码失败');
        }
        callbackUrl.searchParams.set('code', body.code);
      } else {
        // Legacy flow fallback
        const response = await fetch('/api/auth/desktop-token', { method: 'POST' });
        const body = (await response.json()) as {
          access_token?: string;
          tenant_id?: string;
          error?: string;
        };
        if (!response.ok || !body.access_token || !body.tenant_id) {
          throw new Error(body.error || '网站未返回有效的桌面访问凭据');
        }

        callbackUrl.searchParams.set('user_id', user.id);
        callbackUrl.searchParams.set('username', user.displayName || user.email.split('@')[0]);
        callbackUrl.searchParams.set('email', user.email);
        callbackUrl.searchParams.set('tenant_id', body.tenant_id);
        callbackUrl.searchParams.set('access_token', body.access_token);
      }

      setRedirected(true);
      window.location.href = callbackUrl.toString();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : '桌面授权失败，请稍后重试');
    }
  };

  useEffect(() => {
    // If user is already logged in and params are present, auto redirect
    if (user && params?.redirectUri && !redirected && !errorMsg) {
      const timer = setTimeout(() => {
        void handleAuthorize();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user, params, redirected, errorMsg]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-32 pb-24 flex items-center justify-center px-4">
      <SeoHead
        title="VisionStudio 授权登录 — VISIONGO"
        description="通过官方统一账号安全登录 VisionStudio 工业智能体桌面应用。"
        canonicalPath="/auth/desktop"
      />

      <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-2xl text-center space-y-6 tech-grid">
        <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <Laptop className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            授权登录 VisionStudio
          </h2>
          <p className="text-zinc-400 text-xs mt-2">
            授权后，VisionStudio 桌面客户端将同步您的云端身份与组织 Credits 配额。
          </p>
        </div>

        {errorMsg ? (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm">
            {errorMsg}
          </div>
        ) : loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
          </div>
        ) : !user ? (
          <div className="space-y-4">
            <p className="text-zinc-300 text-sm">请先登录您的 VISIONGO 账号：</p>
            <div className="flex justify-center">
              <GoogleSignInButton onSuccess={() => {}} />
            </div>
            <p className="text-xs text-zinc-500">
              登录成功后将自动返回 VisionStudio 客户端。
            </p>
          </div>
        ) : redirected ? (
          <div className="space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-emerald-300 font-medium">✓ 授权成功！正在返回桌面应用...</p>
            <p className="text-xs text-zinc-500">若浏览器未自动关闭，您可以安全关闭本标签页。</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                {user.displayName ? user.displayName[0].toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div className="overflow-hidden">
                <div className="font-semibold text-white truncate text-sm">{user.displayName || user.email}</div>
                <div className="text-xs text-zinc-400 truncate">{user.email}</div>
              </div>
            </div>

            <button
              onClick={() => void handleAuthorize()}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>立即确认授权</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
