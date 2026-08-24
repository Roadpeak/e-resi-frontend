'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Bath, BedDouble, Building2, CheckCircle2, Clock, Film,
  Loader2, MapPin, Maximize2, Play, X, XCircle, Ruler, Images,
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
  available: { label: 'Available', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700' },
  reserved: { label: 'Reserved', icon: Clock, cls: 'bg-amber-50 text-amber-700' },
  sold: { label: 'Sold', icon: XCircle, cls: 'bg-gray-100 text-gray-600' },
};

export default function UnitPage({ params }: { params: Promise<{ slug: string; unitId: string }> }) {
  const { slug, unitId } = use(params);
  const [activeImage, setActiveImage] = useState(0);
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

  // gallery: property photos (+ hero) — units inherit the development's imagery
  const images = [
    ...(unit.property.heroImageUrl ? [{ id: 'hero', url: unit.property.heroImageUrl, title: unit.property.name }] : []),
    ...(unit.property.media ?? [])
      .filter((m) => ['PHOTO', 'DRONE_PHOTO'].includes(m.type) && m.title !== '__logo__')
      .map((m) => ({ id: m.id, url: m.url, title: m.title ?? unit.property.name })),
  ];
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
    ...(unit.floorPlan ? [{ id: 'floorplan', label: 'Floor plan' }] : []),
    ...(scenes.length ? [{ id: 'tour', label: 'Tour' }] : []),
    ...(unit.features?.length ? [{ id: 'features', label: 'Features' }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <UnitTopbar
        propertySlug={unit.property.slug}
        propertyName={unit.property.name}
        developerName={unit.property.developer?.companyName}
        logoUrl={logoUrl}
      />

      {/* Gallery sits above the rail, full width — it is the first thing a
          buyer judges and the rail would otherwise push it below the fold. */}
      <div className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        {/* Height is set on the grid, not left to the tallest child: the two
            stacked stills are absolutely-positioned fills, so without it the
            row collapses and the whole mosaic renders as a sliver. */}
        <div className="grid h-[300px] gap-2 overflow-hidden rounded-3xl bg-gray-100 sm:h-[440px] sm:grid-cols-[2fr_1fr] sm:grid-rows-2">
          <button
            onClick={() => setActiveImage(0)}
            className="relative h-full w-full cursor-pointer sm:row-span-2"
          >
            {images.length > 0 ? (
              <Image
                src={images[activeImage]?.url ?? images[0].url}
                alt={`${unit.name} — ${unit.property.name}`}
                fill priority className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-gray-400">
                <Building2 size={40} strokeWidth={1.5} />
              </span>
            )}
          </button>

          {/* Two stacked stills, the way an agent lays out a listing. Hidden on
              a phone, where they would each be a thumbnail of a thumbnail. */}
          {[1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className="relative hidden cursor-pointer sm:block"
            >
              {images[i] ? (
                <Image src={images[i].url} alt={images[i].title ?? ''} fill className="object-cover" sizes="33vw" />
              ) : (
                <span className="absolute inset-0 bg-gray-100" />
              )}
              {i === 2 && images.length > 3 && (
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-gray-900 shadow-sm">
                  <Images size={13} /> {images.length} photos
                </span>
              )}
            </button>
          ))}
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'relative h-16 w-24 shrink-0 overflow-hidden rounded-xl transition-all cursor-pointer',
                  i === activeImage ? 'ring-2 ring-gray-900' : 'opacity-70 hover:opacity-100',
                )}
              >
                <Image src={img.url} alt={img.title ?? ''} fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <UnitSectionNav sections={sections} />
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ── Left: the unit ── */}
          <div className="min-w-0 space-y-4">
            {/* ── Overview ── */}
            <section id="overview" className="scroll-mt-32 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-gray-900">{unit.name}</h1>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold', status.cls)}>
                  <StatusIcon size={13} /> {status.label}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-base text-gray-600">
                <MapPin size={15} />
                {[unit.property.neighborhood, unit.property.city].filter(Boolean).join(', ')}
                {unit.floor != null && <span className="text-gray-400">· Floor {unit.floor}</span>}
              </p>

            {/* Key stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-6 sm:grid-cols-4">
              {[
                { icon: <BedDouble size={17} />, value: unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms}`, label: unit.bedrooms === 0 ? 'Layout' : 'Bedrooms' },
                { icon: <Bath size={17} />, value: `${unit.bathrooms}`, label: 'Bathrooms' },
                { icon: <Maximize2 size={17} />, value: unit.sqm ? `${unit.sqm}` : '—', label: 'Square metres' },
                { icon: <Building2 size={17} />, value: unit.floor != null ? `${unit.floor}` : '—', label: 'Floor' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-[#faf9f7] p-4">
                  <span className="text-gray-400">{s.icon}</span>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{s.value}</p>
                  <p className="text-[13px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            </section>

            {/* Cinematic tour of the unit */}
            {scenes.length > 0 && (
              <section id="tour" className="scroll-mt-32 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Cinematic</p>
                    <h2 className="mt-1 text-2xl font-semibold text-gray-900">Walk through this unit</h2>
                  </div>
                  {unit.property.hasCinematicTour && (
                    <Link
                      href={`/${unit.property.slug}/tour/cinematic`}
                      className="text-[15px] font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Full tour →
                    </Link>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {scenes.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => setPlaying(scene)}
                      className="group relative aspect-video overflow-hidden rounded-2xl bg-gray-900 text-left cursor-pointer"
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
              <section id="floorplan" className="scroll-mt-32 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-2xl font-semibold text-gray-900">Floor plan</h2>
                  <span className="text-[14px] text-gray-500">{unit.floorPlan.name}</span>
                </div>

                <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#faf9f7]">
                  <Image
                    src={unit.floorPlan.imageUrl}
                    alt={unit.floorPlan.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width:1024px) 100vw, 66vw"
                    unoptimized
                  />
                </div>

                {/* A drawing rarely states its own areas legibly at screen size. */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Bedrooms',
                      value: (unit.floorPlan.bedrooms ?? unit.bedrooms) === 0
                        ? 'Studio' : `${unit.floorPlan.bedrooms ?? unit.bedrooms}`,
                    },
                    { label: 'Bathrooms', value: `${unit.floorPlan.bathrooms ?? unit.bathrooms}` },
                    {
                      label: 'Floor area',
                      value: (unit.floorPlan.sqm ?? unit.sqm) ? `${unit.floorPlan.sqm ?? unit.sqm} m²` : '—',
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl bg-[#faf9f7] px-4 py-3 text-center">
                      <p className="text-lg font-semibold text-gray-900">{value}</p>
                      <p className="text-[12.5px] text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/${unit.property.slug}#floorplans`}
                  className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Ruler size={14} /> All layouts in this development →
                </Link>
              </section>
            )}

            {/* Features */}
            {unit.features?.length > 0 && (
              <section id="features" className="scroll-mt-32 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">What&apos;s included</h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {unit.features.map((f) => (
                    <span key={f} className="flex items-center gap-2 text-[15px] text-gray-700">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                      <span className="capitalize">{f.replace(/-/g, ' ')}</span>
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Right rail ── */}
          {/* ── Right: the actions ──
              Pinned below the section rail so the way to enquire is on screen
              at every point of the page, which is the whole reason Redfin's
              form sits here. Ours are actions rather than a form: the enquiry
              already lives on the property page and the chat is real-time. */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Price</p>
              <p className="text-3xl font-semibold text-gray-900">{formatPrice(unit.price, unitCurrency(unit, unit.property?.currency))}</p>

              <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-5 text-[15px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Development</span>
                  <span className="font-medium text-gray-900">{unit.property.name}</span>
                </div>
                {unit.property.developer?.companyName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Developer</span>
                    <span className="font-medium text-gray-900">{unit.property.developer.companyName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-gray-900">{status.label}</span>
                </div>
              </div>

              <Link
                href={`/${unit.property.slug}#booking`}
                className="mt-6 flex w-full items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-[15px] font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Book a viewing
              </Link>
              <ChatWithDeveloper propertySlug={unit.property.slug} className="mt-2" />

              {/* the requested link back to the parent property */}
              <Link
                href={`/${unit.property.slug}`}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-[15px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <Building2 size={16} /> View full property
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* Cinematic player */}
      {playing && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPlaying(null)}
        >
          <button
            onClick={() => setPlaying(null)}
            aria-label="Close video"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
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
