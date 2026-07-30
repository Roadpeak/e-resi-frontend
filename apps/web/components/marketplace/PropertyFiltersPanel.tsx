'use client';

import { Box, Headset, Minus, Plus, MapPin } from 'lucide-react';
import { useFiltersStore } from '../../lib/stores/filters.store';
import { useProperties } from '../../lib/api/queries';
import { cn } from '../../lib/utils';
import type { PropertyCategory, PropertyStatus } from '../../lib/types';

interface Props {
  resultCount: number;
}

const categories: { value: PropertyCategory; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'land', label: 'Land' },
];

const statuses: { value: PropertyStatus; label: string }[] = [
  { value: 'off_plan', label: 'Off Plan' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'ready', label: 'Ready to Move' },
];

const priceRanges = [
  { label: 'Under 10M', min: 0, max: 10_000_000 },
  { label: '10M – 30M', min: 10_000_000, max: 30_000_000 },
  { label: '30M – 80M', min: 30_000_000, max: 80_000_000 },
  { label: '80M+', min: 80_000_000, max: undefined },
];

export function PropertyFiltersPanel({ resultCount }: Props) {
  const { filters, setFilter, resetFilters } = useFiltersStore();
  const { data: allData } = useProperties({ limit: 100 });
  const locations = Array.from(
    (allData?.items ?? []).reduce((map, p) => {
      const key = p.address.city;
      if (!map.has(key)) map.set(key, { city: key, neighborhoods: [] as string[] });
      const entry = map.get(key)!;
      if (!entry.neighborhoods.includes(p.address.neighborhood)) {
        entry.neighborhoods.push(p.address.neighborhood);
      }
      return map;
    }, new Map<string, { city: string; neighborhoods: string[] }>()),
  ).map(([, v]) => v);
  const bedrooms = filters.bedrooms ?? 0;
  const hasFilters = Object.entries(filters).some(([k, v]) => k !== 'sortBy' && v !== undefined && v !== '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header — pinned ── */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-800">Filters</p>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-orange-500 hover:text-orange-700 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
        data-lenis-prevent
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
      >

        {/* Location */}
        <FilterBlock title="Location" borderTop={false}>
          {locations.map(({ city, neighborhoods }) => (
            <div key={city} className="mb-2">
              <button
                onClick={() => setFilter('city', filters.city === city ? undefined : city)}
                className="flex items-center gap-2 w-full group cursor-pointer py-1"
              >
                <Checkbox checked={filters.city === city} />
                <span className={cn('flex items-center gap-1.5 text-sm font-medium transition-colors', filters.city === city ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900')}>
                  <MapPin size={11} className={filters.city === city ? 'text-orange-500' : 'text-gray-300'} />
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
                    <span className={cn('text-xs transition-colors', filters.neighborhood === n ? 'text-gray-800 font-medium' : 'text-gray-400 group-hover:text-gray-700')}>
                      {n}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </FilterBlock>

        {/* Type */}
        <FilterBlock title="Type">
          {categories.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter('category', filters.category === value ? undefined : value)}
              className="flex items-center gap-2.5 w-full group cursor-pointer py-1"
            >
              <Checkbox checked={filters.category === value} />
              <span className={cn('text-sm transition-colors', filters.category === value ? 'text-gray-900 font-medium' : 'text-gray-500 group-hover:text-gray-800')}>
                {label}
              </span>
            </button>
          ))}
        </FilterBlock>

        {/* Status */}
        <FilterBlock title="Status">
          {statuses.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter('status', filters.status === value ? undefined : value)}
              className="flex items-center gap-2.5 w-full group cursor-pointer py-1"
            >
              <Checkbox checked={filters.status === value} />
              <span className={cn('text-sm transition-colors', filters.status === value ? 'text-gray-900 font-medium' : 'text-gray-500 group-hover:text-gray-800')}>
                {label}
              </span>
            </button>
          ))}
        </FilterBlock>

        {/* Bedrooms */}
        <FilterBlock title="Bedrooms">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-500">Min bedrooms</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilter('bedrooms', bedrooms > 0 ? bedrooms - 1 : undefined)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-all cursor-pointer"
              >
                <Minus size={11} />
              </button>
              <span className="text-sm font-bold text-gray-800 w-5 text-center">
                {filters.bedrooms === undefined ? '0' : filters.bedrooms === 0 ? 'S' : filters.bedrooms}
              </span>
              <button
                onClick={() => setFilter('bedrooms', (filters.bedrooms ?? 0) + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-all cursor-pointer"
              >
                <Plus size={11} />
              </button>
            </div>
          </div>
        </FilterBlock>

        {/* Price Range */}
        <FilterBlock title="Price Range">
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
                  'w-full text-left rounded-xl border px-3 py-2.5 text-sm transition-all cursor-pointer mb-1.5',
                  active
                    ? 'border-orange-300 bg-orange-50 text-orange-600 font-medium'
                    : 'border-gray-100 bg-white/60 text-gray-500 hover:border-gray-200 hover:text-gray-700',
                )}
              >
                {label}
              </button>
            );
          })}
        </FilterBlock>

        {/* Tour Type */}
        <FilterBlock title="Tour Type">
          <button
            onClick={() => setFilter('has3DTour', filters.has3DTour ? undefined : true)}
            className="flex items-center gap-2.5 w-full group cursor-pointer py-1"
          >
            <Checkbox checked={!!filters.has3DTour} />
            <span className={cn('flex items-center gap-1.5 text-sm transition-colors', filters.has3DTour ? 'text-gray-900 font-medium' : 'text-gray-500 group-hover:text-gray-800')}>
              <Box size={12} className={filters.has3DTour ? 'text-orange-500' : 'text-gray-300'} /> 3D Tour
            </span>
          </button>
          <button
            onClick={() => setFilter('hasVRTour', filters.hasVRTour ? undefined : true)}
            className="flex items-center gap-2.5 w-full group cursor-pointer py-1"
          >
            <Checkbox checked={!!filters.hasVRTour} />
            <span className={cn('flex items-center gap-1.5 text-sm transition-colors', filters.hasVRTour ? 'text-gray-900 font-medium' : 'text-gray-500 group-hover:text-gray-800')}>
              <Headset size={12} className={filters.hasVRTour ? 'text-orange-500' : 'text-gray-300'} /> VR Experience
            </span>
          </button>
        </FilterBlock>

        {/* Bottom padding */}
        <div style={{ height: 16 }} />
      </div>

      {/* ── Footer CTA — pinned ── */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
        <button className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-3 transition-colors cursor-pointer shadow-md shadow-orange-100">
          Show {resultCount}+ listings
        </button>
      </div>

    </div>
  );
}

function FilterBlock({ title, children, borderTop = true }: { title: string; children: React.ReactNode; borderTop?: boolean }) {
  return (
    <div style={{
      padding: '16px 20px',
      borderTop: borderTop ? '1px solid rgba(0,0,0,0.06)' : 'none',
    }}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  );
}

function Checkbox({ checked, small = false }: { checked: boolean; small?: boolean }) {
  const size = small ? 14 : 16;
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: 4,
        border: checked ? 'none' : '1.5px solid #d1d5db',
        background: checked ? '#f97316' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {checked && (
        <svg width={small ? 8 : 10} height={small ? 8 : 10} viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
