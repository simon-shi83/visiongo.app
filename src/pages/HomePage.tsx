import React from 'react';
import { ArrowRight, Cpu, ShieldCheck, Zap, Layers, Lock, Terminal, Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { PRODUCT_LIST } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { TerminalDemo } from '../components/TerminalDemo';
import { SectionHeader } from '../components/SectionHeader';
import { SOLUTIONS } from '../data/solutions';
import { DEVELOPER_RESOURCES, ARCHITECTURE_TECHNICAL_NOTE } from '../data/developerResources';
import { RESOURCE_ARTICLES } from '../data/resources';
import { SeoHead } from '../components/SeoHead';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenContact: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenContact }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <SeoHead
        title="Industrial Vision Intelligence"
        description="Build, run, and improve industrial vision systems with AI using VisionStudio, VisionRuntime, VisionEdge, and VisionCloud."
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
              <span className="text-zinc-400">Industrial Vision Intelligence</span>
            </div>

            {/* Main H1 */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
              Build, run, and improve{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                industrial vision systems
              </span>{' '}
              with AI.
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed font-normal max-w-2xl mx-auto">
              VISIONGO provides an integrated software platform for engineering, deploying,
              operating, and improving industrial vision systems.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono">
              <a
                href="#products"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold tracking-wide transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#architecture"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-semibold tracking-wide transition-all flex items-center justify-center gap-2"
              >
                <span>View Architecture</span>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </a>
            </div>

            {/* Key Engineering Indicators */}
            <div className="pt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-zinc-500 border-t border-zinc-900/80">
              <span className="flex items-center gap-2 text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Air-gapped factory execution
              </span>
              <span className="flex items-center gap-2 text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Sub-millisecond determinism
              </span>
              <span className="flex items-center gap-2 text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero cloud dependency
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
            badge="Product System"
            title="Four Focused Software Products. One Unified Architecture."
            description="VISIONGO unifies the complete machine vision lifecycle—from engineering workstation design to high-throughput production lines, on-site edge intelligence, and optional cloud analytics."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRODUCT_LIST.map((product) => (
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
            badge="System Architecture"
            title="How They Work Together"
            description="Engineering design in VisionStudio. Hard real-time execution in VisionRuntime. Autonomous edge diagnostics in VisionEdge. Optional cloud insights in VisionCloud."
          />

          <ArchitectureDiagram onNavigateProduct={(slug) => onNavigate(`/products/${slug}`)} />

          {/* Architecture Technical Note */}
          <div className="mt-8 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs font-mono text-zinc-400 max-w-4xl mx-auto flex items-start gap-3">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-200 font-semibold">{ARCHITECTURE_TECHNICAL_NOTE.headline}: </span>
              <span>{ARCHITECTURE_TECHNICAL_NOTE.text} </span>
              <span className="text-zinc-500">{ARCHITECTURE_TECHNICAL_NOTE.subtext}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHY VISIONGO */}
      <section className="py-24 md:py-32 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Industrial Advantages"
            title="Why Industrial Engineers Choose VISIONGO"
            description="Purpose-built for operational technology (OT), uncompromising determinism, and data sovereignty."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI-Assisted Engineering</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Accelerate recipe creation and multi-camera calibration with interactive visual workflows,
                hardware simulators, and synthetic defect augmentation in VisionStudio.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">On-Site Intelligence</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Local neural arbitration by VisionEdge eliminates up to 85% of false-reject line stops.
                Compensate for illumination shifts and mechanical drift in closed loop.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Production-Grade Runtime</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Engineered in modern C++ with zero-copy shared memory, core affinity thread pinning,
                and sub-millisecond determinism capable of running 24/7 at up to 120 FPS.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cloud-Optional Architecture</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Factory lines continue uninterrupted even if WAN connectivity is severed. Cloud is an
                optional asynchronous enhancement, never a single point of failure.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center mb-5">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Designed for Industrial Environments</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Deploy on standard industrial PCs, fanless edge appliances, or rackmount servers.
                Built-in hardware watchdogs, process isolation, and automated fail-safe rollback.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Open Integration Capability</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Avoid proprietary lock-in. Direct protocol connectivity with GenICam, GigE Vision,
                USB3, Modbus TCP, OPC UA, EtherCAT, and open C++/Python SDK bindings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — SOLUTIONS */}
      <section className="py-24 md:py-32 bg-zinc-950/80 tech-grid border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Applications"
            title="Engineered for Demanding Inspection Tasks"
            description="From high-speed surface defect detection to automated optical inspection and DPM code reading."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SOLUTIONS.map((solution) => (
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
                    View Solution <ChevronRight className="w-3.5 h-3.5" />
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
              Explore All Industrial Solutions
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 6 — DEVELOPERS */}
      <section className="py-24 md:py-32 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Developer Ecosystem"
            title="Built by Engineers, for Engineers"
            description="Extensible architecture with standardized SDK protocols, verified schemas, and open community drivers."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {DEVELOPER_RESOURCES.map((res) => (
              <div
                key={res.id}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {res.badge}
                    </span>
                    {res.id === 'github-ecosystem' && (
                      <GithubIcon className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{res.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    {res.description}
                  </p>
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
                <h4 className="text-lg font-bold text-white">Join the VISIONGO Developer Ecosystem</h4>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl">
                Contribute custom inspection operators, share industrial camera drivers, and interact directly
                with core systems engineers on GitHub.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="https://github.com/simon-shi83/website"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-mono text-xs font-bold transition-colors flex items-center gap-2"
              >
                <GithubIcon className="w-4 h-4" />
                <span>Star on GitHub</span>
              </a>
              <button
                onClick={() => onNavigate('/developers')}
                className="px-5 py-2.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 font-mono text-xs font-medium transition-colors"
              >
                Developer Hub
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — RESOURCES */}
      <section className="py-24 md:py-32 bg-zinc-950/80 tech-grid border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Engineering Insights"
            title="Technical Resources & Architecture Notes"
            description="In-depth analysis of zero-copy buffers, air-gapped machine learning, and high-uptime industrial software engineering."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {RESOURCE_ARTICLES.slice(0, 3).map((article) => (
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
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    {article.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>{article.date}</span>
                  <span className="text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read Article <ChevronRight className="w-3.5 h-3.5" />
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
              Browse All Tutorials & Case Studies
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION / ENTERPRISE PILOT BANNER */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Deploy on Your Production Line
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Ready to upgrade your industrial vision systems?
          </h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto">
            Experience sub-millisecond determinism, air-gapped on-site AI, and intuitive visual
            pipeline engineering. Request an evaluation license or schedule an architecture consultation.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono">
            <button
              onClick={onOpenContact}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>Request Evaluation Package</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="mailto:contact@visiongo.app"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium transition-all"
            >
              Direct: contact@visiongo.app
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
