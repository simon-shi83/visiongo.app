import React, { useState, useEffect } from 'react';
import {
  Shield,
  CloudOff,
  Server,
  Terminal,
  Info,
} from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';
import { ReleaseCard } from '../components/ReleaseCard';
import { ReleaseNotesModal } from '../components/ReleaseNotesModal';
import { ProductRelease, DownloadableProduct } from '../types/downloads';
import { useLanguage } from '../i18n/LanguageContext';

interface DownloadsPageProps {
  initialProduct?: DownloadableProduct;
  initialVersion?: string;
  onNavigate: (path: string) => void;
  onOpenContact: () => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({
  initialProduct,
  initialVersion,
  onNavigate,
  onOpenContact,
}) => {
  const { locale } = useLanguage();

  const [releases, setReleases] = useState<Record<DownloadableProduct, ProductRelease[]>>({
    visionstudio: [],
    visionruntime: [],
    visionedge: [],
  });
  const [loading, setLoading] = useState(true);
  const [includePrereleases, setIncludePrereleases] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<{
    productName: string;
    release: ProductRelease;
    allReleases: ProductRelease[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchReleases() {
      try {
        setLoading(true);
        const res = await fetch(`/api/releases?includePrereleases=${includePrereleases}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.releases && isMounted) {
          setReleases(data.releases);
        }
      } catch (err) {
        console.warn('[Downloads Page] Failed to fetch live releases, using client fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReleases();
    return () => {
      isMounted = false;
    };
  }, [includePrereleases]);

  // Handle deep-linked initial product/version
  useEffect(() => {
    if (initialProduct && releases[initialProduct]?.length > 0) {
      const match = initialVersion
        ? releases[initialProduct].find((r) => r.version.toLowerCase() === initialVersion.toLowerCase())
        : releases[initialProduct][0];

      if (match) {
        const titleMap: Record<DownloadableProduct, string> = {
          visionstudio: 'VisionStudio',
          visionruntime: 'VisionRuntime',
          visionedge: 'VisionEdge',
        };
        setSelectedRelease({
          productName: titleMap[initialProduct],
          release: match,
          allReleases: releases[initialProduct],
        });
      }
    }
  }, [initialProduct, initialVersion, releases]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title={locale === 'zh' ? '软件下载 — VISIONGO 工业视觉智能' : 'Download Software — VISIONGO'}
        description={
          locale === 'zh'
            ? '下载 VISIONGO 官方安装包：VisionStudio 编排工作台、VisionRuntime 生产执行引擎、VisionEdge 边缘网关。纯离线部署，物理无网隔离就绪。'
            : 'Download official releases for VisionStudio, VisionRuntime, and VisionEdge. Sub-millisecond determinism, air-gapped readiness, zero mandatory cloud uplink.'
        }
        canonicalPath="/downloads"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={locale === 'zh' ? '官方发行包与工具' : 'Official Binaries & Software'}
          title={locale === 'zh' ? '下载 VISIONGO 工业级软件系统' : 'Download VISIONGO Software'}
          description={
            locale === 'zh'
              ? '获取经过工业严苛验证的高性能执行核心、可视化工程工作台与边缘智能网关。100% 物理隔离无网运行。'
              : 'Enterprise-grade execution runtimes, visual engineering workspaces, and edge AI gateways designed for air-gapped factory automation.'
          }
        />

        {/* Filter bar: Stable vs Pre-release & Cloud notice */}
        <div className="max-w-6xl mx-auto mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">{locale === 'zh' ? '版本通道:' : 'Release Channel:'}</span>
            <div className="inline-flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
              <button
                onClick={() => setIncludePrereleases(false)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  !includePrereleases
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {locale === 'zh' ? '正式稳定版 (Stable)' : 'Stable GA'}
              </button>
              <button
                onClick={() => setIncludePrereleases(true)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  includePrereleases
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {locale === 'zh' ? '含预览版 (Pre-releases)' : 'Include Pre-releases'}
              </button>
            </div>
            {loading && (
              <span className="text-[10px] text-zinc-500 font-mono animate-pulse hidden sm:inline">
                {locale === 'zh' ? '• 正在同步' : '• Syncing'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {locale === 'zh'
                ? '注：VisionCloud 为在线云端服务，无需本地安装下载。'
                : 'Note: VisionCloud is a cloud SaaS platform and does not require local installation.'}
            </span>
          </div>
        </div>

        {/* Product Cards Grid: 3 Downloadable Products */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* 1. VisionStudio */}
          <ReleaseCard
            productId="visionstudio"
            productName="VisionStudio"
            tagline={locale === 'zh' ? '可视化工程工作台' : 'Engineering Workspace'}
            accentColor="#10b981"
            releases={releases.visionstudio}
            onOpenReleaseNotes={(rel) =>
              setSelectedRelease({
                productName: 'VisionStudio',
                release: rel,
                allReleases: releases.visionstudio,
              })
            }
          />

          {/* 2. VisionRuntime */}
          <ReleaseCard
            productId="visionruntime"
            productName="VisionRuntime"
            tagline={locale === 'zh' ? '生产执行引擎' : 'Production Runtime'}
            accentColor="#06b6d4"
            releases={releases.visionruntime}
            onOpenReleaseNotes={(rel) =>
              setSelectedRelease({
                productName: 'VisionRuntime',
                release: rel,
                allReleases: releases.visionruntime,
              })
            }
          />

          {/* 3. VisionEdge */}
          <ReleaseCard
            productId="visionedge"
            productName="VisionEdge"
            tagline={locale === 'zh' ? '边缘现场智能网关' : 'On-site Intelligence'}
            accentColor="#8b5cf6"
            releases={releases.visionedge}
            onOpenReleaseNotes={(rel) =>
              setSelectedRelease({
                productName: 'VisionEdge',
                release: rel,
                allReleases: releases.visionedge,
              })
            }
          />
        </div>

        {/* Industrial Deployment & Security Assurances */}
        <div className="max-w-6xl mx-auto rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-8 sm:p-10 mb-16 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white font-mono">
              {locale === 'zh' ? '// 车间离线部署与安全规范' : '// Industrial Air-Gapped Security Standards'}
            </h3>
            <p className="text-xs text-zinc-400">
              {locale === 'zh'
                ? '专为严格遵循物理断网、保密车间与 24/7 确定性流水线生产环境设计。'
                : 'Engineered specifically for high-security factories, air-gapped cells, and continuous manufacturing.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <CloudOff className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {locale === 'zh' ? '100% 物理隔离运行' : 'Air-Gapped Ready'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {locale === 'zh'
                  ? '执行核心与边缘网关无需公网连通或外部心跳验证即可全功能离线运转。'
                  : 'Zero telemetry, zero mandatory cloud heartbeats, and zero remote licensing dependencies.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {locale === 'zh' ? '二进制 SHA-256 校验' : 'SHA-256 Signed'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {locale === 'zh'
                  ? '每个发版包均附带数字哈希签名，确保在严苛工控机上安全部署无篡改。'
                  : 'Every release package includes an immutable cryptographic digest for secure factory auditing.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Server className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {locale === 'zh' ? '私有 SDK 契约通信' : 'SDK Decoupling'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {locale === 'zh'
                  ? '所有模块间通信通过开放 schemas 与标准 C++/Python SDK，杜绝内部强耦合。'
                  : 'Clean inter-process isolation governed by open data contracts and unified SDK headers.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Terminal className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {locale === 'zh' ? 'Headless 工控机守护' : 'Headless Daemon'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {locale === 'zh'
                  ? 'VisionRuntime 原生支持 Linux systemd 服务与 Windows 服务化无界面静默守护。'
                  : 'Native systemd service and Windows Service support for zero-GUI industrial execution.'}
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise Evaluation & Source Consultation */}
        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {locale === 'zh' ? '企业级支持与 PoC 评估' : 'Enterprise Evaluation'}
            </div>
            <h3 className="text-2xl font-bold text-white">
              {locale === 'zh' ? '需要企业定制版本或整机预装？' : 'Need Enterprise Custom Builds or OEM Image Integration?'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
              {locale === 'zh'
                ? '我们为工控机厂商 (OEM)、视觉装备系统集成商提供深度芯片指令优化 (AVX-512 / TensorRT)、定制相机驱动及现场架构联合验证。'
                : 'We collaborate with machine builders, IPC OEMs, and automation integrators for custom acceleration (AVX-512, TensorRT), fieldbus integration, and pilot certification.'}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onOpenContact}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              {locale === 'zh' ? '申请企业评估支持' : 'Request Enterprise Pilot'}
            </button>
            <button
              onClick={() => onNavigate('/developers')}
              className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-medium transition-colors cursor-pointer"
            >
              {locale === 'zh' ? '查看开发者 SDK' : 'Browse Developer SDK'}
            </button>
          </div>
        </div>
      </div>

      {/* Release Notes Modal */}
      <ReleaseNotesModal
        isOpen={Boolean(selectedRelease)}
        onClose={() => setSelectedRelease(null)}
        productName={selectedRelease?.productName || ''}
        release={selectedRelease?.release || null}
        allReleases={selectedRelease?.allReleases || []}
        onSelectRelease={(r) => {
          if (selectedRelease) {
            setSelectedRelease({
              ...selectedRelease,
              release: r,
            });
          }
        }}
      />
    </div>
  );
};
