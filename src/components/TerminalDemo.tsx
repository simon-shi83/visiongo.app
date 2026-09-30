import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, Pause, RotateCw, CheckCircle2 } from 'lucide-react';

export const TerminalDemo: React.FC = () => {
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] VisionRuntime v2.4.0 (x86_64-linux-gnu, RealTime Kernel 6.8-rt)',
    '[MEM] Pre-allocated zero-copy frame pool: 4096 MB mapped in /dev/shm/vg_pool',
    '[CAM0] GigE Vision sensor attached: Sony IMX540 (4504x4504 @ 60 FPS, GenICam v3.1)',
    '[FIELD] OPC UA connection established -> opc.tcp://192.168.10.50:4840 (Jitter: 0.12ms)',
    '[EDGE] VisionEdge autonomous supervisor attached (Local Loop, Air-Gapped Mode: TRUE)',
    '[RECIPE] Verified inspection recipe: pcb_surface_inspection_v2.bundle',
    '[CYCLE #489201] Frame grabbed: 5120x5120 [DMA: 1.1ms] -> Inference: OK (Confidence: 99.8%)',
    '[CYCLE #489202] Frame grabbed: 5120x5120 [DMA: 1.0ms] -> Defect candidate in ROI#3',
    '[EDGE] Neural verification: Verified Defect (Scratch, 0.42mm). PLC Trigger Pin 40012 HIGH',
    '[CYCLE #489203] Frame grabbed: 5120x5120 [DMA: 1.1ms] -> Inference: OK (Confidence: 99.9%)',
  ]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const cycleId = Math.floor(489204 + Math.random() * 200);
      const isCandidate = Math.random() > 0.85;
      const dmaMs = (0.9 + Math.random() * 0.3).toFixed(1);

      if (isCandidate) {
        setLogs((prev) => [
          ...prev.slice(-9),
          `[CYCLE #${cycleId}] Frame grabbed [DMA: ${dmaMs}ms] -> Edge anomaly arbitrated: Pass (False-reject suppressed)`,
        ]);
      } else {
        const conf = (99.7 + Math.random() * 0.29).toFixed(1);
        setLogs((prev) => [
          ...prev.slice(-9),
          `[CYCLE #${cycleId}] Frame grabbed [DMA: ${dmaMs}ms] -> Pipeline: PASS (${conf}%) | PLC Sync: 0.08ms`,
        ]);
      }
    }, 2400);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <span className="ml-2 text-zinc-400 font-sans text-xs font-medium flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            visionruntime — assembly_line_01 — stdout
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> RT Determinism: OK
          </span>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={isRunning ? 'Pause Output' : 'Resume Output'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() =>
              setLogs([
                '[CYCLE #500100] Stream reset: Allocating ring buffers in /dev/shm...',
                '[CYCLE #500101] Sensor synchronized @ 120 FPS. Modbus ready.',
              ])
            }
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Clear"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 space-y-1.5 bg-zinc-950/95 min-h-[220px] max-h-[260px] overflow-y-auto leading-relaxed">
        {logs.map((log, index) => {
          const isError = log.includes('Defect') || log.includes('anomaly');
          const isInit = log.includes('[INIT]') || log.includes('[MEM]');
          const isEdge = log.includes('[EDGE]');

          return (
            <div key={index} className="flex items-start gap-2">
              <span className="text-zinc-600 select-none">&gt;</span>
              <span
                className={`${
                  isError
                    ? 'text-amber-400'
                    : isEdge
                    ? 'text-violet-400'
                    : isInit
                    ? 'text-cyan-400'
                    : 'text-zinc-300'
                }`}
              >
                {log}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
