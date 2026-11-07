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
const input = 'flex-1 min-w-0 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50';
const button = 'px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50';
const badge = 'text-[10px] font-mono px-2 py-0.5 rounded border';

/** Organizations of the signed-in user and member administration (account page). */
export const OrganizationPanel: React.FC<OrganizationPanelProps> = ({ locale }) => {
  const zh = locale === 'zh';
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const [creditsAvailable, setCreditsAvailable] = useState(false);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [newName, setNewName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { ok, data } = await send('/api/orgs');
    if (!ok) { setError(data.error || (zh ? '无法读取组织信息' : 'Could not load organizations')); return; }
    setTenants(data.tenants || []);
    setPlatformAdmin(!!data.is_platform_admin);
    setCreditsAvailable(!!data.credits_available);
    setAllOrganizations(data.organizations || []);
  }, [zh]);

  const loadMembers = useCallback(async (orgId: string) => {
    const { ok, data } = await send(`/api/orgs/${encodeURIComponent(orgId)}/members`);
    if (!ok) { setError(data.error || (zh ? '无法读取成员' : 'Could not load members')); setMembers([]); return; }
    setMembers(data.members || []);
    setSelectedOrganization(data.organization || null);
  }, [zh]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (selected) void loadMembers(selected); }, [selected, loadMembers]);

  const run = async (action: () => Promise<{ ok: boolean; data: any }>, after: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      const { ok, data } = await action();
      if (!ok) setError(data.error || (zh ? '操作失败' : 'Operation failed'));
      await after();
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
            <div key={tenant.tenant_id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="text-zinc-200 truncate">{tenant.name}</span>
                <span className={`${badge} border-zinc-700 text-zinc-400`}>
                  {tenant.type === 'personal' ? (zh ? '个人' : 'Personal') : (zh ? '企业' : 'Enterprise')}
                </span>
              </div>
              <span className="text-zinc-400 font-mono">{roleLabel(tenant.role)}</span>
            </div>
          ))}
        </div>
      </div>

      {creditsAvailable ? (
        tenants.length > 0 && <CreditsPanel locale={locale} organizations={[...creditOrganizations.values()]} />
      ) : (
        <p className="text-xs text-zinc-500">{zh ? '本版本尚未开通云端服务，暂无额度与用量。' : 'Cloud services are not available in this edition yet.'}</p>
      )}

      {manageable.size > 0 && (
        <div className={card}>
          <h4 className={heading}>{zh ? '成员管理' : 'Members'}</h4>
          <select
            value={selected ?? ''}
            onChange={event => setSelected(event.target.value || null)}
            className={`${input} w-full`}
            aria-label={zh ? '选择组织' : 'Organization'}
          >
            <option value="">{zh ? '选择要管理的组织' : 'Select an organization'}</option>
            {[...manageable].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>

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
                {zh ? '开启后，VisionCloud 的 AI 功能（流程规划、调参、专家问答、NG 分析、AI 建方案、脚本草稿）会使用本组织提交的问题、工作流结构与参数、变更记录及其结果、对回答的点评来生成建议并持续改进；数据只在本组织内使用，跨组织共享的只有去除名称和自由文本的调参与经验统计。关闭时以上 AI 功能全部不可用，工作流版本照常保存；已从本组织学到的经验卡与技能立即停用，共享出去的统计在 24 小时内删除并留下删除记录。AI 使用明细保留 180 天，之后只保留不含内容的周度汇总；组织可随时要求立即删除全部 AI 数据。设置在成员下次登录或令牌刷新（10 分钟内）后生效。'
                    : 'When on, VisionCloud\'s AI functions (workflow planning, tuning, expert answers, NG analysis, AI solution drafts, script drafts) use the questions, workflow structure and parameters, change records with their results and the ratings of answers this organization submits, to make suggestions and improve them. The data is used within this organization; only tuning and experience statistics without names or free text are shared across organizations. When off, all these AI functions are unavailable; workflow versions are still kept; the experience cards and skills learned from this organization stop being used at once, and its shared statistics are deleted within 24 hours, with a record of the deletion. AI usage details are kept for 180 days, after that only weekly summaries without content; the organization may ask for all its AI data to be deleted at any time. The setting applies after members sign in again or their token refreshes (within 10 minutes).'}
              </p>
            </div>
          )}

          {selected && selectedOrganization?.type !== 'personal' && (
            <>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={event => {
                  event.preventDefault();
                  void run(() => send(`/api/orgs/${encodeURIComponent(selected)}/members`, { email: inviteEmail, role: inviteRole }),
                           async () => { setInviteEmail(''); await loadMembers(selected); });
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
                  <span>{zh ? '邀请' : 'Invite'}</span>
                </button>
              </form>
              <p className="text-[11px] text-zinc-500">
                {zh ? '对方用该邮箱登录后自动加入。被移除的成员在 10 分钟内失去访问权，其数据仍归组织所有。'
                    : 'Invitees join when they sign in with that email. Removed members lose access within 10 minutes; their data stays with the organization.'}
              </p>

              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.email} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                    <div className="min-w-0">
                      <div className="text-zinc-200 truncate">{member.display_name || member.email}</div>
                      <div className="text-zinc-500 font-mono truncate">{member.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.status === 'invited' && (
                        <span className={`${badge} border-amber-500/30 text-amber-400`}>{zh ? '待加入' : 'Invited'}</span>
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
      )}

      {platformAdmin && (
        <div className={card}>
          <h4 className={heading}>{zh ? '企业组织（平台管理员）' : 'Enterprise organizations (platform admin)'}</h4>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={event => {
              event.preventDefault();
              void run(() => send('/api/orgs', { name: newName, admin_email: newAdminEmail }),
                       async () => { setNewName(''); setNewAdminEmail(''); await load(); });
            }}
          >
            <input required value={newName} onChange={event => setNewName(event.target.value)}
                   placeholder={zh ? '组织名称' : 'Organization name'} className={input} />
            <input type="email" required value={newAdminEmail} onChange={event => setNewAdminEmail(event.target.value)}
                   placeholder={zh ? '首位管理员邮箱' : 'First administrator email'} className={input} />
            <button type="submit" disabled={busy} className={button}>
              <Plus className="w-3.5 h-3.5" />
              <span>{zh ? '创建' : 'Create'}</span>
            </button>
          </form>
          <div className="space-y-2">
            {allOrganizations.map(org => (
              <div key={org.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <div className="min-w-0">
                  <div className="text-zinc-200 truncate">{org.name}</div>
                  <div className="text-zinc-500 font-mono truncate">{org.id}</div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(
                    () => send(`/api/orgs/${encodeURIComponent(org.id)}/status`, { status: org.status === 'active' ? 'suspended' : 'active' }),
                    load)}
                  className="px-2 py-1 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer font-mono"
                >
                  {org.status === 'active' ? (zh ? '停用' : 'Suspend') : (zh ? '恢复' : 'Activate')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
