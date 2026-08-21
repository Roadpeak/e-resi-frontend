'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { TourMark, type TourKind } from './TourMarks';
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
  kind: TourKind;
  /** Two lines: the label a buyer scans, and what it actually is. */
  label: string;
  kicker: string;
  note: string;
  href: (slug: string) => string;
  /** Own accent, so the three read as distinct offerings. */
  accent: string;
}

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
  className,
}: {
  propertySlug: string;
  propertyName?: string;
  has3D?: boolean;
  hasVR?: boolean;
  hasCinematic?: boolean;
  backdropUrl?: string | null;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);


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

  if (available.length === 0) return null;

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

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          // Animated on mount, not on scroll. An anchor jump to #tours puts
          // this past the viewport before whileInView can observe it, and the
          // whole section then sits invisible on a black ground — which is
          // precisely what it did.
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="max-w-2xl"
        >
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
        </motion.div>

        <div
          className={cn(
            'mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:mt-16',
            available.length === 3 && 'lg:grid-cols-3',
            available.length === 2 && 'sm:grid-cols-2',
          )}
        >
          {available.map((kind, i) => (
            <TourPanel
              key={kind}
              def={TOURS[kind]}
              slug={propertySlug}
              index={i}
              solo={available.length === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TourPanel({
  def,
  slug,
  index,
  solo,
}: {
  def: TourDef;
  slug: string;
  index: number;
  solo: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: index * 0.12, ease: EASE }}
      className="relative bg-[#0b0d11]"
    >
      <Link
        href={def.href(slug)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className={cn(
          'group relative flex h-full flex-col justify-between gap-10 p-9 outline-none sm:p-11',
          // A single tour in a full-width panel would strand its content in
          // the left third of a very wide, very empty box.
          solo ? 'min-h-[280px] sm:flex-row sm:items-center sm:gap-14 sm:p-14' : 'min-h-[380px]',
        )}
      >
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
                whole point of drawing them. */}
            <TourMark kind={def.kind} size={84} />
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
            Open tour
            <ArrowRight
              size={15}
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
