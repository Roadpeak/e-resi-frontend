'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, DoorOpen, Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn, formatPrice } from '../../../../../lib/utils';
import { apiClient, ApiError } from '../../../../../lib/api/client';
import { useMyProperties } from '../../../../../lib/api/queries';

interface PropertyUnit {
  id: string;
  name: string;
  floor?: number | null;
  bedrooms: number;
  bathrooms?: number | null;
  sqm?: number | null;
  price: number;
  status: string;
}

interface UnitSelection {
  rent: string;
  furnishing: 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';
  total: string;
}

const FURNISHING = [
  { value: 'UNFURNISHED', label: 'Unfurnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-furnished' },
  { value: 'FURNISHED', label: 'Furnished' },
] as const;

const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';

export default function NewRentListingPage() {
  const { data: propertiesData, isLoading } = useMyProperties({ limit: 50 });
  const properties = propertiesData?.items ?? [];

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, UnitSelection>>({});
  const [listingName, setListingName] = useState('');
  const [minLease, setMinLease] = useState('12');
  const [availableFrom, setAvailableFrom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  const selectedProperty = properties.find((p) => p.slug === selectedSlug);

  // full unit inventory for the chosen property
  const { data: detail, isLoading: unitsLoading } = useQuery({
    queryKey: ['dash-property', selectedSlug],
    queryFn: () => apiClient.get<{
      units: PropertyUnit[];
      heroImageUrl?: string | null;
      neighborhood?: string | null;
      city?: string | null;
      currency: string;
    }>(`/properties/${selectedSlug}`),
    enabled: !!selectedSlug,
  });
  const units = detail?.units ?? [];

  function pickProperty(slug: string, name: string) {
    setSelectedSlug(slug);
    setSelections({});
    setListingName(`${name} Rentals`);
    setError('');
  }

  function toggleUnit(unit: PropertyUnit) {
    setSelections((prev) => {
      const next = { ...prev };
      if (next[unit.id]) delete next[unit.id];
      else next[unit.id] = { rent: '', furnishing: 'UNFURNISHED', total: '1' };
      return next;
    });
  }

  const chosen = units.filter((u) => selections[u.id]);

  async function handleSubmit() {
    setError('');
    if (!selectedProperty || !detail) return;
    if (chosen.length === 0) return setError('Select at least one unit to list for rent.');
    for (const u of chosen) {
      const rent = Number.parseFloat(selections[u.id].rent);
      if (!Number.isFinite(rent) || rent <= 0) {
        return setError(`Set a monthly rent for ${u.name}.`);
      }
    }

    setSubmitting(true);
    try {
      const rents = chosen.map((u) => Number.parseFloat(selections[u.id].rent));
      const listing = await apiClient.post<{ id: string; slug: string }>('/rent-listings', {
        propertySlug: selectedProperty.slug,
        name: listingName.trim() || `${selectedProperty.name} Rentals`,
        tagline: `Rental units at ${selectedProperty.name}`,
        neighborhood: detail.neighborhood ?? undefined,
        city: detail.city ?? undefined,
        heroImageUrl: detail.heroImageUrl ?? undefined,
        priceFrom: Math.min(...rents),
        priceTo: Math.max(...rents),
        minLeaseTerm: Number.parseInt(minLease, 10),
        availableFrom: availableFrom ? new Date(availableFrom).toISOString() : undefined,
      });

      for (const u of chosen) {
        const sel = selections[u.id];
        await apiClient.post(`/rent-listings/${listing.id}/units`, {
          label: u.name,
          // carried from the property unit so tenants see "A12, 10th floor"
          floor: u.floor ?? undefined,
          bedrooms: u.bedrooms ?? 1,
          bathrooms: u.bathrooms ?? 1,
          sqm: u.sqm ?? undefined,
          pricePerMonth: Number.parseFloat(sel.rent),
          available: Number.parseInt(sel.total, 10) || 1,
          total: Number.parseInt(sel.total, 10) || 1,
          furnishing: sel.furnishing,
        });
      }
      setCreatedCount(chosen.length);
      setCreatedSlug(listing.slug);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the rent listing.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success ──
  if (createdSlug) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f4ea]">
          <CheckCircle2 size={32} className="text-[#188038]" />
        </div>
        <h1 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Rent listing published</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-[#5f6368]">
          {createdCount} unit type{createdCount === 1 ? '' : 's'} listed — tenants can now inquire and book viewings.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={`/rent/${createdSlug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors"
          >
            View live listing <ArrowRight size={15} />
          </Link>
          <Link
            href="/dashboard/rentals"
            className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors"
          >
            Back to rentals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard/rentals" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1a73e8] hover:text-[#1765cc]">
        <ArrowLeft size={14} /> Rentals
      </Link>
      <h1 className="mt-3 text-[26px] sm:text-[28px] font-normal text-[#202124]">List units for rent</h1>
      <p className="mt-1 text-base text-[#5f6368]">
        Pick one of your developments, choose which units to offer, set the monthly rent — done.
      </p>

      {/* ── Step 1: property ── */}
      <div className="mt-8">
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#5f6368]">1 · Select property</p>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 size={22} className="animate-spin text-[#80868b]" />
          </div>
        ) : properties.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed border-[#dadce0] p-8 text-center">
            <p className="text-base text-[#5f6368]">You have no developments yet.</p>
            <Link href="/dashboard/developments/new" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors">
              Add a development <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => {
              const active = selectedSlug === p.slug;
              return (
                <button
                  key={p.id}
                  onClick={() => pickProperty(p.slug, p.name)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-3xl border p-4 text-left transition-all cursor-pointer',
                    active
                      ? 'border-[#1a73e8] ring-1 ring-[#1a73e8] bg-[#e8f0fe]/40'
                      : 'border-[#dadce0] bg-white hover:bg-[#f8f9fa]',
                  )}
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f1f3f4]">
                    {p.heroImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.heroImageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#80868b]">
                        <Building2 size={18} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-[#202124]">{p.name}</p>
                    <p className="truncate text-[13px] text-[#5f6368]">{p.address?.city || '—'}</p>
                  </div>
                  {active && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#1a73e8] text-white">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Step 2: units ── */}
      <AnimatePresence>
        {selectedSlug && (
          <motion.div
            key={selectedSlug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8"
          >
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#5f6368]">2 · Choose units & set rent</p>

            {unitsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 size={22} className="animate-spin text-[#80868b]" />
              </div>
            ) : units.length === 0 ? (
              <div className="mt-3 rounded-3xl border border-dashed border-[#dadce0] p-8 text-center">
                <DoorOpen size={20} className="mx-auto text-[#80868b]" />
                <p className="mt-2 text-base text-[#5f6368]">
                  {selectedProperty?.name} has no units yet — add them first, then list them for rent.
                </p>
                <Link
                  href={`/dashboard/properties/${selectedSlug}`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors"
                >
                  Add units <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-3 overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
                  <ul className="divide-y divide-[#f1f3f4]">
                    {units.map((u) => {
                      const sel = selections[u.id];
                      return (
                        <li key={u.id} className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => toggleUnit(u)}
                              aria-label={`Select ${u.name}`}
                              className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer',
                                sel ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[#dadce0] bg-white hover:border-[#80868b]',
                              )}
                            >
                              {sel && <Check size={12} strokeWidth={3} />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-medium text-[#202124]">{u.name}</p>
                              <p className="text-[13px] text-[#5f6368]">
                                {[
                                  u.bedrooms ? `${u.bedrooms} bed` : null,
                                  u.bathrooms ? `${u.bathrooms} bath` : null,
                                  u.sqm ? `${u.sqm} m²` : null,
                                  `sale price ${formatPrice(u.price, detail?.currency ?? 'KES')}`,
                                ].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </div>
                          <AnimatePresence>
                            {sel && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 grid gap-3 pl-8 sm:grid-cols-3">
                                  <div>
                                    <label className={labelCls}>Monthly rent ({detail?.currency ?? 'KES'})</label>
                                    <input
                                      value={sel.rent}
                                      onChange={(e) => setSelections((prev) => ({ ...prev, [u.id]: { ...prev[u.id], rent: e.target.value.replace(/[^\d.]/g, '') } }))}
                                      inputMode="numeric"
                                      placeholder="85000"
                                      className={inputCls}
                                    />
                                  </div>
                                  <div>
                                    <label className={labelCls}>Furnishing</label>
                                    <select
                                      value={sel.furnishing}
                                      onChange={(e) => setSelections((prev) => ({ ...prev, [u.id]: { ...prev[u.id], furnishing: e.target.value as UnitSelection['furnishing'] } }))}
                                      className={inputCls}
                                    >
                                      {FURNISHING.map((f) => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className={labelCls}>Units available</label>
                                    <input
                                      value={sel.total}
                                      onChange={(e) => setSelections((prev) => ({ ...prev, [u.id]: { ...prev[u.id], total: e.target.value.replace(/\D/g, '') } }))}
                                      inputMode="numeric"
                                      placeholder="1"
                                      className={inputCls}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* listing settings */}
                <div className="mt-4 rounded-3xl border border-[#dadce0] bg-white p-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className={labelCls}>Listing name</label>
                      <input value={listingName} onChange={(e) => setListingName(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Minimum lease</label>
                      <select value={minLease} onChange={(e) => setMinLease(e.target.value)} className={inputCls}>
                        {['1', '3', '6', '12', '24'].map((m) => (
                          <option key={m} value={m}>{m} month{m === '1' ? '' : 's'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Available from</label>
                      <input type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </div>

                {error && <p className="mt-4 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-[#5f6368]">
                    {chosen.length} unit type{chosen.length === 1 ? '' : 's'} selected
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || chosen.length === 0}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {submitting ? (
                      <>Publishing <Loader2 size={15} className="animate-spin" /></>
                    ) : (
                      <>Publish rent listing <ArrowRight size={15} /></>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
