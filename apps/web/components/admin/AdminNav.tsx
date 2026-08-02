'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '../brand/Logo';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useUnreadNotificationCount } from '../../lib/api/queries';

/**
 * Sections of the admin console. Later phases fill these in; anything not yet
 * built is marked `soon` so the nav shows the full shape without dead links.
 */
const SECTIONS: { label: string; href: string; icon: string; soon?: boolean }[] = [
  { label: 'Overview', href: '/admin', icon: 'space_dashboard' },
  { label: 'Users', href: '/admin/users', icon: 'group' },
  { label: 'Developers', href: '/admin/developers', icon: 'apartment' },
  { label: 'Properties', href: '/admin/properties', icon: 'domain' },
  { label: 'Operations', href: '/admin/rentals', icon: 'key' },
  { label: 'Production', href: '/admin/production', icon: 'movie' },
  { label: 'Pricing', href: '/admin/pricing', icon: 'sell' },
  { label: 'Billing', href: '/admin/billing', icon: 'payments' },
  { label: 'Invoices', href: '/admin/billing/invoices', icon: 'receipt_long' },
  { label: 'Listing fees', href: '/admin/billing/listing-fees', icon: 'payments' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'monitoring' },
  { label: 'Audit log', href: '/admin/audit', icon: 'history' },
  { label: 'Notifications', href: '/admin/notifications', icon: 'notifications' },
  { label: 'System', href: '/admin/system', icon: 'settings' },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: unread } = useUnreadNotificationCount();
  const unreadCount = unread?.count ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '';

  return (
    <header className="sticky top-0 z-50 border-b border-[#3c4043] bg-[#202124]">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="flex shrink-0 items-center gap-2" aria-label="e-resi admin">
          <Logo markSize={26} textClassName="text-white text-[1.2rem]" />
        </Link>

        {/* Deliberately loud: this console is never the developer dashboard. */}
        <span className="rounded-full bg-[#d93025] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          Admin
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/admin/notifications"
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#e8eaed] transition-colors hover:bg-[#3c4043]"
          >
            <MaterialIcon name="notifications" size={20} fill={unreadCount > 0} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f28b82] px-1 text-[10px] font-semibold text-[#202124]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard"
            className="hidden rounded-full border border-[#5f6368] px-4 py-1.5 text-[13px] font-medium text-[#e8eaed] transition-colors hover:bg-[#3c4043] sm:inline-flex"
          >
            Developer view
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8ab4f8] text-[13px] font-medium text-[#202124] transition-transform hover:scale-105 cursor-pointer"
            >
              {initials}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-[#3c4043] bg-[#292a2d] py-2 shadow-xl">
                <div className="border-b border-[#3c4043] px-4 pb-3 pt-1">
                  <p className="truncate text-[14px] font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-[13px] text-[#9aa0a6]">{user?.email}</p>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    router.push('/');
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-[14px] text-[#f28b82] transition-colors hover:bg-[#3c4043] cursor-pointer"
                >
                  <MaterialIcon name="logout" size={18} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section tabs on their own row so the last one never clips */}
      <nav className="border-t border-[#3c4043]">
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s) => {
            // Prefix matching alone would light up a parent alongside its own
            // sub-page (/admin/billing and /admin/billing/listing-fees), so a
            // parent only counts as active when no deeper entry matches.
            const active = s.href === '/admin'
              ? pathname === s.href
              : pathname.startsWith(s.href)
                && !SECTIONS.some((o) => o.href !== s.href
                  && o.href.startsWith(`${s.href}/`)
                  && pathname.startsWith(o.href));
            return (
              <Link
                key={s.href}
                href={s.href}
                className={cn(
                  'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-[#8ab4f8] text-[#202124]'
                    : 'text-[#9aa0a6] hover:bg-[#3c4043] hover:text-white',
                )}
              >
                <MaterialIcon name={s.icon} size={17} fill={active} />
                {s.label}
                {s.soon && (
                  <span className="rounded-full bg-[#3c4043] px-1.5 py-0.5 text-[10px] text-[#9aa0a6]">
                    soon
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
