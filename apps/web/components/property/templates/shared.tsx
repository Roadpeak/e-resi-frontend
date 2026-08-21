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
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Words rising into place, staggered.
 *
 * Used for template headlines. Splits on whitespace and animates per word,
 * each in its own overflow-hidden line so the words appear to rise out of the
 * page rather than fade in place.
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
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className={`inline-block ${wordClassName ?? ''}`}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: delay + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
            {/* A trailing space inside the animated span keeps word spacing
                intact; a gap on the parent would collapse at line breaks. */}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
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
      style={{ color: 'var(--brand-color)' }}
    >
      {children}
    </p>
  );
}
