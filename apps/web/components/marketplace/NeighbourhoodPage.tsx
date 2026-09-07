'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote, Building2, ChevronRight, Church, Coffee, Dumbbell, Fuel,
  GraduationCap, Home, Loader2, MapPin, Shield, ShoppingCart, Stethoscope, Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { neighborhoodsApi, type AreaAmenities } from '../../lib/api/neighborhoods';
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

        {/* ── Hero, after PropertyFinder's area-insights pages: the area
            photo as a slanted panel on the right, and a solid white card
            floating over its left edge with the facts and actions. ── */}
        <div className="relative sm:min-h-[400px]">
          <div
            className="relative ml-auto h-[240px] w-full overflow-hidden sm:h-[400px] sm:w-[64%] sm:[clip-path:polygon(9%_0%,100%_0%,91%_100%,0%_100%)]"
          >
            {gallery[0] ? (
              <Image src={gallery[0]} alt={hood.name} fill priority className="object-cover" sizes="(max-width: 640px) 100vw, 60vw" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-brand-700 to-brand-500" />
            )}
          </div>

          <div className="relative -mt-10 px-2 sm:absolute sm:left-0 sm:top-1/2 sm:mt-0 sm:w-[46%] sm:-translate-y-1/2 sm:px-0">
            <div className="rounded-2xl bg-white p-6 shadow-[0_12px_45px_rgba(20,20,43,0.10)] sm:p-8">
              <h1 className="text-[30px] font-bold leading-tight text-gray-900 sm:text-[34px]">
                {hood.name}
              </h1>

              {/* Trait chips with hairline dividers, PF-style */}
              <div className="mt-3 flex flex-wrap items-center text-[15px] font-semibold text-gray-800">
                <span className="flex items-center gap-1.5 pr-4">
                  <MapPin size={15} className="text-gray-500" /> {hood.city}
                </span>
                <span className="flex items-center gap-1.5 border-l border-gray-200 px-4">
                  <Building2 size={15} className="text-gray-500" /> Residential guide
                </span>
              </div>

              {/* The number row — where PF shows the rating, we show the
                  live inventory: the count is the area's pulse here. */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[32px] font-bold leading-none text-gray-900">
                  {hood.propertyCount}
                </span>
                <span className="text-[15px] text-gray-600">
                  <Link href="#properties" className="font-semibold text-gray-900 underline underline-offset-2 hover:text-brand-600">
                    Propert{hood.propertyCount === 1 ? 'y' : 'ies'} listed
                  </Link>
                  <span className="block text-[13.5px] text-gray-500">
                    Currently available in {hood.name}
                  </span>
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="#properties"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  View properties
                </Link>
                {hasCoords && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${hood.latitude},${hood.longitude}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-[15px] font-semibold text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50"
                  >
                    <MapPin size={15} /> Get directions
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section tabs, PF-style: one row that follows the reader and
            underlines whichever section is on screen. Only sections that
            actually have content earn a tab. ── */}
        <SectionTabs
          sections={[
            { id: 'neighborhood', label: 'Neighborhood', show: true },
            { id: 'amenities', label: 'Amenities', show: hasCoords },
            { id: 'experts', label: 'Ask Local Experts', show: true },
          ]}
        />

        {/* One flat surface from here down — hairline rules separate the
            sections; cards are kept only where they carry data (listings). */}
        <div className="divide-y divide-gray-200">
        <section id="neighborhood" className="scroll-mt-32 py-10">
          {gallery.length > 0 && (
            <>
              <h2 className="text-[22px] font-bold text-gray-900">A look around {hood.name}</h2>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {gallery.map((url) => (
                  <div key={url} className="relative h-52 w-80 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                    <Image src={url} alt="" fill className="object-cover" sizes="320px" />
                  </div>
                ))}
              </div>
            </>
          )}

          {hood.description && (
            <div className={gallery.length > 0 ? 'mt-8' : ''}>
              <h2 className="text-[22px] font-bold text-gray-900">
                What you need to know about {hood.name}
              </h2>
              <p className="mt-3 max-w-3xl whitespace-pre-line text-[15.5px] leading-relaxed text-gray-600">
                {hood.description}
              </p>
            </div>
          )}
        </section>

        {/* ── Amenities: auto-detected from OpenStreetMap around the pin —
            nothing curated, the area fills its own scorecard. ── */}
        {hasCoords && <AmenitiesSection slug={hood.slug} name={hood.name} />}

        {/* ── Location + street view ── */}
        {hasCoords && (
          <section className="py-10">
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

        {/* ── Ask local experts ── */}
        <section id="experts" className="scroll-mt-32 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-[22px] font-bold text-gray-900">
                <Users size={20} className="text-brand-600" /> Ask local experts
              </h2>
              <p className="mt-1 max-w-xl text-[15px] text-gray-600">
                Verified agents who work {hood.name} and the surrounding areas can answer
                anything a page can&apos;t — pricing, availability, what it&apos;s really like to live here.
              </p>
            </div>
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Find an agent
            </Link>
          </div>
        </section>

        {/* ── Listings ── */}
        <section id="properties" className="scroll-mt-24 py-10">
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
    </div>
  );
}

/**
 * The PF-style section tab row: sticky under the navbar, underlining the
 * section currently on screen. Plain anchors — the browser does the travel,
 * an IntersectionObserver just moves the underline.
 */
function SectionTabs({ sections }: { sections: { id: string; label: string; show: boolean }[] }) {
  const visible = useMemo(() => sections.filter((s) => s.show), [sections]);
  const [active, setActive] = useState(visible[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    for (const s of visible) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [visible]);

  return (
    <nav className="sticky top-16 z-30 -mx-4 mt-8 border-b border-gray-200 bg-gray-50/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              'relative whitespace-nowrap px-4 py-3.5 text-[14.5px] font-medium transition-colors',
              'after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full after:transition-all',
              active === s.id
                ? 'text-gray-900 after:bg-brand-600'
                : 'text-gray-500 hover:text-gray-800 after:bg-transparent',
            )}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  schools: <GraduationCap size={18} />,
  health: <Stethoscope size={18} />,
  dining: <Coffee size={18} />,
  shopping: <ShoppingCart size={18} />,
  banks: <Banknote size={18} />,
  parks: <Dumbbell size={18} />,
  fuel: <Fuel size={18} />,
  police: <Shield size={18} />,
  worship: <Church size={18} />,
};

/**
 * The area's surroundings, detected rather than written: schools, clinics,
 * supermarkets, cafés pulled live from OpenStreetMap around the pin and
 * grouped into buckets, each with its count and a few recognisable names.
 */
function AmenitiesSection({ slug, name }: { slug: string; name: string }) {
  const { data, isLoading } = useQuery<AreaAmenities>({
    queryKey: ['neighborhood', slug, 'amenities'],
    queryFn: () => neighborhoodsApi.amenities(slug),
    staleTime: 60 * 60 * 1000,
  });

  if (!isLoading && (!data || data.categories.length === 0)) return null;

  return (
    <section id="amenities" className="scroll-mt-32 py-10">
      <h2 className="text-[22px] font-bold text-gray-900">Amenities around {name}</h2>
      <p className="mt-1 text-[14px] text-gray-500">
        {data ? `${data.total} places detected nearby` : 'Looking around the area…'} · from OpenStreetMap
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 size={22} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {data!.categories.map((c) => (
            <div key={c.key}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  {AMENITY_ICONS[c.key] ?? <MapPin size={18} />}
                </span>
                <p className="text-[15.5px] font-semibold text-gray-900">
                  {c.label}
                  <span className="ml-1.5 text-[13.5px] font-normal text-gray-500">{c.count}</span>
                </p>
              </div>
              {c.names.length > 0 && (
                <p className="mt-2 pl-[46px] text-[13.5px] leading-relaxed text-gray-500">
                  {c.names.join(' · ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
