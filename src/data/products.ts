import { Product } from '../types';
import { SupportedLocale } from '../types/i18n';

export const PRODUCTS_EN: Record<string, Product> = {
  visionstudio: {
    id: 'visionstudio',
    slug: 'visionstudio',
    name: 'VisionStudio',
    shortAction: 'Build',
    positioning: 'Engineering Workspace',
    tagline: 'Build industrial vision applications.',
    summary:
      'The engineering workspace for designing, configuring, debugging, and building industrial vision applications and engineer workflows.',
    description:
      'VisionStudio empowers vision engineers and automation developers to design complex machine vision inspection pipelines with visual graph orchestration, real-time camera calibrations, hardware simulators, and interactive AI prompt engineering—turning weeks of integration into hours.',
    accentColor: '#06b6d4',
    badge: 'Build Phase',
    highlights: [
      'Visual workflow and node-graph orchestration',
      'Real-time frame inspector & simulated camera feeds',
      'Hardware communication mapping (GenICam, GigE Vision, USB3)',
      'Deterministic pipeline compilation and contract verification',
      'Integrated AI inspection recipe sandbox',
    ],
    keyCapabilities: [
      {
        title: 'Visual Graph Authoring',
        description:
          'Construct multi-stage vision pipelines with zero boilerplate. Wire together image acquisition, morphological filters, deep learning models, and PLC outputs.',
        icon: 'Workflow',
      },
      {
        title: 'Hardware & Camera Calibration',
        description:
          'Native configuration for industrial 2D/3D sensors, lighting controllers, and trigger boards with live histogram, focus metrics, and optical distortion tuning.',
        icon: 'Camera',
      },
      {
        title: 'Interactive Debugging & Replay',
        description:
          'Step-through execution on historical golden and defect datasets. Inspect intermediate image buffers and tensor outputs without pausing production lines.',
        icon: 'Bug',
      },
      {
        title: 'SDK & Recipe Export',
        description:
          'Export production-ready, compiled inspection bundles that link strictly with VisionRuntime via standardized SDK schemas.',
        icon: 'Package',
      },
    ],
    architectureRole: 'Engineering design, algorithm testing, and pipeline authoring',
    deploymentTarget: 'Engineering Workstations (Windows, Linux, macOS)',
    connectivityRequirement: 'Local workstation execution; optional cloud sync',
    sampleCodeOrConfig: {
      filename: 'pipeline_recipe.json',
      language: 'json',
      code: `{
  "pipeline": "pcb_surface_inspection",
  "version": "2.4.0",
  "nodes": [
    { "id": "camera_top", "type": "GenICamSource", "device": "GigE:192.168.1.10" },
    { "id": "roi_cropper", "type": "DynamicROIExtractor", "regions": 4 },
    { "id": "ai_defect_detector", "type": "EdgeTensorInference", "model": "pcb_defect_v3.engine" },
    { "id": "plc_sink", "type": "ModbusSink", "target": "PLC_LINE_01", "register": 40012 }
  ],
  "sla_max_latency_ms": 14.5
}`,
    },
  },

  visionruntime: {
    id: 'visionruntime',
    slug: 'visionruntime',
    name: 'VisionRuntime',
    shortAction: 'Run',
    positioning: 'Production Runtime',
    tagline: 'Run vision applications in production.',
    summary:
      'High-throughput, deterministic execution engine responsible for running the complete machine vision pipeline directly on the production line.',
    description:
      'VisionRuntime is engineered in modern C++ for maximum throughput, sub-millisecond jitter, and 24/7 industrial resilience. It handles real-time image acquisition, low-latency image processing, zero-copy shared memory data flow, hardware communication, and deterministic PLC synchronization.',
    accentColor: '#10b981',
    badge: 'Run Phase',
    highlights: [
      'Sub-millisecond pipeline latency and determinism',
      'Zero-copy frame sharing and hardware acceleration',
      'Comprehensive industrial fieldbus protocols (Modbus, OPC UA, EtherCAT)',
      'Strict memory isolation and process watchdog',
      'SDK-first contract interfaces without proprietary lock-in',
    ],
    keyCapabilities: [
      {
        title: 'Deterministic Pipeline Engine',
        description:
          'Engineered for 24/7 continuous operation on high-speed factory conveyors with zero memory leaks, thread pinning, and predictable execution cycles.',
        icon: 'Cpu',
      },
      {
        title: 'Industrial Fieldbus & I/O Sync',
        description:
          'Hard real-time synchronization with industrial PLCs, pneumatic ejectors, strobe controllers, and optical encoders over industrial protocols.',
        icon: 'Layers',
      },
      {
        title: 'Zero-Copy Framebuffer Architecture',
        description:
          'Transfers gigabyte-per-second raw image streams directly from PCIe/NIC frame grabbers to GPU memory without intermediate host copies.',
        icon: 'Zap',
      },
      {
        title: 'Resilient Failure Recovery',
        description:
          'Integrated watchdog supervisors and isolated pipeline worker pools safeguard factory lines from crashes, ensuring continuous uptime.',
        icon: 'ShieldCheck',
      },
    ],
    architectureRole: 'Production line execution, image processing, hardware control',
    deploymentTarget: 'Industrial PCs, Embedded Edge IPCs, Rackmount Factory Servers',
    connectivityRequirement: '100% autonomous local execution; zero cloud dependency',
    sampleCodeOrConfig: {
      filename: 'runtime_config.yaml',
      language: 'yaml',
      code: `runtime:
  pipeline_id: "assembly_line_inspector"
  concurrency_threads: 8
  pin_cores: [2, 3, 4, 5]
  acquisition:
    driver: "genicam"
    frame_rate_target_fps: 120
    buffer_pool_mb: 2048
  fieldbus:
    driver: "opcua"
    endpoint: "opc.tcp://192.168.10.50:4840"
  watchdog:
    heartbeat_interval_ms: 50
    fail_safe_trigger: "EJECTOR_STANDBY"`,
    },
  },

  visionedge: {
    id: 'visionedge',
    slug: 'visionedge',
    name: 'VisionEdge',
    shortAction: 'Assist',
    positioning: 'On-site Intelligence',
    tagline: 'Bring AI intelligence to the factory floor.',
    summary:
      'Deployed on-site to provide VisionRuntime with local AI intelligence, automated verification, diagnostics, rollback, and real-time optimization.',
    description:
      'VisionEdge brings sophisticated machine learning and autonomous decision-making to the plant floor. Crucially, VisionEdge runs entirely on local edge hardware without requiring an internet connection—ensuring industrial data privacy, strict cybersecurity compliance, and zero downtime even in completely air-gapped environments.',
    accentColor: '#8b5cf6',
    badge: 'Assist Phase',
    highlights: [
      '100% Offline execution — strictly zero internet dependency',
      'Real-time anomaly detection and false-reject verification',
      'Automated inspection threshold tuning & parameter drift compensation',
      'Instant fail-safe recipe rollback on deviation detection',
      'Local incident clustering and edge diagnostics',
    ],
    keyCapabilities: [
      {
        title: 'Air-Gapped Local Intelligence',
        description:
          'Runs fully contained on factory edge servers. Zero images or telemetry ever leave the local network boundary without explicit operator policy.',
        icon: 'Shield',
      },
      {
        title: 'Defect Verification & False Reject Elimination',
        description:
          'Secondary high-capacity neural verification arbitrates ambiguous edge-case defects, slashing costly manual re-inspection by up to 85%.',
        icon: 'CheckCircle2',
      },
      {
        title: 'Closed-Loop Drift Compensation',
        description:
          'Dynamically detects ambient lighting shifts, mechanical vibration wear, or optical smudges, adjusting vision filters before rejects occur.',
        icon: 'Activity',
      },
      {
        title: 'Autonomous Safe Rollback',
        description:
          'Continuously monitors statistical process control (SPC) metrics. Automatically reverts to proven golden recipes if an anomaly is detected.',
        icon: 'RotateCcw',
      },
    ],
    architectureRole: 'Local edge AI supervision, diagnosis, self-healing, and closed-loop optimization',
    deploymentTarget: 'On-premise Edge Server, Industrial GPU Box (NVIDIA Jetson / x86 GPU)',
    connectivityRequirement: '100% Offline Capable; Operates in completely air-gapped environments',
    sampleCodeOrConfig: {
      filename: 'edge_policy.json',
      language: 'json',
      code: `{
  "edge_mode": "autonomous_air_gapped",
  "supervision_target": "VisionRuntime@127.0.0.1:9091",
  "local_inference_accelerator": "tensorrt_cuda",
  "offline_clustering": {
    "enabled": true,
    "max_local_buffer_days": 30
  },
  "auto_rollback_rules": {
    "false_reject_spike_threshold": 0.02,
    "consecutive_divergent_frames": 5,
    "action": "RESTORE_GOLDEN_SNAPSHOT"
  }
}`,
    },
  },

  visioncloud: {
    id: 'visioncloud',
    slug: 'visioncloud',
    name: 'VisionCloud',
    shortAction: 'Extend',
    positioning: 'Cloud Intelligence',
    tagline: 'Extend industrial vision with cloud intelligence.',
    summary:
      'Provides cloud LLMs, fleet knowledge aggregation, multi-site analytics, defect clustering, and remote engineering intelligence.',
    description:
      'VisionCloud provides advanced multi-plant visibility and cross-facility knowledge synthesis. By design, VisionCloud is an optional enhancement layer—never a single point of failure. If the cloud connection is disconnected, the factory floor, VisionRuntime, and VisionEdge continue running at full capacity without interruption.',
    accentColor: '#f59e0b',
    badge: 'Extend Phase',
    highlights: [
      'Multi-site fleet telemetrics and yield intelligence',
      'Industrial multimodal LLM reasoning & automated root-cause analysis',
      'Cross-factory defect clustering and recipe synchronization',
      'Strictly optional enhancement — core industrial operations never depend on cloud',
      'End-to-end zero-trust encryption and enterprise compliance',
    ],
    keyCapabilities: [
      {
        title: 'Multimodal Industrial LLM',
        description:
          'Ask natural language questions about line anomalies, defect trends, and optical recipes. Leverage domain-tuned vision reasoning agents.',
        icon: 'Sparkles',
      },
      {
        title: 'Global Fleet Telemetry & Benchmarking',
        description:
          'Compare cycle times, defect distributions, and yield figures across multiple production lines and worldwide factory sites from a unified console.',
        icon: 'BarChart3',
      },
      {
        title: 'Centralized Recipe & Model Repository',
        description:
          'Curate certified vision models, manage versioned recipe releases, and deploy updates to fleet edge nodes with staged canary rollouts.',
        icon: 'CloudUpload',
      },
      {
        title: 'Zero-Downtime Decoupled Architecture',
        description:
          'Built on an asynchronous contract model. Cloud outages, latency spikes, or offline maintenance never affect real-time factory floor inspection.',
        icon: 'RefreshCw',
      },
    ],
    architectureRole: 'Global knowledge aggregation, enterprise fleet monitoring, cloud LLMs',
    deploymentTarget: 'Multi-cloud / Hybrid Cloud (Cloudflare Workers, AWS, GCP, Azure)',
    connectivityRequirement: 'Optional cloud enhancement; never required for local factory operation',
    sampleCodeOrConfig: {
      filename: 'cloud_sync_spec.json',
      language: 'json',
      code: `{
  "service": "visioncloud_sync",
  "fleet_scope": "global_enterprise",
  "sync_policy": "async_opportunistic",
  "anonymize_pii": true,
  "cloud_capabilities": [
    "cross_plant_clustering",
    "foundation_model_distillation",
    "root_cause_reasoning_agent"
  ],
  "guarantee": "ZERO_FACTORY_BLOCKING"
}`,
    },
  },
};

export const PRODUCTS_ZH: Record<string, Product> = {
  visionstudio: {
    id: 'visionstudio',
    slug: 'visionstudio',
    name: 'VisionStudio',
    shortAction: 'Build',
    positioning: '工业视觉工程工作区',
    tagline: '构建工业视觉应用。',
    summary:
      '用于工业视觉项目设计、配置、调试、工作流构建以及工程师交互的统一工程工作区。',
    description:
      'VisionStudio 赋能视觉工程师与自动化开发者，通过直观的可视化节点图编排、实时相机标定、硬件模拟器以及交互式 AI 算法提示词工程，将复杂机器视觉检测管线的开发与调试周期从数周大幅缩短至数小时。',
    accentColor: '#06b6d4',
    badge: '构建阶段',
    highlights: [
      '可视化工作流与节点图流程编排',
      '实时帧检查器与多相机模拟视频流',
      '工业硬件通信映射（GenICam、GigE Vision、USB3）',
      '确定性管线编译与数据契约严格校验',
      '内置 AI 检测配方沙箱与算法调试',
    ],
    keyCapabilities: [
      {
        title: '可视化节点流编排',
        description:
          '零样板代码构建多阶段视觉管线。无缝连接图像采集、形态学算子、深度学习模型与工控 PLC 输出。',
        icon: 'Workflow',
      },
      {
        title: '硬件与相机精确标定',
        description:
          '原生支持工业 2D/3D 相机、频闪光源控制器与触发板，提供实时直方图、对焦清晰度评分与畸变校正。',
        icon: 'Camera',
      },
      {
        title: '交互式调试与历史回放',
        description:
          '在历史良品与缺陷数据集上单步步进执行。在不暂停产线的前提下实时检查中间图像缓冲与张量输出。',
        icon: 'Bug',
      },
      {
        title: 'SDK 与生产配方打包导出',
        description:
          '导出经过严格校验的生产级检测配方，通过标准化 SDK 契约头文件与 VisionRuntime 无缝链接。',
        icon: 'Package',
      },
    ],
    architectureRole: '工程方案设计、算法验证与检测管线编排',
    deploymentTarget: '工程师工作站（Windows, Linux, macOS）',
    connectivityRequirement: '本地工作站完全独立运行；支持可选的云端同步',
    sampleCodeOrConfig: {
      filename: 'pipeline_recipe.json',
      language: 'json',
      code: `{
  "pipeline": "pcb_surface_inspection",
  "version": "2.4.0",
  "nodes": [
    { "id": "camera_top", "type": "GenICamSource", "device": "GigE:192.168.1.10" },
    { "id": "roi_cropper", "type": "DynamicROIExtractor", "regions": 4 },
    { "id": "ai_defect_detector", "type": "EdgeTensorInference", "model": "pcb_defect_v3.engine" },
    { "id": "plc_sink", "type": "ModbusSink", "target": "PLC_LINE_01", "register": 40012 }
  ],
  "sla_max_latency_ms": 14.5
}`,
    },
  },

  visionruntime: {
    id: 'visionruntime',
    slug: 'visionruntime',
    name: 'VisionRuntime',
    shortAction: 'Run',
    positioning: '工业级生产执行引擎',
    tagline: '在生产现场稳定运行视觉应用。',
    summary:
      '高吞吐、强确定性的实时执行引擎，负责在工业生产线现场真实执行完整的机器视觉 Pipeline。',
    description:
      'VisionRuntime 基于现代 C++20 打造，专为 24/7 工业现场严苛要求设计，提供极致的吞吐量、亚毫秒级微小抖动与工业级韧性。统一承载实时图像采集、低延迟图像处理、零拷贝共享内存数据流、硬件通信和毫秒级 PLC 触发同步。',
    accentColor: '#10b981',
    badge: '运行阶段',
    highlights: [
      '亚毫秒级管线执行延迟与强确定性',
      '零拷贝共享内存帧缓冲与硬件 DMA 加速',
      '全面支持主流工业现场总线（Modbus TCP、OPC UA、EtherCAT）',
      '严苛的内存隔离与硬件级进程看门狗机制',
      'SDK 先行的通信契约接口，无专有黑盒捆绑',
    ],
    keyCapabilities: [
      {
        title: '确定性实时管线引擎',
        description:
          '专为高速传送带产线 24/7 连续运行打造，具备零内存碎片泄漏、核心亲和力绑定与确定性执行周期。',
        icon: 'Cpu',
      },
      {
        title: '工业现场总线与 I/O 精准同步',
        description:
          '通过硬实时工业协议，与工业 PLC、气动剔废阀门、光源频闪仪和光电编码器微秒级精准协同。',
        icon: 'Layers',
      },
      {
        title: '零拷贝帧缓冲架构',
        description:
          '利用 PCIe/NIC DMA 将每秒数 GB 的原始图像流直接注入目标 GPU 显存，彻底免除 CPU 主机内存冗余拷贝。',
        icon: 'Zap',
      },
      {
        title: '工业韧性与故障隔离',
        description:
          '集成硬件看门狗监视器与隔离式执行工作池，杜绝异常崩溃影响产线运转，保障车间持续正常运行。',
        icon: 'ShieldCheck',
      },
    ],
    architectureRole: '工业现场生产线实时执行、图像处理与硬件精准时序控制',
    deploymentTarget: '工业工控机（IPC）、嵌入式边缘工控盒、机架式工控服务器',
    connectivityRequirement: '100% 本地自主运行；核心执行零云端依赖',
    sampleCodeOrConfig: {
      filename: 'runtime_config.yaml',
      language: 'yaml',
      code: `runtime:
  pipeline_id: "assembly_line_inspector"
  concurrency_threads: 8
  pin_cores: [2, 3, 4, 5]
  acquisition:
    driver: "genicam"
    frame_rate_target_fps: 120
    buffer_pool_mb: 2048
  fieldbus:
    driver: "opcua"
    endpoint: "opc.tcp://192.168.10.50:4840"
  watchdog:
    heartbeat_interval_ms: 50
    fail_safe_trigger: "EJECTOR_STANDBY"`,
    },
  },

  visionedge: {
    id: 'visionedge',
    slug: 'visionedge',
    name: 'VisionEdge',
    shortAction: 'Assist',
    positioning: '工业现场智能',
    tagline: '将 AI 智能带入工厂车间。',
    summary:
      '部署在工业现场，为 VisionRuntime 提供本地 AI 能力、自动验证、智能诊断、故障回滚与实时闭环优化。',
    description:
      'VisionEdge 将前沿机器学习与自主决策能力直接引入工厂车间现场。关键保障：VisionEdge 完全在本地边缘硬件独立运行，严格无需任何外网或互联网连接——全面满足严苛工业数据安全、物理隔离网络合规，在彻底物理断网环境下稳定守护产线。',
    accentColor: '#8b5cf6',
    badge: '协同阶段',
    highlights: [
      '100% 离线自主运行——严格零互联网依赖',
      '实时微缺陷神经核验与超低误报仲裁',
      '自动检测阈值微调与环境光照/机械漂移补偿',
      '检测偏差秒级自动安全回滚至黄金配方',
      '现场故障聚类、根因诊断与边缘日志沉淀',
    ],
    keyCapabilities: [
      {
        title: '物理隔绝环境本地智能',
        description:
          '全量封闭部署在工厂边缘服务器。未经车间管理员明确策略批准，绝无任何图像或遥测数据离开本地工控内网。',
        icon: 'Shield',
      },
      {
        title: '微缺陷复核与误报剔除',
        description:
          '二级高精度神经仲裁网络对边缘模糊缺陷进行毫秒级判定，将代价昂贵的人工复检停机率降低高达 85%。',
        icon: 'CheckCircle2',
      },
      {
        title: '闭环自适应漂移补偿',
        description:
          '动态感知车间昼夜光照波动、机械震动磨损或镜头微污染，在次品产生之前自适应修正图像滤镜参数。',
        icon: 'Activity',
      },
      {
        title: '自主安全快照回滚',
        description:
          '持续监控 SPC 统计过程控制指标。一旦检测到算法偏差或异常，自动毫秒级回退至已认证的黄金检测基线。',
        icon: 'RotateCcw',
      },
    ],
    architectureRole: '现场边缘 AI 监督、根因诊断、自愈调整与闭环优化',
    deploymentTarget: '工厂本地边缘服务器、工业 GPU 工控盒（NVIDIA Jetson / x86 GPU）',
    connectivityRequirement: '100% 离线可用；专为物理隔绝（Air-Gapped）无网工厂环境设计',
    sampleCodeOrConfig: {
      filename: 'edge_policy.json',
      language: 'json',
      code: `{
  "edge_mode": "autonomous_air_gapped",
  "supervision_target": "VisionRuntime@127.0.0.1:9091",
  "local_inference_accelerator": "tensorrt_cuda",
  "offline_clustering": {
    "enabled": true,
    "max_local_buffer_days": 30
  },
  "auto_rollback_rules": {
    "false_reject_spike_threshold": 0.02,
    "consecutive_divergent_frames": 5,
    "action": "RESTORE_GOLDEN_SNAPSHOT"
  }
}`,
    },
  },

  visioncloud: {
    id: 'visioncloud',
    slug: 'visioncloud',
    name: 'VisionCloud',
    shortAction: 'Extend',
    positioning: '工业云端智能',
    tagline: '以云端智能拓展工业视觉能力。',
    summary:
      '提供云端 LLM 大模型、多厂区知识协同、高级 AI 分析、缺陷特征聚类与远程智能服务。',
    description:
      'VisionCloud 为企业级制造网络提供跨工厂洞察与全局知识沉淀。架构设计原则：VisionCloud 是一项纯粹的可选增强能力，绝非单点故障点。当外网发生网络闪断、物理隔绝或云端维护时，现场的 VisionRuntime 与 VisionEdge 依然全速稳定运转，生产绝不停滞。',
    accentColor: '#f59e0b',
    badge: '扩展阶段',
    highlights: [
      '多厂区多产线良率横向比对与效能看板',
      '工业多模态大模型智能推理与自动化根因归因',
      '跨基地微缺陷聚类分析与配方版本统一协同',
      '严格作为可选增强——现场生产运行绝不依赖云端',
      '端到端零信任加密传输与企业合规保障',
    ],
    keyCapabilities: [
      {
        title: '工业多模态大语言模型',
        description:
          '以自然语言查询产线异常、缺陷分布规律与光学调试配方。基于工业视觉专业领域大模型进行智能归因。',
        icon: 'Sparkles',
      },
      {
        title: '全局设备舰队遥测与良率对标',
        description:
          '在一个统一云端控制台纵览全球各地制造基地的检测节拍、缺陷热力分布与综合产能利用率。',
        icon: 'BarChart3',
      },
      {
        title: '配方与模型统一中心仓库',
        description:
          '沉淀认证合格的视觉检测模型，管理严格的版本发布流，并通过分阶段金丝雀策略推送到车间边缘节点。',
        icon: 'CloudUpload',
      },
      {
        title: '零停机解耦高可用架构',
        description:
          '基于异步契约解耦设计。云端维护、网络延迟或外网故障绝不阻塞工业现场的硬实时视觉检测。',
        icon: 'RefreshCw',
      },
    ],
    architectureRole: '全局知识沉淀、企业级设备舰队监控、云端多模态工业大模型',
    deploymentTarget: '多云/混合云环境（Cloudflare Workers、AWS、GCP、私有云）',
    connectivityRequirement: '可选的云端增强；工厂生产现场运行无需连接云端',
    sampleCodeOrConfig: {
      filename: 'cloud_sync_spec.json',
      language: 'json',
      code: `{
  "service": "visioncloud_sync",
  "fleet_scope": "global_enterprise",
  "sync_policy": "async_opportunistic",
  "anonymize_pii": true,
  "cloud_capabilities": [
    "cross_plant_clustering",
    "foundation_model_distillation",
    "root_cause_reasoning_agent"
  ],
  "guarantee": "ZERO_FACTORY_BLOCKING"
}`,
    },
  },
};

export const getProducts = (locale: SupportedLocale = 'en'): Product[] => {
  const dict = locale === 'zh' ? PRODUCTS_ZH : PRODUCTS_EN;
  return [dict.visionstudio, dict.visionruntime, dict.visionedge, dict.visioncloud];
};

export const getProduct = (slug: string, locale: SupportedLocale = 'en'): Product => {
  const dict = locale === 'zh' ? PRODUCTS_ZH : PRODUCTS_EN;
  return dict[slug] || dict.visionstudio;
};

// Backwards compatibility defaults
export const PRODUCTS = PRODUCTS_EN;
export const PRODUCT_LIST = [
  PRODUCTS_EN.visionstudio,
  PRODUCTS_EN.visionruntime,
  PRODUCTS_EN.visionedge,
  PRODUCTS_EN.visioncloud,
];
