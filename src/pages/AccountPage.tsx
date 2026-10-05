import React, { useState, useEffect } from 'react';
import {
  User,
  Download,
  History,
  LogOut,
  ArrowRight,
  Package,
} from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';
import { AuthCard } from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

interface UserDownloadRecord {
  id: string;
  userId: string;
  product: string;
  version: string;
  assetName: string;
  downloadedAt: string;
}

interface AccountPageProps {
  onNavigate: (path: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { user, loading: authLoading, logout } = useAuth();
  const { locale } = useLanguage();

  const [activeTab, setActiveTab] = useState<'profile' | 'downloads' | 'history'>('profile');
  const [downloadHistory, setDownloadHistory] = useState<UserDownloadRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setHistoryLoading(true);
      fetch('/api/user/downloads')
        .then((res) => (res.ok ? res.json() : { downloads: [] }))
        .then((data) => setDownloadHistory(data.downloads || []))
        .catch(() => setDownloadHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [user]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title={locale === 'zh' ? '我的 VISIONGO — 账户与发版记录' : 'My VISIONGO — Account & Downloads'}
        description={
          locale === 'zh'
            ? '管理您的 VISIONGO 工业软件访问权限、查阅已下载安装包历史及开发者档案。'
            : 'Access your VISIONGO software packages, view verified download history, and manage engineering profile.'
        }
        canonicalPath="/my"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={locale === 'zh' ? '开发者与工程中心' : 'Engineering Account Area'}
          title={locale === 'zh' ? '我的 VISIONGO' : 'My VISIONGO'}
          description={
            locale === 'zh'
              ? '安全管理您的工业软件发版下载历史、工控机部署记录与技术支持通道。'
              : 'Manage certified software packages, inspect download history, and access technical resources.'
          }
        />

        {authLoading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
          </div>
        ) : !user ? (
          /* ============================================================= */
          /* Unauthenticated State: Sign In Card                           */
          /* ============================================================= */
          <div className="max-w-xl mx-auto p-8 sm:p-12 rounded-3xl bg-zinc-900/70 border border-zinc-800 shadow-2xl text-center space-y-6 tech-grid">
            <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <User className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {locale === 'zh' ? '登录 / 注册您的工程账号' : 'Sign in to My VISIONGO'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                {locale === 'zh'
                  ? '支持 Google、GitHub 快捷登录或工作邮箱验证码注册，同步管理工业软件发版历史与现场部署。'
                  : 'Sign in with Google, GitHub, or your work email to access download history and industrial deployment packages.'}
              </p>
            </div>

            {/* Comprehensive Auth Component */}
            <div className="pt-2">
              <AuthCard />
            </div>
          </div>
        ) : (
          /* ============================================================= */
          /* Authenticated State: User Profile & History Tabs              */
          /* ============================================================= */
          <div className="space-y-8">
            {/* User Profile Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-4 text-center sm:text-left">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || 'User'}
                    className="w-16 h-16 rounded-2xl border-2 border-emerald-500/40 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 text-emerald-400 flex items-center justify-center text-xl font-bold font-mono">
                    {(user.displayName || user.email)[0].toUpperCase()}
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>{user.displayName || user.email.split('@')[0]}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Verified
                    </span>
                  </h3>
                  <p className="text-xs font-mono text-zinc-400">{user.email}</p>
                  <p className="text-[11px] font-mono text-zinc-500">
                    ID: {user.id} • {locale === 'zh' ? '加入于' : 'Member since'} {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer border border-zinc-700"
              >
                <LogOut className="w-4 h-4 text-zinc-400" />
                <span>{locale === 'zh' ? '退出登录' : 'Sign Out'}</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 font-mono text-xs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{locale === 'zh' ? '个人中心' : 'Profile'}</span>
              </button>

              <button
                onClick={() => setActiveTab('downloads')}
                className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'downloads'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{locale === 'zh' ? '软件包获取' : 'Downloads'}</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <History className="w-4 h-4" />
                <span>
                  {locale === 'zh' ? '下载历史档案' : 'Download History'} (
                  {downloadHistory.length})
                </span>
              </button>
            </div>

            {/* Tab 1: Profile Details */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    {locale === 'zh' ? '账号安全与认证状态' : 'Security & Identity'}
                  </h4>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-500">Identity Provider:</span>
                      <span className="text-zinc-200">Google OpenID Connect</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-500">Session Status:</span>
                      <span className="text-emerald-400 font-bold">Active (HttpOnly)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-500">Production Licensing:</span>
                      <span className="text-amber-400">Evaluation / Pilot</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                      {locale === 'zh' ? '商用生产授权与硬件加密狗' : 'Production Commercial Licensing'}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {locale === 'zh'
                        ? '如需在量产车间工控机上激活连续 24/7 运行授权，请联系系统架构师申请正式授权码或采购硬件加密狗。'
                        : 'To activate 24/7 continuous factory runtimes, request a commercial enterprise license or order hardware dongles.'}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('/contact')}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>{locale === 'zh' ? '联系技术团队申请商用授权' : 'Contact Engineering for Commercial License'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Software Downloads Direct */}
            {activeTab === 'downloads' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      v1.0.0 GA
                    </span>
                    <h4 className="text-base font-bold text-white mt-2">VisionStudio</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      {locale === 'zh' ? '可视化工程工作台' : 'Engineering Workspace'}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('/downloads')}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{locale === 'zh' ? '获取安装包' : 'Get Packages'}</span>
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      v1.0.0 GA
                    </span>
                    <h4 className="text-base font-bold text-white mt-2">VisionRuntime</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      {locale === 'zh' ? '生产执行引擎' : 'Production Runtime'}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('/downloads')}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{locale === 'zh' ? '获取安装包' : 'Get Packages'}</span>
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      v1.0.0 GA
                    </span>
                    <h4 className="text-base font-bold text-white mt-2">VisionEdge</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      {locale === 'zh' ? '边缘现场智能网关' : 'On-site Intelligence'}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('/downloads')}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{locale === 'zh' ? '获取安装包' : 'Get Packages'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Download History List */}
            {activeTab === 'history' && (
              <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden animate-fadeIn">
                {historyLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500" />
                  </div>
                ) : downloadHistory.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Package className="w-10 h-10 text-zinc-600 mx-auto" />
                    <h4 className="text-sm font-bold text-zinc-300">
                      {locale === 'zh' ? '暂无软件下载记录' : 'No Download History Recorded Yet'}
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      {locale === 'zh'
                        ? '当您登录此账号并在 /downloads 启动软件下载时，发版记录将自动保存在此处供您日后追踪审计。'
                        : 'Downloads initiated while signed in will automatically be recorded here for auditing and fast re-downloading.'}
                    </p>
                    <button
                      onClick={() => onNavigate('/downloads')}
                      className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold transition-colors cursor-pointer"
                    >
                      {locale === 'zh' ? '前往下载中心' : 'Go to Downloads'}
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/80">
                    <div className="px-6 py-3 bg-zinc-950 text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                      <span>Package / Product</span>
                      <span>Downloaded Date</span>
                    </div>
                    {downloadHistory.map((rec) => (
                      <div
                        key={rec.id}
                        className="px-6 py-4 flex items-center justify-between gap-4 text-xs font-mono hover:bg-zinc-800/40 transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-zinc-200 font-bold truncate">{rec.assetName}</p>
                          <p className="text-zinc-500 text-[11px]">
                            {rec.product} • {rec.version}
                          </p>
                        </div>
                        <span className="text-zinc-400 text-right shrink-0">
                          {formatDate(rec.downloadedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
