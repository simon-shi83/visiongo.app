import React from 'react';
import { ArrowLeft, ArrowRight, Shield, Cpu, Sliders, Sparkles, Terminal, FileCode2, Package, Layers } from 'lucide-react';
import { getProduct, getProducts } from '../data/products';
import { SeoHead } from '../components/SeoHead';
import { useLanguage } from '../i18n/LanguageContext';

interface ProductPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenContact: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({ slug, onNavigate, onOpenContact }) => {
  const { t, locale } = useLanguage();
  const product = getProduct(slug, locale);
  const allProducts = getProducts(locale);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Workflow':
      case 'Sliders':
        return <Sliders className="w-5 h-5" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5" />;
      case 'Shield':
      case 'ShieldCheck':
        return <Shield className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Package':
        return <Package className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title={`${product.name} — ${product.positioning}`}
        description={`${product.name}: ${product.tagline} ${product.summary}`}
        canonicalPath={`/products/${product.slug}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-xs font-mono text-zinc-500">
          <button
            onClick={() => onNavigate('/')}
            className="hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> {locale === 'zh' ? '首页' : 'Home'}
          </button>
          <span>/</span>
          <button
            onClick={() => onNavigate('/#products')}
            className="hover:text-zinc-300 transition-colors"
          >
            {t.nav.products}
          </button>
          <span>/</span>
          <span className="text-zinc-300">{product.name}</span>
        </div>

        {/* Hero Header */}
        <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 relative overflow-hidden tech-grid mb-12">
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: product.accentColor }}
          />

          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="text-xs font-mono font-bold px-3 py-1 rounded-md uppercase tracking-wider"
                style={{
                  backgroundColor: `${product.accentColor}15`,
                  color: product.accentColor,
                  border: `1px solid ${product.accentColor}30`,
                }}
              >
                {product.shortAction} {t.productsSection.phaseSuffix}
              </span>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded">
                {product.positioning}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              {product.name}
            </h1>

            <p className="text-xl sm:text-2xl font-medium text-zinc-300 font-mono">
              {product.tagline}
            </p>

            <p className="text-base text-zinc-400 leading-relaxed font-normal">
              {product.description}
            </p>

            <div className="pt-4 flex flex-wrap gap-4 text-xs font-mono">
              <button
                onClick={onOpenContact}
                className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold transition-all flex items-center gap-2"
              >
                <span>
                  {locale === 'zh' ? `申请 ${product.name} 试用评估` : `Request ${product.name} Trial`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('/developers#docs')}
                className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-all"
              >
                {locale === 'zh' ? '阅读技术开发者文档' : 'Read Developer Docs'}
              </button>
            </div>
          </div>
        </div>

        {/* Technical Specification Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
              {locale === 'zh' ? '架构职责与定位' : 'Architecture Role'}
            </div>
            <p className="text-sm text-zinc-200 font-medium">{product.architectureRole}</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
              {locale === 'zh' ? '部署硬件与环境' : 'Deployment Target'}
            </div>
            <p className="text-sm text-zinc-200 font-medium">{product.deploymentTarget}</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
              {locale === 'zh' ? '网络与连通性要求' : 'Network & Connectivity'}
            </div>
            <p className="text-sm text-emerald-400 font-medium font-mono">
              {product.connectivityRequirement}
            </p>
          </div>
        </div>

        {/* Key Capabilities */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <span>{locale === 'zh' ? '关键特性与工程能力' : 'Key Capabilities & Engineering Features'}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.keyCapabilities.map((cap, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: `${product.accentColor}15`,
                    color: product.accentColor,
                    border: `1px solid ${product.accentColor}30`,
                  }}
                >
                  {getIcon(cap.icon)}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{cap.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Code or Configuration Block */}
        {product.sampleCodeOrConfig && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-emerald-400" />
              <span>
                {locale === 'zh' ? '配置清单与技术规格蓝图' : 'Specification & Configuration Blueprint'}
              </span>
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              {locale === 'zh'
                ? '声明式配方样例，演示系统互操作性与强类型 SDK 契约规范。'
                : 'Sample declarative manifest demonstrating interoperability and schema contracts.'}
            </p>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
              <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between font-mono text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  {product.sampleCodeOrConfig.filename}
                </span>
                <span className="uppercase text-[10px] text-zinc-500">
                  {product.sampleCodeOrConfig.language}
                </span>
              </div>
              <pre className="p-6 text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed">
                <code>{product.sampleCodeOrConfig.code}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Bottom Navigation between Products */}
        <div className="border-t border-zinc-800 pt-10 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => onNavigate('/')}
            className="text-xs font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />{' '}
            {locale === 'zh' ? '返回系统全局概览' : 'Back to Platform Overview'}
          </button>

          <div className="flex items-center gap-3">
            {allProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate(`/products/${p.slug}`)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  p.slug === product.slug
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
