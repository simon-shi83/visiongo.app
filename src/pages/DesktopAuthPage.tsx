import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Building2, Laptop, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { AuthCard } from '../components/AuthCard';
import { SeoHead } from '../components/SeoHead';

interface DesktopTenant {
  tenant_id: string;
  name: string;
  type: 'personal' | 'enterprise';
  role: 'member' | 'org_admin';
}

export const DesktopAuthPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [params, setParams] = useState<{
    redirectUri: string;
    state: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    // A configured web page (VisionCloud panel) rather than the VisionStudio loopback callback.
    portal: boolean;
  } | null>(null);
  const [redirected, setRedirected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Organizations the desktop session may act in; null until loaded.
  const [tenants, setTenants] = useState<DesktopTenant[] | null>(null);
  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    if (!user) return;
    fetch('/api/orgs')
      .then(response => (response.ok ? response.json() : Promise.reject(new Error('organizations'))))
      .then((data: { tenants?: DesktopTenant[]; current_tenant_id?: string | null }) => {
        const list = data.tenants || [];
        setTenants(list);
        setTenantId(data.current_tenant_id || list[0]?.tenant_id || '');
      })
      .catch(() => setErrorMsg('无法读取您所在的组织，请稍后重试'));
  }, [user]);
  const choosesTenant = (tenants?.length ?? 0) > 1;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUri = urlParams.get('redirect_uri') || '';
    const state = urlParams.get('state') || '';
    const codeChallenge = urlParams.get('code_challenge') || undefined;
    const codeChallengeMethod = urlParams.get('code_challenge_method') || undefined;

    const loopback = /^http:\/\/(127\.0\.0\.1|localhost):\d{4,5}\/visionxr\/login$/.test(redirectUri);
    if (!redirectUri || loopback) {
      setParams({ redirectUri, state, codeChallenge, codeChallengeMethod, portal: false });
      return;
    }
    // Web pages receive only an authorization code, so they must use PKCE (S256)
    // and be listed exactly in the server's PORTAL_REDIRECT_URIS.
    fetch('/api/auth/config')
      .then(response => (response.ok ? response.json() : Promise.reject(new Error('config'))))
      .then((config: { portalRedirectUris?: string[] }) => {
        if (!(config.portalRedirectUris || []).includes(redirectUri)) {
          setErrorMsg('非法的重定向地址：必须为本机桌面客户端回环端口，或本站登记的管理后台地址。');
        } else if (!codeChallenge || codeChallengeMethod !== 'S256' || !state) {
          setErrorMsg('管理后台登录缺少 PKCE（S256）参数或 state。');
        } else {
          setParams({ redirectUri, state, codeChallenge, codeChallengeMethod, portal: true });
        }
      })
      .catch(() => setErrorMsg('无法读取登录配置，请稍后重试'));
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
            ...(tenantId ? { tenant_id: tenantId } : {}),
          }),
        });
        const body = (await response.json()) as { code?: string; error?: string };
        if (!response.ok || !body.code) {
          throw new Error(body.error || '获取桌面授权码失败');
        }
        callbackUrl.searchParams.set('code', body.code);
      } else {
        // Every client uses PKCE; the former token-in-URL flow was removed.
        throw new Error('客户端未提供 PKCE 参数，请升级 VisionStudio 后重试');
      }

      setRedirected(true);
      window.location.href = callbackUrl.toString();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : '桌面授权失败，请稍后重试');
    }
  };

  useEffect(() => {
    // Auto redirect only when there is no organization to choose.
    if (user && params?.redirectUri && tenants && !choosesTenant && !redirected && !errorMsg) {
      const timer = setTimeout(() => {
        void handleAuthorize();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user, params, tenants, choosesTenant, redirected, errorMsg]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-32 pb-24 flex items-center justify-center px-4">
      <SeoHead
        noindex
        title={params?.portal ? 'VisionCloud 管理后台登录 — VISIONGO' : 'VisionStudio 授权登录 — VISIONGO'}
        description="通过官方统一账号安全登录 VisionStudio 工业智能体桌面应用。"
        canonicalPath="/auth/desktop"
      />

      <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-2xl text-center space-y-6 tech-grid">
        <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <Laptop className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {params?.portal ? '登录 VisionCloud 管理后台' : '授权登录 VisionStudio'}
          </h2>
          <p className="text-zinc-400 text-xs mt-2">
            {params?.portal
              ? `授权后将返回 ${new URL(params.redirectUri).host} 的管理后台。`
              : '授权后，VisionStudio 桌面客户端将同步您的云端身份与组织 Credits 配额。'}
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
            <p className="text-zinc-300 text-sm">请先登录或注册您的 VISIONGO 账号：</p>
            <div>
              <AuthCard onSuccess={() => {}} />
            </div>
            <p className="text-xs text-zinc-500">
              {params?.portal ? '登录成功后将自动返回管理后台。' : '登录成功后将自动返回 VisionStudio 客户端。'}
            </p>
          </div>
        ) : redirected ? (
          <div className="space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-emerald-300 font-medium">
              {params?.portal ? '✓ 授权成功！正在返回管理后台...' : '✓ 授权成功！正在返回桌面应用...'}
            </p>
            {!params?.portal && <p className="text-xs text-zinc-500">若浏览器未自动关闭，您可以安全关闭本标签页。</p>}
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

            {choosesTenant && tenants && (
              <fieldset className="space-y-2 text-left">
                <legend className="text-xs text-zinc-400 mb-2">选择本次登录使用的组织：</legend>
                {tenants.map(tenant => (
                  <label
                    key={tenant.tenant_id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-sm ${
                      tenantId === tenant.tenant_id ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tenant"
                      value={tenant.tenant_id}
                      checked={tenantId === tenant.tenant_id}
                      onChange={() => setTenantId(tenant.tenant_id)}
                      className="accent-emerald-500"
                    />
                    <Building2 className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="flex-1 truncate text-zinc-200">{tenant.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {tenant.type === 'personal' ? '个人' : tenant.role === 'org_admin' ? '管理员' : '成员'}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            <button
              disabled={!tenants}
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
