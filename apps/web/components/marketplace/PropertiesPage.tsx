'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, List, ChevronDown, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFiltersStore } from '../../lib/stores/filters.store';
import { useProperties } from '../../lib/api/queries';
import { PropertyCard } from './PropertyCard';
import { PropertyFiltersPanel } from './PropertyFiltersPanel';
import { PropertySearchBar } from './PropertySearchBar';
import { PropertiesMapView } from './PropertiesMapView';
import { cn } from '../../lib/utils';
import type { Property } from '../../lib/types';

type ViewMode = 'grid' | 'list';

export function PropertiesPage() {
  const { filters, resetFilters } = useFiltersStore();
  const [view, setView] = useState<ViewMode>('grid');
  const [showMap, setShowMap] = useState(false);

  // Build API query from filter store state
  const query = {
    search: filters.query,
    category: filters.category,
    status: filters.status,
    city: filters.city,
    neighborhood: filters.neighborhood,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    bedrooms: filters.bedrooms,
    has3DTour: filters.has3DTour,
    hasVRTour: filters.hasVRTour,
    sortBy: filters.sortBy,
    limit: 100,
  };

  const { data, isLoading, isError } = useProperties(query);
  const results: Property[] = (data?.items as unknown as Property[]) ?? [];

  // Lock document scroll so Lenis/body don't interfere — columns scroll independently
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = prev; };
  }, []);

  return (
    <div
      className="flex"
      style={{
        position: 'fixed',
        top: '64px',
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #e8e6f0 0%, #f5f3ee 40%, #f0ece4 70%, #f5e8d8 100%)',
      }}
    >
      {/* ── Filters ── */}
      <div className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-black/[0.07] h-full">
        <PropertyFiltersPanel resultCount={results.length} />
      </div>

      {/* ── Listings ── */}
      <div className={cn('flex flex-col border-r border-black/[0.07] shrink-0 h-full', showMap ? 'w-[400px] xl:w-[460px]' : 'flex-1')}>
        {/* Top bar */}
        <div className="shrink-0 px-5 py-3 border-b border-black/[0.07] bg-white/60 backdrop-blur-sm">
          <PropertySearchBar />
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm font-semibold text-gray-800">
              {isLoading ? '…' : `${data?.total ?? results.length}+ results`}
            </p>
            <div className="flex items-center gap-2">
              <SortSelect />
              <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button onClick={() => setView('grid')} className={cn('flex items-center justify-center w-7 h-7 cursor-pointer transition-colors', view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700')}>
                  <LayoutGrid size={12} />
                </button>
                <button onClick={() => setView('list')} className={cn('flex items-center justify-center w-7 h-7 cursor-pointer transition-colors', view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700')}>
                  <List size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable cards */}
        <div data-lenis-prevent style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="text-gray-400 animate-spin" />
            </div>
          ) : isError ? (
            <ErrorState onRetry={resetFilters} />
          ) : results.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : view === 'grid' ? (
            <div className={cn('grid gap-4', showMap ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3')}>
              {results.map((p, i) => <PropertyCard key={p.id} property={p} index={i} view="grid" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {results.map((p, i) => <PropertyCard key={p.id} property={p} index={i} view="list" />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Map ── */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block flex-1 relative"
          >
            <div className="absolute inset-0">
              <PropertiesMapView properties={results} />
            </div>
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md">
              <span className="text-xs text-gray-600 font-medium">Show map</span>
              <MapToggle checked={showMap} onChange={setShowMap} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show map button when hidden */}
      {!showMap && (
        <button
          onClick={() => setShowMap(true)}
          className="hidden lg:flex fixed bottom-6 right-6 items-center gap-2 bg-gray-900 text-white rounded-full px-5 py-3 text-sm shadow-xl hover:bg-gray-700 transition-colors cursor-pointer z-40"
        >
          <MapPin size={14} /> Show map
        </button>
      )}
    </div>
  );
}

function MapToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 rounded-full transition-colors duration-300 cursor-pointer', checked ? 'bg-green-500' : 'bg-gray-200')}
    >
      <span className={cn('absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300', checked ? 'left-6' : 'left-1')} />
    </button>
  );
}

function SortSelect() {
  const { filters, setFilter } = useFiltersStore();
  return (
    <div className="relative">
      <select
        value={filters.sortBy ?? 'featured'}
        onChange={(e) => setFilter('sortBy', e.target.value as never)}
        className="appearance-none rounded-full border border-gray-200 bg-white pl-3 pr-7 py-1.5 text-xs text-gray-500 focus:outline-none focus:border-gray-300 cursor-pointer"
      >
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="price_asc">Price ↑</option>
        <option value="price_desc">Price ↓</option>
      </select>
      <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-4xl mb-4">🏠</p>
      <p className="font-semibold text-gray-700 mb-1">No properties found</p>
      <p className="text-sm text-gray-400 mb-5">Try adjusting your filters.</p>
      <button onClick={onReset} className="rounded-full bg-gray-900 text-white px-5 py-2.5 text-sm hover:bg-gray-700 transition-colors cursor-pointer">
        Reset filters
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <p className="font-semibold text-gray-700 mb-1">Failed to load properties</p>
      <p className="text-sm text-gray-400 mb-5">Check your connection and try again.</p>
      <button onClick={onRetry} className="rounded-full bg-gray-900 text-white px-5 py-2.5 text-sm hover:bg-gray-700 transition-colors cursor-pointer">
        Retry
      </button>
    </div>
  );
}
