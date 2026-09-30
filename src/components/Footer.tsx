import React from 'react';
import { Mail, ArrowUpRight, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { getProducts } from '../data/products';
import { useLanguage } from '../i18n/LanguageContext';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenContact: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenContact }) => {
  const { t, locale } = useLanguage();
  const products = getProducts(locale);

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/80 text-zinc-400 font-sans">
      {/* Top Banner: Industrial Guarantee */}
      <div className="border-b border-zinc-800/60 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3 text-zinc-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{t.footer.airGappedGuarantee}</span>
          </div>
          <div className="flex items-center gap-6 text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              {t.footer.sdkPill}
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              {t.footer.jitterPill}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
              {t.footer.autonomousPill}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M4 6L12 18L20 6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="11" r="2.5" fill="currentColor" />
                </svg>
              </div>
              <span className="font-bold text-lg text-white tracking-wider">VISIONGO</span>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              {t.footer.missionSummary}
            </p>

            <div className="pt-2 text-xs font-mono space-y-1.5 text-zinc-400">
              <p>
                {t.footer.primaryDomain}{' '}
                <a href="https://visiongo.app" className="text-zinc-300 hover:text-white">
                  visiongo.app
                </a>
              </p>
              <p>{t.footer.deploymentCloudflare}</p>
            </div>

            {/* Email contact links */}
            <div className="pt-3 space-y-2">
              <div className="text-xs uppercase font-mono tracking-wider text-zinc-400">
                {t.footer.inquiriesTitle}
              </div>
              <div className="flex flex-col gap-1.5 text-xs font-mono">
                <a
                  href="mailto:contact@visiongo.app"
                  className="inline-flex items-center gap-2 text-zinc-300 hover:text-emerald-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  contact@visiongo.app
                </a>
                <a
                  href="mailto:sales@visiongo.app"
                  className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  sales@visiongo.app
                </a>
                <a
                  href="mailto:support@visiongo.app"
                  className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  support@visiongo.app
                </a>
              </div>
            </div>
          </div>

          {/* Products Col */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-300 mb-4 font-semibold">
              {t.nav.products}
            </div>
            <ul className="space-y-2.5 text-sm">
              {products.map((product) => (
                <li key={product.id}>
                  <button
                    onClick={() => onNavigate(`/products/${product.slug}`)}
                    className="text-zinc-400 hover:text-white transition-colors text-left flex items-center justify-between w-full group"
                  >
                    <span>{product.name}</span>
                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-400">
                      {product.shortAction}
                    </span>
                  </button>
                </li>
              ))}
              <li className="pt-2">
                <button
                  onClick={() => onNavigate('/solutions')}
                  className="text-emerald-400/90 hover:text-emerald-300 transition-colors text-xs font-mono flex items-center gap-1"
                >
                  {t.footer.allSolutionsLink} <ArrowUpRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Developers Col */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-300 mb-4 font-semibold">
              {t.nav.developers}
            </div>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/developers#docs')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {locale === 'zh' ? '架构与文档' : 'Documentation'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/developers#sdk')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {locale === 'zh' ? '标准化 SDK' : 'Standardized SDK'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/downloads')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>{t.nav.downloads}</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                    GA
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/developers#api')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {locale === 'zh' ? '现场总线与 API 参考' : 'Fieldbus & API Reference'}
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/simon-shi83/website"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>

          {/* Resources & Company Col */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-300 mb-4 font-semibold">
              {t.footer.aboutTitle}
            </div>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/resources')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {locale === 'zh' ? '技术文章' : 'Technical Articles'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/resources#tutorials')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {locale === 'zh' ? '开发教程' : 'Tutorials & Guides'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/resources#case-studies')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {locale === 'zh' ? '实战案例' : 'Industrial Case Studies'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {t.nav.about} VISIONGO
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {t.nav.contact}
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={onOpenContact}
                  className="text-xs font-mono text-zinc-300 hover:text-white border border-zinc-800 px-3 py-1.5 rounded-md hover:border-zinc-700 transition-colors"
                >
                  {t.footer.enterpriseConsultation}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>&copy; {new Date().getFullYear()} {t.footer.copyright}</span>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <button
              onClick={() => onNavigate('/privacy')}
              className="hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {locale === 'zh' ? '隐私政策' : 'Privacy Policy'}
            </button>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <button
              onClick={() => onNavigate('/terms')}
              className="hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {locale === 'zh' ? '使用条款' : 'Terms of Use'}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="full" />
            <span className="text-zinc-700">|</span>
            <a
              href="https://github.com/simon-shi83/website"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 flex items-center gap-1.5"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              {t.footer.openEcosystem}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
