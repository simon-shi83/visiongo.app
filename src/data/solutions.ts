import { Solution } from '../types';

export const SOLUTIONS: Solution[] = [
  {
    id: 'machine-vision-inspection',
    slug: 'machine-vision-inspection',
    title: 'Machine Vision Inspection',
    shortDescription:
      'High-speed, sub-millimeter precision surface and dimensional defect detection for discrete manufacturing.',
    fullDescription:
      'Traditional rule-based computer vision often struggles with surface texture variations, scratches, and micro-defects. VISIONGO combines deterministic 2D/3D algorithms in VisionRuntime with local neural verification in VisionEdge to detect microscopic scratches, dents, and assembly errors at up to 120 FPS.',
    industry: 'Automotive & Precision Machining',
    keyBenefits: [
      'Sub-millimeter dimensional measurement accuracy',
      'Over 99.8% true defect capture rate',
      'Under 15ms end-to-end inspection cycle time',
      'Direct PLC reject gate triggering via fieldbus',
    ],
    recommendedStack: ['VisionStudio', 'VisionRuntime', 'VisionEdge'],
  },
  {
    id: 'ocr-document-inspection',
    slug: 'ocr-document-inspection',
    title: 'OCR & Industrial Code Inspection',
    shortDescription:
      'Robust reading and validation of laser-etched DPM, dot-peen codes, serial numbers, and expiry stamps on challenging surfaces.',
    fullDescription:
      'Direct Part Marking (DPM) on curved metal, reflective glass, and stamped plastic presents extreme lighting and contrast challenges. The VISIONGO platform integrates specialized pre-processing pipelines with edge deep learning to decode degraded codes and verify critical regulatory compliance.',
    industry: 'Pharmaceuticals, Medical Devices, Packaging',
    keyBenefits: [
      'Resilient reading on low-contrast curved metallic surfaces',
      'ISO/IEC 15415 and AIM DPM quality grade scoring',
      'Real-time optical character verification (OCV) for batch validation',
      'Audit trail logging with tamper-resistant local records',
    ],
    recommendedStack: ['VisionStudio', 'VisionRuntime'],
  },
  {
    id: 'pcb-inspection',
    slug: 'pcb-inspection',
    title: 'PCB & Electronics Inspection',
    shortDescription:
      'Automated optical inspection (AOI) for solder bridges, missing SMD components, polarity reversal, and cold joints.',
    fullDescription:
      'High-density SMT and PCB manufacturing requires ultra-fast inspection across thousands of solder points and miniature components. VisionStudio accelerates complex multi-ROI recipe creation, while VisionRuntime and VisionEdge achieve zero-latency fault isolation directly inline with SMT placement machines.',
    industry: 'Electronics & Semiconductor Manufacturing',
    keyBenefits: [
      'Simultaneous multi-ROI inspection of 500+ SMD components per board',
      'Microscopic solder bridge and tombstoning classification',
      'Rapid CAD/Gerber file import and coordinate alignment',
      'Closed-loop feedback to pick-and-place placement feeders',
    ],
    recommendedStack: ['VisionStudio', 'VisionRuntime', 'VisionEdge'],
  },
  {
    id: 'industrial-ai-assistance',
    slug: 'industrial-ai-assistance',
    title: 'Industrial AI Assistance',
    shortDescription:
      'On-site autonomous diagnostic reasoning and self-healing vision parameter adjustments for plant engineers.',
    fullDescription:
      'When production lines face environmental drift—such as ambient light fluctuations or mechanical wear—VisionEdge automatically diagnoses the root cause and recommends or executes calibrated compensations. VisionCloud provides cross-plant historical incident reasoning to resolve recurring bottlenecks.',
    industry: 'Advanced Manufacturing & Automation',
    keyBenefits: [
      'Eliminates up to 85% of false-reject nuisance stops',
      'Self-diagnoses optical degradation and lighting wear',
      'Local edge operation protects proprietary CAD and product designs',
      'Accelerates mean time to repair (MTTR) from hours to minutes',
    ],
    recommendedStack: ['VisionEdge', 'VisionCloud'],
  },
  {
    id: 'vision-workflow-automation',
    slug: 'vision-workflow-automation',
    title: 'Vision Workflow Automation',
    shortDescription:
      'End-to-end integration uniting design workstations, factory fieldbuses, MES systems, and cloud analytics.',
    fullDescription:
      'Standardize the fragmented landscape of camera brands, lighting controllers, and proprietary software. With VISIONGO SDK and open schemas, automation teams build modular, maintainable vision applications that scale seamlessly from a single test bench to hundreds of production lines worldwide.',
    industry: 'System Integrators & Enterprise Automation',
    keyBenefits: [
      'Vendor-agnostic camera and sensor connectivity',
      'Standardized C++ and Python SDK protocol contracts',
      'Version-controlled inspection recipes with instant deployment',
      'Seamless MES/SCADA integration via OPC UA and REST APIs',
    ],
    recommendedStack: ['VisionStudio', 'VisionRuntime', 'VisionEdge', 'VisionCloud'],
  },
];
