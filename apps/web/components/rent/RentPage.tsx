'use client';

import { useMemo, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useRentFiltersStore } from '../../lib/stores/rent-filters.store';
import { useRentListings } from '../../lib/api/queries';
import { RentCard } from './RentCard';
import { RentFiltersPanel } from './RentFiltersPanel';
import type { RentListing, RentFilters } from '../../lib/types';

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
  const { filters, resetFilters } = useRentFiltersStore();

  // Pass search query and city to the server; filter everything else client-side
  const { data, isLoading } = useRentListings({
    limit: 100,
    city: filters.city,
    q: filters.query,
  });

  const results = useMemo(
    () => applyClientFilters(data?.items ?? [], filters),
    [data, filters],
  );

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
        position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #e8e6f0 0%, #f5f3ee 40%, #f0ece4 70%, #f5e8d8 100%)',
      }}
    >
      {/* Filters sidebar */}
      <div className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-black/[0.07] h-full">
        <RentFiltersPanel resultCount={results.length} />
      </div>

      {/* Listings */}
      <div className="flex flex-col flex-1 h-full">
        {/* Top bar */}
        <div className="shrink-0 px-5 py-3 border-b border-black/[0.07] bg-white/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-gray-800">Rent in Nairobi</h1>
              <p className="text-xs text-gray-400">{isLoading ? 'Loading…' : `${results.length} listings available`}</p>
            </div>
            <SortSelect />
          </div>
        </div>

        {/* Cards */}
        <div data-lenis-prevent style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-4xl mb-4">🏠</p>
              <p className="font-semibold text-gray-700 mb-1">No listings found</p>
              <p className="text-sm text-gray-400 mb-5">Try adjusting your filters.</p>
              <button onClick={resetFilters} className="rounded-full bg-gray-900 text-white px-5 py-2.5 text-sm hover:bg-gray-700 transition-colors cursor-pointer">
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((l, i) => <RentCard key={l.id} listing={l} index={i} />)}
            </div>
          )}
        </div>
      </div>
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
        className="appearance-none rounded-full border border-gray-200 bg-white pl-3 pr-7 py-1.5 text-xs text-gray-500 focus:outline-none focus:border-gray-300 cursor-pointer"
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price ↑</option>
        <option value="price_desc">Price ↓</option>
      </select>
      <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}
