'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck, BarChart3, Building2, CalendarDays, DoorOpen, FileText,
  Home, LayoutDashboard, MessageSquare, Plus, Receipt, Search, Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMyProperties } from '../../lib/api/queries';

const PAGES = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Properties', href: '/dashboard/properties', icon: Building2 },
  { label: 'Units', href: '/dashboard/units', icon: DoorOpen },
  { label: 'Rentals', href: '/dashboard/rentals', icon: Home },
  { label: 'Inquiries', href: '/dashboard/inquiries', icon: MessageSquare },
  { label: 'Bookings', href: '/dashboard/bookings', icon: CalendarDays },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText },
  { label: 'Billing', href: '/dashboard/billing', icon: Receipt },
  { label: 'Company Profile', href: '/dashboard/profile', icon: BadgeCheck },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Add Development', href: '/dashboard/developments/new', icon: Plus },
];

/** ⌘K palette — jump to pages or your own properties. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: propertiesData } = useMyProperties({ limit: 50 });

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = PAGES
      .filter((p) => !q || p.label.toLowerCase().includes(q))
      .map((p) => ({ kind: 'page' as const, label: p.label, sub: 'Page', href: p.href, icon: p.icon }));
    const props = (propertiesData?.items ?? [])
      .filter((p) => q && p.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p) => ({
        kind: 'property' as const,
        label: p.name,
        sub: `Your property · ${p.status?.replace('_', ' ') ?? ''}`,
        href: `/dashboard/properties/${p.slug}`,
        icon: Building2,
      }));
    return [...props, ...pages].slice(0, 9);
  }, [query, propertiesData]);

  useEffect(() => setActive(0), [results.length]);

  if (!open) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-gray-900/30 px-4 pt-[15vh] backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4">
          <Search size={16} className="shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === 'Enter' && results[active]) go(results[active].href);
            }}
            placeholder="Search pages and properties…"
            className="h-12 w-full bg-transparent text-[15px] text-[#202124] placeholder-[#80868b] outline-none focus:outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
          />
          <kbd className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-gray-400">No matches</li>
          )}
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.href}`}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.href)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer',
                  i === active ? 'bg-gray-100' : '',
                )}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <r.icon size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900">{r.label}</span>
                  <span className="block text-xs text-gray-400">{r.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
