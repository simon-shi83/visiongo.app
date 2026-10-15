import { SiteLink } from '../components/SiteLink';
import { SeoHead } from '../components/SeoHead';
import { useLanguage } from '../i18n/LanguageContext';

export function NotFoundPage() {
  const { locale } = useLanguage();
  const zh = locale === 'zh';
  return <div className="page-shell py-40 text-center"><SeoHead title="404 — Page not found" description={zh ? '页面不存在。' : 'This page does not exist.'} noindex /><p className="text-sm text-zinc-400">404</p><h1 className="my-6 text-4xl font-semibold text-white">{zh ? '页面不存在' : 'Page not found'}</h1><SiteLink href="/" className="btn-primary">{zh ? '返回首页' : 'Back to home'}</SiteLink></div>;
}
