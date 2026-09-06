'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { reservationsApi } from '../../../../lib/api/reservations';
import { ReservationPipelineCard } from '../../../../components/reservations/ReservationPipelineCard';

/**
 * Reservations the agent's referrals produced. The same purchase tracker the
 * buyer and developer see — read-only, since agreements and payments are the
 * developer's to record — so the agent always knows how close each of their
 * clients is to keys.
 */

const QUERY_KEY = ['reservations', 'agent'];

export default function AgentReservations() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => reservationsApi.listForAgent({ limit: 50 }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-[#1a73e8]" />
      </div>
    );
  }

  const reservations = (data?.data ?? []).filter((r) => r.stage !== 'CANCELLED');

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-[26px] font-normal text-[#202124] sm:text-[28px]">Reservations</h2>
        <p className="mt-0.5 text-base text-[#5f6368]">
          Sales your referrals started, tracked step by step to title transfer.
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center text-base text-[#5f6368]">
          No reservations from your referrals yet. When a client you introduced reserves a unit,
          its purchase pipeline appears here.
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-2">
          {reservations.map((r) => (
            <ReservationPipelineCard key={r.id} reservation={r} canAdvance={false} queryKey={QUERY_KEY} />
          ))}
        </div>
      )}
    </div>
  );
}
