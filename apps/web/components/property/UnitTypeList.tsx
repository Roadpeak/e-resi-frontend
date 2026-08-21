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
  priceDisplay,
  onDark = false,
  radius = 'rounded-2xl',
  className,
}: UnitTypeListProps) {
  const types = groupUnitsByType(units);
  // Nothing to group means nothing to show — the caller renders its own empty
  // state, which it words to match its own template.
  if (types.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {types.map((type, i) => (
        <TypeRow
          key={type.key}
          type={type}
          index={i}
          propertySlug={propertySlug}
          display={priceDisplayFor(type.key, priceDisplay)}
          onDark={onDark}
          radius={radius}
        />
      ))}
    </div>
  );
}

function TypeRow({
  type,
  index,
  propertySlug,
  display,
  onDark,
  radius,
}: {
  type: ReturnType<typeof groupUnitsByType>[number];
  index: number;
  propertySlug: string;
  display: PriceDisplay;
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
      initial={{ opacity: 0, y: 12 }}
      // Animated on mount rather than on scroll. whileInView never fires for a
      // row that is already past the viewport when the page jumps to an anchor
      // — which is exactly how a buyer arrives here, via the "Units" nav link —
      // leaving the whole typology stranded at opacity 0.
      animate={{ opacity: type.soldOut ? 0.65 : 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
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
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className={cn('text-[17px] font-semibold', heading)}>{type.label}</span>
            {type.soldOut ? (
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                  onDark ? 'border-white/20 text-white/60' : 'border-neutral-300 text-neutral-500',
                )}
              >
                Sold out
              </span>
            ) : (
              <span className={cn('text-[13px]', muted)}>
                {type.availableCount} of {type.units.length} available
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
        </div>

        <div className="shrink-0 text-right">
          {price ? (
            <span className={cn('block text-[17px] font-semibold', heading)}>{price}</span>
          ) : (
            <span className={cn('block text-[13px]', muted)}>Price on request</span>
          )}
          <span className={cn('mt-0.5 inline-flex items-center gap-1 text-[12px]', muted)}>
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
                      {formatPrice(unit.price, unit.currency ?? type.currency)}
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
