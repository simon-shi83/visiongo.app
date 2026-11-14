import React, { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { passwordProblem, passwordProblemText } from '../../shared/passwordPolicy';

const card = 'p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4';
const heading = 'text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold';
const input = 'w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50';
const button = 'px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50';

/** Change the password of the signed-in account, or set a first one (profile tab). */
export const ChangePasswordPanel: React.FC<{ locale: string }> = ({ locale }) => {
  const zh = locale === 'zh';
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [emailSignIn, setEmailSignIn] = useState(true);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  useEffect(() => {
    fetch('/api/account/password')
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (!data) return;
        setHasPassword(!!data.has_password);
        setEmailSignIn(data.email_sign_in !== false);
      })
      .catch(() => undefined);
  }, []);

  if (hasPassword === null || (!emailSignIn && !hasPassword)) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setDone('');
    const problem = passwordProblem(next);
    if (problem) { setError(passwordProblemText(problem, zh)); return; }
    if (next !== repeat) { setError(zh ? '两次输入的新密码不一致' : 'The new passwords do not match'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.error || (zh ? '修改失败' : 'Could not change the password')); return; }
      setCurrent(''); setNext(''); setRepeat('');
      setHasPassword(true);
      setDone(zh ? '密码已修改。其他浏览器需要重新登录，已登录的 VisionStudio 不受影响。'
                 : 'Password changed. Other browsers must sign in again; signed-in VisionStudio stays signed in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={card} onSubmit={submit}>
      <h4 className={heading}>{hasPassword ? (zh ? '修改密码' : 'Change password') : (zh ? '设置密码' : 'Set a password')}</h4>
      {hasPassword && (
        <input type="password" autoComplete="current-password" required value={current} onChange={event => setCurrent(event.target.value)}
               placeholder={zh ? '当前密码' : 'Current password'} className={input} />
      )}
      <input type="password" autoComplete="new-password" required value={next} onChange={event => setNext(event.target.value)}
             placeholder={zh ? '新密码（8 位以上，含字母和数字）' : 'New password (8+ characters, letters and digits)'} className={input} />
      <input type="password" autoComplete="new-password" required value={repeat} onChange={event => setRepeat(event.target.value)}
             placeholder={zh ? '再次输入新密码' : 'Repeat the new password'} className={input} />
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      {done && <p className="text-xs text-emerald-300">{done}</p>}
      <button type="submit" disabled={busy} className={button}>
        <KeyRound className="w-3.5 h-3.5" />
        <span>{zh ? '保存新密码' : 'Save password'}</span>
      </button>
    </form>
  );
};
