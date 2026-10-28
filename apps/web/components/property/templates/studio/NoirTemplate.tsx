'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { KitNav } from '../KitTemplate';
import type { KitStyle } from '../kit';
import { templateFor } from '../../../../lib/branding/templates';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, CountUp, EASE, FooterColumns, Marquee, MediaFill, ParallaxImage, Rise, Wordmark,
  buyerSteps, imagePool, pick, propertyFaq, heroLede, studioStats, unitTypes, videoPool,
} from './primitives';

/**
 * Noir — black and white with heavy grotesque type. A dark interior hero,
 * a statement paragraph, a ruled row of figures, two-up residence tiles,
 * two marquee rows running in opposite directions and a black footer with
 * the name in enormous italic capitals.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-none', headingKind: 'plain',
  unitsAs: 'cards', galleryAs: 'grid', outlined: false,
};
const NAV_STYLE: KitStyle = { ...STYLE, onDark: true };
const TEMPLATE = templateFor('NOIR');

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[36px] font-medium leading-[1.08] tracking-[-0.03em] sm:text-[48px] ${className}`}>{children}</h2>;
}

export function NoirTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a viewing';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const stats = studioStats(property);
  const types = unitTypes(property);
  const steps = buyerSteps(property);

  const overview = (
    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <Rise>
        <p className="text-[24px] font-medium leading-[1.4] tracking-[-0.01em] text-neutral-900 sm:text-[30px]">
          {copy('overview').heading?.trim() || property.description}
        </p>
        <a href="#units" className="mt-10 inline-block bg-black px-6 py-3 text-[13px] text-white">See the residences</a>
      </Rise>
      <Rise delay={0.1}><div className="relative aspect-[4/5] overflow-hidden"><MediaFill image={pick(pool, 1)} /></div></Rise>
    </div>
  );

  const figures = stats.length ? (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto grid max-w-[1400px] sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`py-6 sm:px-8 ${i ? 'lg:border-l lg:border-neutral-200' : 'sm:pl-0'}`}>
            <p className="text-[54px] font-medium leading-none tracking-[-0.04em] text-neutral-900 sm:text-[64px]"><CountUp value={s.value} /></p>
            <p className="mt-3 text-[13px] text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const residences = types.length ? (
    <section className="px-5 py-16 sm:px-10">
      <div className="mx-auto max-w-[1400px]">
        <H2 className="mb-10 text-neutral-900">Residences</H2>
        <div className="grid gap-x-3 gap-y-12 md:grid-cols-2">
          {types.map((t, i) => (
            <Rise key={t.label} delay={(i % 2) * 0.08}>
              <a href="#units" className="group block">
                <div className="relative aspect-square overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-[1200ms] group-hover:scale-105"><MediaFill image={pick(pool, i + 2)} /></div>
                </div>
                <div className="mt-3 flex items-baseline justify-between border-b border-neutral-300 pb-2">
                  <p className="text-[18px] text-neutral-900">{t.label}</p>
                  <p className="text-[13px] text-neutral-500">{t.fromLabel ? `from ${t.fromLabel}` : `${t.available} available`}</p>
                </div>
              </a>
            </Rise>
          ))}
        </div>
        <div className="mt-16"><ParallaxImage src={pick(pool, 6)} className="aspect-[16/8] w-full" strength={70} /></div>
      </div>
    </section>
  ) : null;

  const howWeWork = (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-2">
        <div>
          <H2 className="text-neutral-900">How it works</H2>
          <div className="mt-10 space-y-6">
            {steps.map((s) => (
              <Rise key={s.title}>
                <p className="text-[19px] text-neutral-900">{s.title}</p>
                <p className="mt-1 max-w-md text-[16px] leading-relaxed text-neutral-500">{s.body}</p>
              </Rise>
            ))}
          </div>
        </div>
        <Rise delay={0.1}><div className="relative aspect-[4/5] overflow-hidden lg:ml-auto lg:w-[80%]"><MediaFill image={pick(pool, 7)} /></div></Rise>
      </div>
    </section>
  );

  const included = [...(property.unitFeatures ?? []), ...(property.features ?? [])].slice(0, 12);
  const card = (text: string) => (
    <div className="w-[300px] bg-[#f2f2f4] p-6">
      <Check size={18} className="text-neutral-900" />
      <p className="mt-8 text-[16px] leading-relaxed text-neutral-900">{text}</p>
      <p className="mt-6 text-[13px] text-neutral-500">{property.name}</p>
    </div>
  );
  const rows = included.length ? (
    <section className="py-20">
      <div className="mx-auto mb-10 max-w-[1400px] px-5 sm:px-10"><H2 className="text-neutral-900">What every home includes</H2></div>
      <Marquee items={included} speed={60} gap="gap-4" render={(t) => card(t)} />
      <Marquee className="mt-4" items={[...included].reverse()} speed={60} reverse gap="gap-4" render={(t) => card(t)} />
    </section>
  ) : null;

  const faqBlock = (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-2">
        <div>
          <H2 className="text-neutral-900">Frequently asked questions</H2>
          <p className="mt-4 max-w-sm text-[14px] text-neutral-500">Answers to what buyers ask most about {property.name}.</p>
        </div>
        <Accordion items={propertyFaq(property)} variant="line" />
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="min-h-screen bg-white">
      <KitNav property={property} ctaLabel={cta} style={NAV_STYLE} template={TEMPLATE} ground="#0a0a0a" />

      <header className="relative flex min-h-[100svh] items-end overflow-hidden bg-black">
        <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
        {p.overlay !== false && <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/30" />}
        <div className="relative mx-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-8 px-5 pb-10 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }}>
            <h1 className="max-w-3xl text-[48px] font-bold leading-[1] tracking-[-0.04em] text-white sm:text-[80px]">{property.name}</h1>
            <p className="mt-6 line-clamp-3 max-w-xl text-[16px] text-white/85">{heroLede(property)}</p>
          </motion.div>
          <div className="flex gap-2">
            <a href="#booking" className="border border-white px-5 py-3 text-[13px] text-white hover:bg-white hover:text-black">{cta}</a>
            <a href="#units" className="bg-white px-5 py-3 text-[13px] text-black">All residences</a>
          </div>
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-20 sm:px-10 sm:py-24'}
        after={{ overview: figures, gallery: residences, units: howWeWork, floorplans: rows, location: faqBlock }}
      />

      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 text-center">
        <MediaFill video={videos[1]} image={pick(pool, 8)} />
        <div className="absolute inset-0 bg-black/60" />
        <Rise className="relative">
          <h2 className="text-[38px] font-medium tracking-[-0.03em] text-white sm:text-[56px]">Make {property.name} home</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-white/75">Book a viewing on site or a live guided tour on a video call.</p>
          <div className="mt-8 flex justify-center gap-2">
            <a href="#booking" className="border border-white px-5 py-3 text-[13px] text-white">{cta}</a>
            <a href="#units" className="bg-white px-5 py-3 text-[13px] text-black">Residences</a>
          </div>
        </Rise>
      </section>

      <footer className="bg-black px-5 pt-16 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark />
        </div>
        <Wordmark text={property.name.toUpperCase()} className="mt-12 pb-6 font-black italic tracking-[-0.05em] text-white" />
      </footer>
    </div>
  );
}
