import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Trash2, UserPlus } from 'lucide-react';
import { CreditsPanel, type CreditsOrganization } from './CreditsPanel';

interface Tenant {
  tenant_id: string;
  name: string;
  type: 'personal' | 'enterprise';
  role: 'member' | 'org_admin';
}

interface Organization {
  id: string;
  name: string;
  type: 'personal' | 'enterprise';
  status: 'active' | 'suspended';
  ai_data_authorized?: number;
  /** Whether VisionCloud confirmed the current setting (null: this edition has no VisionCloud). */
  cloud_synced?: boolean | null;
  member_count?: number;
}

interface Member {
  email: string;
  user_id: string | null;
  display_name: string | null;
  role: 'admin' | 'member';
  status: 'invited' | 'active';
}

interface OrganizationPanelProps {
  locale: string;
  /** Email of the signed-in user: the default first administrator of a new organization. */
  myEmail: string;
}

async function send(path: string, body?: unknown): Promise<{ ok: boolean; data: any }> {
  const response = await fetch(path, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: response.ok, data: await response.json().catch(() => ({})) };
}

const card = 'p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4';
const heading = 'text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold';
const input = 'flex-1 basis-48 min-w-0 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50';
const button = 'px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50';
const badge = 'text-[10px] font-mono px-2 py-0.5 rounded border';
const smallButton = 'px-2 py-1 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer font-mono disabled:opacity-50';

/** Organizations of the signed-in user and member administration (account page). */
export const OrganizationPanel: React.FC<OrganizationPanelProps> = ({ locale, myEmail }) => {
  const zh = locale === 'zh';
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const [creditsAvailable, setCreditsAvailable] = useState(false);
  const [cloudAdminUrl, setCloudAdminUrl] = useState<string | null>(null);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [newName, setNewName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { ok, data } = await send('/api/orgs');
    if (!ok) { setError(data.error || (zh ? '无法读取组织信息' : 'Could not load organizations')); return; }
    setTenants(data.tenants || []);
    setPlatformAdmin(!!data.is_platform_admin);
    setCreditsAvailable(!!data.credits_available);
    setCloudAdminUrl(data.cloud_admin_url || null);
    setAllOrganizations(data.organizations || []);
  }, [zh]);

  const loadMembers = useCallback(async (orgId: string) => {
    const { ok, data } = await send(`/api/orgs/${encodeURIComponent(orgId)}/members`);
    if (!ok) { setError(data.error || (zh ? '无法读取成员' : 'Could not load members')); setMembers([]); return; }
    setMembers(data.members || []);
    setSelectedOrganization(data.organization || null);
  }, [zh]);

  useEffect(() => { void load(); }, [load]);
  // With exactly one enterprise organization to manage, open it straight away.
  useEffect(() => {
    if (selected) return;
    const enterprise = tenants.filter(tenant => tenant.type === 'enterprise' && tenant.role === 'org_admin');
    if (enterprise.length === 1) setSelected(enterprise[0].tenant_id);
  }, [tenants, selected]);
  useEffect(() => { if (selected) void loadMembers(selected); }, [selected, loadMembers]);

  const run = async (action: () => Promise<{ ok: boolean; data: any }>, after: () => Promise<void>,
                     succeeded?: (data: any) => void) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { ok, data } = await action();
      if (!ok) setError(data.error || (zh ? '操作失败' : 'Operation failed'));
      await after();
      if (ok) succeeded?.(data);
    } finally {
      setBusy(false);
    }
  };

  const manageable = new Map<string, string>();
  for (const tenant of tenants) {
    // A personal organization is managed only for its data authorization.
    if (tenant.role === 'org_admin') manageable.set(tenant.tenant_id, tenant.name);
  }
  if (platformAdmin) for (const org of allOrganizations) manageable.set(org.id, org.name);

  // Credits: every organization of the user (members see their own usage), plus all for platform admins.
  const creditOrganizations = new Map<string, CreditsOrganization>();
  for (const tenant of tenants) {
    creditOrganizations.set(tenant.tenant_id, { id: tenant.tenant_id, name: tenant.name, type: tenant.type,
                                                admin: platformAdmin || tenant.role === 'org_admin' });
  }
  if (platformAdmin) {
    for (const org of allOrganizations) {
      if (!creditOrganizations.has(org.id)) creditOrganizations.set(org.id, { id: org.id, name: org.name, type: org.type, admin: true });
    }
  }

  const roleLabel = (role: string) => (role === 'admin' || role === 'org_admin'
    ? (zh ? '管理员' : 'Admin') : (zh ? '成员' : 'Member'));
  const enterpriseManageable = [...manageable].filter(([id]) =>
    (tenants.find(tenant => tenant.tenant_id === id)?.type ?? allOrganizations.find(org => org.id === id)?.type) === 'enterprise');
  const manage = (orgId: string) => {
    setSelected(orgId);
    setNotice('');
    window.setTimeout(() => document.getElementById('org-members')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {error && <p role="alert" className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-xs text-red-300">{error}</p>}

      <div className={card}>
        <h4 className={heading}>{zh ? '我所在的组织' : 'My organizations'}</h4>
        <p className="text-xs text-zinc-500">
          {zh ? '在 VisionStudio 登录时选择组织；训练数据、模型和云端额度按组织隔离。'
              : 'Choose an organization when signing in to VisionStudio; training data, models and cloud credits are kept per organization.'}
        </p>
        <div className="space-y-2">
          {tenants.map(tenant => (
            <div key={tenant.tenant_id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="text-zinc-200 truncate">{tenant.name}</span>
                <span className={`${badge} border-zinc-700 text-zinc-400`}>
                  {tenant.type === 'personal' ? (zh ? '个人' : 'Personal') : (zh ? '企业' : 'Enterprise')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-mono">{roleLabel(tenant.role)}</span>
                {manageable.has(tenant.tenant_id) && (
                  <button type="button" onClick={() => manage(tenant.tenant_id)} className={smallButton}>
                    {tenant.type === 'personal' ? (zh ? '设置' : 'Settings') : (zh ? '管理成员' : 'Manage members')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="org-members" className={card}>
        <h4 className={heading}>{zh ? '成员管理' : 'Members'}</h4>
        {enterpriseManageable.length === 0 && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200 space-y-1">
            <p>{zh ? '个人组织只有你自己，不能添加成员。要和同事一起用，需要一个企业组织。'
                   : 'A personal organization has only you. To work with colleagues you need an enterprise organization.'}</p>
            <p className="text-amber-300/80">
              {platformAdmin
                ? (zh ? '你是平台管理员：在下方“创建企业组织”填写名称即可（首位管理员默认是你），创建后就能在这里添加成员。'
                      : 'You are a platform administrator: create one below (you are its first administrator by default), then add members here.')
                : (zh ? '企业组织由平台管理员创建，请联系 VISIONGO 开通；开通后你会成为它的管理员。'
                      : 'Enterprise organizations are created by a platform administrator; contact VISIONGO to get one.')}
            </p>
          </div>
        )}
        {manageable.size > 0 && (
          <select
            value={selected ?? ''}
            onChange={event => { setSelected(event.target.value || null); setNotice(''); }}
            className={`${input} w-full`}
            aria-label={zh ? '选择组织' : 'Organization'}
          >
            <option value="">{zh ? '选择要管理的组织' : 'Select an organization'}</option>
            {[...manageable].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}

          {selected && selectedOrganization && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <label className="flex items-center gap-2 text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrganization.ai_data_authorized === 1}
                  disabled={busy}
                  onChange={event => {
                    const authorized = event.target.checked;
                    void run(() => send(`/api/orgs/${encodeURIComponent(selected)}/ai-data-authorization`, { authorized }),
                             () => loadMembers(selected));
                  }}
                />
                <span>{zh ? '允许 VisionCloud 使用本组织数据提供 AI 功能' : 'Let VisionCloud use this organization\'s data for AI'}</span>
              </label>
              <p className="text-[11px] text-zinc-500">
                {zh ? '开启后，VisionCloud 的 AI 功能（流程规划、调参、专家问答、NG 分析、AI 建方案、脚本草稿）会使用本组织提交的问题、工作流结构与参数、变更记录及其结果、对回答的点评来生成建议并持续改进；数据只在本组织内使用，跨组织共享的只有去除名称和自由文本的调参与经验统计。关闭时以上 AI 功能全部不可用，工作流版本照常保存；已从本组织学到的经验卡与技能立即停用，共享出去的统计在 24 小时内删除并留下删除记录。AI 调用明细（提问、回答与变更记录的内容）保留 180 天，之后只保留不含内容的周度统计；用量与计费明细保留 3 年，之后只保留月度汇总；组织可随时要求立即删除全部 AI 数据。数据存放于中国境内的 VisionCloud；工位上 VisionEdge 的图像（回放集、复查图像）只保存在本地，不上传。更改会立即通知 VisionCloud；VisionCloud 暂时无法确认时，也会在成员下次登录或令牌刷新（10 分钟内）后生效。'
                    : 'When on, VisionCloud\'s AI functions (workflow planning, tuning, expert answers, NG analysis, AI solution drafts, script drafts) use the questions, workflow structure and parameters, change records with their results and the ratings of answers this organization submits, to make suggestions and improve them. The data is used within this organization; only tuning and experience statistics without names or free text are shared across organizations. When off, all these AI functions are unavailable; workflow versions are still kept; the experience cards and skills learned from this organization stop being used at once, and its shared statistics are deleted within 24 hours, with a record of the deletion. AI call details (the questions, answers and change records) are kept for 180 days, after that only weekly statistics without content; usage and billing details are kept for 3 years, after that only monthly totals; the organization may ask for all its AI data to be deleted at any time. The data is stored by VisionCloud in mainland China; images on a station\'s VisionEdge (replay sets, review images) stay on that station and are not uploaded. A change is sent to VisionCloud at once; if VisionCloud cannot confirm it yet, it still applies after members sign in again or their token refreshes (within 10 minutes).'}
              </p>
              {selectedOrganization.cloud_synced === false && (
                <p className="text-[11px] text-amber-400">
                  {zh ? '设置已保存，但 VisionCloud 暂未确认；下次打开本页时会自动重发。'
                      : 'The setting is saved, but VisionCloud has not confirmed it yet; it is sent again the next time this page opens.'}
                </p>
              )}
            </div>
          )}

        {selected && selectedOrganization?.type === 'personal' && (
          <p className="text-[11px] text-zinc-500">
            {zh ? '这是个人组织，只能设置上面的数据授权，不能添加成员。' : 'This is a personal organization: only the data setting above applies; it has no other members.'}
          </p>
        )}

        {selected && selectedOrganization?.type === 'enterprise' && (
          <>
            <form
              className="flex flex-wrap gap-2"
              onSubmit={event => {
                event.preventDefault();
                const email = inviteEmail.trim();
                void run(() => send(`/api/orgs/${encodeURIComponent(selected)}/members`, { email, role: inviteRole }),
                         async () => { setInviteEmail(''); await loadMembers(selected); },
                         data => setNotice(data.member?.status === 'active'
                           ? (zh ? `${email} 已加入组织。` : `${email} has joined.`)
                           : (zh ? `${email} 还没有账号，已记下邀请：对方用这个邮箱注册后自动加入。本站暂不能发邮件时，请到“平台管理”为他生成注册验证码或直接创建账号。`
                                 : `${email} has no account yet; they join when they sign up with this email.`)))
              }}
            >
              <input type="email" required value={inviteEmail} onChange={event => setInviteEmail(event.target.value)}
                     placeholder={zh ? '成员邮箱' : 'Member email'} className={input} />
              <select value={inviteRole} onChange={event => setInviteRole(event.target.value as 'member' | 'admin')} className={input}>
                <option value="member">{zh ? '成员' : 'Member'}</option>
                <option value="admin">{zh ? '管理员' : 'Admin'}</option>
              </select>
              <button type="submit" disabled={busy} className={button}>
                <UserPlus className="w-3.5 h-3.5" />
                <span>{zh ? '添加成员' : 'Add member'}</span>
              </button>
            </form>
            <p className="text-[11px] text-zinc-500">
              {zh ? '已注册的邮箱立即加入；未注册的邮箱显示“待注册”，对方用该邮箱注册或登录后自动加入。被移除的成员在 10 分钟内失去访问权，其数据仍归组织所有。'
                  : 'Emails with an account join at once; others join when they sign up or sign in with that email. Removed members lose access within 10 minutes; their data stays with the organization.'}
            </p>
            {notice && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-300">{notice}</p>}

            <div className="space-y-2">
              {members.map(member => (
                <div key={member.email} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <div className="min-w-0">
                    <div className="text-zinc-200 truncate">{member.display_name || member.email}</div>
                    <div className="text-zinc-500 font-mono truncate">{member.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.status === 'invited' && (
                      <span className={`${badge} border-amber-500/30 text-amber-400`}>{zh ? '待注册' : 'No account yet'}</span>
                    )}
                    <select
                      value={member.role}
                      disabled={busy}
                      onChange={event => void run(
                        () => send(`/api/orgs/${encodeURIComponent(selected)}/members/role`, { email: member.email, role: event.target.value }),
                        () => loadMembers(selected))}
                      className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
                      aria-label={zh ? '角色' : 'Role'}
                    >
                      <option value="member">{zh ? '成员' : 'Member'}</option>
                      <option value="admin">{zh ? '管理员' : 'Admin'}</option>
                    </select>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm(zh ? `确定将 ${member.email} 移出组织？` : `Remove ${member.email} from the organization?`)) return;
                        void run(() => send(`/api/orgs/${encodeURIComponent(selected)}/members/remove`, { email: member.email }),
                                 () => loadMembers(selected));
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-300 hover:bg-red-950/40 cursor-pointer"
                      aria-label={zh ? '移除' : 'Remove'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {platformAdmin && (
        <div className={card}>
          <h4 className={heading}>{zh ? '创建企业组织（平台管理员）' : 'Enterprise organizations (platform admin)'}</h4>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={event => {
              event.preventDefault();
              void run(() => send('/api/orgs', { name: newName, admin_email: newAdminEmail || myEmail }),
                       async () => { setNewName(''); setNewAdminEmail(''); await load(); },
                       data => {
                         if (!data.organization?.id) return;
                         manage(data.organization.id);
                         if (creditsAvailable) setNotice(zh ? '企业组织已创建。它在 VisionCloud 的额度是 0：请在下方“额度与用量”按提示开户并充值，否则成员用 AI 会提示额度不足。'
                                                            : 'Organization created. It has no VisionCloud credits yet: see Credits and usage below.');
                       });
            }}
          >
            <input required value={newName} onChange={event => setNewName(event.target.value)}
                   placeholder={zh ? '组织名称，例如公司名' : 'Organization name'} className={input} />
            <input type="email" value={newAdminEmail} onChange={event => setNewAdminEmail(event.target.value)}
                   placeholder={zh ? `首位管理员邮箱（留空为你自己：${myEmail}）` : `First administrator (empty: you, ${myEmail})`} className={input} />
            <button type="submit" disabled={busy} className={button}>
              <Plus className="w-3.5 h-3.5" />
              <span>{zh ? '创建' : 'Create'}</span>
            </button>
          </form>
          <div className="space-y-2">
            {allOrganizations.length === 0 && (
              <p className="text-xs text-zinc-500">{zh ? '还没有企业组织。' : 'No enterprise organizations yet.'}</p>
            )}
            {allOrganizations.map(org => (
              <div key={org.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <div className="min-w-0">
                  <div className="text-zinc-200 truncate">
                    {org.name}
                    {org.status === 'suspended' && <span className={`${badge} ml-2 border-red-500/30 text-red-400`}>{zh ? '已停用' : 'Suspended'}</span>}
                  </div>
                  <div className="text-zinc-500 font-mono truncate">
                    {org.id}{typeof org.member_count === 'number' ? ` · ${zh ? `${org.member_count} 名成员` : `${org.member_count} members`}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => manage(org.id)} className={smallButton}>
                    {zh ? '管理成员' : 'Manage members'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (org.status === 'active' && !window.confirm(zh ? `停用后 ${org.name} 的成员将无法登录使用该组织，确定停用？` : `Suspend ${org.name}?`)) return;
                      void run(
                        () => send(`/api/orgs/${encodeURIComponent(org.id)}/status`, { status: org.status === 'active' ? 'suspended' : 'active' }),
                        load);
                    }}
                    className={smallButton}
                  >
                    {org.status === 'active' ? (zh ? '停用' : 'Suspend') : (zh ? '恢复' : 'Activate')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {creditsAvailable ? (
        tenants.length > 0 && <CreditsPanel locale={locale} organizations={[...creditOrganizations.values()]} cloudAdminUrl={cloudAdminUrl} initialOrganization={selected} />
      ) : (
        <p className="text-xs text-zinc-500">{zh ? '本版本尚未开通云端服务，暂无额度与用量。' : 'Cloud services are not available in this edition yet.'}</p>
      )}
    </div>
  );
};
