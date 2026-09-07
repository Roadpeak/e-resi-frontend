'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * The marketplace section links, shared by the buy and rent navbars so the
 * two bars can never drift apart.
 *
 * Grouped Dribbble-style: two bold dropdowns (Buy, Rent) and two plain links
 * — four top-level items instead of seven, so the row reads as a menu rather
 * than a list of everything we sell.
 */

const GROUPS = [
  {
    label: 'Buy',
    links: [
      { href: '/apartments', label: 'Apartments' },
      { href: '/villas', label: 'Villas' },
      { href: '/commercial', label: 'Commercial' },
    ],
  },
  {
    label: 'Rent',
    links: [
      { href: '/rent/apartments', label: 'Apartments' },
      { href: '/rent/villas', label: 'Villas' },
      { href: '/rent/commercial', label: 'Commercial' },
    ],
  },
];

const TRAILING_LINKS = [
  { href: '/developers', label: 'Developers' },
  { href: '/agents', label: 'Agents' },
];

const itemClass = (active: boolean) =>
  cn(
    'flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-[15px] font-semibold transition-colors',
    active ? 'text-brand-600' : 'text-gray-900 hover:text-gray-600',
  );

function NavDropdown({ label, links }: { label: string; links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close after navigating, or the menu stays open over the new page.
  useEffect(() => setOpen(false), [pathname]);

  const active = links.some((l) => pathname === l.href);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(itemClass(active), 'cursor-pointer')}
      >
        {label}
        <ChevronDown size={15} className={cn('text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-11 z-50 w-44 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              className={cn(
                'block rounded-lg px-3 py-2 text-[14px] font-medium transition-colors',
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
  );
}

export function MarketplaceNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden shrink-0 items-center gap-1 xl:flex">
      {GROUPS.map((g) => (
        <NavDropdown key={g.label} label={g.label} links={g.links} />
      ))}
      {TRAILING_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={itemClass(pathname === l.href || pathname.startsWith(`${l.href}/`))}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
