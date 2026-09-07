'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Home, Loader2, MapPin } from 'lucide-react';
import { neighborhoodsApi } from '../../lib/api/neighborhoods';
import { useProperties } from '../../lib/api/queries';
import { PropertyListCard } from './PropertyListCard';
import type { Property } from '../../lib/types';

/**
 * An area guide, after PropertyFinder's area-insights pages: a hero card over
 * the area's photo, a look-around gallery, the story of the place, then its
 * location, street view, and every property currently listed there.
 */
export function NeighbourhoodPage({ slug }: { slug: string }) {
  const { data: hood, isLoading, isError } = useQuery({
    queryKey: ['neighborhood', slug],
    queryFn: () => neighborhoodsApi.get(slug),
    retry: false,
  });

  const { data: props } = useProperties(
    hood ? { neighborhood: hood.name, limit: 12 } : { limit: 0 },
  );
  const properties: Property[] = hood ? ((props?.items as unknown as Property[]) ?? []) : [];

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center pt-16">
        <Loader2 size={26} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError || !hood) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-40 text-center">
        <h1 className="text-[24px] font-semibold text-gray-900">Neighbourhood not found</h1>
        <Link href="/properties" className="mt-4 inline-block text-[15px] font-medium text-brand-600 hover:underline">
          Browse all properties
        </Link>
      </div>
    );
  }

  const gallery = [hood.heroImageUrl, ...hood.photos].filter(
    (u, i, arr): u is string => !!u && arr.indexOf(u) === i,
  );
  const hasCoords = hood.latitude != null && hood.longitude != null;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Trail */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[13.5px] text-[#6b6b70]">
          <Link href="/" aria-label="Home" className="transition-colors hover:text-[#111112]"><Home size={14} /></Link>
          <ChevronRight size={13} className="text-[#b9b9be]" />
          <Link href="/properties" className="transition-colors hover:text-[#111112]">Buy</Link>
          <ChevronRight size={13} className="text-[#b9b9be]" />
          <span className="text-[#6b6b70]">{hood.city}</span>
          <ChevronRight size={13} className="text-[#b9b9be]" />
          <span className="font-medium text-[#111112]">{hood.name}</span>
        </nav>

        {/* ── Hero: title card over the area photo ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gray-200">
          <div className="relative h-[300px] sm:h-[340px]">
            {gallery[0] ? (
              <Image src={gallery[0]} alt={hood.name} fill priority className="object-cover" sizes="100vw" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-brand-700 to-brand-500" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
          </div>
          <div className="absolute inset-y-0 left-0 flex items-center p-6 sm:p-10">
            <div className="max-w-md rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur sm:p-8">
              <p className="flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wide text-gray-500">
                <MapPin size={13} /> {hood.city}
              </p>
              <h1 className="mt-1 text-[30px] font-bold leading-tight text-gray-900 sm:text-[36px]">
                {hood.name}
              </h1>
              <p className="mt-2 text-[14.5px] text-gray-600">
                {hood.propertyCount} propert{hood.propertyCount === 1 ? 'y' : 'ies'} currently listed
              </p>
              <Link
                href="#properties"
                className="mt-4 inline-flex rounded-full bg-gray-900 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-gray-700"
              >
                View properties
              </Link>
            </div>
          </div>
        </div>

        {/* ── A look around ── */}
        {gallery.length > 1 && (
          <section className="mt-10">
            <h2 className="text-[22px] font-bold text-gray-900">A look around {hood.name}</h2>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {gallery.map((url) => (
                <div key={url} className="relative h-52 w-80 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                  <Image src={url} alt="" fill className="object-cover" sizes="320px" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── About ── */}
        {hood.description && (
          <section className="mt-10 max-w-3xl">
            <h2 className="text-[22px] font-bold text-gray-900">
              What you need to know about {hood.name}
            </h2>
            <p className="mt-3 whitespace-pre-line text-[15.5px] leading-relaxed text-gray-600">
              {hood.description}
            </p>
          </section>
        )}

        {/* ── Location + street view ── */}
        {hasCoords && (
          <section className="mt-10">
            <h2 className="text-[22px] font-bold text-gray-900">Location &amp; street view</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <iframe
                  title={`Map of ${hood.name}`}
                  src={`https://maps.google.com/maps?q=${hood.latitude},${hood.longitude}&z=14&output=embed`}
                  className="h-[320px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <iframe
                  title={`Street view of ${hood.name}`}
                  src={`https://www.google.com/maps?layer=c&cbll=${hood.latitude},${hood.longitude}&cbp=11,0,0,0,0&output=svembed`}
                  className="h-[320px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>
        )}

        {/* ── Listings ── */}
        <section id="properties" className="mt-10 scroll-mt-24">
          <h2 className="text-[22px] font-bold text-gray-900">
            Properties in {hood.name}
            <span className="ml-2 text-[15px] font-normal text-gray-500">{hood.propertyCount}</span>
          </h2>
          {properties.length === 0 ? (
            <p className="mt-3 text-[15px] text-gray-500">
              Nothing listed here right now — check back soon.
            </p>
          ) : (
            <div className="mt-5 flex max-w-5xl flex-col gap-4">
              {properties.map((p, i) => (
                <PropertyListCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
