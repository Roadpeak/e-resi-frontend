'use client';

import { Gem, Home, ShieldCheck } from 'lucide-react';
import { KitNav } from '../KitTemplate';
import type { KitStyle } from '../kit';
import { templateFor } from '../../../../lib/branding/templates';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  FooterColumns, Marquee, MediaFill, ParallaxImage, Rise,
  imagePool, pick, placeOf, videoPool, shortLine, heroLede,
} from './primitives';

/**
 * Atelier — a monochrome, gallery-like page. Serif display type with an
 * italic turn in every headline, hairline buttons, tiny tracked capitals,
 * a pinned full-screen quote, black-and-white material studies and a
 * black-and-white film behind the private viewing invitation.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-none', headingKind: 'eyebrow',
  unitsAs: 'cards', galleryAs: 'mosaic', outlined: true,
};
const TEMPLATE = templateFor('ATELIER');
const GROUND = '#fafafa';
const serif = { fontFamily: 'var(--tpl-font-heading)' } as const;

/** Sets the latter part of a phrase in italics — the Atelier headline voice. */
function Turn({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  const cut = Math.max(1, Math.ceil(words.length / 2));
  return (
    <span className={className} style={serif}>
      {words.slice(0, cut).join(' ')}{' '}
      <em className="italic">{words.slice(cut).join(' ')}</em>
    </span>
  );
}

function Label({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`text-[11px] uppercase tracking-[0.3em] ${light ? 'text-white/70' : 'text-neutral-500'}`}>{children}</p>;
}

function sentences(text?: string) {
  return (text ?? '').split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
}

export function AtelierTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a viewing';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const lines = sentences(property.description);
  const quoteA = shortLine(property, 180) || lines[0] || property.name;
  const quoteB = lines[1] || '';
  const kind = property.category ? String(property.category).replace(/_/g, ' ').toLowerCase() : 'residences';

  const cards = (property.features ?? []).slice(0, 3).map((f, i) => ({
    title: f,
    body: property.unitFeatures?.[i] ?? '',
    Icon: [Home, ShieldCheck, Gem][i],
  }));

  const overview = (
    <div>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Rise>
          <h2 className="text-[38px] leading-[1.1] text-neutral-900 sm:text-[52px]">
            <Turn text={copy('overview').heading?.trim() || `${property.name}, thoughtfully considered.`} />
          </h2>
        </Rise>
        <Rise delay={0.1} className="border-b border-neutral-300 pb-6 lg:mt-3">
          <p className="text-[13px] uppercase leading-[1.8] tracking-[0.08em] text-neutral-600">{property.description}</p>
        </Rise>
      </div>
      {cards.length > 0 && (
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {cards.map((c, i) => (
            <Rise key={c.title} delay={i * 0.08}>
              <div className="h-full bg-white p-9 shadow-[0_1px_18px_rgba(0,0,0,0.05)]">
                <c.Icon size={22} strokeWidth={1.3} className="text-neutral-700" />
                <p className="mt-12 text-[22px] italic text-neutral-900" style={serif}>{c.title}</p>
                {c.body && <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">{c.body}</p>}
              </div>
            </Rise>
          ))}
        </div>
      )}
    </div>
  );

  // Pinned quote: the image holds still while the page scrolls the quote past it.
  const pinnedQuote = (
    <section className="relative h-[170vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <MediaFill image={pick(pool, 2)} />
        <div className="absolute inset-0 bg-black/60" />
        <Rise className="relative max-w-4xl px-6 text-center">
          <p className="text-[32px] italic leading-[1.3] text-white sm:text-[48px]" style={serif}>“{quoteA}”</p>
          <span className="mx-auto mt-10 block h-px w-40 bg-white/40" />
          <p className="mt-6 text-[12px] uppercase tracking-[0.3em] text-white/75">{property.developer?.name ?? property.name}</p>
        </Rise>
      </div>
    </section>
  );

  const materials = (property.unitFeatures?.length ? property.unitFeatures : property.features ?? []).slice(0, 4);
  const materialBlock = materials.length ? (
    <section className="px-5 py-24 sm:px-10" style={{ background: '#fff' }}>
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[260px_1fr]">
        <div>
          <Label>Detail study</Label>
          <h3 className="mt-4 text-[38px] leading-[1.1] text-neutral-900"><Turn text="Material and sensory." /></h3>
          <p className="mt-5 text-[12px] uppercase leading-[1.9] tracking-[0.08em] text-neutral-500">What every home is made of, and how it feels to live in.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {materials.map((m, i) => (
            <Rise key={m} delay={i * 0.06}>
              <div className="relative aspect-[4/3] overflow-hidden"><MediaFill image={pick(pool, i + 3)} grayscale /></div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-neutral-400">0{i + 1}</p>
              <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-neutral-800">{m}</p>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const promo = quoteB ? (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6">
      <ParallaxImage src={pick(pool, 7)} className="absolute inset-0" grayscale strength={80} />
      <div className="absolute inset-0 bg-black/35" />
      <Rise className="relative max-w-4xl text-center">
        <Label light>Immersive perspective</Label>
        <p className="mt-8 text-[30px] italic leading-[1.3] text-white sm:text-[46px]" style={serif}>“{quoteB}”</p>
      </Rise>
    </section>
  ) : null;

  const places = (property.amenities ?? []).slice(0, 10);
  const reach = places.length ? (
    <section className="py-24" style={{ background: '#f4f4f4' }}>
      <div className="text-center">
        <Label>Around you</Label>
        <h3 className="mt-4 text-[40px] text-neutral-900"><Turn text="Close to everything." /></h3>
      </div>
      <Marquee
        className="mt-14"
        items={places.map((a) => a.name)}
        speed={44}
        gap="gap-16"
        render={(name, i) => (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">{places[i]?.distance ?? placeOf(property)}</p>
            <p className="mt-2 text-[26px] uppercase tracking-[0.18em] text-neutral-700">{name}</p>
          </div>
        )}
      />
    </section>
  ) : null;

  const privateCircle = (
    <section className="relative flex min-h-[100vh] items-center justify-center overflow-hidden px-6 py-24">
      <MediaFill video={videos[0]} image={pick(pool, 8)} grayscale />
      <div className="absolute inset-0 bg-black/55" />
      <Rise className="relative max-w-3xl text-center text-white">
        <Label light>The private viewing</Label>
        <h3 className="mt-8 text-[40px] italic leading-[1.15] sm:text-[60px]" style={serif}>See {property.name} privately.</h3>
        <p className="mx-auto mt-8 max-w-xl text-[13px] uppercase leading-[1.9] tracking-[0.12em] text-white/80">
          Walk through the residences on site, or join a live guided tour on a video call — wherever you are.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-3 text-[11px] uppercase tracking-[0.24em] text-white/80">
          {['Private viewing', 'Live guided tour', 'Secure documents'].map((x) => (
            <span key={x} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-white" />{x}</span>
          ))}
        </div>
        <a href="#booking" className="mt-12 inline-block bg-white px-10 py-4 text-[12px] uppercase tracking-[0.24em] text-neutral-900">
          Request an invitation
        </a>
      </Rise>
    </section>
  );

  const advantages = (property.features ?? []).slice(3, 6).length
    ? (property.features ?? []).slice(3, 6)
    : (property.features ?? []).slice(0, 3);
  const benefits = advantages.length ? (
    <section className="px-5 py-24 sm:px-10" style={{ background: GROUND }}>
      <div className="mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden"><MediaFill image={pick(pool, 1)} /></div>
          <div className="relative aspect-square overflow-hidden"><MediaFill image={pick(pool, 4)} /></div>
          <div className="relative aspect-square overflow-hidden"><MediaFill image={pick(pool, 5)} /></div>
        </div>
        <div>
          <Label>Why {property.name}</Label>
          <h3 className="mt-4 text-[40px] leading-[1.15] text-neutral-900 sm:text-[48px]"><Turn text={`The ${property.name} advantage`} /></h3>
          <div className="mt-10 space-y-8">
            {advantages.map((a, i) => (
              <Rise key={a} delay={i * 0.08} className="border-b border-neutral-300 pb-6">
                <p className="text-[11px] text-neutral-400">0{i + 1}</p>
                <p className="mt-2 text-[22px] italic text-neutral-900" style={serif}>{a}</p>
              </Rise>
            ))}
          </div>
        </div>
      </div>
    </section>
  ) : null;

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="min-h-screen" style={{ background: GROUND }}>
      <KitNav property={property} ctaLabel={cta} style={STYLE} template={TEMPLATE} ground="#ffffff" />

      <header className="relative min-h-[100svh] overflow-hidden bg-white pt-20">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[66%]">
          <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent lg:via-white/10" />
        </div>
        <div className="relative mx-auto flex min-h-[calc(100svh-80px)] max-w-[1400px] items-center px-6 sm:px-10">
          <Rise className="max-w-xl">
            <Label>{kind} · {placeOf(property) || 'Curated living'}</Label>
            <h1 className="mt-6 text-[48px] leading-[1.08] text-neutral-900 sm:text-[72px]">
              <Turn text={property.name} />
            </h1>
            <p className="mt-6 line-clamp-4 max-w-md text-[12px] uppercase leading-[1.9] tracking-[0.1em] text-neutral-600">{heroLede(property)}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#booking" className="border border-neutral-900 px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white">{cta}</a>
              <a href="#units" className="border border-neutral-900 px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white">Residences</a>
            </div>
          </Rise>
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-24 sm:px-10 sm:py-28'}
        after={{ overview: pinnedQuote, gallery: materialBlock, units: promo, location: reach, tours: privateCircle, floorplans: benefits }}
      />

      <footer className="px-6 pb-10 pt-16 sm:px-10" style={{ background: '#0f0f0f' }}>
        <div className="mx-auto max-w-[1240px]">
          <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark />
        </div>
      </footer>
    </div>
  );
}
