import { createContext, useContext, lazy, Suspense, useCallback, useEffect, useState, type ComponentType, type MouseEvent } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ContactModal } from './components/ContactModal';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { isPublicPath, localizedPath, stripLocalePath } from '../shared/routing';
import type { DownloadableProduct } from './types/downloads';
import type { SupportedLocale } from './types/i18n';

// Only the prerender script supplies synchronous page modules; they never enter the client bundle.
const SSRPages = createContext<Record<string, Record<string, ComponentType>> | undefined>(undefined);
const browserPages = import.meta.glob<Record<string, ComponentType>>(['./pages/*.tsx', '!./pages/HomePage.tsx', '!./pages/NotFoundPage.tsx']);
function page<P extends object>(file: string, name: string): ComponentType<P> {
  const BrowserPage = lazy(async () => ({ default: (await browserPages[`./pages/${file}.tsx`]())[name] as ComponentType<P> }));
  return function Page(props: P) {
    const serverPages = useContext(SSRPages);
    const Component = serverPages ? serverPages[file][name] as ComponentType<P> : BrowserPage;
    return <Component {...props} />;
  };
}
const ProductPage = page<Parameters<typeof import('./pages/ProductPage').ProductPage>[0]>('ProductPage', 'ProductPage');
const DownloadsPage = page<Parameters<typeof import('./pages/DownloadsPage').DownloadsPage>[0]>('DownloadsPage', 'DownloadsPage');
const SolutionsPage = page<Parameters<typeof import('./pages/SolutionsPage').SolutionsPage>[0]>('SolutionsPage', 'SolutionsPage');
const DevelopersPage = page<Parameters<typeof import('./pages/DevelopersPage').DevelopersPage>[0]>('DevelopersPage', 'DevelopersPage');
const ResourcesPage = page<{ slug?: string }>('ResourcesPage', 'ResourcesPage');
const AboutPage = page<Parameters<typeof import('./pages/AboutPage').AboutPage>[0]>('AboutPage', 'AboutPage');
const AccountPage = page<Parameters<typeof import('./pages/AccountPage').AccountPage>[0]>('AccountPage', 'AccountPage');
const ContactPage = page<Record<string, never>>('ContactPage', 'ContactPage');
const PrivacyPolicyPage = page<Record<string, never>>('PrivacyPolicyPage', 'PrivacyPolicyPage');
const TermsOfUsePage = page<Record<string, never>>('TermsOfUsePage', 'TermsOfUsePage');
const DesktopAuthPage = page<Record<string, never>>('DesktopAuthPage', 'DesktopAuthPage');

interface AppProps { initialPath?: string; initialLocale?: SupportedLocale; ssrPages?: Record<string, Record<string, ComponentType>> }
const locationPath = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;
function AppContent({ initialPath }: AppProps) {
  const { locale } = useLanguage();
  const [location, setLocation] = useState(() => initialPath || (typeof window !== 'undefined' ? locationPath() : '/'));
  const [contactOpen, setContactOpen] = useState(false);
  const closeContact = useCallback(() => setContactOpen(false), []);
  const openContact = useCallback(() => setContactOpen(true), []);
  const path = stripLocalePath(location.split(/[?#]/)[0]);
  useEffect(() => {
    const update = () => setLocation(locationPath());
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  const navigate = (target: string) => {
    const next = localizedPath(target, locale);
    if (next === locationPath()) return;
    window.history.pushState({}, '', next);
    setLocation(next);
    if (!new URL(next, window.location.origin).hash) window.scrollTo(0, 0);
  };
  useEffect(() => {
    const hash = new URL(location, 'https://visiongo.app').hash.slice(1);
    if (!hash) return;
    // A lazy-loaded route may not have committed when this effect runs.
    let stopped = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const scroll = () => {
      if (stopped) return;
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      else if (++tries < 30) timer = setTimeout(scroll, 50);
    };
    scroll();
    return () => { stopped = true; clearTimeout(timer); };
  }, [location]);
  const followLink = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest('a[href]');
    if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download') || anchor.target && anchor.target !== '_self') return;
    const url = new URL(anchor.href);
    if (url.origin !== window.location.origin || url.pathname.startsWith('/api/')) return;
    event.preventDefault();
    navigate(`${url.pathname}${url.search}${url.hash}`);
  };
  let content;
  if (path.startsWith('/products/') && isPublicPath(path)) content = <ProductPage slug={path.slice('/products/'.length)} onNavigate={navigate} onOpenContact={openContact} />;
  else if (path.startsWith('/downloads') && isPublicPath(path)) {
    const [, , product, version] = path.split('/');
    content = <DownloadsPage initialProduct={product as DownloadableProduct | undefined} initialVersion={version} onNavigate={navigate} onOpenContact={openContact} />;
  } else if (path.startsWith('/resources/') && isPublicPath(path)) content = <ResourcesPage slug={path.slice('/resources/'.length)} />;
  else switch (path) {
    case '/': content = <HomePage onNavigate={navigate} onOpenContact={openContact} />; break;
    case '/solutions': content = <SolutionsPage onNavigate={navigate} onOpenContact={openContact} />; break;
    case '/developers': content = <DevelopersPage onNavigate={navigate} />; break;
    case '/resources': content = <ResourcesPage />; break;
    case '/about': content = <AboutPage onOpenContact={openContact} />; break;
    case '/contact': content = <ContactPage />; break;
    case '/privacy': content = <PrivacyPolicyPage />; break;
    case '/terms': content = <TermsOfUsePage />; break;
    case '/my': case '/account': content = <AccountPage onNavigate={navigate} />; break;
    case '/auth/desktop': content = <DesktopAuthPage />; break;
    default: content = <NotFoundPage />;
  }
  return <div onClick={followLink} className="flex min-h-screen flex-col bg-zinc-950"><a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-xl focus:bg-zinc-800 focus:p-3 focus:text-white" href="#main-content">{locale === 'zh' ? '跳到正文' : 'Skip to content'}</a><Navbar currentPath={path} onNavigate={navigate} onOpenContact={openContact} /><main id="main-content" className="flex-1"><Suspense fallback={<div role="status" className="page-shell text-zinc-400">{locale === 'zh' ? '正在加载页面…' : 'Loading page…'}</div>}>{content}</Suspense></main><Footer onNavigate={navigate} onOpenContact={openContact} /><ContactModal isOpen={contactOpen} onClose={closeContact} /></div>;
}
export function App(props: AppProps) {
  const locale = props.initialLocale || (props.initialPath ? (props.initialPath === '/zh' || props.initialPath.startsWith('/zh/') ? 'zh' : 'en') : undefined);
  return <SSRPages.Provider value={props.ssrPages}><AuthProvider><LanguageProvider initialLocale={locale}><AppContent {...props} /></LanguageProvider></AuthProvider></SSRPages.Provider>;
}
export default App;
