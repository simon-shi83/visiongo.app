import React from 'react';
import { ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import { getSolutions } from '../data/solutions';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';
import { useLanguage } from '../i18n/LanguageContext';

interface SolutionsPageProps {
  onNavigate: (path: string) => void;
  onOpenContact: () => void;
}

export const SolutionsPage: React.FC<SolutionsPageProps> = ({ onNavigate, onOpenContact }) => {
  const { t, locale } = useLanguage();
  const solutions = getSolutions(locale);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title={t.nav.solutions}
        description={
          locale === 'zh'
            ? '面向高精密离散制造的高性能工业视觉检测、字符验证与自适应控制解决方案。'
            : 'Engineered solutions for surface defect detection, OCR reading, PCB inspection, and industrial AI assistance.'
        }
        canonicalPath="/solutions"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={t.solutionsSection.badge}
          title={
            locale === 'zh'
              ? '开箱即用的工业机器视觉解决方案'
              : 'Turnkey Industrial Vision Implementations'
          }
          description={
            locale === 'zh'
              ? '攻克离散制造业微缺陷识别、严苛曲面 DPM 字符识读与设备参数自愈补偿难题。'
              : 'Addressing challenging discrete manufacturing defect detection, barcode/OCR readability, and autonomous parameter tuning.'
          }
        />

        <div className="space-y-12">
          {solutions.map((sol, index) => (
            <div
              key={sol.id}
              className="p-8 sm:p-10 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      0{index + 1} // {sol.industry}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {sol.title}
                  </h3>

                  <p className="text-base text-zinc-300 leading-relaxed">
                    {sol.fullDescription}
                  </p>

                  <div className="pt-2">
                    <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                      {t.solutionsSection.recommendedStack}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sol.recommendedStack.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => onNavigate(`/products/${item.toLowerCase()}`)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold border-b border-zinc-800/80 pb-3">
                    {t.solutionsSection.performanceMetrics}
                  </div>

                  <ul className="space-y-3">
                    {sol.keyBenefits.map((benefit, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-zinc-800">
                    <button
                      onClick={onOpenContact}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-mono font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <span>
                        {t.solutionsSection.inquireAbout} {sol.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
