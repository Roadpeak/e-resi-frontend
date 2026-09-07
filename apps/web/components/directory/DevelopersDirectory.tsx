'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { developersApi } from '../../lib/api/developers';
import { DeveloperCard } from './DeveloperCard';
import { DirectoryShell, PillButton } from './DirectoryPrimitives';

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
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Set like a gallery opening: tracked gold overline, the title in
            the display face, one quiet line beneath. */}
        <div className="mb-10 pt-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.35em] text-gold-500">
            The developers
          </p>
          <h1 className="mt-3 font-display text-[40px] font-light leading-[1.05] tracking-tight text-[#111112] sm:text-[52px]">
            Kenya&apos;s finest, building now
          </h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-[#6b6b70]">
            Verified developers with live developments you can walk through in
            cinematic, 3D and VR — explore their portfolios and reach them directly.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse bg-[#e4e4e7]" />
            ))}
          </div>
        ) : developers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-black/10 bg-white py-24 text-center">
            <Building2 size={32} className="text-[#c4c4c8]" />
            <p className="text-[15px] text-[#6b6b70]">
              No developers to show yet — check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
