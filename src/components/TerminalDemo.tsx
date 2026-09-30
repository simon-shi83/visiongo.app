import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, Pause, RotateCw, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const TerminalDemo: React.FC = () => {
  const { t, locale } = useLanguage();
  const [isRunning, setIsRunning] = useState(true);

  const getInitialLogs = (isZh: boolean) => [
    isZh
      ? '[INIT] VisionRuntime v2.4.0 (x86_64-linux-gnu, 实时工控内核 6.8-rt)'
      : '[INIT] VisionRuntime v2.4.0 (x86_64-linux-gnu, RealTime Kernel 6.8-rt)',
    isZh
      ? '[MEM] 预分配零拷贝帧缓冲池: 4096 MB 映射至 /dev/shm/vg_pool'
      : '[MEM] Pre-allocated zero-copy frame pool: 4096 MB mapped in /dev/shm/vg_pool',
    isZh
      ? '[CAM0] 工业 GigE 传感器已连接: Sony IMX540 (4504x4504 @ 60 FPS, GenICam v3.1)'
      : '[CAM0] GigE Vision sensor attached: Sony IMX540 (4504x4504 @ 60 FPS, GenICam v3.1)',
    isZh
      ? '[FIELD] OPC UA 现场总线握手建立 -> opc.tcp://192.168.10.50:4840 (抖动: 0.12ms)'
      : '[FIELD] OPC UA connection established -> opc.tcp://192.168.10.50:4840 (Jitter: 0.12ms)',
    isZh
      ? '[EDGE] VisionEdge 现场自主智能体已加载 (本地闭环回路, 离线无网模式: 激活)'
      : '[EDGE] VisionEdge autonomous supervisor attached (Local Loop, Air-Gapped Mode: TRUE)',
    isZh
      ? '[RECIPE] 生产检测配方校验通过: pcb_surface_inspection_v2.bundle'
      : '[RECIPE] Verified inspection recipe: pcb_surface_inspection_v2.bundle',
    isZh
      ? '[CYCLE #489201] 帧采集完成: 5120x5120 [DMA: 1.1ms] -> 神经网络推理: OK (置信度: 99.8%)'
      : '[CYCLE #489201] Frame grabbed: 5120x5120 [DMA: 1.1ms] -> Inference: OK (Confidence: 99.8%)',
    isZh
      ? '[CYCLE #489202] 帧采集完成: 5120x5120 [DMA: 1.0ms] -> ROI#3 候选微缺陷触发'
      : '[CYCLE #489202] Frame grabbed: 5120x5120 [DMA: 1.0ms] -> Defect candidate in ROI#3',
    isZh
      ? '[EDGE] 边缘神经二次仲裁: 判定微划痕缺陷 (0.42mm). 触发工控 PLC 引脚 40012 HIGH'
      : '[EDGE] Neural verification: Verified Defect (Scratch, 0.42mm). PLC Trigger Pin 40012 HIGH',
    isZh
      ? '[CYCLE #489203] 帧采集完成: 5120x5120 [DMA: 1.1ms] -> 判定: 合格 (置信度: 99.9%)'
      : '[CYCLE #489203] Frame grabbed: 5120x5120 [DMA: 1.1ms] -> Inference: OK (Confidence: 99.9%)',
  ];

  const [logs, setLogs] = useState<string[]>(() => getInitialLogs(locale === 'zh'));

  useEffect(() => {
    setLogs(getInitialLogs(locale === 'zh'));
  }, [locale]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const cycleId = Math.floor(489204 + Math.random() * 200);
      const isCandidate = Math.random() > 0.85;
      const dmaMs = (0.9 + Math.random() * 0.3).toFixed(1);
      const isZh = locale === 'zh';

      if (isCandidate) {
        setLogs((prev) => [
          ...prev.slice(-9),
          isZh
            ? `[CYCLE #${cycleId}] 帧采集 [DMA: ${dmaMs}ms] -> 边缘异常自愈仲裁: 通过 (成功抑制误检)`
            : `[CYCLE #${cycleId}] Frame grabbed [DMA: ${dmaMs}ms] -> Edge anomaly arbitrated: Pass (False-reject suppressed)`,
        ]);
      } else {
        const conf = (99.7 + Math.random() * 0.29).toFixed(1);
        setLogs((prev) => [
          ...prev.slice(-9),
          isZh
            ? `[CYCLE #${cycleId}] 帧采集 [DMA: ${dmaMs}ms] -> 流水线: 合格 (${conf}%) | PLC 同步: 0.08ms`
            : `[CYCLE #${cycleId}] Frame grabbed [DMA: ${dmaMs}ms] -> Pipeline: PASS (${conf}%) | PLC Sync: 0.08ms`,
        ]);
      }
    }, 2400);

    return () => clearInterval(interval);
  }, [isRunning, locale]);

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
            {t.hero.liveLogTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> {t.hero.rtDeterminismOk}
          </span>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={isRunning ? 'Pause Output' : 'Resume Output'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setLogs(getInitialLogs(locale === 'zh').slice(0, 3))}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Reset"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 space-y-1.5 bg-zinc-950/95 min-h-[220px] max-h-[260px] overflow-y-auto leading-relaxed">
        {logs.map((log, index) => {
          const isError = log.includes('Defect') || log.includes('anomaly') || log.includes('缺陷');
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
