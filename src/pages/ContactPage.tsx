import { SiteLink } from '../components/SiteLink';
import { ContactForm } from '../components/ContactForm';
import { SeoHead } from '../components/SeoHead';
import { SectionHeader } from '../components/SectionHeader';
import { useLanguage } from '../i18n/LanguageContext';

export function ContactPage() {
  const { locale } = useLanguage();
  const zh = locale === 'zh';
  return <div className="page-shell">
    <SeoHead title={zh ? '联系工程团队' : 'Contact engineering'} description={zh ? '咨询 VISIONGO 产品、试用和工业视觉部署。' : 'Discuss VISIONGO products, evaluations and industrial vision deployment.'} canonicalPath="/contact" />
    <SectionHeader as="h1" badge="VISIONGO" title={zh ? '聊聊你的检测项目' : 'Tell us about your inspection project'} description={zh ? '介绍你的检测任务和设备环境，我们会通过邮箱与你沟通。' : 'Describe your inspection task and hardware environment. We will follow up by email.'} />
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.4fr]">
      <aside className="space-y-6 text-sm leading-relaxed text-zinc-400"><h2 className="text-xl font-semibold text-white">{zh ? '直达工程团队' : 'Talk to engineering'}</h2><p>{zh ? '从 VisionStudio 工作流编排，到 VisionRuntime 现场部署，我们可以协助评估产品是否适合你的项目。' : 'From VisionStudio workflow design to VisionRuntime deployment, we can help evaluate the fit for your project.'}</p><div className="space-y-3">{['contact', 'sales', 'support'].map(name => <SiteLink key={name} href={`mailto:${name}@visiongo.app`} className="block text-emerald-400 hover:underline">{name}@visiongo.app</SiteLink>)}</div><p>{zh ? '如果暂时无法提交表单，可以直接发送邮件。' : 'If the form is unavailable, you can email us directly.'}</p></aside>
      <div className="surface-card p-6 sm:p-8"><ContactForm /></div>
    </div>
  </div>;
}
