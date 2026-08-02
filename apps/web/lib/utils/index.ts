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

export function formatPriceRange(min: number, max: number, currency = 'KES'): string {
  return `${formatPrice(min, currency)} – ${formatPrice(max, currency)}`;
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
    off_plan: 'Off Plan',
    under_construction: 'Under Construction',
    ready: 'Ready to Move',
    sold_out: 'Sold Out',
  };
  return map[status] ?? status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    off_plan: 'text-brand-700 bg-brand-100',
    under_construction: 'text-gold-700 bg-gold-100',
    ready: 'text-emerald-700 bg-emerald-100',
    sold_out: 'text-red-700 bg-red-100',
  };
  return map[status] ?? 'text-slate-700 bg-slate-100';
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
