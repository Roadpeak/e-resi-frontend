'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Plus } from 'lucide-react';
import type { KitStyle } from '../kit';
import { StudioNav } from './StudioNav';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, CountUp, EASE, FooterColumns, MediaFill, Rise,
  buyerSteps, heroLede, imagePool, pick, placeOf, propertyFaq, statement, studioStats, unitTypes, videoPool,
} from './primitives';

/**
 * Real — quiet, precise, editorial. A full-bleed photograph with only a thin
 * row of facts across the top; a two-line grey/black heading beside a
 * paragraph; residences listed two-up with small corner ticks over the
 * address line; a grey collage band; a dark bento of reasons; small type
 * everywhere except the figures.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-[10px]', headingKind: 'plain',
  unitsAs: 'table', galleryAs: 'grid', outlined: true,
};

function Heading({ top, bottom, onDark = false }: { top: string; bottom: string; onDark?: boolean }) {
  return (
    <h2 className="text-[30px] font-medium leading-[1.08] tracking-[-0.03em] sm:text-[40px]">
      <span className={onDark ? 'text-white' : 'text-neutral-900'}>{top}</span><br />
      <span className={onDark ? 'text-white/45' : 'text-neutral-400'}>{bottom}</span>
    </h2>
  );
}

/** The corner tick the reference prints above each listing. */
function Tick() {
  return <span aria-hidden="true" className="block h-2.5 w-2.5 border-l border-t border-neutral-400" />;
}

export function RealAgentTemplate(p: StudioTemplateProps) {
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
    <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
      <Heading top={property.name} bottom="The development" />
      <Rise>
        <p className="text-[20px] leading-[1.5] text-neutral-900 sm:text-[24px]">
          {copy('overview').heading?.trim() || statement(property, 3)}
        </p>
      </Rise>
    </div>
  );

  const listings = types.length ? (
    <section className="px-4 pb-20 sm:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-x-4 gap-y-14 md:grid-cols-2">
        {types.map((t, i) => (
          <Rise key={t.label} delay={(i % 2) * 0.06}>
            <a href="#units" className="group block">
              <Tick />
              <p className="mt-3 text-[13px] font-semibold text-neutral-900">{t.label}{place ? `, ${place}` : ''}</p>
              <p className="text-[12px] text-neutral-500">{t.count} homes · {t.available} available</p>
              <p className="text-[12px] text-neutral-500">{t.fromLabel ?? 'Price on request'}</p>
              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-[10px]">
                <div className="absolute inset-0 transition-transform duration-[1200ms] group-hover:scale-[1.03]"><MediaFill image={pick(pool, i + 2)} /></div>
                {t.available > 0 && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded bg-white px-2 py-1 text-[11px] font-medium text-neutral-900">
                    Available <span className="h-1.5 w-1.5 rounded-full bg-[var(--tpl-accent)]" />
                  </span>
                )}
              </div>
            </a>
          </Rise>
        ))}
      </div>
    </section>
  ) : null;

  const collage = (
    <section className="bg-[#f1f2f3] px-4 py-20 sm:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1fr_1fr_2fr]">
        <div>
          <p className="text-[12px] text-neutral-500">Who builds it</p>
          <Heading top="About" bottom={property.developer?.name ?? 'The developer'} />
        </div>
        <p className="text-[15px] font-medium leading-snug text-neutral-900">{heroLede(property)}</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="relative col-span-2 aspect-[4/3] overflow-hidden rounded-[10px]"><MediaFill image={pick(pool, 5)} /></div>
          <div className="relative row-span-2 overflow-hidden rounded-[10px]"><MediaFill image={pick(pool, 6)} /></div>
          <div className="relative aspect-square overflow-hidden rounded-[10px]"><MediaFill image={pick(pool, 7)} /></div>
          <div className="flex aspect-square items-center justify-center text-[13px] font-semibold tracking-[0.3em] text-neutral-900">
            {property.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join(' · ')}
          </div>
        </div>
      </div>
    </section>
  );

  const bento = (
    <section className="bg-[var(--tpl-band)] px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="lg:ml-[33%]">
          <p className="text-[12px] text-white/50">Why buy here</p>
          <Heading top="Why choose" bottom={property.name} onDark />
        </div>
        <div className="mt-12 grid gap-3 md:grid-cols-3">
          <div className="relative min-h-[220px] overflow-hidden rounded-[10px] bg-white p-5">
            <p className="relative z-10 max-w-[12ch] text-[15px] font-medium text-neutral-900">{steps[0]?.title}</p>
            <p className="relative z-10 mt-2 max-w-[28ch] text-[13px] text-neutral-500">{steps[0]?.body}</p>
          </div>
          <div className="relative min-h-[220px] overflow-hidden rounded-[10px]">
            <MediaFill image={pick(pool, 8)} />
            <div className="absolute inset-0 bg-black/40" />
            {stats[0] && (
              <div className="absolute bottom-5 left-5 flex items-end gap-2 text-white">
                <span className="text-[44px] font-medium leading-none tracking-[-0.03em]"><CountUp value={stats[0].value} /></span>
                <span className="pb-1 text-[12px] leading-tight">{stats[0].label}</span>
              </div>
            )}
          </div>
          <div className="relative min-h-[220px] overflow-hidden rounded-[10px] bg-white p-5 md:row-span-2">
            <div className="flex items-start justify-between">
              <p className="max-w-[14ch] text-[15px] font-medium text-neutral-900">Every residence on the market here</p>
              <Plus size={20} className="text-neutral-400" />
            </div>
            <div className="mt-8 space-y-2">
              {[1, 2, 3].map((n, i) => (
                <div key={n} className="relative aspect-[16/7] overflow-hidden rounded-[8px]" style={{ marginLeft: i * 14 }}><MediaFill image={pick(pool, n + 9)} /></div>
              ))}
            </div>
            <a href="#units" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-900">See all residences <ArrowUpRight size={13} /></a>
          </div>
          <div className="min-h-[200px] rounded-[10px] bg-white p-5">
            <p className="text-[15px] font-medium text-neutral-900">{steps[1]?.title}</p>
            <p className="mt-2 text-[13px] text-neutral-500">{steps[1]?.body}</p>
          </div>
          <div className="flex min-h-[200px] flex-col justify-between rounded-[10px] border border-white/15 p-5">
            <p className="text-[15px] font-medium text-white">{steps[2]?.title}</p>
            <p className="text-[13px] text-white/55">{steps[2]?.body}</p>
          </div>
        </div>
      </div>
    </section>
  );

  const faq = (
    <section className="px-4 py-20 sm:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_2fr]">
        <Heading top="Questions" bottom="Answered" />
        <Accordion items={propertyFaq(property)} variant="line" />
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="tpl-headings min-h-screen bg-white" style={{ '--tpl-accent': 'var(--brand-custom, #10b981)', '--tpl-cta': 'var(--brand-custom, #ffffff)', '--tpl-cta-on': 'var(--brand-custom-on, #171717)', '--tpl-band': '#26292c' } as React.CSSProperties}>
      <StudioNav variant="realagent" property={property} ctaLabel={cta} />

      <header className="relative h-[100svh] min-h-[560px] overflow-hidden bg-neutral-200">
        <motion.div initial={{ scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: EASE }} className="absolute inset-0">
          <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
        </motion.div>
        {p.overlay !== false && <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 to-transparent" />}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-6 px-5 pb-8 pt-24 sm:px-8">
            <h1 className="text-[40px] font-medium leading-[1.02] tracking-[-0.035em] text-white sm:text-[64px]">{property.name}</h1>
            <a href="#booking" className="inline-flex items-center gap-2 rounded-full bg-[var(--tpl-cta)] px-5 py-3 text-[13px] font-medium text-[var(--tpl-cta-on)]">{cta} <ArrowUpRight size={14} /></a>
          </div>
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-4 py-20 sm:px-8 sm:py-24'}
        after={{ overview: listings, gallery: collage, units: bento, location: faq }}
      />

      <footer className="border-t border-neutral-200 px-4 pt-14 sm:px-8">
        <div className="mx-auto max-w-[1440px]">
          <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark={false} />
        </div>
      </footer>
    </div>
  );
}
