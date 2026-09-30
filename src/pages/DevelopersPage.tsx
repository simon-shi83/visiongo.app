import React, { useState } from 'react';
import { Terminal, BookOpen, Layers, Check, Copy } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';
import { ARCHITECTURE_TECHNICAL_NOTE } from '../data/developerResources';

export const DevelopersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cpp' | 'python' | 'schema'>('cpp');
  const [copied, setCopied] = useState(false);

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
        title="Developers & SDK"
        description="Comprehensive developer resources, C++ and Python SDK bindings, protocol schemas, and GitHub ecosystem."
        canonicalPath="/developers"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Developer Hub"
          title="Open Architecture & Developer Ecosystem"
          description="Built on strict SDK isolation, standardized schemas, and vendor-neutral camera protocols."
        />

        {/* Technical Architecture Quote Box */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono mb-12 flex items-start gap-3">
          <Terminal className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-zinc-200 font-bold text-sm">
              {ARCHITECTURE_TECHNICAL_NOTE.headline}
            </div>
            <p className="text-zinc-400">
              &ldquo;{ARCHITECTURE_TECHNICAL_NOTE.text}&rdquo;
            </p>
            <p className="text-zinc-400">
              {ARCHITECTURE_TECHNICAL_NOTE.subtext}
            </p>
          </div>
        </div>

        {/* Developer Pillars */}
        <div id="docs" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Core Documentation</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Detailed architectural specs for real-time thread affinity, memory-mapped shared
              buffers, and OPC UA / Modbus fieldbus configuration.
            </p>
            <span className="text-xs font-mono text-emerald-400">Deterministic Engine Spec &rarr;</span>
          </div>

          <div id="sdk" className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Standardized SDK</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Single-source-of-truth C++ and Python bindings. Zero tight coupling between
              subsystems; all modules talk through verified protocol contracts.
            </p>
            <span className="text-xs font-mono text-cyan-400">SDK v2.4.0 Schemas &rarr;</span>
          </div>

          <div className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 text-white flex items-center justify-center mb-4 border border-zinc-700">
              <GithubIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">GitHub Open Hub</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Open source adapters, hardware drivers for IDS, Basler, FLIR, and Hikrobot cameras,
              and community inspection recipe repositories.
            </p>
            <a
              href="https://github.com/simon-shi83/website"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1"
            >
              github.com/simon-shi83/website &rarr;
            </a>
          </div>
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
                C++20 Runtime Node
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeTab === 'python'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Python Edge Agent
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeTab === 'schema'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                SDK Schema Contract
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-6 text-xs sm:text-sm text-zinc-300 font-mono overflow-x-auto leading-relaxed bg-zinc-950">
            <code>{codeSnippets[activeTab]}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
