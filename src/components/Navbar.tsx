import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { getProducts } from '../data/products';
import { useLanguage } from '../i18n/LanguageContext';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenContact }) => {
  const { t, locale } = useLanguage();
  const products = getProducts(locale);

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProductsDropdownOpen(false);
  }, [currentPath]);

  const navLinks = [
    { label: t.nav.solutions, path: '/solutions' },
    { label: t.nav.developers, path: '/developers' },
    { label: t.nav.downloads, path: '/downloads' },
    { label: t.nav.resources, path: '/resources' },
    { label: t.nav.about, path: '/about' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 shadow-lg shadow-black/40'
          : 'bg-transparent border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center transition-colors group-hover:border-emerald-500/50">
            <svg
              className="w-4 h-4 text-emerald-400 transition-transform group-hover:scale-105"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M4 6L12 18L20 6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="11" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-lg tracking-wider text-white flex items-center gap-1.5 font-sans">
              VISIONGO
            </span>
            <span className="hidden sm:block text-[10px] uppercase font-mono tracking-widest text-zinc-400">
              {t.hero.badge}
            </span>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Products Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setProductsDropdownOpen(true)}
            onMouseLeave={() => setProductsDropdownOpen(false)}
          >
            <button
              onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentPath.startsWith('/products')
                  ? 'text-white bg-zinc-900'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              {t.nav.products}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  productsDropdownOpen ? 'rotate-180 text-emerald-400' : 'text-zinc-500'
                }`}
              />
            </button>

            {productsDropdownOpen && (
              <div className="absolute top-full left-0 w-80 pt-2 z-50 animate-fadeIn">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl backdrop-blur-xl">
                  <div className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 px-3 py-1.5 border-b border-zinc-800/80 mb-1">
                    {t.nav.productsDropdownTitle}
                  </div>
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setProductsDropdownOpen(false);
                        onNavigate(`/products/${product.slug}`);
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-800/60 transition-colors flex items-start gap-3 group"
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold mt-0.5"
                        style={{
                          backgroundColor: `${product.accentColor}15`,
                          color: product.accentColor,
                          border: `1px solid ${product.accentColor}40`,
                        }}
                      >
                        {product.shortAction[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-zinc-200 group-hover:text-white">
                            {product.name}
                          </span>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${product.accentColor}15`,
                              color: product.accentColor,
                            }}
                          >
                            {product.shortAction}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                          {product.tagline}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Other Nav links */}
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-zinc-900'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Items */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          <a
            href="https://github.com/simon-shi83/website"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors"
            title="GitHub Repository"
          >
            <GithubIcon className="w-4 h-4" />
          </a>

          <button
            onClick={onOpenContact}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all font-mono"
          >
            {t.nav.contactEngineering}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Menu Button & Language Switcher */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950/95 border-b border-zinc-800 px-4 pt-2 pb-6 space-y-3 backdrop-blur-xl">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 px-2 pt-2">
            {t.nav.products}
          </div>
          <div className="grid grid-cols-1 gap-1">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  onNavigate(`/products/${product.slug}`);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 flex items-center justify-between text-sm text-zinc-300"
              >
                <span>{product.name}</span>
                <span className="text-xs font-mono text-zinc-400">{product.shortAction}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-800/80 pt-2 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  onNavigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  currentPath === link.path
                    ? 'text-white bg-zinc-900 font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="w-full py-2.5 rounded-lg text-xs font-mono font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors text-center"
            >
              {t.nav.contactEngineering}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
