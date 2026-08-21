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
  { href: '/agents', label: 'Agents' },
];

/**
 * The current section is marked with a rule beneath it rather than a filled
 * pill. A black pill is the heaviest element in a light navbar, so the item a
 * visitor has already chosen drew more attention than the ones they might go
 * to next.
 *
 * The rule is a pseudo-element on a relative box, so it sits at a fixed
 * distance below the text and does not change the item's height — an inline
 * border would shift every other link by a pixel as the active one moves.
 */
const linkClass = (active: boolean) =>
  cn(
    'relative rounded-lg px-3.5 py-2 text-[15px] font-medium transition-colors whitespace-nowrap',
    'after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-[2.5px] after:rounded-full',
    'after:transition-all after:duration-300 after:content-[""]',
    active
      ? 'text-brand-600 after:bg-brand-600'
      : 'text-gray-700 hover:text-gray-900 after:bg-transparent hover:after:bg-gray-200',
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
                  // A filled row still suits a dropdown, where each item spans
                  // the full width — an underline would float unattached. Only
                  // the colour changes, from black to the brand accent.
                  pathname === l.href
                    ? 'bg-brand-50 text-brand-700'
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
