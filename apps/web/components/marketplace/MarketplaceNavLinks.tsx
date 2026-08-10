'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * The marketplace section links, shared by the buy and rent navbars so the two
 * bars can never drift apart. Commercial is a dropdown because buying and
 * letting commercial space are separate journeys that don't deserve two more
 * top-level slots.
 */
const LINKS = [
  { href: '/apartments', label: 'Buy Apartments' },
  { href: '/villas', label: 'Buy Villas' },
  { href: '/rent/apartments', label: 'Rent Apartments' },
  { href: '/rent/villas', label: 'Rent Villas' },
];

const COMMERCIAL_LINKS = [
  { href: '/commercial', label: 'Buy Commercial' },
  { href: '/rent/commercial', label: 'Rent Commercial' },
];

const TRAILING_LINKS = [
  { href: '/developers', label: 'Developers' },
  { href: '/map/locations', label: 'Map' },
];

const linkClass = (active: boolean) =>
  cn(
    'rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors whitespace-nowrap',
    active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
  );

export function MarketplaceNavLinks() {
  const pathname = usePathname();
  const [commercialOpen, setCommercialOpen] = useState(false);
  const commercialRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (commercialRef.current && !commercialRef.current.contains(e.target as Node)) {
        setCommercialOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close the dropdown after navigating, or it stays open over the new page.
  useEffect(() => setCommercialOpen(false), [pathname]);

  const commercialActive = COMMERCIAL_LINKS.some((l) => pathname === l.href);

  return (
    <nav className="hidden xl:flex items-center gap-0.5 shrink-0">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={linkClass(pathname === l.href)}>
          {l.label}
        </Link>
      ))}

      <div className="relative" ref={commercialRef}>
        <button
          onClick={() => setCommercialOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={commercialOpen}
          className={cn(linkClass(commercialActive), 'flex cursor-pointer items-center gap-1')}
        >
          Commercial
          <ChevronDown size={14} className={cn('transition-transform', commercialOpen && 'rotate-180')} />
        </button>
        {commercialOpen && (
          <div
            role="menu"
            className="absolute left-0 top-11 z-50 w-52 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg"
          >
            {COMMERCIAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                role="menuitem"
                className={cn(
                  'block rounded-xl px-3 py-2 text-[15px] font-medium transition-colors',
                  pathname === l.href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {TRAILING_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={linkClass(pathname === l.href || pathname.startsWith(`${l.href}/`))}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
