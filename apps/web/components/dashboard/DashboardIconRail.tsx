'use client';

import 'material-symbols/rounded.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../../lib/api/chat';
import { useDeveloperInquiries } from '../../lib/api/queries';
import { MaterialIcon } from './MaterialIcon';

const NAV = [
  { label: 'Overview', href: '/dashboard', icon: 'dashboard' },
  { label: 'Properties', href: '/dashboard/properties', icon: 'apartment' },
  { label: 'Units', href: '/dashboard/units', icon: 'meeting_room' },
  { label: 'Rentals', href: '/dashboard/rentals', icon: 'home_work' },
  { label: 'Messages', href: '/dashboard/messages', icon: 'chat' },
  { label: 'Agent Partners', href: '/dashboard/partners', icon: 'handshake' },
  { label: 'Inquiries', href: '/dashboard/inquiries', icon: 'forum' },
  { label: 'Bookings', href: '/dashboard/bookings', icon: 'calendar_month' },
  { label: 'Performance', href: '/dashboard/performance', icon: 'query_stats' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: 'monitoring' },
  { label: 'Documents', href: '/dashboard/documents', icon: 'description' },
  { label: 'Billing', href: '/dashboard/billing', icon: 'credit_card' },
  { label: 'Company Profile', href: '/dashboard/profile', icon: 'verified' },
];

const BOTTOM = [
  { label: 'Settings', href: '/dashboard/settings', icon: 'settings' },
  { label: 'Visit Site', href: '/', icon: 'public' },
];

function RailItem({
  label, href, icon, active, badge,
}: {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'group relative flex h-10 w-10 items-center justify-center rounded-full transition-colors',
        active
          ? 'bg-[#d3e3fd] text-[#0b57d0]'
          : 'text-[#3c4043] hover:bg-[#f1f3f4] hover:text-[#202124]',
      )}
    >
      <MaterialIcon name={icon} size={22} fill={active} weight={active ? 500 : 400} />
      {!!badge && badge > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#ea4335] px-0.5 text-[8px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {/* Tooltip — page name on hover */}
      <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-[#3c4043] px-2 py-1 text-xs font-medium tracking-wide text-white opacity-0 shadow-md transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1">
        {label}
      </span>
    </Link>
  );
}

/** Icon-only left rail — Google Material Symbols, page names on hover. */
export function DashboardIconRail() {
  const pathname = usePathname();
  const { data: newInquiries } = useDeveloperInquiries({ status: 'NEW', limit: 1 });
  const { data: chatUnread } = useQuery({
    queryKey: ['chat', 'unread'],
    queryFn: () => chatApi.unreadCount(),
    refetchInterval: 30_000,
  });

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-16 shrink-0 flex-col items-center justify-between border-r border-[#f1f3f4] py-4 md:flex">
      <nav className="flex flex-col items-center gap-1.5">
        {NAV.map(({ label, href, icon }) => (
          <RailItem
            key={href}
            label={label}
            href={href}
            icon={icon}
            active={pathname === href || (href !== '/dashboard' && pathname.startsWith(href))}
            badge={
              href === '/dashboard/inquiries' ? newInquiries?.total ?? 0
                : href === '/dashboard/messages' ? chatUnread?.count ?? 0
                : 0
            }
          />
        ))}
      </nav>
      <nav className="flex flex-col items-center gap-1.5">
        {BOTTOM.map(({ label, href, icon }) => (
          <RailItem key={href} label={label} href={href} icon={icon} active={pathname === href} />
        ))}
      </nav>
    </aside>
  );
}
