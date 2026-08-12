'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Search, User, X } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useRentFiltersStore } from '../../lib/stores/rent-filters.store';
import { MarketplaceNavLinks } from '../marketplace/MarketplaceNavLinks';
import { homePathFor, homeLabelFor } from '../../lib/auth/role-home';

/**
 * Dedicated, fully separated navbar for the rent marketplace — a solid bar
 * with its own borders (not the floating pill nav), including rental search.
 */
export function RentNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { filters, setFilter } = useRentFiltersStore();

  const [query, setQuery] = useState(filters.query ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // On /rent the results filter live; on a listing page there's nothing to
  // filter, so searching navigates back to the browse view instead.
  const isBrowse = pathname === '/rent';

  useEffect(() => {
    if (!isBrowse) return;
    const t = setTimeout(() => setFilter('query', query.trim() || undefined), 300);
    return () => clearTimeout(t);
  }, [query, setFilter, isBrowse]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (isBrowse) return;
    setFilter('query', query.trim() || undefined);
    router.push('/rent');
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : '';

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/[0.08] bg-white">
      <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="shrink-0" aria-label="e-resi home">
          <Logo markSize={28} textClassName="text-gray-900 text-[1.3rem]" />
        </Link>

        <span className="hidden lg:block h-6 w-px shrink-0 bg-gray-200" />

        {/* Section links */}
        <MarketplaceNavLinks />

        {/* Search — the heart of the rent nav */}
        <form onSubmit={submitSearch} className="relative flex min-w-0 flex-1 items-center">
          <Search size={18} className="pointer-events-none absolute left-4 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by area, building or listing…"
            aria-label="Search rentals"
            className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-10 text-[15px] font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-500 outline-none transition-colors focus:border-gray-900 focus:bg-white focus:outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Account */}
        <div className="relative shrink-0" ref={menuRef}>
          {isAuthenticated && user ? (
            <>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Account menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white transition-transform hover:scale-105 cursor-pointer"
              >
                {initials}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                  <div className="border-b border-gray-100 px-3 pb-2 pt-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    href={homePathFor(user.role)}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <User size={15} /> {homeLabelFor(user.role)}
                  </Link>
                  <button
                    onClick={async () => { await logout(); router.push('/'); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-full px-4 py-2 text-[15px] font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex rounded-full bg-gray-900 px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-gray-700 transition-colors"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
