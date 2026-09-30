import React, { useState } from 'react';
import {
  Terminal,
  Check,
  Copy,
  Download,
  BookOpen,
  Code2,
  FileCode,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';
import { getArchitectureNote } from '../data/developerResources';
import { useLanguage } from '../i18n/LanguageContext';

interface DevelopersPageProps {
  onNavigate?: (path: string) => void;
}

export const DevelopersPage: React.FC<DevelopersPageProps> = ({ onNavigate }) => {
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<'cpp' | 'python' | 'schema'>('cpp');
  const [copied, setCopied] = useState(false);

  const archNote = getArchitectureNote(locale);

  const codeSnippets = {
    cpp: `// Example: VisionRuntime Custom Inspection Node (C++20)
#include <visiongo/sdk/pipeline.hpp>
#include <visiongo/sdk/framebuffer.hpp>

class SurfaceAnomalyFilter : public visiongo::sdk::PipelineNode {
public:
    visiongo::sdk::ExecutionStatus Process(
        const visiongo::sdk::SharedFrameBuffer& input_frame,
        visiongo::sdk::InspectionResult& result) override {
        
        // Zero-copy direct memory access
        const uint8_t* raw_pixels = input_frame.GetDevicePointer();
        const auto dims = input_frame.GetDimensions();

        // Deterministic sub-millisecond execution
        bool defect_found = EvaluateContoursSIMD(raw_pixels, dims.width, dims.height);
        
        result.has_anomaly = defect_found;
        result.processing_time_us = 420; // 0.42ms
        return visiongo::sdk::ExecutionStatus::SUCCESS;
    }
};`,
    python: `# Example: VisionEdge On-site Neural Verification Agent (Python 3.10+)
import visiongo.sdk.contracts as contracts
from visiongo.edge import EdgeSupervisor

class LocalDriftMonitor(EdgeSupervisor):
    def on_frame_candidate(self, event: contracts.AnomalyCandidateEvent) -> contracts.Decision:
        # 100% Offline execution on local plant hardware
        confidence = self.local_tensorrt_engine.verify(event.roi_tensor)
        
        if confidence > 0.95:
            # Signal hard real-time reject gate to PLC
            return contracts.Decision(action="TRIGGER_REJECT", code=40012)
        elif self.detect_lighting_drift(event):
            # Compensate exposure dynamically in closed loop
            self.runtime_client.adjust_parameter("exposure_us", delta=50)
            
        return contracts.Decision(action="PASS")`,
    schema: `// Example: Standardized SDK Protocol Contract (Single Source of Truth)
{
  "$schema": "https://visiongo.app/schemas/v1/inspection_contract.json",
  "contract_version": "1.4.0",
  "pipeline_definition": {
    "subsystem_topology": {
      "authoring": "VisionStudio",
      "execution": "VisionRuntime",
      "local_intelligence": "VisionEdge",
      "cloud_aggregation": "VisionCloud"
    },
    "zero_copy_shm_key": "/dev/shm/vg_frames_0",
    "jitter_tolerance_microseconds": 250,
    "air_gapped_enforcement": true
  }
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Developer Entry Points
  const developerHubEntries = [
    {
      id: 'docs',
      title: locale === 'zh' ? '系统架构与开发文档' : 'Documentation',
      badge: locale === 'zh' ? '文档核心' : 'Core Docs',
      desc:
        locale === 'zh'
          ? '阅读底层系统隔离架构、微秒级任务调度模型、IPC 零拷贝规范与工业网络协议指南。'
          : 'Read low-level subsystem isolation guidelines, microsecond scheduling models, and zero-copy shared memory contracts.',
      icon: BookOpen,
      action: locale === 'zh' ? '查阅架构文档' : 'Read Docs',
      isComingSoon: false,
      onClick: () => {
        const el = document.getElementById('arch-principles');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'downloads',
      title: locale === 'zh' ? '官方发行包与运行环境' : 'Downloads & Binaries',
      badge: locale === 'zh' ? '安装包' : 'Official Builds',
      desc:
        locale === 'zh'
          ? '下载适用于 Windows x64 与 Ubuntu Linux x86_64 / arm64 的 VisionStudio、VisionRuntime 及 VisionEdge 离线包。'
          : 'Download certified releases for VisionStudio, VisionRuntime, and VisionEdge. 100% air-gapped ready.',
      icon: Download,
      action: locale === 'zh' ? '前往下载中心' : 'Go to Downloads',
      isComingSoon: false,
      onClick: () => onNavigate?.('/downloads'),
    },
    {
      id: 'github',
      title: 'GitHub Developer Channel',
      badge: 'SDK & Community',
      desc:
        locale === 'zh'
          ? '参与 SDK 接口讨论、提交工控协议 Issue、查阅版本 Release 与开放 Schema 协议源码。'
          : 'Participate in SDK bindings, protocol schemas, issues, bug reports, discussions, and public release notes.',
      icon: GithubIcon,
      action: 'GitHub Repository',
      isExternal: true,
      href: 'https://github.com/simon-shi83/website',
      isComingSoon: false,
    },
    {
      id: 'sdk',
      title: locale === 'zh' ? '标准化 SDK 绑定' : 'Standardized SDK',
      badge: 'C++20 & Python',
      desc:
        locale === 'zh'
          ? '包含统一 C++20 头文件库与 Python 3.10+ 高性能绑定的预编译 wheel 与 cmake find_package 包。'
          : 'Unified C++20 zero-copy headers and high-performance Python 3.10+ bindings for custom inspection nodes.',
      icon: Code2,
      action: locale === 'zh' ? '查看代码示例' : 'View Code Snippets',
      isComingSoon: false,
      onClick: () => {
        const el = document.getElementById('code-viewer');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'examples',
      title: locale === 'zh' ? '检测配方与算子样例' : 'Examples & Inspection Recipes',
      badge: locale === 'zh' ? '配方模板' : 'Recipes',
      desc:
        locale === 'zh'
          ? '晶圆对准、锂电极片缺陷过滤、条形码快速识别等官方标定工程文件与流水线配置模板。'
          : 'Production-ready recipe templates for wafer alignment, battery pouch inspection, and high-speed DPM decoding.',
      icon: FileCode,
      action: locale === 'zh' ? '开发样例库' : 'Recipe Templates',
      isComingSoon: true, // Clearly marked as Coming Soon per prompt requirement!
    },
    {
      id: 'releases',
      title: locale === 'zh' ? '发版日志与升级说明' : 'Release Notes & Changelog',
      badge: locale === 'zh' ? '发版追踪' : 'Changelog',
      desc:
        locale === 'zh'
          ? '追踪各模块最新稳定版的性能提升、API 兼容性变更与工控机驱动升级建议。'
          : 'Track sub-millisecond benchmark updates, breaking protocol changes, and IPC driver advisories.',
      icon: FileText,
      action: locale === 'zh' ? '浏览发版日志' : 'View Release Notes',
      isComingSoon: false,
      onClick: () => onNavigate?.('/downloads'),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title={locale === 'zh' ? '开发者中心与 SDK — VISIONGO' : 'Developers & SDK — VISIONGO'}
        description={
          locale === 'zh'
            ? '工业视觉开发者资源：统一 C++20 与 Python SDK 契约头文件、现场总线 API、GitHub 协作通道与官方安装包下载。'
            : 'Developer documentation, C++20 and Python SDK bindings, verified protocol schemas, GitHub collaboration channel, and binary downloads.'
        }
        canonicalPath="/developers"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          as="h1"
          badge={t.developersSection.badge}
          title={t.developersSection.title}
          description={t.developersSection.description}
        />

        {/* 6 Developer Entry Points Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {developerHubEntries.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="relative rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-6 flex flex-col justify-between hover:border-zinc-700/80 transition-all tech-grid group shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    {item.isComingSoon ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {locale === 'zh' ? '准备中' : 'Coming Soon'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-sans mb-1.5">{item.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                <div className="pt-5 border-t border-zinc-800/60 mt-4">
                  {item.isComingSoon ? (
                    <span className="text-xs font-mono text-zinc-500 italic">
                      {locale === 'zh' ? '// 正在进行产线回归测试' : '// Under validation testing'}
                    </span>
                  ) : item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{item.action}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={item.onClick}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{item.action}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Architecture Quote Box */}
        <div
          id="arch-principles"
          className="max-w-6xl mx-auto p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono mb-16 flex items-start gap-3"
        >
          <Terminal className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="text-zinc-200 font-bold text-sm">
              {archNote.headline}
            </div>
            <p className="text-zinc-300 leading-relaxed">
              &ldquo;{archNote.text}&rdquo;
            </p>
            <p className="text-zinc-400 leading-relaxed">
              {archNote.subtext}
            </p>
          </div>
        </div>

        {/* Code Snippet Interactive Viewer */}
        <div
          id="code-viewer"
          className="max-w-6xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl mb-16"
        >
          <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('cpp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'cpp'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.developersSection.tabCpp}
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'python'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.developersSection.tabPython}
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'schema'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.developersSection.tabSchema}
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.developersSection.copied : t.developersSection.copyCode}</span>
            </button>
          </div>

          <pre className="p-6 text-xs sm:text-sm text-zinc-300 font-mono overflow-x-auto leading-relaxed bg-zinc-950">
            <code>{codeSnippets[activeTab]}</code>
          </pre>
        </div>

        {/* GitHub Community Banner with clear boundaries */}
        <div className="max-w-6xl mx-auto p-8 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <GithubIcon className="w-5 h-5 text-white" />
              <h4 className="text-lg font-bold text-white">
                {locale === 'zh' ? 'GitHub 开发者协作通道' : 'GitHub Developer Collaboration'}
              </h4>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              {locale === 'zh'
                ? '官方 GitHub 仓库用于公开 SDK、契约 schemas、技术 issue 跟踪与发版说明。VISIONGO 核心商业执行核心为企业私有代码库，确保工业客户自主可控。'
                : 'Our GitHub channel hosts standardized SDK bindings, schemas, issue tracking, and release notes. Core execution runtimes are enterprise-licensed private repositories.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://github.com/simon-shi83/website"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-mono text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <GithubIcon className="w-4 h-4" />
              <span>{locale === 'zh' ? '访问 GitHub 仓库' : 'Visit GitHub Channel'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
