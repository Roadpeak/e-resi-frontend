'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Mail, Phone, ArrowRight } from 'lucide-react';
import { cn, formatDate, formatPrice } from '../../lib/utils';
import {
  reservationsApi,
  type ManagedReservation,
  type ReservationStage,
} from '../../lib/api/reservations';

/**
 * One reservation as the selling side sees it — the same five-step purchase
 * tracker the investor watches in their account, plus the buyer behind it.
 * The developer drives the pipeline from here; the agent gets the identical
 * card read-only, because closing is their job even when signing isn't.
 */

const PURCHASE_STEPS: { stage: ReservationStage; label: string }[] = [
  { stage: 'RESERVED', label: 'Unit Reserved' },
  { stage: 'AGREEMENT_SIGNED', label: 'Sign Sale Agreement' },
  { stage: 'DEPOSIT_PAID', label: 'Pay Deposit' },
  { stage: 'FINAL_PAYMENT', label: 'Final Payment' },
  { stage: 'TITLE_TRANSFERRED', label: 'Title Transfer' },
];

const STAGE_PROGRESS: Record<ReservationStage, number> = {
  RESERVED: 10,
  AGREEMENT_SIGNED: 30,
  DEPOSIT_PAID: 55,
  FINAL_PAYMENT: 80,
  TITLE_TRANSFERRED: 100,
  CANCELLED: 0,
};

export function ReservationPipelineCard({
  reservation: r,
  canAdvance,
  queryKey,
}: {
  reservation: ManagedReservation;
  /** Developers advance stages; agents only watch. */
  canAdvance: boolean;
  queryKey: unknown[];
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const advance = useMutation({
    mutationFn: (stage: ReservationStage) => reservationsApi.advanceStage(r.id, stage),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => setError(e.message),
  });

  const currentStepIndex = PURCHASE_STEPS.findIndex((s) => s.stage === r.stage);
  const progress = STAGE_PROGRESS[r.stage];
  const nextStep = PURCHASE_STEPS[currentStepIndex + 1];
  const complete = r.stage === 'TITLE_TRANSFERRED';

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      {/* Unit + buyer header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-medium text-[#202124]">
            {r.unit.name} <span className="font-normal text-[#5f6368]">· {r.unit.property.name}</span>
          </p>
          <p className="mt-0.5 text-[13px] text-[#5f6368]">
            {formatPrice(r.unit.price, r.unit.currency)} · reserved {formatDate(r.createdAt)}
            {!complete && <> · expires {formatDate(r.expiresAt)}</>}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-[13px] font-medium',
            complete ? 'bg-[#e6f4ea] text-[#188038]' : 'bg-[#e8f0fe] text-[#1a73e8]',
          )}
        >
          {complete ? 'Sold · title transferred' : `${progress}% complete`}
        </span>
      </div>

      {/* Buyer */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-2xl bg-[#f8f9fa] px-4 py-3">
        <p className="text-[14px] font-medium text-[#202124]">
          {r.user.firstName} {r.user.lastName}
        </p>
        <a href={`mailto:${r.user.email}`} className="flex items-center gap-1.5 text-[13px] text-[#1a73e8] hover:underline">
          <Mail size={13} /> {r.user.email}
        </a>
        {r.user.phone && (
          <a href={`tel:${r.user.phone}`} className="flex items-center gap-1.5 text-[13px] text-[#1a73e8] hover:underline">
            <Phone size={13} /> {r.user.phone}
          </a>
        )}
        {r.agent && (
          <span className="text-[13px] text-[#5f6368]">via {r.agent.displayName}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#f1f3f4]">
        <div
          className="h-full rounded-full bg-[#1a73e8] transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="mt-4 flex items-start">
        {PURCHASE_STEPS.map((step, i) => {
          const done = i < currentStepIndex || complete;
          const active = i === currentStepIndex && !complete;
          return (
            <div key={step.stage} className="relative flex flex-1 flex-col items-center text-center">
              {i < PURCHASE_STEPS.length - 1 && (
                <div className={cn('absolute left-1/2 right-0 top-3 h-px', done ? 'bg-[#1a73e8]' : 'bg-[#dadce0]')} />
              )}
              <div
                className={cn(
                  'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold',
                  done
                    ? 'border-[#1a73e8] bg-[#1a73e8] text-white'
                    : active
                      ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8] ring-2 ring-[#d2e3fc]'
                      : 'border-[#dadce0] bg-[#f8f9fa] text-[#80868b]',
                )}
              >
                {done ? '✓' : i + 1}
              </div>
              <p
                className={cn(
                  'mt-2 text-[10px] leading-tight',
                  active ? 'font-medium text-[#1a73e8]' : done ? 'text-[#5f6368]' : 'text-[#80868b]',
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-[13px] text-[#d93025]">{error}</p>}

      {/* Advance / footer */}
      <div className="mt-5 flex items-center gap-3 border-t border-[#f1f3f4] pt-4">
        <Link
          href={canAdvance ? `/dashboard/units/${r.unit.id}` : `/${r.unit.property.slug}`}
          className="text-[13px] font-medium text-[#1a73e8] hover:underline"
        >
          {canAdvance ? 'Manage unit' : 'View property'}
        </Link>
        {canAdvance && nextStep && (
          <button
            onClick={() => advance.mutate(nextStep.stage)}
            disabled={advance.isPending}
            className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60"
          >
            {advance.isPending ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
            Mark “{nextStep.label}” done
          </button>
        )}
        {!canAdvance && nextStep && (
          <span className="ml-auto text-[13px] text-[#5f6368]">Next: {nextStep.label} — advanced by the developer</span>
        )}
      </div>
    </div>
  );
}
