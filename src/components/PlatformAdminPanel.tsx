import React, { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Search, Upload, UserPlus } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  auth_provider: string | null;
  has_password: number;
  created_at: string;
  last_login_at: string | null;
}

interface ReleaseRow {
  product: string;
  platform: string;
  channel: string;
  latest: string;
  min_supported: string;
  url: string | null;
  sha256: string | null;
  notes_url: string | null;
  published_at: string | null;
  updated_at?: string;
}

/** What to hand over: a temporary password or a code, shown once. */
interface Handover {
  title: string;
  message: string;
}

const card = 'p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4';
const heading = 'text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold';
const input = 'flex-1 basis-48 min-w-0 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50';
const button = 'px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50';
const smallButton = 'px-2 py-1 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer font-mono disabled:opacity-50';
const badge = 'text-[10px] font-mono px-2 py-0.5 rounded border';

async function call(path: string, body?: unknown): Promise<{ ok: boolean; data: any }> {
  const response = await fetch(path, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: response.ok, data: await response.json().catch(() => ({})) };
}

/** Platform administrators: accounts without email delivery, and release manifests. */
export const PlatformAdminPanel: React.FC<{ locale: string }> = ({ locale }) => {
  const zh = locale === 'zh';
  const signInUrl = typeof window !== 'undefined' ? `${window.location.origin}${zh ? '/zh/my' : '/my'}` : '';
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [emailSignIn, setEmailSignIn] = useState(true);
  const [emailDelivery, setEmailDelivery] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [handover, setHandover] = useState<Handover | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [release, setRelease] = useState({ product: 'studio', platform: 'windows-x64', channel: 'stable', latest: '',
                                           min_supported: '', url: '', sha256: '', notes_url: '' });
  const [releaseNotice, setReleaseNotice] = useState('');

  const search = useCallback(async (text: string) => {
    const { ok, data } = await call(`/api/admin/users?q=${encodeURIComponent(text)}`);
    if (!ok) { setError(data.error || (zh ? '无法读取账号' : 'Could not load accounts')); return; }
    setUsers(data.users || []);
    setEmailSignIn(data.email_sign_in !== false);
    setEmailDelivery(!!data.email_delivery);
  }, [zh]);

  const loadReleases = useCallback(async () => {
    const { ok, data } = await call('/api/admin/releases');
    if (ok) setReleases(data.releases || []);
  }, []);

  useEffect(() => { void search(''); void loadReleases(); }, [search, loadReleases]);

  const act = async (action: () => Promise<{ ok: boolean; data: any }>, done: (data: any) => void) => {
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const { ok, data } = await action();
      if (!ok) { setError(data.error || (zh ? '操作失败' : 'Operation failed')); return; }
      done(data);
      await search(query);
    } finally {
      setBusy(false);
    }
  };

  const passwordHandover = (email: string, password: string, created: boolean) => setHandover({
    title: created ? (zh ? '账号已创建' : 'Account created') : (zh ? '密码已重置' : 'Password reset'),
    message: zh
      ? `VISIONGO 账号：${email}\n临时密码：${password}\n请在 ${signInUrl} 登录后，到“个人中心 → 修改密码”换成自己的密码。VisionStudio 用同一账号登录。`
      : `VISIONGO account: ${email}\nTemporary password: ${password}\nSign in at ${signInUrl} and change it under Profile → Change password. Use the same account in VisionStudio.`,
  });

  const codeHandover = (email: string, code: string, purpose: string) => setHandover({
    title: purpose === 'reset' ? (zh ? '重置密码验证码' : 'Password reset code') : (zh ? '注册验证码' : 'Sign-up code'),
    message: zh
      ? `邮箱：${email}\n验证码：${code}（24 小时内有效，只能用一次）\n请打开 ${signInUrl}，选“邮箱” → “${purpose === 'reset' ? '忘记密码' : '注册'}”，填入邮箱和这个验证码，不要点“发送验证码”。`
      : `Email: ${email}\nCode: ${code} (valid for 24 hours, once)\nOpen ${signInUrl}, choose Email → ${purpose === 'reset' ? 'Forgot password' : 'Sign up'}, and enter the email and this code; do not press Send code.`,
  });

  const copy = async () => {
    if (!handover) return;
    try { await navigator.clipboard.writeText(handover.message); setCopied(true); } catch { setCopied(false); }
  };

  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    setReleaseNotice('');
    setBusy(true);
    try {
      const body = { ...release, min_supported: release.min_supported || release.latest };
      const { ok, data } = await call('/api/admin/releases', body);
      if (!ok) { setReleaseNotice(data.error || (zh ? '发布失败' : 'Could not publish')); return; }
      setReleaseNotice(zh ? `已发布 ${body.product} ${body.latest}（${body.platform} / ${body.channel}）` : `Published ${body.product} ${body.latest}`);
      await loadReleases();
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof release, placeholder: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <input value={release[key]} onChange={event => setRelease({ ...release, [key]: event.target.value })}
           placeholder={placeholder} aria-label={placeholder} className={input} {...extra} />
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {error && <p role="alert" className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-xs text-red-300">{error}</p>}

      <div className={card}>
        <h4 className={heading}>{zh ? '账号管理' : 'Accounts'}</h4>
        {!emailDelivery && emailSignIn && (
          <p className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200">
            {zh ? '本站暂未开通邮件发送，用户收不到验证码。可以在这里直接创建账号（给出临时密码），或生成验证码转发给对方。'
                : 'This site cannot send email yet. Create accounts here (with a temporary password) or issue codes to pass on.'}
          </p>
        )}
        {!emailSignIn && (
          <p className="text-xs text-zinc-500">
            {zh ? '本站使用第三方登录，不能在这里创建账号或设置密码；用户首次登录后即出现在列表中。'
                : 'This site signs in with Google or GitHub; accounts appear here after their first sign-in.'}
          </p>
        )}

        {emailSignIn && (
          <form className="flex flex-wrap gap-2" onSubmit={event => {
            event.preventDefault();
            const email = newEmail.trim().toLowerCase();
            void act(() => call('/api/admin/users', { email, display_name: newName }),
                     data => { passwordHandover(email, data.temporary_password, true); setNewEmail(''); setNewName(''); });
          }}>
            <input type="email" required value={newEmail} onChange={event => setNewEmail(event.target.value)}
                   placeholder={zh ? '新账号邮箱' : 'Email of the new account'} className={input} />
            <input value={newName} onChange={event => setNewName(event.target.value)}
                   placeholder={zh ? '姓名（可选）' : 'Name (optional)'} className={input} />
            <button type="submit" disabled={busy} className={button}>
              <UserPlus className="w-3.5 h-3.5" />
              <span>{zh ? '创建账号' : 'Create account'}</span>
            </button>
            <button type="button" disabled={busy} className={button} onClick={() => {
              const email = newEmail.trim().toLowerCase();
              if (!email) { setError(zh ? '请先填写邮箱' : 'Enter an email first'); return; }
              void act(() => call('/api/admin/users/code', { email, purpose: 'register' }),
                       data => codeHandover(email, data.code, 'register'));
            }}>
              <KeyRound className="w-3.5 h-3.5" />
              <span>{zh ? '改为生成注册验证码' : 'Issue sign-up code instead'}</span>
            </button>
          </form>
        )}

        {handover && (
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-emerald-300">{handover.title}</span>
              <button type="button" onClick={() => void copy()} className={smallButton}>
                <span className="inline-flex items-center gap-1 text-xs"><Copy className="w-3 h-3" />{copied ? (zh ? '已复制' : 'Copied') : (zh ? '复制' : 'Copy')}</span>
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-all text-xs text-zinc-200 font-mono">{handover.message}</pre>
            <p className="text-[11px] text-zinc-500">
              {zh ? '这段内容只显示这一次，离开页面后无法再查看。请通过微信或电话发给本人。'
                  : 'Shown only this once. Pass it to the person directly.'}
            </p>
          </div>
        )}

        <form className="flex gap-2" onSubmit={event => { event.preventDefault(); void search(query); }}>
          <input value={query} onChange={event => setQuery(event.target.value)}
                 placeholder={zh ? '按邮箱或姓名搜索（留空显示最近 50 个）' : 'Search by email or name'} className={input} />
          <button type="submit" className={button}><Search className="w-3.5 h-3.5" /><span>{zh ? '搜索' : 'Search'}</span></button>
        </form>
        <div className="space-y-2">
          {users.length === 0 && <p className="text-xs text-zinc-500">{zh ? '没有找到账号。' : 'No accounts found.'}</p>}
          {users.map(account => (
            <div key={account.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <div className="min-w-0">
                <div className="text-zinc-200 truncate">
                  {account.display_name || account.email}
                  {account.role === 'super_admin' && <span className={`${badge} ml-2 border-emerald-500/30 text-emerald-400`}>{zh ? '平台管理员' : 'Platform admin'}</span>}
                </div>
                <div className="text-zinc-500 font-mono truncate">
                  {account.email} · {zh ? '最近登录' : 'last sign-in'} {(account.last_login_at || account.created_at).slice(0, 10)}
                </div>
              </div>
              {emailSignIn && (
                <div className="flex items-center gap-2">
                  <button type="button" disabled={busy} className={smallButton} onClick={() => {
                    if (!window.confirm(zh ? `为 ${account.email} 生成临时密码？旧密码立即失效，已登录的 VisionStudio 需要重新登录。` : `Reset the password of ${account.email}?`)) return;
                    void act(() => call('/api/admin/users/reset-password', { email: account.email }),
                             data => passwordHandover(account.email, data.temporary_password, false));
                  }}>{zh ? '重置密码' : 'Reset password'}</button>
                  <button type="button" disabled={busy} className={smallButton} onClick={() => void act(
                    () => call('/api/admin/users/code', { email: account.email, purpose: 'reset' }),
                    data => codeHandover(account.email, data.code, 'reset'))}>
                    {zh ? '生成重置验证码' : 'Reset code'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <h4 className={heading}>{zh ? '软件版本发布' : 'Software releases'}</h4>
        <p className="text-xs text-zinc-500">
          {zh ? 'VisionStudio 和 VisionEdge 检查更新时读取这里的记录；某个产品、平台、通道没有记录时，检查更新会返回“没有发布的版本”（404）。'
              : 'VisionStudio and VisionEdge read these records when checking for updates; without a record the check returns 404.'}
        </p>
        <div className="space-y-2">
          {releases.length === 0 && <p className="text-xs text-amber-300">{zh ? '还没有发布任何版本。' : 'Nothing published yet.'}</p>}
          {releases.map(row => (
            <button type="button" key={`${row.product}-${row.platform}-${row.channel}`}
                    onClick={() => setRelease({ product: row.product, platform: row.platform, channel: row.channel, latest: row.latest,
                                                min_supported: row.min_supported, url: row.url || '', sha256: row.sha256 || '', notes_url: row.notes_url || '' })}
                    className="w-full text-left p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs hover:border-zinc-700 cursor-pointer">
              <div className="text-zinc-200 font-mono">{row.product} · {row.platform} · {row.channel}</div>
              <div className="text-zinc-500 font-mono break-all">
                {zh ? '最新' : 'latest'} {row.latest} · {zh ? '最低' : 'min'} {row.min_supported}{row.url ? ` · ${row.url}` : ''}
              </div>
            </button>
          ))}
        </div>
        <form className="space-y-2" onSubmit={publish}>
          <div className="flex flex-wrap gap-2">
            <select value={release.product} onChange={event => setRelease({ ...release, product: event.target.value })} className={input} aria-label={zh ? '产品' : 'Product'}>
              <option value="studio">studio</option>
              <option value="edge">edge</option>
              <option value="runtime">runtime</option>
            </select>
            {field('platform', zh ? '平台，如 windows-x64' : 'Platform, e.g. windows-x64', { required: true, list: 'release-platforms' })}
            <datalist id="release-platforms"><option value="windows-x64" /><option value="linux-x64" /></datalist>
            {field('channel', zh ? '通道，如 stable' : 'Channel, e.g. stable', { required: true })}
          </div>
          <div className="flex flex-wrap gap-2">
            {field('latest', zh ? '最新版本，如 6.0.0.434' : 'Latest, e.g. 6.0.0.434', { required: true })}
            {field('min_supported', zh ? '最低支持版本（留空=最新版本）' : 'Minimum supported (empty: latest)')}
          </div>
          <div className="flex flex-wrap gap-2">
            {field('url', zh ? '安装包下载地址（https，可选）' : 'Installer URL (https, optional)')}
            {field('sha256', zh ? '安装包 SHA-256（可选）' : 'Installer SHA-256 (optional)')}
            {field('notes_url', zh ? '更新说明地址（https，可选）' : 'Release notes URL (https, optional)')}
          </div>
          {releaseNotice && <p className="text-xs text-zinc-300">{releaseNotice}</p>}
          <button type="submit" disabled={busy} className={button}>
            <Upload className="w-3.5 h-3.5" />
            <span>{zh ? '发布' : 'Publish'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
