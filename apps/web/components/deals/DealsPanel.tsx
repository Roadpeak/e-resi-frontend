'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import {
  COMMISSION_LABELS,
  DEAL_STAGE_LABELS,
  dealsApi,
  type CommissionStatus,
  type Deal,
  type DealStage,
} from '../../lib/api/deals';
import { partnershipsApi } from '../../lib/api/partnerships';
import { propertiesApi } from '../../lib/api/properties';

/**
 * The deal pipeline, from either chair.
 *
 * One panel serves both dashboards because both sides look at the same rows
 * — the agent reads the commission column as "what I am owed", the developer
 * as "what I owe", and keeping them on one component means the two views can
 * never drift out of agreement about what a deal looks like.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const field =
  'h-10 w-full rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]';

const STAGE_TONES: Record<DealStage, string> = {
  LEAD: 'bg-[#e8f0fe] text-[#1967d2]',
  VIEWING: 'bg-[#e6f4ea] text-[#137333]',
  RESERVED: 'bg-[#fef7e0] text-[#b06000]',
  SPA_SIGNED: 'bg-[#fce8e6] text-[#c5221f]',
  COMPLETED: 'bg-[#e6f4ea] text-[#137333]',
  LOST: 'bg-[#f1f3f4] text-[#5f6368]',
};

const COMMISSION_TONES: Record<CommissionStatus, string> = {
  NONE: 'bg-[#f1f3f4] text-[#5f6368]',
  ACCRUED: 'bg-[#e8f0fe] text-[#1967d2]',
  DUE: 'bg-[#fef7e0] text-[#b06000]',
  PAID: 'bg-[#e6f4ea] text-[#137333]',
  DISPUTED: 'bg-[#fce8e6] text-[#c5221f]',
};

export function money(amount: number | null | undefined, currency = 'KES'): string {
  if (amount == null) return '—';
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

export function StageChip({ stage }: { stage: DealStage }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium', STAGE_TONES[stage])}>
      {DEAL_STAGE_LABELS[stage]}
    </span>
  );
}

export function CommissionChip({ status }: { status: CommissionStatus }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium', COMMISSION_TONES[status])}>
      {COMMISSION_LABELS[status]}
    </span>
  );
}

/** The four numbers each side leads with. */
function SummaryCards({ side }: { side: 'agent' | 'developer' }) {
  const { data } = useQuery({ queryKey: ['deal-summary'], queryFn: dealsApi.summary });
  const t = data?.commissionTotals ?? {};
  const cards = [
    { label: 'Open deals', value: String(data?.openDeals ?? 0), sub: 'in the pipeline' },
    {
      label: side === 'agent' ? 'Owed to you' : 'You owe',
      value: money((t.DUE?.amount ?? 0) + (t.DISPUTED?.amount ?? 0)),
      sub: `${(t.DUE?.count ?? 0) + (t.DISPUTED?.count ?? 0)} commission${(t.DUE?.count ?? 0) + (t.DISPUTED?.count ?? 0) === 1 ? '' : 's'} due`,
    },
    { label: 'Accrued', value: money(t.ACCRUED?.amount ?? 0), sub: 'not yet payable' },
    { label: 'Settled', value: money(t.PAID?.amount ?? 0), sub: `${t.PAID?.count ?? 0} paid out` },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className={cn(card, 'p-4')}>
          <p className="text-[12px] font-medium uppercase tracking-wide text-[#5f6368]">{c.label}</p>
          <p className="mt-1 text-[22px] font-normal text-[#202124]">{c.value}</p>
          <p className="text-[12.5px] text-[#80868b]">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Open a new deal.
 *
 * The pickers differ by chair. An agent picks from their assigned
 * properties, which carry the partnership with them; a developer picks a
 * partnership first and then one of their own developments — the same data
 * reached from opposite ends.
 */
function NewDealForm({ side, onDone }: { side: 'agent' | 'developer'; onDone: () => void }) {
  const [form, setForm] = useState({ key: '', clientName: '', clientPhone: '', clientEmail: '', notes: '' });
  const qc = useQueryClient();

  const assignments = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => partnershipsApi.myAssignments({ limit: 50 }),
    enabled: side === 'agent',
  });
  const partnerships = useQuery({
    queryKey: ['partnerships-active'],
    queryFn: () => partnershipsApi.list({ status: 'ACTIVE', limit: 50 }),
    enabled: side === 'developer',
  });
  const myProperties = useQuery({
    queryKey: ['my-properties-for-deal'],
    queryFn: () => propertiesApi.myListings({ limit: 50 }),
    enabled: side === 'developer',
  });

  // One <select> value encodes partnership + property together, because a
  // deal needs both and they are only valid as a pair.
  const options: { key: string; label: string; partnershipId: string; propertyId: string }[] =
    side === 'agent'
      ? (assignments.data?.data ?? []).map((a) => ({
          key: `${a.partnership.id}:${a.property.id}`,
          label: `${a.property.name} — ${a.partnership.developer.companyName}`,
          partnershipId: a.partnership.id,
          propertyId: a.property.id,
        }))
      : (partnerships.data?.data ?? []).flatMap((p) =>
          (myProperties.data?.data ?? []).map((prop) => ({
            key: `${p.id}:${prop.id}`,
            label: `${prop.name} — via ${p.agent.displayName}`,
            partnershipId: p.id,
            propertyId: prop.id,
          })),
        );

  const create = useMutation({
    mutationFn: () => {
      const opt = options.find((o) => o.key === form.key);
      if (!opt) throw new Error('Pick a property');
      return dealsApi.create({
        partnershipId: opt.partnershipId,
        propertyId: opt.propertyId,
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim() || undefined,
        clientEmail: form.clientEmail.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['deal-summary'] });
      onDone();
    },
  });

  return (
    <div className={cn(card, 'p-5')}>
      <h2 className="text-[16px] font-medium text-[#202124]">New deal</h2>
      <p className="mt-0.5 text-[13px] text-[#5f6368]">
        A client you are actively working toward a purchase. Everything that
        happens next — stages, commission, payment — is recorded on it for
        both sides.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <select
          value={form.key}
          onChange={(e) => setForm({ ...form, key: e.target.value })}
          className={cn(field, 'sm:col-span-2')}
        >
          <option value="">
            {options.length ? 'Property & partnership…' : 'No active partnerships with properties yet'}
          </option>
          {options.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          placeholder="Client name" maxLength={120} className={field} />
        <input value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
          placeholder="Client phone (optional)" maxLength={40} className={field} />
        <input value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
          placeholder="Client email (optional)" maxLength={160} className={field} />
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes (optional)" maxLength={2000} className={field} />
      </div>
      {create.isError && (
        <p className="mt-2 text-[13px] text-[#c5221f]">{(create.error as Error).message}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending || !form.key || !form.clientName.trim()}
          className="h-10 cursor-pointer rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40"
        >
          {create.isPending ? 'Opening…' : 'Open deal'}
        </button>
        <button onClick={onDone} className="h-10 cursor-pointer rounded-xl border border-[#dadce0] px-4 text-[14px] text-[#202124] hover:bg-[#f8f9fa]">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function DealsPanel({ side }: { side: 'agent' | 'developer' }) {
  const [creating, setCreating] = useState(false);
  const [stage, setStage] = useState<DealStage | ''>('');
  const base = side === 'agent' ? '/agent/deals' : '/dashboard/deals';

  const { data, isLoading } = useQuery({
    queryKey: ['deals', stage],
    queryFn: () => dealsApi.list({ limit: 50, stage: stage || undefined }),
  });
  const deals: Deal[] = data?.data ?? [];

  return (
    <div className="space-y-4">
      <SummaryCards side={side} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(['', 'LEAD', 'VIEWING', 'RESERVED', 'SPA_SIGNED', 'COMPLETED', 'LOST'] as const).map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStage(s)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1.5 text-[13px] transition-colors',
                stage === s
                  ? 'bg-[#d3e3fd] font-medium text-[#0b57d0]'
                  : 'border border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]',
              )}
            >
              {s ? DEAL_STAGE_LABELS[s] : 'All'}
            </button>
          ))}
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="cursor-pointer rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]"
          >
            New deal
          </button>
        )}
      </div>

      {creating && <NewDealForm side={side} onDone={() => setCreating(false)} />}

      {isLoading ? (
        <div className={cn(card, 'p-8 text-center text-[14px] text-[#5f6368]')}>Loading…</div>
      ) : deals.length === 0 ? (
        <div className={cn(card, 'p-8 text-center')}>
          <MaterialIcon name="handshake" size={32} className="text-[#dadce0]" />
          <p className="mt-2 text-[15px] text-[#202124]">No deals yet</p>
          <p className="mx-auto mt-1 max-w-md text-[13.5px] text-[#5f6368]">
            {side === 'agent'
              ? 'When you are working a client toward a purchase, open a deal — it is the record both you and the developer settle the commission against.'
              : 'Deals opened by you or your partner agents appear here, with each commission tracked to settlement.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {deals.map((d) => (
            <li key={d.id}>
              <Link
                href={`${base}/${d.id}`}
                className={cn(card, 'flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#f8f9fa]')}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium text-[#202124]">{d.clientName}</span>
                    <StageChip stage={d.stage} />
                    {d.commissionStatus !== 'NONE' && <CommissionChip status={d.commissionStatus} />}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-[#5f6368]">
                    {d.property.name}
                    {d.unit ? ` · ${d.unit.name}` : ''}
                    {' · '}
                    {side === 'agent' ? d.developer.companyName : d.agent.displayName}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[14px] font-medium text-[#202124]">
                    {money(d.commissionAmount, d.currency)}
                  </span>
                  <span className="block text-[12px] text-[#80868b]">
                    {d.commissionPercent != null ? `${d.commissionPercent}% commission` : 'terms unset'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
