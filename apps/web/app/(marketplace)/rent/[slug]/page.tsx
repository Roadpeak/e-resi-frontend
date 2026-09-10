'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2, MapPin, BedDouble, Bath, Maximize2, Calendar, Film, Box,
  ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Home, Loader2, Sofa,
  X, Images, KeyRound, CalendarClock, DoorOpen,
} from 'lucide-react';
import { RentNavbar } from '../../../../components/rent/RentNavbar';
import { UnitSectionNav } from '../../../../components/property/UnitSectionNav';
import { rentListingsApi, toRentListing } from '../../../../lib/api/rent-listings';
import { floorPlansApi } from '../../../../lib/api/floor-plans';
import { ChatWithDeveloper } from '../../../../components/chat/ChatWithDeveloper';
import { RentEnquiryModal } from '../../../../components/rent/RentEnquiryModal';
import { formatPrice, cn } from '../../../../lib/utils';
import { apiClient, ApiError } from '../../../../lib/api/client';
import { useAuthStore } from '../../../../lib/stores/auth.store';
import { referralPayload } from '../../../../lib/analytics/referral';
import type { RentUnit } from '../../../../lib/types';

const FURNISHING_LABELS: Record<string, string> = {
  furnished: 'Furnished',
  semi_furnished: 'Semi-furnished',
  unfurnished: 'Unfurnished',
  FURNISHED: 'Furnished',
  SEMI_FURNISHED: 'Semi-furnished',
  UNFURNISHED: 'Unfurnished',
};

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-[#e6f4ea] text-[#188038]',
  partially_available: 'bg-[#fef7e0] text-[#b06000]',
  fully_let: 'bg-gray-100 text-gray-500',
  AVAILABLE: 'bg-[#e6f4ea] text-[#188038]',
  PARTIALLY_AVAILABLE: 'bg-[#fef7e0] text-[#b06000]',
  FULLY_LET: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Available now',
  partially_available: 'Partially available',
  fully_let: 'Fully let',
  AVAILABLE: 'Available now',
  PARTIALLY_AVAILABLE: 'Partially available',
  FULLY_LET: 'Fully let',
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

  /** Index into `photos`, or null when closed. */
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [modal, setModal] = useState<'VIEWING' | 'ENQUIRY' | null>(null);

  /**
   * Photography. A rental is units inside a building, so when the listing has
   * no gallery of its own the development's imagery is the right fallback.
   * The hero leads and everything is deduped into one ordered set — the
   * lightbox pages through exactly what the mosaic shows.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const propertyMedia: string[] = (((raw as any)?.property?.media ?? []) as any[])
    .filter((m) => m?.url && m?.title !== '__logo__')
    .map((m) => m.url as string);
  const photos = [listing?.heroImageUrl, ...(listing?.galleryImages ?? []), ...propertyMedia]
    .filter((u, i, arr): u is string => !!u && arr.indexOf(u) === i);

  // Aggregates for the facts strip.
  const units = listing?.units ?? [];
  const totalAvailable = units.reduce((a, u) => a + (u.available ?? 0), 0);
  const totalUnits = units.reduce((a, u) => a + (u.total ?? 0), 0);
  const bedroomCounts = units.map((u) => u.bedrooms).sort((a, b) => a - b);
  const bedroomRange = bedroomCounts.length === 0
    ? '—'
    : bedroomCounts[0] === bedroomCounts[bedroomCounts.length - 1]
      ? (bedroomCounts[0] === 0 ? 'Studio' : `${bedroomCounts[0]} bed`)
      : `${bedroomCounts[0] === 0 ? 'Studio' : bedroomCounts[0]}–${bedroomCounts[bedroomCounts.length - 1]} bed`;

  const { data: floorPlans = [] } = useQuery({
    queryKey: ['floor-plans', listing?.propertySlug],
    queryFn: () => floorPlansApi.list(listing!.propertySlug),
    enabled: !!listing?.propertySlug,
  });

  const sections = [
    { id: 'overview', label: 'Overview' },
    ...(units.length ? [{ id: 'units', label: 'Units' }] : []),
    ...(floorPlans.length ? [{ id: 'floorplans', label: 'Floor plans' }] : []),
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const amenities: { id?: string; name: string; distance?: string }[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((raw as any)?.property?.amenities ?? []) as any[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const developer = (raw as any)?.developer as
    | { companyName: string; logoUrl?: string | null; establishedYear?: number | null; description?: string | null }
    | undefined;

  const stepLightbox = (by: number) => {
    if (lightbox === null || photos.length === 0) return;
    setLightbox((lightbox + by + photos.length) % photos.length);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-16 font-listing text-[16px]">
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
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          {/* ── Trail ── */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13.5px] text-[#6b6b70]">
            <Link href="/" aria-label="Home" className="transition-colors hover:text-[#111112]"><Home size={14} /></Link>
            <ChevronRight size={13} className="text-[#b9b9be]" />
            <Link href="/rent" className="transition-colors hover:text-[#111112]">Rent</Link>
            <ChevronRight size={13} className="text-[#b9b9be]" />
            <span className="text-[#6b6b70]">{listing.address.city}</span>
            <ChevronRight size={13} className="text-[#b9b9be]" />
            <span className="max-w-[40vw] truncate font-medium text-[#111112]">{listing.name}</span>
          </nav>

          {/* ── Masthead ──
              The name, where it is, and what it costs — before a single
              photo. A tenant should never have to hunt the sidebar to learn
              the rent. */}
          <header className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  'rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wide',
                  STATUS_STYLES[listing.status] ?? 'bg-gray-100 text-gray-500',
                )}>
                  {STATUS_LABELS[listing.status] ?? listing.status}
                </span>
                {listing.isFeatured && (
                  <span className="rounded-full bg-gold-400 px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-gray-900">
                    Featured
                  </span>
                )}
                {listing.showCinematicTour && (
                  <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] font-medium text-[#a8712f]">
                    <Film size={11} /> Cinematic
                  </span>
                )}
                {listing.show3DTour && (
                  <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] font-medium text-brand-600">
                    <Box size={11} /> 3D tour
                  </span>
                )}
              </div>

              <h1 className="mt-3 font-display text-[32px] font-light leading-[1.1] tracking-tight text-gray-900 sm:text-[42px]">
                {listing.name}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-[15px] font-medium text-gray-600">
                <MapPin size={15} className="shrink-0 text-gray-400" />
                {listing.address.neighborhood}, {listing.address.city}
                {listing.tagline && (
                  <span className="hidden font-normal text-gray-400 sm:inline">· {listing.tagline}</span>
                )}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">From</p>
              <p className="text-[30px] font-bold leading-tight text-gray-900 sm:text-[34px]">
                {formatPrice(listing.priceFrom, listing.currency)}
                <span className="text-[16px] font-normal text-gray-400">/mo</span>
              </p>
              {listing.priceTo > listing.priceFrom && (
                <p className="text-[13.5px] text-gray-500">
                  up to {formatPrice(listing.priceTo, listing.currency)}/mo
                </p>
              )}
            </div>
          </header>

          {/* ── Gallery ──
              Adaptive: with three or more photos it is the classic hero + two
              stack; with fewer, the hero takes the whole band. No mosaic cell
              is ever left as dead gray space. */}
          <div className={cn(
            'mt-5 grid h-[320px] gap-2 overflow-hidden rounded-3xl sm:h-[440px]',
            photos.length >= 3 ? 'sm:grid-cols-[2fr_1fr] sm:grid-rows-2' : photos.length === 2 ? 'sm:grid-cols-2' : '',
          )}>
            <button
              type="button"
              onClick={() => photos.length > 0 && setLightbox(0)}
              className={cn(
                'group relative h-full w-full cursor-pointer overflow-hidden',
                photos.length >= 3 && 'sm:row-span-2',
              )}
            >
              {photos[0] ? (
                <Image
                  src={photos[0]}
                  alt={listing.name}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width:1024px) 100vw, 66vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                  <Building2 size={40} strokeWidth={1.2} className="text-gray-400" />
                </div>
              )}
              {photos.length > 0 && (
                <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[13px] font-semibold text-gray-900 shadow-sm backdrop-blur-sm transition-colors group-hover:bg-white sm:bottom-5 sm:right-5">
                  <Images size={14} /> {photos.length} photo{photos.length === 1 ? '' : 's'}
                </span>
              )}
            </button>

            {photos.length >= 2 && (
              [1, 2].slice(0, photos.length >= 3 ? 2 : 1).map((i) => (
                photos[i] && (
                  <button
                    key={photos[i]}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className="group relative hidden cursor-pointer overflow-hidden sm:block"
                  >
                    <Image
                      src={photos[i]}
                      alt={`${listing.name} — photo ${i + 1}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      sizes="33vw"
                    />
                  </button>
                )
              ))
            )}
          </div>
        </div>

        <div className="mt-6">
          <UnitSectionNav sections={sections} />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* ── Left: one flat sheet, hairline-partitioned ── */}
            <div className="min-w-0">
              {/* Facts strip */}
              <section id="overview" className="scroll-mt-36">
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-4">
                  {[
                    { icon: BedDouble, label: 'Bedrooms', value: bedroomRange },
                    { icon: DoorOpen, label: 'Units free', value: `${totalAvailable} of ${totalUnits}` },
                    { icon: Sofa, label: 'Furnishing', value: FURNISHING_LABELS[listing.furnishing] ?? listing.furnishing },
                    { icon: CalendarClock, label: 'Min. lease', value: `${listing.minLeaseTerm} months` },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-3 bg-white px-5 py-4">
                      <f.icon size={19} strokeWidth={1.7} className="shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{f.label}</p>
                        <p className="truncate text-[15px] font-semibold text-gray-900">{f.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {listing.description && (
                  <p className="mt-7 max-w-3xl text-[15.5px] leading-relaxed text-gray-600">
                    {listing.description}
                  </p>
                )}

                {listing.tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {listing.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[12.5px] font-medium capitalize text-gray-600">
                        {tag.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Units ── */}
              {units.length > 0 && (
                <section id="units" className="mt-10 scroll-mt-36 border-t border-gray-200 pt-10">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-display text-[26px] font-light tracking-tight text-gray-900 sm:text-[30px]">
                      Choose your unit
                    </h2>
                    <p className="text-[13.5px] text-gray-500">
                      {totalAvailable} of {totalUnits} available
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    {listing.units.map((unit) => (
                      <UnitRow key={unit.id} unit={unit} propertySlug={listing.propertySlug} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Floor plans ── */}
              {floorPlans.length > 0 && (
                <section id="floorplans" className="mt-10 scroll-mt-36 border-t border-gray-200 pt-10">
                  <h2 className="font-display text-[26px] font-light tracking-tight text-gray-900 sm:text-[30px]">
                    Floor plans
                  </h2>
                  <p className="mt-1 text-[14px] text-gray-500">The layouts in this development.</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {floorPlans.map((fp) => (
                      <button
                        key={fp.id}
                        type="button"
                        onClick={() => {
                          const idx = photos.indexOf(fp.imageUrl);
                          // Plans open in the same lightbox; ones not in the
                          // photo set are shown standalone via a temp index.
                          if (idx >= 0) setLightbox(idx);
                          else window.open(fp.imageUrl, '_blank', 'noopener');
                        }}
                        className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all hover:border-gray-300 hover:shadow-sm cursor-pointer"
                      >
                        <div className="relative h-44 bg-[#fafafa]">
                          <Image src={fp.imageUrl} alt={fp.name} fill className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]" sizes="320px" unoptimized />
                        </div>
                        <div className="border-t border-gray-100 px-4 py-3">
                          <p className="truncate text-[14px] font-semibold text-gray-900">{fp.name}</p>
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
            </div>

            {/* ── Right: sticky action rail ── */}
            <div>
              <div className="sticky top-36 space-y-4">
                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(17,17,18,0.06)]">
                  <div className="border-b border-gray-100 p-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">Monthly rent</p>
                        <p className="mt-1 text-[26px] font-bold leading-tight text-gray-900">
                          {formatPrice(listing.priceFrom, listing.currency)}
                          {listing.priceTo > listing.priceFrom && (
                            <span className="text-[15px] font-normal text-gray-400"> – {formatPrice(listing.priceTo, listing.currency)}</span>
                          )}
                        </p>
                      </div>
                      <span className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
                        STATUS_STYLES[listing.status] ?? 'bg-gray-100 text-gray-500',
                      )}>
                        {totalAvailable} free
                      </span>
                    </div>

                    <dl className="mt-4 space-y-2 text-[13.5px]">
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-500">Furnishing</dt>
                        <dd className="font-medium text-gray-900">{FURNISHING_LABELS[listing.furnishing] ?? listing.furnishing}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-500">Minimum lease</dt>
                        <dd className="font-medium text-gray-900">{listing.minLeaseTerm} months</dd>
                      </div>
                      {listing.availableFrom && (
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Available from</dt>
                          <dd className="flex items-center gap-1.5 font-medium text-gray-900">
                            <Calendar size={12} className="text-gray-400" />
                            {new Date(listing.availableFrom).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="space-y-2 p-6">
                    <button
                      onClick={() => setModal('VIEWING')}
                      className="w-full cursor-pointer rounded-xl bg-gray-900 py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-gray-700"
                    >
                      Book a viewing
                    </button>
                    <button
                      onClick={() => setModal('ENQUIRY')}
                      className="w-full cursor-pointer rounded-xl border border-gray-200 py-3 text-[14px] font-medium text-gray-800 transition-colors hover:border-gray-400"
                    >
                      Send enquiry
                    </button>
                    <ChatWithDeveloper rentListingSlug={listing.slug} className="w-full" />
                    {listing.propertySlug && (
                      <Link
                        href={`/${listing.propertySlug}`}
                        className="flex w-full items-center justify-center gap-2 py-2 text-[13.5px] font-medium text-brand-600 transition-colors hover:text-brand-700"
                      >
                        <Building2 size={14} /> View the development <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Listed by */}
                {developer && (
                  <div className="rounded-3xl border border-gray-200 bg-white p-6">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">Listed by</p>
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                        {developer.logoUrl ? (
                          <Image src={developer.logoUrl} alt={developer.companyName} fill className="object-cover" sizes="44px" unoptimized />
                        ) : (
                          <Building2 size={18} className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14.5px] font-semibold text-gray-900">{developer.companyName}</p>
                        {developer.establishedYear && (
                          <p className="text-[12.5px] text-gray-400">Est. {developer.establishedYear}</p>
                        )}
                      </div>
                    </div>
                    {developer.description && (
                      <p className="mt-3 text-[12.5px] leading-relaxed text-gray-500 line-clamp-3">{developer.description}</p>
                    )}
                  </div>
                )}

                {/* Nearby */}
                {amenities.length > 0 && (
                  <div className="rounded-3xl border border-gray-200 bg-white p-6">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">What&apos;s nearby</p>
                    <ul className="space-y-2">
                      {amenities.map((a) => (
                        <li key={a.id ?? a.name} className="flex items-center gap-2.5 text-[13.5px] text-gray-700">
                          <CheckCircle2 size={13} className="shrink-0 text-[#188038]" />
                          <span className="min-w-0 flex-1 truncate">{a.name}</span>
                          {a.distance && (
                            <span className="shrink-0 text-[12px] tabular-nums text-gray-400">{a.distance}</span>
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

      {/* ── Lightbox with paging ── */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close image"
            className="absolute right-5 top-5 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={18} />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); stepLightbox(1); }}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ArrowRight size={18} />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-medium text-white">
                {lightbox + 1} / {photos.length}
              </span>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded host */}
          <img
            src={photos[lightbox]}
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
 * One unit type as a bookable row: identity and specs on the left, live
 * availability in the middle, the price and the reserve action on the right.
 */
function UnitRow({ unit, propertySlug }: { unit: RentUnit; propertySlug?: string }) {
  const soldOut = unit.available < 1;
  const pct = unit.total > 0 ? Math.round((unit.available / unit.total) * 100) : 0;

  return (
    <div className={cn(
      'rounded-2xl border bg-white p-5 transition-shadow sm:p-6',
      soldOut ? 'border-gray-200 opacity-70' : 'border-gray-200 hover:shadow-[0_6px_24px_rgba(17,17,18,0.06)]',
    )}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold text-gray-900">
            {unit.label}
            {unit.floor != null && (
              <span className="font-normal text-gray-400"> · {ordinalFloor(unit.floor)}</span>
            )}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] text-gray-600">
            <span className="flex items-center gap-1.5">
              <BedDouble size={14} className="text-gray-400" />
              {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}
            </span>
            {(unit as { bathrooms?: number }).bathrooms ? (
              <span className="flex items-center gap-1.5">
                <Bath size={14} className="text-gray-400" />
                {(unit as { bathrooms?: number }).bathrooms} bath
              </span>
            ) : null}
            {unit.sqm > 0 && (
              <span className="flex items-center gap-1.5">
                <Maximize2 size={14} className="text-gray-400" /> {unit.sqm} m²
              </span>
            )}
          </div>

          {/* Availability, as a number a tenant can trust plus a glanceable bar. */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn('h-full rounded-full', soldOut ? 'bg-gray-300' : pct <= 34 ? 'bg-[#b06000]' : 'bg-[#188038]')}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span className={cn('text-[12.5px] font-medium', soldOut ? 'text-gray-400' : 'text-gray-600')}>
              {soldOut ? 'Fully let' : `${unit.available} of ${unit.total} available`}
            </span>
          </div>

          {unit.features && unit.features.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {unit.features.map((f) => (
                <span key={f} className="rounded-full bg-gray-50 px-2.5 py-1 text-[11.5px] capitalize text-gray-500">
                  {f.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[22px] font-bold leading-tight text-gray-900">
            {formatPrice(unit.pricePerMonth, unit.currency)}
            <span className="text-[13px] font-normal text-gray-400">/mo</span>
          </p>
          <ReserveUnitButton unit={unit} propertySlug={propertySlug} />
        </div>
      </div>
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
    unit.showCinematicTour && { href: `/${propertySlug}/tour/cinematic`, label: 'Cinematic', icon: Film },
    unit.show3DTour && { href: `/${propertySlug}/tour/3d`, label: '3D', icon: Box },
    unit.showVRTour && { href: `/${propertySlug}/tour/vr`, label: 'VR', icon: Box },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Film }[];

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
    <div className="mt-3 flex flex-col items-end gap-2">
      {tours.length > 0 && propertySlug && (
        <div className="flex gap-1.5">
          {tours.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900"
            >
              <t.icon size={10} /> {t.label}
            </Link>
          ))}
        </div>
      )}
      {done ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3.5 py-2 text-[12.5px] font-semibold text-[#188038]">
          <CheckCircle2 size={13} /> Reserved
        </span>
      ) : (
        <button
          onClick={reserve}
          disabled={busy || soldOut}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Reserving…' : soldOut ? 'Fully let' : (<><KeyRound size={13} /> Reserve</>)}
        </button>
      )}
      {error && <span className="text-[11.5px] text-red-600">{error}</span>}
    </div>
  );
}
