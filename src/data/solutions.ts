import { Solution } from '../types';
import { SupportedLocale } from '../types/i18n';

export const SOLUTIONS_EN: Solution[] = [
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

export const SOLUTIONS_ZH: Solution[] = [
  {
    id: 'machine-vision-inspection',
    slug: 'machine-vision-inspection',
    title: '机器视觉精密缺陷检测',
    shortDescription:
      '面向离散制造业的高速、亚毫米级表面缺陷及几何尺寸测量解决方案。',
    fullDescription:
      '传统基于规则的机器视觉往往难以兼顾微小划痕、微裂纹与表面纹理波动。VISIONGO 将 VisionRuntime 的确定性 2D/3D 算子与 VisionEdge 的本地神经网络实时核验相结合，在高达 120 FPS 产线节拍下稳定识别微米级瑕疵与组装错位。',
    industry: '汽车零部件与高精密机械加工',
    keyBenefits: [
      '亚毫米级高重复定位几何测量精度',
      '真实微小缺陷抓取率达 99.8% 以上',
      '全链路检测闭环耗时小于 15 毫秒',
      '通过工业总线直连 PLC 气动剔废机构',
    ],
    recommendedStack: ['VisionStudio', 'VisionRuntime', 'VisionEdge'],
  },
  {
    id: 'ocr-document-inspection',
    slug: 'ocr-document-inspection',
    title: 'OCR 字符与工业 DPM 读码验证',
    shortDescription:
      '针对激光刻蚀 DPM 码、点阵打标码、金属雕刻序列号与保质期喷码的鲁棒识别与合规分级。',
    fullDescription:
      '在曲面反光金属、玻璃与注塑塑料表面的直接零件标识（DPM）面临严酷的反光和低对比度挑战。VISIONGO 平台结合专业预处理流水线与边缘深度学习，实现严重退化字符与二维码的高速识读与合规评级。',
    industry: '医疗器械、生物医药与高端包装',
    keyBenefits: [
      '曲面高反光低对比度金属表面鲁棒识读',
      'ISO/IEC 15415 与 AIM DPM 印刷质量自动分级评分',
      '批次字符实时光学验证（OCV）防伪与追溯',
      '本地防篡改合规审计日志追溯记录',
    ],
    recommendedStack: ['VisionStudio', 'VisionRuntime'],
  },
  {
    id: 'pcb-inspection',
    slug: 'pcb-inspection',
    title: 'PCB 与高密度电子制造 AOI 检测',
    shortDescription:
      '针对锡桥连锡、SMD 元件缺失、极性反向与冷焊虚焊的自动化光学检测。',
    fullDescription:
      '高密度表面贴装（SMT）与半导体封装要求在数以千计的微型焊点上实现毫秒级排查。VisionStudio 极大简化了多 ROI 复合配方的编排，而 VisionRuntime 与 VisionEdge 直接内嵌于贴片与回流焊机台后，实现零延迟故障截断。',
    industry: '半导体封装与 3C 消费电子制造',
    keyBenefits: [
      '单板 500+ 个微型 SMD 元件多 ROI 并行核查',
      '微米级连锡与立碑（Tombstoning）高置信度分类',
      '快速导入 CAD/Gerber 文件与坐标智能校正',
      '向贴片机给料器提供闭环漂移补偿数据',
    ],
    recommendedStack: ['VisionStudio', 'VisionRuntime', 'VisionEdge'],
  },
  {
    id: 'industrial-ai-assistance',
    slug: 'industrial-ai-assistance',
    title: '工业现场 AI 智能辅助与自愈',
    shortDescription:
      '专为车间工程师打造的现场自主诊断推理与视觉参数自愈补偿系统。',
    fullDescription:
      '当生产车间面临环境光照昼夜漂移或机械导轨磨损时，VisionEdge 自动对异常根因进行边缘分析，并执行自校准补偿。VisionCloud 则汇集跨基地的历史事件库，快速攻克长期反复出现的疑难质量瓶颈。',
    industry: '先进制造与自动化装备集成',
    keyBenefits: [
      '降低高达 85% 的虚警与误检停机率',
      '自感知光学镜头积尘与光源衰减微漂移',
      '车间本地闭环计算，严密保护核心产品 CAD 与工艺机密',
      '将平均故障修复时间（MTTR）从数小时压缩至数分钟',
    ],
    recommendedStack: ['VisionEdge', 'VisionCloud'],
  },
  {
    id: 'vision-workflow-automation',
    slug: 'vision-workflow-automation',
    title: '视觉工程工作流全流程自动化',
    shortDescription:
      '打通设计工作站、车间现场总线、MES/SCADA 制造系统与全局效能分析。',
    fullDescription:
      '打破不同相机品牌、光源驱动器与闭源专有软件的碎片化孤岛。借助统一的 VISIONGO SDK 与标准协议契约，自动化团队构建模块化、可复用的现代化视觉系统，从单个试验台无缝平滑扩展至跨国数百条自动化生产线。',
    industry: '系统集成商（SI）与集团化制造企业',
    keyBenefits: [
      '跨品牌工业相机与多传感器即插即用',
      '标准统一的 C++ 与 Python SDK 协议模式',
      '检测配方全版本控制与一键式无感产线发布',
      '通过 OPC UA 与 REST API 深度对接 MES 与工控 SCADA',
    ],
    recommendedStack: ['VisionStudio', 'VisionRuntime', 'VisionEdge', 'VisionCloud'],
  },
];

export const getSolutions = (locale: SupportedLocale = 'en'): Solution[] => {
  return locale === 'zh' ? SOLUTIONS_ZH : SOLUTIONS_EN;
};

// Backwards compatibility default
export const SOLUTIONS = SOLUTIONS_EN;
