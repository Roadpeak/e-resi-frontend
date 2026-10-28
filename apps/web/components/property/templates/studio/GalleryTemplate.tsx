'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { KitNav } from '../KitTemplate';
import type { KitStyle } from '../kit';
import { KitBooking } from '../kit';
import { templateFor } from '../../../../lib/branding/templates';
import { formatPrice } from '../../../../lib/utils';
import { ChatWithDeveloper } from '../../../chat/ChatWithDeveloper';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, CountUp, EASE, FooterColumns, HeroSlides, Marquee, MediaFill, Rise,
  imagePool, pick, placeOf, propertyFaq, studioStats, videoPool,
} from './primitives';

/**
 * Gallery — the page as a set of soft rounded sheets on pale grey. A huge
 * centred name over the hero with the best available home floating beneath
 * it, champagne-gold buttons, oversized section titles, a neighbourhood tile
 * grid and a contact sheet over photography.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-2xl', headingKind: 'eyebrow',
  unitsAs: 'cards', galleryAs: 'grid', outlined: false,
};
const TEMPLATE = templateFor('GALLERY');
const GROUND = '#f2f2f2';
const GOLD = '#c4a46d';

function BigTitle({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: string }) {
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
      <Rise>
        <p className="text-[14px] text-neutral-500">{eyebrow}</p>
        <h2 className="mt-2 text-[44px] leading-[1] tracking-[-0.03em] text-neutral-900 sm:text-[84px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>{title}</h2>
      </Rise>
      {aside && <p className="max-w-xs text-[14px] leading-relaxed text-neutral-500">{aside}</p>}
    </div>
  );
}

function GoldButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="inline-flex items-center rounded-full px-6 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90" style={{ background: GOLD }}>
      {children}
    </a>
  );
}

export function GalleryTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a viewing';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const stats = studioStats(property).slice(0, 3);
  const featured = (property.units ?? []).find((u) => String(u.status).toLowerCase() === 'available') ?? property.units?.[0];
  const [slide, setSlide] = useState(0);
  const slides = pool.slice(1, 6);

  const overview = (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <Rise>
        <p className="text-[34px] leading-[1.15] tracking-[-0.02em] text-neutral-900 sm:text-[44px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>
          “{copy('overview').heading?.trim() || property.tagline || property.name}”
        </p>
        <p className="mt-8 max-w-lg text-[15px] leading-relaxed text-neutral-500">{property.description}</p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <GoldButton href="#booking">{cta}</GoldButton>
          <ChatWithDeveloper propertySlug={property.slug} label="Ask a question" className="inline-flex" />
        </div>
      </Rise>
      {slides.length > 0 && (
        <Rise delay={0.1}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-4 border-white shadow-sm">
            <AnimatePresence initial={false}>
              <motion.div key={slide} className="absolute inset-0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.6, ease: EASE }}>
                <MediaFill image={slides[slide]} />
              </motion.div>
            </AnimatePresence>
            {slides.length > 1 && (
              <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
                {[{ d: -1, I: ArrowLeft }, { d: 1, I: ArrowRight }].map(({ d, I }) => (
                  <button key={d} type="button" aria-label={d < 0 ? 'Previous' : 'Next'}
                    onClick={() => setSlide((s) => (s + d + slides.length) % slides.length)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/80 text-neutral-900 backdrop-blur hover:bg-white">
                    <I size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Rise>
      )}
    </div>
  );

  const statsCard = stats.length ? (
    <section className="px-2 sm:px-3">
      <div className="relative overflow-hidden rounded-[24px] px-6 py-14 sm:px-12">
        <MediaFill video={videos[1]} image={pick(pool, 2)} />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto max-w-[1240px] text-white">
          <p className="text-[14px] text-white/70">Why {property.name}?</p>
          <h2 className="mt-2 text-[34px] tracking-[-0.02em] sm:text-[54px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>More than a place to live</h2>
          <div className="mt-24 flex flex-wrap justify-end gap-12 border-t border-white/25 pt-10">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-[54px] font-light leading-none sm:text-[72px]"><CountUp value={s.value} /></p>
                <p className="mt-3 text-[14px] text-white/75">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  ) : null;

  const formats = [
    property.hasCinematicTour && 'Cinematic tour', property.has3DTour && '3D walkthrough', property.hasVRTour && 'Virtual reality',
    property.floorPlans?.length && 'Floor plans', 'Live guided tours', 'Drone views',
  ].filter(Boolean) as string[];
  const formatsBand = (
    <section className="px-2 py-6 sm:px-3">
      <div className="relative overflow-hidden rounded-[24px] px-6 py-14 sm:px-12">
        <MediaFill image={pick(pool, 3)} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative text-white">
          <p className="text-[14px] text-white/70">See it your way</p>
          <h2 className="mt-2 text-[34px] sm:text-[52px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>Every way to explore</h2>
          <div className="mt-10 border-t border-white/25 pt-10">
            <Marquee items={formats} speed={28} render={(w) => <span className="text-[26px] font-light text-white/90 sm:text-[34px]">{w} <span className="px-6 text-white/40">·</span></span>} />
          </div>
        </div>
      </div>
    </section>
  );

  const tiles = (property.areaPhotos?.length
    ? property.areaPhotos.map((a, i) => ({ label: a.title || property.amenities?.[i]?.name || placeOf(property), image: a.url }))
    : (property.amenities ?? []).map((a, i) => ({ label: a.name, image: pick(pool, i + 4) }))
  ).slice(0, 6);
  const neighbourhood = tiles.length ? (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-[1240px]">
        <BigTitle eyebrow="The area" title="The neighbourhood" aside={property.areaDescription || undefined} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t, i) => (
            <Rise key={`${t.label}-${i}`} delay={(i % 3) * 0.06}>
              <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"><MediaFill image={t.image} /></div>
                <div className="absolute inset-0 bg-black/30" />
                <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-[20px] text-white">{t.label}</p>
              </div>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const faqBlock = (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <h2 className="text-[40px] leading-[1.05] tracking-[-0.02em] text-neutral-900 sm:text-[56px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>Frequently asked questions</h2>
          <p className="mt-4 max-w-sm text-[14px] text-neutral-500">Ready to buy, or still exploring? Ask — the developer’s team replies quickly.</p>
        </div>
        <Accordion items={propertyFaq(property)} variant="card" />
      </div>
    </section>
  );

  const booking = (
    <div className="relative overflow-hidden rounded-[24px]">
      <MediaFill image={pick(pool, 5)} />
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col justify-between gap-8 text-white">
          <div>
            <h2 className="text-[44px] sm:text-[60px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>Let’s talk</h2>
            <p className="mt-3 max-w-xs text-[15px] text-white/85">Ready when you are. Book a visit or a live guided tour.</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            {[6, 7, 8].map((n) => (
              <div key={n} className="relative h-20 w-28 overflow-hidden rounded-xl border-2 border-white/40"><MediaFill image={pick(pool, n)} /></div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 sm:p-8">
          <KitBooking property={property} style={STYLE} copy={copy('booking')} />
        </div>
      </div>
    </div>
  );

  const blocks = standardBlocks(p, STYLE, { overview, booking });

  return (
    <div className="min-h-screen" style={{ background: GROUND }}>
      <KitNav property={property} ctaLabel={cta} style={STYLE} template={TEMPLATE} ground={GROUND} />

      <header className="px-2 pb-2 pt-[84px] sm:px-3">
        <div className="relative h-[calc(100svh-96px)] min-h-[600px] overflow-hidden rounded-[28px] bg-black">
          <HeroSlides property={property} />
          {p.overlay !== false && <div className="absolute inset-0 bg-black/35" />}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }}
              className="text-[14vw] leading-[0.95] tracking-[-0.04em] sm:text-[9vw]" style={{ fontFamily: 'var(--tpl-font-heading)' }}
            >
              {property.name}
            </motion.h1>
            {property.tagline && <p className="mt-4 text-[17px] text-white/85 sm:text-[20px]">{property.tagline}</p>}
          </div>
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
              className="absolute bottom-5 left-1/2 flex w-[min(560px,calc(100%-24px))] -translate-x-1/2 items-stretch gap-3 rounded-2xl bg-white p-3"
            >
              <div className="flex flex-1 flex-col justify-between p-2">
                <div>
                  <p className="text-[15px] font-medium text-neutral-900">{featured.name}</p>
                  <p className="text-[13px] text-neutral-500">{placeOf(property)}</p>
                  {featured.price > 0 && <p className="mt-1 text-[14px] text-neutral-900">{formatPrice(featured.price, property.currency)}</p>}
                </div>
                <div className="mt-3"><GoldButton href="#units">View homes</GoldButton></div>
              </div>
              <div className="relative w-[44%] overflow-hidden rounded-xl">
                <MediaFill image={pick(pool, 1)} />
                <span className="absolute right-2 top-2 rounded-full bg-white px-2.5 py-1 text-[11px] text-neutral-900">
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />Available
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={(id) => (id === 'units' || id === 'gallery'
          ? 'mx-2 my-6 rounded-[24px] bg-white px-5 py-20 sm:mx-3 sm:px-8'
          : 'px-5 py-24 sm:px-8')}
        after={{ overview: statsCard, tours: formatsBand, location: neighbourhood, floorplans: faqBlock }}
      />

      <footer className="px-2 pb-2 sm:px-3">
        <div className="relative overflow-hidden rounded-[24px] px-6 pb-8 pt-16 sm:px-12">
          <MediaFill image={pick(pool, 9)} />
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative mx-auto max-w-[1240px]">
            <div className="mb-12 flex flex-wrap items-center justify-between gap-6">
              <h2 className="text-[30px] text-white sm:text-[40px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>Stay close to {property.name}</h2>
              <a href="#booking" className="inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-[14px] font-medium text-white" style={{ background: GOLD }}>
                {cta} <ArrowUpRight size={15} />
              </a>
            </div>
            <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark />
          </div>
        </div>
      </footer>
    </div>
  );
}
