'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, MapPin } from 'lucide-react';
import type {
  Property, Unit, FloorPlan, Amenity, ConstructionUpdate,
} from '../../../lib/types';
import { formatPrice, formatCompletionDate } from '../../../lib/utils';
import type { SectionCopy } from '../../../lib/branding/theme';
import { useBooking, useLightbox, useUnits, unitStatus } from './hooks';
import { UnitTypeList } from '../UnitTypeList';
import { unitCurrency } from '../../../lib/units/unit-types';
import { ChatWithDeveloper } from '../../chat/ChatWithDeveloper';
import { Reveal } from './shared';

/**
 * A parameterised section kit.
 *
 * Dark Luxury is written out by hand because its treatment is unlike anything
 * else. The remaining templates differ along a describable set of axes —
 * whether units are a table or cards, whether the gallery is a mosaic or a
 * strip, how headings are set — so they are expressed as a style object rather
 * than seven near-copies that would drift apart the first time one is fixed.
 *
 * The behaviour still comes from ./hooks, so every template files a booking
 * and filters units identically.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export interface KitStyle {
  /** Dark ground: flips text, borders and card fills. */
  onDark: boolean;
  /** Card corner radius, e.g. 'rounded-2xl' or 'rounded-none'. */
  radius: string;
  /** How a section announces itself. */
  headingKind: 'numbered' | 'eyebrow' | 'plain';
  /** Units as an editorial table or as cards. */
  unitsAs: 'table' | 'cards';
  /** Gallery arrangement. */
  galleryAs: 'mosaic' | 'grid' | 'strip';
  /** Cards carry a hairline border rather than a filled panel. */
  outlined: boolean;
}

// ─── Tokens derived from the style ──────────────────────────────────────────

function tone(s: KitStyle) {
  return s.onDark
    ? {
        text: 'text-white',
        heading: 'text-white',
        body: 'text-white/65',
        muted: 'text-white/45',
        faint: 'text-white/35',
        border: 'border-white/12',
        borderStrong: 'border-white/25',
        panel: s.outlined ? 'bg-transparent' : 'bg-white/[0.04]',
        field: 'border-white/20 text-white placeholder:text-white/30 focus:border-white/60',
      }
    : {
        text: 'text-neutral-900',
        heading: 'text-neutral-900',
        body: 'text-neutral-600',
        muted: 'text-neutral-500',
        faint: 'text-neutral-400',
        border: 'border-neutral-200',
        borderStrong: 'border-neutral-300',
        panel: s.outlined ? 'bg-transparent' : 'bg-neutral-50',
        field: 'border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900',
      };
}

/** Heading, in whichever of the three manners this template uses. */
export function KitHeading({
  style,
  index,
  eyebrow,
  title,
  copy,
  children,
}: {
  style: KitStyle;
  index: string;
  eyebrow: string;
  title: string;
  /** Developer overrides. Blank fields fall through to the wording above. */
  copy?: SectionCopy;
  children?: React.ReactNode;
}) {
  const t = tone(style);
  const numbered = style.headingKind === 'numbered';
  const shownTitle = copy?.heading?.trim() || title;

  return (
    <div className={`mb-12 ${numbered ? `border-t ${t.border} pt-8` : ''}`}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          {style.headingKind !== 'plain' && (
            <p className={`mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${t.faint}`}>
              {numbered && (
                <>
                  <span className="tabular-nums">{index}</span>
                  <span className={`h-px w-8 ${style.onDark ? 'bg-white/25' : 'bg-neutral-300'}`} />
                </>
              )}
              <span style={numbered ? undefined : { color: 'var(--brand)' }}>{eyebrow}</span>
            </p>
          )}
          <h2
            className={`text-[30px] leading-[1.1] sm:text-[42px] ${t.heading}`}
            style={{
              fontFamily: 'var(--tpl-font-heading)',
              fontWeight: 'var(--tpl-heading-weight)' as unknown as number,
              letterSpacing: 'var(--tpl-heading-tracking)',
            }}
          >
            {shownTitle}
          </h2>
          {copy?.body && (
            <p className={`mt-4 max-w-[60ch] text-[16px] leading-relaxed ${t.body}`}>{copy.body}</p>
          )}
          {copy?.ctaLabel && copy?.ctaHref && (
            <a
              href={copy.ctaHref}
              // Developer-supplied destinations can be off-site, so never hand
              // the target window a reference back to this page.
              {...(/^https?:/i.test(copy.ctaHref)
                ? { target: '_blank', rel: 'noreferrer noopener' }
                : {})}
              className={`mt-6 inline-flex items-center gap-2 ${style.radius} px-6 py-3 text-[13px] font-medium uppercase tracking-[0.12em] transition-opacity hover:opacity-90`}
              style={{ background: 'var(--brand)', color: 'var(--brand-on)' }}
            >
              {copy.ctaLabel}
            </a>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────

export function KitOverview({ property, style, copy }: { property: Property; style: KitStyle; copy?: SectionCopy }) {
  const t = tone(style);
  // Derive from the units we actually have rather than trusting totalUnits /
  // availableUnits, which the API leaves null on developments whose counts were
  // never denormalised — that rendered "—" beside a filter reading "All 7".
  const unitCount = property.units?.length ?? 0;
  const availableCount = (property.units ?? []).filter(
    (u) => String(u.status ?? '').toLowerCase() === 'available',
  ).length;
  const stats = [
    { value: String(property.totalUnits || unitCount || '—'), label: 'Total units' },
    { value: String(property.availableUnits ?? availableCount ?? 0), label: 'Available' },
    {
      value: property.completionDate ? formatCompletionDate(property.completionDate) : 'Ready',
      label: 'Completion',
    },
    {
      value: property.priceFrom ? formatPrice(property.priceFrom, property.currency) : '—',
      label: 'From',
    },
  ];

  return (
    <div>
      <KitHeading
        style={style}
        index="01"
        eyebrow="The development"
        title={property.tagline || property.name}
        copy={copy}
      />

      <div className="grid gap-14 lg:grid-cols-[1.15fr_1fr]">
        <Reveal>
          <p className={`text-[17px] leading-[1.8] ${t.body}`}>{property.description}</p>

          {/* The tours have their own section now — this keeps the way to
              reach the developer, which every template still needs here. */}
          <div className="mt-8">
            <ChatWithDeveloper propertySlug={property.slug} className="inline-flex" />
          </div>

          {property.features?.length > 0 && (
            <ul className="mt-9 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {property.features.slice(0, 8).map((f) => (
                <li key={f} className={`flex items-start gap-3 text-[15px] ${t.body}`}>
                  <Check size={15} className="mt-1 shrink-0" style={{ color: 'var(--brand)' }} />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          {style.headingKind === 'numbered' ? (
            // Hairline quadrant — the editorial treatment.
            <div className="grid grid-cols-2">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`${t.border} px-2 py-8 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''}`}
                >
                  <p
                    className={`text-[32px] leading-none sm:text-[40px] ${t.heading}`}
                    style={{ fontFamily: 'var(--tpl-font-heading)', fontWeight: 'var(--tpl-heading-weight)' as unknown as number }}
                  >
                    {s.value}
                  </p>
                  <p className={`mt-3 text-[11px] uppercase tracking-[0.16em] ${t.faint}`}>{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            // Panel cards — the product-like treatment.
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.label} className={`${style.radius} ${t.panel} ${style.outlined ? `border ${t.border}` : ''} p-6`}>
                  <p className={`text-[24px] font-semibold leading-none ${t.heading}`}>{s.value}</p>
                  <p className={`mt-2 text-[12px] ${t.muted}`}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}

// ─── Gallery ────────────────────────────────────────────────────────────────

export function KitGallery({
  images,
  name,
  style,
  copy,
}: {
  images: string[];
  name: string;
  style: KitStyle;
  copy?: SectionCopy;
}) {
  const lb = useLightbox(images);
  if (!images?.length) return null;

  const shown = images.slice(0, style.galleryAs === 'strip' ? 6 : 8);

  return (
    <div>
      <KitHeading style={style} index="02" eyebrow="Gallery" title="Inside the development."
        copy={copy} />

      <div
        className={
          style.galleryAs === 'strip'
            ? 'flex snap-x gap-4 overflow-x-auto pb-4'
            : `grid gap-3 sm:gap-4 ${style.galleryAs === 'mosaic' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`
        }
      >
        {shown.map((src, i) => {
          const wide = style.galleryAs === 'mosaic' && (i === 0 || i === 5);
          return (
            <motion.button
              key={src + i}
              type="button"
              onClick={() => lb.open(i)}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.65, delay: (i % 4) * 0.06, ease: EASE }}
              className={`group relative cursor-pointer overflow-hidden ${style.radius} ${
                style.galleryAs === 'strip'
                  ? 'aspect-[4/3] w-[78vw] shrink-0 snap-start sm:w-[380px]'
                  : wide
                    ? 'col-span-2 aspect-[16/10]'
                    : 'aspect-[4/5]'
              }`}
            >
              <Image
                src={src}
                alt={`${name} — ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.06]"
              />
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
          <button onClick={(e) => { e.stopPropagation(); lb.prev(); }} className="absolute left-6 cursor-pointer p-4 text-white/60 hover:text-white" aria-label="Previous">←</button>
          <div className="relative h-[80vh] w-full max-w-5xl">
            <Image src={images[lb.index]} alt="" fill className="object-contain" sizes="100vw" />
          </div>
          <button onClick={(e) => { e.stopPropagation(); lb.next(); }} className="absolute right-6 cursor-pointer p-4 text-white/60 hover:text-white" aria-label="Next">→</button>
        </div>
      )}
    </div>
  );
}

// ─── Units ──────────────────────────────────────────────────────────────────

export function KitUnits({
  units,
  currency,
  propertySlug,
  style,
  copy,
  priceDisplay,
}: {
  units: Unit[];
  currency: string;
  propertySlug: string;
  style: KitStyle;
  copy?: SectionCopy;
  priceDisplay?: Record<string, string> | null;
}) {
  const t = tone(style);
  const { filter, setFilter, displayed, availableCount, total } = useUnits(units);
  // The typology leads, as on the default template: what a buyer is choosing
  // between is layouts, not apartment numbers.
  const [byType, setByType] = useState(true);
  if (!units?.length) return null;

  const Filter = (
    <div className={`flex gap-1 border ${t.borderStrong} ${style.radius} p-1`}>
      <button
        onClick={() => setByType(true)}
        className={`cursor-pointer px-5 py-2 text-[12px] uppercase tracking-[0.12em] transition-colors ${style.radius}`}
        style={byType ? { background: 'var(--brand)', color: 'var(--brand-on)' } : undefined}
      >
        <span className={byType ? '' : t.muted}>By type</span>
      </button>
      {(['all', 'available'] as const).map((f) => {
        const active = !byType && filter === f;
        return (
          <button
            key={f}
            onClick={() => {
              setByType(false);
              setFilter(f);
            }}
            className={`cursor-pointer px-5 py-2 text-[12px] uppercase tracking-[0.12em] transition-colors ${style.radius}`}
            style={active ? { background: 'var(--brand)', color: 'var(--brand-on)' } : undefined}
          >
            <span className={active ? '' : t.muted}>
              {f === 'all' ? `All ${total}` : `Available ${availableCount}`}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <KitHeading style={style} index="03" eyebrow="Availability" title="Units & pricing."
        copy={copy}>
        {Filter}
      </KitHeading>

      {byType ? (
        <UnitTypeList
          units={units}
          propertySlug={propertySlug}
          currency={currency}
          priceDisplay={priceDisplay}
          onDark={style.onDark}
          radius={style.radius}
          className="mt-8"
        />
      ) : style.unitsAs === 'table' ? (
        <div className={`border-t ${t.border}`}>
          {displayed.map((unit, i) => {
            const st = unitStatus(unit);
            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.025, ease: EASE }}
                className={`grid grid-cols-2 items-center gap-4 border-b ${t.border} py-6 sm:grid-cols-[1.4fr_repeat(3,0.8fr)_auto]`}
              >
                <div>
                  <p className={`text-[18px] ${t.heading}`}>{unit.name}</p>
                  <p className={`mt-1 text-[12px] uppercase tracking-[0.12em] ${t.faint}`}>Floor {unit.floor}</p>
                </div>
                <p className={`text-[15px] ${t.body}`}>{unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}</p>
                <p className={`hidden text-[15px] sm:block ${t.body}`}>{unit.sqm} m²</p>
                <p className={`text-[17px] ${t.heading}`}>{formatPrice(unit.price, unitCurrency(unit, currency))}</p>
                <div className="flex items-center justify-end gap-4">
                  <span
                    className="text-[11px] uppercase tracking-[0.14em]"
                    style={{ color: st.actionable ? 'var(--brand)' : undefined }}
                  >
                    <span className={st.actionable ? '' : t.faint}>{st.label}</span>
                  </span>
                  <Link
                    href={`/${propertySlug}/units/${unit.id}`}
                    aria-label={`View ${unit.name}`}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center border ${t.borderStrong} ${style.radius} ${t.muted} transition-colors hover:${t.text}`}
                  >
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((unit, i) => {
            const st = unitStatus(unit);
            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.07, ease: EASE }}
                className={`${style.radius} ${t.panel} border ${t.border} p-6`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-[19px] font-semibold ${t.heading}`}>{unit.name}</p>
                    <p className={`mt-1 text-[13px] ${t.faint}`}>Floor {unit.floor}</p>
                  </div>
                  <span
                    className={`shrink-0 ${style.radius} px-2.5 py-1 text-[11px] font-medium`}
                    style={
                      st.actionable
                        ? { background: 'var(--brand-subtle)', color: 'var(--brand)' }
                        : undefined
                    }
                  >
                    <span className={st.actionable ? '' : t.faint}>{st.label}</span>
                  </span>
                </div>

                <div className={`mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[14px] ${t.body}`}>
                  <span>{unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}</span>
                  <span>{unit.bathrooms} bath</span>
                  <span>{unit.sqm} m²</span>
                </div>

                <div className={`mt-6 flex items-end justify-between border-t ${t.border} pt-5`}>
                  <p className={`text-[20px] font-semibold ${t.heading}`}>
                    {formatPrice(unit.price, unitCurrency(unit, currency))}
                  </p>
                  <Link
                    href={`/${propertySlug}/units/${unit.id}`}
                    className="text-[13px] font-medium"
                    style={{ color: 'var(--brand)' }}
                  >
                    View →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Floor plans ────────────────────────────────────────────────────────────

export function KitFloorPlans({ floorPlans, style, copy }: { floorPlans: FloorPlan[]; style: KitStyle; copy?: SectionCopy }) {
  const t = tone(style);
  if (!floorPlans?.length) return null;

  return (
    <div>
      <KitHeading style={style} index="04" eyebrow="Layouts" title="Floor plans."
        copy={copy} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {floorPlans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: EASE }}
            className={`${style.radius} border ${t.border} ${t.panel} p-5`}
          >
            <div className={`relative aspect-[4/3] ${style.onDark ? 'bg-white/[0.03]' : 'bg-white'} ${style.radius}`}>
              {plan.imageUrl && (
                <Image src={plan.imageUrl} alt={plan.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain p-3" />
              )}
            </div>
            <p className={`mt-5 text-[18px] ${t.heading}`}>{plan.name}</p>
            <p className={`mt-1.5 text-[13px] ${t.muted}`}>
              {plan.bedrooms === 0 ? 'Studio' : `${plan.bedrooms} bed`} · {plan.bathrooms} bath · {plan.sqm} m²
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Location ───────────────────────────────────────────────────────────────

export function KitLocation({
  address,
  amenities,
  style,
  copy,
}: {
  address: Property['address'];
  amenities: Amenity[];
  style: KitStyle;
  copy?: SectionCopy;
}) {
  const t = tone(style);
  return (
    <div>
      <KitHeading style={style} index="05" eyebrow="Location" title="Where it stands."
        copy={copy} />
      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal>
          <p className={`flex items-start gap-3 text-[17px] leading-relaxed ${t.body}`}>
            <MapPin size={18} className="mt-1 shrink-0" style={{ color: 'var(--brand)' }} />
            <span>{[address?.street, address?.neighborhood, address?.city, address?.county].filter(Boolean).join(', ')}</span>
          </p>

          {/* An address without a map is a fact a buyer cannot act on. Only
              rendered when the development actually has coordinates. */}
          {!!address?.coordinates?.lat && !!address?.coordinates?.lng && (
            <div className={`mt-6 overflow-hidden ${style.radius} border ${t.border}`}>
              <iframe
                title="Location map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[280px] w-full"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  address.coordinates.lng - 0.012
                }%2C${address.coordinates.lat - 0.008}%2C${
                  address.coordinates.lng + 0.012
                }%2C${address.coordinates.lat + 0.008}&layer=mapnik&marker=${
                  address.coordinates.lat
                }%2C${address.coordinates.lng}`}
              />
            </div>
          )}
        </Reveal>
        {amenities?.length > 0 && (
          <Reveal delay={0.08}>
            <p className={`mb-5 text-[11px] uppercase tracking-[0.18em] ${t.faint}`}>Nearby</p>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {amenities.slice(0, 10).map((a) => (
                <p key={a.id ?? a.name} className={`text-[15px] ${t.body}`}>
                  {a.name}
                  {a.distance ? <span className={t.faint}> · {a.distance}</span> : null}
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

export function KitConstruction({ updates, style, copy }: { updates: ConstructionUpdate[]; style: KitStyle; copy?: SectionCopy }) {
  const t = tone(style);
  if (!updates?.length) return null;

  return (
    <div>
      <KitHeading style={style} index="06" eyebrow="Progress" title="Construction updates."
        copy={copy} />
      <div className={`border-t ${t.border}`}>
        {updates.map((u, i) => (
          <motion.div
            key={u.id ?? i}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.03, ease: EASE }}
            className={`grid gap-6 border-b ${t.border} py-7 sm:grid-cols-[160px_1fr_auto]`}
          >
            <p className={`text-[13px] uppercase tracking-[0.12em] ${t.faint}`}>
              {u.date ? new Date(u.date).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) : ''}
            </p>
            <div>
              <p className={`text-[17px] ${t.heading}`}>{u.title}</p>
              {u.description && <p className={`mt-2 max-w-xl text-[15px] leading-relaxed ${t.body}`}>{u.description}</p>}
            </div>
            {typeof u.percentComplete === 'number' && (
              <p className={`text-[26px] ${t.heading}`}>{u.percentComplete}%</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Booking ────────────────────────────────────────────────────────────────

export function KitBooking({ property, style, copy }: { property: Property; style: KitStyle; copy?: SectionCopy }) {
  const t = tone(style);
  const b = useBooking(property);

  const boxed = style.unitsAs === 'cards';
  const fieldCls = boxed
    ? `w-full ${style.radius} border ${t.field} bg-transparent px-4 py-3 text-[15px] outline-none transition-colors`
    : `w-full border-b ${t.field} bg-transparent py-3.5 text-[16px] outline-none transition-colors`;

  if (b.submitted) {
    return (
      <div className={`${style.radius} border ${t.border} ${t.panel} px-8 py-20 text-center`}>
        <p className={`text-[24px] ${t.heading}`}>Request received.</p>
        <p className={`mx-auto mt-4 max-w-md text-[15px] leading-relaxed ${t.body}`}>
          The team at {property.developer?.name || 'this development'} will confirm your viewing shortly.
        </p>
      </div>
    );
  }

  return (
    <div>
      <KitHeading style={style} index="07" eyebrow="Enquire" title="Arrange a viewing."
        copy={copy} />

      <form onSubmit={b.onSubmit} className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className={`max-w-sm text-[16px] leading-relaxed ${t.body}`}>
            Tell us when suits you. A member of the team will confirm and, if you prefer, walk you
            through the property remotely.
          </p>
          <div className="mt-8 flex gap-2">
            {(['virtual', 'physical'] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => b.setViewType(tp)}
                className={`cursor-pointer border ${style.radius} px-5 py-2.5 text-[12px] uppercase tracking-[0.12em] transition-colors`}
                style={
                  b.viewType === tp
                    ? { borderColor: 'var(--brand)', color: 'var(--brand)' }
                    : undefined
                }
              >
                <span className={b.viewType === tp ? '' : t.muted}>
                  {tp === 'virtual' ? 'Virtual' : 'In person'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <input {...b.register('name')} placeholder="Full name" className={fieldCls} />
            {b.errors.name && <p className="mt-2 text-[12px] text-red-500">{b.errors.name.message}</p>}
          </div>
          <div>
            <input {...b.register('email')} placeholder="Email" className={fieldCls} />
            {b.errors.email && <p className="mt-2 text-[12px] text-red-500">{b.errors.email.message}</p>}
          </div>
          <div>
            <input {...b.register('phone')} placeholder="Phone" className={fieldCls} />
            {b.errors.phone && <p className="mt-2 text-[12px] text-red-500">{b.errors.phone.message}</p>}
          </div>
          <div>
            <input type="date" {...b.register('preferredDate')} className={fieldCls} />
            {b.errors.preferredDate && <p className="mt-2 text-[12px] text-red-500">{b.errors.preferredDate.message}</p>}
          </div>
          <div>
            <input type="time" {...b.register('preferredTime')} className={fieldCls} />
          </div>
          <div className="sm:col-span-2">
            <textarea {...b.register('message')} rows={2} placeholder="Anything we should know? (optional)" className={`${fieldCls} resize-none`} />
          </div>
          {b.serverError && <p className="text-[13px] text-red-500 sm:col-span-2">{b.serverError}</p>}
          <button
            type="submit"
            disabled={b.isSubmitting}
            className={`mt-1 cursor-pointer justify-self-start ${style.radius} px-9 py-4 text-[13px] uppercase tracking-[0.14em] transition-opacity hover:opacity-90 disabled:opacity-50 sm:col-span-2`}
            style={{ background: 'var(--brand)', color: 'var(--brand-on)' }}
          >
            {b.isSubmitting ? 'Sending…' : 'Request viewing'}
          </button>
        </div>
      </form>
    </div>
  );
}
