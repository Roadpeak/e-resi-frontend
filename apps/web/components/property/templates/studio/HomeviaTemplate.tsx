'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Eye, MapPin } from 'lucide-react';
import type { KitStyle } from '../kit';
import { StudioNav } from './StudioNav';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, CountUp, EASE, FooterColumns, MediaFill, Rise, Wordmark,
  buyerSteps, heroLede, imagePool, pick, placeOf, propertyFaq, statement, studioStats, unitTypes, videoPool,
} from './primitives';

/**
 * Homevia — warm and quiet. The development's name runs enormous and
 * translucent behind the hero photograph; a short line sits bottom-left and a
 * stack of glass thumbnails with a residence card sits bottom-right. Below,
 * a centred two-tone statement, figures in soft grey tiles, residence cards
 * with a frosted panel, and a numbered list beside an image.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-2xl', headingKind: 'plain',
  unitsAs: 'cards', galleryAs: 'grid', outlined: false,
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-[12.5px] text-neutral-700">
      <span className="h-1.5 w-1.5 rounded-full bg-[#b08968]" />{children}
    </span>
  );
}

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[34px] font-medium leading-[1.08] tracking-[-0.025em] text-neutral-900 sm:text-[48px] ${className}`}>{children}</h2>;
}

/** Two-tone statement: the middle of the sentence dark, the ends faded. */
function TwoTone({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  const a = Math.floor(words.length * 0.22);
  const b = Math.ceil(words.length * 0.8);
  return (
    <p className="text-[28px] font-medium leading-[1.25] tracking-[-0.02em] sm:text-[42px]">
      <span className="text-neutral-400">{words.slice(0, a).join(' ')} </span>
      <span className="text-neutral-900">{words.slice(a, b).join(' ')} </span>
      <span className="text-neutral-400">{words.slice(b).join(' ')}</span>
    </p>
  );
}

export function HomeviaTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a visit';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const stats = studioStats(property);
  const types = unitTypes(property);
  const steps = buyerSteps(property);
  const place = placeOf(property);

  const overview = (
    <div className="mx-auto max-w-4xl text-center">
      <Tag>About {property.name}</Tag>
      <Rise className="mt-8"><TwoTone text={copy('overview').heading?.trim() || statement(property)} /></Rise>
      <div className="mt-10 flex justify-center gap-3">
        {[1, 2, 3].map((n, i) => (
          <Rise key={n} delay={i * 0.08}>
            <div className="relative h-24 w-36 overflow-hidden rounded-xl sm:h-28 sm:w-44"><MediaFill image={pick(pool, n)} /></div>
          </Rise>
        ))}
      </div>
    </div>
  );

  const impact = stats.length ? (
    <section className="px-5 pb-20 sm:px-10">
      <div className="mx-auto max-w-[1240px] text-center">
        <Tag>At a glance</Tag>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Rise key={s.label} delay={i * 0.06}>
              <div className="rounded-2xl bg-[#f4f3f1] px-6 py-10">
                <p className="text-[40px] font-medium leading-none tracking-[-0.03em] text-neutral-900 sm:text-[48px]"><CountUp value={s.value} /></p>
                <p className="mt-3 text-[13px] text-neutral-500">{s.label}</p>
              </div>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const residences = types.length ? (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Tag>Residences</Tag>
            <H2 className="mt-5">Explore exceptional<br />living spaces</H2>
          </div>
          <p className="max-w-xs text-[14px] leading-relaxed text-neutral-500">Every home type at {property.name}, with what is available today.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {types.slice(0, 6).map((t, i) => (
            <Rise key={t.label} delay={(i % 3) * 0.07}>
              <a href="#units" className="group relative block aspect-[4/5] overflow-hidden rounded-2xl">
                <div className="absolute inset-0 transition-transform duration-[1200ms] group-hover:scale-105"><MediaFill image={pick(pool, i + 4)} /></div>
                <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/80 p-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[18px] font-medium text-neutral-900">{t.label}</p>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-900"><ArrowUpRight size={15} /></span>
                  </div>
                  {place && <p className="mt-1 flex items-center gap-1 text-[12.5px] text-neutral-600"><MapPin size={12} /> {place}</p>}
                  <div className="mt-3 flex items-center justify-between border-t border-neutral-900/10 pt-3">
                    <span className="flex items-center gap-1.5 text-[12.5px] text-neutral-600"><Eye size={13} /> {t.available} available</span>
                    <span className="text-[17px] font-medium text-neutral-900">{t.fromLabel ?? 'On request'}</span>
                  </div>
                </div>
              </a>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const approach = (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-2">
        <div>
          <Tag>Our approach</Tag>
          <ol className="mt-8">
            {steps.map((s, i) => (
              <li key={s.title} className="flex items-baseline justify-between gap-6 border-b border-neutral-200 py-5">
                <span className={`text-[26px] tracking-[-0.02em] sm:text-[30px] ${i === 0 ? 'text-neutral-900' : 'text-neutral-400'}`}>{s.title}</span>
                <span className="text-[12px] tabular-nums text-neutral-400">{String(i + 1).padStart(2, '0')}</span>
              </li>
            ))}
          </ol>
        </div>
        <Rise>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><MediaFill image={pick(pool, 8)} /></div>
          <p className="mt-6 text-[17px] font-medium text-neutral-900">{steps[0]?.title}</p>
          <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-neutral-500">{steps.map((s) => s.body).slice(0, 2).join(' ')}</p>
        </Rise>
      </div>
    </section>
  );

  const faq = (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto max-w-3xl text-center">
        <Tag>FAQ</Tag>
        <H2 className="mt-5">Frequently asked</H2>
      </div>
      <div className="mx-auto mt-10 max-w-3xl"><Accordion items={propertyFaq(property)} variant="line" /></div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="min-h-screen bg-white">
      <StudioNav variant="homevia" property={property} ctaLabel={cta} />

      <header className="relative min-h-[100svh] overflow-hidden bg-[#8a776a]">
        <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
        {p.overlay !== false && <div className="absolute inset-0 bg-gradient-to-b from-[#6b5546]/55 via-transparent to-black/55" />}
        {/* The name, huge and translucent, behind everything below it. */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: EASE }}
          className="pointer-events-none absolute inset-x-0 top-[72px] px-4"
        >
          <Wordmark text={property.name} className="font-medium tracking-[-0.05em] text-white/35" />
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-8 px-5 pb-10 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease: EASE }} className="max-w-sm">
            <p className="text-[15px] leading-relaxed text-white/90">{heroLede(property)}</p>
            <a href="#booking" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[13px] font-medium text-neutral-900">{cta} <ArrowUpRight size={14} /></a>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.35, ease: EASE }} className="hidden w-[260px] space-y-2 sm:block">
            {[1, 2].map((n) => (
              <div key={n} className="relative h-[110px] overflow-hidden rounded-xl border-2 border-white/40"><MediaFill image={pick(pool, n)} /></div>
            ))}
            <div className="rounded-xl bg-white p-3.5">
              <p className="text-[14px] font-medium text-neutral-900">{property.name}</p>
              {place && <p className="text-[12px] text-neutral-500">{place}</p>}
              <a href="#units" className="mt-3 block rounded-lg bg-neutral-900 py-2.5 text-center text-[13px] text-white">Explore residences</a>
            </div>
          </motion.div>
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-20 sm:px-10 sm:py-28'}
        after={{ overview: impact, gallery: residences, units: approach, location: faq }}
      />

      <section className="px-5 pb-20 sm:px-10">
        <div className="relative mx-auto flex min-h-[460px] max-w-[1240px] items-end overflow-hidden rounded-2xl p-8 sm:p-12">
          <MediaFill video={videos[1]} image={pick(pool, 9)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
          <Rise className="relative max-w-lg">
            <h2 className="text-[34px] font-medium leading-[1.1] tracking-[-0.025em] text-white sm:text-[48px]">Find your place at {property.name}</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#booking" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-[13px] font-medium text-neutral-900">{cta} <ArrowUpRight size={14} /></a>
              <a href="#units" className="rounded-lg border border-white/40 px-5 py-3 text-[13px] text-white">Residences</a>
            </div>
          </Rise>
        </div>
      </section>

      <footer className="bg-[#f4f3f1] px-5 pt-14 sm:px-10">
        <div className="mx-auto max-w-[1240px]">
          <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark={false} />
        </div>
        <Wordmark text={property.name} className="mt-10 pb-4 font-medium tracking-[-0.05em] text-neutral-300" />
      </footer>
    </div>
  );
}
