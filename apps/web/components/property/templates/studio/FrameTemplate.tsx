'use client';

import { ArrowUpRight } from 'lucide-react';
import { KitNav } from '../KitTemplate';
import type { KitStyle } from '../kit';
import { templateFor } from '../../../../lib/branding/templates';
import { PropertyMonogram } from '../../PropertyMonogram';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, CountUp, FooterColumns, HeroSlides, Marquee, MediaFill, Rise, StickySteps, Wordmark,
  buyerSteps, featureWords, imagePool, pick, placeOf, propertyFaq, studioStats, videoPool,
} from './primitives';

/**
 * Frame — a framed, inset hero with a crossfading slideshow (or the hero
 * film) and the development's highlights sliding across it; then a calm
 * off-white page of uppercase headings, a video stats band, pinned buying
 * steps, numbered dark rows, and a closing wordmark.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-none', headingKind: 'plain',
  unitsAs: 'cards', galleryAs: 'grid', outlined: false,
};
const TEMPLATE = templateFor('FRAME');
const GROUND = '#f3f4f1';
const INK = '#1d1d1b';
const DARK = '#2d2a29';

function Heading({ title, sub, light = false }: { title: string; sub?: string; light?: boolean }) {
  return (
    <Rise className="mx-auto mb-14 max-w-3xl text-center">
      <h2
        className="text-[32px] font-bold uppercase leading-[1.08] tracking-[-0.02em] sm:text-[46px]"
        style={{ color: light ? '#fff' : INK, fontFamily: 'var(--tpl-font-heading)' }}
      >
        {title}
      </h2>
      {sub && <p className={`mt-4 text-[15px] ${light ? 'text-white/70' : 'text-neutral-600'}`}>{sub}</p>}
    </Rise>
  );
}

export function FrameTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a viewing';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const words = featureWords(property, 8);
  const stats = studioStats(property).slice(0, 3);
  const faq = propertyFaq(property);
  const steps = buyerSteps(property).slice(0, 3);
  const intro = (property.description || '').split(/(?<=\.)\s/)[0] || property.tagline;

  const overview = (
    <div>
      <Heading
        title={copy('overview').heading?.trim() || property.tagline || property.name}
        sub={copy('overview').body?.trim() || placeOf(property)}
      />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Rise className="flex flex-col justify-between gap-10">
          <p className="text-[22px] font-medium leading-[1.4] text-neutral-900 sm:text-[26px]">
            {property.description}
          </p>
          <div>
            {property.developer?.name && (
              <div className="flex items-center gap-3">
                <PropertyMonogram name={property.developer.name} logoUrl={property.developer.logoUrl} size={52} />
                <div>
                  <p className="text-[12px] uppercase tracking-[0.14em] text-neutral-500">Developed by</p>
                  <p className="text-[15px] font-medium text-neutral-900">{property.developer.name}</p>
                </div>
              </div>
            )}
            <a href="#booking" className="mt-8 inline-flex rounded-full px-6 py-3 text-[14px] font-medium text-white" style={{ background: INK }}>
              {cta}
            </a>
          </div>
        </Rise>
        <Rise delay={0.1}>
          <div className="relative aspect-[4/3] overflow-hidden">
            <MediaFill image={pick(pool, 1)} alt={property.name} />
          </div>
          {property.features?.length > 1 && (
            <div className="mt-5 grid grid-cols-2 gap-6 text-[14px] leading-relaxed text-neutral-600">
              <p>{property.features[0]}</p>
              <p>{property.features[1]}</p>
            </div>
          )}
        </Rise>
      </div>
    </div>
  );

  const statsBand = stats.length ? (
    <section className="relative flex min-h-[86vh] items-end overflow-hidden px-5 pb-14 sm:px-8">
      <MediaFill video={videos[1] ?? videos[0]} image={pick(pool, 2)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="relative mx-auto grid w-full max-w-[1000px] gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Rise key={s.label} delay={i * 0.1}>
            <div className="h-full border border-white/30 bg-black/15 p-5 text-white backdrop-blur-sm">
              <p className="text-[15px]">{s.label}</p>
              <p className="mt-4 text-[40px] font-medium leading-none sm:text-[48px]"><CountUp value={s.value} /></p>
              {s.note && <p className="mt-3 text-[13px] text-white/75">{s.note}</p>}
            </div>
          </Rise>
        ))}
      </div>
    </section>
  ) : null;

  const stepsBlock = (
    <section className="px-5 py-24 sm:px-8 sm:py-32" style={{ background: GROUND }}>
      <div className="mx-auto max-w-[1240px]">
        <Heading title="Simple steps to own a home here" sub="From first look to keys — the whole journey runs through this page." />
        <StickySteps
          steps={steps}
          images={[pick(pool, 3), pick(pool, 4), pick(pool, 5)]}
          activeClass="bg-[#2d2a29] text-white"
          idleClass="bg-white text-neutral-900"
          bodyClass="text-white/75"
        />
      </div>
    </section>
  );

  const rows = [
    property.hasCinematicTour && { title: 'Cinematic tour', body: 'A film of the development, scene by scene.', href: '#tours' },
    property.has3DTour && { title: '3D walkthrough', body: 'Move room to room at your own pace.', href: '#tours' },
    property.hasVRTour && { title: 'VR experience', body: 'Stand inside the home with a headset.', href: '#tours' },
    property.floorPlans?.length && { title: 'Floor plans', body: 'Every layout, measured and drawn.', href: '#floorplans' },
    { title: 'Available units', body: 'Prices and availability, kept current.', href: '#units' },
  ].filter(Boolean) as { title: string; body: string; href: string }[];

  const darkRows = (
    <section className="px-5 py-24 sm:px-8 sm:py-28" style={{ background: DARK }}>
      <div className="mx-auto max-w-[1240px]">
        <Heading light title="Everything you need to decide" sub="See it, measure it, choose it — before it is built." />
        <div className="border-t border-white/10">
          {rows.map((r, i) => (
            <Rise key={r.title} delay={i * 0.05}>
              <div className="grid items-center gap-6 border-b border-white/10 py-10 text-white sm:grid-cols-[80px_1fr_1fr]">
                <p className="text-[24px] text-white/80">{String(i + 1).padStart(2, '0')}</p>
                <p className="text-[32px] font-medium leading-tight sm:text-[40px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>{r.title}</p>
                <div>
                  <p className="text-[15px] text-white/70">{r.body}</p>
                  <a href={r.href} className="mt-4 inline-flex rounded-full bg-white px-5 py-2 text-[13px] font-medium text-neutral-900">Explore</a>
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );

  const faqBlock = (
    <section className="px-5 py-24 sm:px-8 sm:py-28" style={{ background: GROUND }}>
      <div className="mx-auto max-w-[1240px]">
        <Heading title="Answers to common questions" sub="Clear answers to help you decide with confidence." />
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[480px]">
            <MediaFill image={pick(pool, 6)} />
          </div>
          <Accordion items={faq} variant="line" />
        </div>
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="min-h-screen" style={{ background: GROUND, color: INK }}>
      <KitNav property={property} ctaLabel={cta} style={STYLE} template={TEMPLATE} ground="#ffffff" />

      {/* Framed hero */}
      <header className="px-3 pb-3 pt-[84px] sm:px-5">
        <div className="relative h-[calc(100svh-100px)] min-h-[560px] overflow-hidden rounded-[24px] bg-black">
          <HeroSlides property={property} />
          {p.overlay !== false && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />}
          {words.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[22%] mix-blend-difference">
              <Marquee
                items={words}
                speed={36}
                gap="gap-10"
                render={(w) => (
                  <span className="flex items-center gap-10 text-[13vw] font-bold uppercase leading-none tracking-[-0.03em] text-white sm:text-[8vw]">
                    {w}<span className="text-[5vw]">✦</span>
                  </span>
                )}
              />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-6 p-6 sm:p-10">
            <div className="max-w-xl">
              <p className="text-[13px] uppercase tracking-[0.2em] text-white/70">{property.name}</p>
              <p className="mt-2 text-[22px] font-medium leading-snug text-white sm:text-[30px]">{intro}</p>
            </div>
            <a href="#booking" className="rounded-full bg-white px-6 py-3 text-[14px] font-medium text-neutral-900 transition-transform hover:scale-[1.03]">
              {cta}
            </a>
          </div>
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-24 sm:px-8 sm:py-28'}
        after={{ overview: statsBand, units: stepsBlock, tours: darkRows, location: faqBlock }}
      />

      {/* Closing band */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-8">
        <MediaFill image={pick(pool, 7)} />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex min-h-[460px] max-w-[1240px] flex-col justify-between gap-10">
          <h2 className="max-w-2xl text-[34px] font-bold uppercase leading-[1.05] text-white sm:text-[50px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>
            {copy('booking').heading?.trim() || `Make ${property.name} yours`}
          </h2>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-end gap-6">
              <div className="relative hidden h-36 w-48 overflow-hidden sm:block">
                <MediaFill image={pick(pool, 8)} />
              </div>
              <p className="max-w-sm text-[14px] leading-relaxed text-white/85">
                Book a viewing on site or a live guided tour on a video call. The developer’s team will confirm a time with you.
              </p>
            </div>
            <a href="#booking" className="inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3 text-[14px] font-medium text-neutral-900">
              {cta} <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-white px-5 pt-14 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark={false} />
        </div>
        <Wordmark text={property.name.toUpperCase()} className="mt-10 pb-4 font-bold tracking-[-0.04em]" style={{ color: INK, fontFamily: 'var(--tpl-font-heading)' }} />
      </footer>
    </div>
  );
}
