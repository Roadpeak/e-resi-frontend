'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Navigation } from 'lucide-react';
import { TourMark, type TourKind } from './TourMarks';
import { PropertyMediaLightbox, type LightboxTab } from './PropertyMediaLightbox';
import { cn } from '../../lib/utils';

/**
 * The immersive tours, given the room they are worth.
 *
 * These are the reason the platform exists and the single most expensive thing
 * a developer buys from us — a film crew, a scanning rig, a modelled building.
 * They were being presented as three small bordered cards inside the overview,
 * the same visual weight as a filter chip, which a buyer scrolls straight past.
 *
 * This is a full-bleed section on a dark ground instead: one panel per tour,
 * expanding on hover, with the mark drawn large. Dark deliberately — every
 * other section of a mini-site sits on the developer's own light ground, so
 * the tours read as a break in the page and as something apart from the
 * brochure around them.
 *
 * It must hold up with no media at all. Most developments have a hero image
 * and nothing else — no gallery, no scenes — so the design rests on type,
 * ground and the animated marks, and treats imagery as an enhancement.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

interface TourDef {
  /** Undefined for Street view, which draws a lucide icon rather than a mark. */
  kind?: TourKind;
  /** Two lines: the label a buyer scans, and what it actually is. */
  label: string;
  kicker: string;
  note: string;
  /** Tours navigate; Street view opens an overlay instead, and omits this. */
  href?: (slug: string) => string;
  /** Own accent, so the panels read as distinct offerings. */
  accent: string;
}

/**
 * Street view, as a fourth panel.
 *
 * Not a tour we produced — it is Google's imagery of the road outside — so it
 * takes a plain icon rather than one of the drawn marks, and a cooler,
 * quieter accent than the three we sell. It earns its place here because a
 * buyer asking "what is it like there" wants it alongside the tours, not
 * hidden behind a pill above the photographs.
 */
const STREET_VIEW: TourDef = {
  label: 'Street view',
  kicker: 'Look around',
  note: 'See the road outside and the streets around the development, at ground level.',
  accent: '#6ba3a0',
};

const TOURS: Record<TourKind, TourDef> = {
  cinematic: {
    kind: 'cinematic',
    label: 'Cinematic tour',
    kicker: 'Watch',
    note: 'A film of the development, shot on site and cut to play as you scroll.',
    href: (slug) => `/${slug}/tour/cinematic`,
    accent: '#c08a3e',
  },
  '3d': {
    kind: '3d',
    label: '3D walkthrough',
    kicker: 'Explore',
    note: 'Move through the building room by room, at your own pace, on any device.',
    href: (slug) => `/${slug}/tour/3d`,
    accent: '#4a90e2',
  },
  vr: {
    kind: 'vr',
    label: 'Virtual reality',
    kicker: 'Step inside',
    note: 'Stand in a finished unit at full scale, before a brick has been laid.',
    href: (slug) => `/${slug}/tour/vr`,
    accent: '#8b6dd8',
  },
};

export function PropertyTours({
  propertySlug,
  propertyName,
  has3D,
  hasVR,
  hasCinematic,
  /** A still to sit behind the panels, when the development has one. */
  backdropUrl,
  /** Coordinates and area photography, for the Street view panel. */
  photos = [],
  areaPhotos = [],
  latitude,
  longitude,
  address,
  className,
}: {
  propertySlug: string;
  propertyName?: string;
  has3D?: boolean;
  hasVR?: boolean;
  hasCinematic?: boolean;
  backdropUrl?: string | null;
  photos?: string[];
  areaPhotos?: { id: string; url: string; title?: string | null }[];
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  /** Which lightbox tab the Street view panel opened, if any. */
  const [overlay, setOverlay] = useState<LightboxTab | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  // A slow drift on the backdrop. Enough to feel alive under the panels,
  // small enough never to compete with them.
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  const available: TourKind[] = [
    ...(hasCinematic ? (['cinematic'] as const) : []),
    ...(has3D ? (['3d'] as const) : []),
    ...(hasVR ? (['vr'] as const) : []),
  ];

  /**
   * Street view belongs here rather than beside the gallery heading.
   *
   * It answers the same question the three tours do — what is it actually like
   * to be there — so burying it as a small pill above the photographs
   * undersold it. The difference is only in mechanism: the tours navigate to
   * their own routes, this opens the media overlay in place.
   */
  const hasStreet = typeof latitude === 'number' && typeof longitude === 'number';

  // Nothing to show at all.
  if (available.length === 0 && !hasStreet) return null;

  const panelCount = available.length + (hasStreet ? 1 : 0);

  return (
    <section
      ref={ref}
      id="tours"
      // Spans the viewport because the page renders it outside its centred
      // container (see FULL_BLEED there) — this section is a break in the
      // page, and a centred column would make it just another card.
      className={cn('relative scroll-mt-24 overflow-hidden bg-[#0b0d11]', className)}
    >
      {backdropUrl && (
        <motion.div style={{ y }} className="absolute inset-0 -z-0 scale-110">
          <Image
            src={backdropUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.16]"
            aria-hidden="true"
          />
        </motion.div>
      )}
      {/* Sits over the image so text keeps its contrast whatever was uploaded. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#0b0d11] via-[#0b0d11]/80 to-[#0b0d11]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-24">
        {/* Not animated in, for the same reason as the panels below: a mount
            animation on a lazily-mounted section can stall part-way and leave
            this heading invisible on black. */}
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
            <span className="h-px w-8 bg-white/25" />
            Immersive tours
          </p>
          <h2 className="mt-6 text-[34px] font-light leading-[1.08] tracking-[-0.02em] text-white sm:text-[52px]">
            See it before it exists.
          </h2>
          <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-white/55 sm:text-[17px]">
            {propertyName ? `${propertyName} has ` : 'This development has '}
            been captured in full, so you can walk it, watch it and stand inside
            it — without leaving where you are.
          </p>
        </div>

        <div
          className={cn(
            'mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:mt-16',
            panelCount === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
            panelCount === 3 && 'lg:grid-cols-3',
            panelCount === 2 && 'sm:grid-cols-2',
          )}
        >
          {available.map((kind, i) => (
            <TourPanel
              key={kind}
              def={TOURS[kind]}
              slug={propertySlug}
              index={i}
              solo={panelCount === 1}
            />
          ))}

          {hasStreet && (
            <TourPanel
              def={STREET_VIEW}
              index={available.length}
              solo={panelCount === 1}
              onClick={() => setOverlay('street')}
            />
          )}
        </div>
      </div>

      {/* The overlay the Street view panel opens. Rendered once here rather
          than per panel so only one can ever be mounted. */}
      <PropertyMediaLightbox
        open={overlay !== null}
        onClose={() => setOverlay(null)}
        initialTab={overlay ?? 'street'}
        propertyName={propertyName ?? ''}
        photos={photos.map((url, i) => ({ id: `${i}`, url }))}
        areaPhotos={areaPhotos}
        latitude={latitude}
        longitude={longitude}
        address={address}
      />
    </section>
  );
}

function TourPanel({
  def,
  slug,
  index,
  solo,
  onClick,
}: {
  def: TourDef;
  slug?: string;
  index: number;
  solo: boolean;
  /** Supplied instead of a href when the panel opens an overlay in place. */
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  // A panel either navigates or acts. Rendering the acting one as a <button>
  // rather than an anchor with a click handler keeps it keyboard-operable and
  // announced correctly.
  const interactive = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
    className: cn(
      'group relative flex h-full w-full flex-col justify-between gap-10 p-9 text-left outline-none sm:p-11',
      // A single tour in a full-width panel would strand its content in
      // the left third of a very wide, very empty box.
      // 380px was taller than the content ever needs, so every panel
      // carried ~120px of empty ground beneath its link.
      solo ? 'min-h-[260px] sm:flex-row sm:items-center sm:gap-14 sm:p-14' : 'min-h-[300px]',
    ),
  };

  const body = (
    <>
        {/* The tour's own colour, kept to a wash that lifts on approach rather
            than three saturated panels competing on one dark ground. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{
            background: `radial-gradient(120% 100% at 50% 0%, ${def.accent}22, transparent 70%)`,
          }}
        />
        {/* Focus ring, since the whole panel is the target. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 ring-1 ring-inset transition-opacity group-focus-visible:opacity-100"
          style={{ color: def.accent }}
        />

        <div className="relative">
          <motion.div
            animate={{ scale: hovered ? 1.06 : 1, y: hovered ? -4 : 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{ color: def.accent }}
            className="origin-left"
          >
            {/* Large enough to read as an object rather than an icon — the
                whole point of drawing them. Street view has no drawn mark, so
                it takes a plain glyph at a size that still reads as an object. */}
            {def.kind ? (
              <TourMark kind={def.kind} size={84} />
            ) : (
              <Navigation size={64} strokeWidth={1.1} />
            )}
          </motion.div>
        </div>

        <div className="relative">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.22em]"
            style={{ color: def.accent }}
          >
            {def.kicker}
          </p>
          <h3 className="mt-3 text-[24px] font-light leading-tight tracking-[-0.01em] text-white sm:text-[27px]">
            {def.label}
          </h3>
          <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-white/50">
            {def.note}
          </p>

          <span className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-white/70 transition-colors group-hover:text-white">
            {def.href ? 'Open tour' : 'Look around'}
            <ArrowRight
              size={15}
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </span>
        </div>
    </>
  );

  // Not animated in.
  //
  // These panels sit in a lazily-mounted, full-bleed section, and a mount
  // animation with a per-panel delay stalls part-way whenever that mount
  // happens mid-scroll — leaving tours frozen at opacity 0 on a black ground,
  // which is indistinguishable from them not existing. The same failure the
  // unit typology had. The tours are the most expensive thing a developer buys
  // from us; they render.
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative bg-[#0b0d11]"
    >
      {def.href && slug ? (
        <Link href={def.href(slug)} {...interactive}>
          {body}
        </Link>
      ) : (
        <button type="button" onClick={onClick} {...interactive}>
          {body}
        </button>
      )}
    </motion.div>
  );
}
