'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useUnreadNotificationCount } from '../../lib/api/queries';

const titles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/properties': 'Properties',
  '/dashboard/units': 'Units',
  '/dashboard/inquiries': 'Inquiries',
  '/dashboard/bookings': 'Bookings',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/documents': 'Documents',
  '/dashboard/developments/new': 'Add Development',
  '/dashboard/rentals': 'Rentals',
  '/dashboard/settings': 'Settings',
  '/dashboard/profile': 'Company Profile',
};

export function DashboardTopbar() {
  const pathname = usePathname();
  const title = titles[pathname] ?? 'Dashboard';
  const { data: unread } = useUnreadNotificationCount();
  const unreadCount = unread?.count ?? 0;

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 lg:px-8 shrink-0">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
          <Search size={15} />
        </button>

        {/* Notifications — badge only when there are unread ones */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Add development */}
        <Button href="/dashboard/developments/new" size="sm" icon={<Plus size={14} />}>
          Add Development
        </Button>
      </div>
    </header>
  );
}
