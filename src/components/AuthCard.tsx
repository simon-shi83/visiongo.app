import React, { useState } from 'react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { GitHubSignInButton } from './GitHubSignInButton';
import { EmailAuthForm } from './EmailAuthForm';
import { useLanguage } from '../i18n/LanguageContext';
import { ShieldCheck, Mail, Globe } from 'lucide-react';

interface AuthCardProps {
  onSuccess?: () => void;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ onSuccess, className = '' }) => {
  const { locale } = useLanguage();
  const [tab, setTab] = useState<'oauth' | 'email'>('oauth');

  return (
    <div className={`w-full max-w-md mx-auto space-y-6 ${className}`}>
      {/* Top Tab Switcher */}
      <div className="flex border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setTab('oauth')}
          className={`flex-1 pb-2 text-xs font-mono font-medium flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            tab === 'oauth'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{locale === 'zh' ? '第三方快捷登录' : 'Fast OAuth Login'}</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('email')}
          className={`flex-1 pb-2 text-xs font-mono font-medium flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            tab === 'email'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>{locale === 'zh' ? '工作邮箱注册 / 登录' : 'Email Sign In / Register'}</span>
        </button>
      </div>

      {/* Tab 1: OAuth Providers (Google & GitHub) */}
      {tab === 'oauth' && (
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center gap-3 w-full">
            {/* Google Sign In */}
            <GoogleSignInButton onSuccess={onSuccess} />

            {/* Divider */}
            <div className="w-full max-w-[280px] flex items-center gap-2 text-zinc-600 my-1">
              <div className="h-[1px] bg-zinc-800 flex-1" />
              <span className="text-[10px] font-mono uppercase">{locale === 'zh' ? '或' : 'OR'}</span>
              <div className="h-[1px] bg-zinc-800 flex-1" />
            </div>

            {/* GitHub Sign In */}
            <GitHubSignInButton onSuccess={onSuccess} />
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setTab('email')}
              className="text-xs font-mono text-zinc-500 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{locale === 'zh' ? '没有第三方账号？使用邮箱验证码注册' : 'No OAuth account? Register with email'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Email Password & Verification Code Form */}
      {tab === 'email' && (
        <div className="py-2">
          <EmailAuthForm onSuccess={onSuccess} />
        </div>
      )}

      {/* Privacy Guarantee Footer */}
      <div className="pt-2 border-t border-zinc-800/80">
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{locale === 'zh' ? '端到端加密 • 零明文存储 • 安全合规' : 'End-to-End Encrypted • Safe & Compliant'}</span>
        </div>
      </div>
    </div>
  );
};
