'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, MapPin } from 'lucide-react';
import { useProperties } from '../../lib/api/queries';
import { DirectoryCard, DirectoryShell } from './DirectoryPrimitives';
import { DirectoryPropertyCard } from './DirectoryPropertyCard';
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
          <DirectoryCard className="h-[420px] overflow-hidden sm:h-[520px]">
            <DirectoryMap places={mapped} className="rounded-[28px]" />
          </DirectoryCard>
        )}

        {!isLoading && (
          <div className="mt-8">
            <h2 className="mb-4 text-[18px] font-semibold text-[#111112]">
              Developments shown on this map
            </h2>
            {places.length === 0 ? (
              <DirectoryCard className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <MapPin size={28} className="text-[#c4c4c8]" />
                <p className="text-[14px] text-[#6b6b70]">No live developments right now.</p>
              </DirectoryCard>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {places.map((place) => (
                  <DirectoryPropertyCard key={place.id} property={place} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DirectoryShell>
  );
}
