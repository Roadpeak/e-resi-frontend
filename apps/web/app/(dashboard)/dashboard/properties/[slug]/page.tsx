'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive, ArrowLeft, Building2, Check, ChevronRight, DoorOpen, ExternalLink,
  Loader2, MessageSquare, RotateCcw, Bookmark, Trash2 } from 'lucide-react';
import { apiClient, ApiError } from '../../../../../lib/api/client';
import { propertiesApi } from '../../../../../lib/api/properties';
import { useCatalog } from '../../../../../lib/onboarding/useCatalog';
import { ImageUpload } from '../../../../../components/dashboard/ImageUpload';
import { DetectLocationButton } from '../../../../../components/dashboard/DetectLocationButton';
import { AreaSearchInput } from '../../../../../components/dashboard/AreaSearchInput';
import { PropertyActionsMenu } from '../../../../../components/dashboard/PropertyActionsMenu';
import { PropertySectionNav } from '../../../../../components/dashboard/PropertySubpage';
import { PROPERTY_SECTIONS, isPublicStatus, sectionHref } from '../../../../../components/dashboard/propertySections';
import { REVIEW_CHIP, ReviewStatusBanner, reviewStateOf } from '../../../../../components/dashboard/ReviewStatus';

interface DashProperty {
  id: string;
  slug: string;
  name: string;
  customDomain?: string | null;
  subdomain?: string | null;
  tagline?: string | null;
  description?: string | null;
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'OFF_PLAN' | 'SOLD_OUT' | 'ARCHIVED';
  /** Set when an admin has reviewed it; a DRAFT with this set was sent back. */
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  county?: string | null;
  heroImageUrl?: string | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  currency: string;
  completionDate?: string | null;
  /** Landmarks around the development, editable below. */
  amenities?: { id?: string; name: string; type: string; distance?: string | null }[];
  /** Details & area — everything the property page shows below the fold. */
  features?: string[];
  unitFeatures?: string[];
  areaDescription?: string | null;
  petsAllowed?: boolean | null;
  petPolicy?: string | null;
  leaseTerms?: string | null;
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
  DRAFT: { label: 'Pending review', cls: 'bg-[#fef7e0] text-[#b06000]' },
  OFF_PLAN: { label: 'Off plan', cls: 'bg-[#e8f0fe] text-[#1967d2]' },
  SOLD_OUT: { label: 'Sold out', cls: 'bg-[#f1f3f4] text-[#5f6368]' },
  ARCHIVED: { label: 'Archived', cls: 'bg-[#f1f3f4] text-[#5f6368]' },
};

const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';

/** Accepts "-1.2673, 36.8065"; ignores anything that isn't a valid pair. */
/** "pool, gym, borehole" -> ['pool','gym','borehole']. Blank entries dropped. */
function splitList(raw: string): string[] {
  return raw.split(',').map((x) => x.trim()).filter(Boolean);
}

function parseCoordinates(raw?: string): { latitude?: number; longitude?: number } {
  if (!raw) return {};
  const [lat, lng] = raw.split(',').map((v) => Number.parseFloat(v.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return {};
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return {};
  return { latitude: lat, longitude: lng };
}

export default function DashboardPropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  // Live listing fee from the admin catalogue (the built-in fallback is not what admin charges).
  const catalog = useCatalog();
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
    priceFrom: '', priceTo: '', heroImageUrl: '', coordinates: '',
    // Shown on the property page under Details & area.
    unitFeatures: '', features: '', areaDescription: '',
    petsAllowed: '', petPolicy: '', leaseTerms: '',
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
        coordinates:
          property.latitude != null && property.longitude != null
            ? `${property.latitude}, ${property.longitude}`
            : '',
        unitFeatures: (property.unitFeatures ?? []).join(', '),
        features: (property.features ?? []).join(', '),
        areaDescription: property.areaDescription ?? '',
        // '' is "not stated", which is a real answer distinct from "no".
        petsAllowed: property.petsAllowed == null ? '' : property.petsAllowed ? 'yes' : 'no',
        petPolicy: property.petPolicy ?? '',
        leaseTerms: property.leaseTerms ?? '',
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
        // Comma-separated in the form, arrays on the wire.
        unitFeatures: splitList(form.unitFeatures),
        features: splitList(form.features),
        areaDescription: form.areaDescription.trim() || undefined,
        petsAllowed: form.petsAllowed === '' ? undefined : form.petsAllowed === 'yes',
        petPolicy: form.petPolicy.trim() || undefined,
        leaseTerms: form.leaseTerms.trim() || undefined,
        // Without coordinates the property can't be plotted on the map.
        ...parseCoordinates(form.coordinates),
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

  /**
   * Permanently remove a draft or archived listing.
   *
   * Archiving only hides a development, so a duplicate or an abandoned draft
   * stayed in the dashboard forever with no way for the developer to clear it.
   * Guarded behind an explicit confirmation because, unlike archiving, this
   * cannot be undone.
   */
  async function deleteProperty(name: string) {
    const ok = window.confirm(
      `Permanently delete "${name}"?\n\n`
      + 'This removes the listing, its media, units and floor plans for good. '
      + 'It cannot be undone.',
    );
    if (!ok) return;

    setStatusBusy(true);
    setError('');
    try {
      await apiClient.delete(`/properties/${slug}/permanent`);
      await queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      router.push('/dashboard/properties');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this development.');
    } finally {
      setStatusBusy(false);
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
            <button
              onClick={() => deleteProperty(archivedRow.name)}
              disabled={statusBusy}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#f5c6c4] bg-white px-5 py-2.5 text-[15px] font-medium text-[#c5221f] hover:bg-[#fce8e6] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={15} /> Delete permanently
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

  const review = reviewStateOf(property);
  const chip = review ? REVIEW_CHIP[review] : STATUS_CHIPS[property.status] ?? STATUS_CHIPS.DRAFT;
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
            {isPublicStatus(property.status) && (
              <a
                href={`/${property.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors"
              >
                <ExternalLink size={15} /> View live page
              </a>
            )}
            {/* Everything else — sections, archive, delete — lives in one
                menu, the same one the properties list opens. */}
            <PropertyActionsMenu property={property} variant="button" onError={setError} />
          </div>
        </div>
      </div>

      <PropertySectionNav slug={property.slug} />
      {error && <p className="rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

      <ReviewStatusBanner
        status={property.status}
        createdAt={property.createdAt}
        reviewedAt={property.reviewedAt}
        reviewNotes={property.reviewNotes}
      />

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: <DoorOpen size={15} />, label: 'Units', value: property.units.length },
          { icon: <MessageSquare size={15} />, label: 'Inquiries', value: property._count?.inquiries ?? 0 },
          { icon: <Bookmark size={15} />, label: 'Saves', value: property._count?.savedBy ?? 0 },
          {
            icon: <Building2 size={15} />, label: 'Listing fee',
            value: property.status === 'ACTIVE' ? `${catalog.fmt(catalog.listingFeeMonthly)}/mo` : '—',
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

      {/* ── Manage: every other part of the development has its own page ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROPERTY_SECTIONS.filter((x) => x.key !== 'overview').map((x) => {
          const detail =
            x.key === 'units' ? `${property.units.length} unit${property.units.length === 1 ? '' : 's'}`
            : x.key === 'nearby' ? `${property.amenities?.length ?? 0} place${property.amenities?.length === 1 ? '' : 's'}`
            : x.key === 'domain' ? (property.customDomain ?? (property.subdomain ? `${property.subdomain}.e-resi.com` : null))
            : null;
          return (
            <Link
              key={x.key}
              href={sectionHref(property.slug, x)}
              className="group flex items-start gap-3 rounded-3xl border border-[#dadce0] bg-white p-5 transition-colors hover:border-[#c6dafc] hover:bg-[#f8fbff]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368] group-hover:bg-[#e8f0fe] group-hover:text-[#1a73e8]">
                <x.icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 text-[15px] font-medium text-[#202124]">
                  {x.label} <ChevronRight size={16} className="shrink-0 text-[#80868b]" />
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-[#5f6368]">{detail ?? x.blurb}</span>
              </span>
            </Link>
          );
        })}
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

        {/* ── Details & area ──
            Everything the property page shows below the fold. Each renders
            only when filled, so a half-completed listing shows fewer sections
            rather than empty headings. */}
        <div className="rounded-2xl border border-[#dadce0] p-5">
          <p className="text-[15px] font-medium text-[#202124]">Details &amp; area</p>
          <p className="mt-0.5 text-[13px] text-[#5f6368]">
            Shown on your property page. Leave anything blank and that section stays hidden.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>In-unit features</label>
              <input
                value={form.unitFeatures}
                onChange={(e) => setForm((f) => ({ ...f, unitFeatures: e.target.value }))}
                placeholder="Fitted kitchen, ensuite, balcony, DSQ"
                className={inputCls}
              />
              <p className="mt-1 text-[12px] text-[#80868b]">What comes with a home. Separate with commas.</p>
            </div>
            <div>
              <label className={labelCls}>Community features</label>
              <input
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                placeholder="Pool, gym, borehole, backup generator"
                className={inputCls}
              />
              <p className="mt-1 text-[12px] text-[#80868b]">What the development has. Separate with commas.</p>
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>About the area</label>
            <textarea
              value={form.areaDescription}
              onChange={(e) => setForm((f) => ({ ...f, areaDescription: e.target.value }))}
              rows={3}
              className={inputCls}
              placeholder="What the neighbourhood is like — schools, commute, what is walkable."
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
            <div>
              <label className={labelCls}>Pets</label>
              <select
                value={form.petsAllowed}
                onChange={(e) => setForm((f) => ({ ...f, petsAllowed: e.target.value }))}
                className={inputCls}
              >
                <option value="">Not stated</option>
                <option value="yes">Allowed</option>
                <option value="no">Not allowed</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Pet policy</label>
              <input
                value={form.petPolicy}
                onChange={(e) => setForm((f) => ({ ...f, petPolicy: e.target.value }))}
                placeholder="Cats and small dogs. KES 3,000/month per pet."
                className={inputCls}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>Lease terms</label>
            <input
              value={form.leaseTerms}
              onChange={(e) => setForm((f) => ({ ...f, leaseTerms: e.target.value }))}
              placeholder="Minimum 12 months. Two months deposit, one month rent in advance."
              className={inputCls}
            />
          </div>
        </div>

        <DetectLocationButton
          onDetected={(loc) =>
            setForm((f) => ({
              ...f,
              coordinates: `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
              // Only overwrite a field when detection produced a value.
              neighborhood: loc.neighborhood ?? f.neighborhood,
              city: loc.city ?? f.city,
              county: loc.county ?? f.county,
            }))
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Neighborhood</label>
            <AreaSearchInput
              value={form.neighborhood}
              onChange={(neighborhood) => setForm((f) => ({ ...f, neighborhood }))}
              placeholder="Search e.g. Westlands, Kilimani"
              inputClassName={inputCls}
              onPick={(a) =>
                setForm((f) => ({
                  ...f,
                  city: a.city ?? f.city,
                  county: a.county ?? f.county,
                  // Area-level, so it never replaces a pin already set.
                  coordinates: f.coordinates.trim()
                    ? f.coordinates
                    : `${a.latitude.toFixed(6)}, ${a.longitude.toFixed(6)}`,
                }))
              }
            />
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

        <div>
          <label className={labelCls}>GPS coordinates</label>
          <input
            value={form.coordinates}
            onChange={(e) => setForm((f) => ({ ...f, coordinates: e.target.value }))}
            className={inputCls}
            placeholder="-1.2673, 36.8065"
          />
          <p className="mt-1.5 text-[12px] text-[#80868b]">
            Places this development on the marketplace map. Detect it above or paste a lat, lng pair.
          </p>
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

      {/* ── Submission summary (from the creation wizard) ── */}
      {dev && (
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

        </div>
      )}
    </div>
  );
}
