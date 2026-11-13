'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPinned } from 'lucide-react';
import { neighborhoodsApi } from '../../lib/api/neighborhoods';

/**
 * The browse page's right rail: area guides with a photo, so the space beside
 * the list sells neighbourhoods rather than sitting empty. Each card carries
 * the live count of properties currently listed there and opens the area's
 * own page. Renders nothing while there are no guides to show.
 */
export function NeighbourhoodsRail({ variant = 'rail' }: { variant?: 'rail' | 'strip' } = {}) {
  const { data } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => neighborhoodsApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const rows = data ?? [];
  if (rows.length === 0) return null;

  // Below xl the side rail has no room, so the same guides sit above the
  // list as a swipeable row of smaller photo cards.
  if (variant === 'strip') {
    return (
      <div className="mb-6 xl:hidden">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <span className="mb-2 block h-1 w-9 rounded-full bg-gold-400" />
            <h2 className="text-[17px] font-bold text-gray-900">Explore neighbourhoods</h2>
          </div>
          <Link href="/neighbourhoods" className="shrink-0 text-[13px] font-medium text-brand-600 hover:text-brand-700">See all</Link>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
          {rows.map((n) => (
            <Link key={n.id} href={`/neighbourhoods/${n.slug}`}
              className="group relative block h-32 w-44 shrink-0 snap-start overflow-hidden rounded-2xl sm:h-36 sm:w-52">
              {n.heroImageUrl ? (
                <Image src={n.heroImageUrl} alt={n.name} fill className="object-cover" sizes="208px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                  <MapPinned size={22} className="text-white/40" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="truncate text-[14.5px] font-semibold text-white">{n.name}</p>
                <p className="text-[12px] text-white/80">
                  <span className="font-semibold text-gold-300">{n.propertyCount}</span> propert{n.propertyCount === 1 ? 'y' : 'ies'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="sticky top-24 hidden w-[330px] shrink-0 xl:block">
      {/* The gold kicker picks up the star-rating accent used across the
          site, so the rail answers the brand blues with a warm note. */}
      <span className="mb-2 block h-1 w-9 rounded-full bg-gold-400" />
      <h2 className="text-[17px] font-bold text-gray-900">Explore neighbourhoods</h2>
      <p className="mt-0.5 text-[13px] text-gray-500">
        Get to know the areas behind the listings.
      </p>

      <div className="mt-4 flex max-h-[calc(100vh-12rem)] flex-col gap-3 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((n) => (
          /* Sharp-edged photo tiles: the image is the card, and a bottom
             gradient carries the name, the live count and the way in. */
          <Link
            key={n.id}
            href={`/neighbourhoods/${n.slug}`}
            className="group relative block h-44 w-full overflow-hidden"
          >
            {n.heroImageUrl ? (
              <Image
                src={n.heroImageUrl}
                alt={n.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="330px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                <MapPinned size={26} className="text-white/40" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold text-white">{n.name}</p>
                <p className="text-[13px] text-white/80">
                  <span className="font-semibold text-gold-300">{n.propertyCount}</span>{' '}
                  propert{n.propertyCount === 1 ? 'y' : 'ies'}
                </p>
              </div>
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors group-hover:bg-gold-400 group-hover:text-gray-900"
              >
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
