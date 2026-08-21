'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import type { Property } from '../../../lib/types';
import { formatPrice, getStatusLabel } from '../../../lib/utils';
import { HeroMedia, RisingWords, heroFacts, tourBadges, useParallax } from './shared';

/**
 * Template heroes.
 *
 * Each is a different *opening* for the same development — the data is
 * identical, only the arrangement changes. None of them owns any behaviour:
 * the call to action always scrolls to the booking section that PropertyBooking
 * renders, so a template can never break the enquiry path.
 */

interface HeroProps {
  property: Property;
  ctaLabel?: string;
  overlay?: boolean;
}

/** Anchor the CTA scrolls to. Kept in one place so no template can mistype it. */
const BOOKING_ANCHOR = '#booking';

function CtaRow({
  ctaLabel = 'Book a viewing',
  onDark,
  className,
}: {
  ctaLabel?: string;
  onDark: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? ''}`}>
      <a
        href={BOOKING_ANCHOR}
        className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium transition-transform hover:scale-[1.02]"
        style={{ background: 'var(--brand-color)', color: 'var(--brand-on-color)' }}
      >
        {ctaLabel}
        <ArrowRight size={16} />
      </a>
      <a
        href="#gallery"
        className={`inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-[15px] font-medium backdrop-blur-sm transition-colors ${
          onDark
            ? 'border-white/30 text-white hover:bg-white/10'
            : 'border-black/15 text-neutral-900 hover:bg-black/5'
        }`}
      >
        View gallery
      </a>
    </div>
  );
}

/** 1 — EDITORIAL: centred headline over full-bleed photography. */
function EditorialHero({ property, ctaLabel, overlay = true }: HeroProps) {
  const y = useParallax(0.2);

  return (
    <section className="relative flex h-[92vh] min-h-[560px] w-full items-center justify-center overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y }}>
        <HeroMedia property={property} />
      </motion.div>
      {overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/60" />}

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-5 flex items-center justify-center gap-2 text-[13px] font-medium uppercase tracking-[0.2em] text-white/80"
        >
          <MapPin size={14} />
          {[property.address?.neighborhood, property.address?.city].filter(Boolean).join(', ')}
        </motion.p>

        <h1 className="text-[42px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[62px]">
          <RisingWords text={property.name} delay={0.15} />
        </h1>

        {property.tagline && (
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/75"
          >
            {property.tagline}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          className="mt-9 flex justify-center"
        >
          <CtaRow ctaLabel={ctaLabel} onDark />
        </motion.div>
      </div>
    </section>
  );
}

/** 2 — CONFIDENT: left headline, facts bar floating over the hero base. */
function ConfidentHero({ property, ctaLabel, overlay = true }: HeroProps) {
  const facts = heroFacts(property);

  return (
    <section className="relative w-full">
      <div className="relative h-[88vh] min-h-[560px] w-full overflow-hidden">
        <HeroMedia property={property} />
        {overlay && <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />}

        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
            <div className="max-w-2xl">
              <h1 className="text-[40px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[64px]">
                <RisingWords text={property.name} />
              </h1>
              {property.tagline && (
                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.45 }}
                  className="mt-6 max-w-lg text-[17px] leading-relaxed text-white/75"
                >
                  {property.tagline}
                </motion.p>
              )}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-9"
              >
                <CtaRow ctaLabel={ctaLabel} onDark />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Facts bar, lifted over the hero's lower edge. */}
      {facts.length > 0 && (
        <div className="mx-auto -mt-14 w-full max-w-6xl px-6 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-black/[0.06] shadow-xl shadow-black/10 sm:grid-cols-4"
          >
            {facts.map((f) => (
              <div key={f.label} className="bg-white px-6 py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  {f.label}
                </p>
                <p className="mt-1.5 text-[17px] font-semibold text-neutral-900">{f.value}</p>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  );
}

/** 3 — STATEMENT: the name set oversized across the image. */
function StatementHero({ property, ctaLabel, overlay = true }: HeroProps) {
  const badges = tourBadges(property);

  return (
    <section className="relative w-full bg-[#0b0b0c]">
      <div className="relative h-[86vh] min-h-[540px] w-full overflow-hidden">
        <HeroMedia property={property} />
        {overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70" />}

        {/*
          The name is clamped rather than fixed so a long development name
          still fits one line on a phone — an overflowing wordmark is the one
          way this treatment fails badly.
        */}
        <div className="absolute inset-x-0 top-[12%] z-10 px-4">
          <h1
            className="text-center font-semibold leading-[0.88] tracking-[-0.03em] text-white/95 mix-blend-overlay"
            style={{ fontSize: 'clamp(2.75rem, 13vw, 11rem)' }}
          >
            <RisingWords text={property.name} />
          </h1>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-10 sm:px-10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6">
            <div className="max-w-md">
              {property.tagline && (
                <p className="text-[16px] leading-relaxed text-white/75">{property.tagline}</p>
              )}
              {badges.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <span
                      key={b}
                      className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <CtaRow ctaLabel={ctaLabel} onDark />
          </div>
        </div>
      </div>
    </section>
  );
}

/** 4 — LUXE_DARK: oversized name with floating glass stat cards. */
function LuxeDarkHero({ property, ctaLabel, overlay = true }: HeroProps) {
  const facts = heroFacts(property).slice(0, 2);

  return (
    <section className="relative w-full bg-[#0b0b0c]">
      <div className="relative h-[92vh] min-h-[580px] w-full overflow-hidden">
        <HeroMedia property={property} />
        {overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-[#0b0b0c]" />}

        <div className="absolute inset-x-0 top-[14%] z-10 px-6">
          <h1
            className="text-center font-semibold leading-[0.9] tracking-[-0.03em] text-white"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 8.5rem)' }}
          >
            <RisingWords text={property.name} />
          </h1>
        </div>

        {/* Glass cards, right side on desktop and stacked under the copy on a
            phone, where a floating overlay would cover the image entirely. */}
        {facts.length > 0 && (
          <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
            {facts.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + i * 0.12 }}
                className="w-56 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
              >
                <p className="text-[26px] font-semibold leading-none text-white">{f.value}</p>
                <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-white/60">{f.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-12 sm:px-10">
          <div className="mx-auto max-w-7xl">
            {property.tagline && (
              <p className="max-w-md text-[16px] leading-relaxed text-white/70">{property.tagline}</p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <CtaRow ctaLabel={ctaLabel} onDark />
            </div>
            {/* Same figures, in the flow, for the phone layout the glass cards
                are hidden on. */}
            {facts.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 lg:hidden">
                {facts.map((f) => (
                  <div key={f.label}>
                    <p className="text-[22px] font-semibold leading-none text-white">{f.value}</p>
                    <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-white/55">{f.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** 5 — SHOWCASE: inset rounded hero with a floating unit card. */
function ShowcaseHero({ property, ctaLabel, overlay = true }: HeroProps) {
  const unit = property.units?.[0];
  const plan = property.floorPlans?.[0];

  return (
    <section className="w-full bg-[#f4f5f7] px-3 pb-16 pt-3 sm:px-5">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px]">
        <div className="relative h-[80vh] min-h-[520px] w-full">
          <HeroMedia property={property} />
          {overlay && <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />}

          <div className="relative z-10 flex h-full items-center px-8 sm:px-14">
            <div className="max-w-xl">
              <h1 className="text-[36px] font-semibold leading-[1.08] tracking-tight text-white sm:text-[54px]">
                <RisingWords text={property.name} />
              </h1>
              {property.tagline && (
                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.45 }}
                  className="mt-5 text-[16px] leading-relaxed text-white/75"
                >
                  {property.tagline}
                </motion.p>
              )}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-8"
              >
                <CtaRow ctaLabel={ctaLabel} onDark />
              </motion.div>
            </div>
          </div>

          {/* Featured unit card — only when there is a unit to feature. */}
          {(unit || plan) && (
            <motion.a
              href="#units"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.75 }}
              className="absolute bottom-8 right-8 z-10 hidden w-72 rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm transition-transform hover:scale-[1.02] md:block"
            >
              <div className="flex items-center gap-3">
                {property.heroImageUrl && (
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                    <Image src={property.heroImageUrl} alt="" fill className="object-cover" sizes="80px" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-neutral-900">
                    {plan?.name ?? `${plan?.bedrooms ?? unit?.bedrooms ?? ''} bed`}
                  </p>
                  <p className="mt-0.5 text-[12px] text-neutral-500">
                    {getStatusLabel(property.status)}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold" style={{ color: 'var(--brand-color)' }}>
                    {formatPrice(property.priceFrom, property.currency)}
                  </p>
                </div>
              </div>
            </motion.a>
          )}
        </div>
      </div>
    </section>
  );
}

/** 6 — ARCHITECTURAL: quiet hero, stat row along the base. */
function ArchitecturalHero({ property, ctaLabel, overlay = true }: HeroProps) {
  const facts = heroFacts(property);

  return (
    <section className="relative h-[90vh] min-h-[560px] w-full overflow-hidden">
      <HeroMedia property={property} />
      {overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />}

      <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-8 pt-32 sm:px-12">
        <div className="mx-auto w-full max-w-7xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-white/70"
          >
            {[property.address?.neighborhood, property.address?.city].filter(Boolean).join(' · ')}
          </motion.p>
          <h1 className="max-w-3xl text-[38px] font-semibold leading-[1.06] tracking-tight text-white sm:text-[58px]">
            <RisingWords text={property.name} />
          </h1>
          {property.tagline && (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/70"
            >
              {property.tagline}
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8"
          >
            <CtaRow ctaLabel={ctaLabel} onDark />
          </motion.div>
        </div>

        {facts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 border-t border-white/20 pt-6 sm:grid-cols-4"
          >
            {facts.map((f) => (
              <div key={f.label}>
                <p className="text-[22px] font-semibold leading-none text-white sm:text-[28px]">{f.value}</p>
                <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-white/60">{f.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

/** 7 — WARM_LUXE: inset hero on a warm ground, floating unit card. */
function WarmLuxeHero({ property, ctaLabel, overlay = true }: HeroProps) {
  const facts = heroFacts(property).slice(0, 3);

  return (
    <section className="w-full bg-[#f3efe9] px-3 pb-14 pt-3 sm:px-6">
      <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[26px]">
        <div className="relative h-[78vh] min-h-[500px] w-full">
          <HeroMedia property={property} />
          {overlay && <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />}

          <div className="relative z-10 flex h-full flex-col justify-center px-8 sm:px-14">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="mb-5 w-fit rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm"
            >
              {getStatusLabel(property.status)}
            </motion.span>

            <h1 className="max-w-xl text-[36px] font-semibold leading-[1.06] tracking-tight text-white sm:text-[54px]">
              <RisingWords text={property.name} />
            </h1>
            {property.tagline && (
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.45 }}
                className="mt-5 max-w-md text-[16px] leading-relaxed text-white/75"
              >
                {property.tagline}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-8"
            >
              <CtaRow ctaLabel={ctaLabel} onDark />
            </motion.div>
          </div>
        </div>
      </div>

      {facts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mx-auto mt-8 grid max-w-[1360px] grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {facts.map((f) => (
            <div key={f.label} className="rounded-2xl bg-white/70 px-6 py-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                {f.label}
              </p>
              <p className="mt-1.5 text-[19px] font-semibold text-neutral-900">{f.value}</p>
            </div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

/**
 * Picks the hero for a template.
 *
 * CLASSIC is absent on purpose — it keeps the original PropertyHero, so an
 * existing development that has never chosen a template renders exactly as it
 * does today.
 */
export function TemplateHero({
  templateKey,
  property,
  ctaLabel,
  overlay = true,
}: HeroProps & { templateKey: string }) {
  switch (templateKey) {
    case 'EDITORIAL':
      return <EditorialHero property={property} ctaLabel={ctaLabel} overlay={overlay} />;
    case 'CONFIDENT':
      return <ConfidentHero property={property} ctaLabel={ctaLabel} overlay={overlay} />;
    case 'STATEMENT':
      return <StatementHero property={property} ctaLabel={ctaLabel} overlay={overlay} />;
    case 'LUXE_DARK':
      return <LuxeDarkHero property={property} ctaLabel={ctaLabel} overlay={overlay} />;
    case 'SHOWCASE':
      return <ShowcaseHero property={property} ctaLabel={ctaLabel} overlay={overlay} />;
    case 'ARCHITECTURAL':
      return <ArchitecturalHero property={property} ctaLabel={ctaLabel} overlay={overlay} />;
    case 'WARM_LUXE':
      return <WarmLuxeHero property={property} ctaLabel={ctaLabel} overlay={overlay} />;
    default:
      return null;
  }
}
