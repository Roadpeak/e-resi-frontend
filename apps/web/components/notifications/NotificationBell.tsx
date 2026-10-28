'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BellOff, CalendarDays, CheckCheck, Loader2, MessageSquare, ShieldCheck, Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { notificationsApi, type AppNotification } from '../../lib/api/notifications';
import { useUnreadNotificationCount } from '../../lib/api/queries';
import { useAuthStore } from '../../lib/stores/auth.store';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ICONS: Partial<Record<AppNotification['type'], React.ReactNode>> = {
  INQUIRY_RECEIVED: <MessageSquare size={13} />,
  BOOKING_CONFIRMED: <CalendarDays size={13} />,
  BOOKING_CANCELLED: <CalendarDays size={13} />,
  KYB_APPROVED: <ShieldCheck size={13} />,
  KYB_REJECTED: <ShieldCheck size={13} />,
  PROPERTY_PUBLISHED: <Sparkles size={13} />,
};

/** Where a notification leads, for whichever kind of account opened it. */
function destination(role: string | undefined, n: AppNotification): string | null {
  if (role === 'DEVELOPER') {
    if (n.type.startsWith('INQUIRY')) return '/dashboard/inquiries';
    if (n.type.startsWith('BOOKING')) return '/dashboard/bookings';
    if (n.type.startsWith('KYB')) return '/dashboard/profile';
    if (n.type === 'PROPERTY_PUBLISHED') return '/dashboard/properties';
    return null;
  }
  if (role === 'AGENT') {
    if (n.type.startsWith('INQUIRY')) return '/agent/inquiries';
    if (n.type.startsWith('BOOKING')) return '/agent/bookings';
    return null;
  }
  if (role === 'ADMIN') return null;
  return '/account/notifications';
}

/**
 * Bell with unread badge and a dropdown of recent notifications, for any
 * signed-in account. Renders nothing when signed out.
 */
export function NotificationBell({ size = 40 }: { size?: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unread } = useUnreadNotificationCount();
  const unreadCount = unread?.count ?? 0;

  const { data: feed, isLoading } = useQuery({
    queryKey: ['notifications', 'feed'],
    queryFn: () => notificationsApi.list(8),
    enabled: open && isAuthenticated,
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!isAuthenticated || !user) return null;

  async function markAllRead() {
    await notificationsApi.markAllRead().catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function openOne(n: AppNotification) {
    if (!n.read) {
      await notificationsApi.markRead(n.id).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    setOpen(false);
    const to = destination(user?.role, n);
    if (to) router.push(to);
  }

  const seeAll = user.role === 'INVESTOR' || user.role === 'TENANT' ? '/account/notifications' : null;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:text-gray-900 cursor-pointer"
        style={{ width: size, height: size }}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell size={Math.round(size * 0.42)} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
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
            {isLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 size={18} className="animate-spin text-gray-300" />
              </div>
            ) : (feed?.data ?? []).length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <BellOff size={18} className="text-gray-300" />
                <p className="text-sm text-gray-400">You&apos;re all caught up.</p>
              </div>
            ) : (
              (feed?.data ?? []).map((n) => (
                <button
                  key={n.id}
                  onClick={() => openOne(n)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 cursor-pointer',
                    !n.read && 'bg-brand-50/40',
                  )}
                >
                  <span className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    n.read ? 'bg-gray-100 text-gray-400' : 'bg-brand-100 text-brand-700',
                  )}>
                    {ICONS[n.type] ?? <Bell size={13} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">{n.title}</span>
                    <span className="line-clamp-2 block text-xs leading-relaxed text-gray-500">{n.body}</span>
                    <span className="mt-0.5 block text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                </button>
              ))
            )}
          </div>
          {seeAll && (
            <Link
              href={seeAll}
              onClick={() => setOpen(false)}
              className="block border-t border-gray-100 px-4 py-2.5 text-center text-[13px] font-medium text-brand-600 hover:bg-gray-50"
            >
              See all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
