'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Building2, Star, UserRound } from 'lucide-react';
import { apiClient } from '../../lib/api/client';

interface PartnerRow {
  id: string;
  developer: { id: string; companyName: string; logoUrl: string | null };
  agent: {
    id: string;
    displayName: string;
    kind: string;
    logoUrl: string | null;
    photoUrl: string | null;
    ratingAverage: number;
    ratingCount: number;
  };
}

interface Props {
  /** Whose profile this is — decides which side of the pair to show. */
  side: 'developer' | 'agent';
  /** DeveloperProfile id, or AgentProfile id. */
  profileId: string;
}

/**
 * Active partners, on a public profile.
 *
 * Both sides were being partnered in the dashboard and shown nowhere — a
 * buyer looking at a developer could not see which agents represent them,
 * and an agent's profile did not evidence who they actually work with. That
 * evidence is most of why a partnership is worth having.
 *
 * Renders nothing at all when there are no partners: an empty "Partners"
 * heading reads as a platform with no traction.
 */
export function PartnersStrip({ side, profileId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['public-partners', side, profileId],
    queryFn: () =>
      side === 'developer'
        ? apiClient.get<PartnerRow[]>(`/partnerships/public/developer/${profileId}`)
        : apiClient.get<PartnerRow[]>(`/agents/${profileId}/partners`),
    enabled: !!profileId,
  });

  const rows = data ?? [];
  if (isLoading || rows.length === 0) return null;

  const showingAgents = side === 'developer';

  return (
    <section className="mt-10">
      <h2 className="text-[20px] font-semibold text-gray-900">
        {showingAgents ? 'Agents representing us' : 'Developers we work with'}
      </h2>
      <p className="mt-1 text-[14px] text-gray-500">
        {showingAgents
          ? 'Verified agents you can go through for these developments.'
          : 'Active partnerships with verified developers.'}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          if (showingAgents) {
            const a = r.agent;
            const avatar = a.kind === 'COMPANY' ? a.logoUrl : a.photoUrl;
            return (
              <Link
                key={r.id}
                href={`/agents/${a.id}`}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                {avatar ? (
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                    <Image src={avatar} alt="" fill className="object-cover" sizes="44px" />
                  </span>
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                    {a.kind === 'COMPANY' ? <Building2 size={18} /> : <UserRound size={18} />}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-gray-900">
                    {a.displayName}
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
                    {a.kind === 'COMPANY' ? 'Company' : 'Individual'}
                    {a.ratingCount > 0 && (
                      <>
                        <span aria-hidden>·</span>
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {a.ratingAverage.toFixed(1)}
                      </>
                    )}
                  </span>
                </span>
              </Link>
            );
          }

          const d = r.developer;
          return (
            <Link
              key={r.id}
              href={`/developers/${d.id}`}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              {d.logoUrl ? (
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                  <Image src={d.logoUrl} alt="" fill className="object-contain p-1" sizes="44px" />
                </span>
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <Building2 size={18} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium text-gray-900">
                  {d.companyName}
                </span>
                <span className="text-[13px] text-gray-500">Developer</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
