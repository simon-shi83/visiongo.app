import React, { useState } from 'react';
import { Terminal, Check, Copy } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';
import { getDeveloperResources, getArchitectureNote } from '../data/developerResources';
import { useLanguage } from '../i18n/LanguageContext';

export const DevelopersPage: React.FC = () => {
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<'cpp' | 'python' | 'schema'>('cpp');
  const [copied, setCopied] = useState(false);

  const developerResources = getDeveloperResources(locale);
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title={t.nav.developers}
        description={
          locale === 'zh'
            ? '工业视觉开发者资源：统一 C++ 与 Python SDK 契约头文件、现场总线 API 与开源社区生态。'
            : 'Comprehensive developer resources, C++ and Python SDK bindings, protocol schemas, and GitHub ecosystem.'
        }
        canonicalPath="/developers"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={t.developersSection.badge}
          title={t.developersSection.title}
          description={t.developersSection.description}
        />

        {/* Technical Architecture Quote Box */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono mb-12 flex items-start gap-3">
          <Terminal className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-zinc-200 font-bold text-sm">
              {archNote.headline}
            </div>
            <p className="text-zinc-300">
              &ldquo;{archNote.text}&rdquo;
            </p>
            <p className="text-zinc-400">
              {archNote.subtext}
            </p>
          </div>
        </div>

        {/* Developer Pillars */}
        <div id="docs" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {developerResources.slice(0, 3).map((res) => (
            <div key={res.id} className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 mb-3 inline-block">
                {res.badge}
              </span>
              <h3 className="text-lg font-bold text-white mb-2">{res.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">{res.description}</p>
              <span className="text-xs font-mono text-emerald-400">{res.actionText} &rarr;</span>
            </div>
          ))}
        </div>

        {/* Code Snippet Interactive Viewer */}
        <div id="api" className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl mb-16">
          <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('cpp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeTab === 'cpp'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.developersSection.tabCpp}
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeTab === 'python'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.developersSection.tabPython}
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.developersSection.copied : t.developersSection.copyCode}</span>
            </button>
          </div>

          <pre className="p-6 text-xs sm:text-sm text-zinc-300 font-mono overflow-x-auto leading-relaxed bg-zinc-950">
            <code>{codeSnippets[activeTab]}</code>
          </pre>
        </div>

        {/* GitHub Community Banner */}
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
          </div>
        </div>
      </div>
    </div>
  );
};
