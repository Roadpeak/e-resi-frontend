'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { viewersApi, type InterestedViewer } from '../../lib/api/referrals';

/**
 * Signed-in customers who have been browsing — the quietest lead source.
 *
 * A registered investor who opened the same development four times this week
 * never filled a form, but their interest is more concrete than most who
 * did. This panel surfaces them to whoever can act — the developer for their
 * own properties, the agent for visitors who came through their links — with
 * one button that files them into the real pipeline (an Inquiry or a Deal).
 * Only signed-in customers appear, and only to the parties their viewing
 * already involved; guests are invisible by construction.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';

function Row({ v, side }: { v: InterestedViewer; side: 'developer' | 'agent' }) {
  const qc = useQueryClient();
  const capture = useMutation({
    mutationFn: () => viewersApi.capture(v.userId, v.propertyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interested-viewers'] }),
  });

  const name = v.user ? [v.user.firstName, v.user.lastName].filter(Boolean).join(' ') : 'Someone';

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e8eaed] px-4 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0fe] text-[14px] font-medium text-[#1967d2]">
        {name.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-[#202124]">
          {name}
          <span className="ml-2 text-[12px] font-normal capitalize text-[#5f6368]">
            {v.user?.role.toLowerCase()}
          </span>
        </span>
        <span className="block truncate text-[12.5px] text-[#5f6368]">
          viewed <span className="font-medium text-[#202124]">{v.property?.name}</span>{' '}
          {v.views} time{v.views === 1 ? '' : 's'}
          {v.lastViewedAt && ` · last ${new Date(v.lastViewedAt).toLocaleDateString()}`}
        </span>
      </span>
      {v.alreadyLead ? (
        <span className="rounded-full bg-[#e6f4ea] px-3 py-1 text-[12.5px] font-medium text-[#137333]">
          Already a lead
        </span>
      ) : (
        <button
          onClick={() => capture.mutate()}
          disabled={capture.isPending}
          className="cursor-pointer rounded-full bg-[#1a73e8] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50"
        >
          {capture.isPending ? 'Adding…' : 'Add as lead'}
        </button>
      )}
      {capture.isError && (
        <p className="w-full text-[12.5px] text-[#c5221f]">{(capture.error as Error).message}</p>
      )}
    </li>
  );
}

export function InterestedVisitorsPanel({ side }: { side: 'developer' | 'agent' }) {
  const { data, isLoading } = useQuery({
    queryKey: ['interested-viewers'],
    queryFn: () => viewersApi.list(30),
  });
  const rows = data?.rows ?? [];

  return (
    <div className={cn(card, 'p-5')}>
      <h2 className="text-[16px] font-medium text-[#202124]">Interested visitors</h2>
      <p className="mt-0.5 text-[13px] text-[#5f6368]">
        {side === 'developer'
          ? 'Signed-in buyers, investors and tenants who have been viewing your developments in the last 30 days.'
          : 'Signed-in visitors who browsed through your links in the last 30 days — warm, and not yet captured.'}
      </p>

      {isLoading ? (
        <p className="mt-4 text-[14px] text-[#5f6368]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-5 text-center">
          <MaterialIcon name="visibility" size={28} className="text-[#dadce0]" />
          <p className="mt-1.5 text-[13.5px] text-[#5f6368]">
            No signed-in visitors yet. When a registered customer views{' '}
            {side === 'developer' ? 'your developments' : 'through your links'}, they appear
            here — ready to capture as a lead.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((v) => (
            <Row key={`${v.userId}:${v.propertyId}`} v={v} side={side} />
          ))}
        </ul>
      )}
    </div>
  );
}
