'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive, ArrowLeft, Building2, Check, DoorOpen, Eye,
  Loader2, MessageSquare, Plus, RotateCcw, Bookmark, Trash2, X,
} from 'lucide-react';
import { apiClient, ApiError } from '../../../../../lib/api/client';
import { propertiesApi } from '../../../../../lib/api/properties';
import { serviceById, fmtUsd, LISTING_FEE_MONTHLY } from '../../../../../lib/onboarding/catalog';
import { formatPrice } from '../../../../../lib/utils';
import { ImageUpload } from '../../../../../components/dashboard/ImageUpload';
import { PropertyMediaManager } from '../../../../../components/dashboard/PropertyMediaManager';

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
        heroImageUrl: form.heroImageUrl.trim(),
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Price from ({property.currency})</label>
            <input value={form.priceFrom} onChange={(e) => setForm((f) => ({ ...f, priceFrom: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Price to ({property.currency})</label>
            <input value={form.priceTo} onChange={(e) => setForm((f) => ({ ...f, priceTo: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="numeric" className={inputCls} />
          </div>
        </div>

        <ImageUpload
          value={form.heroImageUrl}
          onChange={(url) => setForm((f) => ({ ...f, heroImageUrl: url }))}
          label="Property photo"
          hint="Shown on the listing, search results and all its rentals"
        />

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

      {/* ── Media: gallery, logo, immersive videos ── */}
      <PropertyMediaManager slug={property.slug} heroImageUrl={property.heroImageUrl} />

      {/* ── Units ── */}
      <UnitsManager slug={property.slug} currency={property.currency} units={property.units} />

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


/* ── Units management (add / update status / remove) ─────────────── */

interface UnitRow {
  id: string;
  name: string;
  floor?: number | null;
  bedrooms: number;
  bathrooms?: number | null;
  sqm?: number | null;
  price: number;
  status: string;
}

const UNIT_STATUSES = ['AVAILABLE', 'RESERVED', 'SOLD'] as const;
const UNIT_STATUS_CLS: Record<string, string> = {
  AVAILABLE: 'bg-[#e6f4ea] text-[#188038]',
  RESERVED: 'bg-[#fef7e0] text-[#b06000]',
  SOLD: 'bg-[#f1f3f4] text-[#5f6368]',
};

function UnitsManager({ slug, currency, units }: { slug: string; currency: string; units: UnitRow[] }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', floor: '', bedrooms: '', bathrooms: '', sqm: '', price: '', status: 'AVAILABLE',
  });
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dash-property', slug] });
    queryClient.invalidateQueries({ queryKey: ['my-properties'] });
  };

  async function addUnit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const price = Number.parseFloat(form.price);
    if (!form.name.trim()) return setError('Give the unit a name, e.g. "A-101" or "2 Bed Deluxe".');
    if (!Number.isFinite(price) || price <= 0) return setError('Enter a valid unit price.');
    setSaving(true);
    try {
      await apiClient.post(`/properties/${slug}/units`, {
        name: form.name.trim(),
        floor: form.floor ? Number.parseInt(form.floor, 10) : undefined,
        bedrooms: form.bedrooms ? Number.parseInt(form.bedrooms, 10) : undefined,
        bathrooms: form.bathrooms ? Number.parseInt(form.bathrooms, 10) : undefined,
        sqm: form.sqm ? Number.parseFloat(form.sqm) : undefined,
        price,
        status: form.status,
      });
      setForm({ name: '', floor: '', bedrooms: '', bathrooms: '', sqm: '', price: '', status: 'AVAILABLE' });
      setAdding(false);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add the unit.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(unit: UnitRow, status: string) {
    if (status === unit.status) return;
    setBusyId(unit.id);
    setError('');
    try {
      await apiClient.patch(`/properties/${slug}/units/${unit.id}`, { status });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the unit.');
    } finally {
      setBusyId(null);
    }
  }

  async function removeUnit(unit: UnitRow) {
    setBusyId(unit.id);
    setError('');
    try {
      await apiClient.delete(`/properties/${slug}/units/${unit.id}`);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove the unit.');
    } finally {
      setBusyId(null);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
      <div className="flex items-center justify-between border-b border-[#f1f3f4] px-6 py-4">
        <div>
          <h3 className="text-[18px] font-normal text-[#202124]">Units ({units.length})</h3>
          <p className="text-sm text-[#5f6368]">Inventory buyers can inquire about and reserve.</p>
        </div>
        <button
          onClick={() => { setAdding((v) => !v); setError(''); }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer"
        >
          {adding ? <X size={14} /> : <Plus size={14} />} {adding ? 'Cancel' : 'Add unit'}
        </button>
      </div>

      {adding && (
        <form onSubmit={addUnit} className="border-b border-[#f1f3f4] bg-[#f8f9fa] px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Unit name</label>
              <input value={form.name} onChange={set('name')} required placeholder="A-101 · 2 Bed Deluxe" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Price ({currency})</label>
              <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^\d.]/g, '') }))} required inputMode="numeric" placeholder="8500000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Floor</label>
              <input value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value.replace(/\D/g, '') }))} inputMode="numeric" placeholder="1" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bedrooms</label>
              <input value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value.replace(/\D/g, '') }))} inputMode="numeric" placeholder="2" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bathrooms</label>
              <input value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value.replace(/\D/g, '') }))} inputMode="numeric" placeholder="2" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Size (m²)</label>
              <input value={form.sqm} onChange={(e) => setForm((f) => ({ ...f, sqm: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="numeric" placeholder="120" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {UNIT_STATUSES.map((st) => (
                  <option key={st} value={st}>{st.charAt(0) + st.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add unit
              </button>
            </div>
          </div>
        </form>
      )}

      {error && <p className="mx-6 mt-4 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

      {units.length === 0 && !adding ? (
        <div className="px-6 py-10 text-center">
          <p className="text-base text-[#5f6368]">No units yet — add your first one so buyers can reserve.</p>
          <button
            onClick={() => setAdding(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add unit
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[#f1f3f4]">
          {units.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-[#202124]">{u.name}</p>
                <p className="text-[13px] text-[#5f6368]">
                  {[
                    u.floor != null ? `floor ${u.floor}` : null,
                    u.bedrooms ? `${u.bedrooms} bed` : null,
                    u.bathrooms ? `${u.bathrooms} bath` : null,
                    u.sqm ? `${u.sqm} m²` : null,
                  ].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <span className="text-[15px] tabular-nums text-[#202124]">{formatPrice(u.price, currency)}</span>
              <div className="relative">
                <select
                  value={u.status}
                  disabled={busyId === u.id}
                  onChange={(e) => updateStatus(u, e.target.value)}
                  className={`appearance-none rounded-full border-0 py-1 pl-3 pr-7 text-[13px] font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 ${UNIT_STATUS_CLS[u.status] ?? 'bg-[#f1f3f4] text-[#5f6368]'}`}
                >
                  {UNIT_STATUSES.map((st) => (
                    <option key={st} value={st}>{st.charAt(0) + st.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px]">▾</span>
              </div>
              <button
                onClick={() => removeUnit(u)}
                disabled={busyId === u.id}
                aria-label={`Remove ${u.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#80868b] hover:bg-[#fce8e6] hover:text-[#c5221f] transition-colors cursor-pointer disabled:opacity-50"
              >
                {busyId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
