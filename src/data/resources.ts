import { ResourceArticle } from '../types';

export const RESOURCE_ARTICLES: ResourceArticle[] = [
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

$$\text{Throughput} = 4 \times 12\text{ MB} \times 60 \approx 2.88\text{ GB/sec} \approx 23\text{ Gbps}$$

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
