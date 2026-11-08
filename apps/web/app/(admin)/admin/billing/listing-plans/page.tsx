'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../../../../../lib/api/billing';
import { agentSiteApi } from '../../../../../lib/api/agent-site';
import { pricingApi } from '../../../../../lib/api/admin';
import { ApiError } from '../../../../../lib/api/client';
import { cn } from '../../../../../lib/utils';

type Plan = 'MONTHLY' | 'ONE_TIME';
const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

function Toggle({ on, onChange, label, hint, busy }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string; busy?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-[14px] font-medium text-[#202124]">{label}</p>
        <p className="mt-0.5 text-[13px] text-[#5f6368]">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={busy}
        onClick={() => onChange(!on)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50', on ? 'bg-[#1a73e8]' : 'bg-[#dadce0]')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </div>
  );
}

/** Number field that saves its setting on blur. */
function PriceField({ label, settingKey, value, currency, onSaved }: { label: string; settingKey: string; value: number; currency: string; onSaved: (msg: string) => void }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const save = useMutation({
    mutationFn: () => pricingApi.updateSetting(settingKey, String(Number(v) || 0)),
    onSuccess: () => onSaved(`${label} saved`),
  });
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] text-[#5f6368]">{label}</span>
      <span className="flex items-center rounded-xl border border-[#dadce0] focus-within:border-[#1a73e8]">
        <span className="pl-3 text-[13px] text-[#5f6368]">{currency}</span>
        <input
          type="number"
          min={0}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => { if (Number(v) !== value) save.mutate(); }}
          className="w-full rounded-xl bg-transparent px-2 py-2 text-[14px] text-[#202124] outline-none tabular-nums"
        />
      </span>
    </label>
  );
}

function PlanPicker({ value, onPick, busy }: { value: Plan; onPick: (p: Plan) => void; busy: boolean }) {
  return (
    <div className="inline-flex rounded-full border border-[#dadce0] p-0.5">
      {(['MONTHLY', 'ONE_TIME'] as Plan[]).map((p) => (
        <button
          key={p}
          type="button"
          disabled={busy}
          onClick={() => p !== value && onPick(p)}
          className={cn(
            'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50',
            p === value ? 'bg-[#1a73e8] text-white' : 'text-[#5f6368] hover:text-[#202124]',
          )}
        >
          {p === 'MONTHLY' ? 'Monthly' : 'One-time'}
        </button>
      ))}
    </div>
  );
}

export default function AdminListingPlans() {
  const qc = useQueryClient();
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{ type: 'DEVELOPER' | 'AGENT'; plan: Plan } | null>(null);
  const flash = (m: string) => { setError(''); setToast(m); setTimeout(() => setToast(''), 6000); };
  const fail = (e: unknown) => setError(e instanceof ApiError ? e.message : 'Something went wrong');

  const { data: cfg, isLoading } = useQuery({ queryKey: ['admin-listing-plans'], queryFn: () => billingApi.adminListingPlans() });
  const { data: sitePrices } = useQuery({ queryKey: ['agent-site-prices'], queryFn: () => agentSiteApi.prices() });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-listing-plans'] });
    qc.invalidateQueries({ queryKey: ['agent-site-prices'] });
  };

  const setFlag = useMutation({
    mutationFn: ({ key, on }: { key: string; on: boolean }) => pricingApi.updateSetting(key, on ? 'true' : 'false'),
    onSuccess: () => { flash('Saved'); refresh(); },
    onError: fail,
  });
  const setPlan = useMutation({
    mutationFn: (c: { type: 'DEVELOPER' | 'AGENT'; plan: Plan }) => billingApi.setDefaultListingPlan(c.type, c.plan),
    onSuccess: (r) => { setConfirm(null); flash(`Default changed — ${r.listingsNotified} live listing(s) notified`); refresh(); },
    onError: fail,
  });
  const run = useMutation({
    mutationFn: () => billingApi.runListingPlans(),
    onSuccess: (r) => { flash(`Run complete: ${Object.entries(r).map(([k, v]) => `${v} ${k}`).join(', ')}`); refresh(); },
    onError: fail,
  });

  if (isLoading || !cfg) return <div className="p-8 text-[14px] text-[#5f6368]">Loading…</div>;
  const saved = (m: string) => { flash(m); refresh(); };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-medium text-[#202124]">Listing plans</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-[#5f6368]">
            Each development pays before it goes live: once (one-time) or every month from its go-live date.
            Changing a default gives owners {cfg.noticeDays} days&apos; notice and applies at each listing&apos;s
            next billing date. Unpaid renewals get {cfg.graceDays} days&apos; grace, then the listing is paused.
          </p>
        </div>
        <button
          type="button"
          onClick={() => run.mutate()}
          disabled={run.isPending}
          className="rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa] disabled:opacity-50"
        >
          {run.isPending ? 'Running…' : 'Run daily job now'}
        </button>
      </header>

      {(toast || error) && (
        <p className={cn('rounded-2xl px-4 py-3 text-[14px]', error ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-[#e6f4ea] text-[#188038]')}>
          {error || toast}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Awaiting payment', cfg.counts.pendingPayment],
          ['Paused — unpaid', cfg.counts.paused],
          ['Plan changes announced', cfg.counts.pendingChanges],
        ].map(([label, n]) => (
          <div key={label as string} className={cardCls}>
            <p className="text-[13px] text-[#5f6368]">{label}</p>
            <p className="mt-1 text-[26px] text-[#202124] tabular-nums">{n}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-medium text-[#202124]">Developer listings</h2>
            <PlanPicker value={cfg.developer.plan} busy={setPlan.isPending} onPick={(plan) => setConfirm({ type: 'DEVELOPER', plan })} />
          </div>
          <div className="divide-y divide-[#f1f3f4]">
            <Toggle
              label="Charge a listing fee"
              hint="Off: developer listings go live free as soon as they're approved."
              on={cfg.developer.enabled}
              busy={setFlag.isPending}
              onChange={(on) => setFlag.mutate({ key: 'developer_listing_fee_enabled', on })}
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PriceField label="Monthly" settingKey="listing_fee_monthly" value={cfg.developer.monthly} currency={cfg.currency} onSaved={saved} />
            <PriceField label="One-time" settingKey="developer_listing_fee_one_time" value={cfg.developer.oneTime} currency={cfg.currency} onSaved={saved} />
          </div>
        </section>

        <section className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-medium text-[#202124]">Agent listings</h2>
            <PlanPicker value={cfg.agent.plan} busy={setPlan.isPending} onPick={(plan) => setConfirm({ type: 'AGENT', plan })} />
          </div>
          <div className="divide-y divide-[#f1f3f4]">
            <Toggle
              label="Charge a listing fee"
              hint="Off: agent-owned listings go live free once approved."
              on={cfg.agent.enabled}
              busy={setFlag.isPending}
              onChange={(on) => setFlag.mutate({ key: 'agent_listing_fee_enabled', on })}
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PriceField label="Individual — monthly" settingKey="agent_listing_fee_monthly_individual" value={cfg.agent.monthly.individual} currency={cfg.currency} onSaved={saved} />
            <PriceField label="Agency — monthly" settingKey="agent_listing_fee_monthly_company" value={cfg.agent.monthly.company} currency={cfg.currency} onSaved={saved} />
            <PriceField label="Individual — one-time" settingKey="agent_listing_fee_one_time_individual" value={cfg.agent.oneTime.individual} currency={cfg.currency} onSaved={saved} />
            <PriceField label="Agency — one-time" settingKey="agent_listing_fee_one_time_company" value={cfg.agent.oneTime.company} currency={cfg.currency} onSaved={saved} />
          </div>
        </section>
      </div>

      <section className={cardCls}>
        <h2 className="text-[17px] font-medium text-[#202124]">Agent websites</h2>
        <p className="mt-1 text-[13px] text-[#5f6368]">One-time fees for an agent&apos;s site. 0 makes it free.</p>
        {sitePrices && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PriceField label="e-resi address (name.e-resi.com)" settingKey="agent_site_fee" value={sitePrices.subdomain} currency={cfg.currency} onSaved={saved} />
            <PriceField label="Custom domain" settingKey="agent_site_domain_fee" value={sitePrices.customDomain} currency={cfg.currency} onSaved={saved} />
          </div>
        )}
      </section>

      <section className={cardCls}>
        <h2 className="text-[17px] font-medium text-[#202124]">Other switches</h2>
        <div className="divide-y divide-[#f1f3f4]">
          <Toggle
            label="Agent membership fee"
            hint="The monthly agent fee that keeps an agent listed (hidden if unpaid). Separate from per-listing fees above."
            on={cfg.agent.membershipEnabled}
            busy={setFlag.isPending}
            onChange={(on) => setFlag.mutate({ key: 'agent_fee_enabled', on })}
          />
          <Toggle
            label="Honour one-time payments"
            hint="When a plan switches to monthly, listings that already paid the one-time fee stay free."
            on={cfg.honourOneTime}
            busy={setFlag.isPending}
            onChange={(on) => setFlag.mutate({ key: 'listing_honour_one_time', on })}
          />
        </div>
        <p className="mt-3 text-[13px] text-[#5f6368]">
          To put a single development on a different plan, use its menu on the Properties page (Listing plan).
        </p>
      </section>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-medium text-[#202124]">
              Switch {confirm.type === 'AGENT' ? 'agent' : 'developer'} listings to {confirm.plan === 'ONE_TIME' ? 'one-time' : 'monthly'}?
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#5f6368]">
              Every live listing that follows the default is notified now and moves over at its next billing date,
              at least {cfg.noticeDays} days from today. New listings use the new plan straight away.
              {confirm.plan === 'ONE_TIME'
                ? ' Monthly listings are charged the one-time fee once at their next billing date.'
                : cfg.honourOneTime
                  ? ' Listings that already paid one-time stay free.'
                  : ' Listings that paid one-time start paying monthly.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="rounded-full px-4 py-2 text-[14px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Cancel</button>
              <button
                type="button"
                disabled={setPlan.isPending}
                onClick={() => setPlan.mutate(confirm)}
                className="rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50"
              >
                {setPlan.isPending ? 'Switching…' : 'Switch and notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
