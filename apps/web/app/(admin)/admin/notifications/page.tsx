'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { notificationsApi, type AppNotification } from '../../../../lib/api/notifications';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white';

/**
 * Icon and tint per event type. Anything unmapped falls back to a neutral
 * bell rather than rendering blank, so a newly added type still shows up.
 */
const LOOK: Record<string, { icon: string; bg: string; fg: string }> = {
  SYSTEM_ANNOUNCEMENT: { icon: 'campaign', bg: 'bg-[#e8f0fe]', fg: 'text-[#174ea6]' },
  INQUIRY_RECEIVED: { icon: 'forum', bg: 'bg-[#e8f0fe]', fg: 'text-[#174ea6]' },
  INQUIRY_REPLIED: { icon: 'reply', bg: 'bg-[#e8f0fe]', fg: 'text-[#174ea6]' },
  BOOKING_CONFIRMED: { icon: 'event_available', bg: 'bg-[#e6f4ea]', fg: 'text-[#188038]' },
  BOOKING_CANCELLED: { icon: 'event_busy', bg: 'bg-[#fce8e6]', fg: 'text-[#c5221f]' },
  RESERVATION_UPDATED: { icon: 'bookmark', bg: 'bg-[#fef7e0]', fg: 'text-[#b06000]' },
  RESERVATION_EXPIRING: { icon: 'hourglass_bottom', bg: 'bg-[#fef7e0]', fg: 'text-[#b06000]' },
  PAYMENT_RECEIVED: { icon: 'payments', bg: 'bg-[#e6f4ea]', fg: 'text-[#188038]' },
  INVOICE_ISSUED: { icon: 'receipt_long', bg: 'bg-[#e8f0fe]', fg: 'text-[#174ea6]' },
  INVOICE_REMINDER: { icon: 'notification_important', bg: 'bg-[#fce8e6]', fg: 'text-[#c5221f]' },
  RECEIPT_ISSUED: { icon: 'task_alt', bg: 'bg-[#e6f4ea]', fg: 'text-[#188038]' },
  PAYMENT_METHOD_UPDATED: { icon: 'credit_card', bg: 'bg-[#e8f0fe]', fg: 'text-[#174ea6]' },
  KYB_APPROVED: { icon: 'verified', bg: 'bg-[#e6f4ea]', fg: 'text-[#188038]' },
  KYB_REJECTED: { icon: 'gpp_maybe', bg: 'bg-[#fce8e6]', fg: 'text-[#c5221f]' },
  PROPERTY_PUBLISHED: { icon: 'domain_add', bg: 'bg-[#e6f4ea]', fg: 'text-[#188038]' },
  GENERAL: { icon: 'notifications', bg: 'bg-[#f1f3f4]', fg: 'text-[#5f6368]' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

/** Relative for the last day, then absolute — "3d ago" stops being useful fast. */
function when(iso: string): string {
  const then = new Date(iso);
  const mins = Math.round((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Where a notification should take you. The API stores a resource id and type
 * rather than a URL, so the mapping lives here — closest to the routes it
 * depends on.
 */
function linkFor(n: AppNotification): string | null {
  switch (n.resourceType) {
    case 'DeveloperProfile': return n.resourceId ? `/admin/developers/${n.resourceId}` : '/admin/developers';
    case 'Property': return '/admin/properties';
    case 'Invoice': return '/admin/billing/invoices';
    case 'Receipt': return '/admin/billing/invoices';
    case 'ProductionOrder': return '/admin/production';
    case 'Inquiry':
    case 'Booking':
    case 'Reservation': return '/admin/rentals';
    default: return null;
  }
}

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', filter],
    queryFn: () => notificationsApi.list(50, { unreadOnly: filter === 'unread' }),
    // Admins keep this open while working the queues; new events should appear
    // without a manual refresh.
    refetchInterval: 60_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  };

  const markOne = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: refresh,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not update'),
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: refresh,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not update'),
  });

  const rows = data?.data ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-medium text-[#202124]">Notifications</h1>
          <p className="mt-1 text-[14px] text-[#5f6368]">
            {unread > 0
              ? `${unread} unread · everything happening across the platform`
              : 'Everything happening across the platform.'}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f0f4f9] disabled:opacity-60"
          >
            {markAll.isPending ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </header>

      {error && (
        <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as 'all' | 'unread')}
            className={cn(
              'rounded-full border px-4 py-2 text-[13px] font-medium transition-colors',
              filter === f.key
                ? 'border-[#202124] bg-[#202124] text-white'
                : 'border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4]',
            )}
          >
            {f.label}
            {f.key === 'unread' && unread > 0 && (
              <span className="ml-1.5 text-[12px] opacity-80">{unread}</span>
            )}
          </button>
        ))}
      </div>

      <div className={cardCls}>
        {isLoading ? (
          <p className="py-12 text-center text-[14px] text-[#5f6368]">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <MaterialIcon name="notifications_off" className="text-[32px] text-[#dadce0]" />
            <p className="mt-2 text-[14px] text-[#5f6368]">
              {filter === 'unread' ? 'Nothing unread.' : 'No notifications yet.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#f1f3f4]">
            {rows.map((n) => {
              const look = LOOK[n.type] ?? LOOK.GENERAL;
              const href = linkFor(n);

              const body = (
                <div className="flex gap-3.5">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', look.bg)}>
                    <MaterialIcon name={look.icon} className={cn('text-[19px]', look.fg)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className={cn(
                        'text-[15px] text-[#202124]',
                        !n.read && 'font-medium',
                      )}>
                        {n.title}
                      </p>
                      <span className="shrink-0 whitespace-nowrap text-[12px] text-[#80868b]">
                        {when(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-[#5f6368]">{n.body}</p>
                  </div>
                  {!n.read && (
                    <span
                      aria-label="Unread"
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1a73e8]"
                    />
                  )}
                </div>
              );

              return (
                <li
                  key={n.id}
                  className={cn('px-5 py-4 transition-colors', !n.read && 'bg-[#f8fbff]')}
                >
                  {href ? (
                    <Link
                      href={href}
                      onClick={() => { if (!n.read) markOne.mutate(n.id); }}
                      className="block rounded-xl transition-colors hover:bg-[#f1f3f4]/60"
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { if (!n.read) markOne.mutate(n.id); }}
                      className="block w-full text-left"
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
