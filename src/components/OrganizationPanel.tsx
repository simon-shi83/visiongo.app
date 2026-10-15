import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Trash2, UserPlus } from 'lucide-react';

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
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
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
    setAllOrganizations(data.organizations || []);
  }, [zh]);

  const loadMembers = useCallback(async (orgId: string) => {
    const { ok, data } = await send(`/api/orgs/${encodeURIComponent(orgId)}/members`);
    if (!ok) { setError(data.error || (zh ? '无法读取成员' : 'Could not load members')); setMembers([]); return; }
    setMembers(data.members || []);
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
    if (tenant.type === 'enterprise' && tenant.role === 'org_admin') manageable.set(tenant.tenant_id, tenant.name);
  }
  if (platformAdmin) for (const org of allOrganizations) manageable.set(org.id, org.name);

  const roleLabel = (role: string) => (role === 'admin' || role === 'org_admin'
    ? (zh ? '管理员' : 'Admin') : (zh ? '成员' : 'Member'));

  return (
    <div className="space-y-6 animate-fadeIn">
      {error && <p role="alert" className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-xs text-red-300">{error}</p>}

      <div className={card}>
        <h4 className={heading}>{zh ? '我所在的组织' : 'My organizations'}</h4>
        <p className="text-xs text-zinc-500">
          {zh ? '在 VisionStudio 登录时选择组织；训练数据、模型和余额按组织隔离。'
              : 'Choose an organization when signing in to VisionStudio; training data, models and balance are kept per organization.'}
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

          {selected && (
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
