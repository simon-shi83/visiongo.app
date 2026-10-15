import routes from './routes.json';

export function stripLocalePath(path: string): string {
  return path === '/zh' ? '/' : path.startsWith('/zh/') ? path.slice(3) : path;
}

export function isPublicPath(path: string): boolean {
  const plain = stripLocalePath(path);
  return routes.some(route => route.path === plain) || /^\/downloads\/(visionstudio|visionruntime|visionedge)(\/[^/]+)?$/.test(plain);
}

export function localizedPath(path: string, locale: 'en' | 'zh'): string {
  const url = new URL(path, 'https://visiongo.app');
  const plain = stripLocalePath(url.pathname);
  if (isPublicPath(plain)) {
    url.pathname = locale === 'zh' ? (plain === '/' ? '/zh' : `/zh${plain}`) : plain;
    url.searchParams.delete('lang');
  } else if (locale === 'zh') url.searchParams.set('lang', 'zh');
  else url.searchParams.delete('lang');
  return `${url.pathname}${url.search}${url.hash}`;
}

export const PUBLIC_ROUTES = routes;
