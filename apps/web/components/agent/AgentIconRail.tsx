'use client';

import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../../lib/api/chat';
import { supportApi } from '../../lib/api/support';
import { partnershipsApi } from '../../lib/api/partnerships';
import { useAuthStore } from '../../lib/stores/auth.store';
import { SideRail } from '../dashboard/SideRail';

/**
 * Grouped by the job each page does. The expanded menu draws a line and a
 * small heading where the group changes; the collapsed rail keeps the order.
 */
const NAV: { label: string; href: string; icon: string; group: string }[] = [
  { label: 'Overview', href: '/agent', icon: 'dashboard', group: '' },
  // Developments the agent lists and owns themselves.
  { label: 'My Listings', href: '/agent/listings', icon: 'apartment', group: 'Listings' },
  // Developers' developments assigned to them through a partnership.
  { label: 'Partner Listings', href: '/agent/properties', icon: 'corporate_fare', group: 'Listings' },
  // Rentals they list or were engaged to let.
  { label: 'Rentals', href: '/agent/rentals', icon: 'key', group: 'Listings' },
  { label: 'Lettings', href: '/agent/lettings', icon: 'real_estate_agent', group: 'Listings' },
  { label: 'Mandate Pool', href: '/agent/mandates', icon: 'storefront', group: 'Listings' },
  { label: 'Leads', href: '/agent/leads', icon: 'person_search', group: 'Clients' },
  { label: 'Inquiries', href: '/agent/inquiries', icon: 'forum', group: 'Clients' },
  { label: 'Messages', href: '/agent/messages', icon: 'chat', group: 'Clients' },
  { label: 'Viewings', href: '/agent/bookings', icon: 'calendar_month', group: 'Clients' },
  { label: 'Client Rooms', href: '/agent/clients', icon: 'collections_bookmark', group: 'Clients' },
  { label: 'Partners', href: '/agent/partners', icon: 'handshake', group: 'Sales' },
  { label: 'Deals', href: '/agent/deals', icon: 'payments', group: 'Sales' },
  { label: 'Reservations', href: '/agent/reservations', icon: 'vpn_key', group: 'Sales' },
  { label: 'Website', href: '/agent/website', icon: 'language', group: 'Marketing' },
  { label: 'Site content', href: '/agent/website/content', icon: 'article', group: 'Marketing' },
  { label: 'Reels', href: '/agent/reels', icon: 'smart_display', group: 'Marketing' },
  { label: 'Reviews', href: '/agent/reviews', icon: 'star', group: 'Marketing' },
  { label: 'Analytics', href: '/agent/analytics', icon: 'monitoring', group: 'Marketing' },
  // The agency's staff logins, like a developer's team.
  { label: 'Team', href: '/agent/team', icon: 'group', group: 'Agency' },
  { label: 'Production requests', href: '/agent/service-requests', icon: 'movie', group: 'Agency' },
  { label: 'Billing', href: '/agent/billing', icon: 'credit_card', group: 'Agency' },
  { label: 'My Profile', href: '/agent/profile', icon: 'verified', group: 'Agency' },
];

const BOTTOM = [
  { label: 'Contact e-resi', href: '/agent/support', icon: 'support_agent' },
  { label: 'Visit Site', href: '/', icon: 'public' },
];

/**
 * Agent navigation. The same rail as the developer dashboard — the two roles
 * do different work, but someone who has seen one should not relearn the other.
 */
export function AgentIconRail() {
  const user = useAuthStore((st) => st.user);

  // A staff member sees only what the agency ticked. Overview always shows.
  const nav = user?.isStaff
    ? NAV.filter((item) => {
        const key = item.href.split('/')[2] ?? '';
        return key === '' || (user.staffPages ?? []).includes(key);
      })
    : NAV;

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

  const { data: supportUnread } = useQuery({
    queryKey: ['support', 'unread'],
    queryFn: () => supportApi.unread(),
    refetchInterval: 60_000,
  });

  function badgeFor(href: string): number | undefined {
    if (href === '/agent/messages') return unread?.count;
    if (href === '/agent/support') return supportUnread?.count;
    if (href === '/agent/partners') return pending?.meta.total;
    return undefined;
  }

  const badges = Object.fromEntries([...nav, ...BOTTOM].map((i) => [i.href, badgeFor(i.href)]));

  return <SideRail items={nav} bottom={BOTTOM} badges={badges} home="/agent" storageKey="eresi:agentRailExpanded" label="Agent menu" />;
}
