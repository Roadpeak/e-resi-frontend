'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

const titles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/properties': 'Properties',
  '/dashboard/units': 'Units',
  '/dashboard/inquiries': 'Inquiries',
  '/dashboard/bookings': 'Bookings',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/documents': 'Documents',
};

export function DashboardTopbar() {
  const pathname = usePathname();
  const title = titles[pathname] ?? 'Dashboard';

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 lg:px-8 shrink-0">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
          <Search size={15} />
        </button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500" />
        </button>

        {/* Add property */}
        <Button href="/dashboard/developments/new" size="sm" icon={<Plus size={14} />}>
          Add Property
        </Button>
      </div>
    </header>
  );
}
