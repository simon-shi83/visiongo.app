import React, { useState } from 'react';
import { ArrowLeft, Clock, Tag, User } from 'lucide-react';
import { getResourceArticles } from '../data/resources';
import { ResourceArticle } from '../types';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';
import { useLanguage } from '../i18n/LanguageContext';

export const ResourcesPage: React.FC = () => {
  const { t, locale } = useLanguage();
  const articles = getResourceArticles(locale);

  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [activeArticle, setActiveArticle] = useState<ResourceArticle | null>(null);

  const categories = [
    { key: 'All', label: t.resourcesSection.filterAll },
    { key: 'Article', label: locale === 'zh' ? '深度文章' : 'Article' },
    { key: 'Tutorial', label: locale === 'zh' ? '开发教程' : 'Tutorial' },
    { key: 'Case Study', label: locale === 'zh' ? '实战案例' : 'Case Study' },
    { key: 'Release Note', label: locale === 'zh' ? '发版说明' : 'Release Note' },
  ];

  const filteredArticles =
    selectedFilter === 'All'
      ? articles
      : articles.filter((a) => a.type === selectedFilter);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title={t.nav.resources}
        description={
          locale === 'zh'
            ? '探讨零拷贝内存优化、工厂无网离线机器学习架构以及 24/7 高可用机器视觉系统的工程实现。'
            : 'Explore in-depth technical articles, tutorials, industrial case studies, and software release notes.'
        }
        canonicalPath="/resources"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeArticle ? (
          /* Article Reader Mode */
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setActiveArticle(null)}
              className="mb-8 inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t.resourcesSection.backToResources}
            </button>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                  {activeArticle.type}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {activeArticle.readTime}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">{activeArticle.date}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {activeArticle.title}
              </h1>

              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono pt-2 border-b border-zinc-800 pb-4">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>{activeArticle.author}</span>
              </div>
            </div>

            <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-relaxed space-y-6 text-sm sm:text-base font-normal">
              {activeArticle.contentMarkdown ? (
                activeArticle.contentMarkdown.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2
                        key={idx}
                        className="text-2xl font-bold text-white mt-8 mb-4 border-b border-zinc-800 pb-2"
                      >
                        {paragraph.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (paragraph.startsWith('# ')) {
                    return null;
                  }
                  if (paragraph.startsWith('---')) {
                    return <hr key={idx} className="border-zinc-800 my-6" />;
                  }
                  return (
                    <p key={idx} className="leading-relaxed">
                      {paragraph.replace(/\\/g, '')}
                    </p>
                  );
                })
              ) : (
                <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
                  <p className="text-zinc-400 text-sm">
                    {locale === 'zh'
                      ? '该资源作为企业级实战参考手册与白皮书提供。'
                      : 'This resource is available as an enterprise technical whitepaper and reference manual.'}
                  </p>
                  <a
                    href="mailto:contact@visiongo.app"
                    className="inline-block px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold"
                  >
                    {t.resourcesSection.requestPdf}
                  </a>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mt-12 pt-6 border-t border-zinc-800 flex flex-wrap gap-2">
              {activeArticle.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400"
                >
                  <Tag className="w-3 h-3 text-zinc-500" /> {tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* Resource List Mode */
          <>
            <SectionHeader
              badge={t.resourcesSection.badge}
              title={t.resourcesSection.title}
              description={t.resourcesSection.description}
            />

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedFilter(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono transition-all ${
                    selectedFilter === cat.key
                      ? 'bg-white text-zinc-950 font-bold shadow'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setActiveArticle(article)}
                  className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-3">
                      <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
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
                      {t.resourcesSection.readArticle} &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
