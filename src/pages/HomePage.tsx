import React from 'react';
import { ArrowRight, Cpu, ShieldCheck, Zap, Layers, Lock, Terminal, Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { getProducts } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { TerminalDemo } from '../components/TerminalDemo';
import { SectionHeader } from '../components/SectionHeader';
import { getSolutions } from '../data/solutions';
import { getDeveloperResources, getArchitectureNote } from '../data/developerResources';
import { getResourceArticles } from '../data/resources';
import { SeoHead } from '../components/SeoHead';
import { useLanguage } from '../i18n/LanguageContext';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenContact: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenContact }) => {
  const { t, locale } = useLanguage();
  const products = getProducts(locale);
  const solutions = getSolutions(locale);
  const developerResources = getDeveloperResources(locale);
  const archNote = getArchitectureNote(locale);
  const articles = getResourceArticles(locale);

  const whyIcons = [
    <Cpu className="w-5 h-5 text-cyan-400" key="0" />,
    <ShieldCheck className="w-5 h-5 text-violet-400" key="1" />,
    <Zap className="w-5 h-5 text-emerald-400" key="2" />,
    <Lock className="w-5 h-5 text-amber-400" key="3" />,
    <Activity className="w-5 h-5 text-zinc-300" key="4" />,
    <Layers className="w-5 h-5 text-emerald-400" key="5" />,
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <SeoHead
        title={t.hero.badge}
        description={
          locale === 'zh'
            ? '用 AI 构建、运行与进化工业视觉系统。基于 VisionStudio、VisionRuntime、VisionEdge 和 VisionCloud 打造。'
            : 'Build, run, and improve industrial vision systems with AI using VisionStudio, VisionRuntime, VisionEdge, and VisionCloud.'
        }
        canonicalPath="/"
      />

      {/* SECTION 1 — HERO */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden tech-grid border-b border-zinc-900">
        {/* Ambient subtle backlights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[200px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Brand positioning kicker */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs font-mono shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-white font-semibold">VISIONGO</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">{t.hero.badge}</span>
            </div>

            {/* Main H1 */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
              {t.hero.headlinePart1}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                {t.hero.headlineHighlight}
              </span>
              {t.hero.headlinePart2}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed font-normal max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono">
              <a
                href="#products"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold tracking-wide transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2"
              >
                <span>{t.hero.exploreProducts}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#architecture"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-semibold tracking-wide transition-all flex items-center justify-center gap-2"
              >
                <span>{t.hero.viewArchitecture}</span>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </a>
            </div>

            {/* Key Engineering Indicators */}
            <div className="pt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-zinc-500 border-t border-zinc-900/80">
              <span className="flex items-center gap-2 text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t.hero.airGappedBadge}
              </span>
              <span className="flex items-center gap-2 text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t.hero.determinismBadge}
              </span>
              <span className="flex items-center gap-2 text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t.hero.noCloudBadge}
              </span>
            </div>
          </div>

          {/* Interactive Live Telemetry / Pipeline Demo */}
          <div className="mt-14 max-w-4xl mx-auto">
            <TerminalDemo />
          </div>
        </div>
      </section>

      {/* SECTION 2 — FOUR PRODUCTS */}
      <section id="products" className="py-24 md:py-32 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={t.productsSection.badge}
            title={t.productsSection.title}
            description={t.productsSection.description}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(slug) => onNavigate(`/products/${slug}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW THEY WORK TOGETHER */}
      <section id="architecture" className="py-24 md:py-32 bg-zinc-950/80 tech-grid border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={t.architectureSection.badge}
            title={t.architectureSection.title}
            description={t.architectureSection.description}
          />

          <ArchitectureDiagram onNavigateProduct={(slug) => onNavigate(`/products/${slug}`)} />

          {/* Architecture Technical Note */}
          <div className="mt-8 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs font-mono text-zinc-400 max-w-4xl mx-auto flex items-start gap-3">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-200 font-semibold">{archNote.headline}: </span>
              <span>&ldquo;{archNote.text}&rdquo; </span>
              <span className="text-zinc-500">{archNote.subtext}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHY VISIONGO */}
      <section className="py-24 md:py-32 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={t.whySection.badge}
            title={t.whySection.title}
            description={t.whySection.description}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.whySection.pillars.map((pillar, index) => (
              <div
                key={index}
                className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center mb-5">
                  {whyIcons[index]}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{pillar.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — SOLUTIONS */}
      <section className="py-24 md:py-32 bg-zinc-950/80 tech-grid border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={t.solutionsSection.badge}
            title={t.solutionsSection.title}
            description={t.solutionsSection.description}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((solution) => (
              <div
                key={solution.id}
                onClick={() => onNavigate('/solutions')}
                className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-2">
                    {solution.industry}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">
                    {solution.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                    {solution.shortDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <div className="flex gap-1.5">
                    {solution.recommendedStack.map((item, idx) => (
                      <span key={idx} className="bg-zinc-800 px-2 py-0.5 rounded text-[10px]">
                        {item.replace('Vision', '')}
                      </span>
                    ))}
                  </div>
                  <span className="text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {t.solutionsSection.viewSolution} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => onNavigate('/solutions')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              {t.solutionsSection.exploreAll}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 6 — DEVELOPERS */}
      <section className="py-24 md:py-32 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={t.developersSection.badge}
            title={t.developersSection.title}
            description={t.developersSection.description}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {developerResources.map((res) => (
              <div
                key={res.id}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {res.badge}
                    </span>
                    {res.id === 'github-ecosystem' && <GithubIcon className="w-4 h-4 text-zinc-400" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{res.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">{res.description}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80">
                  {res.isExternal ? (
                    <a
                      href={res.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center justify-between w-full"
                    >
                      <span>{res.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => onNavigate(res.link)}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center justify-between w-full text-left"
                    >
                      <span>{res.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* GitHub Ecosystem Banner */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <GithubIcon className="w-5 h-5 text-white" />
                <h4 className="text-lg font-bold text-white">{t.developersSection.githubBannerTitle}</h4>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl">{t.developersSection.githubBannerDesc}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="https://github.com/simon-shi83/website"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-mono text-xs font-bold transition-colors flex items-center gap-2"
              >
                <GithubIcon className="w-4 h-4" />
                <span>{t.developersSection.starOnGithub}</span>
              </a>
              <button
                onClick={() => onNavigate('/developers')}
                className="px-5 py-2.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 font-mono text-xs font-medium transition-colors"
              >
                {t.developersSection.developerHub}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — RESOURCES */}
      <section className="py-24 md:py-32 bg-zinc-950/80 tech-grid border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={t.resourcesSection.badge}
            title={t.resourcesSection.title}
            description={t.resourcesSection.description}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {articles.slice(0, 3).map((article) => (
              <div
                key={article.id}
                onClick={() => onNavigate('/resources')}
                className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-3">
                    <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                      {article.type}
                    </span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2.5 group-hover:text-emerald-300 transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">{article.summary}</p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>{article.date}</span>
                  <span className="text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {t.resourcesSection.readArticle} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate('/resources')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              {t.resourcesSection.browseAll}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION / ENTERPRISE PILOT BANNER */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {t.ctaBanner.badge}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">{t.ctaBanner.title}</h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto">
            {t.ctaBanner.description}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono">
            <button
              onClick={onOpenContact}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>{t.ctaBanner.requestPackage}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="mailto:contact@visiongo.app"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium transition-all"
            >
              {t.ctaBanner.directEmail}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
