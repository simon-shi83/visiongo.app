import type { AnchorHTMLAttributes } from 'react';
import { localizedPath } from '../../shared/routing';
import { useLanguage } from '../i18n/LanguageContext';

export function SiteLink({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { locale } = useLanguage();
  const target = href?.startsWith('/') && !href.startsWith('//') && !href.startsWith('/api/') ? localizedPath(href, locale) : href;
  return <a href={target} {...props} />;
}
