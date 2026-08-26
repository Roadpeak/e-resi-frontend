'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BedDouble, Bath, Maximize2, ChevronDown, ArrowRight } from 'lucide-react';
import type { Unit } from '../../lib/types';
import { formatPrice, cn } from '../../lib/utils';
import {
  groupUnitsByType,
  priceDisplayFor,
  unitCurrency,
  typePriceLabel,
  typeSizeLabel,
  type PriceDisplay,
} from '../../lib/units/unit-types';
import { unitStatus } from './templates/hooks';

/**
 * The development's typology: what layouts it offers and what each costs.
 *
 * A buyer's first question is "what can I get and for how much" — not "tell me
 * about apartment 20B". The units section answered the second question only: a
 * flat grid of every unit, from which the buyer had to reconstruct that this
 * development sells one-beds through penthouses. Seven units is tedious; a
 * 200-unit tower is unusable.
 *
 * Each type expands to the individual units, so the inventory view is still
 * there for the buyer who has narrowed down and wants to compare floors.
 */

export interface UnitTypeListProps {
  units: Unit[];
  propertySlug: string;
  /** The development's currency — the one the developer actually chose. */
  currency?: string | null;
  /** Per-type presentation, keyed by type key. Set by the developer. */
  priceDisplay?: Record<string, string> | null;
  /** Dark grounds need their own text and borders. */
  onDark?: boolean;
  /** Templates carry their own corner radius. */
  radius?: string;
  className?: string;
}

export function UnitTypeList({
  units,
  propertySlug,
  currency,
  priceDisplay,
  onDark = false,
  radius = 'rounded-2xl',
  className,
}: UnitTypeListProps) {
  const types = groupUnitsByType(units, currency);
  // Nothing to group means nothing to show — the caller renders its own empty
  // state, which it words to match its own template.
  if (types.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {types.map((type) => (
        <TypeRow
          key={type.key}
          type={type}
          propertySlug={propertySlug}
          display={priceDisplayFor(type.key, priceDisplay)}
          currency={currency}
          onDark={onDark}
          radius={radius}
        />
      ))}
    </div>
  );
}

function TypeRow({
  type,
  propertySlug,
  display,
  currency,
  onDark,
  radius,
}: {
  type: ReturnType<typeof groupUnitsByType>[number];
  propertySlug: string;
  display: PriceDisplay;
  currency?: string | null;
  onDark: boolean;
  radius: string;
}) {
  // 'exact' promises per-unit figures, so it opens showing them rather than
  // making the buyer hunt for the disclosure.
  const [open, setOpen] = useState(display === 'exact');

  const price = typePriceLabel(type, display);
  const size = typeSizeLabel(type);

  const border = onDark ? 'border-white/12' : 'border-neutral-200';
  const heading = onDark ? 'text-white' : 'text-neutral-900';
  const muted = onDark ? 'text-white/55' : 'text-neutral-500';

  return (
    <motion.div
      // Not animated in or out.
      //
      // This list is the point of the page — it is what a buyer scrolls to and
      // what the "Units" nav link jumps to — so it must be legible the instant
      // it is on screen, under every arrival path. Both animation strategies
      // failed it: whileInView never fired when an anchor jump put the rows
      // past the viewport, and a mount animation stalled part-way whenever the
      // rows mounted lazily mid-scroll, freezing the typology at partial
      // opacity. A price list that sometimes does not appear is worse than one
      // that never fades in, so it simply renders.
      //
      // Sold-out types are still dimmed, as state rather than as animation.
      initial={false}
      animate={{ opacity: type.soldOut ? 0.65 : 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'overflow-hidden border transition-colors',
        radius,
        border,
        onDark ? 'bg-white/[0.03]' : 'bg-white',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-4 p-5 text-left transition-colors sm:gap-5',
          onDark ? 'hover:bg-white/[0.03]' : 'hover:bg-neutral-50',
        )}
      >
        {/* A bedroom-count mark, so the eye can run the list by type without
            reading. Rows of pure text made the most commercially important
            section on the page the flattest thing on it. */}
        <span
          aria-hidden
          className="hidden h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-[15px] font-bold leading-none sm:flex"
          style={
            onDark
              ? { background: 'rgba(255,255,255,0.07)', color: '#fff' }
              : {
                  background: 'color-mix(in srgb, var(--brand) 9%, white)',
                  color: 'var(--brand)',
                }
          }
        >
          {type.bedrooms === 0 ? 'St' : type.bedrooms}
          <span
            className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider opacity-70"
          >
            {type.bedrooms === 0 ? 'udio' : 'bed'}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className={cn('text-[17px] font-semibold', heading)}>{type.label}</span>
            {type.soldOut && (
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                  onDark ? 'border-white/20 text-white/60' : 'border-neutral-300 text-neutral-500',
                )}
              >
                Sold out
              </span>
            )}
          </div>

          <div className={cn('mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]', muted)}>
            {size && (
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 size={13} /> {size}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <BedDouble size={13} />
              {type.bedrooms === 0 ? 'Studio' : `${type.bedrooms} bed`}
            </span>
            {type.bathrooms !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <Bath size={13} /> {type.bathrooms} bath
              </span>
            )}
          </div>

          {/* Scarcity, shown rather than stated. A bar reads at a glance where
              "1 of 2 available" has to be parsed. */}
          {!type.soldOut && (
            <div className="mt-3 flex items-center gap-2.5">
              <span
                aria-hidden
                className={cn(
                  'h-1 w-full max-w-[132px] overflow-hidden rounded-full',
                  onDark ? 'bg-white/12' : 'bg-neutral-200',
                )}
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    background: onDark ? 'rgba(255,255,255,0.75)' : 'var(--brand)',
                    width: `${Math.round((type.availableCount / Math.max(type.units.length, 1)) * 100)}%`,
                  }}
                />
              </span>
              <span className={cn('shrink-0 text-[12px]', muted)}>
                {type.availableCount} of {type.units.length} available
              </span>
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          {price ? (
            <span className={cn('block text-[19px] font-bold tracking-[-0.01em]', heading)}>
              {price}
            </span>
          ) : (
            <span className={cn('block text-[13px]', muted)}>Price on request</span>
          )}
          <span
            className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium"
            style={{ color: onDark ? 'rgba(255,255,255,0.7)' : 'var(--brand)' }}
          >
            {open ? 'Hide' : 'See'} {type.units.length === 1 ? 'unit' : `${type.units.length} units`}
            <ChevronDown
              size={13}
              className={cn('transition-transform duration-300', open && 'rotate-180')}
            />
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className={cn('border-t px-5 py-2', border)}>
              {type.units.map((unit) => {
                const status = unitStatus(unit);
                return (
                  <Link
                    key={unit.id}
                    href={`/${propertySlug}/units/${unit.id}`}
                    className={cn(
                      'group flex items-center gap-4 py-3 transition-opacity',
                      !status.actionable && 'opacity-55',
                    )}
                  >
                    <span className={cn('min-w-0 flex-1 text-[14px] font-medium', heading)}>
                      {unit.name}
                      {unit.floor !== undefined && unit.floor !== null && (
                        <span className={cn('ml-2 text-[12px] font-normal', muted)}>
                          Floor {unit.floor}
                        </span>
                      )}
                    </span>

                    {unit.sqm && (
                      <span className={cn('hidden shrink-0 text-[13px] sm:block', muted)}>
                        {unit.sqm} m²
                      </span>
                    )}

                    <span className={cn('shrink-0 text-[13px]', muted)}>{status.label}</span>

                    <span className={cn('shrink-0 text-[14px] font-semibold', heading)}>
                      {formatPrice(unit.price, unitCurrency(unit, currency) || type.currency)}
                    </span>

                    <ArrowRight
                      size={14}
                      className={cn(
                        'shrink-0 transition-transform group-hover:translate-x-0.5',
                        muted,
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
