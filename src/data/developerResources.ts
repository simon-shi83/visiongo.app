import { SupportedLocale } from '../types/i18n';

export interface DeveloperResource {
  id: string;
  title: string;
  badge: string;
  description: string;
  icon: string;
  link: string;
  actionText: string;
  isExternal?: boolean;
}

export const DEVELOPER_RESOURCES_EN: DeveloperResource[] = [
  {
    id: 'documentation',
    title: 'Architecture & Documentation',
    badge: 'Docs',
    description:
      'In-depth technical guides covering pipeline design, determinism guarantees, zero-copy buffer pools, and deployment topology.',
    icon: 'BookOpen',
    link: '/developers#docs',
    actionText: 'Browse Documentation',
  },
  {
    id: 'sdk-contracts',
    title: 'Standardized SDK & Schemas',
    badge: 'SDK',
    description:
      'Unified C++ and Python contract libraries. All cross-module and network communications adhere strictly to single-source protocol schemas.',
    icon: 'Code2',
    link: '/developers#sdk',
    actionText: 'Explore SDK',
  },
  {
    id: 'api-reference',
    title: 'Runtime & Fieldbus APIs',
    badge: 'API',
    description:
      'Complete API reference for OPC UA nodes, Modbus register mappings, REST management endpoints, and real-time streaming sockets.',
    icon: 'Terminal',
    link: '/developers#api',
    actionText: 'View API Reference',
  },
  {
    id: 'github-ecosystem',
    title: 'GitHub Ecosystem & Community',
    badge: 'Open Ecosystem',
    description:
      'Collaborate with developers, star the project, report issues, and explore open-source adapters and sample hardware drivers on GitHub.',
    icon: 'Github',
    link: 'https://github.com/simon-shi83/website',
    actionText: 'Visit GitHub',
    isExternal: true,
  },
  {
    id: 'examples-templates',
    title: 'Production Recipes & Examples',
    badge: 'Examples',
    description:
      'Ready-to-deploy inspection templates: surface defect detection, OCR reading, multi-camera 3D calibration, and automated PLC handshakes.',
    icon: 'FileCode2',
    link: '/developers#examples',
    actionText: 'View Recipes',
  },
  {
    id: 'release-notes',
    title: 'Release Notes & Changelog',
    badge: 'Releases',
    description:
      'Stay updated with the latest performance optimizations, new industrial camera drivers, edge neural operators, and security patches.',
    icon: 'History',
    link: '/resources#releases',
    actionText: 'Read Changelog',
  },
];

export const DEVELOPER_RESOURCES_ZH: DeveloperResource[] = [
  {
    id: 'documentation',
    title: '系统架构与技术文档',
    badge: '文档',
    description:
      '深入的技术规范与指南：涵盖流水线设计、实时确定性指标、零拷贝内存缓冲池与物理隔离部署拓扑。',
    icon: 'BookOpen',
    link: '/developers#docs',
    actionText: '浏览开发文档',
  },
  {
    id: 'sdk-contracts',
    title: '标准化 SDK 与协议契约',
    badge: 'SDK',
    description:
      '统一的 C++ 与 Python 契约库。跨进程与跨网络通信严格遵循单一来源的可执行 schema 规范，彻底杜绝隐式耦合。',
    icon: 'Code2',
    link: '/developers#sdk',
    actionText: '探索 SDK 规范',
  },
  {
    id: 'api-reference',
    title: '运行时与现场总线 API',
    badge: 'API',
    description:
      '完整的 API 参数参考：OPC UA 信息模型、Modbus 寄存器映射、REST 运维管理端点与实时图像数据流 Socket。',
    icon: 'Terminal',
    link: '/developers#api',
    actionText: '查看 API 参考',
  },
  {
    id: 'github-ecosystem',
    title: 'GitHub 开发者社区生态',
    badge: '开源生态',
    description:
      '与全球视觉开发者协同交流、点赞支持项目、提交 Issue，探索开源硬件适配器与主流相机厂商驱动。',
    icon: 'Github',
    link: 'https://github.com/simon-shi83/website',
    actionText: '前往 GitHub 仓库',
    isExternal: true,
  },
  {
    id: 'examples-templates',
    title: '生产级配方与模板范例',
    badge: '工程范例',
    description:
      '开箱即用的检测配方范例：高反光表面微缺陷检测、DPM 字符识别、多相机 3D 空间标定以及 PLC 握手时序。',
    icon: 'FileCode2',
    link: '/developers#examples',
    actionText: '查看检测配方',
  },
  {
    id: 'release-notes',
    title: '版本发布日志与更新历程',
    badge: '发布日志',
    description:
      '持续获取引擎底层性能升级动态、新增相机厂商驱动支持、边缘神经网络算子优化与长期支持版维护说明。',
    icon: 'History',
    link: '/resources#releases',
    actionText: '阅读发版日志',
  },
];

export const getDeveloperResources = (locale: SupportedLocale = 'en'): DeveloperResource[] => {
  return locale === 'zh' ? DEVELOPER_RESOURCES_ZH : DEVELOPER_RESOURCES_EN;
};

export const getArchitectureNote = (locale: SupportedLocale = 'en') => {
  if (locale === 'zh') {
    return {
      headline: '内部技术架构说明',
      text: 'VisionAgent 体系由 VisionStudio、VisionRuntime、VisionEdge 和 VisionCloud 四大子系统协同构成。',
      subtext:
        '四大模块间的所有跨进程与网络通信均统一通过 SDK 提供的公共协议契约与接口实现，确保严格的依赖隔离与工业现场韧性。',
    };
  }
  return {
    headline: 'Internal Architecture Overview',
    text: 'The VisionAgent system consists of VisionStudio, VisionRuntime, VisionEdge, and VisionCloud.',
    subtext:
      'All inter-subsystem data contracts and communications are isolated through standardized SDK protocols, ensuring zero direct source coupling and air-gapped factory resilience.',
  };
};

export const DEVELOPER_RESOURCES = DEVELOPER_RESOURCES_EN;
export const ARCHITECTURE_TECHNICAL_NOTE = getArchitectureNote('en');
