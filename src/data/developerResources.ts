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

export const DEVELOPER_RESOURCES: DeveloperResource[] = [
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

export const ARCHITECTURE_TECHNICAL_NOTE = {
  headline: 'Internal Architecture Overview',
  text: 'The VisionAgent system consists of VisionStudio, VisionRuntime, VisionEdge, and VisionCloud.',
  subtext:
    'All inter-subsystem data contracts and communications are isolated through the standardized SDK protocols, ensuring zero direct source coupling and air-gapped factory resilience.',
};
