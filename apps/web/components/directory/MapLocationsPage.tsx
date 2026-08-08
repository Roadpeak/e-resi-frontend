'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useProperties } from '../../lib/api/queries';
import { DirectoryCard, DirectoryShell } from './DirectoryPrimitives';
import type { MappablePlace } from './DirectoryMap';

const DirectoryMap = dynamic(
  () => import('./DirectoryMap').then((m) => m.DirectoryMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[#e8eaea]" /> },
);

export function MapLocationsPage() {
  const { data, isLoading } = useProperties({ status: 'ACTIVE', limit: 100 });
  const properties = data?.items ?? [];

  const places: MappablePlace[] = useMemo(
    () =>
      properties.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        heroImageUrl: p.heroImageUrl || null,
        city: p.address.city,
        neighborhood: p.address.neighborhood,
        priceFrom: p.priceFrom || null,
        currency: p.currency,
        latitude: p.address.coordinates?.lat ?? null,
        longitude: p.address.coordinates?.lng ?? null,
      })),
    [properties],
  );

  const mapped = places.filter((p) => p.latitude != null && p.longitude != null);

  return (
    <DirectoryShell className="pt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold text-[#111112] sm:text-[32px]">
            All developments on the map
          </h1>
          <p className="mt-1.5 text-[15px] text-[#6b6b70]">
            {isLoading
              ? 'Loading developments…'
              : `${mapped.length} of ${properties.length} live developments have a mapped location.`}
          </p>
        </div>

        {isLoading ? (
          <DirectoryCard className="flex h-[420px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#8a8a90]" />
          </DirectoryCard>
        ) : (
          <DirectoryCard className="h-[70vh] min-h-[520px] overflow-hidden">
            <DirectoryMap places={mapped} className="rounded-[28px]" />
          </DirectoryCard>
        )}
      </div>
    </DirectoryShell>
  );
}
