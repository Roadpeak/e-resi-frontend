'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Box, Headset, MapPin, Sparkles } from 'lucide-react';
import type { Property } from '../../lib/types';
import { getStatusLabel, getStatusColor, cn } from '../../lib/utils';
import { playbackVideoUrl } from '../../lib/media/video';

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
  if (heroStyle === 'MINIMAL') return <MinimalHero property={property} overlay={overlay} />;
  return <CinematicHero property={property} overlay={overlay} />;
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

function StatusChips({ property, onDark = true }: { property: Property; onDark?: boolean }) {
  return (
    <>
      <span
        className={cn(
          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm',
          getStatusColor(property.status),
        )}
      >
        {getStatusLabel(property.status)}
      </span>
      <span
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm',
          onDark ? 'bg-gray-900/60 text-white' : 'bg-gray-100 text-gray-700',
        )}
      >
        by {property.developer.name}
      </span>
    </>
  );
}

/** Immersive capabilities — the reason this page exists rather than a listing. */
function CapabilityTags({ property, onDark = true }: { property: Property; onDark?: boolean }) {
  const items = [
    property.has3DTour && { icon: <Box size={11} />, label: 'Interactive 3D Model' },
    property.hasVRTour && { icon: <Headset size={11} />, label: 'Virtual Reality Tour' },
    property.hasDigitalTwin && { icon: <Sparkles size={11} />, label: 'Digital Twin' },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span
          key={t.label}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm',
            onDark ? 'bg-gray-900/70 text-white' : 'bg-gray-100 text-gray-700',
          )}
        >
          {t.icon} {t.label}
        </span>
      ))}
    </div>
  );
}

const scrollToBooking = () =>
  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

// ─── CINEMATIC — full-bleed, fades into the page ────────────────────────────

function CinematicHero({ property, overlay }: { property: Property; overlay: boolean }) {
  return (
    <section className="relative bg-white pt-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-[52vh] min-h-[400px] w-full overflow-hidden lg:h-[66vh]"
      >
        <HeroMedia property={property} />

        {overlay && (
          <>
            {/* Soft scrim under the navbar so it stays legible over the photo */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 via-white/20 to-transparent" />

            {/* Signature bottom fade-to-white */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white via-white/70 to-transparent lg:h-60" />
          </>
        )}

        <div className={cn('absolute inset-x-0 z-10', overlay ? 'top-6' : 'top-20')}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5 px-4 sm:px-6 lg:px-8"
          >
            <StatusChips property={property} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="absolute inset-x-0 bottom-8 z-10"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <CapabilityTags property={property} />
          </div>
        </motion.div>
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

            <CapabilityTags property={property} onDark={false} />

            <button
              type="button"
              onClick={scrollToBooking}
              className="mt-1 inline-flex w-fit items-center rounded-full px-6 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-on)' }}
            >
              {ctaLabel ?? 'Book a viewing'}
            </button>
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
function MinimalHero({ property, overlay }: { property: Property; overlay: boolean }) {
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

      {/* Tags sit below the band rather than over it — at this height an
          overlay would crowd the image against the scrim. */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <CapabilityTags property={property} onDark={false} />
      </div>
    </section>
  );
}
