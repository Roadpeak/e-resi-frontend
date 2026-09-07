'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MapPinned } from 'lucide-react';
import { neighborhoodsApi } from '../../lib/api/neighborhoods';

/**
 * The browse page's right rail: area guides with a photo, so the space beside
 * the list sells neighbourhoods rather than sitting empty. Each card carries
 * the live count of properties currently listed there and opens the area's
 * own page. Renders nothing while there are no guides to show.
 */
export function NeighbourhoodsRail() {
  const { data } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => neighborhoodsApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const rows = data ?? [];
  if (rows.length === 0) return null;

  return (
    <aside className="sticky top-24 hidden w-[330px] shrink-0 xl:block">
      <h2 className="text-[17px] font-bold text-gray-900">Explore neighbourhoods</h2>
      <p className="mt-0.5 text-[13px] text-gray-500">
        Get to know the areas behind the listings.
      </p>

      <div className="mt-4 flex max-h-[calc(100vh-12rem)] flex-col gap-3 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((n) => (
          <Link
            key={n.id}
            href={`/neighbourhoods/${n.slug}`}
            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-md"
          >
            <div className="relative h-32 w-full overflow-hidden bg-gray-100">
              {n.heroImageUrl ? (
                <Image
                  src={n.heroImageUrl}
                  alt={n.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="330px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <MapPinned size={26} className="text-gray-300" />
                </div>
              )}
              <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-sm">
                {n.propertyCount} propert{n.propertyCount === 1 ? 'y' : 'ies'}
              </span>
            </div>
            <div className="px-4 py-3">
              <p className="truncate text-[15px] font-semibold text-gray-900">{n.name}</p>
              <p className="text-[13px] text-gray-500">{n.city}</p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
