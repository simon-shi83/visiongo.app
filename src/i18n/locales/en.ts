import { TranslationDictionary } from '../../types/i18n';

export const en: TranslationDictionary = {
  nav: {
    products: 'Products',
    productsDropdownTitle: 'Industrial Vision Suite',
    solutions: 'Solutions',
    developers: 'Developers',
    downloads: 'Downloads',
    resources: 'Resources',
    about: 'About',
    contact: 'Contact',
    contactEngineering: 'Contact Engineering',
    switchLanguage: 'Language',
  },
  hero: {
    badge: 'Industrial Vision Intelligence',
    headlinePart1: 'Build, run, and improve ',
    headlineHighlight: 'industrial vision systems',
    headlinePart2: ' with AI.',
    subtitle:
      'VISIONGO provides an integrated software platform for engineering, deploying, operating, and improving industrial vision systems.',
    exploreProducts: 'Explore Products',
    viewArchitecture: 'View Architecture',
    airGappedBadge: 'Air-gapped factory execution',
    determinismBadge: 'Sub-millisecond determinism',
    noCloudBadge: 'Zero cloud dependency',
    liveLogTitle: 'visionruntime — assembly_line_01 — stdout',
    rtDeterminismOk: 'RT Determinism: OK',
  },
  productsSection: {
    badge: 'Product System',
    title: 'Four Focused Software Products. One Unified Architecture.',
    description:
      'VISIONGO unifies the complete machine vision lifecycle—from engineering workstation design to high-throughput production lines, on-site edge intelligence, and optional cloud analytics.',
    exploreSpecs: 'Explore specifications',
    learnMore: 'Learn more',
    phaseSuffix: 'Phase',
  },
  architectureSection: {
    badge: 'System Architecture',
    title: 'How They Work Together',
    description:
      'Engineering design in VisionStudio. Hard real-time execution in VisionRuntime. Autonomous edge diagnostics in VisionEdge. Optional cloud insights in VisionCloud.',
    independenceTitle: 'Industrial Independence Guarantee',
    independenceBadge: 'AIR-GAPPED READY',
    independenceDesc:
      'Core industrial operation does not depend on the cloud. Designed for real industrial environments, including plant floors without Internet access.',
    zeroTelemetry: 'Zero External Telemetry Needed',
    factoryBoundaryTitle: 'Factory Floor Boundary (100% Offline Capable)',
    recipeExportDesc: 'Compiled Recipe Export (SDK Schemas)',
    localLoopDesc: 'Local Loop',
    cloudSyncDesc: 'Optional Cloud Telemetry & Asynchronous Sync',
    optionalLayer: 'OPTIONAL LAYER',
    viewProductDetail: 'View Product Detail',
    specActive: 'Node Active',
  },
  whySection: {
    badge: 'Industrial Advantages',
    title: 'Why Industrial Engineers Choose VISIONGO',
    description:
      'Purpose-built for operational technology (OT), uncompromising determinism, and data sovereignty.',
    pillars: [
      {
        title: 'AI-Assisted Engineering',
        description:
          'Accelerate recipe creation and multi-camera calibration with interactive visual workflows, hardware simulators, and synthetic defect augmentation in VisionStudio.',
      },
      {
        title: 'On-Site Intelligence',
        description:
          'Local neural arbitration by VisionEdge eliminates up to 85% of false-reject line stops. Compensate for illumination shifts and mechanical drift in closed loop.',
      },
      {
        title: 'Production-Grade Runtime',
        description:
          'Engineered in modern C++ with zero-copy shared memory, core affinity thread pinning, and sub-millisecond determinism capable of running 24/7 at up to 120 FPS.',
      },
      {
        title: 'Cloud-Optional Architecture',
        description:
          'Factory lines continue uninterrupted even if WAN connectivity is severed. Cloud is an optional asynchronous enhancement, never a single point of failure.',
      },
      {
        title: 'Designed for Industrial Environments',
        description:
          'Deploy on standard industrial PCs, fanless edge appliances, or rackmount servers. Built-in hardware watchdogs, process isolation, and automated fail-safe rollback.',
      },
      {
        title: 'Open Integration Capability',
        description:
          'Avoid proprietary lock-in. Direct protocol connectivity with GenICam, GigE Vision, USB3, Modbus TCP, OPC UA, EtherCAT, and open C++/Python SDK bindings.',
      },
    ],
  },
  solutionsSection: {
    badge: 'Applications',
    title: 'Engineered for Demanding Inspection Tasks',
    description:
      'From high-speed surface defect detection to automated optical inspection and DPM code reading.',
    viewSolution: 'View Solution',
    exploreAll: 'Explore All Industrial Solutions',
    recommendedStack: 'Recommended Software Stack',
    performanceMetrics: 'Key Performance Metrics',
    inquireAbout: 'Inquire About',
  },
  developersSection: {
    badge: 'Developer Ecosystem',
    title: 'Built by Engineers, for Engineers',
    description:
      'Extensible architecture with standardized SDK protocols, verified schemas, and open community drivers.',
    githubBannerTitle: 'Join the VISIONGO Developer Ecosystem',
    githubBannerDesc:
      'Contribute custom inspection operators, share industrial camera drivers, and interact directly with core systems engineers on GitHub.',
    starOnGithub: 'Star on GitHub',
    developerHub: 'Developer Hub',
    tabCpp: 'C++20 Runtime Node',
    tabPython: 'Python Edge Agent',
    tabSchema: 'SDK Schema Contract',
    copyCode: 'Copy Code',
    copied: 'Copied',
  },
  resourcesSection: {
    badge: 'Engineering Insights',
    title: 'Technical Resources & Architecture Notes',
    description:
      'In-depth analysis of zero-copy buffers, air-gapped machine learning, and high-uptime industrial software engineering.',
    filterAll: 'All Resources',
    readArticle: 'Read Article',
    browseAll: 'Browse All Tutorials & Case Studies',
    backToResources: 'Back to Resources',
    requestPdf: 'Request Full Technical PDF',
  },
  ctaBanner: {
    badge: 'Deploy on Your Production Line',
    title: 'Ready to upgrade your industrial vision systems?',
    description:
      'Experience sub-millisecond determinism, air-gapped on-site AI, and intuitive visual pipeline engineering. Request an evaluation license or schedule an architecture consultation.',
    requestPackage: 'Request Evaluation Package',
    directEmail: 'Direct: contact@visiongo.app',
  },
  aboutPage: {
    badge: 'Company & Mission',
    title: 'Engineering the Future of Industrial Vision Intelligence',
    description:
      'A product-first software organization dedicated to deterministic factory automation and air-gapped machine intelligence.',
    brandBadge: 'Brand Core Statement',
    brandHeadline: '“Build, run, and improve industrial vision systems with AI.”',
    brandParagraph:
      'VISIONGO was founded on a simple realization: while artificial intelligence has transformed the web and enterprise software, industrial shop floors remain burdened with brittle, hard-to-maintain, closed vision software that takes weeks to configure and breaks upon minor environmental variations.',
    principlesHeader: '// Core Engineering Principles',
    principle1Title: '1. Respect Physical Reality',
    principle1Desc:
      'Factories operate under strict physical laws: microsecond conveyor latencies, high vibration, and zero tolerance for random crashes. We design for determinism first.',
    principle2Title: '2. Air-Gapped Autonomy',
    principle2Desc:
      'Critical manufacturing facilities are strictly air-gapped. Our runtime and edge intelligence never assume an active WAN uplink or external license heartbeat to function.',
    principle3Title: '3. Zero Proprietary Lock-In',
    principle3Desc:
      'All communications adhere to open protocols (GenICam, OPC UA, Modbus, open C++ SDK schemas). Industrial developers maintain total ownership of their inspection recipes and datasets.',
    contactTitle: 'Get in Touch with our Systems Architects',
    contactDesc:
      'Whether you are an OEM machine builder, an automation system integrator, or an enterprise manufacturer seeking to standardize machine vision pipelines.',
    scheduleCall: 'Schedule Architecture Call',
    emailEngineering: 'Email Engineering',
  },
  contactModal: {
    title: 'Contact VISIONGO Engineering',
    subtitle: 'Enterprise deployment, pilots, and architecture inquiries',
    nameLabel: 'Your Name *',
    namePlaceholder: 'Jane Doe',
    emailLabel: 'Work Email *',
    emailPlaceholder: 'jane@company.com',
    companyLabel: 'Company / Organization',
    companyPlaceholder: 'Precision Optics Ltd.',
    productLabel: 'Area of Interest',
    allProductsOption: 'Full VISIONGO Platform',
    messageLabel: 'Project Scope & Technical Details *',
    messagePlaceholder:
      'Tell us about your inspection speed, camera resolution, line throughput, or specific challenges...',
    submitButton: 'Send Inquiry',
    submittingButton: 'Transmitting...',
    successTitle: 'Message Transmitted',
    successMessage:
      'Thank you for your interest. A VISIONGO systems architect will review your technical requirements and follow up within 24 hours.',
    closeWindow: 'Close Window',
  },
  footer: {
    airGappedGuarantee: 'AIR-GAPPED READY: ZERO FACTORY CLOUD DEPENDENCY',
    sdkPill: 'C++20 & Python 3.10+ SDK',
    jitterPill: 'Sub-ms Jitter Engine',
    autonomousPill: 'Edge Autonomous',
    missionSummary:
      'Industrial Vision Intelligence. Build, run, and improve industrial vision systems with AI. Engineered for mission-critical manufacturing and air-gapped factory floors.',
    primaryDomain: 'Primary Domain:',
    deploymentCloudflare: 'Deployment: Cloudflare Global Edge Network',
    inquiriesTitle: 'Direct Engineering Inquiries',
    allSolutionsLink: 'All Solutions',
    aboutTitle: 'Resources & About',
    enterpriseConsultation: 'Enterprise Consultation',
    copyright: 'VISIONGO. Industrial Vision Intelligence. All rights reserved.',
    openEcosystem: 'Open Source Ecosystem',
  },
};
