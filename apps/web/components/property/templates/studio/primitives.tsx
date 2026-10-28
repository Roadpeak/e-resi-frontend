'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AnimatePresence, motion, useInView, useScroll, useTransform, type MotionValue,
} from 'framer-motion';
import { Minus, Play, Plus, X } from 'lucide-react';
import type { Property } from '../../../../lib/types';
import { formatCompletionDate, formatPrice } from '../../../../lib/utils';
import { playbackVideoUrl } from '../../../../lib/media/video';
import { SECTIONS } from '../../../../lib/branding/theme';
import { PropertyMonogram } from '../../PropertyMonogram';

/**
 * Building blocks for the "studio" templates (Frame, Prestige, Gallery,
 * Atelier, Horizon, Skyline, Noir).
 *
 * Each of those is a complete page with its own signature sections, but the
 * motion and media pieces — a video that only plays in view, a marquee, a
 * number that counts up, a pinned step list — are the same machinery, so a
 * fix here lands in all seven. Everything reads the development's own data;
 * nothing is invented, and a piece whose data is missing renders nothing.
 */

export const EASE = [0.16, 1, 0.3, 1] as const;

// ─── Data helpers ───────────────────────────────────────────────────────────

/** Every photograph the development has, hero first, de-duplicated. */
export function imagePool(property: Property): string[] {
  const all = [
    property.heroImageUrl,
    ...(property.galleryImages ?? []),
    ...(property.areaPhotos ?? []).map((p) => p.url),
  ].filter(Boolean) as string[];
  return [...new Set(all)];
}

/** The nth image, cycling, so a short gallery still fills a layout. */
export function pick(pool: string[], i: number): string | undefined {
  return pool.length ? pool[i % pool.length] : undefined;
}

/** Videos the development has: hero film first, then uploaded video and drone footage. */
export function videoPool(property: Property): string[] {
  const all = [
    property.heroVideoUrl,
    ...(property.media ?? [])
      .filter((m) => m.type === 'video' || m.type === 'drone')
      .sort((a, b) => a.order - b.order)
      .map((m) => m.url),
  ].filter(Boolean) as string[];
  return [...new Set(all)];
}

/** Short words for marquees — features, amenities and the tours on offer. */
export function featureWords(property: Property, max = 10): string[] {
  const words = [
    ...(property.features ?? []),
    ...(property.amenities ?? []).map((a) => a.name),
    ...(property.hasCinematicTour ? ['Cinematic tour'] : []),
    ...(property.has3DTour ? ['3D walkthrough'] : []),
    ...(property.hasVRTour ? ['VR tour'] : []),
  ]
    .map((w) => w.trim())
    .filter((w) => w && w.length <= 28);
  return [...new Set(words)].slice(0, max);
}

export interface Stat {
  value: string;
  label: string;
  note?: string;
}

/** Figures the development can actually back up — empty ones are dropped. */
export function studioStats(property: Property): Stat[] {
  const units = property.units ?? [];
  const total = property.totalUnits || units.length;
  const available = property.availableUnits
    || units.filter((u) => String(u.status).toLowerCase() === 'available').length;
  const tours = [property.hasCinematicTour, property.has3DTour, property.hasVRTour].filter(Boolean).length;
  const out: Stat[] = [];
  if (total) out.push({ value: String(total), label: 'Residences', note: 'Homes in this development.' });
  if (available) out.push({ value: String(available), label: 'Available now', note: 'Units open for reservation today.' });
  if (property.priceFrom) {
    out.push({ value: formatPrice(property.priceFrom, property.currency), label: 'Starting from', note: 'Entry price across unit types.' });
  }
  if (property.completionDate) {
    out.push({ value: formatCompletionDate(property.completionDate), label: 'Completion', note: 'Expected handover.' });
  }
  if (tours) out.push({ value: String(tours), label: tours === 1 ? 'Immersive tour' : 'Immersive tours', note: 'Walk through it from anywhere.' });
  return out.slice(0, 4);
}

export interface Step {
  title: string;
  body: string;
}

/** How a buyer gets from this page to a home — the platform's real flow. */
export function buyerSteps(property: Property): Step[] {
  const tours = property.hasCinematicTour || property.has3DTour || property.hasVRTour;
  return [
    {
      title: tours ? 'Tour it from anywhere' : 'Explore the development',
      body: tours
        ? 'Walk through the homes in cinematic, 3D or VR — on your phone, from wherever you are.'
        : 'Browse the gallery, floor plans and every available unit with its price.',
    },
    {
      title: 'Book a viewing',
      body: 'Visit the site, or join a live guided tour on a video call with the developer’s team.',
    },
    {
      title: 'Reserve your unit',
      body: 'Choose your home and reserve it. Documents are shared securely right here.',
    },
    {
      title: property.completionDate ? 'Move in on completion' : 'Get the keys',
      body: property.completionDate
        ? `Follow construction updates until handover, expected ${formatCompletionDate(property.completionDate)}.`
        : 'Complete the purchase directly with the developer and move in.',
    },
  ];
}

export interface Faq {
  q: string;
  a: string;
}

/** Questions buyers ask, answered from what the developer has published. */
export function propertyFaq(property: Property): Faq[] {
  const out: Faq[] = [];
  const place = [property.address?.neighborhood, property.address?.city].filter(Boolean).join(', ');
  out.push({
    q: 'How do I book a viewing?',
    a: 'Use the booking form on this page to request a site visit or a virtual viewing. The developer’s team confirms a time with you directly.',
  });
  if (property.hasCinematicTour || property.has3DTour || property.hasVRTour) {
    out.push({
      q: 'Can I see the homes without visiting?',
      a: 'Yes. Open the immersive tours on this page — they work in any browser, and VR works with a headset.',
    });
  }
  if (property.completionDate) {
    out.push({ q: 'When is completion?', a: `Handover is expected ${formatCompletionDate(property.completionDate)}.` });
  }
  if (property.unitFeatures?.length) {
    out.push({ q: 'What comes with each home?', a: property.unitFeatures.join(', ') + '.' });
  }
  if (property.features?.length) {
    out.push({ q: 'What does the development offer?', a: property.features.join(', ') + '.' });
  }
  if (place) {
    out.push({
      q: 'Where is it?',
      a: property.areaDescription?.trim() || `${property.name} is in ${place}.`,
    });
  }
  if (property.petsAllowed != null) {
    out.push({
      q: 'Are pets allowed?',
      a: property.petPolicy?.trim() || (property.petsAllowed ? 'Yes, pets are welcome.' : 'Pets are not permitted.'),
    });
  }
  if (property.leaseTerms?.trim()) out.push({ q: 'What are the lease terms?', a: property.leaseTerms.trim() });
  out.push({
    q: 'How do payments work?',
    a: 'Payments are made directly to the developer under your sale agreement. Reserve your unit here and the developer will share the payment plan.',
  });
  return out;
}

/** Unit types, for "browse by type" blocks: bedrooms, how many, from what price. */
export function unitTypes(property: Property) {
  const map = new Map<number, { beds: number; count: number; available: number; from: number }>();
  for (const u of property.units ?? []) {
    const cur = map.get(u.bedrooms) ?? { beds: u.bedrooms, count: 0, available: 0, from: Infinity };
    cur.count += 1;
    if (String(u.status).toLowerCase() === 'available') cur.available += 1;
    if (u.price) cur.from = Math.min(cur.from, u.price);
    map.set(u.bedrooms, cur);
  }
  return [...map.values()]
    .sort((a, b) => a.beds - b.beds)
    .map((t) => ({
      ...t,
      label: t.beds === 0 ? 'Studio' : `${t.beds} Bedroom`,
      fromLabel: Number.isFinite(t.from) ? formatPrice(t.from, property.currency) : null,
    }));
}

/** The tagline only when it is short enough to set as a headline. */
export function shortLine(property: Property, max = 70): string | undefined {
  const t = property.tagline?.trim();
  return t && t.length <= max ? t : undefined;
}

/** The line under a hero headline: the tagline, else the opening sentence. */
export function heroLede(property: Property): string {
  return property.tagline?.trim() || (property.description || '').split(/(?<=[.!?])\s/)[0] || '';
}

export function placeOf(property: Property) {
  return [property.address?.neighborhood, property.address?.city].filter(Boolean).join(', ');
}

// ─── Media ──────────────────────────────────────────────────────────────────

/**
 * Video when there is one, photograph otherwise, filling its box.
 *
 * Section videos only download and play while on screen — a long page with
 * three looping films must not pull all three on a phone the moment it opens.
 */
export function MediaFill({
  video,
  image,
  alt = '',
  className = '',
  priority = false,
  grayscale = false,
}: {
  video?: string;
  image?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  grayscale?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { amount: 0.1 });
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (inView) v.play().catch(() => undefined);
    else v.pause();
  }, [inView]);

  const filter = grayscale ? 'grayscale' : '';
  if (video) {
    return (
      <video
        ref={ref}
        src={playbackVideoUrl(video)}
        poster={image}
        muted
        loop
        playsInline
        preload={priority ? 'auto' : 'metadata'}
        autoPlay={priority}
        className={`absolute inset-0 h-full w-full object-cover ${filter} ${className}`}
      />
    );
  }
  if (image) {
    return (
      <Image src={image} alt={alt} fill priority={priority} sizes="100vw" className={`object-cover ${filter} ${className}`} />
    );
  }
  return <div className="absolute inset-0 bg-neutral-300" />;
}

/** Crossfading slideshow — the hero film if there is one, else the photographs. */
export function HeroSlides({
  property,
  interval = 6000,
  grayscale = false,
}: {
  property: Property;
  interval?: number;
  grayscale?: boolean;
}) {
  const video = property.heroVideoUrl;
  const images = imagePool(property).slice(0, 4);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (video || images.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [video, images.length, interval]);

  if (video) return <MediaFill video={video} image={property.heroImageUrl} priority grayscale={grayscale} />;
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={images[i] ?? 'none'}
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ opacity: { duration: 1.2 }, scale: { duration: interval / 1000 + 1.2, ease: 'linear' } }}
      >
        <MediaFill image={images[i]} alt={property.name} priority={i === 0} grayscale={grayscale} />
      </motion.div>
    </AnimatePresence>
  );
}

/** Round play button that opens a video full screen. */
export function VideoModalButton({
  src,
  label = 'Play film',
  className = '',
}: {
  src: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        className={`group relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-white/25 backdrop-blur-md transition-transform hover:scale-105 ${className}`}
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-neutral-900">
          <Play size={20} className="ml-0.5" fill="currentColor" />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute right-5 top-5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            <video
              src={playbackVideoUrl(src)}
              controls
              autoPlay
              playsInline
              className="max-h-[85vh] w-full max-w-5xl rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Motion ─────────────────────────────────────────────────────────────────

/** Fade and rise once, on entry. */
export function Rise({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Image that drifts against the scroll, inside a clipped frame. */
export function ParallaxImage({
  src,
  alt = '',
  className = '',
  strength = 60,
  grayscale = false,
}: {
  src?: string;
  alt?: string;
  className?: string;
  strength?: number;
  grayscale?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div className="absolute -inset-y-[80px] inset-x-0" style={{ y }}>
        {src && <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className={`object-cover ${grayscale ? 'grayscale' : ''}`} />}
      </motion.div>
    </div>
  );
}

/**
 * Infinite horizontal scroll. The list is rendered twice and the track moved
 * by half its width, so the loop has no seam. Stops for reduced motion.
 */
export function Marquee({
  items,
  render,
  speed = 40,
  reverse = false,
  className = '',
  gap = 'gap-12',
}: {
  items: string[];
  render: (item: string, i: number) => ReactNode;
  /** Seconds per loop. */
  speed?: number;
  reverse?: boolean;
  className?: string;
  gap?: string;
}) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className={`overflow-hidden ${className}`}>
      <style>{`@keyframes studio-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion: reduce){.studio-marquee{animation:none!important}}`}</style>
      <div
        className={`studio-marquee flex w-max items-center ${gap}`}
        style={{ animation: `studio-marquee ${speed}s linear infinite${reverse ? ' reverse' : ''}` }}
      >
        {doubled.map((item, i) => (
          <div key={`${item}-${i}`} className="shrink-0">
            {render(item, i % items.length)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A figure that counts up from zero the first time it is seen. */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const m = value.match(/^(\D*?)([\d,]+(?:\.\d+)?)(.*)$/);
  const target = m ? Number(m[2].replace(/,/g, '')) : NaN;
  const [shown, setShown] = useState(m ? `${m[1]}0${m[3]}` : value);

  useEffect(() => {
    if (!inView || !m || !Number.isFinite(target)) {
      if (inView) setShown(value);
      return;
    }
    const decimals = (m[2].split('.')[1] ?? '').length;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1400);
      const eased = 1 - Math.pow(1 - p, 3);
      const n = target * eased;
      const formatted = decimals
        ? n.toFixed(decimals)
        : Math.round(n).toLocaleString('en-KE');
      setShown(`${m[1]}${formatted}${m[3]}`);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setShown(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return <span ref={ref} className={className}>{shown}</span>;
}

/** Words that light up from muted to full as the paragraph scrolls past. */
export function ScrollLitText({
  text,
  className = '',
  dim = 0.22,
}: {
  text: string;
  className?: string;
  dim?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <LitWord key={`${w}-${i}`} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} dim={dim} />
      ))}
    </p>
  );
}

function LitWord({
  word, progress, range, dim,
}: { word: string; progress: MotionValue<number>; range: [number, number]; dim: number }) {
  const opacity = useTransform(progress, range, [dim, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {word}{' '}
    </motion.span>
  );
}

// ─── Composite sections ─────────────────────────────────────────────────────

/**
 * Steps on one side, an image that changes with the active step on the
 * other — pinned while the list scrolls past on wide screens.
 */
export function StickySteps({
  steps,
  images,
  activeClass,
  idleClass,
  numberClass = '',
  bodyClass = '',
  imageClass = 'rounded-none',
  reverse = false,
}: {
  steps: Step[];
  images: (string | undefined)[];
  activeClass: string;
  idleClass: string;
  numberClass?: string;
  bodyClass?: string;
  imageClass?: string;
  reverse?: boolean;
}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [steps.length]);

  return (
    <div className={`grid gap-8 lg:grid-cols-2 lg:gap-12 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className={`relative aspect-[4/3] overflow-hidden lg:aspect-[5/4] ${imageClass}`}>
          <AnimatePresence initial={false}>
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <MediaFill image={images[active % Math.max(1, images.length)]} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="space-y-4 lg:py-[18vh]">
        {steps.map((s, i) => (
          <div
            key={s.title}
            ref={(el) => { refs.current[i] = el; }}
            data-step={i}
            onClick={() => setActive(i)}
            className={`cursor-pointer p-6 transition-colors duration-500 sm:p-7 ${i === active ? activeClass : idleClass}`}
          >
            <p className="flex items-baseline gap-3 text-[22px] sm:text-[26px]">
              <span className={`tabular-nums ${i === active ? '' : 'opacity-35'} ${numberClass}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{s.title}</span>
            </p>
            <AnimatePresence initial={false}>
              {i === active && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className={`overflow-hidden pt-3 text-[15px] leading-relaxed ${bodyClass}`}
                >
                  {s.body}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Accordion list in one of three manners. */
export function Accordion({
  items,
  variant = 'line',
  onDark = false,
  defaultOpen = 0,
}: {
  items: Faq[];
  variant?: 'line' | 'card' | 'circle';
  onDark?: boolean;
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const text = onDark ? 'text-white' : 'text-neutral-900';
  const body = onDark ? 'text-white/60' : 'text-neutral-500';
  const line = onDark ? 'border-white/15' : 'border-neutral-200';
  return (
    <div className={variant === 'card' ? 'space-y-3' : ''}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const icon = variant === 'circle' ? (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${onDark ? 'bg-white/10' : 'bg-neutral-100'}`}>
            {isOpen ? <X size={14} /> : <Plus size={14} />}
          </span>
        ) : isOpen ? <Minus size={18} className="shrink-0" /> : <Plus size={18} className="shrink-0" />;
        return (
          <div
            key={item.q}
            className={variant === 'card'
              ? `rounded-2xl px-5 ${onDark ? 'bg-white/[0.06]' : 'bg-white'}`
              : `border-b ${line}`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={`flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-[16px] sm:text-[17px] ${text}`}
            >
              {item.q}
              {icon}
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className={`pb-5 pr-10 text-[15px] leading-relaxed ${body}`}>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/** Spots placed over an image, each pulsing with a label — the development's highlights. */
const SPOTS = [
  { x: 58, y: 34 }, { x: 28, y: 62 }, { x: 72, y: 66 }, { x: 46, y: 82 }, { x: 18, y: 30 }, { x: 84, y: 42 },
];

export function Hotspots({ image, labels }: { image?: string; labels: string[] }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl sm:aspect-[16/8]">
      <MediaFill image={image} />
      <div className="absolute inset-0 bg-black/10" />
      {labels.slice(0, SPOTS.length).map((label, i) => (
        <motion.div
          key={label}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
          style={{ left: `${SPOTS[i].x}%`, top: `${SPOTS[i].y}%` }}
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 * i, duration: 0.5, ease: EASE }}
        >
          <span className="rounded-md bg-white px-3 py-1.5 text-[12.5px] font-medium text-neutral-900 shadow-lg">{label}</span>
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-neutral-900/60" />
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/** The development's name set edge to edge — the closing wordmark. */
export function Wordmark({ text, className = '', style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const len = Math.max(4, text.length);
  return (
    <div className="overflow-hidden">
      <p
        className={`whitespace-nowrap text-center leading-[0.8] ${className}`}
        style={{ fontSize: `min(${Math.round(150 / len)}vw, 22vw)`, ...style }}
      >
        {text}
      </p>
    </div>
  );
}

/** Developer, links back to sections, attribution and disclaimer — every footer carries these. */
export function FooterColumns({
  property,
  sections,
  whiteLabel,
  onDark,
  headingFont = 'var(--tpl-font-heading)',
}: {
  property: Property;
  sections: string[];
  whiteLabel?: boolean;
  onDark: boolean;
  headingFont?: string;
}) {
  const muted = onDark ? 'rgba(255,255,255,0.55)' : 'rgba(24,25,26,0.55)';
  const strong = onDark ? '#fff' : '#18191a';
  const line = onDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  return (
    <div>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <PropertyMonogram name={property.name} logoUrl={property.logoUrl} size={40} onDark={onDark} />
            <p className="text-[16px]" style={{ color: strong, fontFamily: headingFont }}>{property.name}</p>
          </div>
          {property.tagline && <p className="mt-4 max-w-xs text-[13px] leading-relaxed" style={{ color: muted }}>{property.tagline}</p>}
          {placeOf(property) && <p className="mt-3 text-[13px]" style={{ color: muted }}>{placeOf(property)}</p>}
        </div>
        {property.developer?.name && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: muted }}>Developer</p>
            <div className="mt-4 flex items-center gap-3">
              <PropertyMonogram name={property.developer.name} logoUrl={property.developer.logoUrl} size={36} onDark={onDark} />
              <p className="text-[14px] font-medium" style={{ color: strong }}>{property.developer.name}</p>
            </div>
            {property.developer.description && (
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed" style={{ color: muted }}>{property.developer.description}</p>
            )}
          </div>
        )}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: muted }}>Explore</p>
          <ul className="mt-4 space-y-2.5">
            {sections.filter((id) => id !== 'overview').slice(0, 6).map((id) => (
              <li key={id}>
                <a href={`#${id}`} className="text-[13px] transition-opacity hover:opacity-70" style={{ color: muted }}>
                  {SECTIONS.find((s) => s.id === id)?.label ?? id}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 pt-6" style={{ borderTop: `1px solid ${line}` }}>
        <p className="text-[12px]" style={{ color: muted }}>© {new Date().getFullYear()} {property.developer?.name ?? property.name}</p>
        {!whiteLabel && (
          <a href="https://e-resi.com" target="_blank" rel="noreferrer noopener" className="text-[11px] uppercase tracking-[0.14em] hover:opacity-70" style={{ color: muted }}>
            Tours by e-resi
          </a>
        )}
        <p className="text-[12px]" style={{ color: muted }}>All property details are provided by the developer.</p>
      </div>
    </div>
  );
}
