'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Maximize2, MapPinned, Heart, CalendarDays } from 'lucide-react';
import type { Property } from '../../lib/types';
import { formatPrice, getStatusLabel, getStatusColor, cn } from '../../lib/utils';
import { TourMark, type TourKind } from '../property/TourMarks';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useSavedProperties, useSaveProperty, useRemoveSavedProperty } from '../../lib/api/queries';

/**
 * A development presented as a full-width row: facts on the left, imagery on
 * the right.
 *
 * The previous card packed a hero, a thumbnail strip, a headline, a price, a
 * tagline and six chips into a third of the screen, so nothing in it had room
 * to read as important. This gives each development the width of the page: the
 * specification sits in a plain labelled table a buyer can scan down, and the
 * photography gets a panel large enough to be worth looking at.
 *
 * The images advance on their own, because most developments have several and
 * a static hero wastes them.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/** How long each image holds before the panel advances. */
const SLIDE_MS = 4200;

/** Each tour's own colour, matching the tours section on a property page. */
const TOUR_ACCENTS: Record<TourKind, string> = {
  cinematic: '#a8712f',
  '3d': '#1a73e8',
  vr: '#7c4dff',
};

/** Up to three gallery stills, distinct from the hero. */
function galleryStrip(property: Property, count = 3) {
  return property.galleryImages
    .filter((url) => url && url !== property.heroImageUrl)
    .slice(0, count);
}

const isNew = (property: Property) => {
  const created = new Date(property.createdAt).getTime();
  return !Number.isNaN(created) && Date.now() - created < 60 * 24 * 60 * 60 * 1000;
};

export function PropertyShowcaseCard({
  property,
  index = 0,
  onViewOnMap,
}: {
  property: Property;
  index?: number;
  /** Opens the map overlay focused on this development. */
  onViewOnMap?: () => void;
}) {
  // Every other row flips. Index-based rather than random so the rhythm is
  // stable while paging, and so a reshuffle does not reflow the whole page.
  const mirrored = index % 2 === 1;

  const strip = galleryStrip(property);
  // The hero leads, then whatever else the developer uploaded.
  const slides = [property.heroImageUrl, ...strip].filter(Boolean) as string[];

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: saved } = useSavedProperties();
  const savePropertyMutation = useSaveProperty();
  const removeSavedMutation = useRemoveSavedProperty();
  const isSaved = !!saved?.some((s) => s.property.id === property.id);

  /**
   * Advance only while the row is on screen and not being hovered.
   *
   * A page of nine rows all cycling in the background is a lot of decoding for
   * no benefit, and it fights a visitor who has stopped to look at one.
   */
  useEffect(() => {
    if (slides.length < 2) return;

    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !paused ? start() : stop()),
      { rootMargin: '100px' },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      stop();
    };
  }, [slides.length, paused]);

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    // Both mutations key off the slug, not the id.
    if (isSaved) removeSavedMutation.mutate(property.slug);
    else savePropertyMutation.mutate(property.slug);
  }

  const beds = property.units?.length
    ? Array.from(new Set(property.units.map((u) => u.bedrooms))).sort((a, b) => a - b)
    : [];
  const bedLabel = beds.length
    ? beds.length === 1
      ? beds[0] === 0 ? 'Studio' : `${beds[0]} bedroom`
      : `${beds[0] === 0 ? 'Studio' : beds[0]}–${beds[beds.length - 1]} bedroom`
    : null;

  /**
   * The list endpoint sends `_count.units`, not the unit rows — a card does
   * not need every unit — so a layout range is only available where units
   * happen to be loaded. Both paths are handled rather than leaving the card
   * with two rows and a gap where the rest of the table should be.
   */
  const unitCount = property.units?.length
    || (property as { _count?: { units?: number } })._count?.units
    || property.totalUnits
    || 0;

  const completion = property.completionDate
    ? new Date(property.completionDate).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : null;

  /**
   * The tagline is a developer's own one-line pitch, so it leads. The
   * description is the fallback for developments that never set one.
   */
  const blurb = property.tagline?.trim() || property.description?.trim() || null;

  const location = [property.address?.neighborhood, property.address?.city]
    .filter(Boolean)
    .join(', ');

  // Ordered cinematic → 3D → VR, matching the tours section on a development's
  // own page, so the same three features are always named in the same order.
  const tours: { kind: TourKind; label: string }[] = [
    ...(property.hasCinematicTour ? [{ kind: 'cinematic' as const, label: 'Cinematic' }] : []),
    ...(property.has3DTour ? [{ kind: '3d' as const, label: '3D' }] : []),
    ...(property.hasVRTour ? [{ kind: 'vr' as const, label: 'VR' }] : []),
  ];

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: Math.min(index, 6) * 0.07, ease: EASE }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        'group relative grid gap-4 overflow-hidden lg:gap-5',
        // Alternating sides, so a page of rows does not read as one repeated
        // template. Done with column widths and order rather than two separate
        // markup branches: the DOM order stays name-then-images, which is the
        // order a screen reader and the tab sequence should follow either way.
        mirrored
          ? 'lg:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)]'
          : 'lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]',
      )}
    >
      {/* Detail panel */}
      <div
        className={cn(
          'relative flex flex-col rounded-3xl bg-white p-6 shadow-sm shadow-gray-200/70 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-gray-200 sm:p-8',
          mirrored && 'lg:order-2',
        )}
      >
        <Link
          href={`/${property.slug}`}
          aria-label={property.name}
          className="absolute inset-0 z-[1] rounded-3xl"
        />

        <div className="relative z-[2] flex items-start justify-between gap-3 pointer-events-none">
          <div className="min-w-0">
            <h3 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.01em] text-gray-900 transition-colors group-hover:text-brand-600 sm:text-[32px]">
              {property.name}
            </h3>
            {location && (
              <p className="mt-2 flex items-center gap-1.5 text-[14px] text-gray-500">
                <MapPin size={14} className="shrink-0" />
                {location}
              </p>
            )}
          </div>

          {isAuthenticated && (
            <button
              onClick={toggleSave}
              aria-label={isSaved ? 'Remove from saved' : 'Save property'}
              className="pointer-events-auto relative z-[3] shrink-0 rounded-full border border-gray-200 bg-white p-2 text-gray-400 transition-colors hover:border-gray-300 hover:text-brand-600"
            >
              <Heart size={16} className={cn(isSaved && 'fill-brand-600 text-brand-600')} />
            </button>
          )}
        </div>

        {/* What the development actually is. Dropped when this card was
            rebuilt, which left a buyer nothing to read between the name and a
            table of figures. */}
        {blurb && (
          <p className="relative z-[2] mt-4 line-clamp-3 text-[14px] leading-relaxed text-gray-500 pointer-events-none">
            {blurb}
          </p>
        )}

        {/* The specification, as a table a buyer reads down rather than as
            chips scattered across the card. */}
        <dl className="relative z-[2] mt-5 pointer-events-none">
          <Row label="Price from" value={formatPrice(property.priceFrom, property.currency)} strong />
          {bedLabel && <Row label="Layouts" value={bedLabel} icon={<BedDouble size={13} />} />}
          {unitCount > 0 && (
            <Row label="Units" value={`${unitCount} in this release`} icon={<Maximize2 size={13} />} />
          )}
          {completion && (
            <Row label="Completion" value={completion} icon={<CalendarDays size={13} />} />
          )}
          <Row label="Status" value={getStatusLabel(property.status)} chip={getStatusColor(property.status)} />
          {tours.length > 0 && (
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3.5 last:border-b-0">
              <dt className="text-[14px] font-medium text-gray-500">Tours</dt>
              <dd className="flex items-center gap-4">
                {tours.map((t) => (
                  <span
                    key={t.kind}
                    className="flex items-center gap-2 text-[13px] font-medium"
                    style={{ color: TOUR_ACCENTS[t.kind] }}
                  >
                    {/* The drawn marks rather than a stock glyph — the same
                        ones a buyer meets on the development's own page.
                        Boxed to their own size: the marks draw slightly
                        outside their viewBox by design, which let them run
                        under the label beside them. */}
                    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
                      <TourMark kind={t.kind} size={20} />
                    </span>
                    {t.label}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <div className="relative z-[2] mt-auto flex flex-wrap gap-2.5 pt-7">
          <Link
            href={`/${property.slug}`}
            className="relative z-[3] flex-1 rounded-xl bg-brand-600 px-5 py-3 text-center text-[14px] font-semibold text-white transition-colors hover:bg-brand-700"
          >
            View development
          </Link>
          {onViewOnMap && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewOnMap();
              }}
              className="relative z-[3] flex items-center justify-center gap-1.5 rounded-xl border border-brand-600/25 px-5 py-3 text-[14px] font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              <MapPinned size={15} /> View on map
            </button>
          )}
        </div>
      </div>

      {/* Image panel */}
      <div className={cn('relative overflow-hidden rounded-3xl bg-gray-100', mirrored && 'lg:order-1')}>
        <Link href={`/${property.slug}`} aria-label={property.name} className="absolute inset-0 z-[2]" />

        <div className="relative h-[260px] w-full sm:h-[340px] lg:h-full lg:min-h-[420px]">
          {slides.length === 0 ? (
            <div className="absolute inset-0 bg-gray-100" />
          ) : (
            slides.map((url, i) => (
              <Image
                key={url + i}
                src={url}
                alt={i === 0 ? property.name : ''}
                fill
                priority={index < 2 && i === 0}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className={cn(
                  'object-cover transition-opacity duration-[1200ms] ease-out',
                  i === active ? 'opacity-100' : 'opacity-0',
                )}
              />
            ))
          )}

          {isNew(property) && (
            <span className="absolute left-4 top-4 z-[3] rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700 backdrop-blur-sm">
              New
            </span>
          )}

          {/* Slide markers, tappable so a visitor is not stuck waiting. */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-[3] flex -translate-x-1/2 gap-1.5">
              {slides.map((url, i) => (
                <button
                  key={`dot-${url}-${i}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActive(i);
                  }}
                  aria-label={`Image ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80',
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* The three-up strip: centred and sized rather than stretched across
            the full width, where three very wide, very short crops showed
            almost nothing of each photograph. A visible border separates them
            from whatever the image behind happens to be. */}
        {strip.length > 0 && (
          <div className="absolute inset-x-0 bottom-4 z-[3] hidden justify-center gap-2.5 lg:flex">
            {strip.map((url, i) => {
              const slideIndex = i + 1;
              return (
                <button
                  key={`thumb-${url}-${i}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActive(slideIndex);
                  }}
                  aria-label={`Show image ${slideIndex + 1}`}
                  className={cn(
                    'relative h-[68px] w-[92px] shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300',
                    slideIndex === active
                      ? 'border-white shadow-lg'
                      : 'border-white/45 hover:border-white/80',
                  )}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="92px" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.article>
  );
}

/** One labelled fact, on a hairline rule. */
function Row({
  label,
  value,
  icon,
  strong,
  chip,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  strong?: boolean;
  chip?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-3.5 last:border-b-0">
      <dt className="flex items-center gap-1.5 text-[14px] font-medium text-gray-500">
        {icon}
        {label}
      </dt>
      <dd
        className={cn(
          'text-right',
          strong ? 'text-[20px] font-semibold text-gray-900' : 'text-[14px] text-gray-700',
        )}
      >
        {chip ? (
          <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-semibold', chip)}>
            {value}
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
