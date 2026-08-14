'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2 } from 'lucide-react';
import { partnershipsApi } from '../../../../lib/api/partnerships';
import { agentsApi } from '../../../../lib/api/agents';
import { ShareLinkButton } from '../../../../components/agent/ShareLinkButton';
import { formatPrice } from '../../../../lib/utils';

/**
 * Properties developers have handed to this agent, with the commission that
 * actually applies — the assignment's own rate where set, otherwise the
 * partnership default.
 */
export default function AgentProperties() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['agent', 'assignments', page],
    queryFn: () => partnershipsApi.myAssignments({ page, limit: 12 }),
    placeholderData: (prev) => prev,
  });

  const items = data?.data ?? [];

  // The agent's own profile id is what a shared link credits.
  const { data: me } = useQuery({
    queryKey: ['agent', 'me'],
    queryFn: () => agentsApi.me(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">My listings</h1>
        <p className="text-[14px] text-[#5f6368]">
          Properties assigned to you by the developers you partner with.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#80868b]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#dadce0] bg-white py-16 text-center">
          <Building2 size={28} className="text-[#dadce0]" />
          <p className="max-w-sm text-[15px] text-[#5f6368]">
            Nothing assigned yet. Once a developer partners with you and assigns a
            property, it appears here with its commission.
          </p>
          <Link
            href="/agent/partners"
            className="mt-1 text-[14px] font-medium text-[#1a73e8] hover:text-[#1765cc]"
          >
            Find developers to partner with
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
              <Link href={`/${a.property.slug}`} className="relative block h-40 bg-[#f1f3f4]">
                {a.property.heroImageUrl ? (
                  <Image
                    src={a.property.heroImageUrl}
                    alt={a.property.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[#c4c4c8]">
                    <Building2 size={24} />
                  </span>
                )}
              </Link>
              <div className="p-4">
                <p className="truncate text-[15px] font-medium text-[#202124]">{a.property.name}</p>
                <p className="truncate text-[13px] text-[#5f6368]">
                  {[a.property.neighborhood, a.property.city].filter(Boolean).join(', ')}
                </p>
                <p className="mt-2 text-[15px] font-medium text-[#202124]">
                  {a.property.priceFrom
                    ? formatPrice(a.property.priceFrom, a.property.currency)
                    : 'Price on request'}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] text-[#5f6368]">
                    {a.partnership.developer.companyName}
                  </span>
                  <span className="shrink-0 rounded-full bg-[#e8f0fe] px-2.5 py-1 text-[12px] font-medium text-[#1967d2]">
                    {a.effectiveCommission != null ? `${a.effectiveCommission}%` : 'No rate'}
                  </span>
                </div>
                {a.notes && (
                  <p className="mt-2 line-clamp-2 text-[13px] text-[#5f6368]">{a.notes}</p>
                )}

                {/* The link that makes attribution work — anyone who enquires
                    through it is credited to this agent. */}
                {me?.id && (
                  <ShareLinkButton
                    path={`/${a.property.slug}`}
                    agentId={me.id}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3.5 py-2 text-[13px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] cursor-pointer"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data.meta.hasPrev}
            className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#5f6368] disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <span className="text-[14px] text-[#5f6368]">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.meta.hasNext}
            className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#5f6368] disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
