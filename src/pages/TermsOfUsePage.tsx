import React from 'react';
import { FileText, AlertTriangle, ShieldCheck, Scale, Cpu, Mail } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';
import { useLanguage } from '../i18n/LanguageContext';

export const TermsOfUsePage: React.FC = () => {
  const { locale } = useLanguage();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title={locale === 'zh' ? '使用条款 — VISIONGO' : 'Terms of Use — VISIONGO'}
        description={
          locale === 'zh'
            ? 'VISIONGO 官方网站使用条款与软件评估分发规范。明确工业软件生产授权界限与知识产权。'
            : 'Terms of Use governing the VISIONGO web platform, software evaluations, downloads, and account services.'
        }
        canonicalPath="/terms"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          as="h1"
          badge={locale === 'zh' ? '规范与授权' : 'Legal & Terms'}
          title={locale === 'zh' ? 'VISIONGO 使用条款' : 'Terms of Use'}
          description={
            locale === 'zh'
              ? '生效日期：2026年10月1日。使用本网站及下载软件包即代表您同意遵守以下条款。'
              : 'Effective Date: October 1, 2026. Please review these terms governing website access and software downloads.'
          }
        />

        <div className="prose prose-invert max-w-none text-sm text-zinc-300 space-y-10 leading-relaxed">
          {/* Section 1: Acceptance */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'zh' ? '1. 条款确认与适用范围' : '1. Acceptance of Terms'}</span>
            </h3>
            <p>
              {locale === 'zh'
                ? '欢迎访问 VISIONGO 官方网站（https://visiongo.app）。访问本网站、查阅技术资源或下载软件即表示您（“用户”或“被授权方”）无条件接受并同意遵守本使用条款。若您代表企业或机构访问，您声明并保证拥有充分授权代表该实体接受本条款。'
                : 'Welcome to the official VISIONGO website (https://visiongo.app). By accessing this site, viewing technical documents, or downloading software packages, you agree to be bound by these Terms of Use. If you represent an entity, you warrant you have the authority to bind that entity.'}
            </p>
          </div>

          {/* Section 2: CRITICAL SOFTWARE LICENSING CLAUSE */}
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>
                {locale === 'zh'
                  ? '2. 重要提示：软件下载不构成无限制生产授权'
                  : '2. Important Notice: Software Downloads Do Not Grant Production Rights'}
              </span>
            </div>
            <p className="text-zinc-300">
              {locale === 'zh'
                ? '在 /downloads 页面下载 VISIONGO 软件（包括 VisionStudio、VisionRuntime、VisionEdge）仅供技术架构评估、算力基准测试及 PoC 离线验证之用。下载行为本身不自动授予在商业工业产线上的无限制生产运行授权。'
                : 'Downloading VISIONGO software (including VisionStudio, VisionRuntime, and VisionEdge) via /downloads is provided solely for technical evaluation, pipeline testing, and pilot verification. Downloading software does NOT automatically grant unrestricted commercial production licensing rights.'}
            </p>
            <p className="text-zinc-400 text-xs">
              {locale === 'zh'
                ? '工业现场的商业正式生产部署严格依赖正式签订的商业许可协议，包括但不限于硬件加密狗 (Hardware Dongle)、工控机设备绑定许可证或企业级批量授权。未经正式商用授权，严禁将评估版本直接投入商业化连续生产。'
                : 'Commercial production deployment on factory shop floors depends on applicable commercial licensing agreements, including hardware dongles, device-bound licenses, or enterprise master agreements. Using evaluation builds in commercial production lines without an appropriate license is strictly prohibited.'}
            </p>
          </div>

          {/* Section 3: Intellectual Property */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'zh' ? '3. 知识产权与专利保留' : '3. Intellectual Property Rights'}</span>
            </h3>
            <p>
              {locale === 'zh'
                ? '本网站上的所有架构设计、算法核心、图文资料、品牌标识（VISIONGO、VisionStudio、VisionRuntime、VisionEdge、VisionCloud）均受著作权法与工业产权法律保护。除明确说明通过开放 SDK 仓库提供的协议接口头文件外，核心执行引擎二进制代码均属于专有资产，未经授权严禁逆向工程、反编译或二次分发。'
                : 'All software binaries, architectures, visual materials, and trademarks (VISIONGO, VisionStudio, VisionRuntime, VisionEdge, VisionCloud) are the intellectual property of VISIONGO. Except for standardized public SDK schemas, core runtimes are proprietary. Unauthorized reverse-engineering, decompilation, or redistribution is strictly prohibited.'}
            </p>
          </div>

          {/* Section 4: Acceptable Use */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'zh' ? '4. 网站规范与可接受使用' : '4. Acceptable Use of Website & APIs'}</span>
            </h3>
            <p>
              {locale === 'zh'
                ? '您同意不滥用本网站及其边缘服务，包括但不限于：'
                : 'You agree not to misuse our website or edge APIs, including but not limited to:'}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>{locale === 'zh' ? '利用自动化爬虫对下载端点发起 DoS 流量攻击或无节制消耗带宽；' : 'Launching DoS attacks or excessive automated downloads against our distribution endpoints;'}</li>
              <li>{locale === 'zh' ? '篡改 API 请求参数或尝试绕过私有仓库身份凭据隔离机制；' : 'Tampering with API endpoints or attempting to bypass repository authentication barriers;'}</li>
              <li>{locale === 'zh' ? '向咨询表单发送未经许可的垃圾广告或恶意注入脚本。' : 'Submitting spam or malicious payloads through technical contact forms.'}</li>
            </ul>
          </div>

          {/* Section 5: Disclaimers & Limitation of Liability */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'zh' ? '5. 免责声明与责任限制' : '5. Disclaimers & Limitation of Liability'}</span>
            </h3>
            <p className="text-zinc-400">
              {locale === 'zh'
                ? '本网站的技术说明与评估下载按“原样 (AS IS)”提供。鉴于工业现场硬件振动、光照与工控机系统的复杂性，在签署正式 SLA 服务级别协议前，VISIONGO 不对任何间接停机、产线良率波动承担赔偿责任。'
                : 'This website and evaluation binaries are provided "AS IS". Given the physical complexities of factory automation, camera optics, and vibration, VISIONGO shall not be liable for indirect downtime or production divergence in the absence of a signed commercial Service Level Agreement (SLA).'}
            </p>
          </div>

          {/* Section 6: Contact */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'zh' ? '6. 商用授权咨询' : '6. Enterprise Licensing & Legal Inquiries'}</span>
            </h4>
            <p className="text-xs text-zinc-400">
              {locale === 'zh'
                ? '关于商用产线部署授权、硬件加密狗采购或 OEM 定制合作，请直接联系商务与授权团队：'
                : 'For commercial production licensing, hardware dongle procurement, or OEM integration agreements, please contact our enterprise team:'}
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-400">
              <a href="mailto:sales@visiongo.app" className="hover:underline">
                sales@visiongo.app
              </a>{' '}
              <span className="text-zinc-600">|</span>{' '}
              <a href="mailto:contact@visiongo.app" className="hover:underline text-zinc-300">
                contact@visiongo.app
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
