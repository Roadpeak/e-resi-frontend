'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BellOff, CalendarDays, CheckCheck, Clock3, Globe, HelpCircle, Loader2,
  LogOut, MessageSquare, Plus, Search, Settings, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api/client';
import { notificationsApi, type AppNotification } from '../../lib/api/notifications';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useUnreadNotificationCount } from '../../lib/api/queries';
import { CommandPalette } from './CommandPalette';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const NOTIF_ICONS: Partial<Record<AppNotification['type'], React.ReactNode>> = {
  INQUIRY_RECEIVED: <MessageSquare size={13} />,
  BOOKING_CONFIRMED: <CalendarDays size={13} />,
  BOOKING_CANCELLED: <CalendarDays size={13} />,
  KYB_APPROVED: <ShieldCheck size={13} />,
  KYB_REJECTED: <ShieldCheck size={13} />,
  PROPERTY_PUBLISHED: <Sparkles size={13} />,
};

export function DashboardTopnav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data: unread } = useUnreadNotificationCount();
  const unreadCount = unread?.count ?? 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // KYB status chip
  const { data: profile } = useQuery({
    queryKey: ['developer-profile'],
    queryFn: () => apiClient.get<{ companyName: string; kybStatus: string }>('/users/developers/me'),
  });

  // Notifications feed (only fetched while the panel is open)
  const { data: feed, isLoading: feedLoading } = useQuery({
    queryKey: ['notifications', 'feed'],
    queryFn: () => notificationsApi.list(8),
    enabled: bellOpen,
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
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

  async function markAllRead() {
    await notificationsApi.markAllRead().catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function openNotification(n: AppNotification) {
    if (!n.read) {
      await notificationsApi.markRead(n.id).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    setBellOpen(false);
    if (n.type.startsWith('INQUIRY')) router.push('/dashboard/inquiries');
    else if (n.type.startsWith('BOOKING')) router.push('/dashboard/bookings');
    else if (n.type.startsWith('KYB')) router.push('/dashboard/profile');
    else if (n.type === 'PROPERTY_PUBLISHED') router.push('/dashboard/properties');
  }

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
          href="mailto:support@e-resi.co.ke"
          className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Contact support"
        >
          <HelpCircle size={15} />
        </a>

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {feedLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-gray-300" />
                  </div>
                ) : (feed?.data ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <BellOff size={18} className="text-gray-300" />
                    <p className="text-sm text-gray-400">Nothing yet — inquiries, bookings and verification updates land here.</p>
                  </div>
                ) : (
                  (feed?.data ?? []).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openNotification(n)}
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 cursor-pointer',
                        !n.read && 'bg-brand-50/40',
                      )}
                    >
                      <span className={cn(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                        n.read ? 'bg-gray-100 text-gray-400' : 'bg-brand-100 text-brand-700',
                      )}>
                        {NOTIF_ICONS[n.type] ?? <Bell size={13} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">{n.title}</span>
                        <span className="block text-xs leading-relaxed text-gray-500 line-clamp-2">{n.body}</span>
                        <span className="mt-0.5 block text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 hover:ring-2 hover:ring-brand-200 transition-all cursor-pointer"
            aria-label="Account menu"
          >
            {initials || '·'}
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
