import React, { useState } from 'react';
import {
  Download,
  FileText,
  History,
  ChevronDown,
  Monitor,
  Cpu,
  Layers,
  Sparkles,
  Clock,
} from 'lucide-react';
import { ProductRelease, ReleaseAsset } from '../types/downloads';
import { useLanguage } from '../i18n/LanguageContext';

interface ReleaseCardProps {
  productId: 'visionstudio' | 'visionruntime' | 'visionedge';
  productName: string;
  tagline: string;
  accentColor: string;
  releases: ProductRelease[];
  onOpenReleaseNotes: (release: ProductRelease) => void;
}

export const ReleaseCard: React.FC<ReleaseCardProps> = ({
  productName,
  tagline,
  accentColor,
  releases,
  onOpenReleaseNotes,
}) => {
  const { locale } = useLanguage();
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showPreviousVersions, setShowPreviousVersions] = useState(false);

  // Filter stable releases vs prereleases
  const stableReleases = releases.filter((r) => !r.prerelease);
  const latestRelease: ProductRelease | undefined = stableReleases[0] || releases[0];
  const previousReleases = stableReleases.slice(1);

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

  const formatBytes = (bytes: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `(${mb.toFixed(0)} MB)`;
  };

  // Derive distinct platforms from assets
  const getDerivedPlatforms = (assets: ReleaseAsset[]) => {
    const list: string[] = [];
    const hasWindows = assets.some((a) => a.platform === 'windows');
    const hasLinux = assets.some((a) => a.platform === 'linux');
    const hasArm = assets.some((a) => a.arch === 'arm64');

    if (hasWindows) list.push('Windows x64');
    if (hasLinux) list.push('Ubuntu / Linux x86_64');
    if (hasArm) list.push('Linux aarch64');
    if (list.length === 0 && assets.length > 0) list.push('Multi-platform');
    return list;
  };

  // If no releases available at all, render a sleek Coming Soon card
  if (!latestRelease || latestRelease.assets.length === 0) {
    return (
      <div className="relative rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-8 flex flex-col justify-between hover:border-zinc-700/80 transition-all tech-grid">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm"
                style={{
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                  border: `1px solid ${accentColor}40`,
                }}
              >
                {productName[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{productName}</h3>
                <p className="text-xs font-mono text-zinc-400">{tagline}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/60">
              {locale === 'zh' ? '即将发布' : 'Coming Soon'}
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 space-y-3">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'zh' ? '下一个正式版本准备中' : 'Next General Availability in Preparation'}</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {locale === 'zh'
                ? '我们正在对该模块进行严苛的 24/7 工业抗压与微秒级抖动验证。欢迎联系技术团队申请早期 PoC 内测评估包。'
                : 'Undergoing rigorous 24/7 industrial stress testing and microsecond latency validation. Contact engineering to request an early pilot evaluation build.'}
            </p>
          </div>
        </div>

        <div className="pt-6">
          <a
            href="/contact"
            className="w-full py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono text-xs font-medium flex items-center justify-center gap-2 border border-zinc-700/60 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{locale === 'zh' ? '申请早期试用与技术咨询' : 'Request Early Evaluation Build'}</span>
          </a>
        </div>
      </div>
    );
  }

  const platforms = getDerivedPlatforms(latestRelease.assets);
  const primaryAsset = latestRelease.assets[0];

  return (
    <div className="relative rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-8 flex flex-col justify-between hover:border-zinc-700/80 transition-all tech-grid group shadow-xl">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-base shadow-inner"
              style={{
                backgroundColor: `${accentColor}18`,
                color: accentColor,
                border: `1px solid ${accentColor}40`,
              }}
            >
              {productName[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-sans">{productName}</h3>
              <p className="text-xs font-mono text-zinc-400">{tagline}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span>{latestRelease.version}</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {formatDate(latestRelease.publishedAt)}
            </span>
          </div>
        </div>

        {/* Platforms Badge Row */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
            {locale === 'zh' ? '支持平台与架构' : 'Supported Platforms & Architectures'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-950 border border-zinc-800 text-zinc-300"
              >
                {p.includes('Windows') ? (
                  <Monitor className="w-3.5 h-3.5 text-blue-400" />
                ) : p.includes('Linux') || p.includes('Ubuntu') ? (
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{p}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Binary Assets Quick Info */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">{locale === 'zh' ? '主安装包' : 'Package'}:</span>
            <span className="text-zinc-200 truncate max-w-[200px]" title={primaryAsset.name}>
              {primaryAsset.name}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>{locale === 'zh' ? '部署模式' : 'Deployment'}:</span>
            <span className="text-emerald-400/90 font-medium">
              {locale === 'zh' ? '100% 物理无网隔离就绪' : '100% Air-Gapped Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 space-y-3">
        {/* Main Download Button & Dropdown */}
        <div className="relative">
          {latestRelease.assets.length === 1 ? (
            <a
              href={primaryAsset.downloadUrl}
              download
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {locale === 'zh' ? '立即下载' : 'Download Now'}{' '}
                <span className="opacity-75">{formatBytes(primaryAsset.size)}</span>
              </span>
            </a>
          ) : (
            <div className="flex items-center rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-950/40">
              <a
                href={primaryAsset.downloadUrl}
                download
                className="flex-1 py-3 px-4 text-zinc-950 font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {locale === 'zh' ? '下载' : 'Download'} ({primaryAsset.platform}{' '}
                  {primaryAsset.arch})
                </span>
              </a>
              <button
                onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                className="px-3 py-3 border-l border-emerald-600/40 text-zinc-950 hover:bg-emerald-600/20 transition-colors cursor-pointer rounded-r-xl"
                aria-label="Select Platform Asset"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showPlatformDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          )}

          {/* Platform Dropdown */}
          {showPlatformDropdown && latestRelease.assets.length > 1 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl z-20 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                {locale === 'zh' ? '选择对应系统与架构' : 'Select Platform Package'}
              </div>
              {latestRelease.assets.map((asset) => (
                <a
                  key={asset.id}
                  href={asset.downloadUrl}
                  download
                  onClick={() => setShowPlatformDropdown(false)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-300 hover:text-white transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-zinc-200">{asset.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">
                      {asset.platform} • {asset.arch}
                    </p>
                  </div>
                  <span className="text-emerald-400 shrink-0 font-medium text-[11px]">
                    {formatBytes(asset.size)}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Actions: Release Notes & Previous Versions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenReleaseNotes(latestRelease)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white font-mono text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-zinc-700/50"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>{locale === 'zh' ? '发版日志' : 'Release Notes'}</span>
          </button>

          {previousReleases.length > 0 && (
            <button
              onClick={() => setShowPreviousVersions(!showPreviousVersions)}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700/50"
              title={locale === 'zh' ? '历史版本' : 'Previous Versions'}
            >
              <History className="w-3.5 h-3.5" />
              <span>{locale === 'zh' ? '历史版本' : 'History'}</span>
            </button>
          )}
        </div>

        {/* Previous Versions Drawer */}
        {showPreviousVersions && previousReleases.length > 0 && (
          <div className="mt-2 p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs font-mono animate-fadeIn">
            <span className="text-[10px] uppercase text-zinc-500 font-semibold block">
              {locale === 'zh' ? '历史发版档案' : 'Historical Builds'}
            </span>
            <div className="divide-y divide-zinc-800/80">
              {previousReleases.map((prev) => (
                <div
                  key={prev.version}
                  className="py-2 flex items-center justify-between text-zinc-400"
                >
                  <span className="text-zinc-300 font-bold">{prev.version}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenReleaseNotes(prev)}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      {locale === 'zh' ? '日志' : 'Notes'}
                    </button>
                    {prev.assets[0] && (
                      <a
                        href={prev.assets[0].downloadUrl}
                        download
                        className="text-zinc-400 hover:text-white"
                      >
                        {locale === 'zh' ? '下载' : 'Download'}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
