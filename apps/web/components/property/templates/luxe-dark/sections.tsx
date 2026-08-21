'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, MapPin } from 'lucide-react';
import type { Property, Unit, FloorPlan, Amenity, ConstructionUpdate } from '../../../../lib/types';
import { formatPrice, formatCompletionDate } from '../../../../lib/utils';
import { useBooking, useLightbox, useUnits, unitStatus } from '../hooks';
import { Reveal } from '../shared';

/**
 * Dark Luxury sections.
 *
 * Written for this template rather than inherited: the shared sections are
 * built for a white page, so on a near-black ground they render white cards
 * and dark-on-dark text. Everything here is the same data and the same
 * behaviour — the behaviour comes from ../hooks — laid out for a dark,
 * editorial page with large numerals and hairline rules.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/** Section heading: an index, a rule, and an oversized title. */
function Heading({
  index,
  eyebrow,
  title,
  children,
}: {
  index: string;
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-14 border-t border-white/15 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="mb-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
            <span className="tabular-nums">{index}</span>
            <span className="h-px w-8 bg-white/25" />
            {eyebrow}
          </p>
          <h2 className="text-[32px] font-light leading-[1.08] tracking-[-0.02em] text-white sm:text-[46px]">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────

export function LuxeOverview({ property }: { property: Property }) {
  // Derived from the units themselves: the API leaves totalUnits null on
  // developments whose counts were never denormalised.
  const unitCount = property.units?.length ?? 0;
  const availableNow = (property.units ?? []).filter(
    (u) => String(u.status ?? '').toLowerCase() === 'available',
  ).length;
  const stats = [
    { value: String(property.totalUnits || unitCount || '—'), label: 'Total residences' },
    { value: String(property.availableUnits ?? availableNow ?? 0), label: 'Available now' },
    {
      value: property.completionDate ? formatCompletionDate(property.completionDate) : 'Ready',
      label: 'Completion',
    },
    {
      value: property.priceFrom ? formatPrice(property.priceFrom, property.currency) : '—',
      label: 'Priced from',
    },
  ];

  return (
    <div>
      <Heading index="01" eyebrow="The development" title={property.tagline || property.name} />

      <div className="grid gap-16 lg:grid-cols-[1.15fr_1fr]">
        <Reveal>
          <p className="text-[17px] leading-[1.85] text-white/65">{property.description}</p>

          {property.features?.length > 0 && (
            <ul className="mt-10 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {property.features.slice(0, 8).map((f) => (
                <li key={f} className="flex items-start gap-3 text-[15px] text-white/70">
                  <Check size={15} className="mt-1 shrink-0" style={{ color: 'var(--brand)' }} />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        {/* Large numerals on hairlines — the reference's signature. */}
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`border-white/12 px-2 py-9 ${i % 2 === 0 ? 'border-r' : ''} ${
                  i < 2 ? 'border-b' : ''
                }`}
              >
                <p className="text-[34px] font-light leading-none tracking-tight text-white sm:text-[42px]">
                  {s.value}
                </p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ─── Gallery ────────────────────────────────────────────────────────────────

export function LuxeGallery({ images, name }: { images: string[]; name: string }) {
  const lb = useLightbox(images);
  if (!images?.length) return null;

  return (
    <div>
      <Heading index="02" eyebrow="Gallery" title="Every angle of the building." />

      {/* Deliberately irregular: a uniform grid reads as a listing, this reads
          as a portfolio. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {images.slice(0, 8).map((src, i) => {
          const wide = i === 0 || i === 5;
          return (
            <motion.button
              key={src + i}
              type="button"
              onClick={() => lb.open(i)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.7, delay: (i % 4) * 0.06, ease: EASE }}
              className={`group relative cursor-pointer overflow-hidden bg-white/5 ${
                wide ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/5]'
              }`}
            >
              <Image
                src={src}
                alt={`${name} — ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.06]"
              />
              <span className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.button>
          );
        })}
      </div>

      {lb.isOpen && lb.index !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-6"
          onClick={lb.close}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => { e.stopPropagation(); lb.prev(); }}
            className="absolute left-6 cursor-pointer p-4 text-white/60 transition-colors hover:text-white"
            aria-label="Previous"
          >
            ←
          </button>
          <div className="relative h-[80vh] w-full max-w-5xl">
            <Image src={images[lb.index]} alt="" fill className="object-contain" sizes="100vw" />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); lb.next(); }}
            className="absolute right-6 cursor-pointer p-4 text-white/60 transition-colors hover:text-white"
            aria-label="Next"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Units ──────────────────────────────────────────────────────────────────

export function LuxeUnits({
  units,
  currency,
  propertySlug,
}: {
  units: Unit[];
  currency: string;
  propertySlug: string;
}) {
  const { filter, setFilter, displayed, availableCount, total } = useUnits(units);
  if (!units?.length) return null;

  return (
    <div>
      <Heading index="03" eyebrow="Availability" title="Residences.">
        <div className="flex gap-1 border border-white/15 p-1">
          {(['all', 'available'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="cursor-pointer px-5 py-2 text-[12px] uppercase tracking-[0.14em] transition-colors"
              style={
                filter === f
                  ? { background: 'var(--brand)', color: 'var(--brand-on)' }
                  : { color: 'rgba(255,255,255,0.55)' }
              }
            >
              {f === 'all' ? `All ${total}` : `Available ${availableCount}`}
            </button>
          ))}
        </div>
      </Heading>

      {/* A table, not cards: a buyer comparing residences is comparing rows. */}
      <div className="border-t border-white/12">
        {displayed.map((unit, i) => {
          const status = unitStatus(unit);
          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.55, delay: Math.min(i, 6) * 0.025, ease: EASE }}
              className="group grid grid-cols-2 items-center gap-4 border-b border-white/12 py-7 sm:grid-cols-[1.4fr_repeat(3,0.8fr)_auto]"
            >
              <div>
                <p className="text-[19px] font-light text-white">{unit.name}</p>
                <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-white/35">
                  Floor {unit.floor}
                </p>
              </div>
              <p className="text-[15px] text-white/60">
                {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}
              </p>
              <p className="hidden text-[15px] text-white/60 sm:block">{unit.sqm} m²</p>
              <p className="text-[17px] font-light text-white">
                {formatPrice(unit.price, unit.currency || currency)}
              </p>
              <div className="flex items-center justify-end gap-4">
                <span
                  className="text-[11px] uppercase tracking-[0.16em]"
                  style={{
                    color: status.actionable ? 'var(--brand)' : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {status.label}
                </span>
                <Link
                  href={`/${propertySlug}/units/${unit.id}`}
                  aria-label={`View ${unit.name}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/20 text-white/70 transition-colors hover:border-white/50 hover:text-white"
                >
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Floor plans ────────────────────────────────────────────────────────────

export function LuxeFloorPlans({ floorPlans }: { floorPlans: FloorPlan[] }) {
  if (!floorPlans?.length) return null;

  return (
    <div>
      <Heading index="04" eyebrow="Layouts" title="Floor plans." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {floorPlans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: EASE }}
            className="border border-white/12 p-5 transition-colors hover:border-white/25"
          >
            <div className="relative aspect-[4/3] bg-white/[0.03]">
              {plan.imageUrl && (
                <Image
                  src={plan.imageUrl}
                  alt={plan.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain p-3"
                />
              )}
            </div>
            <p className="mt-5 text-[18px] font-light text-white">{plan.name}</p>
            <p className="mt-1.5 text-[13px] text-white/45">
              {plan.bedrooms === 0 ? 'Studio' : `${plan.bedrooms} bed`} · {plan.bathrooms} bath · {plan.sqm} m²
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Location ───────────────────────────────────────────────────────────────

export function LuxeLocation({
  address,
  amenities,
}: {
  address: Property['address'];
  amenities: Amenity[];
}) {
  return (
    <div>
      <Heading index="05" eyebrow="Location" title="Where it stands." />
      <div className="grid gap-14 lg:grid-cols-2">
        <Reveal>
          <p className="flex items-start gap-3 text-[17px] leading-relaxed text-white/70">
            <MapPin size={18} className="mt-1 shrink-0" style={{ color: 'var(--brand)' }} />
            <span>
              {[address?.street, address?.neighborhood, address?.city, address?.county]
                .filter(Boolean)
                .join(', ')}
            </span>
          </p>
        </Reveal>

        {amenities?.length > 0 && (
          <Reveal delay={0.08}>
            <p className="mb-5 text-[11px] uppercase tracking-[0.2em] text-white/40">Nearby</p>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {amenities.slice(0, 10).map((a) => (
                <p key={a.id ?? a.name} className="text-[15px] text-white/65">
                  {a.name}
                  {a.distance ? <span className="text-white/35"> · {a.distance}</span> : null}
                </p>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}

// ─── Construction ───────────────────────────────────────────────────────────

export function LuxeConstruction({ updates }: { updates: ConstructionUpdate[] }) {
  if (!updates?.length) return null;

  return (
    <div>
      <Heading index="06" eyebrow="Progress" title="Construction." />
      <div className="space-y-0 border-t border-white/12">
        {updates.map((u, i) => (
          <motion.div
            key={u.id ?? i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.55, delay: Math.min(i, 6) * 0.03, ease: EASE }}
            className="grid gap-6 border-b border-white/12 py-8 sm:grid-cols-[160px_1fr_auto]"
          >
            <p className="text-[13px] uppercase tracking-[0.14em] text-white/40">
              {u.date ? new Date(u.date).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) : ''}
            </p>
            <div>
              <p className="text-[17px] font-light text-white">{u.title}</p>
              {u.description && (
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/55">{u.description}</p>
              )}
            </div>
            {typeof u.percentComplete === 'number' && (
              <p className="text-[28px] font-light leading-none text-white/80">{u.percentComplete}%</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Booking ────────────────────────────────────────────────────────────────

export function LuxeBooking({ property }: { property: Property }) {
  const b = useBooking(property);

  const fieldCls =
    'w-full border-b border-white/20 bg-transparent py-3.5 text-[16px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/60';

  if (b.submitted) {
    return (
      <div className="border border-white/15 px-8 py-20 text-center">
        <p className="text-[26px] font-light text-white">Request received.</p>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
          The team at {property.developer?.name || 'this development'} will confirm your viewing
          shortly.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Heading index="07" eyebrow="Enquire" title="Arrange a viewing." />

      <form onSubmit={b.onSubmit} className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="max-w-sm text-[16px] leading-relaxed text-white/60">
            Tell us when suits you. A member of the team will confirm and, if you prefer, walk you
            through the residence remotely.
          </p>

          <div className="mt-9 flex gap-2">
            {(['virtual', 'physical'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => b.setViewType(t)}
                className="cursor-pointer border px-5 py-2.5 text-[12px] uppercase tracking-[0.14em] transition-colors"
                style={
                  b.viewType === t
                    ? { borderColor: 'var(--brand)', color: 'var(--brand)' }
                    : { borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                {t === 'virtual' ? 'Virtual' : 'In person'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <input {...b.register('name')} placeholder="Full name" className={fieldCls} />
            {b.errors.name && <p className="mt-2 text-[12px] text-red-400">{b.errors.name.message}</p>}
          </div>
          <div>
            <input {...b.register('email')} placeholder="Email" className={fieldCls} />
            {b.errors.email && <p className="mt-2 text-[12px] text-red-400">{b.errors.email.message}</p>}
          </div>
          <div>
            <input {...b.register('phone')} placeholder="Phone" className={fieldCls} />
            {b.errors.phone && <p className="mt-2 text-[12px] text-red-400">{b.errors.phone.message}</p>}
          </div>
          <div>
            <input type="date" {...b.register('preferredDate')} className={fieldCls} />
            {b.errors.preferredDate && (
              <p className="mt-2 text-[12px] text-red-400">{b.errors.preferredDate.message}</p>
            )}
          </div>
          <div>
            <input type="time" {...b.register('preferredTime')} className={fieldCls} />
          </div>
          <div className="sm:col-span-2">
            <textarea
              {...b.register('message')}
              rows={2}
              placeholder="Anything we should know? (optional)"
              className={`${fieldCls} resize-none`}
            />
          </div>

          {b.serverError && (
            <p className="text-[13px] text-red-400 sm:col-span-2">{b.serverError}</p>
          )}

          <button
            type="submit"
            disabled={b.isSubmitting}
            className="mt-2 cursor-pointer justify-self-start px-9 py-4 text-[13px] uppercase tracking-[0.16em] transition-opacity hover:opacity-90 disabled:opacity-50 sm:col-span-2"
            style={{ background: 'var(--brand)', color: 'var(--brand-on)' }}
          >
            {b.isSubmitting ? 'Sending…' : 'Request viewing'}
          </button>
        </div>
      </form>
    </div>
  );
}
