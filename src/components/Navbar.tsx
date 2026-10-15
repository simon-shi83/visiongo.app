import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, X, User } from 'lucide-react';
import { SiteLink } from './SiteLink';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';

export function Navbar({ currentPath, onOpenContact }: { currentPath: string; onNavigate: (path: string) => void; onOpenContact: () => void }) {
  const { locale, t } = useLanguage();
  const { user } = useAuth();
  const [mobile, setMobile] = useState(false);
  const [products, setProducts] = useState(false);
  const header = useRef<HTMLElement>(null);
  useEffect(() => { setMobile(false); setProducts(false); }, [currentPath, locale]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) { setMobile(false); setProducts(false); } };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  const links = [{ path: '/solutions', label: t.nav.solutions }, { path: '/developers', label: t.nav.developers }, { path: '/resources', label: t.nav.resources }];
  return <header ref={header} className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md" onKeyDown={event => { if (event.key === 'Escape') { setMobile(false); setProducts(false); } }}>
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><SiteLink href="/" className="text-lg font-semibold tracking-wider text-white">VISION<span className="text-emerald-400">GO</span></SiteLink>
      <nav aria-label={locale === 'zh' ? '主导航' : 'Main navigation'} className="hidden items-center gap-2 xl:flex">
        <div className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setProducts(false); }}><button aria-expanded={products} aria-controls="product-navigation" onClick={() => setProducts(value => !value)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-zinc-300 hover:bg-zinc-900">{t.nav.products}<ChevronDown className="h-4 w-4" /></button>{products && <div id="product-navigation" className="absolute left-0 top-full w-60 rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-xl">{['visionstudio', 'visionruntime', 'visionedge', 'visioncloud'].map(product => <SiteLink key={product} href={`/products/${product}`} onClick={() => setProducts(false)} className="block rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-800">{product.replace('vision', 'Vision').replace('studio', 'Studio').replace('runtime', 'Runtime').replace('edge', 'Edge').replace('cloud', 'Cloud')}</SiteLink>)}</div>}</div>
        {links.map(link => <SiteLink key={link.path} href={link.path} aria-current={currentPath === link.path ? 'page' : undefined} className={`rounded-lg px-3 py-3 text-sm hover:bg-zinc-900 ${currentPath === link.path ? 'text-white' : 'text-zinc-400'}`}>{link.label}</SiteLink>)}
      </nav>
      <div className="flex items-center gap-2 sm:gap-3"><LanguageSwitcher /><SiteLink href="/my" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white sm:inline-flex"><User className="h-4 w-4" />{user ? (locale === 'zh' ? '我的账户' : 'My account') : (locale === 'zh' ? '登录' : 'Sign in')}</SiteLink><SiteLink href="/downloads" className="btn-primary hidden sm:inline-flex">{t.nav.downloads}</SiteLink><button onClick={() => setMobile(value => !value)} aria-label={locale === 'zh' ? '切换导航' : 'Toggle navigation'} aria-expanded={mobile} aria-controls="mobile-navigation" className="rounded-lg p-3 text-zinc-300 hover:bg-zinc-900 xl:hidden">{mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
    </div>
    {mobile && <nav id="mobile-navigation" aria-label={locale === 'zh' ? '移动导航' : 'Mobile navigation'} className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-zinc-800 px-4 py-4 xl:hidden" onClick={event => { if ((event.target as Element).closest('a')) setMobile(false); }}><div className="mx-auto grid max-w-7xl gap-2 sm:grid-cols-2">{['visionstudio', 'visionruntime'].map(product => <SiteLink key={product} href={`/products/${product}`} className="rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-900">{product === 'visionstudio' ? 'VisionStudio' : 'VisionRuntime'}</SiteLink>)}{links.map(link => <SiteLink key={link.path} href={link.path} className="rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-900">{link.label}</SiteLink>)}<SiteLink href="/my" className="rounded-lg px-3 py-3 text-sm text-zinc-300">{locale === 'zh' ? '我的账户 / 登录' : 'Account / Sign in'}</SiteLink><SiteLink href="/downloads" className="btn-primary">{t.nav.downloads}</SiteLink><button className="btn-secondary" onClick={() => { setMobile(false); onOpenContact(); }}>{t.nav.contactEngineering}</button></div></nav>}
  </header>;
}
