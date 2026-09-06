'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BellOff, CheckCheck, Loader2, KeyRound, FileText, MessageCircle,
  CalendarDays, Home, Megaphone,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { notificationsApi, type AppNotification } from '../../../../lib/api/notifications';

/**
 * The investor/tenant notification feed — purchase updates, shared
 * documents, viewing confirmations. Opening one marks it read and jumps to
 * the page that can act on it.
 */

const ICONS: Partial<Record<AppNotification['type'], React.ReactNode>> = {
  RESERVATION_UPDATED: <KeyRound size={15} />,
  RESERVATION_EXPIRING: <KeyRound size={15} />,
  UNIT_OWNERSHIP_GRANTED: <Home size={15} />,
  DOCUMENT_SHARED: <FileText size={15} />,
  INQUIRY_REPLIED: <MessageCircle size={15} />,
  BOOKING_CONFIRMED: <CalendarDays size={15} />,
  BOOKING_CANCELLED: <CalendarDays size={15} />,
  SYSTEM_ANNOUNCEMENT: <Megaphone size={15} />,
};

/** Where each notification type lands in the account area. */
function destination(n: AppNotification): string | null {
  if (n.type === 'UNIT_OWNERSHIP_GRANTED') return '/account/units';
  if (n.type.startsWith('RESERVATION') || n.type === 'DOCUMENT_SHARED') return '/account/reservations';
  if (n.type.startsWith('BOOKING')) return '/account/viewings';
  if (n.type.startsWith('INQUIRY')) return '/account/inquiries';
  return null;
}

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AccountNotifications() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'page'],
    queryFn: () => notificationsApi.list(50),
  });

  const notifications = data?.data ?? [];
  const unread = data?.unreadCount ?? 0;

  async function markAllRead() {
    await notificationsApi.markAllRead().catch(() => {});
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function open(n: AppNotification) {
    if (!n.read) {
      await notificationsApi.markRead(n.id).catch(() => {});
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
    const to = destination(n);
    if (to) router.push(to);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-[#1a73e8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-normal text-[#202124]">Notifications</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {unread > 0
              ? `${unread} unread — purchase updates, documents and viewing confirmations land here.`
              : 'Purchase updates, documents and viewing confirmations land here.'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#dadce0] bg-white py-20 text-center">
          <BellOff size={28} className="mb-3 text-[#dadce0]" />
          <p className="text-[15px] font-medium text-[#5f6368]">Nothing yet</p>
          <p className="mt-1 text-[13px] text-[#80868b]">
            When something moves — a viewing, a purchase step, a document — it appears here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
          <ul className="divide-y divide-[#f1f3f4]">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => open(n)}
                  className={cn(
                    'flex w-full cursor-pointer items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f8f9fa]',
                    !n.read && 'bg-[#f8fbff]',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      n.read ? 'bg-[#f1f3f4] text-[#80868b]' : 'bg-[#e8f0fe] text-[#1a73e8]',
                    )}
                  >
                    {ICONS[n.type] ?? <Bell size={15} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-[15px] text-[#202124]', !n.read && 'font-medium')}>
                      {n.title}
                    </span>
                    <span className="mt-0.5 block text-[13.5px] leading-relaxed text-[#5f6368]">
                      {n.body}
                    </span>
                    <span className="mt-1 block text-[12px] text-[#80868b]">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#1a73e8]" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
