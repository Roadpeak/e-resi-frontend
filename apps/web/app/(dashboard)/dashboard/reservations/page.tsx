'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { reservationsApi } from '../../../../lib/api/reservations';
import { ReservationPipelineCard } from '../../../../components/reservations/ReservationPipelineCard';

/**
 * The developer's side of every reservation on their properties — the same
 * five-step purchase tracker the investor watches, but with the controls:
 * each "mark done" here is what moves the buyer's own progress bar.
 */

const QUERY_KEY = ['reservations', 'developer'];

export default function DashboardReservations() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => reservationsApi.listForDeveloper({ limit: 50 }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-[#1a73e8]" />
      </div>
    );
  }

  const reservations = (data?.data ?? []).filter((r) => r.stage !== 'CANCELLED');
  const inFlight = reservations.filter((r) => r.stage !== 'TITLE_TRANSFERRED');

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-[26px] font-normal text-[#202124] sm:text-[28px]">Reservations</h2>
        <p className="mt-0.5 text-base text-[#5f6368]">
          {inFlight.length} sale{inFlight.length !== 1 ? 's' : ''} in progress — advancing a step here
          updates the buyer&apos;s tracker too.
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center text-base text-[#5f6368]">
          No reservations yet. When a buyer reserves a unit it appears here with its purchase pipeline.
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-2">
          {reservations.map((r) => (
            <ReservationPipelineCard key={r.id} reservation={r} canAdvance queryKey={QUERY_KEY} />
          ))}
        </div>
      )}
    </div>
  );
}
