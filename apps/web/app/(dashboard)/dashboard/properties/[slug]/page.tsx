'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive, ArrowLeft, ArrowUpRight, Building2, Check, DoorOpen, Eye,
  Loader2, MessageSquare, RotateCcw, Bookmark,
} from 'lucide-react';
import { apiClient, ApiError } from '../../../../../lib/api/client';
import { propertiesApi } from '../../../../../lib/api/properties';
import { serviceById, fmtUsd, LISTING_FEE_MONTHLY } from '../../../../../lib/onboarding/catalog';
import { formatPrice } from '../../../../../lib/utils';

interface DashProperty {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'OFF_PLAN' | 'SOLD_OUT' | 'ARCHIVED';
  neighborhood?: string | null;
  city?: string | null;
  county?: string | null;
  heroImageUrl?: string | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  currency: string;
  completionDate?: string | null;
  submissionData?: {
    development?: Record<string, unknown>;
    media?: { services?: Record<string, unknown> };
    servicesOneTimeTotal?: number;
  } | null;
  units: { id: string; name: string; bedrooms: number; price: number; status: string }[];
  _count?: { savedBy: number; inquiries: number };
  createdAt: string;
}

const STATUS_CHIPS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Live', cls: 'bg-[#e6f4ea] text-[#188038]' },
  DRAFT: { label: 'In review', cls: 'bg-[#fef7e0] text-[#b06000]' },
  OFF_PLAN: { label: 'Off plan', cls: 'bg-[#e8f0fe] text-[#1967d2]' },
  SOLD_OUT: { label: 'Sold out', cls: 'bg-[#f1f3f4] text-[#5f6368]' },
  ARCHIVED: { label: 'Archived', cls: 'bg-[#f1f3f4] text-[#5f6368]' },
};

const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';

export default function DashboardPropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['dash-property', slug],
    queryFn: () => apiClient.get<DashProperty>(`/properties/${slug}`),
    retry: false,
  });

  // Archived listings are hidden from the public endpoint — fall back to
  // the developer's own list so they can still be restored.
  const { data: archivedRow, isLoading: archLoading } = useQuery({
    queryKey: ['dash-property-archived', slug],
    queryFn: async () => {
      const res = await propertiesApi.myListings({ limit: 50 });
      return (res.data as unknown as DashProperty[]).find((r) => r.slug === slug) ?? null;
    },
    enabled: isError,
  });

  const [form, setForm] = useState({
    name: '', tagline: '', description: '', neighborhood: '', city: '', county: '',
    priceFrom: '', priceTo: '', heroImageUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [statusBusy, setStatusBusy] = useState(false);

  useEffect(() => {
    if (property) {
      setForm({
        name: property.name ?? '',
        tagline: property.tagline ?? '',
        description: property.description ?? '',
        neighborhood: property.neighborhood ?? '',
        city: property.city ?? '',
        county: property.county ?? '',
        priceFrom: property.priceFrom ? String(property.priceFrom) : '',
        priceTo: property.priceTo ? String(property.priceTo) : '',
        heroImageUrl: property.heroImageUrl ?? '',
      });
    }
  }, [property]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await apiClient.patch(`/properties/${slug}`, {
        name: form.name.trim() || undefined,
        tagline: form.tagline.trim() || undefined,
        description: form.description.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        city: form.city.trim() || undefined,
        county: form.county.trim() || undefined,
        priceFrom: form.priceFrom ? Number.parseFloat(form.priceFrom) : undefined,
        priceTo: form.priceTo ? Number.parseFloat(form.priceTo) : undefined,
        heroImageUrl: form.heroImageUrl.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['dash-property', slug] });
      await queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: string) {
    setStatusBusy(true);
    setError('');
    try {
      await apiClient.patch(`/properties/${slug}/status`, { status });
      await queryClient.invalidateQueries({ queryKey: ['dash-property', slug] });
      await queryClient.invalidateQueries({ queryKey: ['dash-property-archived', slug] });
      await queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      if (status === 'ARCHIVED') router.push('/dashboard/properties');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change status.');
    } finally {
      setStatusBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#80868b]" />
      </div>
    );
  }

  if (isError || !property) {
    if (archLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#80868b]" />
        </div>
      );
    }
    if (archivedRow?.status === 'ARCHIVED') {
      return (
        <div className="mx-auto max-w-2xl py-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
            <Archive size={22} />
          </div>
          <h2 className="text-[26px] font-normal text-[#202124]">{archivedRow.name} is archived</h2>
          <p className="mt-2 text-base text-[#5f6368]">
            Archived developments are hidden from buyers and stop accruing listing fees.
          </p>
          {error && <p className="mx-auto mt-4 max-w-sm rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setStatus('DRAFT')}
              disabled={statusBusy}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
            >
              {statusBusy ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} Restore to review
            </button>
            <Link href="/dashboard/properties" className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors">
              <ArrowLeft size={15} /> Back to properties
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-base text-[#5f6368]">This development could not be loaded.</p>
        <Link href="/dashboard/properties" className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc]">
          <ArrowLeft size={15} /> Back to properties
        </Link>
      </div>
    );
  }

  const chip = STATUS_CHIPS[property.status] ?? STATUS_CHIPS.DRAFT;
  const serviceIds = Object.keys(property.submissionData?.media?.services ?? {});
  const services = serviceIds.map(serviceById).filter((s): s is NonNullable<ReturnType<typeof serviceById>> => Boolean(s));
  const dev = property.submissionData?.development as Record<string, unknown> | undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Header ── */}
      <div>
        <Link href="/dashboard/properties" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1a73e8] hover:text-[#1765cc]">
          <ArrowLeft size={14} /> Properties
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#f1f3f4]">
              {property.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={property.heroImageUrl} alt={property.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#80868b]">
                  <Building2 size={22} />
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">{property.name}</h2>
                <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${chip.cls}`}>{chip.label}</span>
              </div>
              <p className="text-base text-[#5f6368]">
                {[property.neighborhood, property.city, property.county].filter(Boolean).join(', ') || 'Location not set'}
                {' · '}{property.category.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {property.status === 'ACTIVE' && (
              <Link
                href={`/${property.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors"
              >
                <Eye size={15} /> View live page
              </Link>
            )}
            {property.status !== 'ARCHIVED' ? (
              <button
                onClick={() => setStatus('ARCHIVED')}
                disabled={statusBusy}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#c5221f] hover:bg-[#fef7f6] transition-colors cursor-pointer disabled:opacity-50"
              >
                {statusBusy ? <Loader2 size={15} className="animate-spin" /> : <Archive size={15} />} Archive
              </button>
            ) : (
              <button
                onClick={() => setStatus('DRAFT')}
                disabled={statusBusy}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
              >
                {statusBusy ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} Restore to review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: <DoorOpen size={15} />, label: 'Units', value: property.units.length },
          { icon: <MessageSquare size={15} />, label: 'Inquiries', value: property._count?.inquiries ?? 0 },
          { icon: <Bookmark size={15} />, label: 'Saves', value: property._count?.savedBy ?? 0 },
          {
            icon: <Building2 size={15} />, label: 'Listing fee',
            value: property.status === 'ACTIVE' ? `${fmtUsd(LISTING_FEE_MONTHLY)}/mo` : '—',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-[#dadce0] bg-white p-5">
            <div className="flex items-center gap-2 text-[#5f6368]">
              {s.icon}
              <span className="text-xs font-medium uppercase tracking-[0.1em]">{s.label}</span>
            </div>
            <p className="mt-2 text-[24px] font-normal text-[#202124]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Edit form ── */}
      <form onSubmit={handleSave} className="rounded-3xl border border-[#dadce0] bg-white p-6 space-y-4">
        <div>
          <h3 className="text-[18px] font-normal text-[#202124]">Listing details</h3>
          <p className="text-sm text-[#5f6368]">Changes appear on the public page immediately after saving.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Development name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tagline</label>
            <input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} placeholder="Shown under the name in search" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            className={inputCls}
            placeholder="Full marketing description"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Neighborhood</label>
            <input value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>County</label>
            <input value={form.county} onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))} className={inputCls} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Price from ({property.currency})</label>
            <input value={form.priceFrom} onChange={(e) => setForm((f) => ({ ...f, priceFrom: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Price to ({property.currency})</label>
            <input value={form.priceTo} onChange={(e) => setForm((f) => ({ ...f, priceTo: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Hero image URL</label>
            <input value={form.heroImageUrl} onChange={(e) => setForm((f) => ({ ...f, heroImageUrl: e.target.value }))} placeholder="https://" className={inputCls} />
          </div>
        </div>

        {error && <p className="rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

        <div className="flex items-center justify-end gap-3 border-t border-[#f1f3f4] pt-4">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[#188038]">
              <Check size={14} /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />} Save changes
          </button>
        </div>
      </form>

      {/* ── Units ── */}
      <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
        <div className="flex items-center justify-between border-b border-[#f1f3f4] px-6 py-4">
          <h3 className="text-[18px] font-normal text-[#202124]">Units ({property.units.length})</h3>
          <Link href="/dashboard/units" className="inline-flex items-center gap-1 text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc]">
            Manage units <ArrowUpRight size={14} />
          </Link>
        </div>
        {property.units.length === 0 ? (
          <p className="px-6 py-8 text-center text-base text-[#5f6368]">
            No units yet — they are added during review or from the units page.
          </p>
        ) : (
          <ul className="divide-y divide-[#f1f3f4]">
            {property.units.slice(0, 6).map((u) => (
              <li key={u.id} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-[15px] font-medium text-[#202124]">{u.name}</p>
                  <p className="text-[13px] text-[#5f6368]">{u.bedrooms} bed</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[15px] tabular-nums text-[#202124]">{formatPrice(u.price, property.currency)}</span>
                  <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${
                    u.status === 'AVAILABLE' ? 'bg-[#e6f4ea] text-[#188038]'
                      : u.status === 'RESERVED' ? 'bg-[#fef7e0] text-[#b06000]'
                      : 'bg-[#f1f3f4] text-[#5f6368]'
                  }`}>
                    {u.status.toLowerCase()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Submission summary (from the creation wizard) ── */}
      {(dev || services.length > 0) && (
        <div className="rounded-3xl border border-transparent bg-[#f8f9fa] p-6">
          <h3 className="text-[18px] font-normal text-[#202124]">Submission details</h3>
          <p className="text-sm text-[#5f6368]">What you provided when creating this development — used by the review and production teams.</p>
          {dev && (
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ['Type', dev.type], ['Status', dev.status], ['Units', dev.numberOfUnits],
                ['Bedrooms', dev.bedrooms], ['Parking', dev.parking], ['Expected completion', dev.expectedCompletion],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-[13px] text-[#80868b]">{String(k)}</dt>
                  <dd className="text-[15px] text-[#202124]">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
          {services.length > 0 && (
            <div className="mt-4 border-t border-[#dadce0]/60 pt-4">
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#5f6368]">Ordered production services</p>
              <ul className="mt-2 space-y-1.5">
                {services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between">
                    <span className="text-[15px] text-[#3c4043]">{s.label}</span>
                    <span className="text-[15px] tabular-nums text-[#202124]">{fmtUsd(s.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
