import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an amount in whatever currency it is actually in.
 *
 * Intl throws on an unknown code rather than degrading, so an unrecognised
 * currency falls back to "CODE 1,234" — wrong-looking, but not a crash, and
 * never silently relabelled as a different currency.
 */
export function formatMoney(amount: number, currency = 'KES'): string {
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

export function formatPrice(amount: number, currency = 'KES'): string {
  if (amount >= 1_000_000) {
    return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${currency} ${(amount / 1_000).toFixed(0)}K`;
  }
  return formatMoney(amount, currency);
}

/**
 * A price span, with the currency stated once.
 *
 * "KES 21.0M – KES 23.5M" reads as two separate prices and takes twice the
 * width it needs; the code belongs on the pair, not on each end. A range whose
 * ends are equal is not a range at all, and is returned as a single figure
 * rather than "KES 21.0M – KES 21.0M".
 */
export function formatPriceRange(min: number, max: number, currency = 'KES'): string {
  if (min === max) return formatPrice(min, currency);

  const high = formatPrice(max, currency);
  // Strip the leading code from the upper bound, which formatPrice always
  // prefixes. Falls back to the full string if the prefix is not there —
  // formatMoney's Intl output places the symbol differently.
  const tail = high.startsWith(`${currency} `) ? high.slice(currency.length + 1) : high;

  return `${formatPrice(min, currency)} – ${tail}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    OFF_PLAN: 'Off Plan',
    ACTIVE: 'Ready to Move',
    SOLD_OUT: 'Sold Out',
    DRAFT: 'In Review',
    ARCHIVED: 'Archived',
    // The read path used to lowercase status before it reached here; tolerate
    // both so an older cached payload still renders a label rather than a raw
    // enum value.
    off_plan: 'Off Plan',
    active: 'Ready to Move',
    sold_out: 'Sold Out',
  };
  return map[status] ?? map[String(status).toUpperCase()] ?? status;
}

/**
 * Status chip colours.
 *
 * Kept to blue, amber and neutral. "Ready to Move" was emerald and "Sold Out"
 * red, which put three or four unrelated hues on a single card and read as a
 * traffic light nobody had explained. Availability is not a warning, so the
 * live states share the brand blue and only the closed ones drop to grey.
 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    OFF_PLAN: 'text-amber-700 bg-amber-100',
    ACTIVE: 'text-brand-700 bg-brand-100',
    SOLD_OUT: 'text-slate-600 bg-slate-100',
    DRAFT: 'text-amber-700 bg-amber-100',
    ARCHIVED: 'text-slate-700 bg-slate-100',
    off_plan: 'text-amber-700 bg-amber-100',
    active: 'text-brand-700 bg-brand-100',
    sold_out: 'text-slate-600 bg-slate-100',
  };
  return map[status] ?? map[String(status).toUpperCase()] ?? 'text-slate-700 bg-slate-100';
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function formatCompletionDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-KE', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString));
}
