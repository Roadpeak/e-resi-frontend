'use client';

import { ArrowUpRight, BedDouble, Building2, Check, Compass, Handshake, KeyRound, MapPin, Sparkles, Star } from 'lucide-react';
import { KitNav } from '../KitTemplate';
import type { KitStyle } from '../kit';
import { templateFor } from '../../../../lib/branding/templates';
import { heroFacts, tourBadges } from '../shared';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, CountUp, FooterColumns, MediaFill, Rise, VideoModalButton,
  buyerSteps, imagePool, pick, placeOf, propertyFaq, shortLine, heroLede, studioStats, unitTypes, videoPool,
} from './primitives';

/**
 * Prestige — deep navy and soft white, a serif display face, a film behind
 * the opening headline with the key facts in a glass bar, and the steady
 * agency rhythm: browse by type, figures, why it matters, how it works.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-xl', headingKind: 'eyebrow',
  unitsAs: 'cards', galleryAs: 'grid', outlined: false,
};
const TEMPLATE = templateFor('PRESTIGE');
const NAVY = '#011d41';
const GROUND = '#f5f5f5';

function Ornament() {
  return (
    <div className="mb-3 flex justify-center gap-1.5" aria-hidden>
      {[18, 26, 18].map((h, i) => <span key={i} className="w-px bg-current opacity-40" style={{ height: h }} />)}
    </div>
  );
}

function Title({ eyebrow, title, center = false, light = false }: { eyebrow: string; title: string; center?: boolean; light?: boolean }) {
  return (
    <Rise className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      {center && <Ornament />}
      <p className={`text-[12px] uppercase tracking-[0.18em] ${light ? 'text-white/60' : 'text-neutral-500'}`}>{eyebrow}</p>
      <h2
        className="mt-3 text-[34px] leading-[1.12] sm:text-[48px]"
        style={{ fontFamily: 'var(--tpl-font-heading)', color: light ? '#fff' : '#0f1b2d' }}
      >
        {title}
      </h2>
    </Rise>
  );
}

const ICONS = [Compass, Sparkles, MapPin, Handshake];

export function PrestigeTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a viewing';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const facts = heroFacts(property);
  const badges = tourBadges(property);
  const stats = studioStats(property);
  const types = unitTypes(property);
  const steps = buyerSteps(property);
  const why = [
    ...(property.features ?? []).slice(0, 4).map((f) => ({ title: f, body: '' })),
    ...(property.amenities ?? []).slice(0, 4).map((a) => ({ title: a.name, body: a.distance ? `${a.distance} away` : '' })),
  ].slice(0, 4);

  const overview = (
    <div>
      <Title center eyebrow={`About ${property.name}`} title={copy('overview').heading?.trim() || shortLine(property) || `Life at ${property.name}`} />
      <div className="mt-14 grid items-start gap-8 lg:grid-cols-[1fr_1.2fr_1fr]">
        <Rise className="relative hidden aspect-[3/4] overflow-hidden rounded-xl lg:block"><MediaFill image={pick(pool, 1)} /></Rise>
        <Rise delay={0.08}>
          <p className="text-[16px] leading-[1.75] text-neutral-700">{property.description}</p>
          {property.features?.length > 0 && (
            <>
              <p className="mt-8 text-[20px]" style={{ fontFamily: 'var(--tpl-font-heading)', color: '#0f1b2d' }}>What sets it apart</p>
              <ul className="mt-4 space-y-3">
                {property.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px] text-neutral-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: NAVY }}>
                      <Check size={11} strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </>
          )}
          {stats.length > 1 && (
            <div className="mt-8 grid grid-cols-2 divide-x divide-neutral-300 border-t border-neutral-300 pt-6">
              {stats.slice(0, 2).map((s) => (
                <div key={s.label} className="px-4 first:pl-0">
                  <p className="text-[38px] leading-none" style={{ fontFamily: 'var(--tpl-font-heading)', color: '#0f1b2d' }}><CountUp value={s.value} /></p>
                  <p className="mt-2 text-[13px] text-neutral-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </Rise>
        <Rise delay={0.16} className="relative aspect-[4/3] overflow-hidden rounded-xl lg:mt-24"><MediaFill image={pick(pool, 2)} /></Rise>
      </div>
    </div>
  );

  const byType = types.length ? (
    <section className="px-2 sm:px-3">
      <div className="relative overflow-hidden rounded-2xl px-5 py-20 sm:px-10" style={{ background: NAVY }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#fff 0 1px,transparent 1px 64px)' }} />
        <div className="relative mx-auto max-w-[1240px]">
          <Title center light eyebrow="Find your home" title="Browse homes by type" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {types.slice(0, 4).map((t, i) => (
              <Rise key={t.label} delay={i * 0.07}>
                <a href="#units" className="group flex flex-col items-center rounded-xl border border-white/12 px-6 py-10 text-center text-white transition-colors hover:bg-white/[0.04]">
                  <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[#011d41] transition-transform group-hover:scale-105">
                    {t.beds === 0 ? <Building2 size={30} strokeWidth={1.3} /> : <BedDouble size={30} strokeWidth={1.3} />}
                  </span>
                  <p className="mt-6 text-[22px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>{t.label}</p>
                  <p className="mt-1 text-[13px] text-white/60">
                    {t.available} available{t.fromLabel ? ` · from ${t.fromLabel}` : ''}
                  </p>
                </a>
              </Rise>
            ))}
          </div>
        </div>
      </div>
    </section>
  ) : null;

  const statsBand = stats.length ? (
    <section className="px-2 py-6 sm:px-3">
      <div className="relative overflow-hidden rounded-2xl px-6 py-16 sm:px-12 sm:py-20">
        <MediaFill image={pick(pool, 3)} />
        <div className="absolute inset-0" style={{ background: 'rgba(1,29,65,0.72)' }} />
        <div className="relative mx-auto max-w-[1240px]">
          <h2 className="max-w-xl text-[32px] leading-[1.15] text-white sm:text-[46px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>
            {property.name}, in numbers
          </h2>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="border-l border-white/20 pl-5 text-white">
                <p className="text-[46px] leading-none sm:text-[60px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}><CountUp value={s.value} /></p>
                <p className="mt-3 text-[15px]">{s.label}</p>
                {s.note && <p className="mt-1 text-[13px] text-white/60">{s.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  ) : null;

  const whyBlock = why.length ? (
    <section className="px-5 py-24 sm:px-8" style={{ background: GROUND }}>
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-neutral-300 pt-8">
          <Title eyebrow="Why here" title="Designed around how you live" />
          <p className="max-w-sm text-[15px] leading-relaxed text-neutral-600">{property.areaDescription || placeOf(property)}</p>
        </div>
        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
          <div className="flex justify-center gap-4">
            <div className="relative h-[380px] w-[46%] overflow-hidden rounded-full"><MediaFill image={pick(pool, 4)} /></div>
            <div className="relative mt-20 h-[380px] w-[46%] overflow-hidden rounded-full"><MediaFill image={pick(pool, 5)} /></div>
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            {why.map((w, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <Rise key={w.title} delay={i * 0.06}>
                  <Icon size={26} strokeWidth={1.3} className="text-neutral-800" />
                  <p className="mt-4 text-[21px]" style={{ fontFamily: 'var(--tpl-font-heading)', color: '#0f1b2d' }}>{w.title}</p>
                  {w.body && <p className="mt-2 text-[14px] text-neutral-500">{w.body}</p>}
                </Rise>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  ) : null;

  const process = (
    <section className="px-5 py-24 sm:px-8" style={{ background: GROUND }}>
      <div className="mx-auto max-w-[1240px]">
        <Title center eyebrow="How it works" title="A clear path from first look to your keys" />
        <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-3 hidden h-px bg-neutral-300 lg:block" />
          {steps.map((s, i) => {
            const Icon = [Compass, Star, KeyRound, Handshake][i];
            return (
              <Rise key={s.title} delay={i * 0.08} className="relative text-center">
                <span className="relative inline-block rounded-full bg-neutral-200 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-neutral-700">Step 0{i + 1}</span>
                <Icon size={34} strokeWidth={1.2} className="mx-auto mt-8 text-neutral-800" />
                <p className="mt-5 text-[19px]" style={{ fontFamily: 'var(--tpl-font-heading)', color: '#0f1b2d' }}>{s.title}</p>
                <p className="mx-auto mt-2 max-w-[240px] text-[14px] leading-relaxed text-neutral-500">{s.body}</p>
              </Rise>
            );
          })}
        </div>
      </div>
    </section>
  );

  const film = videos[0] ? (
    <section className="px-2 sm:px-3">
      <div className="relative flex h-[70vh] min-h-[420px] items-center justify-center overflow-hidden rounded-2xl">
        <MediaFill video={videos[videos.length > 1 ? 1 : 0]} image={pick(pool, 6)} />
        <div className="absolute inset-0 bg-black/35" />
        <VideoModalButton src={videos[0]} />
      </div>
    </section>
  ) : null;

  const faqBlock = (
    <section className="px-5 py-24 sm:px-8" style={{ background: GROUND }}>
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1fr_1.4fr]">
        <Title eyebrow="Questions" title="Everything you may want to know" />
        <Accordion items={propertyFaq(property)} variant="card" />
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="min-h-screen" style={{ background: GROUND, color: '#0f1b2d' }}>
      <KitNav property={property} ctaLabel={cta} style={STYLE} template={TEMPLATE} ground="#ffffff" />

      <header className="relative flex min-h-[100svh] items-end overflow-hidden pb-10 pt-28">
        <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
        {p.overlay !== false && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(1,29,65,0.55), rgba(1,29,65,0.25) 40%, rgba(1,29,65,0.75))' }} />}
        <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
          <div className="flex flex-wrap gap-2">
            {[property.status === 'OFF_PLAN' ? 'Selling off-plan' : 'Now selling', ...badges].map((b, i) => (
              <span key={b} className={`rounded-full px-3 py-1 text-[12px] ${i === 0 ? 'bg-white text-neutral-900' : 'border border-white/30 text-white'}`}>{b}</span>
            ))}
          </div>
          <h1 className="mt-6 max-w-3xl text-[44px] leading-[1.04] text-white sm:text-[70px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>
            {property.name}
          </h1>
          <div className="mt-10 border-t border-white/20 pt-6">
            <p className="line-clamp-3 max-w-xl text-[16px] leading-relaxed text-white/85">{heroLede(property)}</p>
          </div>
          {facts.length > 0 && (
            <div className="mt-8 flex flex-col gap-1 rounded-xl p-2 backdrop-blur-md sm:flex-row sm:items-stretch" style={{ background: 'rgba(1,29,65,0.55)' }}>
              {facts.map((f) => (
                <div key={f.label} className="min-w-0 flex-1 rounded-lg px-4 py-3 text-white sm:border-r sm:border-white/10">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">{f.label}</p>
                  <p className="mt-1 text-[15px]">{f.value}</p>
                </div>
              ))}
              <a href="#units" className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-6 py-3 text-[14px] font-medium text-neutral-900">
                See available homes <ArrowUpRight size={15} />
              </a>
            </div>
          )}
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-24 sm:px-8'}
        after={{ overview: byType, units: statsBand, gallery: whyBlock, tours: film, floorplans: process, location: faqBlock }}
      />

      <footer className="px-2 pb-3 sm:px-3">
        <div className="rounded-2xl px-6 pb-8 pt-16 sm:px-12" style={{ background: NAVY }}>
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/12 pb-12">
              <h2 className="text-[30px] text-white sm:text-[40px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>Book your private viewing</h2>
              <a href="#booking" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-[14px] text-white hover:bg-white/20">
                {cta} <ArrowUpRight size={15} />
              </a>
            </div>
            <div className="pt-12">
              <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
