import React, { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpDown, Shield, Cpu, Sparkles, Sliders, CheckCircle2, Lock } from 'lucide-react';
import { PRODUCTS } from '../data/products';

interface ArchitectureDiagramProps {
  onNavigateProduct: (slug: string) => void;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ onNavigateProduct }) => {
  const [activeNode, setActiveNode] = useState<string>('runtime');

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-10 tech-grid relative overflow-hidden">
      {/* Background glow overlay */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Air-Gapped / Resilience Core Statement */}
      <div className="mb-8 p-4 rounded-xl bg-zinc-900/90 border border-zinc-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Industrial Independence Guarantee</span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                AIR-GAPPED READY
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Core industrial operation does not depend on the cloud. Designed for real industrial
              environments, including plant floors without Internet access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-zinc-400 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800">
          <Lock className="w-3.5 h-3.5 text-zinc-400" />
          Zero External Telemetry Needed
        </div>
      </div>

      {/* Diagram Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Visual Workflow Canvas */}
        <div className="lg:col-span-8 space-y-6">
          {/* Level 1: Engineering Workspace (Studio) */}
          <div className="relative">
            <div
              onClick={() => {
                setActiveNode('studio');
                onNavigateProduct('visionstudio');
              }}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                activeNode === 'studio'
                  ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-950/30'
                  : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">VisionStudio</span>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                        Build
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Engineering design, algorithm testing, workflow builder, hardware simulator
                    </p>
                  </div>
                </div>
                <div className="text-xs font-mono text-cyan-400 hidden sm:block">
                  Recipe & Pipeline Bundles →
                </div>
              </div>
            </div>

            {/* Connecting Flow Indicator */}
            <div className="flex justify-center my-3 text-zinc-600">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compiled Recipe Export (SDK Schemas)</span>
              </div>
            </div>
          </div>

          {/* Level 2: Factory Floor Core (Runtime & Edge) */}
          <div className="border border-emerald-500/30 rounded-2xl p-5 bg-emerald-950/10 relative">
            <div className="absolute -top-3 left-6 px-2.5 py-0.5 bg-zinc-900 text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/30 rounded">
              Factory Floor Boundary (100% Offline Capable)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center pt-2">
              {/* VisionRuntime Card */}
              <div
                onClick={() => {
                  setActiveNode('runtime');
                  onNavigateProduct('visionruntime');
                }}
                className={`md:col-span-5 p-5 rounded-xl border transition-all cursor-pointer ${
                  activeNode === 'runtime'
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-950/40'
                    : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">VisionRuntime</span>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Run
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400">Production Execution</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                  Image acquisition, deterministic pipeline, zero-copy framebuffer, Modbus/OPC UA fieldbus.
                </p>
                <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Sub-millisecond hard real-time
                </div>
              </div>

              {/* Bidirectional Local Edge Loop */}
              <div className="md:col-span-1 flex flex-col items-center justify-center text-zinc-500 py-2">
                <ArrowUpDown className="w-5 h-5 text-violet-400 rotate-90 md:rotate-0" />
                <span className="text-[9px] font-mono text-zinc-400 mt-1 uppercase tracking-tight text-center">
                  Local Loop
                </span>
              </div>

              {/* VisionEdge Card */}
              <div
                onClick={() => {
                  setActiveNode('edge');
                  onNavigateProduct('visionedge');
                }}
                className={`md:col-span-5 p-5 rounded-xl border transition-all cursor-pointer ${
                  activeNode === 'edge'
                    ? 'border-violet-500 bg-violet-950/30 shadow-lg shadow-violet-950/40'
                    : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">VisionEdge</span>
                      <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                        Assist
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400">On-site Intelligence</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                  Autonomous anomaly verification, parameter drift compensation, instant fail-safe rollback.
                </p>
                <div className="text-[10px] font-mono text-violet-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% Offline local intelligence
                </div>
              </div>
            </div>
          </div>

          {/* Level 3: Optional Cloud Intelligence (Cloud) */}
          <div className="relative pt-1">
            <div className="flex justify-center mb-3 text-zinc-600">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/80 px-3 py-1 rounded-full border border-dashed border-zinc-700">
                <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Optional Cloud Telemetry & Asynchronous Sync</span>
              </div>
            </div>

            <div
              onClick={() => {
                setActiveNode('cloud');
                onNavigateProduct('visioncloud');
              }}
              className={`p-5 rounded-xl border border-dashed transition-all cursor-pointer ${
                activeNode === 'cloud'
                  ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-950/30'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">VisionCloud</span>
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        Extend
                      </span>
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                        OPTIONAL LAYER
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Cloud LLMs, cross-factory defect clustering, fleet yield benchmarking, model repository
                    </p>
                  </div>
                </div>
                <div className="text-xs font-mono text-amber-400/80 hidden sm:block">
                  Enterprise Aggregation
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Node Deep Dive Sidebar */}
        <div className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 self-stretch flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase font-mono tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Architecture Spec</span>
              <span className="text-emerald-400">Node Active</span>
            </div>

            {activeNode === 'studio' && (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-white">{PRODUCTS.visionstudio.name}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {PRODUCTS.visionstudio.description}
                </p>
                <div className="space-y-1.5 text-xs font-mono pt-3 border-t border-zinc-800 text-zinc-400">
                  <p><span className="text-zinc-500">Target:</span> Workstation / PC</p>
                  <p><span className="text-zinc-500">Output:</span> Compiled Recipe Bundle</p>
                  <p><span className="text-zinc-500">Role:</span> Engineering & Authoring</p>
                </div>
              </div>
            )}

            {activeNode === 'runtime' && (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-white">{PRODUCTS.visionruntime.name}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {PRODUCTS.visionruntime.description}
                </p>
                <div className="space-y-1.5 text-xs font-mono pt-3 border-t border-zinc-800 text-zinc-400">
                  <p><span className="text-zinc-500">Execution:</span> 24/7 Factory Industrial PC</p>
                  <p><span className="text-zinc-500">Latency:</span> Sub-millisecond Deterministic</p>
                  <p><span className="text-zinc-500">Fieldbus:</span> Modbus, OPC UA, EtherCAT</p>
                </div>
              </div>
            )}

            {activeNode === 'edge' && (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-white">{PRODUCTS.visionedge.name}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {PRODUCTS.visionedge.description}
                </p>
                <div className="space-y-1.5 text-xs font-mono pt-3 border-t border-zinc-800 text-zinc-400">
                  <p><span className="text-zinc-500">Connectivity:</span> 100% Offline / Air-Gapped</p>
                  <p><span className="text-zinc-500">Intelligence:</span> Neural Verification & Anomaly</p>
                  <p><span className="text-zinc-500">Safety:</span> Auto Rollback on Deviation</p>
                </div>
              </div>
            )}

            {activeNode === 'cloud' && (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-white">{PRODUCTS.visioncloud.name}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {PRODUCTS.visioncloud.description}
                </p>
                <div className="space-y-1.5 text-xs font-mono pt-3 border-t border-zinc-800 text-zinc-400">
                  <p><span className="text-zinc-500">Topology:</span> Multi-tenant Cloud Services</p>
                  <p><span className="text-zinc-500">Requirement:</span> Optional (Non-blocking)</p>
                  <p><span className="text-zinc-500">Function:</span> LLM Reasoning & Fleet Analytics</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-zinc-800/80">
            <button
              onClick={() => onNavigateProduct(PRODUCTS[activeNode === 'runtime' ? 'visionruntime' : activeNode === 'studio' ? 'visionstudio' : activeNode === 'edge' ? 'visionedge' : 'visioncloud'].slug)}
              className="w-full py-2 px-3 rounded-lg text-xs font-mono font-medium bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Product Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
