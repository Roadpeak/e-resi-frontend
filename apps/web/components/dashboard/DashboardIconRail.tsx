'use client';

import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../../lib/api/chat';
import { supportApi } from '../../lib/api/support';
import { useDeveloperInquiries } from '../../lib/api/queries';
import { useAuthStore } from '../../lib/stores/auth.store';
import { SideRail, type SideRailItem } from './SideRail';

/**
 * Grouped by the job each page does. The expanded menu draws a line and a
 * small heading where the group changes; the collapsed rail keeps the order.
 */
const NAV: SideRailItem[] = [
  { label: 'Overview', href: '/dashboard', icon: 'dashboard' },
  { label: 'Properties', href: '/dashboard/properties', icon: 'apartment', group: 'Projects' },
  { label: 'Units', href: '/dashboard/units', icon: 'meeting_room', group: 'Projects' },
  { label: 'Reservations', href: '/dashboard/reservations', icon: 'vpn_key', group: 'Projects' },
  { label: 'Rentals', href: '/dashboard/rentals', icon: 'home_work', group: 'Projects' },
  { label: 'Documents', href: '/dashboard/documents', icon: 'description', group: 'Projects' },
  { label: 'Leads', href: '/dashboard/leads', icon: 'person_search', group: 'Buyers' },
  { label: 'Inquiries', href: '/dashboard/inquiries', icon: 'forum', group: 'Buyers' },
  { label: 'Messages', href: '/dashboard/messages', icon: 'chat', group: 'Buyers' },
  { label: 'Bookings', href: '/dashboard/bookings', icon: 'calendar_month', group: 'Buyers' },
  { label: 'Agent Partners', href: '/dashboard/partners', icon: 'handshake', group: 'Agents' },
  { label: 'Agent Deals', href: '/dashboard/deals', icon: 'payments', group: 'Agents' },
  { label: 'Mandates', href: '/dashboard/mandates', icon: 'campaign', group: 'Agents' },
  { label: 'Reels', href: '/dashboard/reels', icon: 'smart_display', group: 'Marketing' },
  { label: 'Performance', href: '/dashboard/performance', icon: 'query_stats', group: 'Marketing' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: 'monitoring', group: 'Marketing' },
  { label: 'Company Profile', href: '/dashboard/profile', icon: 'verified', group: 'Company' },
  { label: 'Team', href: '/dashboard/team', icon: 'group', group: 'Company' },
  { label: 'Billing', href: '/dashboard/billing', icon: 'credit_card', group: 'Company' },
];

const BOTTOM: SideRailItem[] = [
  { label: 'Contact e-resi', href: '/dashboard/support', icon: 'support_agent' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'settings' },
  { label: 'Visit Site', href: '/', icon: 'public' },
];

/** The developer dashboard's side menu: collapsed icons, expandable to labelled groups. */
export function DashboardIconRail() {
  const user = useAuthStore((st) => st.user);

  // A staff member sees only what their employer ticked. Overview always
  // shows — a dashboard with no landing page reads as broken.
  const nav = user?.isStaff
    ? NAV.filter((item) => {
        const key = item.href.split('/')[2] ?? '';
        return key === '' || (user.staffPages ?? []).includes(key);
      })
    : NAV;
  const bottom = user?.isStaff ? BOTTOM.filter((b) => b.href === '/' || b.href === '/dashboard/support') : BOTTOM;
  const { data: newInquiries } = useDeveloperInquiries({ status: 'NEW', limit: 1 });
  const { data: chatUnread } = useQuery({
    queryKey: ['chat', 'unread'],
    queryFn: () => chatApi.unreadCount(),
    refetchInterval: 30_000,
  });
  const { data: supportUnread } = useQuery({
    queryKey: ['support', 'unread'],
    queryFn: () => supportApi.unread(),
    refetchInterval: 60_000,
  });

  const badges = {
    '/dashboard/inquiries': newInquiries?.total ?? 0,
    '/dashboard/messages': chatUnread?.count ?? 0,
    '/dashboard/support': supportUnread?.count ?? 0,
  };

  return <SideRail items={nav} bottom={bottom} badges={badges} home="/dashboard" storageKey="eresi:devRailExpanded" label="Dashboard menu" />;
}
