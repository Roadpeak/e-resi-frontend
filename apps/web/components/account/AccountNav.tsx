'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api/notifications';
import { Logo } from '../brand/Logo';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/stores/auth.store';

const tabs = [
  { label: 'Overview', href: '/account', icon: 'home' },
  { label: 'Saved', href: '/account/saved', icon: 'favorite' },
  { label: 'Viewings', href: '/account/viewings', icon: 'event' },
  { label: 'Messages', href: '/account/messages', icon: 'forum' },
  { label: 'Inquiries', href: '/account/inquiries', icon: 'chat_bubble' },
  { label: 'Reservations', href: '/account/reservations', icon: 'vpn_key' },
  { label: 'My Units', href: '/account/units', icon: 'apartment' },
];

/**
 * Single top navigation for the account area — no sidebar.
 * Brand + section tabs on one row, account menu on the right.
 */
export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: notifMeta } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.list(1),
    refetchInterval: 60_000,
  });
  const unreadCount = notifMeta?.unreadCount ?? 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Navigating away is what closes the mobile menu — each item is a Link,
  // so the pathname changing is the one reliable "done" signal.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '';

  return (
    <header className="sticky top-0 z-50 border-b border-[#dadce0] bg-white/95 backdrop-blur-xl">
      <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-10 2xl:px-16">
        {/* Mobile menu toggle — the tabs row below is desktop-only */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4] md:hidden"
        >
          <MaterialIcon name={mobileOpen ? 'close' : 'menu'} size={22} />
        </button>

        {/* Brand */}
        <Link href="/" className="shrink-0" aria-label="e-resi home">
          <Logo markSize={28} textClassName="text-[#202124] text-[1.3rem]" />
        </Link>

        <span className="hidden lg:block h-6 w-px shrink-0 bg-[#dadce0]" />

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/properties"
            className="hidden rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] sm:inline-flex"
          >
            Browse properties
          </Link>

          {/* Notifications — the badge polls so a purchase update or shared
              document surfaces without the person hunting for it. */}
          <Link
            href="/account/notifications"
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4]"
          >
            <MaterialIcon name="notifications" size={22} fill={pathname.startsWith('/account/notifications')} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d93025] px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Account menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#1a73e8] text-[13px] font-medium text-white transition-transform hover:scale-105 cursor-pointer"
            >
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="36px" />
              ) : (
                initials
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-[#dadce0] bg-white py-2 shadow-lg">
                <div className="border-b border-[#f1f3f4] px-4 pb-3 pt-1">
                  <p className="truncate text-[14px] font-medium text-[#202124]">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-[13px] text-[#5f6368]">{user?.email}</p>
                </div>
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#202124] transition-colors hover:bg-[#f1f3f4]"
                >
                  <MaterialIcon name="account_circle" size={18} /> Your profile
                </Link>
                <button
                  onClick={async () => { await logout(); router.push('/'); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-[14px] text-[#d93025] transition-colors hover:bg-[#fce8e6] cursor-pointer"
                >
                  <MaterialIcon name="logout" size={18} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section tabs — desktop row; the mobile menu below covers small screens */}
      <nav className="hidden border-t border-[#f1f3f4] md:block">
        <div className="flex w-full items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-10 2xl:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => {
            const active = t.href === '/account' ? pathname === t.href : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition-colors',
                  active
                    ? 'bg-[#e8f0fe] text-[#1a73e8]'
                    : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]',
                )}
              >
                <MaterialIcon name={t.icon} size={18} fill={active} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile menu — drops over the page so nothing jumps underneath */}
      {mobileOpen && (
        <nav className="absolute inset-x-0 top-full border-b border-[#dadce0] bg-white shadow-lg md:hidden">
          <div className="space-y-0.5 px-3 py-3">
            {tabs.map((t) => {
              const active = t.href === '/account' ? pathname === t.href : pathname.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors',
                    active
                      ? 'bg-[#e8f0fe] text-[#1a73e8]'
                      : 'text-[#3c4043] hover:bg-[#f1f3f4]',
                  )}
                >
                  <MaterialIcon name={t.icon} size={20} fill={active} />
                  {t.label}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-[#f1f3f4] pt-2">
              <Link
                href="/account/notifications"
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors',
                  pathname.startsWith('/account/notifications')
                    ? 'bg-[#e8f0fe] text-[#1a73e8]'
                    : 'text-[#3c4043] hover:bg-[#f1f3f4]',
                )}
              >
                <MaterialIcon name="notifications" size={20} fill={pathname.startsWith('/account/notifications')} />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d93025] px-1.5 text-[11px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/properties"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
              >
                <MaterialIcon name="search" size={20} />
                Browse properties
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
