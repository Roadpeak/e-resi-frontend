'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { KitStyle } from '../kit';
import { StudioNav } from './StudioNav';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, CountUp, EASE, FooterColumns, MediaFill, Rise, Wordmark,
  buyerSteps, heroLede, imagePool, pick, placeOf, propertyFaq, statement, studioStats, unitTypes, videoPool,
} from './primitives';

/**
 * Aurevant — near-black, with one coral-red accent. A full-bleed hero with a
 * left-aligned headline, red pill and a glass "signature residence" card; the
 * name as a giant lowercase wordmark crossing into the next section; a
 * statement that fades to grey; a large featured residence card; residence
 * tiles filtered by pill tabs.
 */

const STYLE: KitStyle = {
  onDark: true, radius: 'rounded-[20px]', headingKind: 'plain',
  unitsAs: 'cards', galleryAs: 'grid', outlined: false,
};

/** The signature coral, or the developer's colour once they pick one. */
const RED = 'var(--tpl-accent)';
const GROUND = '#0b0b0b';

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: RED }} />{children}
    </p>
  );
}

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-white sm:text-[52px] ${className}`}>{children}</h2>;
}

export function AurevantTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a viewing';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const stats = studioStats(property);
  const types = unitTypes(property);
  const steps = buyerSteps(property);
  const place = placeOf(property);
  const [tab, setTab] = useState<'all' | 'available'>('all');
  const shownTypes = tab === 'available' ? types.filter((t) => t.available > 0) : types;

  const said = copy('overview').heading?.trim() || statement(property, 3);
  const words = said.split(/\s+/);
  const cut = Math.ceil(words.length * 0.7);

  const overview = (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      <div>
        <Eyebrow>The {property.name} perspective</Eyebrow>
        {property.completionDate && <p className="mt-6 text-[22px] text-white/45">Ready {new Date(property.completionDate).getFullYear()}</p>}
      </div>
      <div>
        <Rise>
          <p className="text-[26px] font-medium leading-[1.3] tracking-[-0.02em] sm:text-[36px]">
            <span className="text-white">{words.slice(0, cut).join(' ')} </span>
            <span className="text-white/35">{words.slice(cut).join(' ')}</span>
          </p>
        </Rise>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-6">
          <p className="max-w-sm text-[14px] leading-relaxed text-white/55">{heroLede(property)}</p>
          <a href="#units" className="rounded-full px-6 py-3 text-[13px] font-medium text-[var(--tpl-accent-on)]" style={{ background: RED }}>Discover {property.name}</a>
        </div>
      </div>
    </div>
  );

  const featured = (
    <section className="px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <H2>Designed to belong.<br />Created to endure.</H2>
          <p className="max-w-sm text-[14px] leading-relaxed text-white/55">Residences shaped by thoughtful design, lasting materials and a close connection to their setting.</p>
        </div>
        <Rise className="mt-10">
          <a href="#units" className="group relative block aspect-[16/10] overflow-hidden rounded-[24px] sm:aspect-[16/8]">
            <div className="absolute inset-0 transition-transform duration-[1400ms] group-hover:scale-[1.03]"><MediaFill image={pick(pool, 2)} /></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
            <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-[12px] text-black">For sale</span>
            {place && <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-[12px] text-white backdrop-blur"><MapPin size={12} /> {place}</span>}
            <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-4 sm:inset-x-8 sm:bottom-8">
              <div>
                <p className="text-[34px] font-medium tracking-[-0.03em] text-white sm:text-[56px]">{property.name}</p>
                <p className="mt-1 text-[13px] text-white/75">{[place, stats[0] && `${stats[0].value} ${stats[0].label.toLowerCase()}`].filter(Boolean).join(' · ')}</p>
              </div>
              <span className="rounded-full bg-white px-5 py-2.5 text-[13px] text-black transition-colors group-hover:bg-[var(--tpl-accent)] group-hover:text-[var(--tpl-accent-on)]">View the residences</span>
            </div>
          </a>
        </Rise>
      </div>
    </section>
  );

  const collection = types.length ? (
    <section className="px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap gap-2">
          {(['all', 'available'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`cursor-pointer rounded-full border px-4 py-2 text-[13px] transition-colors ${tab === k ? 'border-white bg-white text-black' : 'border-white/20 text-white/80 hover:border-white/50'}`}>
              {k === 'all' ? 'All residences' : 'Available now'}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shownTypes.map((t, i) => (
            <Rise key={t.label} delay={(i % 3) * 0.07}>
              <a href="#units" className="group relative block aspect-[4/5] overflow-hidden rounded-[20px]">
                <div className="absolute inset-0 transition-transform duration-[1200ms] group-hover:scale-105"><MediaFill image={pick(pool, i + 4)} /></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-[12px] text-white backdrop-blur">{t.available > 0 ? 'For sale' : 'Sold out'}</span>
                <div className="absolute inset-x-5 bottom-5">
                  <p className="text-[26px] font-medium tracking-[-0.02em] text-white">{t.label}</p>
                  <p className="mt-1 text-[13px] text-white/70">{t.available} available{t.fromLabel ? ` · from ${t.fromLabel}` : ''}</p>
                </div>
              </a>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const numbers = stats.length ? (
    <section className="border-y border-white/10 px-4 py-16 sm:px-8">
      <div className="mx-auto grid max-w-[1400px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-[48px] font-medium leading-none tracking-[-0.04em] text-white sm:text-[60px]"><CountUp value={s.value} /></p>
            <p className="mt-3 text-[13px] text-white/50">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const process = (
    <section className="px-4 py-20 sm:px-8">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-2">
        <div>
          <Eyebrow>Our approach</Eyebrow>
          <H2 className="mt-5">A more personal way to buy</H2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {steps.map((s, i) => (
              <Rise key={s.title} delay={i * 0.05}>
                <p className="text-[12px] tabular-nums" style={{ color: RED }}>{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-2 text-[17px] font-medium text-white">{s.title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-white/55">{s.body}</p>
              </Rise>
            ))}
          </div>
        </div>
        <div className="relative min-h-[420px] overflow-hidden rounded-[24px]"><MediaFill image={pick(pool, 8)} /></div>
      </div>
    </section>
  );

  const faq = (
    <section className="px-4 py-20 sm:px-8">
      <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-2">
        <div><Eyebrow>Questions</Eyebrow><H2 className="mt-5">Before you visit</H2></div>
        <Accordion items={propertyFaq(property)} variant="line" onDark />
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="tpl-headings min-h-screen text-white" style={{ background: GROUND, '--tpl-accent': 'var(--brand-custom, #ef3b2d)', '--tpl-accent-on': 'var(--brand-custom-on, #ffffff)' } as React.CSSProperties}>
      <StudioNav variant="aurevant" property={property} ctaLabel={cta} />

      <header className="relative flex min-h-[100svh] items-center overflow-hidden">
        <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
        {p.overlay !== false && <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10" />}
        <div className="relative mx-auto w-full max-w-[1400px] px-5 pt-24 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }} className="max-w-2xl">
            <Eyebrow>{place || 'Residences'}</Eyebrow>
            <h1 className="mt-5 text-[46px] font-medium leading-[1.02] tracking-[-0.035em] text-white sm:text-[80px]">{property.name}</h1>
            <p className="mt-6 line-clamp-3 max-w-lg text-[16px] leading-relaxed text-white/80">{heroLede(property)}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#units" className="rounded-full px-6 py-3.5 text-[13.5px] font-medium text-[var(--tpl-accent-on)]" style={{ background: RED }}>Explore residences</a>
              <a href="#booking" className="rounded-full border border-white/35 px-6 py-3.5 text-[13.5px] text-white backdrop-blur-sm">{cta}</a>
            </div>
          </motion.div>
        </div>
        <motion.a
          href="#units"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.35, ease: EASE }}
          className="absolute bottom-24 right-5 hidden items-center gap-3 rounded-[16px] border border-white/15 bg-black/45 p-2.5 pr-5 backdrop-blur-xl sm:right-10 md:flex"
        >
          <span className="relative h-16 w-20 overflow-hidden rounded-[10px]"><MediaFill image={pick(pool, 1)} /></span>
          <span>
            <span className="block text-[11px] text-white/55">Signature residence</span>
            <span className="block text-[16px] font-medium text-white">{types[types.length - 1]?.label ?? property.name}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[12px] text-white/70"><MapPin size={11} style={{ color: RED }} /> {place || property.name}</span>
          </span>
          <ArrowUpRight size={16} className="ml-2 text-white/70" />
        </motion.a>
        <div className="pointer-events-none absolute inset-x-0 -bottom-[0.18em] px-4">
          <Wordmark text={property.name.toLowerCase()} className="font-medium leading-[0.8] tracking-[-0.05em] text-white" />
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-20 sm:px-10 sm:py-28'}
        after={{ overview: featured, gallery: collection, tours: numbers, units: process, location: faq }}
      />

      <section className="px-4 pb-16 sm:px-8">
        <div className="relative mx-auto flex min-h-[480px] max-w-[1400px] items-center justify-center overflow-hidden rounded-[28px] px-6 text-center">
          <MediaFill video={videos[1]} image={pick(pool, 9)} />
          <div className="absolute inset-0 bg-black/60" />
          <Rise className="relative max-w-2xl">
            <h2 className="text-[36px] font-medium leading-[1.06] tracking-[-0.03em] text-white sm:text-[58px]">Find a place that feels entirely yours</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-white/70">Visit in person or join a live guided tour from anywhere.</p>
            <a href="#booking" className="mt-8 inline-block rounded-full px-7 py-3.5 text-[14px] font-medium text-[var(--tpl-accent-on)]" style={{ background: RED }}>{cta}</a>
          </Rise>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 pt-14 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark />
        </div>
        <Wordmark text={property.name.toLowerCase()} className="mt-10 pb-4 font-medium tracking-[-0.05em] text-white/10" />
      </footer>
    </div>
  );
}
