'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Plus, X } from 'lucide-react';
import { KitNav } from '../KitTemplate';
import type { KitStyle } from '../kit';
import { templateFor } from '../../../../lib/branding/templates';
import { PropertyMonogram } from '../../PropertyMonogram';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, CountUp, EASE, FooterColumns, Marquee, MediaFill, Rise, ScrollLitText, Wordmark,
  featureWords, imagePool, pick, propertyFaq, studioStats, unitTypes, videoPool,
} from './primitives';

/**
 * Horizon — airy and bright. A rounded inset hero, a paragraph that lights
 * up word by word as it scrolls, a slow marquee of highlights, big unit-type
 * cards, a staggered image grid, an expanding list of home types and a dark
 * footer with the name set enormous over the building.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-2xl', headingKind: 'eyebrow',
  unitsAs: 'cards', galleryAs: 'grid', outlined: false,
};
const TEMPLATE = templateFor('HORIZON');
const INK = '#111111';

function Head({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <Rise className="mb-12">
      <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-neutral-500">{eyebrow}</p>
      <h2 className="mt-2 text-[34px] font-medium leading-[1.1] tracking-[-0.02em] text-neutral-900 sm:text-[46px]">{title}</h2>
    </Rise>
  );
}

export function HorizonTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a visit';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const words = featureWords(property, 10);
  const stats = studioStats(property);
  const types = unitTypes(property);
  const [openType, setOpenType] = useState(0);
  const lead = (property.description || property.tagline || '').split(/\s+/).slice(0, 45).join(' ');

  const overview = (
    <div>
      <ScrollLitText
        text={copy('overview').heading?.trim() || lead}
        className="max-w-4xl text-[28px] font-medium leading-[1.35] tracking-[-0.01em] text-neutral-900 sm:text-[40px]"
      />
      <div className="mt-12 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {property.developer?.name && <PropertyMonogram name={property.developer.name} logoUrl={property.developer.logoUrl} size={48} />}
          <p className="max-w-md text-[14px] leading-relaxed text-neutral-500">
            {property.developer?.name ? `By ${property.developer.name}. ` : ''}{property.tagline}
          </p>
        </div>
        <a href="#units" className="inline-flex items-center gap-2 rounded-full border border-neutral-900 px-5 py-2.5 text-[14px] text-neutral-900 hover:bg-neutral-900 hover:text-white">
          See the homes <ArrowRight size={15} />
        </a>
      </div>
      {words.length > 0 && (
        <Marquee
          className="mt-20 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
          items={words}
          speed={38}
          render={(w) => <span className="text-[30px] font-semibold tracking-[-0.02em] text-neutral-300 sm:text-[40px]">{w}</span>}
        />
      )}
    </div>
  );

  const exclusive = types.length ? (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto max-w-[1240px]">
        <Head eyebrow="Highlights" title="Homes to choose from" />
        <div className="grid gap-6 md:grid-cols-2">
          {types.slice(0, 2).map((t, i) => {
            const sample = property.units.find((u) => u.bedrooms === t.beds);
            return (
              <Rise key={t.label} delay={i * 0.08}>
                <a href="#units" className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"><MediaFill image={pick(pool, i + 1)} /></div>
                  </div>
                  <div className="mt-5 flex items-baseline justify-between border-b border-neutral-200 pb-4">
                    <p className="text-[22px] text-neutral-900">{t.label}</p>
                    {t.fromLabel && <p className="text-[22px] text-neutral-900">{t.fromLabel}</p>}
                  </div>
                  {sample && (
                    <div className="flex gap-6 pt-3 text-[13px] text-neutral-500">
                      <span>{sample.bedrooms} Bedroom</span><span>{sample.bathrooms} Bathroom</span>{sample.sqm > 0 && <span>{sample.sqm} m²</span>}
                    </div>
                  )}
                </a>
              </Rise>
            );
          })}
        </div>
      </div>
    </section>
  ) : null;

  const highlights = (property.features ?? []).slice(0, 4);
  const staggered = highlights.length ? (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto max-w-[1240px]">
        <Head eyebrow="Exceptional living" title={`The art of living at ${property.name}`} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => {
            const text = (
              <div className={i % 2 ? 'pb-4' : 'pt-4'}>
                <p className="text-[18px] text-neutral-900">{h}</p>
                {property.unitFeatures?.[i] && <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">{property.unitFeatures[i]}</p>}
              </div>
            );
            const img = <div className="relative aspect-[4/5] overflow-hidden rounded-2xl"><MediaFill image={pick(pool, i + 3)} /></div>;
            return (
              <Rise key={h} delay={i * 0.08} className="flex flex-col">
                {i % 2 ? <>{text}{img}</> : <>{img}{text}</>}
              </Rise>
            );
          })}
        </div>
      </div>
    </section>
  ) : null;

  const numbers = stats.length ? (
    <section className="px-5 py-16 sm:px-10">
      <div className="mx-auto grid max-w-[1240px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Rise key={s.label}>
            <p className="text-[48px] font-medium leading-none tracking-[-0.03em] text-neutral-900 sm:text-[60px]"><CountUp value={s.value} /></p>
            <p className="mt-4 text-[17px] text-neutral-900">{s.label}</p>
            {s.note && <p className="mt-1 text-[14px] text-neutral-500">{s.note}</p>}
          </Rise>
        ))}
      </div>
    </section>
  ) : null;

  const band = (
    <section className="px-3">
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden rounded-[24px] px-6 text-center">
        <MediaFill video={videos[1] ?? videos[0]} image={pick(pool, 6)} />
        <div className="absolute inset-0 bg-black/25" />
        <Rise className="relative">
          <h2 className="mx-auto max-w-3xl text-[32px] font-medium leading-[1.2] text-white sm:text-[48px]">
            {property.tagline || `Experience ${property.name}`}
          </h2>
          <a href="#booking" className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/15 px-6 py-3 text-[14px] text-white backdrop-blur-md hover:bg-white/25">
            Book an appointment <ArrowRight size={15} />
          </a>
        </Rise>
      </div>
    </section>
  );

  const typeList = types.length ? (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto max-w-[1240px]">
        <Head eyebrow="Home types" title="Find the layout that fits" />
        <div className="border-t border-neutral-200">
          {types.map((t, i) => {
            const open = openType === i;
            return (
              <div key={t.label} className="border-b border-neutral-200 py-6">
                <button type="button" onClick={() => setOpenType(open ? -1 : i)} className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-start gap-4 text-left sm:grid-cols-[150px_1fr_1.2fr_auto]">
                  <span className="hidden items-center gap-2 text-[15px] text-neutral-900 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />Residential</span>
                  <span className="text-[19px] text-neutral-900">{t.label}</span>
                  <span className="hidden text-[14px] text-neutral-500 sm:block">
                    {t.count} home{t.count === 1 ? '' : 's'} · {t.available} available{t.fromLabel ? ` · from ${t.fromLabel}` : ''}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">{open ? <X size={14} /> : <Plus size={14} />}</span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
                      <div className="grid gap-4 pt-6 sm:ml-[150px] sm:grid-cols-[2fr_1fr]">
                        <div className="relative aspect-[16/10] overflow-hidden rounded-xl"><MediaFill image={pick(pool, i + 2)} /></div>
                        <div className="relative aspect-[3/4] overflow-hidden rounded-xl sm:aspect-auto"><MediaFill image={pick(pool, i + 5)} /></div>
                        <a href="#units" className="justify-self-start rounded-full border border-neutral-900 px-5 py-2.5 text-[14px] text-neutral-900 hover:bg-neutral-900 hover:text-white sm:col-span-2">
                          View available {t.label.toLowerCase()} homes
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  ) : null;

  const faqBlock = (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-2">
        <h2 className="text-[34px] font-medium leading-[1.15] tracking-[-0.02em] text-neutral-900 sm:text-[46px]">Everything you need to know</h2>
        <Accordion items={propertyFaq(property)} variant="circle" />
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="min-h-screen bg-white" style={{ color: INK }}>
      <KitNav property={property} ctaLabel={cta} style={STYLE} template={TEMPLATE} ground="#ffffff" />

      <header className="px-3 pb-3 pt-[84px]">
        <div className="relative flex h-[calc(100svh-96px)] min-h-[560px] items-center overflow-hidden rounded-[24px] bg-neutral-800">
          <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
          {p.overlay !== false && <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />}
          <div className="relative mx-auto w-full max-w-[1240px] px-6 sm:px-10">
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}
              className="max-w-2xl text-[46px] font-medium leading-[1.08] tracking-[-0.02em] text-white sm:text-[68px]">
              {property.tagline || property.name}
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-5 max-w-md text-[16px] leading-relaxed text-white/85">
              {(property.description || '').split(/(?<=\.)\s/)[0]}
            </motion.p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#booking" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-medium text-neutral-900">{cta} <ArrowRight size={15} /></a>
              <a href="#tours" className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 py-3 text-[14px] text-white backdrop-blur-md">Explore the tours <ArrowDown size={15} /></a>
            </div>
          </div>
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-20 sm:px-10 sm:py-24'}
        after={{ overview: exclusive, gallery: staggered, units: numbers, tours: band, floorplans: typeList, location: faqBlock }}
      />

      <footer className="px-3 pb-3">
        <div className="relative overflow-hidden rounded-[24px] bg-[#1c1c1c] px-6 pt-16 sm:px-10">
          <div className="relative mx-auto max-w-[1240px]">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <h2 className="max-w-md text-[34px] font-medium leading-[1.15] text-white sm:text-[44px]">Making {property.name} yours, effortlessly</h2>
              <a href="#booking" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-medium text-neutral-900">{cta} <ArrowRight size={15} /></a>
            </div>
            <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark />
          </div>
          <div className="relative -mx-6 mt-10 h-[38vw] max-h-[420px] min-h-[200px] overflow-hidden sm:-mx-10">
            <MediaFill image={pick(pool, 7)} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c1c] via-[#1c1c1c]/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0">
              <Wordmark text={property.name} className="font-semibold tracking-[-0.04em] text-white/85" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
