import { SiteLink } from '../components/SiteLink';
import { ArrowRight } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { SectionHeader } from '../components/SectionHeader';
import { useLanguage } from '../i18n/LanguageContext';

export function DevelopersPage(_props: { onNavigate?: (path: string) => void }) {
  const { locale } = useLanguage();
  const zh = locale === 'zh';
  const sections = [
    { id: 'quickstart', title: zh ? '快速开始' : 'Quickstart', text: zh ? '选择适合系统与架构的发行包，按随包文档安装 Studio 和 Runtime，确认连接后用项目样本构建并验证检测流程。' : 'Choose packages for your OS and architecture, install Studio and Runtime using the bundled instructions, verify connectivity and validate a workflow with project samples.', href: '/resources/getting-started' },
    { id: 'docs', title: zh ? '工程与部署' : 'Engineering and deployment', text: zh ? '明确工作站、执行设备、驱动与联网依赖。生产控制保留权限、审批、验证和回滚边界。' : 'Define workstation, execution device, driver and connectivity dependencies. Keep permission, approval, validation and rollback boundaries for production control.', href: '/resources/local-deployment' },
    { id: 'sdk', title: zh ? 'SDK 公共契约' : 'Public SDK contracts', text: zh ? 'SDK 是应用间通信的公共契约源。C++ DTO 由 schema 生成；契约变更需先生成、校验并检查生产者与消费者兼容性。' : 'The SDK is the shared contract source for communication between applications. C++ DTOs are generated from schemas. Contract changes require generation, validation and producer/consumer compatibility checks.', href: '/resources/sdk-contracts' },
    { id: 'api', title: zh ? '接口与集成' : 'Interfaces and integration', text: zh ? '接口可用性与设备支持以实际版本、SDK 契约及发行文档为准。集成前明确数据来源、权限与失败行为；联系工程团队确认项目需求。' : 'Interface availability and device support depend on the release, public SDK contracts and release documentation. Confirm data sources, permissions and failure behavior before integration. Contact engineering about project requirements.', href: '/contact' },
    { id: 'examples', title: zh ? '流程调试' : 'Workflow debugging', text: zh ? '沿节点检查输入、输出、ROI 与参数，使用代表性样本分析结果与耗时。工程示例不替代生产验证。' : 'Inspect node inputs, outputs, ROI and parameters. Use representative samples to analyze results and processing costs. Engineering examples do not replace production validation.', href: '/resources/workflow-debugging' },
  ];
  return <div className="page-shell"><SeoHead title={zh ? '开发者与快速开始' : 'Developers — Getting started'} description={zh ? '下载、连接并调试 Studio 与 Runtime，了解 SDK 公共契约。' : 'Download, connect and debug Studio and Runtime, and understand public SDK contracts.'} canonicalPath="/developers" /><SectionHeader as="h1" badge="VISIONGO" title={zh ? '从第一个检测流程开始' : 'Start with your first workflow'} description={zh ? '安装与使用指引，以及工程集成需要了解的契约边界。' : 'Installation and workflow guidance, with contract boundaries for engineering integration.'} /><nav aria-label={zh ? '开发者指南' : 'Developer guides'} className="mb-8 flex flex-wrap gap-3">{sections.map(section => <SiteLink className="btn-secondary" key={section.id} href={`#${section.id}`}>{section.title}</SiteLink>)}</nav><div className="mx-auto max-w-4xl space-y-6">{sections.map(section => <section key={section.id} id={section.id} className="surface-card p-6 sm:p-8"><h2 className="text-2xl font-semibold text-white">{section.title}</h2><p className="mt-4 leading-relaxed text-zinc-400">{section.text}</p><SiteLink className="mt-5 inline-flex items-center gap-2 text-sm text-emerald-400" href={section.href}>{zh ? '继续了解' : 'Learn more'}<ArrowRight className="h-4 w-4" /></SiteLink></section>)}</div></div>;
}
