'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * The navbar's search, styled as one large rounded pill: query on the left,
 * a scope switch (for sale / for rent) and a filled circular search button
 * living inside the pill's right end. The pill is the bar's dominant element
 * by design — search is the main thing a visitor does here.
 */

const SCOPES = [
  { key: 'buy', label: 'For sale', href: '/properties' },
  { key: 'rent', label: 'For rent', href: '/rent' },
] as const;

export function MarketplaceSearchPill({
  value,
  onChange,
  onSubmit,
  scope,
  placeholder = 'What are you looking for?',
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  /** Which marketplace this bar belongs to — the other one is a click away. */
  scope: 'buy' | 'rent';
  placeholder?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // On phones the pill is squeezed between the logo, menu and account buttons,
  // so while the input has focus it takes over the whole top bar instead.
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Keeps the input focused (and the bar expanded) when a button inside it is tapped.
  const keepFocus = (e: React.PointerEvent) => e.preventDefault();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = SCOPES.find((s) => s.key === scope) ?? SCOPES[0];

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2',
        focused && 'fixed inset-x-0 top-0 z-[60] h-16 bg-white px-3 sm:static sm:h-auto sm:bg-transparent sm:px-0',
      )}
    >
      {focused && (
        <button
          type="button"
          onPointerDown={keepFocus}
          onClick={() => inputRef.current?.blur()}
          aria-label="Close search"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 sm:hidden"
        >
          <ArrowLeft size={20} />
        </button>
      )}
    <form
      onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur();
        onSubmit?.();
      }}
      className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-gray-100 pl-4 pr-1 sm:h-12 sm:pl-5 sm:pr-1.5 transition-colors focus-within:bg-gray-50 focus-within:ring-1 focus-within:ring-gray-300"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label="Search properties"
        className="h-full min-w-0 flex-1 truncate bg-transparent text-[16px] text-gray-900 placeholder:text-ellipsis sm:text-[15px] placeholder:text-gray-500 outline-none focus:outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
      />

      {value && (
        <button
          type="button"
          onPointerDown={keepFocus}
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}

      {/* Scope switch, living inside the pill like Dribbble's category menu */}
      <div className="relative hidden shrink-0 sm:block" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex cursor-pointer items-center gap-1 border-l border-gray-300 py-1 pl-4 pr-3 text-[15px] font-semibold text-gray-900"
        >
          {current.label}
          <ChevronDown size={15} className={cn('text-gray-500 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div role="menu" className="absolute right-0 top-11 z-50 w-40 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  if (s.key !== scope) router.push(s.href);
                }}
                className={cn(
                  'block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-[14px] font-medium transition-colors',
                  s.key === scope ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        onPointerDown={keepFocus}
        aria-label="Search"
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
      >
        <Search size={16} />
      </button>
    </form>
    </div>
  );
}
