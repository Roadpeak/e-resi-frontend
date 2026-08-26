'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import type { Property } from '../../../lib/types';
import { formatPrice, getStatusLabel } from '../../../lib/utils';
import { HeroMedia, HeroReveal, RisingWords, heroFacts, tourBadges, useParallax } from './shared';
import { ChatWithDeveloper } from '../../chat/ChatWithDeveloper';

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
        style={{ background: 'var(--brand)', color: 'var(--brand-on)' }}
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
  // Location is already the eyebrow above the name, so it would be a repeat.
  const facts = heroFacts(property).filter((f) => f.label !== 'Location');

  return (
    <section className="relative flex h-[92vh] min-h-[560px] w-full items-center justify-center overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y }}>
        <HeroMedia property={property} />
      </motion.div>
      {overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/60" />}

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <HeroReveal delay={0.1} as="p"
          className="mb-5 flex items-center justify-center gap-2 text-[13px] font-medium uppercase tracking-[0.2em] text-white/80"
        >
          <MapPin size={14} />
          {[property.address?.neighborhood, property.address?.city].filter(Boolean).join(', ')}
        </HeroReveal>

        <h1 className="text-[42px] leading-[1.08] tracking-tight text-white sm:text-[62px]" style={{fontFamily:'var(--tpl-font-heading)',fontWeight:'var(--tpl-heading-weight)' as unknown as number}}>
          <RisingWords text={property.name} delay={0.15} />
        </h1>

        {property.tagline && (
          <HeroReveal delay={0.5} as="p"
            className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/75"
          >
            {property.tagline}
          </HeroReveal>
        )}

        <HeroReveal delay={0.65}
          className="mt-9 flex items-center justify-center gap-3"
        >
          <CtaRow ctaLabel={ctaLabel} onDark />
          {/* The one question a buyer has after reading a price, answerable
              without scrolling. Icon-only so the CTA stays the single filled
              control on this centred composition. */}
          <ChatWithDeveloper
            propertySlug={property.slug}
            tone="dark"
            variant="icon"
            label="Chat with the developer"
          />
        </HeroReveal>

        {/*
          The figures, on a rule below the CTA.

          This hero used to end at the button, so a buyer learned the name and
          the tagline and had to scroll to find out what the development costs.
          Editorial is a quiet, centred composition and a facts bar would break
          it, so these sit as a single hairline-ruled line — the same
          information Classic carries at its fold, in this template's register.
        */}
        {facts.length > 0 && (
          <HeroReveal delay={0.8} as="dl"
            className="mx-auto mt-12 flex max-w-2xl flex-wrap items-baseline justify-center gap-x-12 gap-y-5 border-t border-white/25 pt-7"
          >
            {facts.map((f) => (
              <div key={f.label} className="text-center">
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/55">
                  {f.label}
                </dt>
                <dd
                  className="mt-2 text-[21px] text-white"
                  style={{
                    fontFamily: 'var(--tpl-font-heading)',
                    fontWeight: 'var(--tpl-heading-weight)' as unknown as number,
                  }}
                >
                  {f.value}
                </dd>
              </div>
            ))}
          </HeroReveal>
        )}
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
              <h1 className="text-[40px] leading-[1.08] tracking-tight text-white sm:text-[64px]" style={{fontFamily:'var(--tpl-font-heading)',fontWeight:'var(--tpl-heading-weight)' as unknown as number}}>
                <RisingWords text={property.name} />
              </h1>
              {property.tagline && (
                <HeroReveal delay={0.45} as="p"
                  className="mt-6 max-w-lg text-[17px] leading-relaxed text-white/75"
                >
                  {property.tagline}
                </HeroReveal>
              )}
              <HeroReveal delay={0.6} className="mt-9 flex items-center gap-3">
                <CtaRow ctaLabel={ctaLabel} onDark />
                <ChatWithDeveloper
                  propertySlug={property.slug}
                  tone="dark"
                  variant="icon"
                  label="Chat with the developer"
                />
              </HeroReveal>
            </div>
          </div>
        </div>
      </div>

      {/*
        Facts bar, lifted over the hero's lower edge.

        `relative z-20` is load-bearing. Without a stacking context of its own
        the bar sits at z-index auto while the hero's content sits at z-10, so
        the hero painted straight over it and the whole bar was invisible —
        every figure a buyer scans for, gone.
      */}
      {facts.length > 0 && (
        <div className="relative z-20 mx-auto -mt-14 w-full max-w-6xl px-6 sm:px-10">
          <HeroReveal delay={0.75} y={24}
            // Columns follow the fact count. Fixed at four, a development
            // with three figures rendered an empty white cell on the end of
            // the bar, which reads as a missing value rather than as spacing.
            className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-black/[0.06] shadow-xl shadow-black/10 ${
              facts.length >= 4 ? 'sm:grid-cols-4' : facts.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
            }`}
          >
            {facts.map((f) => (
              <div key={f.label} className="bg-white px-6 py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  {f.label}
                </p>
                <p className="mt-1.5 text-[17px] font-semibold text-neutral-900">{f.value}</p>
              </div>
            ))}
          </HeroReveal>
        </div>
      )}
    </section>
  );
}

/** 3 — STATEMENT: the name set oversized across the image. */
function StatementHero({ property, ctaLabel, overlay = true }: HeroProps) {
  const badges = tourBadges(property);
  // Location is stated in the nav and the footer; three figures is the most
  // this centred composition carries without becoming a table.
  const facts = heroFacts(property)
    .filter((f) => f.label !== 'Location')
    .slice(0, 3);

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
        {/*
          Sized off the name's length, and leading kept above 1: the rise-in
          animation masks each word with overflow-hidden, and a sub-1 line
          height makes that mask shorter than the glyphs it contains, which
          shears the tops off. mix-blend is dropped for the same reason it
          looked wrong — over a dark photograph it erased the word entirely.
        */}
        {/* top-[22%] rather than 16%: at the largest clamp sizes the wordmark's
            cap height reached into the fixed navbar and the two collided. */}
        <div className="absolute inset-x-0 top-[22%] z-10 px-4">
          <h1
            className="text-center leading-[1.02] tracking-[-0.03em] text-white"
            style={{
              fontFamily: 'var(--tpl-font-heading)',
              fontWeight: 'var(--tpl-heading-weight)' as unknown as number,
              fontSize: `clamp(2.25rem, ${Math.max(5, 105 / Math.max(property.name.length, 9))}vw, 9rem)`,
            }}
          >
            <RisingWords text={property.name} />
          </h1>

          {/*
            The figures, directly under the wordmark.

            This hero ended at the tagline and the CTA, so the one number a
            buyer is looking for was a screen away. Centred and widely tracked
            under the name, they read as a subtitle to it rather than as a
            panel — Statement's whole idea is that the name dominates, and a
            boxed facts bar would compete with it.
          */}
          {facts.length > 0 && (
            <HeroReveal delay={0.5} as="dl"
              className="mx-auto mt-8 flex max-w-3xl flex-wrap items-baseline justify-center gap-x-10 gap-y-4 sm:mt-10 sm:gap-x-16"
            >
              {facts.map((f) => (
                <div key={f.label} className="text-center">
                  <dt className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">
                    {f.label}
                  </dt>
                  <dd className="mt-2 text-[19px] font-semibold tracking-[-0.01em] text-white sm:text-[22px]">
                    {f.value}
                  </dd>
                </div>
              ))}
            </HeroReveal>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-10 sm:px-10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6">
            <div className="max-w-md">
              {property.tagline && (
                <p className="text-[16px] leading-relaxed text-white/75">{property.tagline}</p>
              )}
              {/* The tours a development actually has, stated rather than
                  badged. These were 12px pills the same weight as a filter
                  chip, for the thing a developer pays the most for. */}
              {badges.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {badges.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/80"
                    >
                      <span aria-hidden className="h-1 w-1 rounded-full bg-white/60" />
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <CtaRow ctaLabel={ctaLabel} onDark />
              <ChatWithDeveloper
                propertySlug={property.slug}
                tone="dark"
                variant="icon"
                label="Chat with the developer"
              />
            </div>
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
        {/*
          Weighted to the base rather than flat: the name sits in the upper
          third and needs the photograph visible behind it, while the copy and
          buttons at the bottom need a ground to read against. A flat scrim
          dark enough for the copy erased the building entirely.
        */}
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#0b0b0c]" />
        )}

        {/*
          Sized off the name's own length rather than a fixed clamp: a fixed
          one either clips a long name or leaves a short one looking timid.
          leading-[1.05] with py gives the descenders room — at 0.9 the words
          were being cut by the overflow-hidden that drives the rise-in.
        */}
        <div className="absolute inset-x-0 top-[18%] z-10 px-6">
          <h1
            className="text-center font-light leading-[1.05] tracking-[-0.03em] text-white"
            style={{
              fontSize: `clamp(2rem, ${Math.max(4.5, 92 / Math.max(property.name.length, 8))}vw, 7.5rem)`,
            }}
          >
            <RisingWords text={property.name} wordClassName="pb-[0.08em]" />
          </h1>
        </div>

        {/* Glass cards, right side on desktop and stacked under the copy on a
            phone, where a floating overlay would cover the image entirely. */}
        {facts.length > 0 && (
          <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
            {facts.map((f, i) => (
              <HeroReveal
                key={f.label}
                delay={0.6 + i * 0.12}
                y={0}
                className="w-56 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
              >
                <p className="text-[26px] font-semibold leading-none text-white">{f.value}</p>
                <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-white/60">{f.label}</p>
              </HeroReveal>
            ))}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-12 sm:px-10">
          <div className="mx-auto max-w-7xl">
            {property.tagline && (
              <p className="max-w-md text-[16px] leading-relaxed text-white/70">{property.tagline}</p>
            )}
            {/* Squared, hairline buttons rather than the shared pill row — the
                pills read as a product UI against this template's typography. */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#booking"
                className="px-8 py-4 text-[12px] uppercase tracking-[0.16em] transition-opacity hover:opacity-90"
                style={{ background: 'var(--brand, #ffffff)', color: 'var(--brand-on, #0b0b0c)' }}
              >
                {ctaLabel ?? 'Book a viewing'}
              </a>
              <a
                href="#gallery"
                className="border border-white/30 px-8 py-4 text-[12px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/10"
              >
                View gallery
              </a>
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
  // The price is carried by the featured card beside these, so it is dropped
  // here to avoid stating the same figure twice in one composition. Location
  // stays: this hero has no eyebrow, so it is the only place the development
  // says where it is above the fold.
  const facts = heroFacts(property)
    .filter((f) => f.label !== 'From')
    .slice(0, 3);

  return (
    <section className="w-full bg-[#f4f5f7] px-3 pb-16 pt-3 sm:px-5">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px]">
        <div className="relative h-[80vh] min-h-[520px] w-full">
          <HeroMedia property={property} />
          {overlay && <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />}

          <div className="relative z-10 flex h-full items-center px-8 sm:px-14">
            <div className="max-w-xl">
              <h1 className="text-[36px] leading-[1.1] tracking-tight text-white sm:text-[54px]" style={{fontFamily:'var(--tpl-font-heading)',fontWeight:'var(--tpl-heading-weight)' as unknown as number}}>
                <RisingWords text={property.name} />
              </h1>
              {property.tagline && (
                <HeroReveal delay={0.45} as="p"
                  className="mt-5 text-[16px] leading-relaxed text-white/75"
                >
                  {property.tagline}
                </HeroReveal>
              )}
              <HeroReveal delay={0.6} className="mt-8 flex items-center gap-3">
                <CtaRow ctaLabel={ctaLabel} onDark />
                <ChatWithDeveloper
                  propertySlug={property.slug}
                  tone="dark"
                  variant="icon"
                  label="Chat with the developer"
                />
              </HeroReveal>

              {/* The figures, on a rule under the buttons. Showcase put its
                  only number inside the floating card, which is hidden below
                  md — so on a phone this hero stated no price at all. */}
              {facts.length > 0 && (
                <HeroReveal
                  delay={0.75}
                  as="dl"
                  className="mt-9 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/20 pt-6"
                >
                  {facts.map((f) => (
                    <div key={f.label}>
                      <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/55">
                        {f.label}
                      </dt>
                      <dd className="mt-1.5 text-[16px] font-semibold text-white">{f.value}</dd>
                    </div>
                  ))}
                </HeroReveal>
              )}
            </div>
          </div>

          {/* Featured unit card — only when there is a unit to feature. */}
          {(unit || plan) && (
            <motion.a
              href="#units"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.75 }}
              className="absolute bottom-10 right-10 z-10 hidden w-72 rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm transition-transform hover:scale-[1.02] md:block"
            >
              <div className="flex items-center gap-3.5">
                {/*
                  The floor plan, not the hero photograph.

                  This used to show `heroImageUrl` — the very image the card is
                  floating on top of — so the thumbnail was a crop of the
                  background behind it and read as a rendering fault. A plan
                  drawing is what a featured layout should show; when there is
                  none, the mark stands in rather than repeating the render.
                */}
                {plan?.imageUrl ? (
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    <Image src={plan.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                  </div>
                ) : (
                  <span
                    aria-hidden
                    className="flex h-16 w-20 shrink-0 flex-col items-center justify-center rounded-xl text-[20px] font-bold leading-none"
                    style={{
                      background: 'color-mix(in srgb, var(--brand) 10%, white)',
                      color: 'var(--brand)',
                    }}
                  >
                    {plan?.bedrooms ?? unit?.bedrooms ?? '—'}
                    <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider opacity-70">
                      bed
                    </span>
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    Featured
                  </p>
                  <p className="mt-1 truncate text-[14px] font-semibold text-neutral-900">
                    {plan?.name ?? `${plan?.bedrooms ?? unit?.bedrooms ?? ''} bed`}
                  </p>
                  <p className="mt-1 text-[15px] font-bold" style={{ color: 'var(--brand)' }}>
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
  // Location is the eyebrow above the name, so repeating it in the stat row
  // spent one of four columns restating what the hero already said.
  const facts = heroFacts(property).filter((f) => f.label !== 'Location');

  return (
    <section className="relative h-[90vh] min-h-[560px] w-full overflow-hidden">
      <HeroMedia property={property} />
      {overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />}

      {/*
        justify-end rather than justify-between.

        The two blocks were pinned to opposite ends of a 90vh box, which on a
        laptop left a screen-and-a-half of empty scrim between the buttons and
        the figures. This template is meant to be quiet, not sparse — the
        content now sits together at the base and lets the photograph have the
        upper two thirds, which is the point of a hero that "lets the building
        lead".
      */}
      <div className="relative z-10 flex h-full flex-col justify-end gap-12 px-6 pb-8 pt-32 sm:px-12">
        <div className="mx-auto w-full max-w-7xl">
          <HeroReveal delay={0.1} as="p"
            className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-white/70"
          >
            {[property.address?.neighborhood, property.address?.city].filter(Boolean).join(' · ')}
          </HeroReveal>
          <h1 className="max-w-3xl text-[38px] leading-[1.1] tracking-tight text-white sm:text-[58px]" style={{fontFamily:'var(--tpl-font-heading)',fontWeight:'var(--tpl-heading-weight)' as unknown as number}}>
            <RisingWords text={property.name} />
          </h1>
          {property.tagline && (
            <HeroReveal delay={0.45} as="p"
              className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/70"
            >
              {property.tagline}
            </HeroReveal>
          )}
          <HeroReveal delay={0.6} className="mt-8 flex items-center gap-3">
            <CtaRow ctaLabel={ctaLabel} onDark />
            <ChatWithDeveloper
              propertySlug={property.slug}
              tone="dark"
              variant="icon"
              label="Chat with the developer"
            />
          </HeroReveal>
        </div>

        {facts.length > 0 && (
          <HeroReveal delay={0.8} y={20}
            className={`mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 border-t border-white/20 pt-6 ${
              facts.length >= 4 ? 'sm:grid-cols-4' : facts.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
            }`}
          >
            {facts.map((f) => (
              <div key={f.label}>
                <p className="text-[22px] font-semibold leading-none text-white sm:text-[28px]">{f.value}</p>
                <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-white/60">{f.label}</p>
              </div>
            ))}
          </HeroReveal>
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
            {/* A dot and a word, matching the status treatment on the other
                heroes — over a photograph the status is a caption, not a
                filled badge competing with the headline beneath it. */}
            <motion.span
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/5 px-3.5 py-1.5 text-[12px] font-medium tracking-wide text-white backdrop-blur-sm"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-white" />
              {getStatusLabel(property.status)}
            </motion.span>

            <h1 className="max-w-xl text-[36px] leading-[1.1] tracking-tight text-white sm:text-[54px]" style={{fontFamily:'var(--tpl-font-heading)',fontWeight:'var(--tpl-heading-weight)' as unknown as number}}>
              <RisingWords text={property.name} />
            </h1>
            {property.tagline && (
              <HeroReveal delay={0.45} as="p"
                className="mt-5 max-w-md text-[16px] leading-relaxed text-white/75"
              >
                {property.tagline}
              </HeroReveal>
            )}
            <HeroReveal delay={0.6} className="mt-8 flex items-center gap-3">
              <CtaRow ctaLabel={ctaLabel} onDark />
              <ChatWithDeveloper
                propertySlug={property.slug}
                tone="dark"
                variant="icon"
                label="Chat with the developer"
              />
            </HeroReveal>
          </div>
        </div>
      </div>

      {/* Columns follow the fact count, so a development with two figures does
          not leave a third of the row empty. */}
      {facts.length > 0 && (
        <HeroReveal
          delay={0.7}
          y={20}
          className={`mx-auto mt-8 grid max-w-[1360px] grid-cols-1 gap-3 ${
            facts.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
          }`}
        >
          {facts.map((f) => (
            <div key={f.label} className="rounded-2xl bg-white/70 px-6 py-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                {f.label}
              </p>
              <p
                className="mt-1.5 text-[21px] text-neutral-900"
                style={{
                  fontFamily: 'var(--tpl-font-heading)',
                  fontWeight: 'var(--tpl-heading-weight)' as unknown as number,
                }}
              >
                {f.value}
              </p>
            </div>
          ))}
        </HeroReveal>
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
