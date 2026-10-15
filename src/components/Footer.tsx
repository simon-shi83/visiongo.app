import { SiteLink } from './SiteLink';
import { useLanguage } from '../i18n/LanguageContext';

export function Footer(_props: { onNavigate: (path: string) => void; onOpenContact: () => void }) {
  const { locale } = useLanguage();
  const zh = locale === 'zh';
  const columns = [
    { title: zh ? '产品' : 'Products', links: [['VisionStudio', '/products/visionstudio'], ['VisionRuntime', '/products/visionruntime'], ['VisionEdge', '/products/visionedge'], ['VisionCloud', '/products/visioncloud'], [zh ? '软件下载' : 'Downloads', '/downloads']] },
    { title: zh ? '工程资源' : 'Engineering', links: [[zh ? '快速开始' : 'Quickstart', '/developers#quickstart'], [zh ? 'SDK 公共契约' : 'SDK contracts', '/developers#sdk'], [zh ? '部署指南' : 'Deployment guide', '/resources/local-deployment'], [zh ? '流程调试' : 'Workflow debugging', '/resources/workflow-debugging']] },
    { title: zh ? '团队与支持' : 'Team and support', links: [[zh ? '关于 VISIONGO' : 'About VISIONGO', '/about'], [zh ? '联系工程团队' : 'Contact engineering', '/contact'], ['GitHub', 'https://github.com/simon-shi83/website']] },
  ];
  return <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8"><div className="space-y-4"><SiteLink href="/" className="text-lg font-semibold tracking-wider text-white">VISIONGO</SiteLink><p className="max-w-xs text-sm leading-relaxed">{zh ? '为工业视觉提供工程工作台与现场执行引擎。' : 'An engineering workspace and local execution runtime for industrial vision.'}</p><a href="mailto:contact@visiongo.app" className="block text-sm text-emerald-400">contact@visiongo.app</a></div>{columns.map(column => <div key={column.title}><h2 className="mb-4 text-sm font-semibold text-zinc-200">{column.title}</h2><ul className="space-y-3">{column.links.map(([label, href]) => <li key={href}><SiteLink href={href} className="text-sm hover:text-white">{label}</SiteLink></li>)}</ul></div>)}</div><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 border-t border-zinc-800 px-4 py-6 text-xs sm:px-6 lg:px-8"><span>© {new Date().getFullYear()} VISIONGO</span><div className="flex gap-5"><SiteLink href="/privacy">{zh ? '隐私政策' : 'Privacy policy'}</SiteLink><SiteLink href="/terms">{zh ? '使用条款' : 'Terms of use'}</SiteLink></div></div></footer>;
}
