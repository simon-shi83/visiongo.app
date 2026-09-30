import { TranslationDictionary } from '../../types/i18n';

export const zh: TranslationDictionary = {
  nav: {
    products: '产品矩阵',
    productsDropdownTitle: '工业视觉产品体系',
    solutions: '解决方案',
    developers: '开发者中心',
    downloads: '软件下载',
    resources: '技术资源',
    about: '关于我们',
    contact: '联系我们',
    contactEngineering: '联系技术团队',
    switchLanguage: '语言切换',
  },
  hero: {
    badge: '工业视觉智能',
    headlinePart1: '用 AI 构建、运行与进化 ',
    headlineHighlight: '工业视觉系统',
    headlinePart2: '。',
    subtitle:
      'VISIONGO 提供集工程设计、现场部署、生产运行与持续优化于一体的工业视觉软件平台。',
    exploreProducts: '探索产品矩阵',
    viewArchitecture: '查看系统架构',
    airGappedBadge: '工厂物理无网离线运行',
    determinismBadge: '亚毫秒级实时确定性',
    noCloudBadge: '核心生产零云端依赖',
    liveLogTitle: 'visionruntime — 产线实时工控台 — stdout',
    rtDeterminismOk: '实时确定性状态: 正常',
  },
  productsSection: {
    badge: '产品体系',
    title: '四大专注核心软件产品，构建统一工业架构',
    description:
      'VISIONGO 贯穿机器视觉全生命周期——从工程师工作区设计，到高吞吐生产现场执行，再到边缘端现场智能与云端扩展分析。',
    exploreSpecs: '查看技术规格',
    learnMore: '了解详情',
    phaseSuffix: '阶段',
  },
  architectureSection: {
    badge: '系统协同架构',
    title: '四大产品如何协同运作',
    description:
      'VisionStudio 负责工程设计，VisionRuntime 负责生产执行，VisionEdge 负责现场智能，VisionCloud 提供可选的云端扩展能力。',
    independenceTitle: '工业独立性与高韧性保证',
    independenceBadge: '物理隔离环境就绪',
    independenceDesc:
      '核心工业现场生产运行绝不依赖云端连接。专为真实工业环境设计，全面支持完全没有互联网连接的车间与工控环境。',
    zeroTelemetry: '无需任何外部网络遥测',
    factoryBoundaryTitle: '工业制造车间现场边界（100% 离线自主运行）',
    recipeExportDesc: '导出编译后的检测配方（SDK 契约规范）',
    localLoopDesc: '现场闭环控制',
    cloudSyncDesc: '可选的异步云端数据同步与知识沉淀',
    optionalLayer: '可选增强层',
    viewProductDetail: '查看该产品规格详情',
    specActive: '当前选中节点',
  },
  whySection: {
    badge: '技术价值与优势',
    title: '为何资深工业工程师选择 VISIONGO',
    description:
      '专为工控技术（OT）环境打造，绝不妥协的确定性、极低抖动与严苛的数据主权保障。',
    pillars: [
      {
        title: 'AI 辅助工程设计',
        description:
          '通过 VisionStudio 的交互式节点图、硬件仿真器与样本数据合成能力，将复杂多相机视觉检测工序的开发周期从数周缩短至数小时。',
      },
      {
        title: '现场自主智能',
        description:
          'VisionEdge 在工控机本地进行高精度神经仲裁，降低高达 85% 的误检停机率；在封闭循环中自主补偿环境光照变化与机械微位移漂移。',
      },
      {
        title: '生产级实时执行引擎',
        description:
          'VisionRuntime 基于现代 C++20 打造，具备零拷贝共享内存机制、CPU 核心亲和力绑定与亚毫秒低抖动，可 24/7 不间断承载 120 FPS 产线。',
      },
      {
        title: '云端可选解耦架构',
        description:
          '即使外网完全断开或受到严苛安全物理隔离，产线检测节拍丝毫不受影响。云端仅作为非阻塞的异步增强服务，绝非单点故障点。',
      },
      {
        title: '专为严苛工业制造设计',
        description:
          '适配标准工业工控机（IPC）、无风扇嵌入式设备或机架服务器。内建硬件看门狗保护、进程沙箱隔离与毫秒级故障自动安全回滚。',
      },
      {
        title: '开放架构与生态集成能力',
        description:
          '告别专有黑盒绑定。原生支持 GenICam、GigE Vision、USB3、Modbus TCP、OPC UA、EtherCAT，并提供开源 C++ 与 Python 统一 SDK 绑定。',
      },
    ],
  },
  solutionsSection: {
    badge: '应用场景',
    title: '专为极具挑战的工业检测任务打造',
    description:
      '从高速表面微缺陷识别，到严苛材质 DPM 读码、高密度 SMT/PCB 综合检测与工作流自动化。',
    viewSolution: '查看方案详情',
    exploreAll: '查看全部工业解决方案',
    recommendedStack: '推荐软件组合',
    performanceMetrics: '关键性能指标',
    inquireAbout: '咨询方案实现',
  },
  developersSection: {
    badge: '开发者与架构生态',
    title: '由工程师打造，服务于系统工程师',
    description:
      '基于强契约隔离、统一 SDK 协议模式以及面向开源社区的硬件驱动适配生态。',
    githubBannerTitle: '加入 VISIONGO 工业开发者生态',
    githubBannerDesc:
      '贡献自定义视觉处理算子、共享工业相机驱动实现，在 GitHub 上直接与核心系统架构师交流互动。',
    starOnGithub: '在 GitHub 上 Star',
    developerHub: '开发者中心',
    tabCpp: 'C++20 运行时算子',
    tabPython: 'Python 现场智能 Agent',
    tabSchema: 'SDK 通信契约规范',
    copyCode: '复制代码',
    copied: '已复制',
  },
  resourcesSection: {
    badge: '技术洞见与资料',
    title: '深度技术文章、开发教程与实战案例',
    description:
      '探讨零拷贝内存优化、工厂无网离线机器学习架构以及 24/7 高可用机器视觉系统的工程实现。',
    filterAll: '全部技术资料',
    readArticle: '阅读全文',
    browseAll: '浏览全部教程与工程案例',
    backToResources: '返回技术资源列表',
    requestPdf: '申请完整技术白皮书 (PDF)',
  },
  ctaBanner: {
    badge: '部署至您的工业产线',
    title: '准备好升级您的工业视觉系统了吗？',
    description:
      '感受亚毫秒确定性、车间离线 AI 智能与直观的可视化工程编排。申请评测试用包或预约架构技术研讨。',
    requestPackage: '申请试用评估包',
    directEmail: '直达技术支持: contact@visiongo.app',
  },
  aboutPage: {
    badge: '公司定位与使命',
    title: '构建下一代工业机器视觉的底层工程基石',
    description:
      '专注确定性产线自动化、低延迟零拷贝与物理隔离机器智能的“产品优先”工业软件团队。',
    brandBadge: '品牌核心主张',
    brandHeadline: '“用 AI 构建、运行并持续进化工业视觉系统。”',
    brandParagraph:
      'VISIONGO 诞生于对传统工业痛点的清醒洞察：当人工智能深刻变革云计算与消费软件时，工业生产现场依然受困于脆弱、繁琐、封闭且难以维护的传统视觉软件——调机耗时数周，生产环境微小光照扰动即导致频繁误报。我们致力于用现代化软件工程与确定性 AI 重新定义机器视觉。',
    principlesHeader: '// 核心工程研发原则',
    principle1Title: '1. 敬畏物理现实',
    principle1Desc:
      '工厂受严苛物理规律制约：微秒级流水线延迟、机械高频振动、对不可测崩溃零容忍。我们始终把系统确定性与稳定性置于首位。',
    principle2Title: '2. 纯离线物理隔离自主',
    principle2Desc:
      '关键工业制造车间必须物理无网隔离。我们的执行引擎与边缘网关绝不依赖外部广域网连通或云端许可校验，可在车间完全自主持续运转。',
    principle3Title: '3. 零私有协议绑定',
    principle3Desc:
      '所有输入输出均基于工业标准开放协议（GenICam、OPC UA、Modbus、开放 C++ SDK schemas）。工业客户与开发者对其视觉检测配方和数据拥有 100% 掌控权。',
    contactTitle: '与我们的工业系统架构师深入交流',
    contactDesc:
      '无论您是自动化装备制造商 (OEM)、机器视觉系统集成商，还是寻求智能化升级与产线标准化的先进制造企业。',
    scheduleCall: '预约架构技术咨询',
    emailEngineering: '发送技术邮件',
  },
  contactModal: {
    title: '联系 VISIONGO 技术团队',
    subtitle: '企业方案部署、PoC 产线试用与系统集成咨询',
    nameLabel: '您的姓名 *',
    namePlaceholder: '张工',
    emailLabel: '工作邮箱 *',
    emailPlaceholder: 'engineer@company.com',
    companyLabel: '公司 / 机构名称',
    companyPlaceholder: 'XX 精密制造有限公司',
    productLabel: '意向产品模块',
    allProductsOption: 'VISIONGO 全套工业视觉平台',
    messageLabel: '产线需求与技术规格简述 *',
    messagePlaceholder:
      '请简述您的检测节拍（FPS）、相机分辨率、现场工控机规格或当前面临的技术痛点...',
    submitButton: '提交咨询',
    submittingButton: '正在传输...',
    successTitle: '需求已成功送达',
    successMessage:
      '感谢您的关注！VISIONGO 工业系统架构师将在 24 小时内分析您的技术参数并与您取得联系。',
    closeWindow: '关闭窗口',
  },
  footer: {
    airGappedGuarantee: '物理无网就绪：核心工业生产零云端依赖',
    sdkPill: 'C++20 & Python 3.10+ SDK',
    jitterPill: '亚毫秒超低抖动引擎',
    autonomousPill: '边缘现场自主运行',
    missionSummary:
      '工业视觉智能（Industrial Vision Intelligence）。用 AI 构建、运行与进化工业视觉系统。专为关键制造产线与物理隔离车间环境设计。',
    primaryDomain: '官方主域名:',
    deploymentCloudflare: '全球分发: Cloudflare Global Edge Network',
    inquiriesTitle: '直接工程咨询邮箱',
    allSolutionsLink: '全部解决方案',
    aboutTitle: '资源与关于',
    enterpriseConsultation: '企业架构咨询',
    copyright: 'VISIONGO. 保留所有权利。',
    openEcosystem: '开源开发者生态',
  },
};
