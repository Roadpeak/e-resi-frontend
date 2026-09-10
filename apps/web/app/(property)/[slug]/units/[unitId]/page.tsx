'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, Bath, BedDouble, Building2, CheckCircle2, ChevronRight,
  Clock, Film, Loader2, MapPin, Maximize2, Play, X, XCircle, Ruler, Images,
} from 'lucide-react';
import { UnitTopbar } from '../../../../../components/property/UnitTopbar';
import { UnitSectionNav } from '../../../../../components/property/UnitSectionNav';
import { ChatWithDeveloper } from '../../../../../components/chat/ChatWithDeveloper';
import { apiClient } from '../../../../../lib/api/client';
import { formatPrice, cn } from '../../../../../lib/utils';
import { unitCurrency } from '../../../../../lib/units/unit-types';
import { track } from '../../../../../lib/analytics/track';

interface CinematicScene {
  id: string;
  label: string;
  sublabel?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
}

interface UnitDetail {
  id: string;
  name: string;
  floor?: number | null;
  bedrooms: number;
  bathrooms: number;
  sqm?: number | null;
  price: number;
  currency: string;
  status: string;
  features: string[];
  floorPlan?: {
    id: string; name: string; imageUrl: string;
    bedrooms?: number | null; bathrooms?: number | null;
    sqm?: number | null; sqft?: number | null;
  } | null;
  property: {
    id: string; slug: string; name: string; tagline?: string | null;
    /** The development's currency — what the developer actually chose. */
    currency?: string | null;
    city?: string | null; neighborhood?: string | null; heroImageUrl?: string | null;
    hasCinematicTour: boolean;
    developer?: { companyName?: string | null } | null;
    media: { id: string; url: string; title?: string | null; type: string }[];
    cinematicScenes: CinematicScene[];
  };
}

const STATUS = {
  available: { label: 'Available', icon: CheckCircle2, cls: 'bg-[#e6f4ea] text-[#188038]' },
  reserved: { label: 'Reserved', icon: Clock, cls: 'bg-[#fef7e0] text-[#b06000]' },
  sold: { label: 'Sold', icon: XCircle, cls: 'bg-gray-100 text-gray-500' },
};

/** 10 -> "10th floor"; 0 -> "ground floor". */
function ordinalFloor(n: number): string {
  if (n === 0) return 'Ground floor';
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

export default function UnitPage({ params }: { params: Promise<{ slug: string; unitId: string }> }) {
  const { slug, unitId } = use(params);
  /** Index into `images`, or null when closed. */
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [playing, setPlaying] = useState<CinematicScene | null>(null);

  const { data: unit, isLoading, isError } = useQuery({
    queryKey: ['unit', slug, unitId],
    queryFn: () => apiClient.get<UnitDetail>(`/properties/${slug}/units/${unitId}`),
  });

  // Which units draw attention is the most actionable thing a developer gets
  // from this page — it tells their sales team what to lead with. Declared
  // before the early returns below so hook order stays stable across renders.
  useEffect(() => {
    if (!unit?.property?.id) return;
    track({
      type: 'UNIT_VIEWED',
      propertyId: unit.property.id,
      metadata: { unitId: unit.id, unitName: unit.name },
    });
  }, [unit?.property?.id, unit?.id, unit?.name]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* No name to show yet, and a slug rendered as a title reads worse
            than an empty bar for the moment it is on screen. */}
        <div className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/[0.07] bg-white/95" />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (isError || !unit) {
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/[0.07] bg-white/95" />
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <p className="text-lg text-gray-600">This unit could not be found.</p>
          <Link href={`/${slug}`} className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand-600 hover:text-brand-700">
            <ArrowLeft size={15} /> Back to the property
          </Link>
        </div>
      </div>
    );
  }

  const statusKey = unit.status?.toLowerCase() as keyof typeof STATUS;
  const status = STATUS[statusKey] ?? STATUS.available;
  const StatusIcon = status.icon;

  // gallery: property photos (+ hero) — units inherit the development's imagery.
  // Deduped ignoring the query string: the hero is often the same shot as a
  // gallery photo served at a different width, and counting it twice makes
  // the "n photos" chip lie.
  const bareUrl = (u: string) => u.split('?')[0];
  const images = [
    ...(unit.property.heroImageUrl ? [{ id: 'hero', url: unit.property.heroImageUrl, title: unit.property.name }] : []),
    ...(unit.property.media ?? [])
      .filter((m) => ['PHOTO', 'DRONE_PHOTO'].includes(m.type) && m.title !== '__logo__')
      .map((m) => ({ id: m.id, url: m.url, title: m.title ?? unit.property.name })),
  ].filter((img, i, arr) => arr.findIndex((o) => bareUrl(o.url) === bareUrl(img.url)) === i);
  const scenes = unit.property.cinematicScenes ?? [];
  // The developer's logo is stored as a media row under a sentinel title,
  // which is also why it is excluded from the gallery above.
  const logoUrl = (unit.property.media ?? []).find((m) => m.title === '__logo__')?.url;

  /**
   * The rail, built from what this unit actually has.
   *
   * Listing a section that is not on the page is worse than having no rail —
   * it scrolls nowhere and reads as a broken link.
   */
  const sections = [
    { id: 'overview', label: 'Overview' },
    ...(scenes.length ? [{ id: 'tour', label: 'Tour' }] : []),
    ...(unit.floorPlan ? [{ id: 'floorplan', label: 'Floor plan' }] : []),
    ...(unit.features?.length ? [{ id: 'features', label: 'Features' }] : []),
  ];

  const stepLightbox = (by: number) => {
    if (lightbox === null || images.length === 0) return;
    setLightbox((lightbox + by + images.length) % images.length);
  };

  const priceLabel = formatPrice(unit.price, unitCurrency(unit, unit.property?.currency));

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-16 font-listing text-[16px]">
      <UnitTopbar
        propertySlug={unit.property.slug}
        propertyName={unit.property.name}
        developerName={unit.property.developer?.companyName}
        logoUrl={logoUrl}
      />

      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        {/* ── Trail — within the development's mini-site, not our marketplace ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13.5px] text-[#6b6b70]">
          <Link href={`/${unit.property.slug}`} className="transition-colors hover:text-[#111112]">
            {unit.property.name}
          </Link>
          <ChevronRight size={13} className="text-[#b9b9be]" />
          <Link href={`/${unit.property.slug}#units`} className="transition-colors hover:text-[#111112]">
            Units
          </Link>
          <ChevronRight size={13} className="text-[#b9b9be]" />
          <span className="max-w-[40vw] truncate font-medium text-[#111112]">{unit.name}</span>
        </nav>

        {/* ── Masthead ──
            The unit, where it is, and what it costs — before a single photo.
            A buyer should never have to hunt the sidebar to learn the price. */}
        <header className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wide',
                status.cls,
              )}>
                <StatusIcon size={12} /> {status.label}
              </span>
              {unit.property.hasCinematicTour && scenes.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] font-medium text-[#a8712f]">
                  <Film size={11} /> Cinematic tour
                </span>
              )}
            </div>

            <h1 className="mt-3 font-display text-[32px] font-light leading-[1.1] tracking-tight text-gray-900 sm:text-[42px]">
              {unit.name}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[15px] font-medium text-gray-600">
              <MapPin size={15} className="shrink-0 text-gray-400" />
              {[unit.property.neighborhood, unit.property.city].filter(Boolean).join(', ')}
              <span className="font-normal text-gray-400">· {unit.property.name}</span>
              {unit.floor != null && (
                <span className="hidden font-normal text-gray-400 sm:inline">· {ordinalFloor(unit.floor)}</span>
              )}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">Price</p>
            <p className="text-[30px] font-bold leading-tight text-gray-900 sm:text-[34px]">
              {priceLabel}
            </p>
          </div>
        </header>

        {/* ── Gallery ──
            Adaptive: with three or more photos it is the classic hero + two
            stack; with fewer, the hero takes the whole band. No mosaic cell
            is ever left as dead gray space. */}
        <div className={cn(
          'mt-5 grid h-[320px] gap-2 overflow-hidden rounded-3xl sm:h-[440px]',
          images.length >= 3 ? 'sm:grid-cols-[2fr_1fr] sm:grid-rows-2' : images.length === 2 ? 'sm:grid-cols-2' : '',
        )}>
          <button
            type="button"
            onClick={() => images.length > 0 && setLightbox(0)}
            className={cn(
              'group relative h-full w-full cursor-pointer overflow-hidden',
              images.length >= 3 && 'sm:row-span-2',
            )}
          >
            {images[0] ? (
              <Image
                src={images[0].url}
                alt={`${unit.name} — ${unit.property.name}`}
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
            {images.length > 0 && (
              <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[13px] font-semibold text-gray-900 shadow-sm backdrop-blur-sm transition-colors group-hover:bg-white sm:bottom-5 sm:right-5">
                <Images size={14} /> {images.length} photo{images.length === 1 ? '' : 's'}
              </span>
            )}
          </button>

          {images.length >= 2 && (
            [1, 2].slice(0, images.length >= 3 ? 2 : 1).map((i) => (
              images[i] && (
                <button
                  key={images[i].id}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="group relative hidden cursor-pointer overflow-hidden sm:block"
                >
                  <Image
                    src={images[i].url}
                    alt={images[i].title ?? `${unit.name} — photo ${i + 1}`}
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

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ── Left: one flat sheet, hairline-partitioned ── */}
          <div className="min-w-0">
            {/* Facts strip */}
            <section id="overview" className="scroll-mt-36">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-4">
                {[
                  {
                    icon: BedDouble,
                    label: unit.bedrooms === 0 ? 'Layout' : 'Bedrooms',
                    value: unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms}`,
                  },
                  { icon: Bath, label: 'Bathrooms', value: `${unit.bathrooms}` },
                  { icon: Maximize2, label: 'Floor area', value: unit.sqm ? `${unit.sqm} m²` : '—' },
                  { icon: Building2, label: 'Floor', value: unit.floor != null ? ordinalFloor(unit.floor) : '—' },
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

              {unit.property.tagline && (
                <p className="mt-7 max-w-3xl text-[15.5px] leading-relaxed text-gray-600">
                  {unit.property.tagline}
                </p>
              )}
            </section>

            {/* ── Cinematic tour ── */}
            {scenes.length > 0 && (
              <section id="tour" className="mt-10 scroll-mt-36 border-t border-gray-200 pt-10">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-[26px] font-light tracking-tight text-gray-900 sm:text-[30px]">
                    Walk through this unit
                  </h2>
                  {unit.property.hasCinematicTour && (
                    <Link
                      href={`/${unit.property.slug}/tour/cinematic`}
                      className="shrink-0 text-[13.5px] font-semibold text-brand-600 transition-colors hover:text-brand-700"
                    >
                      Full tour →
                    </Link>
                  )}
                </div>
                <p className="mt-1 text-[14px] text-gray-500">Filmed inside the development.</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {scenes.map((scene) => (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => setPlaying(scene)}
                      className="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl bg-gray-900 text-left"
                    >
                      {scene.thumbnailUrl && (
                        <Image src={scene.thumbnailUrl} alt={scene.label} fill className="object-cover opacity-80 transition-opacity group-hover:opacity-60" sizes="(max-width:1024px) 50vw, 33vw" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-900 transition-transform group-hover:scale-110">
                          <Play size={18} className="ml-0.5" />
                        </span>
                      </span>
                      <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <span className="block text-sm font-semibold text-white">{scene.label}</span>
                        {scene.sublabel && <span className="block text-xs text-white/70">{scene.sublabel}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ── Floor plan ──
                This unit's layout only. Every layout in the development is on
                the property page, which is where someone comparing them looks. */}
            {unit.floorPlan && (
              <section id="floorplan" className="mt-10 scroll-mt-36 border-t border-gray-200 pt-10">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-[26px] font-light tracking-tight text-gray-900 sm:text-[30px]">
                    Floor plan
                  </h2>
                  <span className="text-[13.5px] text-gray-500">{unit.floorPlan.name}</span>
                </div>

                <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <Image
                    src={unit.floorPlan.imageUrl}
                    alt={unit.floorPlan.name}
                    fill
                    className="object-contain p-6"
                    sizes="(max-width:1024px) 100vw, 66vw"
                    unoptimized
                  />
                </div>

                {/* A drawing rarely states its own areas legibly at screen size. */}
                <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200">
                  {[
                    {
                      label: (unit.floorPlan.bedrooms ?? unit.bedrooms) === 0 ? 'Layout' : 'Bedrooms',
                      value: (unit.floorPlan.bedrooms ?? unit.bedrooms) === 0
                        ? 'Studio' : `${unit.floorPlan.bedrooms ?? unit.bedrooms}`,
                    },
                    { label: 'Bathrooms', value: `${unit.floorPlan.bathrooms ?? unit.bathrooms}` },
                    {
                      label: 'Floor area',
                      value: (unit.floorPlan.sqm ?? unit.sqm) ? `${unit.floorPlan.sqm ?? unit.sqm} m²` : '—',
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white px-4 py-3.5 text-center">
                      <p className="text-[16px] font-semibold text-gray-900">{value}</p>
                      <p className="mt-0.5 text-[12px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/${unit.property.slug}#floorplans`}
                  className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  <Ruler size={14} /> All layouts in this development →
                </Link>
              </section>
            )}

            {/* ── Features ── */}
            {unit.features?.length > 0 && (
              <section id="features" className="mt-10 scroll-mt-36 border-t border-gray-200 pt-10">
                <h2 className="font-display text-[26px] font-light tracking-tight text-gray-900 sm:text-[30px]">
                  What&apos;s included
                </h2>
                <div className="mt-5 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {unit.features.map((f) => (
                    <span key={f} className="flex items-center gap-2.5 text-[15px] text-gray-700">
                      <CheckCircle2 size={15} className="shrink-0 text-[#188038]" />
                      <span className="capitalize">{f.replace(/-/g, ' ')}</span>
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Right: sticky action rail ──
              Pinned below the section rail so the way to enquire is on screen
              at every point of the page. Ours are actions rather than a form:
              the enquiry lives on the property page and the chat is real-time. */}
          <div>
            <div className="sticky top-36 space-y-4">
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(17,17,18,0.06)]">
                <div className="border-b border-gray-100 p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">Price</p>
                      <p className="mt-1 text-[26px] font-bold leading-tight text-gray-900">{priceLabel}</p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold', status.cls)}>
                      {status.label}
                    </span>
                  </div>

                  <dl className="mt-4 space-y-2 text-[13.5px]">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-gray-500">Development</dt>
                      <dd className="truncate font-medium text-gray-900">{unit.property.name}</dd>
                    </div>
                    {unit.property.developer?.companyName && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-gray-500">Developer</dt>
                        <dd className="truncate font-medium text-gray-900">{unit.property.developer.companyName}</dd>
                      </div>
                    )}
                    {unit.floor != null && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-gray-500">Floor</dt>
                        <dd className="font-medium text-gray-900">{ordinalFloor(unit.floor)}</dd>
                      </div>
                    )}
                    {unit.sqm ? (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-gray-500">Floor area</dt>
                        <dd className="font-medium text-gray-900">{unit.sqm} m²</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                <div className="space-y-2 p-6">
                  {/* The developer's brand colour, when their mini-site sets one —
                      this page is theirs, not the marketplace's. */}
                  <Link
                    href={`/${unit.property.slug}#booking`}
                    className="flex w-full items-center justify-center rounded-xl py-3.5 text-[14.5px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--brand, #18191a)' }}
                  >
                    Book a viewing
                  </Link>
                  <ChatWithDeveloper propertySlug={unit.property.slug} className="w-full" />
                  <Link
                    href={`/${unit.property.slug}`}
                    className="flex w-full items-center justify-center gap-2 py-2 text-[13.5px] font-medium text-brand-600 transition-colors hover:text-brand-700"
                  >
                    <Building2 size={14} /> View the development <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Lightbox with paging ── */}
      {lightbox !== null && images[lightbox] && (
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
          {images.length > 1 && (
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
                {lightbox + 1} / {images.length}
              </span>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded host */}
          <img
            src={images[lightbox].url}
            alt={images[lightbox].title ?? ''}
            className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Cinematic player */}
      {playing && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPlaying(null)}
        >
          <button
            onClick={() => setPlaying(null)}
            aria-label="Close video"
            className="absolute right-5 top-5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <video
              src={playing.videoUrl}
              controls
              autoPlay
              playsInline
              className="w-full rounded-2xl bg-black"
            />
            <p className="mt-3 flex items-center gap-2 text-white">
              <Film size={16} /> <span className="font-semibold">{playing.label}</span>
              {playing.sublabel && <span className="text-white/60">· {playing.sublabel}</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
