'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  ChevronDown,
  MapPin,
  Loader2,
  SlidersHorizontal,
  X,
  Box,
  Headset,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFiltersStore } from '../../lib/stores/filters.store';
import { useProperties } from '../../lib/api/queries';
import { PropertyCard } from './PropertyCard';
import { Pagination } from '../ui/Pagination';
// MapLibre touches window/document on import — keep it out of the server bundle.
const PropertiesMapView = dynamic(
  () => import('./PropertiesMapView').then((m) => m.PropertiesMapView),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#e8eaed]" /> },
);
import { cn } from '../../lib/utils';
import { NeedAgentHelp } from '../agents/NeedAgentHelp';
import type { Property, PropertyCategory, PropertyStatus } from '../../lib/types';

const CATEGORIES: { value: PropertyCategory; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartments' },
  { value: 'VILLA', label: 'Villas' },
  { value: 'TOWNHOUSE', label: 'Townhouses' },
  { value: 'PENTHOUSE', label: 'Penthouses' },
  { value: 'OFFICE', label: 'Offices' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'LAND', label: 'Land' },
];

const STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'off_plan', label: 'Off Plan' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'ready', label: 'Ready to Move' },
];

const PAGE_SIZE = 9;

const PRICE_STEPS = [5, 10, 20, 30, 50, 80, 100, 150].map((m) => m * 1_000_000);

function formatShortPrice(v: number) {
  return `${v / 1_000_000}M`;
}

/**
 * `lockedCategory` powers the dedicated type routes (/apartments, /villas,
 * /commercial): the category is fixed by the route rather than chosen in the
 * filter bar, so the Type control is hidden and the heading names the type.
 */
export function PropertiesPage({
  lockedCategory,
  heading,
}: {
  lockedCategory?: PropertyCategory;
  heading?: string;
} = {}) {
  const { filters, setFilter, resetFilters } = useFiltersStore();
  const [showFullMap, setShowFullMap] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [focusPropertyId, setFocusPropertyId] = useState<string | null>(null);

  // The filter store is global and survives navigation, so a stale category
  // from a previous page would otherwise leak into a locked-category route.
  useEffect(() => {
    if (lockedCategory) setFilter('category', lockedCategory);
  }, [lockedCategory, setFilter]);

  // Build API query from filter store state
  const query = {
    search: filters.query,
    category: lockedCategory ?? filters.category,
    status: filters.status,
    city: filters.city,
    neighborhood: filters.neighborhood,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    bedrooms: filters.bedrooms,
    has3DTour: filters.has3DTour,
    hasVRTour: filters.hasVRTour,
    sortBy: filters.sortBy,
  };

  // Paginated server-side: only the current page is fetched.
  const { data, isLoading, isError } = useProperties({ ...query, page, limit: PAGE_SIZE });
  const results: Property[] = (data?.items as unknown as Property[]) ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // The map plots every match, not just the visible page.
  const { data: mapData } = useProperties({ ...query, limit: 100 });
  const mapResults: Property[] = (mapData?.items as unknown as Property[]) ?? [];

  // Narrowing the filters can leave the current page out of range.
  const filterKey = JSON.stringify(query);
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  // Unfiltered set — used to derive city / neighborhood options (query dedup'd by react-query)
  const { data: allData } = useProperties({ limit: 100 });
  const allItems: Property[] = (allData?.items as unknown as Property[]) ?? [];
  const cities = useMemo(() => {
    const set = new Set<string>(allItems.map((p) => p.address.city).filter(Boolean));
    if (set.size === 0) set.add('Nairobi');
    return Array.from(set).sort();
  }, [allItems]);
  const neighborhoods = useMemo(() => {
    const set = new Set<string>(
      allItems
        .filter((p) => !filters.city || p.address.city === filters.city)
        .map((p) => p.address.neighborhood)
        .filter(Boolean),
    );
    return Array.from(set).sort();
  }, [allItems, filters.city]);

  // On a locked-category route the category isn't a user-applied filter, so it
  // must not light up "Clear filters" — nor be cleared by it.
  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) =>
      k !== 'sortBy' &&
      !(lockedCategory && k === 'category') &&
      v !== undefined &&
      v !== '',
  );

  function clearFilters() {
    resetFilters();
    if (lockedCategory) setFilter('category', lockedCategory);
  }

  // Lock page scroll only while the fullscreen map is open
  useEffect(() => {
    if (!showFullMap) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prev;
    };
  }, [showFullMap]);

  return (
    <div className="min-h-screen pt-16 pb-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* ── Hero banner ── */}
        <HeroBanner
          city={filters.city}
          cities={cities}
          image={mapResults[0]?.heroImageUrl}
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
            hideTypeSelect={!!lockedCategory}
          />
        </div>

        {/* ── Results + map ── */}
        <div className="mt-8 flex items-start gap-6 lg:mt-10">
          {/* Cards column */}
          <section className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{heading ?? 'Best options'}</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {isLoading ? 'Searching…' : `${total} properties found`}
                </p>
                {/* Scoped to whatever the visitor is actually browsing, so the
                    picker only offers agents who handle this kind of sale. */}
                <div className="mt-3">
                  <NeedAgentHelp category={lockedCategory ?? filters.category} deal="BUY" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
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
                <Loader2 size={32} className="animate-spin text-brand-400" />
              </div>
            ) : isError ? (
              <ErrorState onRetry={clearFilters} />
            ) : results.length === 0 ? (
              <EmptyState onReset={clearFilters} />
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {results.map((p, i) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      index={i}
                      view="list"
                      onViewOnMap={() => {
                        setFocusPropertyId(p.id);
                        if (window.matchMedia('(max-width: 1023px)').matches) setShowFullMap(true);
                      }}
                    />
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

          {/* Map panel — always visible on lg+ */}
          <aside className="sticky top-20 hidden h-[calc(100vh-6.5rem)] w-[40%] max-w-[560px] shrink-0 overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-sm lg:block">
            <div className="relative h-full w-full">
              <PropertiesMapView properties={mapResults} focusPropertyId={focusPropertyId} />
            </div>
            <div className="absolute inset-x-5 bottom-4 z-30">
              <button
                onClick={() => setShowFullMap(true)}
                className="w-full cursor-pointer rounded-full bg-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-colors hover:bg-brand-700"
              >
                Go to map
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile map button */}
      <button
        onClick={() => setShowFullMap(true)}
        className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition-colors hover:bg-brand-700 lg:hidden"
      >
        <MapPin size={15} /> Map
      </button>

      {/* Fullscreen map overlay */}
      <AnimatePresence>
        {showFullMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[60] bg-white"
          >
            <PropertiesMapView properties={mapResults} focusPropertyId={focusPropertyId} />
            <div className="absolute left-1/2 top-5 z-30 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-md">
              {results.length} properties
            </div>
            <button
              onClick={() => setShowFullMap(false)}
              className="absolute right-5 top-5 z-30 flex cursor-pointer items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-gray-700"
            >
              <X size={14} /> Close map
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
  onCityChange: (city?: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-[240px] overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 sm:h-[280px]"
    >
      {/* Featured property image, right side (from live results) */}
      {image && (
        <div className="absolute inset-y-0 right-0 w-[70%] sm:w-[60%]">
          <Image
            src={image}
            alt="Featured property"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 70vw, 60vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-brand-600/40 to-transparent" />
        </div>
      )}
      {/* Soft brand wash over the left for legibility */}
      <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-brand-700/90 via-brand-600/70 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-center px-7 pb-8 sm:px-12">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Search in</h1>
        <div className="relative mt-2 inline-flex w-fit items-center gap-1.5 cursor-pointer">
          <span className="text-lg font-medium text-white/85 sm:text-xl">
            {city ?? 'All cities'}
          </span>
          <ChevronDown size={18} className="text-gold-300" />
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
  hideTypeSelect = false,
}: {
  moreOpen: boolean;
  onToggleMore: () => void;
  neighborhoods: string[];
  hideTypeSelect?: boolean;
}) {
  const { filters, setFilter, resetFilters } = useFiltersStore();
  const bedroomOptions = [1, 2, 3, 4];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-300/30"
    >
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 p-2.5">
        {/* Search now lives in the persistent navbar — both wrote to the same
            filters.query, so keeping it here duplicated the control. */}

        {/* Status — “For sale” slot */}
        <BarSelect
          label={filters.status ? STATUSES.find((s) => s.value === filters.status)?.label ?? 'For sale' : 'For sale'}
          value={filters.status ?? ''}
          onChange={(v) => setFilter('status', (v || undefined) as PropertyStatus | undefined)}
          options={[{ value: '', label: 'Any status' }, ...STATUSES]}
          ariaLabel="Status"
        />

        <Divider />

        {/* Category — “Type” slot. Hidden on the dedicated type routes, where
            the route itself already fixes the category. */}
        {!hideTypeSelect && (
          <>
            <BarSelect
              label={`Type: ${filters.category ? CATEGORIES.find((c) => c.value === filters.category)?.label : 'Any'}`}
              value={filters.category ?? ''}
              onChange={(v) => setFilter('category', (v || undefined) as PropertyCategory | undefined)}
              options={[{ value: '', label: 'Any type' }, ...CATEGORIES]}
              ariaLabel="Property type"
            />
            <Divider />
          </>
        )}

        {/* Bedroom chips */}
        <div className="flex items-center gap-1.5 px-2">
          <span className="text-xs font-medium text-gray-500">Room:</span>
          {bedroomOptions.map((n) => {
            const active = filters.bedrooms === n;
            return (
              <button
                key={n}
                onClick={() => setFilter('bedrooms', active ? undefined : n)}
                className={cn(
                  'flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-lg px-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-gold-400 text-gray-900 shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800',
                )}
              >
                {n === 4 ? '4+' : n}
              </button>
            );
          })}
        </div>

        <Divider />

        {/* Min price */}
        <BarSelect
          label={`Min: ${filters.priceMin ? `KES ${formatShortPrice(filters.priceMin)}` : 'Any'}`}
          value={filters.priceMin?.toString() ?? ''}
          onChange={(v) => setFilter('priceMin', v ? Number(v) : undefined)}
          options={[
            { value: '', label: 'No min' },
            ...PRICE_STEPS.map((p) => ({ value: p.toString(), label: `KES ${formatShortPrice(p)}` })),
          ]}
          ariaLabel="Minimum price"
        />

        <Divider />

        {/* Max price */}
        <BarSelect
          label={`Max: ${filters.priceMax ? `KES ${formatShortPrice(filters.priceMax)}` : 'Any'}`}
          value={filters.priceMax?.toString() ?? ''}
          onChange={(v) => setFilter('priceMax', v ? Number(v) : undefined)}
          options={[
            { value: '', label: 'No max' },
            ...PRICE_STEPS.map((p) => ({ value: p.toString(), label: `KES ${formatShortPrice(p)}` })),
          ]}
          ariaLabel="Maximum price"
        />

        <Divider />

        {/* More */}
        <button
          onClick={onToggleMore}
          className={cn(
            'ml-auto flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors',
            moreOpen
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          )}
        >
          <SlidersHorizontal size={12} /> More
        </button>
      </div>

      {/* More filters — collapsible */}
      <AnimatePresence initial={false}>
        {moreOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-4 py-4">
              {/* Neighborhoods */}
              {neighborhoods.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Neighborhood
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {neighborhoods.map((n) => {
                      const active = filters.neighborhood === n;
                      return (
                        <button
                          key={n}
                          onClick={() => setFilter('neighborhood', active ? undefined : n)}
                          className={cn(
                            'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            active
                              ? 'border-brand-200 bg-brand-50 text-brand-700'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800',
                          )}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tour type */}
              <div className="mb-1 flex flex-wrap items-center gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Immersive tours
                </p>
                <button
                  onClick={() => setFilter('has3DTour', filters.has3DTour ? undefined : true)}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    filters.has3DTour
                      ? 'border-brand-200 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800',
                  )}
                >
                  <Box size={12} /> 3D Tour
                </button>
                <button
                  onClick={() => setFilter('hasVRTour', filters.hasVRTour ? undefined : true)}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    filters.hasVRTour
                      ? 'border-brand-200 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800',
                  )}
                >
                  <Headset size={12} /> VR Experience
                </button>
                <button
                  onClick={resetFilters}
                  className="ml-auto cursor-pointer text-xs font-medium text-brand-600 transition-colors hover:text-brand-800"
                >
                  Clear all
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Divider() {
  return <span className="hidden h-6 w-px bg-gray-200 xl:block" />;
}

/** Pill segment: visible label + invisible native select layered on top. */
function BarSelect({
  label,
  value,
  onChange,
  options,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div className="relative flex cursor-pointer items-center gap-1 rounded-xl px-3 py-2 transition-colors hover:bg-gray-50">
      <span className="whitespace-nowrap text-xs font-medium text-gray-700">{label}</span>
      <ChevronDown size={12} className="text-gray-400" />
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

/* ── Sort ────────────────────────────────────────────────── */

function SortSelect() {
  const { filters, setFilter } = useFiltersStore();
  return (
    <div className="relative">
      <select
        value={filters.sortBy ?? 'featured'}
        onChange={(e) => setFilter('sortBy', e.target.value as never)}
        className="cursor-pointer appearance-none rounded-full border border-gray-200 bg-white py-1.5 pl-3.5 pr-8 text-xs font-medium text-gray-600 focus:border-brand-300 focus:outline-none"
      >
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
      <ChevronDown
        size={11}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}

/* ── States ──────────────────────────────────────────────── */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center shadow-sm">
      <p className="mb-4 text-4xl">🏠</p>
      <p className="mb-1 font-semibold text-gray-700">No properties found</p>
      <p className="mb-5 text-sm text-gray-400">Try adjusting your filters.</p>
      <button
        onClick={onReset}
        className="cursor-pointer rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Reset filters
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center shadow-sm">
      <p className="mb-4 text-4xl">⚠️</p>
      <p className="mb-1 font-semibold text-gray-700">Failed to load properties</p>
      <p className="mb-5 text-sm text-gray-400">Check your connection and try again.</p>
      <button
        onClick={onRetry}
        className="cursor-pointer rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Retry
      </button>
    </div>
  );
}
