'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BedDouble, Bath, Maximize2, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import type { Unit } from '../../lib/types';
import { formatPrice, cn } from '../../lib/utils';
import { UnitTypeList } from './UnitTypeList';
import { SectionHeading } from './SectionHeading';

interface Props {
  units: Unit[];
  currency: string;
  propertySlug: string;
  /** Per-unit-type price presentation chosen by the developer. */
  priceDisplay?: Record<string, string> | null;
}

/**
 * Unit status, in the platform's own palette.
 *
 * Was emerald / amber / red — a traffic light on a page that already carries
 * the developer's brand colour, so a single card could show four unrelated
 * hues. Availability is the development's own accent, and the closed states
 * step down to neutral rather than shouting in a colour that means "error".
 */
const statusConfig = {
  available: {
    label: 'Available',
    icon: CheckCircle2,
    color: 'text-brand-700',
    bg: 'bg-brand-500/10 border-brand-500/20',
  },
  reserved: {
    label: 'Reserved',
    icon: Clock,
    color: 'text-gray-600',
    bg: 'bg-gray-400/10 border-gray-400/25',
  },
  sold: {
    label: 'Sold',
    icon: XCircle,
    color: 'text-gray-500',
    bg: 'bg-gray-400/10 border-gray-400/20',
  },
};

/**
 * Types first, individual units second.
 *
 * A buyer asks what layouts exist and what they cost before they care which
 * apartment is on which floor, so the typology is the default view and the
 * full inventory is one click away for whoever has narrowed down.
 */
type View = 'types' | 'all';

export function PropertyUnits({ units, currency, propertySlug, priceDisplay }: Props) {
  const [view, setView] = useState<View>('types');
  /** Show only what a buyer can still act on. Off by default — hiding stock
      without being asked would misrepresent the development's size. */
  const [availableOnly, setAvailableOnly] = useState(false);

  const statusOf = (u: Unit) => (u.status ?? '').toLowerCase();
  const availableCount = units.filter((u) => statusOf(u) === 'available').length;

  // The figures that orient a buyer before they read a single row: how much of
  // this is still for sale, what it costs to get in, and what layouts exist.
  const availablePrices = units
    .filter((u) => statusOf(u) === 'available')
    .map((u) => u.price)
    .filter((p): p is number => typeof p === 'number' && Number.isFinite(p) && p > 0);
  const beds = units
    .map((u) => u.bedrooms)
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  const bedLabel = beds.length
    ? (() => {
        const lo = Math.min(...beds);
        const hi = Math.max(...beds);
        const one = (n: number) => (n === 0 ? 'Studio' : `${n}`);
        return lo === hi ? one(lo) : `${one(lo)}–${hi}`;
      })()
    : null;

  const filtered = availableOnly
    ? units.filter((u) => statusOf(u) === 'available')
    : units;
  const displayed = filtered;

  const summary = [
    { value: `${availableCount}`, label: availableCount === 1 ? 'Unit available' : 'Units available' },
    ...(availablePrices.length
      ? [{ value: formatPrice(Math.min(...availablePrices), currency), label: 'Starting from' }]
      : []),
    ...(bedLabel ? [{ value: bedLabel, label: 'Bedrooms' }] : []),
  ];

  return (
    <section id="units" className="scroll-mt-24">
      <SectionHeading eyebrow="Availability" title="Units & Pricing" className="mb-7" />

      {/*
        A summary before the list.

        The section used to open straight onto rows, so a buyer had to read and
        total them to answer the two questions they came with — is there
        anything left, and what does it start at. Stating that up front means
        the list becomes something they browse rather than something they have
        to parse.
      */}
      {availableCount > 0 && (
        <div className="mb-6 flex flex-wrap gap-x-12 gap-y-4 rounded-2xl border border-gray-200/80 bg-white px-7 py-6">
          {summary.map((s) => (
            <div key={s.label}>
              <p className="text-[26px] font-medium leading-none tracking-[-0.02em] text-gray-900">
                {s.value}
              </p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-gray-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Controls: how to group, and whether to hide what is gone. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
          {([
            { key: 'types' as View, label: 'By type' },
            { key: 'all' as View, label: `All units (${units.length})` },
          ]).map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium transition-all cursor-pointer',
                view !== v.key && 'text-gray-500 hover:text-gray-900',
              )}
              // The developer's colour, not the platform's indigo.
              style={
                view === v.key
                  ? { backgroundColor: 'var(--brand)', color: 'var(--brand-on)' }
                  : undefined
              }
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Only offered when it would change anything. */}
        {availableCount > 0 && availableCount < units.length && (
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-gray-600">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="h-4 w-4 cursor-pointer"
              style={{ accentColor: 'var(--brand)' }}
            />
            Show available only
          </label>
        )}
      </div>

      {view === 'types' && (
        <UnitTypeList
          units={filtered}
          propertySlug={propertySlug}
          currency={currency}
          priceDisplay={priceDisplay}
        />
      )}

      <div
        className={cn(
          'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
          view !== 'all' && 'hidden',
        )}
      >
        {displayed.map((unit, i) => {
          const statusKey = unit.status?.toLowerCase() as keyof typeof statusConfig;
          const config = statusConfig[statusKey] ?? statusConfig.available;
          const Icon = config.icon;
          const isAvailable = statusKey === 'available';

          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={cn(
                'group relative rounded-2xl border bg-white p-6 flex flex-col gap-4 transition-all',
                isAvailable
                  ? 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                  : 'border-gray-200 opacity-60 hover:opacity-80',
              )}
            >
              {/* whole card opens the unit view */}
              <Link
                href={`/${propertySlug}/units/${unit.id}`}
                aria-label={`View ${unit.name}`}
                className="absolute inset-0 z-0 rounded-2xl"
              />
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{unit.name}</p>
                  <p className="text-sm text-gray-500">Floor {unit.floor}</p>
                </div>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', config.bg, config.color)}>
                  <Icon size={11} />
                  {config.label}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><BedDouble size={13} />{unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} Bed`}</span>
                <span className="flex items-center gap-1"><Bath size={13} />{unit.bathrooms} Bath</span>
                <span className="flex items-center gap-1"><Maximize2 size={13} />{unit.sqm} sqm</span>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5">
                {unit.features.map((f) => (
                  <span key={f} className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{f}</span>
                ))}
              </div>

              {/* Price + CTA */}
              <div className="relative z-10 mt-auto flex items-center justify-between border-t border-gray-200 pt-2 pointer-events-none">
                <div>
                  <p className="text-xs text-gray-400">Price</p>
                  <p className="text-lg font-semibold text-gray-900">{formatPrice(unit.price, currency)}</p>
                </div>
                <Link
                  href={`/${propertySlug}/units/${unit.id}`}
                  className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  View unit <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
