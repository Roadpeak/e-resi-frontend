'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import {
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  dealsApi,
  type DealStage,
} from '../../lib/api/deals';
import { CommissionChip, StageChip, money } from './DealsPanel';
import { parseHumanNumber } from '../../lib/parse-number';

/**
 * One deal, in full — the page both sides settle against.
 *
 * The layout mirrors the two state machines: the stage stepper runs across
 * the top (the client's journey), the commission panel sits beside the
 * details (the money's journey), and the event trail underneath is the
 * append-only history that makes a commission argument a lookup instead of
 * a memory contest.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const field =
  'h-10 w-full rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]';
const btn =
  'h-9 cursor-pointer rounded-xl px-3.5 text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-default';
const btnPrimary = cn(btn, 'bg-[#1a73e8] text-white hover:bg-[#1765cc]');
const btnQuiet = cn(btn, 'border border-[#dadce0] text-[#202124] hover:bg-[#f8f9fa]');
const btnDanger = cn(btn, 'border border-[#dadce0] text-[#c5221f] hover:bg-[#fce8e6]');

function Stepper({
  stage,
  onMove,
  busy,
}: {
  stage: DealStage;
  onMove: (s: DealStage) => void;
  busy: boolean;
}) {
  const idx = DEAL_STAGES.indexOf(stage);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {DEAL_STAGES.map((s, i) => {
        const done = idx >= 0 && i <= idx;
        return (
          <button
            key={s}
            onClick={() => onMove(s)}
            disabled={busy || s === stage}
            title={s === stage ? 'Current stage' : `Move to ${DEAL_STAGE_LABELS[s]}`}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors disabled:cursor-default',
              done
                ? 'bg-[#d3e3fd] font-medium text-[#0b57d0]'
                : 'border border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4]',
            )}
          >
            {done && <MaterialIcon name="check" size={14} />}
            {DEAL_STAGE_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}

export function DealDetail({ id, side }: { id: string; side: 'agent' | 'developer' }) {
  const qc = useQueryClient();
  const back = side === 'agent' ? '/agent/deals' : '/dashboard/deals';
  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => dealsApi.getOne(id),
  });

  const [saleValue, setSaleValue] = useState('');
  const [percent, setPercent] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [note, setNote] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [showLost, setShowLost] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['deal', id] });
    qc.invalidateQueries({ queryKey: ['deals'] });
    qc.invalidateQueries({ queryKey: ['deal-summary'] });
  };

  const stageMut = useMutation({
    mutationFn: ({ stage, reason }: { stage: DealStage; reason?: string }) =>
      dealsApi.updateStage(id, stage, reason),
    onSuccess: refresh,
  });
  // Tolerant of "18,500,000" and "3%" — see parseHumanNumber. Anything that
  // still fails to parse is dropped rather than sent as NaN-turned-null.
  const commissionMut = useMutation({
    mutationFn: () =>
      dealsApi.setCommission(id, {
        saleValue: saleValue ? parseHumanNumber(saleValue) : undefined,
        commissionPercent: percent ? parseHumanNumber(percent) : undefined,
      }),
    onSuccess: () => { setSaleValue(''); setPercent(''); refresh(); },
  });
  const statusMut = useMutation({
    mutationFn: ({ status, reason }: { status: Parameters<typeof dealsApi.setCommissionStatus>[1]; reason?: string }) =>
      dealsApi.setCommissionStatus(id, status, reason),
    onSuccess: () => { setDisputeReason(''); refresh(); },
  });
  const noteMut = useMutation({
    mutationFn: () => dealsApi.addNote(id, note.trim()),
    onSuccess: () => { setNote(''); refresh(); },
  });

  if (isLoading || !deal) {
    return <div className={cn(card, 'p-8 text-center text-[14px] text-[#5f6368]')}>Loading…</div>;
  }

  const isDeveloper = side === 'developer';
  const cs = deal.commissionStatus;
  const frozen = cs === 'DUE' || cs === 'PAID' || cs === 'DISPUTED';
  const err =
    (stageMut.error as Error | null) ??
    (commissionMut.error as Error | null) ??
    (statusMut.error as Error | null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={back} className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]">
          <MaterialIcon name="arrow_back" size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-[22px] font-normal text-[#202124]">
            {deal.clientName}
            <StageChip stage={deal.stage} />
            {cs !== 'NONE' && <CommissionChip status={cs} />}
          </h1>
          <p className="text-[13.5px] text-[#5f6368]">
            {deal.property.name}
            {deal.unit ? ` · ${deal.unit.name}` : ''} ·{' '}
            {side === 'agent' ? deal.developer.companyName : deal.agent.displayName}
            {deal.clientPhone ? ` · ${deal.clientPhone}` : ''}
          </p>
        </div>
        <Link
          href={`/${deal.property.slug}`}
          className="rounded-full border border-[#dadce0] px-3.5 py-1.5 text-[13px] text-[#202124] hover:bg-[#f8f9fa]"
        >
          View property
        </Link>
      </div>

      {err && <p className="rounded-xl bg-[#fce8e6] px-4 py-2.5 text-[13.5px] text-[#c5221f]">{err.message}</p>}

      {/* ── Stage ── */}
      <div className={cn(card, 'p-5')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-medium text-[#202124]">Pipeline</h2>
          {deal.stage !== 'LOST' && deal.stage !== 'COMPLETED' && (
            showLost ? (
              <span className="flex items-center gap-2">
                <input value={lostReason} onChange={(e) => setLostReason(e.target.value)}
                  placeholder="Why was it lost?" maxLength={500}
                  className="h-9 w-56 rounded-xl border border-[#dadce0] px-3 text-[13px] outline-none focus:border-[#1a73e8]" />
                <button onClick={() => stageMut.mutate({ stage: 'LOST', reason: lostReason.trim() || undefined })}
                  disabled={stageMut.isPending} className={btnDanger}>Confirm lost</button>
                <button onClick={() => setShowLost(false)} className={btnQuiet}>Cancel</button>
              </span>
            ) : (
              <button onClick={() => setShowLost(true)} className={btnDanger}>Mark lost</button>
            )
          )}
        </div>
        <div className="mt-3">
          <Stepper stage={deal.stage} busy={stageMut.isPending}
            onMove={(s) => stageMut.mutate({ stage: s })} />
        </div>
        {deal.stage === 'LOST' && (
          <p className="mt-2 text-[13.5px] text-[#5f6368]">
            Lost{deal.lostReason ? `: ${deal.lostReason}` : ''}. Move it to any stage to reopen.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Commission ledger ── */}
        <div className={cn(card, 'p-5')}>
          <h2 className="text-[15px] font-medium text-[#202124]">Commission</h2>
          <dl className="mt-3 space-y-1.5 text-[14px]">
            <div className="flex justify-between"><dt className="text-[#5f6368]">Sale value</dt><dd className="text-[#202124]">{money(deal.saleValue, deal.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-[#5f6368]">Rate</dt><dd className="text-[#202124]">{deal.commissionPercent != null ? `${deal.commissionPercent}%` : '—'}</dd></div>
            <div className="flex justify-between border-t border-[#e8eaed] pt-1.5">
              <dt className="font-medium text-[#202124]">Commission</dt>
              <dd className="font-medium text-[#202124]">{money(deal.commissionAmount, deal.currency)}</dd>
            </div>
            {deal.commissionDueAt && (
              <div className="flex justify-between"><dt className="text-[#5f6368]">Marked due</dt><dd className="text-[#202124]">{new Date(deal.commissionDueAt).toLocaleDateString()}</dd></div>
            )}
            {deal.commissionPaidAt && (
              <div className="flex justify-between"><dt className="text-[#5f6368]">Paid</dt><dd className="text-[#137333]">{new Date(deal.commissionPaidAt).toLocaleDateString()}</dd></div>
            )}
          </dl>

          {cs === 'DISPUTED' && deal.disputeReason && (
            <p className="mt-3 rounded-xl bg-[#fce8e6] px-3 py-2 text-[13px] text-[#c5221f]">
              Disputed: {deal.disputeReason}
            </p>
          )}

          {/* Developer sets the terms — until the number becomes a debt. */}
          {isDeveloper && !frozen && (
            <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-3">
              <div className="grid grid-cols-2 gap-2">
                <input value={saleValue} onChange={(e) => setSaleValue(e.target.value)}
                  placeholder={`Sale value (${deal.currency})`} inputMode="numeric" className={field} />
                <input value={percent} onChange={(e) => setPercent(e.target.value)}
                  placeholder="Commission %" inputMode="decimal" className={field} />
              </div>
              <button onClick={() => commissionMut.mutate()}
                disabled={commissionMut.isPending || (!saleValue && !percent)}
                className={cn(btnPrimary, 'mt-2 w-full')}>
                {commissionMut.isPending ? 'Saving…' : 'Set commission'}
              </button>
            </div>
          )}

          {/* The lifecycle buttons, by chair. */}
          <div className="mt-4 flex flex-wrap gap-2">
            {isDeveloper && cs === 'ACCRUED' && (
              <button onClick={() => statusMut.mutate({ status: 'DUE' })} disabled={statusMut.isPending} className={btnPrimary}>
                Mark due
              </button>
            )}
            {isDeveloper && (cs === 'ACCRUED' || cs === 'DUE' || cs === 'DISPUTED') && (
              <button onClick={() => statusMut.mutate({ status: 'PAID' })} disabled={statusMut.isPending} className={btnPrimary}>
                Mark paid
              </button>
            )}
            {isDeveloper && cs === 'DISPUTED' && (
              <button onClick={() => statusMut.mutate({ status: 'DUE' })} disabled={statusMut.isPending} className={btnQuiet}>
                Back to due
              </button>
            )}
            {!isDeveloper && cs === 'DISPUTED' && (
              <button onClick={() => statusMut.mutate({ status: 'DUE' })} disabled={statusMut.isPending} className={btnQuiet}>
                Withdraw dispute
              </button>
            )}
          </div>

          {/* Dispute — the agent's lever, and it needs a reason the other
              side can actually answer. */}
          {!isDeveloper && (cs === 'ACCRUED' || cs === 'DUE' || cs === 'PAID') && (
            <div className="mt-3 rounded-2xl bg-[#f8f9fa] p-3">
              <input value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Dispute reason — what was agreed?" maxLength={1000} className={field} />
              <button
                onClick={() => statusMut.mutate({ status: 'DISPUTED', reason: disputeReason.trim() })}
                disabled={statusMut.isPending || !disputeReason.trim()}
                className={cn(btnDanger, 'mt-2 w-full')}>
                Raise dispute
              </button>
            </div>
          )}
        </div>

        {/* ── History ── */}
        <div className={cn(card, 'p-5')}>
          <h2 className="text-[15px] font-medium text-[#202124]">History</h2>
          <div className="mt-3 flex gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note both sides can see…" maxLength={2000} className={field} />
            <button onClick={() => noteMut.mutate()} disabled={noteMut.isPending || !note.trim()} className={btnQuiet}>
              Add
            </button>
          </div>
          <ul className="mt-3 max-h-[380px] space-y-2 overflow-y-auto">
            {(deal.events ?? []).map((e) => (
              <li key={e.id} className="rounded-xl border border-[#e8eaed] px-3 py-2">
                <p className="text-[13.5px] text-[#202124]">{e.summary}</p>
                <p className="mt-0.5 text-[12px] text-[#80868b]">
                  {e.actor.firstName} {e.actor.lastName} · {new Date(e.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
