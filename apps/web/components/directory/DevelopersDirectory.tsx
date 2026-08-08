'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { developersApi } from '../../lib/api/developers';
import { DeveloperCard } from './DeveloperCard';
import { DirectoryCard, DirectoryShell, PillButton } from './DirectoryPrimitives';

const PAGE_SIZE = 12;

export function DevelopersDirectory() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['developers-directory', page],
    queryFn: () => developersApi.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const developers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <DirectoryShell className="pt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold leading-tight text-[#111112] sm:text-[38px]">
            Top property developers in Kenya
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[#6b6b70]">
            Verified developers building across Kenya — browse their live developments,
            reach them directly, or explore a full profile.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DirectoryCard key={i} className="h-[220px] animate-pulse bg-[#f0f0f2]" />
            ))}
          </div>
        ) : developers.length === 0 ? (
          <DirectoryCard className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Building2 size={32} className="text-[#c4c4c8]" />
            <p className="text-[15px] text-[#6b6b70]">
              No developers to show yet — check back soon.
            </p>
          </DirectoryCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {developers.map((dev) => (
              <DeveloperCard key={dev.id} developer={dev} />
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
