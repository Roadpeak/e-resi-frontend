'use client';

import 'material-symbols/rounded.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../../lib/api/chat';
import { partnershipsApi } from '../../lib/api/partnerships';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { cn } from '../../lib/utils';

const NAV = [
  { label: 'Overview', href: '/agent', icon: 'dashboard' },
  { label: 'My Listings', href: '/agent/properties', icon: 'apartment' },
  { label: 'Partners', href: '/agent/partners', icon: 'handshake' },
  { label: 'Deals', href: '/agent/deals', icon: 'payments' },
  { label: 'Inquiries', href: '/agent/inquiries', icon: 'forum' },
  { label: 'Viewings', href: '/agent/bookings', icon: 'calendar_month' },
  { label: 'Client Rooms', href: '/agent/clients', icon: 'collections_bookmark' },
  { label: 'Mandate Pool', href: '/agent/mandates', icon: 'storefront' },
  { label: 'Lettings', href: '/agent/lettings', icon: 'real_estate_agent' },
  { label: 'Messages', href: '/agent/messages', icon: 'chat' },
  { label: 'Reviews', href: '/agent/reviews', icon: 'star' },
  { label: 'Billing', href: '/agent/billing', icon: 'credit_card' },
  { label: 'My Profile', href: '/agent/profile', icon: 'verified' },
];

const BOTTOM = [{ label: 'Visit Site', href: '/', icon: 'public' }];

function RailItem({
  label, href, icon, active, badge,
}: {
  label: string; href: string; icon: string; active?: boolean; badge?: number;
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
      <span className="pointer-events-none absolute left-full z-50 ml-3 -translate-x-1 whitespace-nowrap rounded-md bg-[#3c4043] px-2 py-1 text-xs font-medium tracking-wide text-white opacity-0 shadow-md transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

/**
 * Agent navigation. Deliberately the same rail pattern as the developer
 * dashboard — the two roles do different work, but someone who has seen one
 * should not have to relearn the other.
 */
export function AgentIconRail() {
  const pathname = usePathname();

  const { data: unread } = useQuery({
    queryKey: ['chat', 'unread'],
    queryFn: () => chatApi.unreadCount(),
    refetchInterval: 60_000,
  });

  // Pending requests need an answer from this agent, so they are surfaced as
  // a badge rather than waiting to be discovered.
  const { data: pending } = useQuery({
    queryKey: ['partnerships', 'PENDING'],
    queryFn: () => partnershipsApi.list({ status: 'PENDING', limit: 1 }),
    refetchInterval: 120_000,
  });

  function badgeFor(href: string): number | undefined {
    if (href === '/agent/messages') return unread?.count;
    if (href === '/agent/partners') return pending?.meta.total;
    return undefined;
  }

  return (
    <nav className="sticky top-16 hidden h-[calc(100vh-4rem)] w-16 shrink-0 flex-col items-center justify-between border-r border-gray-100 py-4 sm:flex">
      <div className="flex flex-col items-center gap-1.5">
        {NAV.map((item) => (
          <RailItem
            key={item.href}
            {...item}
            // Exact match for the index, prefix for the rest, so /agent does
            // not stay lit while a sub-page is open.
            active={item.href === '/agent' ? pathname === '/agent' : pathname.startsWith(item.href)}
            badge={badgeFor(item.href)}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-1.5">
        {BOTTOM.map((item) => (
          <RailItem key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
}
