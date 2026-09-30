import { ResourceArticle } from '../types';
import { SupportedLocale } from '../types/i18n';

export const RESOURCE_ARTICLES_EN: ResourceArticle[] = [
  {
    id: 'why-industrial-ai-must-work-without-the-cloud',
    slug: 'why-industrial-ai-must-work-without-the-cloud',
    type: 'Article',
    title: 'Why Industrial AI Must Work Without the Cloud',
    summary:
      'Examining the physical realities of high-speed manufacturing: why network latency, jitter, air-gapped cybersecurity, and plant autonomy require 100% offline edge AI.',
    date: '2026-09-28',
    readTime: '6 min read',
    author: 'VISIONGO Engineering Team',
    tags: ['Architecture', 'Edge AI', 'Cybersecurity', 'Industrial Systems'],
    contentMarkdown: `
# Why Industrial AI Must Work Without the Cloud

In enterprise SaaS and consumer applications, the cloud is taken for granted. Continuous connectivity, infinite compute clusters, and centralized orchestration are default architectural assumptions.

However, bringing AI onto the **industrial factory floor** upends almost every assumption that works in traditional software. Here is why industrial AI must be architected to operate fully without the cloud.

---

## 1. The Physics of High-Speed Automation
In a precision automotive or semiconductor plant, conveyor belts move at up to 3 meters per second. Inspection decisions—triggering a pneumatic reject gate, marking a defective component, or halting an assembly feeder—must occur in **under 15 milliseconds**.

- **Network Latency Jitter**: Even with modern fiber, cross-internet packet roundtrips fluctuate between 20ms and 150ms.
- **Unacceptable Queuing**: A single missed frame or delayed handshake translates directly to damaged machinery or defective parts slipping into customer shipments.

**VISIONGO Principle**: VisionRuntime and VisionEdge execute locally on deterministic on-premise hardware, guaranteeing sub-millisecond control loop determinism.

---

## 2. Air-Gapped Cybersecurity & Zero-Trust Factories
The most critical manufacturing facilities—semiconductor fabrication, automotive battery lines, pharmaceutical production, and aerospace assembly—are strictly **air-gapped**.

- Standard industrial network policy explicitly forbids connecting production operational technology (OT) to the public internet.
- Plant floor switches do not possess default gateways or DNS resolvers.

If an inspection tool requires internet connectivity to validate a license, authenticate a token, or infer a neural model, **it cannot even be installed on the factory floor**.

---

## 3. High-Bandwidth Raw Video Streams
Consider a modern AOI (Automated Optical Inspection) station with four 12-Megapixel cameras running at 60 FPS:

$$\\text{Throughput} = 4 \\times 12\\text{ MB} \\times 60 \\approx 2.88\\text{ GB/sec} \\approx 23\\text{ Gbps}$$

Streaming this volume of uncompressed or lightly compressed video to external cloud providers is economically and physically unfeasible over commercial WAN uplinks. Processing must happen via local zero-copy shared memory directly on the edge IPC.

---

## 4. The Cloud as an Optional Enhancement, Not a Dependency
Does this mean the cloud has no place in industrial vision? Absolutely not. But its role must be **asynchronous and optional**.

In the VISIONGO architecture:
1. **VisionStudio**: Engineers author and debug recipes on local workstations.
2. **VisionRuntime**: Executes deterministic 24/7 vision pipelines with zero network reliance.
3. **VisionEdge**: Delivers autonomous AI diagnostics, anomaly verification, and fail-safe rollback locally on-site.
4. **VisionCloud**: Collects non-blocking, anonymized fleet metrics and provides multimodal LLM reasoning **only when connectivity is available**.

If the WAN connection drops, the factory never misses a single product inspection.
    `,
  },
  {
    id: 'building-reliable-industrial-vision-systems',
    slug: 'building-reliable-industrial-vision-systems',
    type: 'Article',
    title: 'Building Reliable Industrial Vision Systems: Determinism, Jitter, and Fault Isolation',
    summary:
      'A deep architectural look into zero-copy frame management, real-time thread pinning, and contract-based IPC in high-uptime machine vision.',
    date: '2026-09-15',
    readTime: '8 min read',
    author: 'VISIONGO Systems Core',
    tags: ['C++', 'Real-Time', 'Memory Safety', 'Production Runtime'],
    contentMarkdown: `
# Building Reliable Industrial Vision Systems: Determinism, Jitter, and Fault Isolation

Designing computer vision software for research or desktop demos is vastly different from engineering software that runs continuously in industrial plants 365 days a year without a memory leak or crash.

This article details the core engineering principles behind VisionRuntime.

---

## 1. Zero-Copy Frame Handling
When processing high-resolution frames, memory allocation is the primary enemy of determinism. Standard \`malloc\` or \`new\` calls introduce heap fragmentation and unpredictable latency spikes.

VisionRuntime utilizes pre-allocated circular ring buffers and memory-mapped DMA regions. Frame grabbers transfer raw sensor buffers directly into target memory pools accessible by both CPU SIMD routines and GPU Tensor cores without CPU copy overhead.

---

## 2. Thread Pinning and Core Affinity
On modern multi-core x86/ARM industrial IPCs, OS scheduler thread migration induces CPU cache misses and microsecond jitter.

VisionRuntime isolates execution threads:
- **Core 0-1**: Operating system and non-critical communication.
- **Core 2-3**: GigE Vision packet reassembly and DMA interrupt handling.
- **Core 4-7**: Real-time pipeline processing and hard real-time PLC trigger coordination.

---

## 3. Strict Contract Isolation
Rather than relying on tightly coupled monomorphic codebases, the VISIONGO system isolates modules through standardized SDK protocols. Communication between VisionStudio, VisionRuntime, and VisionEdge occurs through verified schemas, preventing unexpected pointer corruption across subsystems.
    `,
  },
  {
    id: 'ai-agents-for-machine-vision-engineering',
    slug: 'ai-agents-for-machine-vision-engineering',
    type: 'Article',
    title: 'AI Agents for Machine Vision Engineering: Closing the Loop Between Design and Operations',
    summary:
      'How multimodal reasoning models and on-site edge agents transform machine vision from static manual calibration to self-improving autonomous inspection.',
    date: '2026-09-02',
    readTime: '7 min read',
    author: 'AI Research Group',
    tags: ['AI Agents', 'VisionStudio', 'VisionEdge', 'Automation'],
    contentMarkdown: `
# AI Agents for Machine Vision Engineering: Closing the Loop

In traditional machine vision, commissioning a new inspection line requires weeks of manual tweaking: lighting angles, exposure times, threshold levels, and filter kernel sizes. When mechanical wear or optical smudges occur months later, human vision engineers are dispatched on-site for manual recalibration.

VISIONGO introduces an agentic approach to industrial vision engineering.

---

## The Feedback Loop: Studio to Edge to Cloud
1. **Interactive Prompt & Recipe Generation**: In VisionStudio, engineers describe inspection criteria and provide sample golden and defective parts. AI agents suggest optimal filter graphs and bounding constraints.
2. **On-site Edge Diagnostics**: VisionEdge monitors production continuously. If false reject rates creep upward due to an ambient light shift, the local edge agent detects the drift and performs micro-adjustments within verified safety envelopes.
3. **Fail-Safe Guardrails**: Automated adjustments are constrained by strict statistical bounds. If confidence drops, VisionEdge initiates an automated rollback to certified golden snapshots and alerts plant personnel.
    `,
  },
  {
    id: 'tutorial-first-pipeline-genicam',
    slug: 'tutorial-first-pipeline-genicam',
    type: 'Tutorial',
    title: 'Hands-on: Building Your First GigE Vision Pipeline with VisionStudio and VisionRuntime',
    summary:
      'Step-by-step tutorial on connecting an industrial GigE camera, configuring real-time ROI extraction, and exporting a certified runtime package.',
    date: '2026-08-20',
    readTime: '10 min read',
    author: 'Solutions Architecture',
    tags: ['Tutorial', 'VisionStudio', 'GigE Vision', 'Quickstart'],
  },
  {
    id: 'case-study-automotive-tier1-battery',
    slug: 'case-study-automotive-tier1-battery',
    type: 'Case Study',
    title: 'Case Study: Zero-Defect EV Battery Weld Inspection in a 24/7 Tier-1 Manufacturing Facility',
    summary:
      'How an EV battery manufacturer deployed VisionRuntime and VisionEdge across 14 assembly lines, cutting false reject rates by 78% with zero internet connectivity.',
    date: '2026-08-05',
    readTime: '5 min read',
    author: 'Industrial Applications Team',
    tags: ['Case Study', 'Automotive', 'EV Battery', 'ROI'],
  },
  {
    id: 'release-notes-v2-4',
    slug: 'release-notes-v2-4',
    type: 'Release Note',
    title: 'VISIONGO Platform v2.4.0 Released: Sub-millisecond IPC, OPC UA PubSub, and Offline AI Clustering',
    summary:
      'Official release notes for the v2.4.0 suite: enhanced GenICam streaming performance, native Modbus register visualizer, and local edge clustering in VisionEdge.',
    date: '2026-07-28',
    readTime: '4 min read',
    author: 'VISIONGO Product Release',
    tags: ['Release', 'Changelog', 'v2.4.0'],
  },
];

export const RESOURCE_ARTICLES_ZH: ResourceArticle[] = [
  {
    id: 'why-industrial-ai-must-work-without-the-cloud',
    slug: 'why-industrial-ai-must-work-without-the-cloud',
    type: 'Article',
    title: '为什么工业 AI 必须在无云端网络环境下独立运行',
    summary:
      '深度剖析高速智能制造现场的物理现实：为何毫秒级网络抖动、工控网络物理隔离（Air-Gap）与数据主权要求工业 AI 必须 100% 离线自治。',
    date: '2026-09-28',
    readTime: '6 分钟阅读',
    author: 'VISIONGO 架构工程团队',
    tags: ['架构设计', '边缘 AI', '工业网络安全', '工控系统'],
    contentMarkdown: `
# 为什么工业 AI 必须在无云端网络环境下独立运行

在企业级 SaaS 和互联网软件中，云计算几乎是理所应当的默认基础设施：持续的网络连通性、无限的算力池以及中心化的集群编排。

然而，当人工智能踏入真实的**工业生产车间**，几乎所有在传统互联网软件中成立的假设都被彻底颠覆。以下是为什么工业视觉与工业 AI 必须从底层架构上保证完全无需云端即可独立运行的核心原因。

---

## 1. 高速自动化流水线的物理约束与时序现实
在汽车冲压、锂电池卷绕或半导体封装产线上，传送带以高达每秒 3 米的速度疾驰。从相机感光曝光到气动剔废电磁阀下达动作指令，整个检测决策回路必须在 **15 毫秒内**严格闭环。

- **广域网抖动不可容忍**：即使是最优质的专线，跨广域网的数据包往返时间也常在 20ms 到 150ms 之间随机波动。
- **排队延迟即事故**：仅仅一帧画面的丢帧或网络超时抖动，就意味着高速零件发生机械碰撞卡死，或带有严重缺陷的瑕疵品流入下一道装配工序。

**VISIONGO 设计准则**：VisionRuntime 与 VisionEdge 直接运行在产线旁的本地工控硬件上，通过 CPU 核心亲和力绑定与实时内核，提供确定性的亚毫秒控制闭环。

---

## 2. 车间物理隔绝（Air-Gapped）与零信任网络安全
半导体晶圆代工、新能源动力电池超级工厂、制药无菌车间以及高精航空制造车间，均执行严格的**物理网络隔绝（Air-Gapped）**合规制度。

- 工业网络（OT）与办公互联网（IT）物理断开，交换机与工控机默认没有网关，亦不开放外网 DNS 解析。
- 严禁任何产线设备主动建立外部外网出站连接。

如果一款视觉软件需要通过外网云端来验证 License 证书、心跳保活或下发模型权重，**它根本无法通过工厂信息安全合规审查，甚至无法被安装到工控机上**。

---

## 3. 巨量原始图像带宽对广域网传输的物理限制
设想一条标准的高速高精度 AOI 产线，配备 4 台 1200 万像素工业相机以 60 FPS 采样：

$$\\text{原始数据吞吐量} = 4 \\times 12\\text{ MB} \\times 60 \\approx 2.88\\text{ GB/秒} \\approx 23\\text{ Gbps}$$

将每秒近 3GB 的未压缩高保真图像流实时推送到外部公有云，无论是网络带宽成本还是物理光纤吞吐均不可行。所有高保真图像张量计算必须通过本地 PCIe DMA 和共享内存直接在边缘 IPC 完成。

---

## 4. 云端是异步增强，绝非依赖单点
这是否意味着工业场景不需要云？并非如此。但云的角色必须被严格限定为**“异步可选增强”**：

在 VISIONGO 软件体系中：
1. **VisionStudio**：工程师在本地工作站离线设计并单步调试检测流。
2. **VisionRuntime**：在产线工控机上 24/7 硬实时执行检测，零外部网络依赖。
3. **VisionEdge**：在车间本地边缘计算单元中执行闭环神经核验、光照漂移自愈与安全快照回滚。
4. **VisionCloud**：仅在现场具备受控网络条件时，异步汇集脱敏后的良率宏观统计与全厂大模型归因分析。

无论外部网络畅通还是彻底拔掉网线，工厂生产线都绝不停转一分一秒。
    `,
  },
  {
    id: 'building-reliable-industrial-vision-systems',
    slug: 'building-reliable-industrial-vision-systems',
    type: 'Article',
    title: '构建高可靠工业视觉系统：确定性、超低抖动与故障进程隔离',
    summary:
      '从现代 C++20 系统编程视角，深度剖析零拷贝帧缓冲设计、CPU 核心独占绑定与进程沙箱在 24/7 机器视觉系统中的关键应用。',
    date: '2026-09-15',
    readTime: '8 分钟阅读',
    author: 'VISIONGO 核心系统组',
    tags: ['C++20', '实时系统', '内存安全', '生产执行引擎'],
    contentMarkdown: `
# 构建高可靠工业视觉系统：确定性、超低抖动与故障隔离

在实验室或桌面端演示计算机视觉原型，与编写在工厂车间 365 天无间断运转且零内存泄漏、零崩溃的工业软件，有着天壤之别。

本文详尽阐述 VisionRuntime 的底层系统架构设计原则。

---

## 1. 消除动态内存分配的零拷贝帧管理
在处理高分辨率图像时，常规的 \`malloc\` 或 \`new\` 是实时确定性的最大敌人。频繁的内存申请与释放必然诱发堆内存碎片化与无法预测的微秒级分配延迟。

VisionRuntime 采用预先分配的固定环形缓冲区（Ring Buffer）和物理内存映射 DMA 区域。工业相机采集卡直接将传感器数据流写入 GPU/CPU 共享物理页，完全消除从内核空间到用户空间的中间冗余内存拷贝。

---

## 2. 线程独占绑定（CPU Core Pinning）
在现代多核 x86/ARM 工控机上，操作系统的常规线程调度器会导致线程在不同核心间频繁迁移，引发严重的 CPU L1/L2 缓存失效和微秒级抖动。

VisionRuntime 对执行线程实施精确物理核隔离：
- **Core 0-1**：负责操作系统后台任务与非实时日志。
- **Core 2-3**：专门承载 GigE Vision 丢包重传与高速 DMA 中断响应。
- **Core 4-7**：独占绑定硬实时检测管线计算，并与工业 PLC 硬件中断保持微秒级同步。

---

## 3. 严格契约隔离与防溢出保护
VISIONGO 严格摒弃紧耦合单体设计，所有跨模块通信均经过标准化 SDK 契约头文件定义与验证，确保各个子进程故障时彼此绝对隔离，永不互相污染内存空间。
    `,
  },
  {
    id: 'ai-agents-for-machine-vision-engineering',
    slug: 'ai-agents-for-machine-vision-engineering',
    type: 'Article',
    title: '工业视觉工程的 AI 智能体范式：打通从方案设计到现场自愈的闭环',
    summary:
      '多模态推理模型与车间现场边缘 Agent 如何协同将传统依赖人工经验反复调参的机器视觉，转变为具有自适应学习能力的智能系统。',
    date: '2026-09-02',
    readTime: '7 分钟阅读',
    author: 'VISIONGO AI 研究组',
    tags: ['AI 智能体', 'VisionStudio', 'VisionEdge', '自适应控制'],
    contentMarkdown: `
# 工业视觉工程的 AI 智能体范式：打通闭环

在传统机器视觉部署中，搭建一条新的检测线往往需要资深工程师在现场花费数周反复调节：光源角度、曝光时间、二值化阈值与卷积核尺寸。然而几个月后，随着车间机械磨损或镜头积尘，视觉误报率上升，又必须人工再次驻场重新标定。

VISIONGO 将自主智能体（Agentic）设计哲学引入工业机器视觉工程。

---

## 从设计到车间的闭环协同
1. **交互式提示与配方智能生成**：在 VisionStudio 中，工程师只需导入 CAD 图纸与少量正负样本，AI 智能体便能推荐最优算子节点拓扑与边界容差约束。
2. **现场边缘自主诊断与补偿**：VisionEdge 持续监视 SPC 波动指标。一旦识别到由于昼夜自然光照变化引起的灰度分布漂移，边缘 Agent 会在经过数学验证的安全边界内，自主微调前置曝光与对比度参数。
3. **带安全护栏的自动快照回滚**：所有现场自适应调整均受到严格约束。一旦检测置信度异常，VisionEdge 立即毫秒级回退至已认证的黄金基线快照，并向工程师告警。
    `,
  },
  {
    id: 'tutorial-first-pipeline-genicam',
    slug: 'tutorial-first-pipeline-genicam',
    type: 'Tutorial',
    title: '实战教程：使用 VisionStudio 与 VisionRuntime 搭建首个 GigE 工业相机视觉检测管线',
    summary:
      '从零开始：连接工业 GigE 相机、配置实时感兴趣区域（ROI）提取算子，并编译导出经签名验证的生产级运行配方包。',
    date: '2026-08-20',
    readTime: '10 分钟阅读',
    author: '解决方案架构组',
    tags: ['实战教程', 'VisionStudio', 'GigE Vision', '快速上手'],
  },
  {
    id: 'case-study-automotive-tier1-battery',
    slug: 'case-study-automotive-tier1-battery',
    type: 'Case Study',
    title: '案例分析：头部动力电池超级工厂 14 条装配线实现焊接零缺陷检测实录',
    summary:
      '详述某国际 Tier-1 动力电池制造商如何在完全物理隔离的 14 条高速模组装配线上部署 VisionRuntime 与 VisionEdge，将虚警误检率降低 78%。',
    date: '2026-08-05',
    readTime: '5 分钟阅读',
    author: '工业应用项目组',
    tags: ['客户案例', '新能源汽车', '动力电池', '投资回报率'],
  },
  {
    id: 'release-notes-v2-4',
    slug: 'release-notes-v2-4',
    type: 'Release Note',
    title: 'VISIONGO 平台 v2.4.0 正式发布：亚毫秒跨进程通信、OPC UA PubSub 与离线边缘聚类',
    summary:
      'v2.4.0 全系产品套件官方发版说明：增强 GenICam 零拷贝流传输性能、内置 Modbus 寄存器可视化映射器以及 VisionEdge 本地离线聚类诊断引擎。',
    date: '2026-07-28',
    readTime: '4 分钟阅读',
    author: 'VISIONGO 产品发布组',
    tags: ['版本发布', '发版日志', 'v2.4.0'],
  },
];

export const getResourceArticles = (locale: SupportedLocale = 'en'): ResourceArticle[] => {
  return locale === 'zh' ? RESOURCE_ARTICLES_ZH : RESOURCE_ARTICLES_EN;
};

// Backwards compatibility default
export const RESOURCE_ARTICLES = RESOURCE_ARTICLES_EN;
