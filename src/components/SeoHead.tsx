import { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
}

export const SeoHead = ({ title, description, canonicalPath = '/' }: SeoHeadProps) => {
  const { locale } = useLanguage();

  useEffect(() => {
    const fullTitle = title.includes('VISIONGO') ? title : `${title} | VISIONGO`;
    document.title = fullTitle;

    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Update OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    // Update OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    // Update OpenGraph Locale
    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement('meta');
      ogLocale.setAttribute('property', 'og:locale');
      document.head.appendChild(ogLocale);
    }
    ogLocale.setAttribute('content', locale === 'zh' ? 'zh_CN' : 'en_US');

    // Update Canonical URL
    const canonicalHref = canonicalPath === '/' ? 'https://visiongo.app/' : `https://visiongo.app${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);

    // Update OpenGraph URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalHref);
    }
  }, [title, description, canonicalPath, locale]);

  return null;
};
