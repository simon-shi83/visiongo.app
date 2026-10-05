import React, { useState, useEffect } from 'react';
import { Mail, Lock, KeyRound, User as UserIcon, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

interface EmailAuthFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({ onSuccess, className = '' }) => {
  const { sendEmailCode, registerWithEmail, loginWithEmail } = useAuth();
  const { locale } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);

  // 60-second countdown for code resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    setError(null);
    setSuccessMsg(null);
    setDevCodeHint(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError(locale === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email address');
      return;
    }

    setSendingCode(true);
    const res = await sendEmailCode(email.trim(), 'register');
    setSendingCode(false);

    if (res.success) {
      setCountdown(60);
      setSuccessMsg(locale === 'zh' ? '验证码已发送，请查收邮箱' : 'Verification code sent to your email');
      if (res.devCode) {
        setDevCodeHint(res.devCode);
        setCode(res.devCode); // Auto-fill in dev mode for convenience
      }
    } else {
      setError(res.error || (locale === 'zh' ? '验证码发送失败' : 'Failed to send code'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(locale === 'zh' ? '请输入邮箱地址' : 'Email is required');
      return;
    }

    if (!password) {
      setError(locale === 'zh' ? '请输入密码' : 'Password is required');
      return;
    }

    if (password.length < 6) {
      setError(locale === 'zh' ? '密码长度至少需 6 位' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    if (mode === 'register') {
      if (!code.trim()) {
        setLoading(false);
        setError(locale === 'zh' ? '请输入收到的邮箱验证码' : 'Verification code is required');
        return;
      }

      const res = await registerWithEmail(cleanEmail, code.trim(), password, displayName.trim());
      setLoading(false);

      if (res.success) {
        onSuccess?.();
      } else {
        setError(res.error || (locale === 'zh' ? '注册失败，请稍后重试' : 'Registration failed'));
      }
    } else {
      // Login mode
      const res = await loginWithEmail(cleanEmail, password);
      setLoading(false);

      if (res.success) {
        onSuccess?.();
      } else {
        setError(res.error || (locale === 'zh' ? '登录失败，请检查邮箱和密码' : 'Login failed'));
      }
    }
  };

  return (
    <div className={`w-full max-w-sm mx-auto space-y-4 ${className}`}>
      {/* Mode Switch Tabs */}
      <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs font-mono">
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            mode === 'register'
              ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          {locale === 'zh' ? '邮箱注册' : 'Email Register'}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            mode === 'login'
              ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          {locale === 'zh' ? '邮箱登录' : 'Email Sign In'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-left">
        {/* Email Field */}
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
            {locale === 'zh' ? '工作邮箱' : 'Email Address'}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="engineer@company.com"
              required
              className="w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Verification Code Field (Only for Register) */}
        {mode === 'register' && (
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">
              {locale === 'zh' ? '邮箱验证码' : 'Verification Code'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 位数字"
                  required={mode === 'register'}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors tracking-widest"
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 border border-zinc-700 disabled:border-zinc-800 text-[11px] font-mono text-emerald-400 disabled:text-zinc-500 transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed min-w-[96px] text-center"
              >
                {sendingCode
                  ? (locale === 'zh' ? '发送中...' : 'Sending...')
                  : countdown > 0
                  ? `${countdown}s`
                  : (locale === 'zh' ? '获取验证码' : 'Send Code')}
              </button>
            </div>
            {devCodeHint && (
              <p className="text-[10px] text-emerald-400 font-mono mt-1">
                {locale === 'zh' ? `测试模式验证码：${devCodeHint}` : `Dev verification code: ${devCodeHint}`}
              </p>
            )}
          </div>
        )}

        {/* Optional Display Name (Only for Register) */}
        {mode === 'register' && (
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">
              {locale === 'zh' ? '用户名 / 昵称 (可选)' : 'Display Name (Optional)'}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={locale === 'zh' ? '工业视觉工程师' : 'Vision Engineer'}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Password Field */}
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
            {locale === 'zh' ? '密码' : 'Password'}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-9 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {mode === 'register' && (
            <p className="text-[10px] text-zinc-500 font-mono mt-1">
              {locale === 'zh' ? '密码不少于 6 位' : 'At least 6 characters'}
            </p>
          )}
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900/60 text-zinc-950 font-bold text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>
                {mode === 'register'
                  ? locale === 'zh'
                    ? '验证并完成注册'
                    : 'Verify & Complete Registration'
                  : locale === 'zh'
                  ? '立即登录'
                  : 'Sign In to Account'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
