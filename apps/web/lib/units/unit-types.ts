import type { Unit } from '../types';
import { formatPrice, formatPriceRange } from '../utils';

/**
 * Unit types: the typology a buyer actually shops for.
 *
 * Buyers do not choose "Unit 20B", they choose "a 3 bedroom" and then pick
 * which one. The page listed raw inventory — seven rows, each a separate card —
 * so a development's actual offer (studios through penthouses, and what each
 * costs) had to be reconstructed by reading every row.
 *
 * Types are derived from the units rather than authored separately. A developer
 * maintains one list, inventory, and the typology follows from it: no second
 * form to fill in, and no way for the advertised types to drift out of step
 * with what is actually for sale.
 *
 * Deliberately pure and framework-free, so server components can group without
 * pulling in a client bundle.
 */

/**
 * The currency a unit's price is actually in.
 *
 * The property's currency wins over the unit's own.
 *
 * That looks backwards until you know how the two are set: a developer chooses
 * the currency once, on the development, and the unit form has never offered
 * the choice at all. Unit.currency was therefore never written and every row
 * carries the schema default of "KES" — so a development priced in USD
 * published its prices as shillings, understating them by around 130×.
 *
 * A unit currency that differs from its property's is only meaningful once a
 * developer can actually set one, so it is honoured when the property has no
 * currency of its own.
 */
export function unitCurrency(
  unit: { currency?: string | null } | null | undefined,
  propertyCurrency?: string | null,
): string {
  return propertyCurrency || unit?.currency || 'KES';
}

/** How a developer wants a type's price presented to buyers. */
export type PriceDisplay =
  /** Every unit's own price, listed individually. Honest when they differ. */
  | 'exact'
  /** "From KES 21.0M" — the entry price, and nothing about the ceiling. */
  | 'from'
  /** "KES 21.0M – 23.5M" — the full spread. */
  | 'range'
  /** No figures. For developments sold on enquiry. */
  | 'hidden';

export const PRICE_DISPLAYS: PriceDisplay[] = ['exact', 'from', 'range', 'hidden'];

export function isPriceDisplay(value: unknown): value is PriceDisplay {
  return typeof value === 'string' && (PRICE_DISPLAYS as string[]).includes(value);
}

/**
 * The default when a developer has expressed no preference.
 *
 * 'from' rather than 'exact': a type whose units differ in price cannot show a
 * single number honestly, and 'from' is the convention buyers already read on
 * every other off-plan listing. A developer who wants precision opts into it.
 */
export const DEFAULT_PRICE_DISPLAY: PriceDisplay = 'from';

export interface UnitType {
  /** Stable across renders and reloads, so it can key display preferences. */
  key: string;
  /** "Studio", "2 Bedroom", "Penthouse". */
  label: string;
  bedrooms: number;
  units: Unit[];
  availableCount: number;
  /** True when nothing in this type can still be bought. */
  soldOut: boolean;
  minPrice: number;
  maxPrice: number;
  /** True when every unit in the type carries the same price. */
  uniformPrice: boolean;
  minSqm?: number;
  maxSqm?: number;
  currency: string;
  /** Bathroom count when the whole type agrees on one, else undefined. */
  bathrooms?: number;
}

/**
 * Named layouts that group on their own, regardless of bedroom count.
 *
 * Bedroom count alone would file a 420m² penthouse with any other five-bed,
 * which misprices the development's flagship and buries the unit its marketing
 * leads on. A maisonette and a flat with the same bed count are likewise not
 * the same product.
 *
 * The vocabulary matches the unit types offered in the media manager, so a
 * development describes its layouts the same way everywhere. Developers
 * already encode these into unit names — the placeholder in the units form is
 * "A-101 · 2 Bed Deluxe" — so the name is a signal we have been given and were
 * throwing away.
 */
const NAMED_LAYOUTS: Array<{ key: string; label: string; test: RegExp }> = [
  { key: 'penthouse', label: 'Penthouse', test: /penthouse/i },
  { key: 'maisonette', label: 'Maisonette', test: /maisonette/i },
  { key: 'duplex', label: 'Duplex', test: /duplex/i },
  { key: 'townhouse', label: 'Townhouse', test: /town\s*house/i },
];

function namedLayout(unit: Unit) {
  const name = unit.name ?? '';
  return NAMED_LAYOUTS.find((l) => l.test.test(name));
}

function labelFor(bedrooms: number): string {
  if (bedrooms <= 0) return 'Studio';
  return `${bedrooms} Bedroom`;
}

/**
 * Group units into the types a buyer browses.
 *
 * Ordered by entry price, so the page reads from most attainable upward — the
 * order a buyer scanning for affordability wants, and the one that puts the
 * flagship last where it lands as a finish rather than a barrier.
 */
export function groupUnitsByType(units: Unit[], propertyCurrency?: string | null): UnitType[] {
  const buckets = new Map<string, { units: Unit[]; label: string }>();

  for (const unit of units) {
    const named = namedLayout(unit);
    // The key must not be the label: the key is persisted against display
    // preferences, so it has to stay stable even if wording changes.
    const key = named ? named.key : `bed-${Math.max(0, unit.bedrooms ?? 0)}`;
    const existing = buckets.get(key);
    if (existing) existing.units.push(unit);
    else buckets.set(key, { units: [unit], label: named?.label ?? labelFor(unit.bedrooms ?? 0) });
  }

  const types: UnitType[] = [];

  for (const [key, bucket] of buckets) {
    const group = bucket.units;
    const prices = group.map((u) => u.price).filter((p) => typeof p === 'number' && p > 0);
    const sizes = group.map((u) => u.sqm).filter((s): s is number => typeof s === 'number' && s > 0);
    const baths = new Set(group.map((u) => u.bathrooms));

    const availableCount = group.filter(
      (u) => String(u.status ?? '').toLowerCase() === 'available',
    ).length;

    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    types.push({
      key,
      label: bucket.label,
      bedrooms: group[0]?.bedrooms ?? 0,
      // Cheapest first within a type, matching the order of the types
      // themselves.
      units: [...group].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)),
      availableCount,
      soldOut: availableCount === 0,
      minPrice,
      maxPrice,
      uniformPrice: minPrice === maxPrice,
      minSqm: sizes.length ? Math.min(...sizes) : undefined,
      maxSqm: sizes.length ? Math.max(...sizes) : undefined,
      currency: unitCurrency(group[0], propertyCurrency),
      bathrooms: baths.size === 1 ? group[0]?.bathrooms : undefined,
    });
  }

  return types.sort((a, b) => {
    // A type with no price at all sorts last rather than to the front, which
    // is where a zero would otherwise put it.
    if (a.minPrice === 0 && b.minPrice !== 0) return 1;
    if (b.minPrice === 0 && a.minPrice !== 0) return -1;
    return a.minPrice - b.minPrice;
  });
}

/**
 * The headline price for a type, in the developer's chosen presentation.
 *
 * Returns null when there is nothing to show, so callers render their enquiry
 * copy rather than a stray currency symbol.
 */
export function typePriceLabel(type: UnitType, display: PriceDisplay): string | null {
  if (display === 'hidden' || type.minPrice <= 0) return null;

  // A single price is a single price whatever the mode asks for: "From X" and
  // "X – X" both read as evasion when there is only one number.
  if (type.uniformPrice) return formatPrice(type.minPrice, type.currency);

  if (display === 'range') return formatPriceRange(type.minPrice, type.maxPrice, type.currency);

  // 'exact' shows per-unit figures in the expanded list; the header still
  // needs a summary, and the entry price is the honest one.
  return `From ${formatPrice(type.minPrice, type.currency)}`;
}

/** "145 – 155 m²", or "55 m²" when the type is one size. */
export function typeSizeLabel(type: UnitType): string | null {
  if (type.minSqm === undefined) return null;
  if (type.maxSqm === undefined || type.minSqm === type.maxSqm) return `${type.minSqm} m²`;
  return `${type.minSqm} – ${type.maxSqm} m²`;
}

/**
 * Resolve a type's display mode from the developer's saved preferences.
 *
 * Preferences are keyed by type key and may be absent, partial, or stale after
 * inventory changes — a development that sells out its penthouses still has a
 * saved preference for them. An unknown key falls back rather than throwing.
 */
export function priceDisplayFor(
  typeKey: string,
  prefs: Record<string, string> | undefined | null,
  fallback: PriceDisplay = DEFAULT_PRICE_DISPLAY,
): PriceDisplay {
  const saved = prefs?.[typeKey];
  return isPriceDisplay(saved) ? saved : fallback;
}
