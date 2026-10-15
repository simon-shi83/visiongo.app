import { SiteLink } from '../components/SiteLink';
import { useEffect, useState } from 'react';
import { ReleaseCard } from '../components/ReleaseCard';
import { ReleaseNotesModal } from '../components/ReleaseNotesModal';
import { SeoHead } from '../components/SeoHead';
import { SectionHeader } from '../components/SectionHeader';
import type { ProductRelease, DownloadableProduct } from '../types/downloads';
import { useLanguage } from '../i18n/LanguageContext';

const PRODUCTS = ['visionstudio', 'visionruntime', 'visionedge'] as const;
const emptyReleases = (): Record<DownloadableProduct, ProductRelease[]> => ({ visionstudio: [], visionruntime: [], visionedge: [] });
const names = { visionstudio: 'VisionStudio', visionruntime: 'VisionRuntime', visionedge: 'VisionEdge' };

export function DownloadsPage({ initialProduct, initialVersion }: { initialProduct?: DownloadableProduct; initialVersion?: string; onNavigate: (path: string) => void; onOpenContact: () => void }) {
  const { locale } = useLanguage();
  const zh = locale === 'zh';
  const [releases, setReleases] = useState(emptyReleases);
  const [errors, setErrors] = useState<Partial<Record<DownloadableProduct, string>>>({});
  const [loading, setLoading] = useState(true);
  const [includePrereleases, setIncludePrereleases] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<{ product: DownloadableProduct; release: ProductRelease } | null>(null);
  const [missingVersion, setMissingVersion] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErrors({});
    setSelected(null);
    setMissingVersion(false);
    void (async () => {
      try {
        const response = await fetch(`/api/releases?includePrereleases=${includePrereleases}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Release service unavailable');
        const data = await response.json();
        if (!data.releases || PRODUCTS.some(product => !Array.isArray(data.releases[product]))) throw new Error('Invalid releases response');
        if (controller.signal.aborted) return;
        setReleases(data.releases);
        setErrors(data.errors || {});
      } catch {
        if (controller.signal.aborted) return;
        setReleases(emptyReleases());
        setErrors(Object.fromEntries(PRODUCTS.map(product => [product, 'unavailable'])));
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [includePrereleases, attempt]);
  useEffect(() => {
    if (loading || !initialProduct || errors[initialProduct] || !initialVersion) return;
    const match = releases[initialProduct].find(item => item.version.toLowerCase() === initialVersion.toLowerCase());
    setMissingVersion(!match);
    if (match) setSelected({ product: initialProduct, release: match });
  }, [initialProduct, initialVersion, releases, loading, errors]);
  return <div className="page-shell">
    <SeoHead title={zh ? '软件下载' : 'Downloads — Software releases'} description={zh ? '选择适合操作系统与架构的 VISIONGO 官方发行包。' : 'Choose published VISIONGO packages for your operating system and architecture.'} canonicalPath="/downloads" />
    <SectionHeader as="h1" badge="VISIONGO" title={zh ? '下载并开始构建检测流程' : 'Download and start building'} description={zh ? '下载无需登录。先选择版本，再选择与你的系统和架构匹配的安装包。' : 'No sign-in required. Choose a version and a package that matches your operating system and architecture.'} />
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><label className="flex min-h-11 items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={includePrereleases} onChange={event => setIncludePrereleases(event.target.checked)} />{zh ? '包含预览版本' : 'Include preview releases'}</label><SiteLink href="/developers#quickstart" className="text-sm text-emerald-400">{zh ? '第一次使用？阅读快速开始 →' : 'First time? Read the quickstart →'}</SiteLink></div>
    {initialProduct && !initialVersion && <p role="status" className="mb-6 text-sm text-zinc-400">{zh ? '你正在查找' : 'You are looking for'} {names[initialProduct]}。{zh ? '请选择下方对应产品的安装包。' : ' Choose its package below.'}</p>}
    {missingVersion && <p role="alert" className="mb-6 rounded-xl border border-amber-500/30 p-4 text-sm text-amber-300">{zh ? '当前通道未找到链接指定的版本。可以包含预览版或选择其他已发布版本。' : 'The linked version is not available in this channel. Include previews or select another published version.'}</p>}
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{PRODUCTS.map(product => <ReleaseCard key={product} productId={product} productName={names[product]} tagline={product === 'visionstudio' ? (zh ? '可视化工程工作台' : 'Engineering workspace') : product === 'visionruntime' ? (zh ? '现场执行引擎' : 'Local execution runtime') : (zh ? '边缘网关' : 'Edge gateway')} accentColor="#34d399" releases={releases[product]} loading={loading} error={errors[product]} onRetry={() => setAttempt(value => value + 1)} onOpenReleaseNotes={release => setSelected({ product, release })} />)}</div>
    <section id="requirements" className="surface-card mt-10 space-y-4 p-6 sm:p-8"><h2 className="text-xl font-semibold text-white">{zh ? '安装与兼容性' : 'Installation and compatibility'}</h2><p className="text-sm leading-relaxed text-zinc-400">{zh ? '支持的操作系统和 CPU 架构以安装包标注为准。使用前阅读版本说明与随包文档，确认 Studio、Runtime、相机驱动及可选计算后端的要求。没有适合设备的安装包时，请联系工程团队。' : 'Supported operating systems and CPU architectures are listed on each package. Read release notes and bundled documentation for Studio, Runtime, camera driver and optional compute-backend requirements. Contact engineering if no package matches your device.'}</p><p className="text-sm text-zinc-400">{zh ? '本地部署的联网要求取决于启用的功能；在线登录与云端功能需要相应服务可用。VisionCloud 无需本地安装。' : 'Connectivity requirements depend on enabled features; online sign-in and cloud features require their services. VisionCloud has no local installer.'}</p><div className="flex flex-wrap gap-5 text-sm"><SiteLink href="/developers#quickstart" className="text-emerald-400">{zh ? '安装与首次运行指引' : 'Installation and first-run guide'}</SiteLink><SiteLink href="/contact" className="text-emerald-400">{zh ? '咨询版本兼容性' : 'Ask about version compatibility'}</SiteLink></div></section>
    <ReleaseNotesModal isOpen={!!selected} onClose={() => setSelected(null)} productName={selected ? names[selected.product] : ''} release={selected?.release || null} allReleases={selected ? releases[selected.product] : []} onSelectRelease={release => setSelected(previous => previous ? { ...previous, release } : null)} />
  </div>;
}
