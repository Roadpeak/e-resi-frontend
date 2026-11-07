'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Bath, BedDouble, Building2, CalendarCheck, Car, Dumbbell, Home, KeyRound,
  ShieldCheck, Sofa, Star, Trees, Video, Wifi,
} from 'lucide-react';
import type { KitStyle } from '../kit';
import { StudioNav } from './StudioNav';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, CountUp, EASE, FooterColumns, MediaFill, ParallaxImage, Rise,
  buyerSteps, heroLede, imagePool, pick, placeOf, propertyFaq, statement, studioStats, unitTypes, videoPool,
} from './primitives';

/**
 * Acsapti — clean white, rounded cards, one red accent and a wide dark glass
 * nav floating over a full-bleed hero.
 *
 * Motion carried over from the reference:
 *  - the hero photograph fades in from grey and drifts slowly in scale
 *  - a circular "discover" badge spins continuously; its arrow nudges on hover
 *  - round photo avatars pop in one after another beside the stars
 *  - stat cards rise in a stagger beside the about text
 *  - residence cards widen on hover (the others narrow), revealing a
 *    subtitle and an arrow button
 *  - service cards lift on hover; the closing band's photo moves in parallax
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-2xl', headingKind: 'eyebrow',
  unitsAs: 'cards', galleryAs: 'grid', outlined: true,
};

const RED = 'var(--tpl-accent)';

function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return <p className={`text-[12px] font-medium uppercase tracking-[0.08em] ${center ? 'text-center' : ''}`} style={{ color: RED }}>{children}</p>;
}

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-neutral-900 sm:text-[44px] ${className}`}>{children}</h2>;
}

function RedButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-medium transition-transform hover:-translate-y-0.5"
      style={{ background: RED, color: 'var(--tpl-accent-on)' }}>{children}</a>
  );
}

/** Circular text that spins forever around an arrow, linking into the page. */
function SpinBadge({ text, href }: { text: string; href: string }) {
  const label = `${text} • ${text} • `;
  return (
    <a href={href} className="group relative flex h-[120px] w-[120px] items-center justify-center" aria-label={text}>
      <motion.svg viewBox="0 0 120 120" className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 14, ease: 'linear', repeat: Infinity }}>
        <defs><path id="acsapti-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
        <text fill="#fff" fontSize="11" letterSpacing="2.2"><textPath href="#acsapti-circle">{label}</textPath></text>
      </motion.svg>
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 text-white transition-transform duration-300 group-hover:rotate-45">
        <ArrowUpRight size={18} />
      </span>
    </a>
  );
}

export function AcsaptiTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a viewing';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const stats = studioStats(property);
  const types = unitTypes(property);
  const steps = buyerSteps(property);
  const place = placeOf(property);
  const [hovered, setHovered] = useState<number | null>(null);

  const overview = (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <Eyebrow>About the development</Eyebrow>
        <H2 className="mt-3">{copy('overview').heading?.trim() || `Homes that feel like home`}</H2>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-neutral-600">{statement(property, 3)}</p>
        <div className="mt-7"><RedButton href="#units">See the residences</RedButton></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Rise className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)]"><MediaFill image={pick(pool, 1)} /></Rise>
        {stats.slice(0, 3).map((s, i) => (
          <Rise key={s.label} delay={0.1 + i * 0.1}>
            <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-white px-4 text-center shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
              <p className="text-[28px] font-semibold tracking-[-0.02em] text-neutral-900 sm:text-[34px]"><CountUp value={s.value} /></p>
              <p className="mt-1 text-[13px] text-neutral-500">{s.label}</p>
            </div>
          </Rise>
        ))}
      </div>
    </div>
  );

  // Cards that widen on hover; the others give way.
  const cards = (types.length
    ? types.map((t, i) => ({ title: t.label, sub: `${t.available} available${t.fromLabel ? ` · from ${t.fromLabel}` : ''}`, img: pick(pool, i + 2) }))
    : pool.slice(1, 5).map((img, i) => ({ title: ['Exterior', 'Interiors', 'Living', 'Views'][i] ?? property.name, sub: property.name, img }))
  ).slice(0, 5);
  const residences = cards.length ? (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto max-w-[1200px]">
        <Eyebrow center>Residences</Eyebrow>
        <H2 className="mt-3 text-center">Explore the homes at {property.name}</H2>
        <div className="mt-12 flex flex-col gap-4 sm:h-[460px] sm:flex-row" onMouseLeave={() => setHovered(null)}>
          {cards.map((c, i) => {
            const open = hovered === i;
            return (
              <motion.a
                key={`${c.title}-${i}`}
                href="#units"
                onMouseEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                initial={false}
                animate={{ flexGrow: open ? 2.1 : 1 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="relative block h-[320px] overflow-hidden rounded-2xl sm:h-auto"
                style={{ flexBasis: 0, flexGrow: 1 }}
              >
                <MediaFill image={c.img} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[19px] font-medium text-white">{c.title}</p>
                    <motion.p
                      initial={false}
                      animate={{ opacity: open ? 1 : 0, height: open ? 'auto' : 0 }}
                      transition={{ duration: 0.35 }}
                      className="overflow-hidden text-[12.5px] text-white/80"
                    >
                      {c.sub}
                    </motion.p>
                  </div>
                  <motion.span
                    initial={false}
                    animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.6 }}
                    transition={{ duration: 0.3 }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 text-white"
                  >
                    <ArrowUpRight size={17} />
                  </motion.span>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  ) : null;

  // Service-style cards from the development's real features.
  const featureIcons = [Home, Sofa, BedDouble, Bath, Car, Dumbbell, Trees, ShieldCheck, Wifi, Building2];
  const featureList = [...(property.features ?? []), ...(property.unitFeatures ?? [])].slice(0, 6);
  const services = featureList.length ? (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto max-w-[1200px]">
        <Eyebrow center>Features</Eyebrow>
        <H2 className="mt-3 text-center">Everything your home needs</H2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureList.map((f, i) => {
            const Icon = featureIcons[i % featureIcons.length];
            return (
              <Rise key={f} delay={(i % 3) * 0.07}>
                <div className="h-full rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
                  <Icon size={26} strokeWidth={1.4} style={{ color: RED }} />
                  <p className="mt-6 text-[17px] font-medium text-neutral-900">{f}</p>
                  <a href="#units" className="mt-6 inline-flex items-center gap-1 text-[13px]" style={{ color: RED }}>Learn more <ArrowRight size={13} /></a>
                </div>
              </Rise>
            );
          })}
        </div>
      </div>
    </section>
  ) : null;

  const process = (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>How it works</Eyebrow>
          <H2 className="mt-3">From first visit to keys</H2>
          <div className="mt-8 space-y-3">
            {steps.map((s, i) => {
              const Icon = [Video, CalendarCheck, KeyRound, Home][i % 4];
              return (
                <Rise key={s.title} delay={i * 0.06}>
                  <div className="flex gap-4 rounded-2xl border border-neutral-200 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--tpl-accent) 12%, white)', color: RED }}><Icon size={18} /></span>
                    <div>
                      <p className="text-[16px] font-medium text-neutral-900">{s.title}</p>
                      <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">{s.body}</p>
                    </div>
                  </div>
                </Rise>
              );
            })}
          </div>
        </div>
        <div>
          <Eyebrow>Questions</Eyebrow>
          <H2 className="mt-3">Good to know</H2>
          <div className="mt-8"><Accordion items={propertyFaq(property)} variant="line" /></div>
        </div>
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });
  const thumbs = pool.slice(1, 4);

  return (
    <div
      className="tpl-headings min-h-screen bg-white"
      style={{ '--tpl-accent': 'var(--brand-custom, #e5332a)', '--tpl-accent-on': 'var(--brand-custom-on, #ffffff)' } as React.CSSProperties}
    >
      <StudioNav variant="acsapti" property={property} ctaLabel={cta} />

      <header className="relative flex min-h-[100svh] items-end overflow-hidden bg-neutral-500">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ opacity: { duration: 1.4 }, scale: { duration: 6, ease: 'easeOut' } }}
        >
          <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
        </motion.div>
        {p.overlay !== false && <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/20" />}

        <div className="relative mx-auto w-full max-w-[1200px] px-5 pb-10 pt-32">
          <div className="flex items-end justify-between gap-8">
            <div className="max-w-2xl">
              <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                className="inline-block rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ background: RED, color: 'var(--tpl-accent-on)' }}>
                {place || 'Now selling'}
              </motion.span>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1, ease: EASE }}
                className="mt-4 text-[44px] font-semibold leading-[1.04] tracking-[-0.03em] text-white sm:text-[72px]">
                {property.name}
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }}
                className="mt-5 line-clamp-2 max-w-lg text-[15px] leading-relaxed text-white/85">{heroLede(property)}</motion.p>
            </div>
            <motion.div className="hidden md:block" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, duration: 0.8, ease: EASE }}>
              <SpinBadge text="Discover the residences" href="#overview" />
            </motion.div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/25 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {thumbs.map((src, i) => (
                  <motion.span key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.1 + i * 0.15, type: 'spring', stiffness: 320, damping: 18 }}
                    className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white">
                    <MediaFill image={src} />
                  </motion.span>
                ))}
              </div>
              <div>
                <span className="flex gap-0.5 text-white">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className="fill-white" />)}</span>
                <p className="mt-0.5 text-[12px] text-white/75">{stats[1] ? `${stats[1].value} ${stats[1].label.toLowerCase()}` : 'Now selling'}</p>
              </div>
            </div>
            <a href="#units" className="group inline-flex items-center gap-2 text-[14px] text-white">
              Explore all residences <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-20 sm:px-10 sm:py-24'}
        after={{ overview: residences, gallery: services, units: process }}
      />

      <section className="relative flex min-h-[340px] items-center overflow-hidden">
        <div className="absolute inset-0"><ParallaxImage src={pick(pool, 7)} className="h-full w-full" strength={80} /></div>
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-6 px-5 py-16">
          <Rise>
            <h2 className="text-[32px] font-semibold tracking-[-0.02em] text-white sm:text-[44px]">Planning your move?</h2>
            <p className="mt-3 max-w-md text-[15px] text-white/80">Book a viewing on site or a live guided tour. The sales team replies within one working day.</p>
          </Rise>
          <RedButton href="#booking">{cta}</RedButton>
        </div>
      </section>

      <footer className="px-5 pt-16">
        <div className="mx-auto max-w-[1200px]">
          <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark={false} />
        </div>
      </footer>
    </div>
  );
}
