import React, { useCallback, useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';

interface DesktopSession {
  family_id: string;
  device_name: string | null;
  tenant_id: string;
  tenant_name: string | null;
  signed_in_at: string;
  last_used_at: string;
}

/** VisionStudio sign-ins of this account (identity 4), each ended separately or all at once. */
export const DesktopSessionsPanel: React.FC<{ locale: string }> = ({ locale }) => {
  const zh = locale === 'zh';
  const [sessions, setSessions] = useState<DesktopSession[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetch('/api/account/desktop-sessions')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then(data => setSessions(data.sessions || []))
      .catch(() => { setSessions([]); setError(zh ? '无法读取已登录的电脑。' : 'Could not load the signed-in computers.'); });
  }, [zh]);
  useEffect(load, [load]);

  const revoke = async (body: { family_id?: string; all?: boolean }) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/account/desktop-sessions/revoke', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setError(zh ? '退出登录失败，请重试。' : 'Signing out failed. Please retry.');
    } finally {
      setBusy(false);
      load();
    }
  };

  const when = (iso: string) => new Date(iso).toLocaleString(zh ? 'zh-CN' : 'en-US');

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4 md:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          {zh ? '已登录 VisionStudio 的电脑' : 'Computers signed in to VisionStudio'}
        </h4>
        {sessions && sessions.length > 1 && (
          <button disabled={busy} onClick={() => revoke({ all: true })}
                  className="px-3 py-1.5 rounded-lg text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-50 cursor-pointer">
            {zh ? '全部退出' : 'Sign out everywhere'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {sessions === null ? (
        <p className="text-xs text-zinc-500">{zh ? '正在读取…' : 'Loading…'}</p>
      ) : sessions.length === 0 ? (
        <p className="text-xs text-zinc-500">{zh ? '没有电脑登录。' : 'No computer is signed in.'}</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map(session => (
            <li key={session.family_id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <div className="min-w-0">
                <div className="text-zinc-200 truncate">{session.device_name || (zh ? '未命名的电脑' : 'Unnamed computer')}</div>
                <div className="text-zinc-500">
                  {(session.tenant_name || session.tenant_id)} · {zh ? '登录于' : 'signed in'} {when(session.signed_in_at)} · {zh ? '最近使用' : 'last used'} {when(session.last_used_at)}
                </div>
              </div>
              <button disabled={busy} onClick={() => revoke({ family_id: session.family_id })}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 cursor-pointer">
                {zh ? '退出' : 'Sign out'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
