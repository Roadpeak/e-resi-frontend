'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { referralsApi, type ReferralRow } from '../../lib/api/referrals';

/**
 * Agent link traffic, from either chair.
 *
 * The developer reads it as accountability — "who is actually driving
 * traffic to my developments, and does it convert" — which is the evidence
 * side of every commission conversation. The agent reads the same rows as
 * proof of contribution, which they otherwise assert in a WhatsApp message
 * with nothing behind it. One component, so both sides argue from the same
 * numbers.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';

function Cell({ value, label, strong = false }: { value: number; label: string; strong?: boolean }) {
  return (
    <span className="text-center">
      <span className={cn('block text-[15px] tabular-nums', strong && value > 0 ? 'font-semibold text-[#137333]' : 'font-medium text-[#202124]')}>
        {value.toLocaleString()}
      </span>
      <span className="block text-[10.5px] uppercase tracking-wide text-[#80868b]">{label}</span>
    </span>
  );
}

export function ReferralTrafficPanel({ side }: { side: 'developer' | 'agent' }) {
  const [days, setDays] = useState(90);
  const { data, isLoading } = useQuery({
    queryKey: ['referral-traffic', side, days],
    queryFn: () => (side === 'developer' ? referralsApi.forDeveloper(days) : referralsApi.forAgent(days)),
  });

  const rows: ReferralRow[] = data?.rows ?? [];

  return (
    <div className={cn(card, 'p-5')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-medium text-[#202124]">
            {side === 'developer' ? 'Agent link traffic' : 'My link traffic'}
          </h2>
          <p className="mt-0.5 text-[13px] text-[#5f6368]">
            {side === 'developer'
              ? 'Visits and leads each partner agent brought to your developments through their shared links.'
              : 'What your shared links delivered, per development — the numbers behind your commissions.'}
          </p>
        </div>
        <div className="flex gap-1.5">
          {[30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1 text-[12.5px] transition-colors',
                days === d
                  ? 'bg-[#d3e3fd] font-medium text-[#0b57d0]'
                  : 'border border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4]',
              )}
            >
              {d === 365 ? '1 year' : `${d} days`}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 text-[14px] text-[#5f6368]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-5 text-center">
          <MaterialIcon name="query_stats" size={28} className="text-[#dadce0]" />
          <p className="mt-1.5 text-[13.5px] text-[#5f6368]">
            {side === 'developer'
              ? 'No agent-link traffic yet. When partner agents share your developments, every visit, viewing and lead through their links lands here.'
              : 'No traffic through your links yet. Share a development or a client room — every visit and lead through your link is counted here.'}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => {
            const avatar = r.agent?.photoUrl ?? r.agent?.logoUrl;
            return (
              <li
                key={`${r.agentId}:${r.propertyId}`}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e8eaed] px-4 py-3"
              >
                {side === 'developer' && (
                  avatar ? (
                    <Image src={avatar} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0fe] text-[14px] font-medium text-[#1967d2]">
                      {(r.agent?.displayName ?? '?').slice(0, 1)}
                    </span>
                  )
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-[#202124]">
                    {side === 'developer' ? r.agent?.displayName ?? 'Unknown agent' : r.property?.name ?? 'Unknown property'}
                  </span>
                  <span className="block truncate text-[12.5px] text-[#5f6368]">
                    {side === 'developer' ? `→ ${r.property?.name ?? ''}` : 'through your shared link'}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <Cell value={r.views} label="visits" />
                  <Cell value={r.tourStarts} label="tours" />
                  <Cell value={r.inquiries} label="inquiries" />
                  <Cell value={r.bookings} label="viewings" strong />
                  <Cell value={r.reservations} label="reserved" strong />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
