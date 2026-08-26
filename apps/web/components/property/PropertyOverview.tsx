'use client';

import type { MouseEvent } from 'react';
import { PropertyMonogram } from './PropertyMonogram';
import { motion } from 'framer-motion';
import {
  Building2, CalendarCheck2, BedDouble, Maximize2, CheckCircle2, MapPin,
} from 'lucide-react';
import type { Property, Unit } from '../../lib/types';
import { formatPrice, formatCompletionDate, pluralize } from '../../lib/utils';
import { ChatWithDeveloper } from '../chat/ChatWithDeveloper';

interface Props { property: Property }

// ── Small visual primitives ────────────────────

function ProgressRing({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - Math.min(value, 100) / 100) }}
          // Already on screen at first paint on a tall viewport, so it needs
          // amount: 0 to fire at all — otherwise the ring reads as 0%.
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-baseline justify-center pt-6 text-xl font-bold text-gray-900">
        {value}
        <span className="text-[10px] font-medium text-gray-400">%</span>
      </span>
    </div>
  );
}

function MiniDonut({ pct, color }: { pct: number; color: string }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 22 22" className="h-5 w-5 -rotate-90">
      <circle cx="11" cy="11" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
      <circle
        cx="11"
        cy="11"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Availability donuts, in one hue at four strengths.
 *
 * Was ['#6172f3', '#f59e0b', '#eab308', '#8098fa'] — the platform's indigo,
 * two unrelated yellows and a periwinkle, which put four disagreeing colours
 * in one small card on a page that already carries the developer's own. These
 * are the developer's colour, stepped down: the donuts differ by weight rather
 * than by hue, which is what makes a set of figures read as one control.
 */
const DONUT_COLORS = [
  'var(--brand)',
  'color-mix(in srgb, var(--brand) 72%, white)',
  'color-mix(in srgb, var(--brand) 48%, white)',
  'color-mix(in srgb, var(--brand) 30%, white)',
];

// ── Overview ──────────────────────────────────

export function PropertyOverview({ property }: Props) {
  const units: Unit[] = property.units ?? [];
  const floorPlans = property.floorPlans ?? [];

  /**
   * Bedroom and size ranges — units first, floor plans as fallback.
   *
   * Nulls are dropped rather than passed through: a plan uploaded before its
   * schedule of areas is final has no sqm, and one of those in the list makes
   * Math.min return NaN — which published "NaN–220 m²" on the property page.
   */
  const num = (xs: (number | null | undefined)[]) =>
    xs.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));

  const bedSource = num(units.length ? units.map((u) => u.bedrooms) : floorPlans.map((f) => f.bedrooms));
  const sqmSource = num(units.length ? units.map((u) => u.sqm) : floorPlans.map((f) => f.sqm));
  const bedLabel = bedSource.length
    ? (() => {
        const min = Math.min(...bedSource);
        const max = Math.max(...bedSource);
        const fmt = (n: number) => (n === 0 ? 'Studio' : `${n}`);
        return min === max ? fmt(min) : `${fmt(min)}–${max}`;
      })()
    : null;
  const sqmLabel = sqmSource.length
    ? (() => {
        const min = Math.min(...sqmSource);
        const max = Math.max(...sqmSource);
        return min === max ? `${min}` : `${min}–${max}`;
      })()
    : null;

  // Totals — trust explicit fields, fall back to the units array
  const statusOf = (u: Unit) => (u.status ?? '').toLowerCase();
  const availableFromUnits = units.filter((u) => statusOf(u) === 'available').length;
  const total = property.totalUnits || units.length;
  const available = property.availableUnits ?? availableFromUnits;

  const stats = [
    {
      icon: CalendarCheck2,
      value: property.completionDate ? `${new Date(property.completionDate).getFullYear()}` : 'Ready',
      label: 'Completion',
    },
    { icon: Building2, value: `${total}`, label: 'Total Units' },
    { icon: CheckCircle2, value: `${available}`, label: 'Available' },
    ...(bedLabel ? [{ icon: BedDouble, value: bedLabel, label: 'Bedrooms' }] : []),
    ...(sqmLabel ? [{ icon: Maximize2, value: sqmLabel, label: 'Size (sqm)' }] : []),
  ].slice(0, 5);

  // Construction / sales progress
  const cu = property.constructionUpdates ?? [];
  const latestUpdate = cu[cu.length - 1];
  const soldPct = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
  const progress = latestUpdate?.percentComplete ?? soldPct;

  // Unit status split for the segmented bar
  const counts = units.length
    ? {
        sold: units.filter((u) => statusOf(u) === 'sold').length,
        reserved: units.filter((u) => statusOf(u) === 'reserved').length,
        available: units.filter((u) => statusOf(u) === 'available').length,
      }
    : { sold: Math.max(total - available, 0), reserved: 0, available };
  const segTotal = Math.max(counts.sold + counts.reserved + counts.available, 1);
  // One hue, three weights. A stacked bar does need its segments told apart,
  // but brand / amber / gold put three unrelated colours in a single control —
  // steps of the platform blue separate them just as well and stop the page
  // looking like three designs at once.
  const segments = [
    { key: 'Sold', count: counts.sold, fill: 'color-mix(in srgb, var(--brand) 100%, black 22%)' },
    { key: 'Reserved', count: counts.reserved, fill: 'var(--brand)' },
    { key: 'Available', count: counts.available, fill: 'color-mix(in srgb, var(--brand) 32%, white)' },
  ];

  // Unit availability by bedroom type
  const groupMap = new Map<number, Unit[]>();
  units.forEach((u) => {
    groupMap.set(u.bedrooms, [...(groupMap.get(u.bedrooms) ?? []), u]);
  });
  const groups = [...groupMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bedrooms, list], i) => {
      const availableCount = list.filter((u) => statusOf(u) === 'available').length;
      const prices = list.map((u) => u.price);
      return {
        bedrooms,
        label: bedrooms === 0 ? 'Studio' : `${bedrooms} Bedroom`,
        initial: bedrooms === 0 ? 'St' : `${bedrooms}B`,
        available: availableCount,
        total: list.length,
        minPrice: Math.min(...prices),
        pct: Math.round((availableCount / list.length) * 100),
        color: DONUT_COLORS[i % DONUT_COLORS.length],
      };
    });

  // ✳ what the development itself has. Nearby landmarks are deliberately not
  // mixed in here — they belong to the neighbourhood, not the property, and
  // already have their own "Nearby" panel with distances in PropertyLocation.
  const featureItems = property.features ?? [];

  const fullAddress = [
    property.address.street,
    property.address.neighborhood,
    property.address.city,
    property.address.county,
    property.address.country,
  ]
    .filter(Boolean)
    .join(', ');

  const scrollToBooking = (e: MouseEvent) => {
    e.preventDefault();
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/*
        Stat tiles span the full width, above the split.

        Inside the left column they were squeezed into two-thirds of the page
        while the sticky rail beside them ran on — which is what opened the
        band of dead white this section was known for. Full width they read as
        a summary bar under the hero, and the columns below start level.
      */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 flex flex-wrap overflow-hidden rounded-2xl border border-gray-200 bg-white lg:mb-12"
      >
        {stats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex min-w-[150px] flex-1 items-center gap-3 border-r border-gray-100 px-5 py-4 last:border-r-0"
          >
            {/* No chip behind it. A tinted rounded square around every small
                glyph adds a second shape to read and makes a row of stats look
                like a row of buttons; the icon on its own is quieter and the
                figure beside it is what carries the meaning. */}
            <Icon size={17} strokeWidth={1.6} className="shrink-0 text-gray-900" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-14">
      {/* ── LEFT: the story ── */}
      {/*
        Animated on mount, not on scroll — the same fix UnitTypeList and
        PropertyTours already carry. whileInView leaves an element latched at
        opacity 0 whenever its observer resolves while the block is off screen
        (an anchor jump, a restored scroll position, or simply sitting below a
        tall hero), and `once: true` makes that permanent. The overview is the
        first thing under the fold, so it hit this every load.
      */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="lg:col-span-2"
      >
        {/*
          No name, address, price or CTA here.

          The hero above now carries all four over the photograph. Repeating
          them a few hundred pixels later gave every visitor the same headline
          twice.
        */}

        {/* Tagline + description */}
        <p
          className="mt-9 text-[22px] font-semibold leading-snug tracking-[-0.01em] text-gray-900 sm:text-[26px]"
          style={{ fontFamily: 'var(--brand-font-heading)' }}
        >
          {property.tagline}
        </p>
        <p className="mt-4 max-w-[62ch] text-[16px] leading-[1.75] text-gray-600">
          {property.description}
        </p>

        <p className="mt-6 flex items-start gap-1.5 text-[14px] text-gray-500">
          <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
          <span>{fullAddress}</span>
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="#booking"
            onClick={scrollToBooking}
            className="inline-flex items-center rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            Book a Viewing
          </a>
          <ChatWithDeveloper propertySlug={property.slug} className="inline-flex" />
        </div>

        {/* ✳ features */}
        {featureItems.length > 0 && (
          <div className="mt-10 border-t border-gray-100 pt-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              What this development has
            </p>
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {featureItems.map((feat) => (
                <div key={feat} className="flex items-start gap-2 text-[14px] text-gray-600">
                  <span aria-hidden className="leading-5" style={{ color: 'var(--brand)' }}>✳</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/*
          Who is building it, in the story column rather than the rail.

          It belongs with the narrative — a buyer reads the pitch and then asks
          who is behind it. Keeping it here also stops the sticky rail running
          past the bottom of this column on developments with no feature list,
          which is what left a band of dead white beside the description.
        */}
        {property.developer?.name && (
          <div className="mt-10 flex items-start gap-4 border-t border-gray-100 pt-8">
            <PropertyMonogram
              name={property.developer.name}
              logoUrl={property.developer.logoUrl}
              size={48}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Developer
              </p>
              <p className="mt-1.5 text-[15px] font-semibold text-gray-900">
                {property.developer.name}
              </p>
              {(() => {
                const est = property.developer?.establishedYear;
                const done = property.developer?.completedProjects ?? 0;
                const bits = [
                  est ? `Est. ${est}` : null,
                  done > 0 ? `${pluralize(done, 'project')} completed` : null,
                ].filter(Boolean);
                return bits.length ? (
                  <p className="mt-0.5 text-[13px] text-gray-500">{bits.join(' · ')}</p>
                ) : null;
              })()}
              {property.developer.description && (
                <p className="mt-2.5 max-w-[52ch] text-[14px] leading-relaxed text-gray-600">
                  {property.developer.description}
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── RIGHT rail ── */}
      {/* Mount-animated for the same reason as the column beside it — and
          doubly so here, because a sticky element that never un-hides leaves
          the page looking like it lost a third of its content. */}
      <motion.aside
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-5 self-start lg:sticky lg:top-24"
      >
        {/* Progress card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <ProgressRing value={progress} />
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-gray-900">
                {property.address.neighborhood}, {property.address.city}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {available} of {total} units left
                {property.completionDate && <> · {formatCompletionDate(property.completionDate)}</>}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {latestUpdate ? 'Construction progress' : 'Units sold'}
              </p>
            </div>
          </div>

          {/*
            The ring above reports construction; this bar reports sales. Two
            different measures in one card read as one — a 100% ring over a
            half-filled bar looked like a rendering fault. The label says which
            is which.
          */}
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Unit sales
          </p>
          <div className="mt-2.5 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-gray-100">
            {segments.map(
              (s) =>
                s.count > 0 && (
                  <motion.div
                    key={s.key}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(s.count / segTotal) * 100}%` }}
                    // amount: 0 for the same reason Reveal needs it — this bar
                    // sits high enough to be on screen at first paint, and a
                    // default threshold never fires for an element that was
                    // already visible, leaving it stuck at width 0.
                    viewport={{ once: true, amount: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full"
                    style={{ background: s.fill }}
                  />
                ),
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {segments.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full" style={{ background: s.fill }} />
                {s.key} {s.count}
              </span>
            ))}
          </div>
        </div>

        {/* Unit availability + developer card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <p className="border-b border-gray-100 pb-4 text-sm font-semibold text-gray-900">Unit availability</p>

          {groups.length > 0 ? (
            <div>
              {groups.map((g) => (
                <div
                  key={g.bedrooms}
                  className="flex items-center gap-3 border-b border-gray-100 py-3.5 last:border-b-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: 'color-mix(in srgb, var(--brand) 10%, white)', color: 'var(--brand)' }}>
                    {g.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{g.label}</p>
                    <p className="text-xs text-gray-500">
                      {g.available} of {g.total} available · from {formatPrice(g.minPrice, property.currency)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <MiniDonut pct={g.pct} color={g.color} />
                    <span className="text-sm font-semibold text-gray-900">{g.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-3 text-sm text-gray-500">
              {available} of {total} units currently available.
            </p>
          )}

          {/* The developer now sits in the story column, where a buyer looks
              for it after reading the pitch. */}
        </div>
      </motion.aside>
    </div>
    </div>
  );
}
