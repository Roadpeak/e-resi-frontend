'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  MapPin, Heart, MapPinned, ChevronLeft, ChevronRight, Ruler, BadgeCheck, Building2,
} from 'lucide-react';
import type { Property } from '../../lib/types';
import { formatPrice, getStatusLabel, cn } from '../../lib/utils';
import { TourMark, type TourKind } from '../property/TourMarks';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useSavedProperties, useSaveProperty, useRemoveSavedProperty } from '../../lib/api/queries';

/**
 * A development as a listing row: photography left, everything else right.
 *
 * The arrangement is the one every property portal has converged on, and for
 * a reason — the photograph is what a buyer judges first, so it takes the
 * left third at a size worth looking at, and the facts stack beside it in a
 * fixed order so two rows can be compared by running the eye down the page.
 *
 * What sits in each slot is ours: our price presentation, our tour marks, our
 * developer, our save and map actions. The portal's card carries an estate
 * agent with Call and WhatsApp; we have no per-listing agent, so that row
 * holds the developer and the actions we can actually honour.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/** How long each image holds before the carousel advances. */
const SLIDE_MS = 4200;

/** Each tour's own colour, matching the tours section on a property page. */
const TOUR_ACCENTS: Record<TourKind, string> = {
  cinematic: '#a8712f',
  '3d': '#1a73e8',
  vr: '#7c4dff',
};

/** Up to four gallery stills, distinct from the hero. */
function slidesFor(property: Property) {
  return [
    property.heroImageUrl,
    ...property.galleryImages.filter((url) => url && url !== property.heroImageUrl).slice(0, 4),
  ].filter(Boolean);
}

const isNew = (property: Property) => {
  const created = new Date(property.createdAt).getTime();
  return !Number.isNaN(created) && Date.now() - created < 60 * 24 * 60 * 60 * 1000;
};

/** "Listed 5 days ago" — recency is what a buyer scans for first. */
function listedAgo(createdAt: string): string | null {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days < 1) return 'Listed today';
  if (days === 1) return 'Listed yesterday';
  if (days < 30) return `Listed ${days} days ago`;
  const months = Math.floor(days / 30);
  return `Listed ${months} month${months === 1 ? '' : 's'} ago`;
}

export function PropertyListCard({
  property,
  index = 0,
  onViewOnMap,
}: {
  property: Property;
  index?: number;
  /** Opens the map overlay focused on this development. */
  onViewOnMap?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);

  const slides = slidesFor(property);

  const { isAuthenticated } = useAuthStore();
  const { data: saved = [] } = useSavedProperties();
  const savePropertyMutation = useSaveProperty();
  const removeSavedMutation = useRemoveSavedProperty();
  const isSaved = !!saved?.some((s) => s.property.id === property.id);

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    // Both mutations key off the slug, not the id.
    if (isSaved) removeSavedMutation.mutate(property.slug);
    else savePropertyMutation.mutate(property.slug);
  }

  // Only advance while the row is on screen: a page of twenty rows all
  // animating off-screen is wasted work on a phone.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: '100px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused || !visible) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [slides.length, paused, visible]);

  const step = (by: number) => setActive((i) => (i + by + slides.length) % slides.length);

  /**
   * The list endpoint sends `_count.units` rather than the unit rows, so a
   * layout range is only available where units happen to be loaded. Both
   * paths are handled rather than leaving a gap in the row.
   */
  const unitCount = property.units?.length
    || (property as { _count?: { units?: number } })._count?.units
    || property.totalUnits
    || 0;

  const beds = property.units?.length
    ? Array.from(new Set(property.units.map((u) => u.bedrooms))).sort((a, b) => a - b)
    : [];
  const bedLabel = beds.length
    ? beds.length === 1
      ? beds[0] === 0 ? 'Studio' : `${beds[0]} bed`
      : `${beds[0] === 0 ? 'Studio' : beds[0]}–${beds[beds.length - 1]} bed`
    : null;

  const completion = property.completionDate
    ? new Date(property.completionDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  const location = [property.address?.neighborhood, property.address?.city]
    .filter(Boolean)
    .join(', ');

  const blurb = property.tagline?.trim() || property.description?.trim() || null;

  // Ordered cinematic → 3D → VR, matching a development's own page, so the
  // same three features are always named in the same order.
  const tours: { kind: TourKind; label: string }[] = [
    ...(property.hasCinematicTour ? [{ kind: 'cinematic' as const, label: 'Cinematic' }] : []),
    ...(property.has3DTour ? [{ kind: '3d' as const, label: '3D' }] : []),
    ...(property.hasVRTour ? [{ kind: 'vr' as const, label: 'VR' }] : []),
  ];

  const priceLabel = property.priceFrom
    ? formatPrice(property.priceFrom, property.currency)
    : 'Price on request';

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(index, 6) * 0.05 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group relative grid overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md sm:grid-cols-[minmax(0,38%)_minmax(0,1fr)]"
    >
      {/* The whole row is the link; the controls above it stop propagation. */}
      <Link
        href={`/${property.slug}`}
        aria-label={`View ${property.name}`}
        className="absolute inset-0 z-[1]"
      />

      {/* ── Photography ── */}
      <div className="relative h-[220px] bg-gray-100 sm:h-full sm:min-h-[240px]">
        {/* A development listed before its photography arrives still needs a
            panel the right shape — an empty one reads as a broken row. */}
        {slides.length === 0 && (
          <span className="absolute inset-0 flex items-center justify-center text-gray-300">
            <Building2 size={34} strokeWidth={1.5} />
          </span>
        )}
        {slides.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? property.name : `${property.name} — photo ${i + 1}`}
            fill
            // The first row's hero is the page's LCP element, so it must not
            // wait for lazy loading. `priority` already implies eager, so the
            // two must not both be set.
            priority={index === 0 && i === 0}
            className={cn(
              'object-cover transition-opacity duration-[1200ms]',
              i === active ? 'opacity-100' : 'opacity-0',
            )}
            sizes="(max-width: 640px) 100vw, 40vw"
          />
        ))}

        {/* Badges, top-left — what is true of this listing, in one column. */}
        <div className="absolute left-3 top-3 z-[2] flex flex-col items-start gap-1.5">
          {property.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-900/85 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
              <BadgeCheck size={11} /> Featured
            </span>
          )}
          {isNew(property) && (
            <span className="rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-900 backdrop-blur-sm">
              New
            </span>
          )}
        </div>

        {isAuthenticated && (
          <button
            onClick={toggleSave}
            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
            className="absolute right-3 top-3 z-[2] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <Heart size={15} className={cn(isSaved ? 'fill-brand-600 text-brand-600' : 'text-gray-500')} />
          </button>
        )}

        {slides.length > 1 && (
          <>
            {/* Arrows appear on hover, so the photography is unobstructed
                until someone reaches for it. */}
            {([['prev', -1, ChevronLeft], ['next', 1, ChevronRight]] as const).map(([key, by, Icon]) => (
              <button
                key={key}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); step(by); }}
                aria-label={key === 'prev' ? 'Previous photo' : 'Next photo'}
                className={cn(
                  'absolute top-1/2 z-[2] flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/85 text-gray-800 opacity-0 backdrop-blur-sm transition-opacity hover:bg-white group-hover:opacity-100',
                  key === 'prev' ? 'left-2' : 'right-2',
                )}
              >
                <Icon size={16} />
              </button>
            ))}

            <div className="absolute bottom-3 left-1/2 z-[2] flex -translate-x-1/2 gap-1">
              {slides.map((s, i) => (
                <button
                  key={s}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActive(i); }}
                  aria-label={`Photo ${i + 1}`}
                  className={cn(
                    'h-1.5 cursor-pointer rounded-full transition-all',
                    i === active ? 'w-4 bg-white' : 'w-1.5 bg-white/60',
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Floor plans are what a buyer asks for next, so the row says when
            they exist rather than making them open the page to find out. */}
        {property.floorPlans?.length > 0 && (
          <span className="absolute bottom-3 right-3 z-[2] inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-700 backdrop-blur-sm">
            <Ruler size={11} /> Floor plan
          </span>
        )}
      </div>

      {/* ── Details ── */}
      <div className="flex min-w-0 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12.5px] text-gray-500">{listedAgo(property.createdAt)}</p>
          <span className="shrink-0 text-[12px] font-medium uppercase tracking-wide text-gray-400">
            {getStatusLabel(property.status)}
          </span>
        </div>

        <p className="mt-1 text-[22px] font-bold leading-[1.2] text-gray-900">{priceLabel}</p>

        <h3 className="mt-1 truncate text-[16px] font-semibold text-gray-900">{property.name}</h3>
        {blurb && <p className="mt-0.5 line-clamp-1 text-[14px] text-gray-500">{blurb}</p>}

        {/* Spec strip — the facts a buyer compares between rows, in one line. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-gray-700">
          {bedLabel && <span>{bedLabel}</span>}
          {bedLabel && <span className="text-gray-300">|</span>}
          {unitCount > 0 && <span>{unitCount} units</span>}
          {unitCount > 0 && <span className="text-gray-300">|</span>}
          <span className="capitalize">{property.category.toLowerCase()}</span>
          {completion && <span className="text-gray-300">|</span>}
          {completion && <span>Ready {completion}</span>}
        </div>

        <p className="mt-2 flex items-center gap-1.5 truncate text-[13.5px] text-gray-500">
          <MapPin size={13} className="shrink-0" /> {location}
        </p>

        {/* ── Bottom row ──
            The portal puts an estate agent and their Call and WhatsApp
            buttons here. We have no per-listing agent, so the same slot
            carries the developer and the two actions we can honour. */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {property.developer?.logoUrl ? (
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gray-100">
                <Image src={property.developer.logoUrl} alt="" fill className="object-cover" sizes="28px" unoptimized />
              </span>
            ) : null}
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-gray-900">
                {property.developer?.name || 'e-resi'}
              </span>
              {tours.length > 0 && (
                <span className="mt-0.5 flex items-center gap-2">
                  {tours.map((t) => (
                    <span key={t.kind} className="flex items-center gap-1 text-[11.5px] text-gray-500">
                      <span style={{ color: TOUR_ACCENTS[t.kind] }}>
                        <TourMark kind={t.kind} size={13} />
                      </span>
                      {t.label}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </div>

          <div className="relative z-[2] flex shrink-0 gap-2">
            {onViewOnMap && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewOnMap(); }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:border-gray-900"
              >
                <MapPinned size={14} /> Map
              </button>
            )}
            <Link
              href={`/${property.slug}`}
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
