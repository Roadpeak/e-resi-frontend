import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'KES'): string {
  if (amount >= 1_000_000) {
    return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${currency} ${(amount / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency === 'KES' ? 'KES' : 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
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
    off_plan: 'text-brand-400 bg-brand-400/10',
    under_construction: 'text-gold-400 bg-gold-400/10',
    ready: 'text-emerald-400 bg-emerald-400/10',
    sold_out: 'text-red-400 bg-red-400/10',
  };
  return map[status] ?? 'text-slate-400 bg-slate-400/10';
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
