import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';
import { useLanguage } from '../i18n/LanguageContext';

export const ContactPage: React.FC = () => {
  const { locale } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    country: '',
    productInterest: 'Full VISIONGO Platform',
    projectScope: '',
    websiteUrl: '', // Honeypot field for bot spam detection
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const productOptions = [
    { value: 'Full VISIONGO Platform', label: locale === 'zh' ? 'VISIONGO 全套工业视觉平台' : 'Complete VISIONGO Platform' },
    { value: 'VisionStudio', label: 'VisionStudio — Engineering Workspace' },
    { value: 'VisionRuntime', label: 'VisionRuntime — Production Runtime' },
    { value: 'VisionEdge', label: 'VisionEdge — On-site Intelligence' },
    { value: 'VisionCloud', label: 'VisionCloud — Cloud Intelligence' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.projectScope.trim()) {
      setErrorMessage(
        locale === 'zh' ? '请填写姓名、工作邮箱与项目规格描述。' : 'Please fill in Name, Work Email, and Project Scope.'
      );
      return;
    }

    try {
      setStatus('submitting');
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setReferenceId(data.referenceId || `VG-${Date.now().toString(36).toUpperCase()}`);
      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title={locale === 'zh' ? '联系我们 / 申请演示 — VISIONGO' : 'Contact VISIONGO / Request a Demo'}
        description={
          locale === 'zh'
            ? '联系 VISIONGO 系统架构师，获取工业视觉企业部署方案、PoC 评估或产品演示。'
            : 'Get in touch with VISIONGO systems architects for enterprise deployments, PoC pilot evaluations, or an architecture walkthrough.'
        }
        canonicalPath="/contact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={locale === 'zh' ? '工程咨询与企业部署' : 'Architecture & Enterprise Pilots'}
          title={locale === 'zh' ? '联系 VISIONGO 技术团队' : 'Contact VISIONGO'}
          description={
            locale === 'zh'
              ? '无论是设备制造商、自动化系统集成商，还是寻求机器视觉产线标准化的先进制造工厂，我们的架构师将在 24 小时内与您深度交流。'
              : 'Direct communication with systems architects for OEM machine builders, automation integrators, and high-throughput production lines.'
          }
        />

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          {/* Left Column: Direct Info & Architectural Commitments */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-7 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-5 tech-grid">
              <h3 className="text-lg font-bold text-white font-mono">
                {locale === 'zh' ? '// 直达工程通道' : '// Direct Inquiries'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {locale === 'zh'
                  ? '我们是一支“产品优先”的工业系统软件团队。您的需求将由资深底层系统架构师直接评审并提供技术方案。'
                  : 'We are a product-first industrial software team. Your inquiry is reviewed directly by systems engineers and runtime architects.'}
              </p>

              <div className="space-y-3 pt-2 text-xs font-mono">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>contact@visiongo.app</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400">
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>sales@visiongo.app (Enterprise & OEM)</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400">
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>support@visiongo.app (SDK & Integrators)</span>
                </div>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-zinc-900/30 border border-zinc-800/80 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                {locale === 'zh' ? '企业级服务规范' : 'Enterprise Guarantees'}
              </h4>

              <div className="space-y-3 text-xs text-zinc-400">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{locale === 'zh' ? '24 小时内系统架构师专业回执' : 'Direct response from systems architect within 24h'}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{locale === 'zh' ? '支持现场工控机定制算力调优评估' : 'On-site IPC acceleration and pipeline benchmarking'}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Terminal className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>{locale === 'zh' ? '提供标准化 C++/Python SDK 联调样例' : 'Full C++20 and Python SDK evaluation bindings'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-2xl relative">
              {status === 'success' ? (
                <div className="py-12 text-center space-y-6 animate-fadeIn">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">
                      {locale === 'zh' ? '需求已成功提交' : 'Inquiry Successfully Transmitted'}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      {locale === 'zh'
                        ? '感谢您的关注。VISIONGO 工业系统架构师将在 24 小时内深入分析您的产线技术参数并与您取得联系。'
                        : 'Thank you for contacting VISIONGO. A systems architect will review your technical parameters and reach out within 24 hours.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono inline-block text-zinc-300">
                    {locale === 'zh' ? '工单参考编号:' : 'Reference ID:'}{' '}
                    <span className="text-emerald-400 font-bold">{referenceId}</span>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setStatus('idle');
                        setFormData({
                          name: '',
                          email: '',
                          company: '',
                          country: '',
                          productInterest: 'Full VISIONGO Platform',
                          projectScope: '',
                          websiteUrl: '',
                        });
                      }}
                      className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs transition-colors cursor-pointer"
                    >
                      {locale === 'zh' ? '提交另一条咨询' : 'Submit Another Inquiry'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Honeypot field (hidden from genuine users) */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      name="websiteUrl"
                      tabIndex={-1}
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-zinc-300 mb-1.5 font-medium">
                        {locale === 'zh' ? '您的姓名 *' : 'Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={locale === 'zh' ? '例如：张工' : 'Jane Doe'}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-zinc-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-300 mb-1.5 font-medium">
                        {locale === 'zh' ? '工作邮箱 *' : 'Work Email *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="engineer@company.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-zinc-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                        {locale === 'zh' ? '公司 / 机构名称' : 'Company'}
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder={locale === 'zh' ? '例如：XX自动化装备制造' : 'Precision Optics Ltd.'}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-zinc-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                        {locale === 'zh' ? '国家 / 地区' : 'Country / Region'}
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder={locale === 'zh' ? '例如：中国 / 德国 / 美国' : 'e.g. United States, Germany'}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-zinc-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                      {locale === 'zh' ? '意向产品与技术模块' : 'Product Interest'}
                    </label>
                    <select
                      value={formData.productInterest}
                      onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white transition-colors cursor-pointer"
                    >
                      {productOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1.5 font-medium">
                      {locale === 'zh' ? '您正在构建什么？（产线技术规格与痛点）*' : 'What are you building? (Scope & Requirements) *'}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.projectScope}
                      onChange={(e) => setFormData({ ...formData, projectScope: e.target.value })}
                      placeholder={
                        locale === 'zh'
                          ? '请简述您的检测节拍 (FPS)、相机接口 (GigE/USB3)、工控机硬件配置或目前机器视觉系统面临的稳定性挑战...'
                          : 'Describe your inspection speed, camera resolution, line throughput, IPC hardware specifications, or current vision bottlenecks...'
                      }
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-zinc-600 transition-colors"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs font-mono text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-mono text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>
                        {status === 'submitting'
                          ? locale === 'zh'
                            ? '正在传输需求...'
                            : 'Transmitting...'
                          : locale === 'zh'
                          ? '联系 VISIONGO / 申请演示'
                          : 'Contact VISIONGO / Request a Demo'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] font-mono text-zinc-500 text-center">
                    {locale === 'zh'
                      ? '我们严格遵守工业机密保密规范。无需注册账号，绝不向第三方分享您的产线数据。'
                      : 'Zero spam. No account registration required. Your industrial specifications remain confidential.'}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
