import { useEffect } from 'react';
import { localizedPath } from '../../shared/routing';
import { useLanguage } from '../i18n/LanguageContext';

interface SeoHeadProps { title: string; description: string; canonicalPath?: string; noindex?: boolean }
export function SeoHead({ title, description, canonicalPath = '/', noindex = false }: SeoHeadProps) {
  const { locale } = useLanguage();
  useEffect(() => {
    const fullTitle = title.includes('VISIONGO') ? title : `${title} | VISIONGO`;
    document.title = fullTitle;
    const meta = (key: string, value: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let element = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attr, key); document.head.appendChild(element); }
      element.setAttribute('content', value);
    };
    const url = `https://visiongo.app${localizedPath(canonicalPath, locale)}`;
    meta('title', fullTitle); meta('description', description); meta('robots', noindex ? 'noindex, follow' : 'index, follow');
    for (const key of ['og', 'twitter']) { meta(`${key}:title`, fullTitle, true); meta(`${key}:description`, description, true); meta(`${key}:url`, url, true); }
    meta('og:locale', locale === 'zh' ? 'zh_CN' : 'en_US', true);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', url);
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(element => element.remove());
    if (!noindex) for (const language of ['en', 'zh', 'x-default'] as const) {
      const link = document.createElement('link'); link.rel = 'alternate'; link.hreflang = language === 'zh' ? 'zh-CN' : language;
      link.href = `https://visiongo.app${localizedPath(canonicalPath, language === 'zh' ? 'zh' : 'en')}`; document.head.appendChild(link);
    }
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach(element => element.remove());
    if (!noindex) {
      const schema = document.createElement('script'); schema.type = 'application/ld+json';
      schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: fullTitle, description, url, inLanguage: locale === 'zh' ? 'zh-CN' : 'en' });
      document.head.appendChild(schema);
    }
  }, [title, description, canonicalPath, noindex, locale]);
  return null;
}
