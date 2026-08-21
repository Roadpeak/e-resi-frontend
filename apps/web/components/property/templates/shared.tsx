'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Property } from '../../../lib/types';
import { formatPrice } from '../../../lib/utils';
import { playbackVideoUrl } from '../../../lib/media/video';

/**
 * Pieces every template hero is built from.
 *
 * Kept here rather than duplicated per template so that a fix to the hero
 * media — a video codec fallback, a priority-loading tweak — lands in all
 * eight at once. Templates compose these; they do not reimplement them.
 */

/** Hero photograph or looping video, filling whatever box it is given. */
export function HeroMedia({
  property,
  priority = true,
  className,
}: {
  property: Property;
  priority?: boolean;
  className?: string;
}) {
  if (property.heroVideoUrl) {
    return (
      <video
        src={playbackVideoUrl(property.heroVideoUrl)}
        poster={property.heroImageUrl || undefined}
        autoPlay
        muted
        loop
        playsInline
        className={className ?? 'absolute inset-0 h-full w-full object-cover'}
      />
    );
  }
  if (property.heroImageUrl) {
    return (
      <Image
        src={property.heroImageUrl}
        alt={property.name}
        fill
        priority={priority}
        sizes="100vw"
        className={className ?? 'object-cover'}
      />
    );
  }
  return <div className="absolute inset-0 bg-neutral-200" />;
}

/**
 * The figures a buyer scans for.
 *
 * Derived from the property rather than authored, so a template never shows a
 * number the development does not actually have — an entry with no value is
 * dropped rather than rendered blank.
 */
export function heroFacts(property: Property): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];

  if (property.priceFrom) {
    facts.push({ label: 'From', value: formatPrice(property.priceFrom, property.currency) });
  }
  if (property.availableUnits > 0) {
    facts.push({ label: 'Available', value: `${property.availableUnits} units` });
  }
  if (property.completionDate) {
    const d = new Date(property.completionDate);
    if (!Number.isNaN(d.getTime())) {
      facts.push({
        label: 'Completion',
        value: d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }),
      });
    }
  }
  if (property.address?.neighborhood || property.address?.city) {
    facts.push({
      label: 'Location',
      value: [property.address.neighborhood, property.address.city].filter(Boolean).join(', '),
    });
  }
  return facts;
}

/** The tours a development actually has, for hero badges. */
export function tourBadges(property: Property): string[] {
  const out: string[] = [];
  if (property.hasCinematicTour) out.push('Cinematic tour');
  if (property.has3DTour) out.push('3D walkthrough');
  if (property.hasVRTour) out.push('VR tour');
  return out;
}

/**
 * Fade-and-rise on entry, once.
 *
 * `once` matters: a scroll-driven replay on every pass is the kind of motion
 * that reads as cheap on a page someone is using to decide on a purchase.
 * Respects prefers-reduced-motion via the caller's transition.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // amount: 0 — fire as soon as any part of the block is visible.
  //
  // A threshold plus a negative margin meant a block that was already on
  // screen when it mounted could never satisfy the trigger, leaving it at
  // opacity 0 permanently. Whole sections were rendering blank that way.
  const inView = useInView(ref, { once: true, amount: 0 });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Words rising into place, staggered.
 *
 * Used for template headlines. Splits on whitespace and animates each word
 * rising a fraction of its own size while fading in, so a long name staggers
 * into place without any box that could clip it.
 */
export function RisingWords({
  text,
  className,
  wordClassName,
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className={className}>
      {words.map((word, i) => (
        // No per-word clipping mask.
        //
        // The mask version wrapped each word in an overflow-hidden box sized to
        // the line box, which at display sizes is shorter than the glyphs it
        // contains — it sheared the tops off, reducing an 82px headline to
        // slivers. Padding the mask only traded that for a clipped descender:
        // any box tight enough to hide the word before it rises is also tight
        // enough to cut it.
        //
        // Rising with a fade reads the same at a glance and cannot clip,
        // because nothing is ever hidden by a box.
        <motion.span
          key={`${word}-${i}`}
          className={`inline-block ${wordClassName ?? ''}`}
          initial={{ y: '0.35em', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.85, delay: delay + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
          {/*
            A literal trailing space is collapsed away inside an inline-block,
            which ran the words of a two-word name together in the display
            headlines. A non-breaking space survives, and is placed inside the
            animated span so word spacing still wraps correctly.
          */}
          {i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Parallax offset for a hero layer, driven by scroll.
 *
 * Deliberately plain rAF rather than a ScrollTrigger: the mini-site does not
 * load GSAP globally, and a pinned hero here would fight the page's own
 * scrolling on a route buyers reach from a shared link on a phone.
 */
export function useParallax(strength = 0.25): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setOffset(window.scrollY * strength));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [strength]);

  return offset;
}

/** Small caps label used above template section headings. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${className ?? ''}`}
      style={{ color: 'var(--brand)' }}
    >
      {children}
    </p>
  );
}
