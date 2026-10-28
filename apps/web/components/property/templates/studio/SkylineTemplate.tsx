'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Bath, BedDouble, Building2, ChevronDown, Home, MapPin, MessageCircle, Ruler, Star } from 'lucide-react';
import type { KitStyle } from '../kit';
import { formatPrice } from '../../../../lib/utils';
import { StudioNav } from './StudioNav';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  CountUp, EASE, FooterColumns, Hotspots, MediaFill, Rise,
  buyerSteps, featureWords, imagePool, pick, placeOf, propertyFaq, shortLine, heroLede, studioStats, unitTypes, videoPool,
} from './primitives';

/**
 * Skyline — crisp and modern. An inset film hero with a floating
 * availability card, a featured-home split card, a dark "how it works"
 * band with a pinned image, an image-switching accordion, a bento of home
 * types and an annotated photograph of the development's highlights.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-md', headingKind: 'eyebrow',
  unitsAs: 'cards', galleryAs: 'grid', outlined: true,
};
const ORANGE = '#e5793a';

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`flex items-center gap-2 text-[13px] uppercase tracking-[0.06em] ${light ? 'text-white/70' : 'text-neutral-600'}`}><span className="text-[10px]">✳</span>{children}</p>;
}
function H2({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <h2 className={`mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[40px] ${light ? 'text-white' : 'text-neutral-900'}`} style={{ fontFamily: 'var(--tpl-font-heading)' }}>{children}</h2>;
}

export function SkylineTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a viewing';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const stats = studioStats(property).slice(0, 3);
  const types = unitTypes(property);
  const steps = buyerSteps(property).slice(0, 3);
  const sample = property.units?.[0];
  const status = property.status === 'OFF_PLAN' ? 'Off-plan' : 'For sale';
  const [service, setService] = useState(0);
  const services = (property.features ?? []).slice(0, 5).map((f, i) => ({ title: f, body: property.unitFeatures?.[i] ?? '' }));
  const statIcons = [Home, Star, Building2];

  const overview = (
    <div className="space-y-24">
      <div className="grid overflow-hidden rounded-md border border-neutral-200 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative aspect-[16/11] lg:aspect-auto lg:min-h-[460px]">
          <MediaFill image={pick(pool, 1)} />
          <div className="absolute left-3 top-3 flex gap-2">
            <span className="rounded-sm bg-neutral-900/70 px-2.5 py-1 text-[12px] text-white backdrop-blur">{String(property.category ?? 'Residential').replace(/_/g, ' ').toLowerCase()}</span>
            <span className="rounded-sm bg-neutral-900/70 px-2.5 py-1 text-[12px] text-white backdrop-blur">Featured</span>
          </div>
        </div>
        <div className="flex flex-col p-6 sm:p-8">
          <p className="flex items-center gap-1.5 text-[13px] text-neutral-500"><MapPin size={14} />{placeOf(property)}</p>
          <h3 className="mt-3 text-[26px] font-semibold leading-tight text-neutral-900" style={{ fontFamily: 'var(--tpl-font-heading)' }}>
            {copy('overview').heading?.trim() || shortLine(property) || property.name}
          </h3>
          <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-neutral-500">{property.description}</p>
          <div className="mt-auto flex items-end justify-between pt-8">
            {property.priceFrom ? <p className="text-[30px] font-semibold text-neutral-900">{formatPrice(property.priceFrom, property.currency)}</p> : <span />}
            <span className="rounded-sm px-3 py-1 text-[13px]" style={{ background: '#fde8dc', color: ORANGE }}>{status}</span>
          </div>
          {sample && (
            <div className="mt-6 grid grid-cols-3 divide-x divide-neutral-200 border-t border-neutral-200 pt-5 text-center text-[13px] text-neutral-500">
              <span className="flex flex-col items-center gap-1"><BedDouble size={18} />{sample.bedrooms} Beds</span>
              <span className="flex flex-col items-center gap-1"><Bath size={18} />{sample.bathrooms} Baths</span>
              <span className="flex flex-col items-center gap-1"><Ruler size={18} />{sample.sqm || '—'} m²</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div><Eyebrow>About the development</Eyebrow><H2>{property.name}, built with clarity and care</H2></div>
          <div>
            <p className="text-[15px] leading-relaxed text-neutral-600">{property.areaDescription || property.description}</p>
            <a href="#booking" className="mt-6 inline-flex items-center gap-3 rounded-sm bg-neutral-900 py-1 pl-4 pr-1 text-[13px] text-white">
              {cta} <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-white text-neutral-900"><ArrowUpRight size={14} /></span>
            </a>
          </div>
        </div>
        {stats.length > 0 && (
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {stats.map((s, i) => {
              const Icon = statIcons[i % statIcons.length];
              return (
                <Rise key={s.label} delay={i * 0.07}>
                  <div className="h-full rounded-md bg-[#f6f5f3] p-6">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><Icon size={16} /></span>
                      <div><p className="text-[17px] font-medium text-neutral-900">{s.label}</p><p className="text-[13px] text-neutral-500">{s.note}</p></div>
                    </div>
                    <p className="mt-10 text-[40px] font-medium leading-none text-neutral-900"><CountUp value={s.value} /></p>
                  </div>
                </Rise>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const howItWorks = (
    <section className="bg-[#121212] px-5 py-24 sm:px-10">
      <div className="mx-auto max-w-[1240px]">
        <Eyebrow light>How it works</Eyebrow>
        <H2 light>From first look to your keys, every step is clear</H2>
        <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
              <MediaFill image={pick(pool, 2)} />
              <a href="#booking" className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-sm bg-black/45 p-3 text-white backdrop-blur-md">
                <span className="text-[14px]">Talk with the developer’s team</span>
                <span className="flex items-center gap-1 text-[13px]">Book a call <ArrowUpRight size={14} /></span>
              </a>
            </div>
          </div>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <Rise key={s.title} delay={i * 0.08}>
                <div className="rounded-sm border border-white/10 p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[15px] text-neutral-900">{i + 1}</span>
                  <p className="mt-8 text-[19px] text-white">{s.title}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/55">{s.body}</p>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const serviceBlock = services.length ? (
    <section className="px-5 py-24 sm:px-10">
      <div className="mx-auto max-w-[1240px]">
        <Eyebrow>What you get</Eyebrow>
        <H2>Everything included at {property.name}</H2>
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="border-t-2 border-neutral-900">
            {services.map((s, i) => (
              <div key={s.title} className="border-b border-neutral-200">
                <button type="button" onClick={() => setService(i)} className="flex w-full cursor-pointer items-center justify-between py-5 text-left text-[16px] text-neutral-900">
                  {s.title}<ChevronDown size={18} className={`transition-transform ${service === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {service === i && s.body && (
                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden pb-5 text-[14px] leading-relaxed text-neutral-500">{s.body}</motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-sm">
            <AnimatePresence initial={false}>
              <motion.div key={service} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
                <MediaFill image={pick(pool, service + 3)} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  ) : null;

  const bento = types.length ? (
    <section className="px-5 py-24 sm:px-10">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><Eyebrow>Home types</Eyebrow><H2>Explore by what you need</H2></div></div>
        <div className="mt-12 grid auto-rows-[220px] gap-3 sm:grid-cols-3">
          {types.slice(0, 4).map((t, i) => (
            <a key={t.label} href="#units" className={`group relative overflow-hidden rounded-sm ${i === 0 ? 'sm:row-span-2' : ''} ${i === 3 ? 'sm:col-span-2' : ''}`}>
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"><MediaFill image={pick(pool, i + 4)} /></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-sm bg-white text-neutral-900"><ArrowUpRight size={14} /></span>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-[18px]">{t.label}</p>
                <p className="text-[13px] text-white/75">{t.available} available{t.fromLabel ? ` · from ${t.fromLabel}` : ''}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const labels = featureWords(property, 6);
  const corners = labels.length ? (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto max-w-[1240px]">
        <Eyebrow>Take a look around</Eyebrow>
        <H2>Explore every corner</H2>
        <div className="mt-10"><Hotspots image={pick(pool, 0)} labels={labels} /></div>
      </div>
    </section>
  ) : null;

  const faq = propertyFaq(property);
  const [openFaq, setOpenFaq] = useState(0);
  const faqBlock = (
    <section className="px-5 py-24 sm:px-10">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div><Eyebrow>FAQs</Eyebrow><H2>Common questions answered</H2></div>
        <div className="border-t border-neutral-200">
          {faq.map((f, i) => (
            <div key={f.q} className="border-b border-neutral-200">
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="flex w-full cursor-pointer items-center justify-between py-5 text-left text-[15px] text-neutral-900">
                {f.q}<ChevronDown size={18} className={`shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}
                    className="overflow-hidden pb-5 text-[14px] leading-relaxed text-neutral-500">{f.a}</motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="min-h-screen bg-white">
      <StudioNav variant="skyline" property={property} ctaLabel={cta} />

      <header className="px-3 pb-3 pt-[68px] sm:px-4">
        <div className="relative flex h-[calc(100svh-84px)] min-h-[560px] items-end overflow-hidden rounded-[14px] bg-neutral-800">
          <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
          {p.overlay !== false && <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />}
          <div className="relative flex w-full flex-wrap items-end justify-between gap-6 p-6 sm:p-10">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }} className="max-w-2xl">
              <h1 className="text-[40px] font-bold leading-[1.08] tracking-[-0.02em] text-white sm:text-[60px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>
                {property.name}
              </h1>
              <p className="mt-4 line-clamp-3 max-w-lg text-[15px] leading-relaxed text-white/85">{heroLede(property)}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#units" className="inline-flex items-center gap-3 rounded-sm bg-white py-1 pl-4 pr-1 text-[13px] text-neutral-900">
                  View homes <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-neutral-900 text-white"><ArrowUpRight size={14} /></span>
                </a>
                <a href="#booking" className="inline-flex items-center gap-3 rounded-sm border border-white/60 py-1 pl-4 pr-1 text-[13px] text-white">
                  Talk to the team <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-white/15"><MessageCircle size={14} /></span>
                </a>
              </div>
            </motion.div>
            {property.availableUnits > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: EASE }}
                className="flex items-center gap-4 rounded-md bg-white p-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white"><MediaFill image={pick(pool, n)} /></div>
                  ))}
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-neutral-900">{property.availableUnits}+</p>
                  <p className="text-[13px] text-neutral-500">homes available</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-20 sm:px-10 sm:py-24'}
        after={{ units: howItWorks, gallery: serviceBlock, floorplans: bento, tours: corners, location: faqBlock }}
      />

      <footer className="px-5 pb-10 sm:px-10">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-sm bg-[#f3f3f3] px-6 py-8 sm:px-10">
            <div>
              <p className="text-[22px] font-semibold text-neutral-900" style={{ fontFamily: 'var(--tpl-font-heading)' }}>See {property.name} for yourself</p>
              <p className="mt-1 text-[14px] text-neutral-500">Book a site visit or a live guided tour on a video call.</p>
            </div>
            <a href="#booking" className="rounded-sm bg-neutral-900 px-7 py-3 text-[14px] text-white">{cta}</a>
          </div>
          <div className="pt-14"><FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark={false} /></div>
        </div>
      </footer>
    </div>
  );
}
