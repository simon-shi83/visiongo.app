export type SupportedLocale = 'en' | 'zh';

export interface LanguageInfo {
  code: SupportedLocale;
  label: string;
  nativeName: string;
  flagCode?: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'zh', label: 'Chinese', nativeName: '简体中文' },
];

export interface TranslationDictionary {
  nav: {
    products: string;
    productsDropdownTitle: string;
    solutions: string;
    developers: string;
    resources: string;
    about: string;
    contactEngineering: string;
    switchLanguage: string;
  };
  hero: {
    badge: string;
    headlinePart1: string;
    headlineHighlight: string;
    headlinePart2: string;
    subtitle: string;
    exploreProducts: string;
    viewArchitecture: string;
    airGappedBadge: string;
    determinismBadge: string;
    noCloudBadge: string;
    liveLogTitle: string;
    rtDeterminismOk: string;
  };
  productsSection: {
    badge: string;
    title: string;
    description: string;
    exploreSpecs: string;
    learnMore: string;
    phaseSuffix: string;
  };
  architectureSection: {
    badge: string;
    title: string;
    description: string;
    independenceTitle: string;
    independenceBadge: string;
    independenceDesc: string;
    zeroTelemetry: string;
    factoryBoundaryTitle: string;
    recipeExportDesc: string;
    localLoopDesc: string;
    cloudSyncDesc: string;
    optionalLayer: string;
    viewProductDetail: string;
    specActive: string;
  };
  whySection: {
    badge: string;
    title: string;
    description: string;
    pillars: {
      title: string;
      description: string;
    }[];
  };
  solutionsSection: {
    badge: string;
    title: string;
    description: string;
    viewSolution: string;
    exploreAll: string;
    recommendedStack: string;
    performanceMetrics: string;
    inquireAbout: string;
  };
  developersSection: {
    badge: string;
    title: string;
    description: string;
    githubBannerTitle: string;
    githubBannerDesc: string;
    starOnGithub: string;
    developerHub: string;
    tabCpp: string;
    tabPython: string;
    tabSchema: string;
    copyCode: string;
    copied: string;
  };
  resourcesSection: {
    badge: string;
    title: string;
    description: string;
    filterAll: string;
    readArticle: string;
    browseAll: string;
    backToResources: string;
    requestPdf: string;
  };
  ctaBanner: {
    badge: string;
    title: string;
    description: string;
    requestPackage: string;
    directEmail: string;
  };
  aboutPage: {
    badge: string;
    title: string;
    description: string;
    brandBadge: string;
    brandHeadline: string;
    brandParagraph: string;
    principlesHeader: string;
    principle1Title: string;
    principle1Desc: string;
    principle2Title: string;
    principle2Desc: string;
    principle3Title: string;
    principle3Desc: string;
    contactTitle: string;
    contactDesc: string;
    scheduleCall: string;
    emailEngineering: string;
  };
  contactModal: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    productLabel: string;
    allProductsOption: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitButton: string;
    submittingButton: string;
    successTitle: string;
    successMessage: string;
    closeWindow: string;
  };
  footer: {
    airGappedGuarantee: string;
    sdkPill: string;
    jitterPill: string;
    autonomousPill: string;
    missionSummary: string;
    primaryDomain: string;
    deploymentCloudflare: string;
    inquiriesTitle: string;
    allSolutionsLink: string;
    aboutTitle: string;
    enterpriseConsultation: string;
    copyright: string;
    openEcosystem: string;
  };
}
