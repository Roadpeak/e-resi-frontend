'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { Property } from '../../lib/types';
import { getStatusLabel, getStatusColor, formatPrice, cn } from '../../lib/utils';
import { playbackVideoUrl } from '../../lib/media/video';
import { heroFacts } from './templates/shared';
import { ChatWithDeveloper } from '../chat/ChatWithDeveloper';

interface Props {
  property: Property;
  /**
   * Opening treatment chosen by the developer — see HERO_STYLES in
   * lib/branding/theme. CINEMATIC is the default and the previous behaviour,
   * so an existing development renders unchanged until someone picks another.
   */
  heroStyle?: string;
  /** Primary call to action wording, developer-configurable. */
  ctaLabel?: string;
  /**
   * Whether to keep the gradient overlay over the hero image. Defaults on:
   * the scrims are what keep the overlaid status chips legible, so a
   * developer turning them off is opting into a cleaner render and accepting
   * that the chips sit on bare photography.
   */
  overlay?: boolean;
}

/**
 * The opening of the mini-site.
 *
 * The three styles exist because developments genuinely open differently: a
 * finished tower sells on the photography, an off-plan scheme sells on the
 * numbers, and a development whose real asset is the tour wants the page to
 * start at the content rather than at another full-bleed render.
 *
 * The name, price and tagline deliberately live in PropertyOverview below —
 * repeating them here would give every visitor the same headline twice.
 */
export function PropertyHero({
  property,
  heroStyle = 'CINEMATIC',
  ctaLabel,
  overlay = true,
}: Props) {
  // SPLIT has no overlay to begin with — its media sits in its own rounded
  // panel with the text beside it, never on top of it.
  if (heroStyle === 'SPLIT') return <SplitHero property={property} ctaLabel={ctaLabel} />;
  if (heroStyle === 'MINIMAL')
    return <MinimalHero property={property} overlay={overlay} ctaLabel={ctaLabel} />;
  return <CinematicHero property={property} overlay={overlay} ctaLabel={ctaLabel} />;
}

// ─── Shared pieces ──────────────────────────────────────────────────────────

/** Hero photograph or looping video, filling whatever box it is given. */
function HeroMedia({ property, priority = true }: { property: Property; priority?: boolean }) {
  if (property.heroVideoUrl) {
    return (
      <video
        src={playbackVideoUrl(property.heroVideoUrl)}
        poster={property.heroImageUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <Image
      src={property.heroImageUrl}
      alt={property.name}
      fill
      priority={priority}
      className="object-cover"
      sizes="100vw"
    />
  );
}

/**
 * Status over the hero photograph.
 *
 * `getStatusColor` returns a light-mode chip — `bg-brand-100`, `bg-amber-100`
 * — which is built for a white page. Dropped onto a dark hero image it read as
 * a pale sticker stuck on the render: a filled block competing with the
 * headline right beneath it, in a colour that belongs to neither the
 * photograph nor the developer's brand.
 *
 * Over an image the status is a caption, not a badge. A dot and a word on a
 * hairline pill states it without asking for the attention a filled chip
 * demands, and it works over any photograph because it carries its own
 * contrast rather than borrowing a background colour.
 */
function StatusChips({ property, onDark = true }: { property: Property; onDark?: boolean }) {
  // Off the hero — on a white ground — the original filled chip is right.
  if (!onDark) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
          getStatusColor(property.status),
        )}
      >
        {getStatusLabel(property.status)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-3.5 py-1.5 text-[12px] font-medium tracking-wide text-white backdrop-blur-sm">
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-white"
      />
      {getStatusLabel(property.status)}
    </span>
  );
}

/*
 * CapabilityTags removed.
 *
 * "Interactive 3D Model" and "Virtual Reality Tour" were chips over the hero
 * repeating what the overview's tour cards now say properly, a screen below.
 * Two statements of the same fact, and the hero's was the smaller one.
 */

const scrollToBooking = () =>
  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

// ─── CINEMATIC — full-bleed, the fold carries the facts ─────────────────────

/**
 * The opening most developments get.
 *
 * The name, location, price and the two or three numbers a buyer decides on sit
 * *over* the base of the photograph rather than in a white band beneath it.
 * That is the whole point of the treatment: a render with a caption below it
 * wastes the most valuable screen on the page, and pushed the price and the
 * unit count below the fold on a laptop. Composing them into the image means
 * the first screen answers "what, where, how much" without a scroll.
 *
 * The scrim is not decoration — it is what makes white type over an unknown
 * photograph legible. It stays even when the developer turns `overlay` off;
 * what `overlay` controls is the *upper* wash and the fade into the page, not
 * the readability floor under the text.
 */
function CinematicHero({
  property,
  overlay,
  ctaLabel,
}: {
  property: Property;
  overlay: boolean;
  ctaLabel?: string;
}) {
  const location = [property.address?.neighborhood, property.address?.city]
    .filter(Boolean)
    .join(', ');

  // Only figures this development actually has, and never one already stated
  // above: "From" repeats the price shown at full size, and "Location" repeats
  // the line under the name. What is left is genuinely new information.
  const facts = heroFacts(property)
    .filter((f) => f.label !== 'Location' && f.label !== 'From')
    .slice(0, 3);

  // Bedroom range and unit size, which heroFacts does not derive but a buyer
  // scanning the fold wants as much as the price.
  const beds = (property.units ?? [])
    .map((u) => u.bedrooms)
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  if (beds.length) {
    const lo = Math.min(...beds);
    const hi = Math.max(...beds);
    const label = (n: number) => (n === 0 ? 'Studio' : `${n}`);
    facts.push({
      label: 'Bedrooms',
      value: lo === hi ? label(lo) : `${label(lo)}–${hi}`,
    });
  }

  return (
    <section className="relative bg-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-[76vh] min-h-[520px] w-full overflow-hidden lg:h-[84vh]"
      >
        <HeroMedia property={property} />

        {/*
          One scrim, not two.

          There used to be a black gradient rising from the base *and* a white
          fade-to-page layered over the same hundred pixels. Black rising into
          white across one band resolves to a muddy grey haze — the two were
          literally cancelling each other out, and it was the reason the bottom
          of the hero looked dirty rather than deliberate.

          The white fade was a holdover from when the headline sat in a white
          band *below* the image. Now that the type sits on the photograph, a
          fade to the page ground works directly against the thing keeping that
          type legible. So: a single scrim, weighted to the base where the text
          is, easing to nothing by the upper third.

          Multi-stop rather than a plain two-stop ramp. A linear fade from 85%
          to transparent has a visible edge partway up where the eye catches
          the midpoint; easing the stops keeps the falloff invisible, which is
          what separates a scrim you don't notice from a grey band across a
          photograph.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.72) 12%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.04) 70%, transparent 88%)',
          }}
        />
        {overlay && (
          /* Under the fixed navbar, so its links hold up over a bright sky.
             Short and weak — it only has to carry the bar. */
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-28"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)',
            }}
          />
        )}

        {/* ── The fold: identity, price and figures over the image ── */}
        <div className="absolute inset-x-0 bottom-0 z-10 pb-14 sm:pb-16 lg:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusChips property={property} />
              </div>

              <h1
                className="mt-5 text-[clamp(2.25rem,5.2vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white"
                style={{ fontFamily: 'var(--brand-font-heading)' }}
              >
                {property.name}
              </h1>

              {location && (
                <p className="mt-3 flex items-center gap-1.5 text-[15px] text-white/75">
                  <MapPin size={15} className="shrink-0" />
                  {location}
                </p>
              )}

              {/* Price and CTA read as one decision, so they sit on one line. */}
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
                {property.priceFrom > 0 && (
                  <p className="text-[28px] font-bold leading-none text-white sm:text-[32px]">
                    {formatPrice(property.priceFrom, property.currency)}
                    {property.priceTo > property.priceFrom && (
                      <span className="ml-2 text-[17px] font-medium text-white/60">
                        – {formatPrice(property.priceTo, property.currency)}
                      </span>
                    )}
                  </p>
                )}
                <button
                  type="button"
                  onClick={scrollToBooking}
                  className="inline-flex cursor-pointer items-center rounded-full px-7 py-3 text-[15px] font-semibold shadow-lg transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-on)' }}
                >
                  {ctaLabel ?? 'Book a viewing'}
                </button>

                {/*
                  Talking to the developer, at the fold.

                  It already existed further down the page, but a buyer who has
                  just read the price and has one question — is the top-floor
                  unit still available, can you do a payment plan — should not
                  have to scroll to ask it. As a glyph rather than a second
                  pill: the booking CTA is the primary action and stays the only
                  filled control here, so this reads as the quieter alternative
                  it is. It hides itself for developers and admins, and sends
                  logged-out visitors to sign in and back.
                */}
                <ChatWithDeveloper
                  propertySlug={property.slug}
                  tone="dark"
                  variant="icon"
                  label="Chat with the developer"
                />
              </div>

              {/* Figures, divided rather than boxed — a card here would read as
                  a second surface floating on the photograph. */}
              {facts.length > 0 && (
                <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/20 pt-6">
                  {facts.map((f) => (
                    <div key={f.label}>
                      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
                        {f.label}
                      </dt>
                      <dd className="mt-1 text-[17px] font-semibold text-white">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── SPLIT — image beside the facts ─────────────────────────────────────────

/**
 * Media on one side, the essentials on the other.
 *
 * Suits off-plan schemes, where a buyer is committing to something that does
 * not exist yet and wants price, location and completion before they will
 * look at a render.
 */
function SplitHero({ property, ctaLabel }: { property: Property; ctaLabel?: string }) {
  const location = [property.address?.neighborhood, property.address?.city]
    .filter(Boolean)
    .join(', ');

  const completion = property.completionDate
    ? new Date(property.completionDate).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <section className="bg-white pt-16">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid items-stretch gap-6 lg:grid-cols-[1.35fr_1fr]"
        >
          {/* Media */}
          <div className="relative order-1 h-[38vh] min-h-[280px] overflow-hidden rounded-3xl lg:h-[62vh]">
            <HeroMedia property={property} />
          </div>

          {/* Facts */}
          <div className="order-2 flex flex-col justify-center gap-5 lg:py-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusChips property={property} onDark={false} />
            </div>

            {location && (
              <p className="flex items-center gap-1.5 text-[15px] text-gray-600">
                <MapPin size={15} className="shrink-0" />
                {location}
              </p>
            )}

            {property.tagline && (
              <p
                className="text-2xl font-semibold leading-snug text-gray-900"
                style={{ fontFamily: 'var(--brand-font-heading)' }}
              >
                {property.tagline}
              </p>
            )}

            {completion && (
              <p className="text-[15px] text-gray-600">
                Completion <span className="font-medium text-gray-900">{completion}</span>
              </p>
            )}

            {/* tone="light": unlike every other hero, Split's copy sits on the
                page's white ground beside the image rather than over it, so the
                dark treatment would be a black button on white. */}
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={scrollToBooking}
                className="inline-flex w-fit items-center rounded-full px-6 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-on)' }}
              >
                {ctaLabel ?? 'Book a viewing'}
              </button>
              <ChatWithDeveloper
                propertySlug={property.slug}
                tone="light"
                variant="icon"
                label="Chat with the developer"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── MINIMAL — compact band, content starts immediately ─────────────────────

/**
 * A short banner rather than a full-bleed opening.
 *
 * For developments whose real asset is the tour or the unit list: a second
 * large render above the fold only delays the thing the buyer came for.
 */
function MinimalHero({
  property,
  overlay,
  ctaLabel,
}: {
  property: Property;
  overlay: boolean;
  ctaLabel?: string;
}) {
  return (
    <section className="bg-white pt-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-[26vh] min-h-[180px] w-full overflow-hidden lg:h-[32vh]"
      >
        <HeroMedia property={property} />
        {overlay && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 via-white/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/60 to-transparent" />
          </>
        )}

        <div className="absolute inset-x-0 top-5 z-10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5 px-4 sm:px-6 lg:px-8">
            <StatusChips property={property} />
          </div>
        </div>
      </motion.div>

      {/*
        The two actions, below the band rather than over it — at this height an
        overlay would crowd the image against the scrim.

        Minimal is deliberately short: a development whose real asset is the
        tour or the unit list should not be delayed by another full-bleed
        render. That is not a reason to make a buyer scroll to find out how to
        get in touch, though, so the same pair every other hero carries sits
        here on the page's own ground.
      */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 pt-5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={scrollToBooking}
          className="inline-flex cursor-pointer items-center rounded-full px-6 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-on)' }}
        >
          {ctaLabel ?? 'Book a viewing'}
        </button>
        <ChatWithDeveloper
          propertySlug={property.slug}
          tone="light"
          variant="icon"
          label="Chat with the developer"
        />
      </div>
    </section>
  );
}
