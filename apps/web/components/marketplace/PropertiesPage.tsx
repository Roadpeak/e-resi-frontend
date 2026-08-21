'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  ChevronDown,
  MapPinned,
  Loader2,
  SlidersHorizontal,
  X,
  Box,
  Headset,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFiltersStore } from '../../lib/stores/filters.store';
import { useProperties } from '../../lib/api/queries';
import { PropertyShowcaseCard } from './PropertyShowcaseCard';
import { browseSeed, weightedShuffle } from '../../lib/marketplace/shuffle';
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

/**
 * Only what the API can actually filter on. "Under Construction" was offered
 * here but has never existed in the backend enum, so selecting it 400'd and
 * the grid went empty — as did the other two, which were sent in the wrong
 * case.
 */
const STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'OFF_PLAN', label: 'Off Plan' },
  { value: 'ACTIVE', label: 'Ready to Move' },
  { value: 'SOLD_OUT', label: 'Sold Out' },
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

  /**
   * Vary which development leads, weighted towards recent ones.
   *
   * Applied to the fetched page rather than server-side: reshuffling the whole
   * result set per request would let a listing appear on two pages, or on
   * none, as a visitor pages through. Within a page the set is fixed, so only
   * the order moves.
   */
  const seed = useMemo(() => browseSeed(), []);
  const ordered = useMemo(
    () => weightedShuffle(results, seed + page),
    [results, seed, page],
  );

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

  /**
   * Escape closes the map.
   *
   * The page deliberately keeps scrolling behind the panel — the point of a
   * popup rather than a fullscreen view is that the results stay where they
   * were — so locking scroll, as the fullscreen version did, would work
   * against it.
   */
  useEffect(() => {
    if (!showFullMap) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFullMap(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

        {/* ── Results ──
            The map used to take 40% of every viewport for the whole session,
            whether or not anyone was using it. It is now summoned from the
            button at the bottom right, which gives each development the full
            width of the page. */}
        <div className="mt-8 lg:mt-10">
          <section className="min-w-0">
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
                <div className="flex flex-col gap-6 lg:gap-8">
                  {ordered.map((p, i) => (
                    <PropertyShowcaseCard
                      key={p.id}
                      property={p}
                      index={i}
                      onViewOnMap={() => {
                        setFocusPropertyId(p.id);
                        setShowFullMap(true);
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

        </div>
      </div>

      {/* ── Map summons ──
          One control on every breakpoint, bottom right, out of the way of the
          results but always reachable. Labelled on hover rather than
          permanently, so it stays a mark rather than a banner. */}
      <button
        onClick={() => setShowFullMap((v) => !v)}
        aria-label={showFullMap ? 'Close map' : 'View properties on map'}
        aria-expanded={showFullMap}
        className={cn(
          'group fixed bottom-6 right-6 z-[61] flex cursor-pointer items-center gap-0 rounded-full p-4 text-white shadow-xl transition-all duration-300 hover:gap-2 hover:pr-5',
          // Stays put and toggles rather than hiding: the panel grows out of
          // this button, so it is also the natural thing to press to fold it
          // back away.
          showFullMap
            ? 'bg-gray-900 shadow-gray-900/30 hover:bg-gray-700'
            : 'bg-brand-600 shadow-brand-600/30 hover:bg-brand-700',
        )}
      >
        <MapPinned size={20} className="shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[140px]">
          {showFullMap ? 'Hide map' : 'View on map'}
        </span>
      </button>

      {/* ── Map popup ──
          A panel that unfolds over the page rather than a separate fullscreen
          view. Taking over the whole screen made looking at one pin feel like
          leaving the results behind and coming back; here the listings stay
          visible around it, so the map reads as a lens on the page rather
          than a destination.

          Anchored to the button that opens it, growing up and to the left,
          which is why the transform origin is the bottom right. */}
      <AnimatePresence>
        {showFullMap && (
          <>
            {/* A faint scrim: enough to lift the panel off the page and to
                give the whole backdrop a click target for dismissing it,
                without hiding the results underneath. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowFullMap(false)}
              className="fixed inset-0 z-[55] bg-gray-900/20"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'bottom right' }}
              role="dialog"
              aria-label="Properties map"
              className="fixed bottom-24 right-6 z-[60] flex h-[min(560px,calc(100vh-11rem))] w-[min(680px,calc(100vw-3rem))] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/20"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-[14px] font-semibold text-gray-900">
                  {results.length} {results.length === 1 ? 'property' : 'properties'} on the map
                </p>
                <button
                  onClick={() => setShowFullMap(false)}
                  aria-label="Close map"
                  className="flex cursor-pointer items-center justify-center rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative min-h-0 flex-1">
                <PropertiesMapView properties={mapResults} focusPropertyId={focusPropertyId} />
              </div>
            </motion.div>
          </>
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
