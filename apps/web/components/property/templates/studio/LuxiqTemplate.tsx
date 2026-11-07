'use client';

import { motion } from 'framer-motion';
import { BedDouble, Bath, Building, CalendarDays, Home, MapPin, Ruler, Tag } from 'lucide-react';
import type { KitStyle } from '../kit';
import { StudioNav } from './StudioNav';
import { standardBlocks, StudioSections, type StudioTemplateProps } from './blocks';
import {
  Accordion, EASE, FooterColumns, Marquee, MediaFill, Rise,
  buyerSteps, heroLede, imagePool, pick, placeOf, propertyFaq, statement, unitTypes, videoPool,
} from './primitives';
import { formatPrice } from '../../../../lib/utils';

/**
 * Luxiq — a single residence, presented like a product. A black strip of
 * links, the development's name running across the hero in a wide display
 * face, a large statement bottom-left; then a statement heading beside a
 * ruled spec table with icons, a full-bleed gallery band, and a clean grey
 * FAQ. Built for one development, which is what every mini-site is.
 */

const STYLE: KitStyle = {
  onDark: false, radius: 'rounded-xl', headingKind: 'plain',
  unitsAs: 'table', galleryAs: 'mosaic', outlined: false,
};

const WIDE = 'var(--font-unbounded), var(--font-manrope), sans-serif';

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="flex items-center gap-1.5 text-[12px] text-neutral-600"><Home size={12} />{children}</p>;
}

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[30px] font-medium leading-[1.12] tracking-[-0.02em] text-neutral-900 sm:text-[40px] ${className}`}>{children}</h2>;
}

export function LuxiqTemplate(p: StudioTemplateProps) {
  const { property } = p;
  const cta = p.ctaLabel || 'Book a visit';
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const pool = imagePool(property);
  const videos = videoPool(property);
  const types = unitTypes(property);
  const steps = buyerSteps(property);
  const place = placeOf(property);

  const beds = types.map((t) => t.beds).filter((b) => b > 0);
  const baths = (property.units ?? []).map((u) => u.bathrooms).filter(Boolean);
  const sizes = (property.units ?? []).map((u) => u.sqm).filter(Boolean);
  const range = (xs: number[], unit = '') =>
    xs.length ? (Math.min(...xs) === Math.max(...xs) ? `${Math.min(...xs)}${unit}` : `${Math.min(...xs)}–${Math.max(...xs)}${unit}`) : null;

  const specs = [
    place && { icon: MapPin, label: 'Location', value: place },
    range(beds) && { icon: BedDouble, label: 'Bedrooms', value: range(beds) },
    range(baths) && { icon: Bath, label: 'Bathrooms', value: range(baths) },
    range(sizes, ' m²') && { icon: Ruler, label: 'Size', value: range(sizes, ' m²') },
    (property.totalUnits || property.units?.length) && { icon: Building, label: 'Residences', value: String(property.totalUnits || property.units.length) },
    property.priceFrom > 0 && { icon: Tag, label: 'Starting from', value: formatPrice(property.priceFrom, property.currency) },
    property.completionDate && { icon: CalendarDays, label: 'Completion', value: String(new Date(property.completionDate).getFullYear()) },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string }[];

  const overview = (
    <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
      <div>
        <Eyebrow>About the development</Eyebrow>
        <Rise>
          <p className="mt-4 max-w-xl text-[30px] font-medium leading-[1.18] tracking-[-0.02em] text-neutral-900 sm:text-[38px]">
            {copy('overview').heading?.trim() || statement(property)}
          </p>
        </Rise>
      </div>
      <dl>
        {specs.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-4 border-b border-dashed border-neutral-300 py-4">
            <dt className="flex items-center gap-3 text-[13px] text-neutral-500"><s.icon size={16} strokeWidth={1.5} className="text-neutral-700" />{s.label}</dt>
            <dd className="text-right text-[17px] font-medium text-neutral-900">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const visual = pool.length > 1 ? (
    <section className="bg-[#f6f6f6] pb-20 pt-16">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <Eyebrow>Visual gallery</Eyebrow>
        <H2 className="mt-2">Fully visualise the home</H2>
      </div>
      <div className="mt-10 space-y-3 px-3">
        <div className="relative aspect-[16/7] overflow-hidden rounded-xl"><MediaFill video={videos[1]} image={pick(pool, 1)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl"><MediaFill image={pick(pool, 2)} /></div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl"><MediaFill image={pick(pool, 3)} /></div>
        </div>
      </div>
    </section>
  ) : null;

  const why = (
    <section className="px-5 py-20 sm:px-10">
      <div className="mx-auto max-w-[1440px]">
        <Eyebrow>Why buy</Eyebrow>
        <H2 className="mt-2 max-w-xl">Built for those who expect more out of life</H2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Rise key={s.title} delay={i * 0.06}>
              <div className="h-full rounded-xl border border-neutral-200 p-6">
                <p className="text-[12px] tabular-nums text-neutral-400">{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-8 text-[18px] font-medium text-neutral-900">{s.title}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">{s.body}</p>
              </div>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );

  const faq = (
    <section className="bg-[#f6f6f6] px-5 py-20 sm:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-2">
        <div><Eyebrow>FAQs</Eyebrow><H2 className="mt-2">Questions buyers ask</H2></div>
        <Accordion items={propertyFaq(property)} variant="card" />
      </div>
    </section>
  );

  const blocks = standardBlocks(p, STYLE, { overview });

  return (
    <div className="min-h-screen bg-white">
      <StudioNav variant="luxiq" property={property} ctaLabel={cta} />

      <header className="relative h-[100svh] min-h-[600px] overflow-hidden bg-[#b9a7c9] pt-[60px]">
        <MediaFill video={videos[0]} image={property.heroImageUrl} priority />
        {p.overlay !== false && <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />}
        {/* The name, running across the top in a wide face. */}
        <div className="relative mt-8">
          <Marquee
            items={[property.name, property.name, property.name]}
            speed={38}
            gap="gap-16"
            render={(t) => (
              <span className="whitespace-nowrap text-[64px] font-medium leading-none tracking-[-0.01em] text-white sm:text-[120px]" style={{ fontFamily: WIDE }}>{t}</span>
            )}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-6 px-5 pb-10 sm:px-10">
          <motion.p
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }}
            className="line-clamp-3 max-w-xl text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-white sm:text-[40px]"
          >
            {heroLede(property)}
          </motion.p>
          <div className="flex gap-2">
            <a href="#booking" className="rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-black">{cta}</a>
            <a href="#units" className="rounded-full bg-black px-5 py-2.5 text-[13px] font-medium text-white">Residences</a>
          </div>
        </div>
      </header>

      <StudioSections
        sections={p.sections}
        blocks={blocks}
        wrapClass={() => 'px-5 py-20 sm:px-10 sm:py-24'}
        after={{ overview: visual, units: why, location: faq }}
      />

      <footer className="bg-black px-5 pt-16 sm:px-10">
        <div className="mx-auto max-w-[1440px]">
          <FooterColumns property={property} sections={p.sections} whiteLabel={p.whiteLabel} onDark />
        </div>
        <p className="mt-12 overflow-hidden whitespace-nowrap pb-6 text-[13vw] font-medium leading-[0.9] text-white/90" style={{ fontFamily: WIDE }}>{property.name}</p>
      </footer>
    </div>
  );
}
