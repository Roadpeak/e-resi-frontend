'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronDown, Loader2, SlidersHorizontal } from 'lucide-react';
import { useRentFiltersStore } from '../../lib/stores/rent-filters.store';
import { useRentListings } from '../../lib/api/queries';
import { RentCard } from './RentCard';
import { Pagination } from '../ui/Pagination';
import { cn } from '../../lib/utils';
import type { RentListing, RentFilters, FurnishingType } from '../../lib/types';

const FURNISHINGS: { value: FurnishingType; label: string }[] = [
  { value: 'furnished', label: 'Furnished' },
  { value: 'semi_furnished', label: 'Semi-furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
];

const PAGE_SIZE = 9;

const PRICE_STEPS = [50_000, 80_000, 120_000, 200_000, 350_000, 500_000, 1_000_000];

function applyClientFilters(listings: RentListing[], filters: RentFilters): RentListing[] {
  let result = [...listings];
  if (filters.neighborhood)  result = result.filter((l) => l.address.neighborhood === filters.neighborhood);
  if (filters.furnishing)    result = result.filter((l) => l.furnishing === filters.furnishing || l.units.some((u) => u.furnishing === filters.furnishing));
  if (filters.priceMin)      result = result.filter((l) => l.priceTo >= filters.priceMin!);
  if (filters.priceMax)      result = result.filter((l) => l.priceFrom <= filters.priceMax!);
  if (filters.bedrooms)      result = result.filter((l) => l.units.some((u) => u.bedrooms >= filters.bedrooms!));
  if (filters.show3DTour)    result = result.filter((l) => l.show3DTour);
  if (filters.showCinematicTour) result = result.filter((l) => l.showCinematicTour);
  if (filters.sortBy === 'price_asc')  result.sort((a, b) => a.priceFrom - b.priceFrom);
  else if (filters.sortBy === 'price_desc') result.sort((a, b) => b.priceFrom - a.priceFrom);
  else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

export function RentPage() {
  const { filters, setFilter, resetFilters } = useRentFiltersStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Search query and city go to the server; everything else filters client-side
  const { data, isLoading } = useRentListings({
    limit: 100,
    city: filters.city,
    q: filters.query,
  });

  const all = data?.items ?? [];
  const results = useMemo(() => applyClientFilters(all, filters), [all, filters]);

  const cities = useMemo(
    () => Array.from(new Set(all.map((l) => l.address.city).filter(Boolean))),
    [all],
  );
  const neighborhoods = useMemo(
    () =>
      Array.from(
        new Set(
          all
            .filter((l) => !filters.city || l.address.city === filters.city)
            .map((l) => l.address.neighborhood)
            .filter(Boolean),
        ),
      ),
    [all, filters.city],
  );

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // A narrower filter can leave the current page out of range. Key on the
  // serialised values — the store hands back a new object every render.
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== 'sortBy' && v !== undefined && v !== '',
  );

  return (
    <div className="min-h-screen pt-16 pb-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* ── Hero banner ── */}
        <HeroBanner
          city={filters.city}
          cities={cities}
          image={all[0]?.heroImageUrl}
          onCityChange={(c) => {
            setFilter('city', c);
            setFilter('neighborhood', undefined);
          }}
        />

        {/* ── Floating filter bar ── */}
        <div className="relative z-20 -mt-9 px-3 sm:px-6 lg:px-10">
          <FilterBar
            moreOpen={moreOpen}
            onToggleMore={() => setMoreOpen((v) => !v)}
            neighborhoods={neighborhoods}
          />
        </div>

        {/* ── Results ── */}
        <section className="mt-8 lg:mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Available rentals</h2>
              <p className="mt-0.5 text-sm text-gray-600">
                {isLoading ? 'Searching…' : `${results.length} listings available`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="cursor-pointer rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-800"
                >
                  Clear filters
                </button>
              )}
              <SortSelect />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white/60 py-24 text-center">
              <p className="mb-3 text-4xl">🏠</p>
              <p className="mb-1 text-lg font-bold text-gray-900">No listings found</p>
              <p className="mb-5 text-base text-gray-600">Try adjusting your filters.</p>
              <button
                onClick={resetFilters}
                className="cursor-pointer rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            /* Tiled view — kept from the original rent page */
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pageResults.map((l, i) => (
                  <RentCard key={l.id} listing={l} index={i} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/* ── Hero banner ─────────────────────────────────────────── */

function HeroBanner({
  city,
  cities,
  image,
  onCityChange,
}: {
  city?: string;
  cities: string[];
  image?: string;
  onCityChange: (c: string | undefined) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-[280px] overflow-hidden rounded-3xl bg-gray-900 sm:h-[300px]"
    >
      {image && (
        <div className="absolute inset-y-0 right-0 w-[70%]">
          <Image
            src={image}
            alt="Featured rental"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 70vw, 60vw"
          />
        </div>
      )}
      <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-center px-7 pb-8 sm:px-12">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Rent in</h1>
        <div className="relative mt-2 inline-flex w-fit cursor-pointer items-center gap-1.5">
          <span className="text-lg font-medium text-white/85 sm:text-xl">{city ?? 'All cities'}</span>
          <ChevronDown size={18} className="text-white/70" />
          <select
            aria-label="City"
            value={city ?? ''}
            onChange={(e) => onCityChange(e.target.value || undefined)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Floating filter bar ─────────────────────────────────── */

function FilterBar({
  moreOpen,
  onToggleMore,
  neighborhoods,
}: {
  moreOpen: boolean;
  onToggleMore: () => void;
  neighborhoods: string[];
}) {
  const { filters, setFilter } = useRentFiltersStore();
  const bedroomOptions = [1, 2, 3, 4];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-300/30"
    >
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 p-2.5">
        {/* Furnishing */}
        <BarSelect
          label={
            filters.furnishing
              ? FURNISHINGS.find((f) => f.value === filters.furnishing)?.label ?? 'Furnishing'
              : 'Furnishing'
          }
          value={filters.furnishing ?? ''}
          onChange={(v) => setFilter('furnishing', (v || undefined) as FurnishingType | undefined)}
          options={[{ value: '', label: 'Any furnishing' }, ...FURNISHINGS]}
          ariaLabel="Furnishing"
        />

        <Divider />

        {/* Neighborhood */}
        <BarSelect
          label={filters.neighborhood ?? 'Area'}
          value={filters.neighborhood ?? ''}
          onChange={(v) => setFilter('neighborhood', v || undefined)}
          options={[
            { value: '', label: 'Any area' },
            ...neighborhoods.map((n) => ({ value: n, label: n })),
          ]}
          ariaLabel="Neighborhood"
        />

        <Divider />

        {/* Bedrooms */}
        <div className="flex items-center gap-1.5 px-2.5">
          <span className="text-sm text-gray-500">Room:</span>
          {bedroomOptions.map((n) => (
            <button
              key={n}
              onClick={() => setFilter('bedrooms', filters.bedrooms === n ? undefined : n)}
              className={cn(
                'h-7 w-7 cursor-pointer rounded-full text-xs font-semibold transition-colors',
                filters.bedrooms === n
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {n}
              {n === 4 ? '+' : ''}
            </button>
          ))}
        </div>

        <Divider />

        {/* Price */}
        <BarSelect
          label={`Min: ${filters.priceMin ? `${filters.priceMin / 1000}K` : 'Any'}`}
          value={filters.priceMin?.toString() ?? ''}
          onChange={(v) => setFilter('priceMin', v ? Number(v) : undefined)}
          options={[
            { value: '', label: 'No minimum' },
            ...PRICE_STEPS.map((p) => ({ value: String(p), label: `${p / 1000}K` })),
          ]}
          ariaLabel="Minimum rent"
        />

        <Divider />

        <BarSelect
          label={`Max: ${filters.priceMax ? `${filters.priceMax / 1000}K` : 'Any'}`}
          value={filters.priceMax?.toString() ?? ''}
          onChange={(v) => setFilter('priceMax', v ? Number(v) : undefined)}
          options={[
            { value: '', label: 'No maximum' },
            ...PRICE_STEPS.map((p) => ({ value: String(p), label: `${p / 1000}K` })),
          ]}
          ariaLabel="Maximum rent"
        />

        <button
          onClick={onToggleMore}
          className={cn(
            'ml-auto flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            moreOpen ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          )}
        >
          <SlidersHorizontal size={14} /> More
        </button>
      </div>

      {/* Expanded: tour options */}
      {moreOpen && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-3">
          <span className="mr-1 text-sm font-medium text-gray-500">Tours:</span>
          <Toggle
            active={!!filters.showCinematicTour}
            onClick={() =>
              setFilter('showCinematicTour', filters.showCinematicTour ? undefined : true)
            }
          >
            Cinematic tour
          </Toggle>
          <Toggle
            active={!!filters.show3DTour}
            onClick={() => setFilter('show3DTour', filters.show3DTour ? undefined : true)}
          >
            3D tour
          </Toggle>
        </div>
      )}
    </motion.div>
  );
}

function Divider() {
  return <span className="hidden h-6 w-px bg-gray-200 sm:block" />;
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
      )}
    >
      {children}
    </button>
  );
}

function BarSelect({
  label,
  value,
  onChange,
  options,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div className="relative flex items-center">
      <span className="whitespace-nowrap px-2.5 text-sm font-medium text-gray-800">{label}</span>
      <ChevronDown size={14} className="pointer-events-none -ml-1 mr-1 text-gray-400" />
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SortSelect() {
  const { filters, setFilter } = useRentFiltersStore();
  return (
    <div className="relative">
      <select
        value={filters.sortBy ?? 'newest'}
        onChange={(e) => setFilter('sortBy', e.target.value as RentFilters['sortBy'])}
        className="cursor-pointer appearance-none rounded-full border border-gray-300 bg-white py-2 pl-4 pr-8 text-sm font-semibold text-gray-800 focus:border-gray-900 focus:outline-none"
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price ↑</option>
        <option value="price_desc">Price ↓</option>
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
      />
    </div>
  );
}
