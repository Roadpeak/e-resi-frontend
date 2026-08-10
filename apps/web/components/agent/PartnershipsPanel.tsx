'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Handshake, Loader2, User } from 'lucide-react';
import {
  partnershipsApi, type Partnership, type PartnershipStatus,
} from '../../lib/api/partnerships';
import { ApiError } from '../../lib/api/client';
import { cn } from '../../lib/utils';

const TABS: { key: PartnershipStatus; label: string }[] = [
  { key: 'PENDING', label: 'Requests' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'ENDED', label: 'Past' },
];

/**
 * Partnership list, shared by the agent and developer dashboards.
 *
 * `side` only affects wording and which party is shown — the API returns the
 * caller's partnerships from whichever end they sit on, so there is one code
 * path rather than two that can drift.
 */
export function PartnershipsPanel({
  side,
  currentUserId,
}: {
  side: 'agent' | 'developer';
  /** Used to tell "waiting on them" from "waiting on you". */
  currentUserId?: string;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<PartnershipStatus>('ACTIVE');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['partnerships', tab],
    queryFn: () => partnershipsApi.list({ status: tab, limit: 50 }),
  });

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      partnershipsApi.respond(id, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerships'] });
      setError('');
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not answer that request'),
  });

  const end = useMutation({
    mutationFn: (id: string) => partnershipsApi.end(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerships'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'assignments'] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not end that partnership'),
  });

  const items = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full px-4 py-2 text-[14px] font-medium transition-colors cursor-pointer',
              tab === t.key
                ? 'bg-[#0b57d0] text-white'
                : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-14">
          <Loader2 size={22} className="animate-spin text-[#80868b]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-[#dadce0] bg-white py-14 text-center">
          <Handshake size={26} className="text-[#dadce0]" />
          <p className="max-w-sm text-[15px] text-[#5f6368]">
            {tab === 'PENDING'
              ? 'No pending requests.'
              : tab === 'ACTIVE'
                ? side === 'agent'
                  ? 'No active partnerships yet. Developers can invite you, or you can approach them.'
                  : 'No active partnerships yet. Find an agent to sell or let your developments.'
                : 'Nothing here yet.'}
          </p>
          {tab === 'ACTIVE' && side === 'developer' && (
            <Link href="/dashboard/partners/find" className="text-[14px] font-medium text-[#1a73e8]">
              Find agents
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <PartnershipRow
              key={p.id}
              partnership={p}
              side={side}
              // Only the side that did NOT ask may answer.
              canRespond={p.status === 'PENDING' && p.requestedById !== currentUserId}
              busy={respond.isPending || end.isPending}
              onRespond={(accept) => respond.mutate({ id: p.id, accept })}
              onEnd={() => end.mutate(p.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PartnershipRow({
  partnership: p, side, canRespond, busy, onRespond, onEnd,
}: {
  partnership: Partnership;
  side: 'agent' | 'developer';
  canRespond: boolean;
  busy: boolean;
  onRespond: (accept: boolean) => void;
  onEnd: () => void;
}) {
  // An agent's counterpart is the developer, and vice versa.
  const other = side === 'agent'
    ? { name: p.developer.companyName, image: p.developer.logoUrl, isCompany: true, href: undefined }
    : {
        name: p.agent.displayName,
        image: p.agent.logoUrl ?? p.agent.photoUrl,
        isCompany: p.agent.kind === 'COMPANY',
        href: `/agents/${p.agent.id}`,
      };

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#dadce0] bg-white p-4">
      <span className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-[#f1f3f4] text-[#80868b]',
        other.isCompany ? 'rounded-xl' : 'rounded-full',
      )}>
        {other.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={other.image} alt="" className="h-full w-full object-cover" />
          : other.isCompany ? <Building2 size={20} /> : <User size={20} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-[#202124]">
          {other.href ? (
            <Link href={other.href} className="hover:text-[#1a73e8]">{other.name}</Link>
          ) : other.name}
        </p>
        <p className="text-[13px] text-[#5f6368]">
          {p.commissionPercent != null ? `${p.commissionPercent}% default commission` : 'No default commission set'}
          {p._count?.assignments ? ` · ${p._count.assignments} assigned` : ''}
        </p>
        {p.message && p.status === 'PENDING' && (
          <p className="mt-1 line-clamp-2 text-[13px] text-[#5f6368]">“{p.message}”</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {p.status === 'PENDING' && (
          canRespond ? (
            <>
              <button
                onClick={() => onRespond(true)}
                disabled={busy}
                className="rounded-full bg-[#0b57d0] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0842a0] cursor-pointer disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => onRespond(false)}
                disabled={busy}
                className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#5f6368] transition-colors hover:bg-[#f8f9fa] cursor-pointer disabled:opacity-50"
              >
                Decline
              </button>
            </>
          ) : (
            <span className="rounded-full bg-[#fef7e0] px-3 py-1.5 text-[13px] font-medium text-[#b06000]">
              Awaiting their answer
            </span>
          )
        )}
        {p.status === 'ACTIVE' && (
          <>
            <Link
              href={side === 'agent' ? `/agent/partners/${p.id}` : `/dashboard/partners/${p.id}`}
              className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
            >
              Manage
            </Link>
            <button
              onClick={onEnd}
              disabled={busy}
              className="rounded-full border border-[#dadce0] px-3 py-2 text-[13px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] cursor-pointer disabled:opacity-50"
            >
              End
            </button>
          </>
        )}
      </div>
    </li>
  );
}
