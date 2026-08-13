'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, BedDouble, Eye, Loader2, Trash2, Check,
} from 'lucide-react';
import { rentListingsApi } from '../../../../../lib/api/rent-listings';
import { ApiError } from '../../../../../lib/api/client';
import { formatPrice, cn } from '../../../../../lib/utils';

const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';
const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const STATUSES = [
  { key: 'AVAILABLE', label: 'Available', cls: 'bg-[#e6f4ea] text-[#188038]' },
  { key: 'PARTIALLY_AVAILABLE', label: 'Partially available', cls: 'bg-[#fef7e0] text-[#b06000]' },
  { key: 'FULLY_LET', label: 'Fully let', cls: 'bg-[#f1f3f4] text-[#5f6368]' },
  { key: 'ARCHIVED', label: 'Archived', cls: 'bg-[#f1f3f4] text-[#5f6368]' },
];

const FURNISHINGS = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'];

/** ISO timestamp → yyyy-mm-dd for a date input, which rejects the full form. */
const toDateInput = (v?: string | null) => (v ? v.slice(0, 10) : '');

export default function EditRentalPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['rent-listing', slug],
    queryFn: () => rentListingsApi.get(slug),
    retry: false,
  });

  const [form, setForm] = useState({
    name: '', tagline: '', neighborhood: '', city: '',
    priceFrom: '', priceTo: '', minLeaseTerm: '', availableFrom: '',
    furnishing: 'UNFURNISHED',
  });
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!listing) return;
    setForm({
      name: listing.name ?? '',
      tagline: listing.tagline ?? '',
      neighborhood: listing.neighborhood ?? '',
      city: listing.city ?? '',
      priceFrom: listing.priceFrom != null ? String(listing.priceFrom) : '',
      priceTo: listing.priceTo != null ? String(listing.priceTo) : '',
      minLeaseTerm: listing.minLeaseTerm != null ? String(listing.minLeaseTerm) : '',
      availableFrom: toDateInput(listing.availableFrom),
      furnishing: listing.furnishing ?? 'UNFURNISHED',
    });
  }, [listing]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['rent-listing', slug] });
    queryClient.invalidateQueries({ queryKey: ['rent-listings', 'mine'] });
  }

  const save = useMutation({
    mutationFn: () =>
      rentListingsApi.update(listing!.id, {
        name: form.name.trim() || undefined,
        tagline: form.tagline.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        city: form.city.trim() || undefined,
        furnishing: form.furnishing,
        // Empty means "leave it alone", not "set to zero" — sending 0 would
        // advertise a free rental.
        priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
        priceTo: form.priceTo ? Number(form.priceTo) : undefined,
        minLeaseTerm: form.minLeaseTerm ? Number(form.minLeaseTerm) : undefined,
        // The API expects a full ISO datetime; a date input gives yyyy-mm-dd.
        availableFrom: form.availableFrom
          ? new Date(form.availableFrom).toISOString()
          : undefined,
      }),
    onSuccess: () => {
      invalidate();
      setError('');
      setToast('Changes saved');
      setTimeout(() => setToast(''), 4000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not save'),
  });

  const changeStatus = useMutation({
    mutationFn: (status: string) => rentListingsApi.setStatus(listing!.id, status),
    onSuccess: (l) => {
      invalidate();
      setError('');
      setToast(`Status set to ${(l.status ?? '').replace(/_/g, ' ').toLowerCase()}`);
      setTimeout(() => setToast(''), 4000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not change status'),
  });

  const removeUnit = useMutation({
    mutationFn: (unitId: string) => rentListingsApi.removeUnit(listing!.id, unitId),
    onSuccess: () => {
      invalidate();
      setError('');
      setToast('Unit type removed');
      setTimeout(() => setToast(''), 4000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not remove unit'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#80868b]" />
      </div>
    );
  }
  if (isError || !listing) {
    return (
      <div className="py-16 text-center">
        <p className="text-[15px] text-[#5f6368]">This rental listing could not be found.</p>
        <Link
          href="/dashboard/rentals"
          className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc]"
        >
          <ArrowLeft size={15} /> All rentals
        </Link>
      </div>
    );
  }

  const units = listing.rentUnits ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/rentals"
            className="inline-flex items-center gap-1 text-[13px] text-[#5f6368] transition-colors hover:text-[#202124]"
          >
            <ArrowLeft size={16} /> All rentals
          </Link>
          <h1 className="mt-2 text-[26px] font-normal text-[#202124]">{listing.name}</h1>
          <p className="text-[14px] text-[#5f6368]">
            {[listing.neighborhood, listing.city].filter(Boolean).join(', ') || 'Location not set'}
            {listing.property?.name && <> · part of {listing.property.name}</>}
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href={`/rent/${listing.slug}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
          >
            <Eye size={15} /> View live
          </a>
          <button
            type="button"
            onClick={() => { setError(''); save.mutate(); }}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40"
          >
            {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Save changes
          </button>
        </div>
      </div>

      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}
      {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Details */}
          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Listing details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls}>Listing name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Tagline</label>
                <input
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="One line describing these rentals"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Neighbourhood</label>
                <input
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Rent from ({listing.currency})</label>
                <input
                  type="number"
                  value={form.priceFrom}
                  onChange={(e) => setForm({ ...form, priceFrom: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Rent to ({listing.currency})</label>
                <input
                  type="number"
                  value={form.priceTo}
                  onChange={(e) => setForm({ ...form, priceTo: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Minimum lease (months)</label>
                <input
                  type="number"
                  value={form.minLeaseTerm}
                  onChange={(e) => setForm({ ...form, minLeaseTerm: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Available from</label>
                <input
                  type="date"
                  value={form.availableFrom}
                  onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Furnishing</label>
                <select
                  value={form.furnishing}
                  onChange={(e) => setForm({ ...form, furnishing: e.target.value })}
                  className={inputCls}
                >
                  {FURNISHINGS.map((f) => (
                    <option key={f} value={f}>
                      {f.replace(/_/g, ' ').toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Unit types */}
          <section className={cardCls}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-[16px] font-medium text-[#202124]">Unit types</h2>
              <span className="text-[13px] text-[#5f6368]">
                {units.length} type{units.length === 1 ? '' : 's'}
              </span>
            </div>

            {units.length === 0 ? (
              <p className="text-[14px] text-[#5f6368]">
                No unit types on this listing yet — tenants have nothing to enquire about
                until you add one.
              </p>
            ) : (
              <ul className="divide-y divide-[#f1f3f4]">
                {units.map((u, i) => (
                  <li key={u.id ?? i} className="flex flex-wrap items-center gap-3 py-3">
                    <BedDouble size={16} className="shrink-0 text-[#5f6368]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-[#202124]">{u.label}</p>
                      <p className="text-[12px] text-[#5f6368]">
                        {u.bedrooms === 0 ? 'Studio' : `${u.bedrooms} bed`}
                        {u.bathrooms ? ` · ${u.bathrooms} bath` : ''}
                        {u.sqm ? ` · ${u.sqm} m²` : ''}
                        {' · '}{u.available} of {u.total} available
                      </p>
                    </div>
                    <p className="text-[14px] font-medium text-[#202124]">
                      {formatPrice(u.pricePerMonth, u.currency ?? listing.currency)}
                      <span className="text-[12px] font-normal text-[#5f6368]">/mo</span>
                    </p>
                    {u.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          removeUnit.mutate(u.id!);
                        }}
                        disabled={removeUnit.isPending}
                        title={`Remove ${u.label}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#fce8e6] hover:text-[#c5221f] disabled:opacity-40 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 border-t border-[#f1f3f4] pt-3 text-[12px] text-[#5f6368]">
              Rent and availability per unit type are set when the type is added. To change
              them, remove the type and add it again from the development.
            </p>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <section className={cardCls}>
            <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Availability status</h2>
            <p className="mb-4 text-[13px] text-[#5f6368]">
              What tenants see on the listing card.
            </p>
            <div className="space-y-2">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => { setError(''); changeStatus.mutate(s.key); }}
                  disabled={changeStatus.isPending || listing.status === s.key}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-colors cursor-pointer disabled:cursor-default',
                    listing.status === s.key
                      ? 'border-[#1a73e8] bg-[#e8f0fe]'
                      : 'border-[#dadce0] hover:bg-[#f8f9fa]',
                  )}
                >
                  <span className="text-[14px] text-[#202124]">{s.label}</span>
                  {listing.status === s.key && (
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', s.cls)}>
                      current
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Development</h2>
            {listing.property ? (
              <>
                <p className="text-[14px] text-[#202124]">{listing.property.name}</p>
                <Link
                  href={`/dashboard/properties/${listing.property.slug}`}
                  className="mt-2 inline-block text-[13px] font-medium text-[#1a73e8] hover:underline"
                >
                  Manage the development
                </Link>
              </>
            ) : (
              <p className="text-[14px] text-[#5f6368]">Not linked to a development.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
