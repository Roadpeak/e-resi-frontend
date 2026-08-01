'use client';

import { Minus, Plus, MapPin, Film, Box } from 'lucide-react';
import { useRentFiltersStore } from '../../lib/stores/rent-filters.store';
import { useRentListings } from '../../lib/api/queries';
import { cn } from '../../lib/utils';
import type { FurnishingType } from '../../lib/types';

interface Props { resultCount: number; }

const furnishingOptions: { value: FurnishingType; label: string }[] = [
  { value: 'furnished', label: 'Furnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
];

const priceRanges = [
  { label: 'Under 80K', min: 0, max: 80_000 },
  { label: '80K – 200K', min: 80_000, max: 200_000 },
  { label: '200K – 500K', min: 200_000, max: 500_000 },
  { label: '500K+', min: 500_000, max: undefined },
];

export function RentFiltersPanel({ resultCount }: Props) {
  const { filters, setFilter, resetFilters } = useRentFiltersStore();
  const { data: allData } = useRentListings({ limit: 100 });
  const locations = Array.from(
    (allData?.items ?? []).reduce((map, l) => {
      const key = l.address.city;
      if (!map.has(key)) map.set(key, { city: key, neighborhoods: [] as string[] });
      const entry = map.get(key)!;
      if (!entry.neighborhoods.includes(l.address.neighborhood)) {
        entry.neighborhoods.push(l.address.neighborhood);
      }
      return map;
    }, new Map<string, { city: string; neighborhoods: string[] }>()),
  ).map(([, v]) => v);
  const bedrooms = filters.bedrooms ?? 0;
  const hasFilters = Object.entries(filters).some(([k, v]) => k !== 'sortBy' && v !== undefined && v !== '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-gray-900">Filters</p>
          {hasFilters && (
            <button onClick={resetFilters} className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div data-lenis-prevent style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {/* Location */}
        <FilterBlock title="Location" borderTop={false}>
          {locations.map(({ city, neighborhoods }) => (
            <div key={city} className="mb-2">
              <button
                onClick={() => setFilter('city', filters.city === city ? undefined : city)}
                className="flex items-center gap-2 w-full group cursor-pointer py-1"
              >
                <Checkbox checked={filters.city === city} />
                <span className={cn('flex items-center gap-1.5 text-base font-bold transition-colors', filters.city === city ? 'text-gray-900' : 'text-gray-800 group-hover:text-gray-900')}>
                  <MapPin size={14} className={filters.city === city ? 'text-orange-500' : 'text-gray-400'} />
                  {city}
                </span>
              </button>
              <div className="ml-6 mt-0.5 flex flex-col">
                {neighborhoods.map((n) => (
                  <button
                    key={n}
                    onClick={() => setFilter('neighborhood', filters.neighborhood === n ? undefined : n)}
                    className="flex items-center gap-2 w-full group cursor-pointer py-1"
                  >
                    <Checkbox checked={filters.neighborhood === n} small />
                    <span className={cn('text-sm font-medium transition-colors', filters.neighborhood === n ? 'text-gray-900 font-semibold' : 'text-gray-600 group-hover:text-gray-900')}>
                      {n}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </FilterBlock>

        {/* Bedrooms */}
        <FilterBlock title="Bedrooms">
          <div className="flex items-center justify-between py-1">
            <span className="text-base font-semibold text-gray-800">Min bedrooms</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilter('bedrooms', bedrooms > 0 ? bedrooms - 1 : undefined)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all cursor-pointer"
              >
                <Minus size={14} />
              </button>
              <span className="text-base font-bold text-gray-900 w-6 text-center">
                {filters.bedrooms === undefined ? '0' : filters.bedrooms === 0 ? 'S' : filters.bedrooms}
              </span>
              <button
                onClick={() => setFilter('bedrooms', (filters.bedrooms ?? 0) + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </FilterBlock>

        {/* Furnishing */}
        <FilterBlock title="Furnishing">
          {furnishingOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter('furnishing', filters.furnishing === value ? undefined : value)}
              className="flex items-center gap-2.5 w-full group cursor-pointer py-1"
            >
              <Checkbox checked={filters.furnishing === value} />
              <span className={cn('text-base font-semibold transition-colors', filters.furnishing === value ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900')}>
                {label}
              </span>
            </button>
          ))}
        </FilterBlock>

        {/* Price Range */}
        <FilterBlock title="Rent Per Month">
          {priceRanges.map(({ label, min, max }) => {
            const active = filters.priceMin === min && filters.priceMax === max;
            return (
              <button
                key={label}
                onClick={() => {
                  if (active) { setFilter('priceMin', undefined); setFilter('priceMax', undefined); }
                  else { setFilter('priceMin', min); setFilter('priceMax', max); }
                }}
                className={cn(
                  'w-full text-left rounded-xl border px-3.5 py-3 text-base font-semibold transition-all cursor-pointer mb-2',
                  active
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white/70 text-gray-700 hover:border-gray-400 hover:text-gray-900',
                )}
              >
                {label}
              </button>
            );
          })}
        </FilterBlock>

        {/* Tour Type */}
        <FilterBlock title="Tour Options">
          <button
            onClick={() => setFilter('showCinematicTour', filters.showCinematicTour ? undefined : true)}
            className="flex items-center gap-2.5 w-full group cursor-pointer py-1"
          >
            <Checkbox checked={!!filters.showCinematicTour} />
            <span className={cn('flex items-center gap-2 text-base font-semibold transition-colors', filters.showCinematicTour ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900')}>
              <Film size={15} className={filters.showCinematicTour ? 'text-orange-500' : 'text-gray-400'} /> Cinematic Tour
            </span>
          </button>
          <button
            onClick={() => setFilter('show3DTour', filters.show3DTour ? undefined : true)}
            className="flex items-center gap-2.5 w-full group cursor-pointer py-1"
          >
            <Checkbox checked={!!filters.show3DTour} />
            <span className={cn('flex items-center gap-2 text-base font-semibold transition-colors', filters.show3DTour ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900')}>
              <Box size={15} className={filters.show3DTour ? 'text-orange-500' : 'text-gray-400'} /> 3D Tour
            </span>
          </button>
        </FilterBlock>

        <div style={{ height: 16 }} />
      </div>

      {/* Footer CTA */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
        <button className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-bold py-3.5 transition-colors cursor-pointer shadow-md shadow-orange-100">
          Show {resultCount} listings
        </button>
      </div>
    </div>
  );
}

function FilterBlock({ title, children, borderTop = true }: { title: string; children: React.ReactNode; borderTop?: boolean }) {
  return (
    <div style={{ padding: '16px 20px', borderTop: borderTop ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  );
}

function Checkbox({ checked, small = false }: { checked: boolean; small?: boolean }) {
  const size = small ? 16 : 18;
  return (
    <div style={{
      width: size, height: size, minWidth: size, borderRadius: 4,
      border: checked ? 'none' : '1.5px solid #d1d5db',
      background: checked ? '#f97316' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
    }}>
      {checked && (
        <svg width={small ? 9 : 11} height={small ? 9 : 11} viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
