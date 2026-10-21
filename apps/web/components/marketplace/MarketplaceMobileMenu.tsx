'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Building2, ChevronRight, HardHat, Home, KeyRound, LayoutGrid, LogOut,
  Map, Menu, Store, Users, X, type LucideIcon,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
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
const SECTIONS: { heading: string; links: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    heading: 'Buy',
    links: [
      { href: '/properties', label: 'All properties', icon: LayoutGrid },
      { href: '/apartments', label: 'Apartments', icon: Building2 },
      { href: '/villas', label: 'Villas', icon: Home },
      { href: '/commercial', label: 'Commercial', icon: Store },
    ],
  },
  {
    heading: 'Rent',
    links: [
      { href: '/rent', label: 'All rentals', icon: KeyRound },
      { href: '/rent/apartments', label: 'Apartments', icon: Building2 },
      { href: '/rent/villas', label: 'Villas', icon: Home },
      { href: '/rent/commercial', label: 'Commercial', icon: Store },
    ],
  },
  {
    heading: 'Discover',
    links: [
      { href: '/developers', label: 'Developers', icon: HardHat },
      { href: '/agents', label: 'Agents', icon: Users },
      { href: '/map/locations', label: 'Map', icon: Map },
    ],
  },
];

export function MarketplaceMobileMenu() {
  const [open, setOpen] = useState(false);
  // The navbar is its own stacking context (fixed, z-50), so a panel rendered
  // inside it sits under page-level overlays like the floating map button.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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

      {mounted && createPortal(
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <motion.div
              className="absolute inset-0 bg-gray-950/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
                <Link href="/" aria-label="e-resi home" onClick={() => setOpen(false)}>
                  <Logo markSize={26} textClassName="text-gray-900 text-[1.2rem]" />
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                {/* Account card */}
                {isAuthenticated && user && (
                  <Link
                    href={homePathFor(user.role)}
                    className="mb-5 flex items-center gap-3 rounded-2xl border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[14px] font-semibold text-white">
                      {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="block truncate text-[13px] text-gray-500">{homeLabelFor(user.role)}</span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-gray-400" />
                  </Link>
                )}

                <nav className="space-y-5">
                  {SECTIONS.map((section, si) => (
                    <motion.div
                      key={section.heading}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + si * 0.05, duration: 0.25 }}
                    >
                      <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        {section.heading}
                      </p>
                      <ul>
                        {section.links.map(({ href, label, icon: Icon }) => {
                          const active = pathname === href;
                          return (
                            <li key={href}>
                              <Link
                                href={href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                  'group flex items-center gap-3 rounded-xl px-2 py-2 text-[15px] transition-colors',
                                  active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-gray-800 hover:bg-gray-50',
                                )}
                              >
                                <span
                                  className={cn(
                                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                                    active
                                      ? 'border-brand-200 bg-white text-brand-600'
                                      : 'border-gray-200 text-gray-500 group-hover:text-gray-800',
                                  )}
                                >
                                  <Icon size={17} strokeWidth={1.75} />
                                </span>
                                <span className="flex-1">{label}</span>
                                <ChevronRight
                                  size={16}
                                  className={cn('shrink-0', active ? 'text-brand-400' : 'text-gray-300')}
                                />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  ))}
                </nav>

                {/* Developer prompt — the platform's other audience */}
                {!(isAuthenticated && user) && (
                  <Link
                    href="/for-developers"
                    className="mt-6 flex items-center gap-3 rounded-2xl bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm">
                      <HardHat size={18} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold text-gray-900">List your development</span>
                      <span className="block text-[13px] text-gray-500">Reach buyers with 3D and VR tours</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-gray-400" />
                  </Link>
                )}
              </div>

              {/* Footer actions */}
              <div className="border-t border-gray-100 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {isAuthenticated && user ? (
                  <button
                    onClick={async () => { await logout(); setOpen(false); router.push('/'); }}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-center text-[15px] font-medium text-gray-800 transition-colors hover:bg-gray-50"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-xl bg-gray-900 px-4 py-3 text-center text-[15px] font-semibold text-white transition-colors hover:bg-gray-700"
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </>
  );
}
