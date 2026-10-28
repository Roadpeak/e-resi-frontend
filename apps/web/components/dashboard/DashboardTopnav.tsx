'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Clock3, Globe, HelpCircle, LogOut, Plus, Search, Settings, ShieldCheck,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api/client';
import { useAuthStore } from '../../lib/stores/auth.store';
import { CommandPalette } from './CommandPalette';
import { NotificationBell } from '../notifications/NotificationBell';

export function DashboardTopnav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // KYB status chip
  const { data: profile } = useQuery({
    queryKey: ['developer-profile'],
    queryFn: () => apiClient.get<{ companyName: string; kybStatus: string; logoUrl?: string | null }>('/users/developers/me'),
  });


  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // ⌘K / Ctrl+K opens the palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);



  const section = pathname === '/dashboard' ? 'Overview' : pathname.split('/')[2]?.replace('-', ' ');
  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : '';
  const kyb = profile?.kybStatus;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
      {/* Logo + section + verification chip */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <Link href="/dashboard" aria-label="Dashboard home" className="shrink-0">
          <Logo markSize={26} textClassName="hidden sm:inline-flex text-gray-900 text-[1.15rem]" />
        </Link>
        <span className="h-5 w-px shrink-0 bg-gray-200" />
        <span className="truncate text-sm font-medium capitalize text-gray-500">{section}</span>
        {kyb && (
          <Link
            href="/dashboard/profile"
            className={cn(
              'hidden md:inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
              kyb === 'APPROVED' && 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
              kyb === 'PENDING' && 'bg-amber-50 text-amber-700 hover:bg-amber-100',
              kyb === 'REJECTED' && 'bg-red-50 text-red-700 hover:bg-red-100',
              kyb === 'NOT_SUBMITTED' && 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            )}
          >
            {kyb === 'APPROVED' ? <ShieldCheck size={11} /> : <Clock3 size={11} />}
            {kyb === 'APPROVED' ? 'Verified' : kyb === 'PENDING' ? 'In review' : kyb === 'REJECTED' ? 'Action needed' : 'Not verified'}
          </Link>
        )}
      </div>

      {/* Right cluster */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {/* Search (⌘K) — Google-style wide search bar */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden md:flex h-10 w-full max-w-md items-center gap-3 rounded-full bg-[#f1f3f4] px-4 text-left text-[#5f6368] hover:bg-[#e8eaed] transition-colors cursor-pointer"
          aria-label="Search (Cmd+K)"
        >
          <Search size={16} className="shrink-0" />
          <span className="flex-1 truncate text-[15px]">Search pages and properties</span>
          <kbd className="hidden lg:inline rounded-md border border-[#dadce0] bg-white px-1.5 py-0.5 text-[11px] font-medium text-[#80868b]">⌘K</kbd>
        </button>
        {/* compact icon on small screens */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search size={15} />
        </button>

        <Link
          href="/dashboard/developments/new"
          className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-gray-700 transition-colors"
        >
          <Plus size={14} /> Add Development
        </Link>

        {/* Help */}
        <a
          href="mailto:info@e-resi.com"
          className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Contact support"
        >
          <HelpCircle size={15} />
        </a>

        {/* Notifications — links resolve to this portal's own pages */}
        <NotificationBell size={36} />

        {/* Account menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-semibold hover:ring-2 hover:ring-brand-200 transition-all cursor-pointer',
              profile?.logoUrl ? 'border border-gray-200 bg-white' : 'bg-brand-100 text-brand-700',
            )}
            aria-label="Account menu"
          >
            {profile?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded host
              <img src={profile.logoUrl} alt={profile.companyName} className="h-full w-full object-contain p-1" />
            ) : (
              initials || '·'
            )}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
              <div className="border-b border-gray-100 px-3 pb-2 pt-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              {[
                { label: 'Company Profile', href: '/dashboard/profile', icon: ShieldCheck },
                { label: 'Settings', href: '/dashboard/settings', icon: Settings },
                { label: 'Visit Site', href: '/', icon: Globe },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <Icon size={15} /> {label}
                </Link>
              ))}
              <button
                onClick={async () => {
                  await useAuthStore.getState().logout();
                  router.push('/login');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
}
