import { Product } from '../types';

export const PRODUCTS: Record<string, Product> = {
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
    accentColor: '#06b6d4', // Cyan
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
    accentColor: '#10b981', // Emerald
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
    accentColor: '#8b5cf6', // Violet
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
    accentColor: '#f59e0b', // Amber
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

export const PRODUCT_LIST: Product[] = [
  PRODUCTS.visionstudio,
  PRODUCTS.visionruntime,
  PRODUCTS.visionedge,
  PRODUCTS.visioncloud,
];
