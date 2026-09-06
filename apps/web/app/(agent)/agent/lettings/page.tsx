'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../lib/utils';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { ownershipsApi, type LettingEngagement } from '../../../../lib/api/ownerships';

/**
 * The agent's letting book — unit owners who asked them to find a tenant.
 *
 * Accepting an invitation installs the agent as the listing's manager: its
 * inquiries route to them, its chat reaches them, and the listing is theirs
 * to edit until either side ends the engagement.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';

function money(v: number | null, c: string) {
  return v == null ? '—' : `${c} ${Math.round(v).toLocaleString()}`;
}

function EngagementCard({ e }: { e: LettingEngagement }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['agent-lettings'] });
  const respond = useMutation({
    mutationFn: (accept: boolean) => ownershipsApi.respond(e.id, accept),
    onSuccess: refresh,
  });
  const end = useMutation({
    mutationFn: () => ownershipsApi.end(e.id),
    onSuccess: refresh,
  });

  const l = e.rentListing;
  return (
    <div className={cn(card, 'overflow-hidden')}>
      <div className="flex gap-4 p-4">
        {l.heroImageUrl && (
          <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded-2xl sm:block">
            <Image src={l.heroImageUrl} alt="" fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15.5px] font-medium text-[#202124]">{l.name}</h3>
            <span className="rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-[12.5px] font-medium text-[#137333]">
              {money(l.priceFrom, l.currency)}/mo
            </span>
            {e.status === 'ACTIVE' && (
              <span className="rounded-full bg-[#d3e3fd] px-2.5 py-0.5 text-[12px] font-medium text-[#0b57d0]">
                You manage this
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-[#5f6368]">
            {[l.neighborhood, l.city].filter(Boolean).join(', ')} · owner:{' '}
            {e.owner.firstName} {e.owner.lastName}
            {e.owner.phone ? ` · ${e.owner.phone}` : ''}
          </p>
          {e.message && (
            <p className="mt-1.5 text-[13.5px] text-[#5f6368]">&ldquo;{e.message}&rdquo;</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {e.status === 'PENDING' ? (
              <>
                <button onClick={() => respond.mutate(true)} disabled={respond.isPending}
                  className="cursor-pointer rounded-full bg-[#1a73e8] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40">
                  Accept — find them a tenant
                </button>
                <button onClick={() => respond.mutate(false)} disabled={respond.isPending}
                  className="cursor-pointer rounded-full border border-[#dadce0] px-3.5 py-1.5 text-[13px] text-[#5f6368] hover:bg-[#f1f3f4]">
                  Decline
                </button>
              </>
            ) : (
              <>
                <Link href={`/rent/${l.slug}`} target="_blank"
                  className="cursor-pointer rounded-full border border-[#dadce0] px-3.5 py-1.5 text-[13px] text-[#1a73e8] hover:bg-[#f8f9fa]">
                  View listing
                </Link>
                <button onClick={() => end.mutate()} disabled={end.isPending}
                  className="cursor-pointer rounded-full border border-[#dadce0] px-3.5 py-1.5 text-[13px] text-[#c5221f] hover:bg-[#fce8e6]">
                  End engagement
                </button>
              </>
            )}
          </div>
          {(respond.isError || end.isError) && (
            <p className="mt-2 text-[13px] text-[#c5221f]">
              {((respond.error ?? end.error) as Error).message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentLettings() {
  const { data: engagements, isLoading } = useQuery({
    queryKey: ['agent-lettings'],
    queryFn: ownershipsApi.agentEngagements,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Lettings</h1>
        <p className="text-[14px] text-[#5f6368]">
          Unit owners who asked you to find their tenant. Accept and the
          listing is yours to run — its inquiries and chat come to you.
        </p>
      </div>

      {isLoading ? (
        <div className={cn(card, 'p-8 text-center text-[14px] text-[#5f6368]')}>Loading…</div>
      ) : !engagements?.length ? (
        <div className={cn(card, 'p-8 text-center')}>
          <MaterialIcon name="real_estate_agent" size={32} className="text-[#dadce0]" />
          <p className="mt-2 text-[15px] text-[#202124]">No letting engagements yet</p>
          <p className="mx-auto mt-1 max-w-md text-[13.5px] text-[#5f6368]">
            When a unit owner invites you to let their unit, the invitation
            appears here. Your directory profile is how they find you.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {engagements.map((e) => <EngagementCard key={e.id} e={e} />)}
        </div>
      )}
    </div>
  );
}
