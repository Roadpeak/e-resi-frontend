'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, CalendarCheck, KeyRound, MapPin, Minus, Play, Plus, Video } from 'lucide-react';
import type { KitStyle } from '../kit';
import { StudioNav } from './StudioNav';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  EASE, FooterColumns, MediaFill, Rise,
  buyerSteps, heroLede, imagePool, pick, placeOf, statement, studioStats, unitTypes, videoPool,
} from './primitives';
import { formatCompletionDate } from '../../../../lib/utils';

/**
 * Renovate — a boxed, hairline-ruled page on light grey with one loud accent
 * (a yellow pill with a dot).
 *
 * Motion is the point of this one:
 *  - the hero photograph is uncovered by a diagonal light sweep, then settles
 *    from a slow zoom while the headline lines rise in turn
 *  - the nav turns black whenever it passes over a dark band
 *  - the "why" list is an accordion, and the photo beside it crossfades to
 *    the open item
 *  - in the dark band the heading pins on the left while residence cards
 *    stick and stack over one another on the right
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-none', headingKind: 'plain',
  unitsAs: 'table', galleryAs: 'grid', outlined: true,
};

const GROUND = '#f2f2f2';

/** The accent pill: label and a small dot, as the reference draws it. */
function AccentPill({ href, children, dark = false }: { href: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-3 rounded-full px-5 py-3 text-[13.5px] font-medium transition-transform hover:-translate-y-0.5"
      style={dark ? { background: '#000', color: '#fff' } : { background: 'var(--tpl-accent)', color: 'var(--tpl-accent-on)' }}
    >
      {children}
      <span className="h-2 w-2 rounded-full bg-current transition-transform group-hover:scale-150" />
    </a>
  );
}

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[32px] font-medium leading-[1.12] tracking-[-0.02em] sm:text-[42px] ${className}`}>{children}</h2>;
}

export function RenovateTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a viewing';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const stats = studioStats(property);
  const types = unitTypes(property);
  const steps = buyerSteps(property);
  const place = placeOf(property);
  const hasTours = property.hasCinematicTour || property.has3DTour || property.hasVRTour;

  // "Why buy here", built from what the development has actually published.
  const reasons = [
    types.length > 0 && {
      icon: Building2,
      title: 'The residences',
      body: types.map((t) => `${t.label}${t.fromLabel ? ` from ${t.fromLabel}` : ''}`).join(' · '),
    },
    {
      icon: MapPin,
      title: 'The location',
      body: property.areaDescription?.trim() || (place ? `Set in ${place}, close to what daily life needs.` : heroLede(property)),
    },
    hasTours && {
      icon: Video,
      title: 'Tour it from anywhere',
      body: 'Walk through the homes in cinematic, 3D or VR, or book a live guided tour on a video call.',
    },
    {
      icon: property.completionDate ? CalendarCheck : KeyRound,
      title: property.completionDate ? 'Completion' : 'Reserve today',
      body: property.completionDate
        ? `Expected handover ${formatCompletionDate(property.completionDate)}, with construction updates posted here.`
        : 'Choose your home and reserve it directly with the developer.',
    },
  ].filter(Boolean) as { icon: typeof MapPin; title: string; body: string }[];
  const [open, setOpen] = useState(0);

  const overview = (
    <div className="border border-neutral-300 bg-white">
      <div className="border-b border-neutral-300 p-6 sm:p-10">
        <H2 className="max-w-2xl text-neutral-900">{copy('overview').heading?.trim() || `Why buy at ${property.name}`}</H2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-600">{statement(property)}</p>
      </div>
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[320px] overflow-hidden border-neutral-300 lg:border-r">
          <AnimatePresence mode="sync">
            <motion.div
              key={open}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <MediaFill image={pick(pool, open + 1)} />
            </motion.div>
          </AnimatePresence>
        </div>
        <div>
          {reasons.map((r, i) => {
            const isOpen = open === i;
            return (
              <div key={r.title} className="border-b border-neutral-300 last:border-b-0">
                <button type="button" onClick={() => setOpen(i)} aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center gap-4 px-6 py-5 text-left">
                  <r.icon size={20} strokeWidth={1.4} className="shrink-0 text-neutral-700" />
                  <span className="flex-1 text-[16px] text-neutral-900">{r.title}</span>
                  {isOpen ? <Minus size={18} className="text-neutral-900" /> : <Plus size={18} className="text-neutral-500" />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 pl-[60px] text-[14px] leading-relaxed text-neutral-600">{r.body}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-neutral-300 bg-[#e9e9e9] p-6 sm:p-10">
        <div>
          <p className="text-[24px] font-medium leading-tight tracking-[-0.01em] text-neutral-900">Planning a visit?</p>
          <p className="mt-2 max-w-sm text-[14px] text-neutral-600">Tell us when suits you and the sales team will confirm a viewing or a live guided tour.</p>
        </div>
        <AccentPill href="#booking">{cta}</AccentPill>
      </div>
    </div>
  );

  // Badges row under the hero: the development's figures as small boxed tiles.
  const badges = stats.length ? (
    <section className="px-5 py-12">
      <div className="mx-auto flex max-w-[1240px] flex-wrap justify-center gap-3">
        {stats.map((s, i) => (
          <Rise key={s.label} delay={i * 0.07}>
            <div className="min-w-[150px] border border-neutral-300 bg-white px-5 py-4 text-center">
              <p className="text-[24px] font-medium leading-none tracking-[-0.02em] text-neutral-900">{s.value}</p>
              <p className="mt-2 text-[12px] text-neutral-500">{s.label}</p>
            </div>
          </Rise>
        ))}
      </div>
    </section>
  ) : null;

  // The dark band: heading pinned left, residence cards sticking and stacking.
  const stackItems = (types.length
    ? types.map((t, i) => ({ title: t.label, sub: `${t.available} available${t.fromLabel ? ` · from ${t.fromLabel}` : ''}`, img: pick(pool, i + 2) }))
    : pool.slice(1, 5).map((img, i) => ({ title: property.name, sub: `View ${String(i + 1).padStart(2, '0')}`, img }))
  ).slice(0, 5);
  const work = stackItems.length ? (
    <section data-nav-dark className="bg-black px-5 py-24">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1fr_1.9fr]">
        <div>
          <div className="lg:sticky lg:top-[110px]">
            <H2 className="text-white">See the homes<br />we&apos;re building</H2>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-white/55">Every residence type at {property.name}, with what is available today.</p>
          </div>
        </div>
        <div className="space-y-10 pb-10">
          {stackItems.map((it, i) => (
            <div key={`${it.title}-${i}`} className="sticky" style={{ top: 100 + i * 16 }}>
              <a href="#units" className="group block overflow-hidden bg-[#f2f2f2] shadow-[0_-20px_40px_rgba(0,0,0,0.35)]">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-[1200ms] group-hover:scale-[1.04]"><MediaFill image={it.img} /></div>
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-[16px] font-medium text-neutral-900">{it.title}</p>
                    <p className="text-[12.5px] text-neutral-500">{it.sub}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-neutral-500 px-4 py-2 text-[12.5px] text-neutral-900 transition-colors group-hover:border-solid group-hover:bg-black group-hover:text-white">
                    View <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const icons = [Video, CalendarCheck, KeyRound, Building2];
  const process = (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-[1240px] border border-neutral-300 bg-white">
        <div className="border-b border-neutral-300 p-8 text-center sm:p-12">
          <H2 className="text-neutral-900">How it gets done</H2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Rise key={s.title} delay={i * 0.08} className={`border-neutral-300 p-6 sm:p-8 ${i ? 'border-t sm:border-t-0 sm:border-l' : ''}`}>
                <Icon size={56} strokeWidth={0.9} className="mx-auto text-neutral-800" />
                <p className="mt-8 text-[16px] font-medium text-neutral-900">{i + 1}. {s.title}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-600">{s.body}</p>
              </Rise>
            );
          })}
        </div>
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div
      className="tpl-headings min-h-screen"
      style={{ background: GROUND, '--tpl-accent': 'var(--brand-custom, #f2ee1b)', '--tpl-accent-on': 'var(--brand-custom-on, #111111)' } as React.CSSProperties}
    >
      <StudioNav variant="renovate" property={property} ctaLabel={cta} />

      <div className="px-5 pt-[60px]">
        <header className="relative mx-auto flex h-[calc(100svh-84px)] min-h-[520px] max-w-[1240px] items-end overflow-hidden bg-neutral-800">
          <motion.div className="absolute inset-0" initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: EASE }}>
            <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
          </motion.div>
          {p.overlay !== false && <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />}
          {/* The diagonal sweep that uncovers the photograph on load. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              backgroundImage: `linear-gradient(115deg, rgba(242,242,242,0) 0%, rgba(242,242,242,0) 38%, ${GROUND} 52%, ${GROUND} 100%)`,
              backgroundSize: '300% 100%',
            }}
            initial={{ backgroundPosition: '100% 0%' }}
            animate={{ backgroundPosition: '0% 0%' }}
            transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
          />
          <div className="relative z-[2] flex w-full flex-wrap items-end justify-between gap-6 p-6 sm:p-10">
            <div className="max-w-xl">
              <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7, ease: EASE }}
                className="flex items-center gap-2 text-[13px] text-white/85">
                <span className="h-2 w-2 rounded-full" style={{ background: 'var(--tpl-accent)' }} /> {place || 'Now selling'}
              </motion.p>
              <h1 className="mt-3 text-[40px] font-medium leading-[1.08] tracking-[-0.02em] text-white sm:text-[60px]">
                {property.name.split(' ').map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                    <motion.span className="inline-block" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 1.15 + i * 0.08, duration: 0.8, ease: EASE }}>
                      {w}&nbsp;
                    </motion.span>
                  </span>
                ))}
              </h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 0.8 }}
                className="mt-4 line-clamp-2 max-w-md text-[14.5px] leading-relaxed text-white/80">{heroLede(property)}</motion.p>
            </div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7, duration: 0.7, ease: EASE }}>
              <AccentPill href="#booking">{cta}</AccentPill>
            </motion.div>
          </div>
          {(videos[0] || hasTours) && (
            <motion.a
              href={hasTours ? '#tours' : '#gallery'}
              initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2, duration: 0.7, ease: EASE }}
              className="absolute left-4 top-4 z-[2] inline-flex items-center gap-2 rounded-full bg-[#2bd96b] py-1.5 pl-1.5 pr-4 text-[12px] font-semibold uppercase text-black shadow-[0_0_0_4px_rgba(43,217,107,0.25)]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white"><Play size={11} className="fill-white" /></span>
              Watch the tour
            </motion.a>
          )}
        </header>
      </div>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-16 sm:py-20'}
        after={{ overview: badges, gallery: work, units: process }}
      />

      <footer data-nav-dark className="bg-black px-5 pb-8 pt-12 text-white">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid border border-white/15 md:grid-cols-2">
            <div className="flex flex-wrap items-center justify-between gap-4 p-6">
              <p className="text-[15px]">Ready to see {property.name}?</p>
              <AccentPill href="#booking">{cta}</AccentPill>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/15 p-6 md:border-l md:border-t-0">
              <p className="text-[15px]">See every residence.</p>
              <a href="#units" className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-[13.5px] font-medium text-black">Residences <span className="h-2 w-2 rounded-full bg-black" /></a>
            </div>
          </div>
          <div className="border-x border-b border-white/15 p-6">
            <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark />
          </div>
          <div className="relative mt-8 flex aspect-[16/5] items-center justify-center overflow-hidden">
            <MediaFill image={pick(pool, 6)} />
            <div className="absolute inset-0 bg-black/40" />
            <p className="relative px-4 text-center text-[38px] font-semibold uppercase tracking-[0.02em] text-white sm:text-[72px]">{property.name}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
