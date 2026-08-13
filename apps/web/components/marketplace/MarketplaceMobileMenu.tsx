'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/stores/auth.store';
import { homePathFor, homeLabelFor } from '../../lib/auth/role-home';

/**
 * Navigation for phones and tablets.
 *
 * MarketplaceNavLinks is `hidden xl:flex`, so below 1280px every section link
 * disappeared and nothing replaced it — a visitor on a phone saw only "Get
 * started" and had no way to reach Rent, Villas, Developers or Agents. This
 * is that missing menu, shared by the buy and rent navbars so the two can
 * never drift apart.
 */
const SECTIONS = [
  {
    heading: 'Buy',
    links: [
      { href: '/properties', label: 'All properties' },
      { href: '/apartments', label: 'Apartments' },
      { href: '/villas', label: 'Villas' },
      { href: '/commercial', label: 'Commercial' },
    ],
  },
  {
    heading: 'Rent',
    links: [
      { href: '/rent', label: 'All rentals' },
      { href: '/rent/apartments', label: 'Apartments' },
      { href: '/rent/villas', label: 'Villas' },
      { href: '/rent/commercial', label: 'Commercial' },
    ],
  },
  {
    heading: 'Discover',
    links: [
      { href: '/developers', label: 'Developers' },
      { href: '/agents', label: 'Agents' },
      { href: '/map/locations', label: 'Map' },
    ],
  },
];

export function MarketplaceMobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  // Close on navigation — without this the panel stays open over the new page.
  useEffect(() => { setOpen(false); }, [pathname]);

  // A fixed, full-height panel over a scrolling body leaves the page moving
  // behind it, which reads as broken on iOS.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer xl:hidden"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] xl:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <span className="text-[15px] font-semibold text-gray-900">Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-5 py-4">
              {SECTIONS.map((section) => (
                <div key={section.heading} className="mb-6">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    {section.heading}
                  </p>
                  <ul className="space-y-0.5">
                    {section.links.map((l) => {
                      const active = pathname === l.href;
                      return (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            className={cn(
                              'block rounded-xl px-3 py-2.5 text-[15px] transition-colors',
                              active
                                ? 'bg-gray-900 font-medium text-white'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                            )}
                          >
                            {l.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="border-t border-gray-100 px-5 py-4">
              {isAuthenticated && user ? (
                <>
                  <p className="truncate text-[14px] font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="mb-3 truncate text-[12px] text-gray-500">{user.email}</p>
                  <Link
                    href={homePathFor(user.role)}
                    className="block rounded-xl bg-gray-900 px-4 py-2.5 text-center text-[15px] font-medium text-white"
                  >
                    {homeLabelFor(user.role)}
                  </Link>
                  <button
                    onClick={async () => { await logout(); setOpen(false); router.push('/'); }}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[15px] font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/register"
                    className="block rounded-xl bg-gray-900 px-4 py-2.5 text-center text-[15px] font-semibold text-white"
                  >
                    Get started
                  </Link>
                  <Link
                    href="/login"
                    className="block rounded-xl border border-gray-200 px-4 py-2.5 text-center text-[15px] font-medium text-gray-700"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/for-developers"
                    className="block px-4 py-2 text-center text-[14px] font-medium text-[#1a73e8]"
                  >
                    List your development
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
