'use client';

import Image from 'next/image';
import { KeyRound, BedDouble, Maximize2, CalendarDays, ArrowRight, Phone, Loader2 } from 'lucide-react';
import { formatPrice, formatDate, cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { useMyReservations, useCancelReservation } from '../../../../lib/api/queries';
import type { ReservationStage } from '../../../../lib/api/reservations';
import { ReservationDocuments } from '../../../../components/reservations/ReservationDocuments';

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

function stageIndex(stage: ReservationStage): number {
  return PURCHASE_STEPS.findIndex((s) => s.stage === stage);
}

export default function AccountReservations() {
  const { data, isLoading } = useMyReservations();
  const cancel = useCancelReservation();
  const reservations = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const active = reservations.filter((r) => r.stage !== 'CANCELLED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-normal text-[#202124]">Reservations</h1>
        <p className="text-sm text-gray-500">
          {active.length} active reservation{active.length !== 1 ? 's' : ''} — each tracked from deposit to keys.
        </p>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-20 text-center">
          <KeyRound size={32} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No active reservations</p>
          <p className="text-xs text-gray-400 mt-1">Reserve a unit from any property page to begin the purchase process.</p>
          <Button href="/properties" variant="outline" size="sm" className="mt-5">Browse Properties</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 items-start">
        {active.map((r) => {
          const currentStepIndex = stageIndex(r.stage);
          const progress = STAGE_PROGRESS[r.stage];
          const nextStep = PURCHASE_STEPS[currentStepIndex + 1];

          return (
            <div key={r.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {/* Hero banner */}
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={r.unit.property.heroImageUrl}
                  alt={r.unit.property.name}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                  <div>
                    <p className="font-bold text-white text-lg">{r.unit.property.name}</p>
                    <p className="text-sm text-white/70">{r.unit.name}{r.unit.floor ? ` · Floor ${r.unit.floor}` : ''}</p>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    Active
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Unit stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
                    <BedDouble size={16} className="mx-auto mb-1 text-brand-600" />
                    <p className="text-sm font-semibold text-gray-900">{r.unit.bedrooms} Bed</p>
                  </div>
                  {r.unit.sqm && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
                      <Maximize2 size={16} className="mx-auto mb-1 text-brand-600" />
                      <p className="text-sm font-semibold text-gray-900">{r.unit.sqm} sqm</p>
                    </div>
                  )}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
                    <KeyRound size={16} className="mx-auto mb-1 text-brand-600" />
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(r.unit.price, r.unit.currency)}</p>
                  </div>
                </div>

                {/* Reservation dates */}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} /> Reserved: {formatDate(r.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <CalendarDays size={13} /> Expires: {formatDate(r.expiresAt)}
                  </span>
                </div>

                {/* Purchase progress */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Purchase Progress</p>
                    <p className="text-sm font-semibold text-brand-600">{progress}%</p>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="flex items-start gap-0">
                    {PURCHASE_STEPS.map((step, i) => {
                      const done = i < currentStepIndex;
                      const active = i === currentStepIndex;
                      return (
                        <div key={step.stage} className="flex-1 flex flex-col items-center text-center relative">
                          {/* Connector line */}
                          {i < PURCHASE_STEPS.length - 1 && (
                            <div className={cn('absolute top-3 left-1/2 right-0 h-px', done || active ? 'bg-brand-600' : 'bg-gray-200')} />
                          )}
                          {/* Dot */}
                          <div className={cn(
                            'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition-all',
                            done ? 'border-brand-500 bg-brand-600 text-white' :
                            active ? 'border-brand-500 bg-brand-100 text-brand-700 ring-2 ring-brand-200' :
                            'border-gray-200 bg-gray-100 text-gray-400',
                          )}>
                            {done ? '✓' : i + 1}
                          </div>
                          <p className={cn('mt-2 text-[10px] leading-tight', active ? 'text-brand-700 font-medium' : done ? 'text-gray-500' : 'text-gray-400')}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Purchase paperwork — download what the developer shared,
                    sign and return whatever asks for it. */}
                {r.documents && (
                  <ReservationDocuments
                    reservationId={r.id}
                    documents={r.documents}
                    role="buyer"
                    queryKey={['reservations', 'mine']}
                  />
                )}

                {/* Next step CTA */}
                {nextStep && (
                  <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                    <ArrowRight size={15} className="text-brand-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Next: {nextStep.label}</p>
                      <p className="text-xs text-gray-500">Contact the developer to proceed.</p>
                    </div>
                    <Button size="sm" className="ml-auto shrink-0" icon={<Phone size={12} />}>
                      Contact Dev
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                  <Button href={`/${r.unit.property.slug}`} variant="ghost" size="sm">View Property</Button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this reservation?')) {
                        cancel.mutate(r.id);
                      }
                    }}
                    disabled={cancel.isPending}
                    className="ml-auto text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel Reservation
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
