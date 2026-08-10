'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, X } from 'lucide-react';
import {
  ALL_SPECIALTIES,
  SPECIALTY_LABELS,
  agentsApi,
  type AgentKind,
  type AgentSpecialty,
} from '../../lib/api/agents';
import { AgentCard } from './AgentCard';
import { DirectoryCard, DirectoryShell, PillButton } from './DirectoryPrimitives';
import { cn } from '../../lib/utils';

const PAGE_SIZE = 12;

/** Companies and individuals are chosen differently, so they get their own tabs. */
const TABS: { key: AgentKind | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All agents' },
  { key: 'COMPANY', label: 'Companies' },
  { key: 'INDIVIDUAL', label: 'Individual agents' },
];

export function AgentsDirectory({
  initialSpecialty,
}: {
  initialSpecialty?: AgentSpecialty;
}) {
  const [tab, setTab] = useState<AgentKind | 'ALL'>('ALL');
  const [specialty, setSpecialty] = useState<AgentSpecialty | undefined>(initialSpecialty);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Any narrowing can leave the current page out of range.
  useEffect(() => setPage(1), [tab, specialty, search]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['agents-directory', tab, specialty, search, page],
    queryFn: () =>
      agentsApi.list({
        page,
        limit: PAGE_SIZE,
        kind: tab === 'ALL' ? undefined : tab,
        specialty,
        q: search || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const agents = data?.data ?? [];
  const meta = data?.meta;

  return (
    <DirectoryShell className="pt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold leading-tight text-[#111112] sm:text-[38px]">
            Property agents in Kenya
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[#6b6b70]">
            Verified letting and sales agents — filter by what they handle, see how
            past clients rated them, and reach them directly.
          </p>
        </div>

        {/* Kind tabs */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-full px-4 py-2 text-[14px] font-medium transition-colors cursor-pointer',
                tab === t.key
                  ? 'bg-[#111112] text-white'
                  : 'bg-white text-[#6b6b70] hover:bg-[#e8e8ea]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + specialty */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="relative flex min-w-0 max-w-xs flex-1 items-center">
            <Search size={16} className="pointer-events-none absolute left-3.5 text-[#8a8a90]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or area…"
              aria-label="Search agents"
              className="h-10 w-full rounded-full border border-black/[0.08] bg-white pl-10 pr-9 text-[14px] text-[#111112] placeholder:text-[#8a8a90] outline-none focus:border-[#111112]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 text-[#8a8a90] hover:text-[#111112] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={specialty ?? ''}
            onChange={(e) => setSpecialty((e.target.value || undefined) as AgentSpecialty | undefined)}
            aria-label="Filter by specialty"
            className="h-10 cursor-pointer rounded-full border border-black/[0.08] bg-white px-4 text-[14px] text-[#111112] outline-none focus:border-[#111112]"
          >
            <option value="">All specialties</option>
            {ALL_SPECIALTIES.map((s) => (
              <option key={s} value={s}>{SPECIALTY_LABELS[s]}</option>
            ))}
          </select>

          {(specialty || search || tab !== 'ALL') && (
            <button
              onClick={() => { setSpecialty(undefined); setQuery(''); setTab('ALL'); }}
              className="rounded-full border border-black/[0.08] bg-white px-3.5 py-2 text-[13px] font-medium text-[#6b6b70] hover:text-[#111112] transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DirectoryCard key={i} className="h-[220px] animate-pulse bg-[#f0f0f2]" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <DirectoryCard className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Users size={32} className="text-[#c4c4c8]" />
            <p className="text-[15px] text-[#6b6b70]">
              {specialty || search || tab !== 'ALL'
                ? 'No agents match these filters yet.'
                : 'No agents listed yet — check back soon.'}
            </p>
          </DirectoryCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <PillButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrev || isFetching}
              className="bg-white text-[#111112] hover:bg-[#f0f0f2]"
            >
              Previous
            </PillButton>
            <span className="text-[14px] text-[#6b6b70]">
              Page {meta.page} of {meta.totalPages}
            </span>
            <PillButton
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.hasNext || isFetching}
            >
              Next
            </PillButton>
          </div>
        )}
      </div>
    </DirectoryShell>
  );
}
