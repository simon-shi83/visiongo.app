import React, { useCallback, useEffect, useState } from 'react';
import { Coins } from 'lucide-react';

// Organization credits, ledger and usage kept by VisionCloud (read through /api/orgs/{id}/credits*,
// SDK credits contract). Administrators see the account; members see their own usage only.

export interface CreditsOrganization {
  id: string;
  name: string;
  type: 'personal' | 'enterprise';
  admin: boolean;
}

interface Notice { id: number; title: string; content: string; created_at_unix_ms: number }
interface Account {
  opened: boolean;
  status?: 'active' | 'suspended';
  balance_micros: number;
  used_micros: number;
  input_price_micros_per_1m: number;
  output_price_micros_per_1m: number;
  notices: Notice[];
}
interface Transaction {
  id: number;
  type: 'recharge' | 'consumption' | 'adjustment';
  amount_micros: number;
  balance_after_micros: number;
  description: string;
  operator: string;
  created_at_unix_ms: number;
}
interface UsageRow { requests: number; prompt_tokens?: number; completion_tokens?: number; cost_micros: number }
interface Usage {
  totals: UsageRow;
  by_user: (UsageRow & { user_id: string })[];
  by_endpoint: (UsageRow & { endpoint: string })[];
  users?: Record<string, { name: string; email: string }>;
}

const card = 'p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4';
const heading = 'text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold';
const input = 'px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50';
const cell = 'px-2 py-1.5 text-left';
const DAY = 86_400_000;

const credits = (micros: number, digits = 2) => (micros / 1_000_000).toFixed(digits);
const endpointName = (endpoint: string, zh: boolean) => {
  const names: Record<string, [string, string]> = {
    'planning/workflow-changes': ['方案修改规划', 'Workflow changes'],
    'knowledge/search': ['专家问答', 'Expert answers'],
    'planning/blueprints': ['模块选型', 'Blueprints'],
  };
  const key = Object.keys(names).find(name => endpoint.endsWith(name));
  return key ? names[key][zh ? 0 : 1] : endpoint;
};

async function get(path: string): Promise<{ ok: boolean; status: number; data: any }> {
  const response = await fetch(path);
  return { ok: response.ok, status: response.status, data: await response.json().catch(() => ({})) };
}

export const CreditsPanel: React.FC<{ locale: string; organizations: CreditsOrganization[] }> = ({ locale, organizations }) => {
  const zh = locale === 'zh';
  const [selected, setSelected] = useState(organizations[0]?.id ?? '');
  const [days, setDays] = useState(30);
  const [account, setAccount] = useState<Account | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [type, setType] = useState('');
  const [error, setError] = useState('');

  const organization = organizations.find(item => item.id === selected);
  const base = `/api/orgs/${encodeURIComponent(selected)}/credits`;
  const failure = (status: number, data: any) => (status === 502 || data.error === 'cloud_unavailable'
    ? (zh ? '云端服务暂不可用，请稍后重试' : 'The cloud service is unavailable; please try again later')
    : data.error_description || data.error || (zh ? '读取失败' : 'Could not load'));

  const loadTransactions = useCallback(async (after: string | null) => {
    const query = new URLSearchParams({ limit: '50' });
    if (type) query.set('type', type);
    if (after) query.set('cursor', after);
    const { ok, status, data } = await get(`${base}/transactions?${query}`);
    if (!ok) { setError(failure(status, data)); return; }
    setTransactions(previous => (after ? [...previous, ...data.items] : data.items));
    setCursor(data.next_cursor ?? null);
  }, [base, type]);

  useEffect(() => {
    if (!organization) return;
    setError('');
    setAccount(null);
    setUsage(null);
    setTransactions([]);
    const to = Date.now();
    void get(`${base}/usage?from=${to - days * DAY}&to=${to}`).then(({ ok, status, data }) => {
      if (ok) setUsage(data); else setError(failure(status, data));
    });
    if (organization.admin) {
      void get(base).then(({ ok, status, data }) => { if (ok) setAccount(data); else setError(failure(status, data)); });
      void loadTransactions(null);
    }
  }, [selected, days, organization?.admin, loadTransactions]);

  if (!organizations.length) return null;
  const users = usage?.users || {};
  const typeLabel = (value: string) => ({
    recharge: zh ? '充值' : 'Recharge', consumption: zh ? '消费' : 'Usage', adjustment: zh ? '调整' : 'Adjustment',
  } as Record<string, string>)[value] || value;

  return (
    <div className={card}>
      <h4 className={`${heading} flex items-center gap-2`}><Coins className="w-4 h-4" />{zh ? '额度与用量' : 'Credits and usage'}</h4>
      <div className="flex flex-wrap gap-2">
        <select value={selected} onChange={event => setSelected(event.target.value)} className={`${input} flex-1 min-w-0`}
                aria-label={zh ? '组织' : 'Organization'}>
          {organizations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={days} onChange={event => setDays(Number(event.target.value))} className={input}
                aria-label={zh ? '统计区间' : 'Period'}>
          {[7, 30, 90, 365].map(value => <option key={value} value={value}>{zh ? `最近 ${value} 天` : `Last ${value} days`}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-xs text-red-300">{error}</p>}

      {organization?.admin && account && (
        account.opened ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              [zh ? '余额 (Credits)' : 'Balance (Credits)', credits(account.balance_micros)],
              [zh ? '累计消耗' : 'Used in total', credits(account.used_micros)],
              [zh ? '输入 / 输出费率' : 'Input / output price', `${credits(account.input_price_micros_per_1m)} / ${credits(account.output_price_micros_per_1m)}`],
              [zh ? '状态' : 'Status', account.status === 'suspended' ? (zh ? '已停用' : 'Suspended') : (zh ? '正常' : 'Active')],
            ].map(([label, value]) => (
              <div key={label} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-zinc-500">{label}</div>
                <div className={`mt-1 font-mono text-sm ${account.status === 'suspended' && label.includes(zh ? '状态' : 'Status') ? 'text-red-300' : 'text-zinc-100'}`}>{value}</div>
              </div>
            ))}
            <div className="col-span-full text-[11px] text-zinc-500">{zh ? '费率单位：Credits / 100 万 Token' : 'Prices in Credits per 1M tokens'}</div>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">
            {zh ? '该组织尚未使用过 VisionCloud，首次使用时自动开立额度账户' : 'This organization has not used VisionCloud yet; its credit account opens on first use'}
            {organization.type === 'personal' && (zh ? '（个人组织赠送 100 Credits 体验额度）。' : ' (personal organizations receive 100 trial Credits).')}
          </p>
        )
      )}

      {organization?.admin && account?.notices?.length ? (
        <div className="space-y-2">
          <div className="text-xs text-zinc-400">{zh ? '平台公告' : 'Notices'}</div>
          {account.notices.map(notice => (
            <div key={notice.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <div className="flex justify-between gap-2 text-zinc-200"><span>{notice.title}</span>
                <span className="text-zinc-500 font-mono shrink-0">{new Date(notice.created_at_unix_ms).toLocaleDateString()}</span></div>
              <div className="mt-1 text-zinc-400 whitespace-pre-wrap">{notice.content}</div>
            </div>
          ))}
        </div>
      ) : null}

      {usage && (
        <div className="space-y-3 text-xs">
          <div className="text-zinc-400">
            {organization?.admin ? (zh ? '用量' : 'Usage') : (zh ? '我的用量' : 'My usage')}：
            <span className="font-mono text-zinc-200"> {usage.totals.requests} {zh ? '次请求' : 'requests'} · {credits(usage.totals.cost_micros, 4)} Credits</span>
          </div>
          {organization?.admin && usage.by_user.length > 0 && (
            <table className="w-full">
              <thead className="text-zinc-500"><tr><th className={cell}>{zh ? '成员' : 'Member'}</th><th className={cell}>{zh ? '请求' : 'Requests'}</th>
                <th className={cell}>Token</th><th className={cell}>Credits</th></tr></thead>
              <tbody>{usage.by_user.map(row => (
                <tr key={row.user_id} className="border-t border-zinc-800 text-zinc-300">
                  <td className={cell} title={users[row.user_id]?.email}>{users[row.user_id]?.name || row.user_id}</td>
                  <td className={`${cell} font-mono`}>{row.requests}</td>
                  <td className={`${cell} font-mono`}>{(row.prompt_tokens || 0) + (row.completion_tokens || 0)}</td>
                  <td className={`${cell} font-mono`}>{credits(row.cost_micros, 4)}</td>
                </tr>))}</tbody>
            </table>
          )}
          {usage.by_endpoint.length > 0 && (
            <table className="w-full">
              <thead className="text-zinc-500"><tr><th className={cell}>{zh ? '功能' : 'Feature'}</th><th className={cell}>{zh ? '请求' : 'Requests'}</th>
                <th className={cell}>Credits</th></tr></thead>
              <tbody>{usage.by_endpoint.map(row => (
                <tr key={row.endpoint} className="border-t border-zinc-800 text-zinc-300">
                  <td className={cell}>{endpointName(row.endpoint, zh)}</td>
                  <td className={`${cell} font-mono`}>{row.requests}</td>
                  <td className={`${cell} font-mono`}>{credits(row.cost_micros, 4)}</td>
                </tr>))}</tbody>
            </table>
          )}
        </div>
      )}

      {organization?.admin && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-400">{zh ? '充值与消费流水' : 'Ledger'}</span>
            <select value={type} onChange={event => setType(event.target.value)} className={input} aria-label={zh ? '流水类型' : 'Type'}>
              <option value="">{zh ? '全部类型' : 'All types'}</option>
              {['recharge', 'consumption', 'adjustment'].map(value => <option key={value} value={value}>{typeLabel(value)}</option>)}
            </select>
          </div>
          <table className="w-full">
            <thead className="text-zinc-500"><tr><th className={cell}>{zh ? '时间' : 'Time'}</th><th className={cell}>{zh ? '类型' : 'Type'}</th>
              <th className={cell}>{zh ? '变动' : 'Amount'}</th><th className={cell}>{zh ? '余额' : 'Balance'}</th><th className={cell}>{zh ? '说明' : 'Description'}</th></tr></thead>
            <tbody>{transactions.map(item => (
              <tr key={item.id} className="border-t border-zinc-800 text-zinc-300">
                <td className={`${cell} font-mono whitespace-nowrap`}>{new Date(item.created_at_unix_ms).toLocaleString()}</td>
                <td className={cell}>{typeLabel(item.type)}</td>
                <td className={`${cell} font-mono ${item.amount_micros < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{credits(item.amount_micros, 4)}</td>
                <td className={`${cell} font-mono`}>{credits(item.balance_after_micros, 4)}</td>
                <td className={`${cell} text-zinc-400`}>{item.description}</td>
              </tr>))}</tbody>
          </table>
          {!transactions.length && <p className="text-zinc-500">{zh ? '暂无流水' : 'No entries'}</p>}
          {cursor && (
            <button type="button" onClick={() => void loadTransactions(cursor)}
                    className="px-3 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer font-mono">
              {zh ? '加载更多' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
