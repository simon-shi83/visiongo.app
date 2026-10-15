import { SiteLink } from './SiteLink';
import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import type { ProductRelease } from '../types/downloads';
import { useLanguage } from '../i18n/LanguageContext';

interface ReleaseCardProps {
  productId: 'visionstudio' | 'visionruntime' | 'visionedge';
  productName: string;
  tagline: string;
  accentColor: string;
  releases: ProductRelease[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onOpenReleaseNotes: (release: ProductRelease) => void;
}

export function ReleaseCard({ productName, tagline, releases, loading, error, onRetry, onOpenReleaseNotes }: ReleaseCardProps) {
  const { locale } = useLanguage();
  const zh = locale === 'zh';
  const [version, setVersion] = useState('');
  const [assetId, setAssetId] = useState('');
  const release = releases.find(item => item.version === version) || releases[0];
  const asset = release?.assets.find(item => item.id === assetId);
  useEffect(() => { setVersion(''); setAssetId(''); }, [releases]);
  return <article className="surface-card flex flex-col gap-5 p-6">
    <header><h2 className="text-xl font-semibold text-white">{productName}</h2><p className="mt-1 text-sm text-zinc-400">{tagline}</p></header>
    {loading ? <p role="status" className="py-8 text-sm text-zinc-400">{zh ? '正在获取发行版本…' : 'Loading releases…'}</p> : error ? <div role="alert" className="space-y-4 py-4"><p className="text-sm text-amber-300">{zh ? '暂时无法获取发行版本，请重试。' : 'Release service is unavailable. Please retry.'}</p><button className="btn-secondary" onClick={onRetry}>{zh ? '重新加载' : 'Retry'}</button></div> : !release ? <div className="space-y-4 py-4"><p className="text-sm text-zinc-400">{zh ? '当前通道暂无已发布版本。' : 'No releases are published in this channel.'}</p><SiteLink href="/contact" className="text-sm text-emerald-400">{zh ? '咨询产品与试用' : 'Ask about products and evaluation'}</SiteLink></div> : <>
      <label className="form-label">{zh ? '版本' : 'Version'}<select className="form-input" value={release.version} onChange={event => { setVersion(event.target.value); setAssetId(''); }}>{releases.map(item => <option key={item.version} value={item.version}>{item.version}{item.prerelease ? (zh ? ' · 预览版' : ' · Preview') : ''}</option>)}</select></label>
      <p className="text-xs text-zinc-400">{zh ? '发布日期：' : 'Published: '}{release.publishedAt ? new Date(release.publishedAt).toLocaleDateString(zh ? 'zh-CN' : 'en-US') : (zh ? '未提供' : 'Not provided')}</p>
      {release.assets.length ? <label className="form-label">{zh ? '系统、架构与安装包' : 'System, architecture and package'}<select className="form-input" value={assetId} onChange={event => setAssetId(event.target.value)}><option value="">{zh ? '请选择与你的设备匹配的安装包' : 'Choose a package for your device'}</option>{release.assets.map(item => <option value={item.id} key={item.id}>{item.platform} / {item.arch} — {item.name}</option>)}</select></label> : <p className="text-sm text-zinc-400">{zh ? '此版本尚未发布安装包。' : 'This release has no published packages.'}</p>}
      {asset && <div className="space-y-2 rounded-xl bg-zinc-950 p-3 text-xs text-zinc-400"><p className="break-all text-zinc-200">{asset.name}</p><p>{asset.platform} / {asset.arch} · {(asset.size / 1048576).toFixed(1)} MB</p>{asset.digest && <p className="break-all font-mono">{asset.digest}</p>}</div>}
      <div className="mt-auto space-y-3 pt-2">{asset ? <SiteLink className="btn-primary w-full" href={asset.downloadUrl} download><Download className="h-4 w-4" />{zh ? '下载所选安装包' : 'Download selected package'}</SiteLink> : <button className="btn-primary w-full" disabled>{zh ? '选择安装包后下载' : 'Select a package to download'}</button>}<button className="btn-secondary w-full" onClick={() => onOpenReleaseNotes(release)}><FileText className="h-4 w-4" />{zh ? '更新日志与版本说明' : 'Release notes'}</button><SiteLink href="/developers#quickstart" className="block text-center text-sm text-zinc-400 hover:text-white">{zh ? '快速开始与安装指引' : 'Quickstart and installation guidance'}</SiteLink></div>
    </>}
  </article>;
}
