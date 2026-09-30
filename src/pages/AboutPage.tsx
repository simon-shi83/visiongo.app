import React from 'react';
import { Mail, Shield, Terminal, ArrowRight } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';

interface AboutPageProps {
  onOpenContact: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenContact }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title="About VISIONGO"
        description="Learn about VISIONGO's mission to build, run, and improve industrial vision systems with AI."
        canonicalPath="/about"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Company & Mission"
          title="Engineering the Future of Industrial Vision Intelligence"
          description="A product-first software organization dedicated to deterministic factory automation and air-gapped machine intelligence."
        />

        {/* Core Mission Statement Box */}
        <div className="max-w-4xl mx-auto mb-16 p-8 sm:p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 tech-grid text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Brand Core Statement
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            &ldquo;Build, run, and improve industrial vision systems with AI.&rdquo;
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            VISIONGO was founded on a simple realization: while artificial intelligence has
            transformed the web and enterprise software, industrial shop floors remain burdened with
            brittle, hard-to-maintain, closed vision software that takes weeks to configure and breaks
            upon minor environmental variations.
          </p>
        </div>

        {/* Engineering Principles */}
        <div className="max-w-5xl mx-auto mb-20">
          <h3 className="text-xl font-bold text-white mb-8 text-center font-mono">
            // Core Engineering Principles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">1. Respect Physical Reality</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Factories operate under strict physical laws: microsecond conveyor latencies, high vibration,
                and zero tolerance for random crashes. We design for determinism first.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">2. Air-Gapped Autonomy</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Critical manufacturing facilities are strictly air-gapped. Our runtime and edge intelligence
                never assume an active WAN uplink or external license heartbeat to function.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">3. Zero Proprietary Lock-In</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                All communications adhere to open protocols (GenICam, OPC UA, Modbus, open C++ SDK schemas).
                Industrial developers maintain total ownership of their inspection recipes and datasets.
              </p>
            </div>
          </div>
        </div>

        {/* Global Contacts & Enterprise Pilot */}
        <div className="max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white">Get in Touch with our Systems Architects</h3>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              Whether you are an OEM machine builder, an automation system integrator, or an enterprise
              manufacturer seeking to standardize machine vision pipelines.
            </p>
            <div className="pt-2 flex flex-col gap-1 text-xs font-mono text-zinc-400">
              <span className="text-zinc-300">Target Domain: https://visiongo.app</span>
              <span>General: contact@visiongo.app</span>
              <span>Enterprise & Licensing: sales@visiongo.app</span>
              <span>Technical Support: support@visiongo.app</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-3 w-full sm:w-auto">
            <button
              onClick={onOpenContact}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span>Schedule Architecture Call</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="mailto:contact@visiongo.app"
              className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-medium text-center transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-zinc-400" />
              <span>Email Engineering</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
