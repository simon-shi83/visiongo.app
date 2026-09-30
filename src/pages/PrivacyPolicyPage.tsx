import React from 'react';
import { Shield, Lock, Eye, Server, Mail } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { SeoHead } from '../components/SeoHead';
import { useLanguage } from '../i18n/LanguageContext';

export const PrivacyPolicyPage: React.FC = () => {
  const { locale } = useLanguage();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-28 pb-24">
      <SeoHead
        title={locale === 'zh' ? '隐私政策 — VISIONGO' : 'Privacy Policy — VISIONGO'}
        description={
          locale === 'zh'
            ? 'VISIONGO 官方网站与软件分发隐私政策。遵循数据最小化原则，杜绝非必要的个人信息收集。'
            : 'VISIONGO privacy policy governing our website, software downloads, download analytics, and optional Google authentication.'
        }
        canonicalPath="/privacy"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={locale === 'zh' ? '透明与安全' : 'Transparency & Privacy'}
          title={locale === 'zh' ? 'VISIONGO 隐私政策' : 'Privacy Policy'}
          description={
            locale === 'zh'
              ? '生效日期：2026年10月1日。我们坚持数据最小化原则，尊重工业客户的数据主权与个人隐私。'
              : 'Effective Date: October 1, 2026. Built on strict data minimization principles for industrial privacy.'
          }
        />

        <div className="prose prose-invert max-w-none text-sm text-zinc-300 space-y-10 leading-relaxed">
          {/* Section 1: Overview & Philosophy */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
              <Shield className="w-4 h-4" />
              <span>{locale === 'zh' ? '1. 我们的核心隐私原则' : '1. Core Privacy Philosophy'}</span>
            </div>
            <p>
              {locale === 'zh'
                ? 'VISIONGO（下称“我们”）专注于工业机器视觉智能软件的研发与部署。我们不从事任何以用户数据为导向的商业广告变现。无论您是在线浏览我们的产品规格，还是下载我们的工控机安装包，我们均遵循最严苛的数据最小化原则。'
                : 'VISIONGO ("we", "us", or "our") develops industrial machine vision software. We do not sell user data or engage in advertising tracking. Whether you are exploring our architecture or downloading software binaries, our infrastructure is built strictly on data minimization.'}
            </p>
          </div>

          {/* Section 2: Anonymous Downloads & Telemetry */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'zh' ? '2. 软件下载与下载遥测' : '2. Software Downloads & Anonymous Analytics'}</span>
            </h3>
            <p>
              {locale === 'zh'
                ? '下载 VISIONGO 软件（包括 VisionStudio、VisionRuntime、VisionEdge）完全开放，无需强制注册或登录账号：'
                : 'Downloading VISIONGO software (VisionStudio, VisionRuntime, VisionEdge) is completely anonymous and does not require an account:'}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>
                <strong>{locale === 'zh' ? '不存储原始 IP 地址：' : 'Zero Raw IP Storage: '}</strong>
                {locale === 'zh'
                  ? '为了解各产品的下载频次并防止恶意滥用，我们在边缘 Worker 中利用单向 HMAC-SHA256 算法生成不可逆的假名化标识符，绝对不向存储系统写入您的原始 IP 地址。'
                  : 'To understand aggregate download volume and prevent abuse, we generate a pseudonymous identifier using an HMAC-SHA256 keyed hash server-side. Raw IP addresses are never written to our analytics dataset.'}
              </li>
              <li>
                <strong>{locale === 'zh' ? '粗粒度地理信息：' : 'Approximate Geolocation: '}</strong>
                {locale === 'zh'
                  ? '仅基于 Cloudflare 边缘路由头信息识别访问者所在的国家与行政大区（如 US, DE），绝不调用任何外部第三方 IP 定位 API。'
                  : 'Country and broad region information are derived strictly from Cloudflare network edge headers. We do not use third-party IP geolocation APIs.'}
              </li>
              <li>
                <strong>{locale === 'zh' ? '车间物理隔离运行：' : 'Air-Gapped Operation: '}</strong>
                {locale === 'zh'
                  ? '下载并安装在您工厂车间工控机上的 VisionRuntime 核心执行引擎具有 100% 离线自主运行能力，绝无后门或强制联网心跳回传。'
                  : 'VISIONGO runtime engines installed on factory floors operate 100% offline with zero mandatory outbound telemetry.'}
              </li>
            </ul>
          </div>

          {/* Section 3: Google Authentication */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'zh' ? '3. 谷歌账号认证 (Sign in with Google)' : '3. Google Authentication & Account Data'}</span>
            </h3>
            <p>
              {locale === 'zh'
                ? '我们提供基于官方 Google Identity Services 的可选登录功能，用于访问“我的 VISIONGO”个人中心及查看下载历史：'
                : 'We provide an optional Google authentication flow for users who wish to access the "My VISIONGO" account area and view personal download records:'}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>
                <strong>{locale === 'zh' ? '最小化授权范围：' : 'Minimum Necessary Scopes: '}</strong>
                {locale === 'zh'
                  ? '我们仅请求 openid、email、profile 权限。我们绝不请求亦无法访问您的 Gmail 邮件、Google Drive 云端硬盘、通讯录或日历。'
                  : 'We request only openid, email, and basic profile permissions. We never request or access your Gmail, Google Drive, contacts, or calendar.'}
              </li>
              <li>
                <strong>{locale === 'zh' ? '密码零接触保障：' : 'Zero Password Access: '}</strong>
                {locale === 'zh'
                  ? 'VISIONGO 永远不会接收、处理或存储您的 Google 账号密码。所有身份认证均在 Google 官方安全域内完成并通过服务端校验。'
                  : 'VISIONGO never receives, handles, or stores your Google password. Authentication occurs entirely within Google infrastructure.'}
              </li>
              <li>
                <strong>{locale === 'zh' ? '收集的数据项：' : 'Data Stored: '}</strong>
                {locale === 'zh'
                  ? '仅包含稳定的 Google 用户唯一编号（sub）、邮箱地址、显示名称和头像地址。我们为每个用户自动生成内部 UUID 关联，不将邮箱用作主键。'
                  : 'We store only your Google subject ID, verified email address, display name, and avatar URL, mapped to an internal UUID.'}
              </li>
            </ul>
          </div>

          {/* Section 4: Contact Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'zh' ? '4. 商务与技术咨询表单' : '4. Contact Inquiries & Pilots'}</span>
            </h3>
            <p>
              {locale === 'zh'
                ? '当您主动通过 /contact 提交技术咨询或 PoC 评估时，所填写的姓名、工作邮箱、公司名称与项目规格参数仅用于 VISIONGO 系统架构师与您建立直接工程联系，绝不会向任何第三方转售或用于广告推销。'
                : 'When submitting inquiries or demo requests via /contact, your contact information is used exclusively by our systems engineers to evaluate your technical parameters and respond to your inquiry. We never share or sell this data.'}
            </p>
          </div>

          {/* Section 5: Cookies */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'zh' ? '5. Cookie 与会话机制' : '5. Cookies & Sessions'}</span>
            </h3>
            <p>
              {locale === 'zh'
                ? '我们不使用任何第三方跨站追踪或广告营销 Cookie。我们仅在您登录后使用一个名为 `vg_session` 的严格安全 Cookie：'
                : 'We do not use advertising or tracking cookies. We utilize a single first-party cookie strictly for session authentication:'}
            </p>
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-400">
              <code>vg_session: HttpOnly; Secure; SameSite=Lax; Max-Age=30 days</code>
            </div>
          </div>

          {/* Section 6: Inquiries */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h4 className="text-base font-bold text-white">
              {locale === 'zh' ? '6. 隐私权益与联系我们' : '6. User Rights & Contact'}
            </h4>
            <p className="text-xs text-zinc-400">
              {locale === 'zh'
                ? '如果您希望查询、更新或彻底删除您在 VISIONGO 的账号及下载记录，请随时通过以下邮箱联系技术团队：'
                : 'To request access, export, or deletion of your account records or download history, please reach out to our engineering team:'}
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-400">
              <a href="mailto:contact@visiongo.app" className="hover:underline">
                contact@visiongo.app
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
