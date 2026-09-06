'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
    <header className="sticky top-0 z-50 border-b border-[#dadce0] bg-white/95 backdrop-blur-xl">
      <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-10 2xl:px-16">
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

      {/* Section tabs — their own row, so nothing clips the last one */}
      <nav className="border-t border-[#f1f3f4]">
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
    </header>
  );
}
