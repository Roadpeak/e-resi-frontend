'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin, BedDouble, Maximize2, Users, Calendar, Film, Box,
  ArrowLeft, CheckCircle2, Loader2, X, Images
} from 'lucide-react';
import { RentNavbar } from '../../../../components/rent/RentNavbar';
import { UnitSectionNav } from '../../../../components/property/UnitSectionNav';
import { rentListingsApi, toRentListing } from '../../../../lib/api/rent-listings';
import { floorPlansApi } from '../../../../lib/api/floor-plans';
import { ChatWithDeveloper } from '../../../../components/chat/ChatWithDeveloper';
import { RentEnquiryModal } from '../../../../components/rent/RentEnquiryModal';
import { formatPrice } from '../../../../lib/utils';
import { apiClient, ApiError } from '../../../../lib/api/client';
import { useAuthStore } from '../../../../lib/stores/auth.store';
import { referralPayload } from '../../../../lib/analytics/referral';
import type { RentUnit } from '../../../../lib/types';

const FURNISHING_LABELS: Record<string, string> = {
  furnished: 'Furnished',
  semi_furnished: 'Semi-Furnished',
  unfurnished: 'Unfurnished',
  FURNISHED: 'Furnished',
  SEMI_FURNISHED: 'Semi-Furnished',
  UNFURNISHED: 'Unfurnished',
};

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  partially_available: 'bg-orange-100 text-orange-600',
  fully_let: 'bg-gray-100 text-gray-500',
  AVAILABLE: 'bg-green-100 text-green-700',
  PARTIALLY_AVAILABLE: 'bg-orange-100 text-orange-600',
  FULLY_LET: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  partially_available: 'Partially Available',
  fully_let: 'Fully Let',
  AVAILABLE: 'Available',
  PARTIALLY_AVAILABLE: 'Partially Available',
  FULLY_LET: 'Fully Let',
};

/** 10 -> "10th floor"; 0 -> "ground floor". */
function ordinalFloor(n: number): string {
  if (n === 0) return 'ground floor';
  const rem100 = n % 100;
  const suffix =
    rem100 >= 11 && rem100 <= 13
      ? 'th'
      : n % 10 === 1
        ? 'st'
        : n % 10 === 2
          ? 'nd'
          : n % 10 === 3
            ? 'rd'
            : 'th';
  return `${n}${suffix} floor`;
}

export default function RentListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { data: raw, isLoading, isError } = useQuery({
    queryKey: ['rent-listing', slug],
    queryFn: () => rentListingsApi.get(slug),
    enabled: !!slug,
  });

  const listing = raw ? toRentListing(raw as any) : null;

  /** Full-size image opened from the gallery. */
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [modal, setModal] = useState<'VIEWING' | 'ENQUIRY' | null>(null);

  /**
   * Gallery images. A rental is units inside a building, so when the listing
   * has no photography of its own the development's is the right imagery to
   * fall back to rather than showing a lone hero.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const propertyMedia: string[] = (((raw as any)?.property?.media ?? []) as any[])
    .filter((m) => m?.url && m?.title !== '__logo__')
    .map((m) => m.url as string);
  const gallery = [...(listing?.galleryImages ?? []), ...propertyMedia]
    .filter((u, i, arr) => u && u !== listing?.heroImageUrl && arr.indexOf(u) === i);

  // Aggregates for the key-facts strip.
  const units = listing?.units ?? [];
  const totalAvailable = units.reduce((a, u) => a + (u.available ?? 0), 0);
  const totalUnits = units.reduce((a, u) => a + (u.total ?? 0), 0);
  const bedroomCounts = units.map((u) => u.bedrooms).sort((a, b) => a - b);
  const bedroomRange = bedroomCounts.length === 0
    ? '—'
    : bedroomCounts[0] === bedroomCounts[bedroomCounts.length - 1]
      ? (bedroomCounts[0] === 0 ? 'Studio' : `${bedroomCounts[0]} bed`)
      : `${bedroomCounts[0] === 0 ? 'Studio' : bedroomCounts[0]}–${bedroomCounts[bedroomCounts.length - 1]} bed`;

  /**
   * Layouts, from the development the units sit in.
   *
   * A rent listing has no floor plans of its own — the drawings a tenant asks
   * for are the same ones the sales side publishes for the building, so they
   * are fetched from the parent property when there is one.
   */
  const { data: floorPlans = [] } = useQuery({
    queryKey: ['floor-plans', listing?.propertySlug],
    queryFn: () => floorPlansApi.list(listing!.propertySlug),
    enabled: !!listing?.propertySlug,
  });

  /**
   * The rail, built from the sections this listing actually has.
   *
   * Listing one that scrolls nowhere is worse than having no rail at all.
   */
  const sections = [
    { id: 'overview', label: 'Overview' },
    ...(listing?.description ? [{ id: 'about', label: 'About' }] : []),
    ...(units.length ? [{ id: 'units', label: 'Units' }] : []),
    ...(floorPlans.length ? [{ id: 'floorplans', label: 'Floor plans' }] : []),
  ];

  /** Nearby landmarks come from the development, not the rent listing. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const amenities: { id?: string; name: string; distance?: string }[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((raw as any)?.property?.amenities ?? []) as any[];

  return (
    <div
      className="min-h-screen pt-16"
      style={{
        background: 'linear-gradient(135deg, #e8e6f0 0%, #f5f3ee 40%, #f0ece4 70%, #f5e8d8 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <RentNavbar />

      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-gray-400" />
        </div>
      )}

      {isError && (
        <div className="mx-auto max-w-2xl px-4 py-32 text-center">
          <p className="text-gray-500">Listing not found.</p>
          <Link href="/rent" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
            <ArrowLeft size={14} /> Back to rentals
          </Link>
        </div>
      )}

      {listing && (
        <>
        {/* Gallery mosaic, ahead of the rail — the same shape a tenant sees on
            a unit page, so the two pages read as one product. */}
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <Link href="/rent" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={14} /> All rentals
          </Link>

          <div className="grid h-[300px] gap-2 overflow-hidden rounded-3xl bg-gray-100 sm:h-[440px] sm:grid-cols-[2fr_1fr] sm:grid-rows-2">
              <button
                type="button"
                onClick={() => listing.heroImageUrl && setLightbox(listing.heroImageUrl)}
                className="relative h-full w-full cursor-pointer sm:row-span-2"
              >
                {listing.heroImageUrl ? (
                  <Image src={listing.heroImageUrl} alt={listing.name} fill className="object-cover" sizes="(max-width:1024px) 100vw, 66vw" priority />
                ) : (
                  <div className="h-full w-full bg-gray-200" />
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[listing.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[listing.status] ?? listing.status}
                  </span>
                  {listing.isFeatured && (
                    <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">Featured</span>
                  )}
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  {listing.showCinematicTour && (
                    <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
                      <Film size={10} /> Cinematic
                    </span>
                  )}
                  {listing.show3DTour && (
                    <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
                      <Box size={10} /> 3D Tour
                    </span>
                  )}
                </div>
              </button>

              {/* Two stacked stills. Hidden on a phone, where each would be a
                  thumbnail of a thumbnail. */}
              {[0, 1].map((i) => (
                <button
                  key={gallery[i] ?? `empty-${i}`}
                  type="button"
                  onClick={() => gallery[i] && setLightbox(gallery[i])}
                  className="relative hidden cursor-pointer sm:block"
                >
                  {gallery[i] ? (
                    <Image src={gallery[i]} alt={`${listing.name} — photo ${i + 2}`} fill className="object-cover" sizes="33vw" />
                  ) : (
                    <span className="absolute inset-0 bg-gray-100" />
                  )}
                  {i === 1 && gallery.length > 2 && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-gray-900 shadow-sm">
                      <Images size={13} /> {gallery.length + 1} photos
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <UnitSectionNav sections={sections} />
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
            {/* Left col */}
            <div className="min-w-0 space-y-4">
              {/* ── Overview ── */}
              <section id="overview" className="scroll-mt-32 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7">
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
                  <MapPin size={13} />
                  <span>{listing.address.neighborhood}, {listing.address.city}</span>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">{listing.name}</h1>
                {listing.tagline && <p className="mt-1 text-gray-500">{listing.tagline}</p>}

                {/* Rent, on mobile only. The sidebar price card is the same
                    information, but on a phone the sidebar renders after the
                    gallery, units and tags — so a tenant had to scroll the
                    whole page to find out what it costs. */}
                <div className="mt-3 flex items-baseline gap-2 lg:hidden">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(listing.priceFrom, listing.currency)}
                  </span>
                  <span className="text-sm text-gray-400">/month</span>
                  {listing.priceTo > listing.priceFrom && (
                    <span className="text-sm text-gray-400">
                      — {formatPrice(listing.priceTo, listing.currency)}
                    </span>
                  )}
                </div>

              {/* Key facts — the things a tenant scans for before reading
                  anything. Previously these were split between the sidebar
                  and the unit rows, so a phone visitor had to scroll past the
                  whole page to find the bedroom range. */}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-6 sm:grid-cols-4">
                {[
                  {
                    label: 'Bedrooms',
                    value: bedroomRange,
                  },
                  {
                    label: 'Units free',
                    value: `${totalAvailable} of ${totalUnits}`,
                  },
                  {
                    label: 'Furnishing',
                    value: FURNISHING_LABELS[listing.furnishing] ?? listing.furnishing,
                  },
                  {
                    label: 'Min. lease',
                    value: `${listing.minLeaseTerm} months`,
                  },
                ].map((f) => (
                  <div key={f.label} className="rounded-2xl bg-[#faf9f7] p-4">
                    <p className="text-[11px] uppercase tracking-wider text-gray-400">{f.label}</p>
                    <p className="mt-1 text-[15px] font-semibold text-gray-900">{f.value}</p>
                  </div>
                ))}
              </div>
              </section>

              {/* Description */}
              {listing.description && (
                <section id="about" className="scroll-mt-32 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7">
                  <h2 className="mb-3 text-2xl font-semibold text-gray-900">About</h2>
                  <p className="text-[15px] leading-relaxed text-gray-700">{listing.description}</p>
                </section>
              )}

              {/* Units */}
              {listing.units.length > 0 && (
                <section id="units" className="scroll-mt-32 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">Available units</h2>
                  <div className="space-y-3">
                    {listing.units.map((unit) => (
                      <div key={unit.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {unit.label}
                            {unit.floor != null && (
                              <span className="font-normal text-gray-500">, {ordinalFloor(unit.floor)}</span>
                            )}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <BedDouble size={11} />
                              {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}
                            </span>
                            {unit.sqm > 0 && (
                              <span className="flex items-center gap-1"><Maximize2 size={11} /> {unit.sqm} m²</span>
                            )}
                            <span className="flex items-center gap-1"><Users size={11} /> {unit.available}/{unit.total} available</span>
                          </div>
                          {unit.features && unit.features.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {unit.features.map((f) => (
                                <span key={f} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 capitalize">{f.replace(/-/g, ' ')}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-base font-bold text-gray-900">{formatPrice(unit.pricePerMonth, unit.currency)}</p>
                          <p className="text-xs text-gray-400">/month</p>
                          <ReserveUnitButton
                            unit={unit}
                            propertySlug={listing.propertySlug}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Floor plans ──
                  Borrowed from the development the units sit in: a rent
                  listing has no layouts of its own, and the drawings a tenant
                  wants are the same ones the sales side publishes. */}
              {floorPlans.length > 0 && (
                <section id="floorplans" className="scroll-mt-32 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7">
                  <h2 className="mb-1 text-2xl font-semibold text-gray-900">Floor plans</h2>
                  <p className="mb-5 text-[14px] text-gray-500">
                    The layouts in this development.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {floorPlans.map((fp) => (
                      <button
                        key={fp.id}
                        type="button"
                        onClick={() => setLightbox(fp.imageUrl)}
                        className="overflow-hidden rounded-2xl border border-gray-200 text-left transition-colors hover:border-gray-300 cursor-pointer"
                      >
                        <div className="relative h-40 bg-[#faf9f7]">
                          <Image src={fp.imageUrl} alt={fp.name} fill className="object-contain p-3" sizes="320px" unoptimized />
                        </div>
                        <div className="border-t border-gray-100 px-4 py-3">
                          <p className="truncate text-[14px] font-medium text-gray-900">{fp.name}</p>
                          <p className="mt-0.5 text-[12.5px] text-gray-500">
                            {[
                              fp.bedrooms == null ? null : fp.bedrooms === 0 ? 'Studio' : `${fp.bedrooms} bed`,
                              fp.bathrooms == null ? null : `${fp.bathrooms} bath`,
                              fp.sqm == null ? null : `${fp.sqm} m²`,
                            ].filter(Boolean).join(' · ') || 'Layout'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Tags */}
              {listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-gray-200 bg-white/60 px-3 py-1 text-xs text-gray-500 capitalize">{tag.replace(/-/g, ' ')}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Right col — sticky summary.
                Pinned below the section rail so the way to enquire, chat or
                reserve is on screen at every point of the page. */}
            <div className="space-y-4">
              <div className="sticky top-32 space-y-4">
                {/* Price card */}
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">Starting from</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(listing.priceFrom, listing.currency)}<span className="text-sm font-normal text-gray-400">/mo</span></p>
                  {listing.priceTo > listing.priceFrom && (
                    <p className="text-sm text-gray-400">up to {formatPrice(listing.priceTo, listing.currency)}/mo</p>
                  )}

                  <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Furnishing</span>
                      <span>{FURNISHING_LABELS[listing.furnishing] ?? listing.furnishing}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Min. lease</span>
                      <span>{listing.minLeaseTerm} months</span>
                    </div>
                    {listing.availableFrom && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Available from</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(listing.availableFrom).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setModal('VIEWING')}
                    className="mt-5 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Book a Viewing
                  </button>
                  <button
                    onClick={() => setModal('ENQUIRY')}
                    className="mt-2 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Send Enquiry
                  </button>
                  <ChatWithDeveloper rentListingSlug={listing.slug} className="mt-2 w-full" />
                  {listing.propertySlug && (
                    <Link
                      href={`/${listing.propertySlug}`}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      <Building2 size={15} /> View the property
                    </Link>
                  )}
                </div>

                {/* Developer card */}
                {(raw as any)?.developer && (
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Listed by</p>
                    <div className="flex items-center gap-3">
                      {(raw as any).developer.logoUrl && (
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl shrink-0">
                          <Image src={(raw as any).developer.logoUrl} alt={(raw as any).developer.companyName} fill className="object-cover" sizes="40px" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{(raw as any).developer.companyName}</p>
                        {(raw as any).developer.establishedYear && (
                          <p className="text-xs text-gray-400">Est. {(raw as any).developer.establishedYear}</p>
                        )}
                      </div>
                    </div>
                    {(raw as any).developer.description && (
                      <p className="mt-3 text-xs text-gray-500 leading-relaxed line-clamp-3">{(raw as any).developer.description}</p>
                    )}
                  </div>
                )}

                {/* Amenities — the listing has none of its own, so these come
                    from the development the units sit in. */}
                {amenities.length > 0 && (
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Amenities</p>
                    <ul className="space-y-1.5">
                      {amenities.map((a) => (
                        <li key={a.id ?? a.name} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                          <span className="min-w-0 flex-1">{a.name}</span>
                          {a.distance && (
                            <span className="shrink-0 text-xs text-gray-400">{a.distance}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Full-size image from the gallery */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close image"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
          >
            <X size={18} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded host */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {modal && listing && (
        <RentEnquiryModal
          mode={modal}
          listingId={listing.id}
          listingName={listing.name}
          propertySlug={listing.propertySlug || undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

/**
 * Reserve one unit of this type, plus links to whichever tours the developer
 * chose to show for the layout.
 */
function ReserveUnitButton({
  unit,
  propertySlug,
}: {
  unit: RentUnit;
  propertySlug?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  const soldOut = unit.available < 1;

  const tours = [
    unit.showCinematicTour && { href: `/${propertySlug}/tour/cinematic`, label: 'Cinematic' },
    unit.show3DTour && { href: `/${propertySlug}/tour/3d`, label: '3D' },
    unit.showVRTour && { href: `/${propertySlug}/tour/vr`, label: 'VR' },
  ].filter(Boolean) as { href: string; label: string }[];

  async function reserve() {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setError('');
    setBusy(true);
    try {
      // A reservation is the closest thing to a sale, so it is the most
      // valuable thing to credit back to the agent who introduced the tenant.
      await apiClient.post(`/reservations/rent-units/${unit.id}`, referralPayload());
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reserve.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col items-end gap-1.5">
      {tours.length > 0 && propertySlug && (
        <div className="flex gap-1.5">
          {tours.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}
      {done ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle2 size={12} /> Reserved
        </span>
      ) : (
        <button
          onClick={reserve}
          disabled={busy || soldOut}
          className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          {busy ? 'Reserving…' : soldOut ? 'Fully let' : 'Reserve'}
        </button>
      )}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
