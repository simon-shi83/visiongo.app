import { SiteLink } from './SiteLink';
import { useRef, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export function ContactForm() {
  const { locale } = useLanguage();
  const zh = locale === 'zh';
  const [form, setForm] = useState({ name: '', email: '', company: '', product: 'all', message: '', websiteUrl: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const submissionId = useRef<string | null>(null);
  const submitting = useRef(false);
  const update = (field: keyof typeof form, value: string) => {
    submissionId.current = null;
    setForm(previous => ({ ...previous, [field]: value }));
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setStatus('submitting');
    setError('');
    submissionId.current ??= crypto.randomUUID();
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ ...form, locale, source: window.location.pathname, submissionId: submissionId.current }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || typeof data.referenceId !== 'string') throw new Error(data.error || (zh ? '提交失败，请稍后重试。' : 'Submission failed. Please retry.'));
      setReference(data.referenceId);
      setStatus('success');
    } catch (failure) {
      setError(failure instanceof Error && failure.name !== 'TimeoutError' ? failure.message : (zh ? '连接超时，请重试或直接发送邮件。' : 'Connection timed out. Please retry or email us.'));
      setStatus('error');
    } finally { submitting.current = false; }
  };
  if (status === 'success') return (
    <div role="status" className="space-y-4 py-8 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-white">{zh ? '咨询已保存' : 'Inquiry saved'}</h2>
      <p className="text-sm text-zinc-400">{zh ? '工程团队会通过你填写的邮箱联系你。' : 'Our engineering team will contact you at the email you provided.'}</p>
      <p className="break-all text-xs text-zinc-400">{zh ? '咨询编号：' : 'Reference: '}{reference}</p>
      <button className="btn-secondary" onClick={() => { setStatus('idle'); submissionId.current = null; setForm(previous => ({ ...previous, message: '' })); }}>{zh ? '提交另一条咨询' : 'Send another inquiry'}</button>
    </div>
  );
  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={status === 'submitting'} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="form-label">{zh ? '姓名 *' : 'Name *'}<input className="form-input" autoComplete="name" value={form.name} onChange={e => update('name', e.target.value)} required maxLength={100} /></label>
          <label className="form-label">{zh ? '邮箱 *' : 'Email *'}<input className="form-input" type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} required maxLength={254} /></label>
        </div>
        <label className="form-label">{zh ? '公司' : 'Company'}<input className="form-input" autoComplete="organization" value={form.company} onChange={e => update('company', e.target.value)} maxLength={200} /></label>
        <label className="form-label">{zh ? '关注产品' : 'Product interest'}<select className="form-input" value={form.product} onChange={e => update('product', e.target.value)}>
          <option value="all">VisionStudio + VisionRuntime</option>
          <option value="visionstudio">VisionStudio</option><option value="visionruntime">VisionRuntime</option>
          <option value="visionedge">VisionEdge</option><option value="visioncloud">VisionCloud</option>
        </select></label>
        <label className="form-label">{zh ? '项目描述 *' : 'Project description *'}<textarea className="form-input min-h-32" value={form.message} onChange={e => update('message', e.target.value)} required maxLength={5000} placeholder={zh ? '描述检测对象、相机或设备环境，以及希望解决的问题。' : 'Describe the inspection task, camera or hardware environment, and the problem you want to solve.'} /></label>
        <div className="absolute -left-[10000px]" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.websiteUrl} onChange={e => update('websiteUrl', e.target.value)} /></label></div>
        <p className="text-xs leading-relaxed text-zinc-400">{zh ? '我们使用上述信息回复本次咨询。详情见' : 'We use these details to respond to your inquiry. See our '} <SiteLink href="/privacy" className="text-emerald-400 underline">{zh ? '隐私政策' : 'privacy policy'}</SiteLink>{zh ? '。' : '.'}</p>
        <button type="submit" className="btn-primary w-full"><span>{status === 'submitting' ? (zh ? '正在提交…' : 'Submitting…') : (zh ? '提交工程咨询' : 'Contact engineering')}</span><ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
      </fieldset>
      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-500/30 p-3 text-sm text-amber-300"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" /><div>{error}<br /><SiteLink className="underline" href="mailto:contact@visiongo.app">contact@visiongo.app</SiteLink></div></div>}
    </form>
  );
}
