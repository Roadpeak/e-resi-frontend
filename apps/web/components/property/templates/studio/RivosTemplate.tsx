'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Box, Building2, KeyRound, Play, ShieldCheck } from 'lucide-react';
import type { KitStyle } from '../kit';
import { StudioNav } from './StudioNav';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, CountUp, EASE, FooterColumns, MediaFill, Rise,
  buyerSteps, heroLede, imagePool, pick, placeOf, propertyFaq, statement, studioStats, unitTypes, videoPool,
} from './primitives';

/**
 * Rivos — soft grey ground, everything rounded. The hero is an inset rounded
 * photograph with a dark glass pill nav centred over it, a big headline, two
 * figures bottom-left and a glass residence card bottom-right. Sections open
 * with a small dotted pill label; a statement sits beside a staggered image
 * grid; feature cards carry an icon and a figure.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-[24px]', headingKind: 'plain',
  unitsAs: 'cards', galleryAs: 'grid', outlined: false,
};

const GROUND = '#f6f6f8';

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--tpl-accent)]" />{children}
    </span>
  );
}

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[34px] font-medium leading-[1.1] tracking-[-0.03em] text-neutral-900 sm:text-[46px] ${className}`}>{children}</h2>;
}

export function RivosTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a viewing';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const stats = studioStats(property);
  const types = unitTypes(property);
  const steps = buyerSteps(property);
  const place = placeOf(property);

  const overview = (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      <div><Pill>About</Pill></div>
      <div>
        <Rise>
          <p className="text-[26px] font-medium leading-[1.3] tracking-[-0.02em] text-neutral-900 sm:text-[36px]">
            {copy('overview').heading?.trim() || statement(property)}
          </p>
        </Rise>
        {/* Staggered tiles, as the reference sets them: some rows step down. */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => (
            <Rise key={n} delay={(i % 4) * 0.06} className={i % 4 === 1 ? 'sm:translate-y-14' : ''}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-neutral-200">
                <MediaFill image={pick(pool, n)} />
              </div>
            </Rise>
          ))}
        </div>
      </div>
    </div>
  );

  const residences = types.length ? (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[1320px]">
        <Pill>Residences</Pill>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <H2>Explore the<br />residences</H2>
          <a href="#units" className="inline-flex items-center gap-2 rounded-full bg-[var(--tpl-accent)] text-[var(--tpl-accent-on)] px-5 py-3 text-[13px] font-medium">View all units <ArrowRight size={14} /></a>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {types.slice(0, 6).map((t, i) => (
            <Rise key={t.label} delay={(i % 3) * 0.07}>
              <a href="#units" className="group block overflow-hidden rounded-[24px] bg-white">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-[1200ms] group-hover:scale-105"><MediaFill image={pick(pool, i + 3)} /></div>
                  <span className="absolute left-4 top-4 rounded-full bg-white/25 px-3 py-1 text-[12px] text-white backdrop-blur-md">
                    {t.available > 0 ? `${t.available} available` : 'Sold out'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-[18px] font-medium tracking-[-0.01em] text-neutral-900">{t.label}</p>
                    <p className="mt-0.5 text-[13px] text-neutral-500">{t.fromLabel ? `From ${t.fromLabel}` : `${t.count} homes`}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 transition-colors group-hover:bg-[var(--tpl-accent)] group-hover:text-[var(--tpl-accent-on)]"><ArrowUpRight size={16} /></span>
                </div>
              </a>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const icons = [Building2, KeyRound, ShieldCheck, Box];
  const features = stats.length ? (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-6 lg:grid-cols-2">
          <Pill>Why {property.name}</Pill>
          <div>
            <H2>More thought in every square metre</H2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-neutral-500">{heroLede(property)}</p>
          </div>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Rise key={s.label} delay={i * 0.06}>
                <div className="flex h-full flex-col rounded-[24px] bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-800"><Icon size={18} strokeWidth={1.5} /></span>
                  <p className="mt-8 text-[18px] font-medium text-neutral-900">{s.label}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-neutral-500">{s.note}</p>
                  <p className="mt-auto pt-10 text-[40px] font-medium leading-none tracking-[-0.03em] text-neutral-900"><CountUp value={s.value} /></p>
                </div>
              </Rise>
            );
          })}
        </div>
      </div>
    </section>
  ) : null;

  const process = (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-[1320px] gap-4 lg:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden rounded-[28px]"><MediaFill image={pick(pool, 9)} /></div>
        <div className="rounded-[28px] bg-white p-8 sm:p-10">
          <Pill>How it works</Pill>
          <H2 className="mt-4">From first look to keys</H2>
          <ol className="mt-8 space-y-6">
            {steps.map((s, i) => (
              <Rise key={s.title} delay={i * 0.05}>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tpl-accent)] text-[var(--tpl-accent-on)] text-[12px] font-medium">{i + 1}</span>
                  <div>
                    <p className="text-[17px] font-medium text-neutral-900">{s.title}</p>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-neutral-500">{s.body}</p>
                  </div>
                </li>
              </Rise>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );

  const faq = (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-2">
        <div>
          <Pill>FAQ</Pill>
          <H2 className="mt-4">Questions, answered</H2>
        </div>
        <Accordion items={propertyFaq(property)} variant="card" />
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="tpl-headings min-h-screen" style={{ background: GROUND, '--tpl-accent': 'var(--brand-custom, #16181d)', '--tpl-accent-on': 'var(--brand-custom-on, #ffffff)' } as React.CSSProperties}>
      <StudioNav variant="rivos" property={property} ctaLabel={cta} />

      <div className="p-3 sm:p-4">
        <header className="relative flex min-h-[calc(100svh-32px)] flex-col justify-end overflow-hidden rounded-[28px] bg-neutral-900">
          <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
          {p.overlay !== false && <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-black/10" />}
          <div className="relative flex flex-1 flex-col justify-center px-6 pt-28 sm:px-12">
            <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }} className="max-w-2xl">
              <h1 className="text-[44px] font-medium leading-[1.04] tracking-[-0.035em] text-white sm:text-[72px]">{property.name}</h1>
              <p className="mt-5 line-clamp-3 max-w-lg text-[16px] leading-relaxed text-white/85">{heroLede(property)}</p>
              <a href={property.has3DTour || property.hasCinematicTour || property.hasVRTour ? '#tours' : '#gallery'} className="mt-8 inline-flex items-center gap-3 text-[15px] text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md"><Play size={14} className="fill-white" /></span>
                See how it feels
              </a>
            </motion.div>
          </div>
          <div className="relative flex flex-wrap items-end justify-between gap-6 px-6 pb-6 sm:px-12 sm:pb-10">
            <div className="flex gap-10">
              {stats.slice(0, 2).map((s) => (
                <div key={s.label}>
                  <p className="text-[34px] font-medium leading-none tracking-[-0.03em] text-white sm:text-[44px]">{s.value}</p>
                  <p className="mt-2 text-[13px] text-white/75">{s.label}</p>
                </div>
              ))}
            </div>
            <motion.a
              href="#units"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease: EASE }}
              className="hidden w-[340px] items-center gap-4 rounded-[20px] bg-white/15 p-3 text-white backdrop-blur-xl sm:flex"
            >
              <span className="relative h-24 w-28 shrink-0 overflow-hidden rounded-[14px]"><MediaFill image={pick(pool, 1)} /></span>
              <span className="min-w-0">
                <span className="line-clamp-3 block text-[13px] leading-snug text-white/90">{place ? `New residences in ${place}.` : heroLede(property)}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium">Explore residences <ArrowRight size={13} /></span>
              </span>
            </motion.a>
          </div>
        </header>
      </div>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-4 py-20 sm:px-6 sm:py-24'}
        after={{ overview: residences, gallery: features, units: process, location: faq }}
      />

      <div className="p-3 sm:p-4">
        <section className="relative flex min-h-[70vh] items-center overflow-hidden rounded-[28px] px-6 sm:px-12">
          <MediaFill video={videos[1]} image={pick(pool, 10)} />
          <div className="absolute inset-0 bg-black/50" />
          <Rise className="relative max-w-xl">
            <h2 className="text-[38px] font-medium leading-[1.08] tracking-[-0.03em] text-white sm:text-[56px]">Better places shape better lives</h2>
            <p className="mt-4 text-[15px] text-white/80">Book a visit on site, or a live guided tour with the sales team on a video call.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              <a href="#booking" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[13px] font-medium text-neutral-900">{cta} <ArrowUpRight size={14} /></a>
              <a href="#units" className="rounded-full bg-white/15 px-5 py-3 text-[13px] text-white backdrop-blur-md">See residences</a>
            </div>
          </Rise>
        </section>
      </div>

      <footer className="px-4 pb-8 pt-12 sm:px-8">
        <div className="mx-auto max-w-[1320px]">
          <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark={false} />
        </div>
      </footer>
    </div>
  );
}
