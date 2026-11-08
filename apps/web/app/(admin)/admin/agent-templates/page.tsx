'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentTemplatesAdminApi, type AdminAgentTemplate } from '../../../../lib/api/agent-site';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';

/**
 * Agent-website templates: make each free or premium, set the one-time
 * unlock price, or take one out of the gallery. Agents who already bought a
 * template keep it; making a free template premium later moves anyone using
 * it without having bought it back to Classic.
 */
function Row({ t, currency }: { t: AdminAgentTemplate; currency: string }) {
  const qc = useQueryClient();
  const [tier, setTier] = useState(t.tier);
  const [price, setPrice] = useState(String(t.unlockPrice));
  const [active, setActive] = useState(t.isActive);
  const [err, setErr] = useState('');
  useEffect(() => { setTier(t.tier); setPrice(String(t.unlockPrice)); setActive(t.isActive); }, [t]);
  const save = useMutation({
    mutationFn: () => agentTemplatesAdminApi.update(t.key, { tier, unlockPrice: Number(price) || 0, isActive: active }),
    onSuccess: (next) => { qc.setQueryData(['admin-agent-templates'], next); setErr(''); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Could not save'),
  });
  const dirty = tier !== t.tier || Number(price) !== t.unlockPrice || active !== t.isActive;
  const locked = t.key === 'CLASSIC';

  return (
    <li className="grid gap-4 px-5 py-5 lg:grid-cols-[1.6fr_auto_auto_auto_auto] lg:items-center">
      <div className="min-w-0">
        <p className="text-[16px] font-medium text-[#202124]">{t.name} <span className="ml-1 font-mono text-[12px] text-[#80868b]">{t.key}</span></p>
        <p className="mt-0.5 text-[13px] text-[#5f6368]">{t.description}</p>
        <p className="mt-1 text-[12.5px] text-[#80868b]">{t.inUse} site{t.inUse === 1 ? '' : 's'} using it · {t.unlocked} unlock{t.unlocked === 1 ? '' : 's'} paid</p>
        {err && <p className="mt-1 text-[13px] text-[#c5221f]">{err}</p>}
      </div>
      <div className="flex rounded-full border border-[#dadce0] p-0.5 text-[13px]">
        {(['FREE', 'PREMIUM'] as const).map((v) => (
          <button key={v} type="button" disabled={locked} onClick={() => setTier(v)}
            className={cn('rounded-full px-3.5 py-1.5 font-medium disabled:cursor-not-allowed', tier === v ? 'bg-[#202124] text-white' : 'text-[#3c4043]')}>
            {v === 'FREE' ? 'Free' : 'Premium'}
          </button>
        ))}
      </div>
      <label className={cn('flex items-center gap-2 text-[13px] text-[#5f6368]', tier === 'FREE' && 'opacity-40')}>
        {currency}
        <input type="number" min={0} step={100} value={price} disabled={tier === 'FREE'} onChange={(e) => setPrice(e.target.value)}
          aria-label={`${t.name} unlock price`}
          className="w-28 rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]" />
        <span className="whitespace-nowrap">one-time</span>
      </label>
      <label className={cn('flex items-center gap-2 text-[13px] text-[#3c4043]', locked && 'opacity-40')}>
        <input type="checkbox" checked={active} disabled={locked} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[#1a73e8]" />
        In gallery
      </label>
      <button type="button" onClick={() => save.mutate()} disabled={!dirty || save.isPending}
        className="rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40">
        {save.isPending ? 'Saving…' : 'Save'}
      </button>
    </li>
  );
}

export default function AdminAgentTemplatesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-agent-templates'], queryFn: agentTemplatesAdminApi.list });
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[26px] font-medium text-[#202124]">Agent templates</h1>
        <p className="mt-1 max-w-3xl text-[14px] text-[#5f6368]">
          Designs agents can choose for their website. Premium templates are unlocked with a one-time payment (card or
          M-Pesa); a premium template priced at 0 unlocks at no charge. Agents keep templates they have paid for.
          Classic always stays free as the fallback.
        </p>
      </div>
      {isLoading || !data ? (
        <p className="text-[14px] text-[#5f6368]">Loading…</p>
      ) : (
        <ul className="divide-y divide-[#f1f3f4] rounded-3xl border border-[#dadce0] bg-white">
          {data.templates.map((t) => <Row key={t.key} t={t} currency={data.currency} />)}
        </ul>
      )}
    </div>
  );
}
