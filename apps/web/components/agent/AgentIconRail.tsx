'use client';

import 'material-symbols/rounded.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../../lib/api/chat';
import { supportApi } from '../../lib/api/support';
import { partnershipsApi } from '../../lib/api/partnerships';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { MobileNav } from '../dashboard/MobileNav';
import { useAuthStore } from '../../lib/stores/auth.store';
import { cn } from '../../lib/utils';

const NAV = [
  { label: 'Overview', href: '/agent', icon: 'dashboard' },
  // Developments the agent lists and owns themselves.
  { label: 'My Listings', href: '/agent/listings', icon: 'apartment' },
  // Developers' developments assigned to them through a partnership.
  { label: 'Partner Listings', href: '/agent/properties', icon: 'corporate_fare' },
  // Rentals they list or were engaged to let.
  { label: 'Rentals', href: '/agent/rentals', icon: 'key' },
  { label: 'Partners', href: '/agent/partners', icon: 'handshake' },
  { label: 'Deals', href: '/agent/deals', icon: 'payments' },
  { label: 'Reservations', href: '/agent/reservations', icon: 'vpn_key' },
  { label: 'Leads', href: '/agent/leads', icon: 'person_search' },
  { label: 'Inquiries', href: '/agent/inquiries', icon: 'forum' },
  { label: 'Viewings', href: '/agent/bookings', icon: 'calendar_month' },
  { label: 'Client Rooms', href: '/agent/clients', icon: 'collections_bookmark' },
  { label: 'Mandate Pool', href: '/agent/mandates', icon: 'storefront' },
  { label: 'Lettings', href: '/agent/lettings', icon: 'real_estate_agent' },
  { label: 'Messages', href: '/agent/messages', icon: 'chat' },
  { label: 'Analytics', href: '/agent/analytics', icon: 'monitoring' },
  { label: 'Reels', href: '/agent/reels', icon: 'smart_display' },
  { label: 'Reviews', href: '/agent/reviews', icon: 'star' },
  { label: 'Website', href: '/agent/website', icon: 'language' },
  { label: 'Site content', href: '/agent/website/content', icon: 'article' },
  // The agency's staff logins, like a developer's team.
  { label: 'Team', href: '/agent/team', icon: 'group' },
  { label: 'Billing', href: '/agent/billing', icon: 'credit_card' },
  { label: 'My Profile', href: '/agent/profile', icon: 'verified' },
];

const BOTTOM = [
  { label: 'Contact e-resi', href: '/agent/support', icon: 'support_agent' },
  { label: 'Visit Site', href: '/', icon: 'public' },
];

function RailItem({
  label, href, icon, active, badge, expanded,
}: {
  label: string; href: string; icon: string; active?: boolean; badge?: number; expanded?: boolean;
}) {
  // Fixed-position tooltip, same reason as the developer rail: the list
  // scrolls on short viewports, and absolute labels would be clipped.
  // Only for the collapsed rail; expanded rows carry their own label.
  const [tipY, setTipY] = useState<number | null>(null);
  const showBadge = !!badge && badge > 0;

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={(e) => {
        if (expanded) return;
        const r = e.currentTarget.getBoundingClientRect();
        setTipY(r.top + r.height / 2);
      }}
      onMouseLeave={() => setTipY(null)}
      className={cn(
        'group relative flex shrink-0 items-center rounded-full transition-colors',
        expanded ? 'h-9 w-full gap-3.5 pl-3 pr-3' : 'h-9 w-9 justify-center',
        active
          ? 'bg-[#d3e3fd] text-[#0b57d0]'
          : 'text-[#3c4043] hover:bg-[#f1f3f4] hover:text-[#202124]',
      )}
    >
      <MaterialIcon name={icon} size={20} fill={active} weight={active ? 500 : 400} />
      {expanded && <span className={cn('min-w-0 flex-1 truncate text-[14px]', active ? 'font-semibold' : 'font-medium')}>{label}</span>}
      {showBadge && (expanded ? (
        <span className="ml-auto rounded-full bg-[#ea4335] px-1.5 text-[11px] font-bold leading-[18px] text-white">{badge! > 99 ? '99+' : badge}</span>
      ) : (
        <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#ea4335] px-0.5 text-[8px] font-bold text-white">
          {badge! > 9 ? '9+' : badge}
        </span>
      ))}
      {tipY !== null && !expanded && (
        <span
          className="pointer-events-none fixed left-14 z-50 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#3c4043] px-2 py-1 text-xs font-medium tracking-wide text-white shadow-md"
          style={{ top: tipY }}
        >
          {label}
        </span>
      )}
    </Link>
  );
}

const EXPANDED_KEY = 'eresi:agentRailExpanded';

/**
 * Agent navigation. Deliberately the same rail pattern as the developer
 * dashboard — the two roles do different work, but someone who has seen one
 * should not have to relearn the other.
 *
 * Collapsed (icons) by default; the menu button widens it to icons and labels
 * the way Google's apps do — no divider, same ground as the page, scrollbar
 * hidden — and the choice is remembered. A fade and arrow at either end show
 * when there is more of the list to scroll to.
 */
export function AgentIconRail() {
  const pathname = usePathname();
  const user = useAuthStore((st) => st.user);
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ up: false, down: false });

  useEffect(() => {
    try { setExpanded(localStorage.getItem(EXPANDED_KEY) === '1'); } catch { /* private mode */ }
  }, []);
  const toggle = () => setExpanded((v) => {
    try { localStorage.setItem(EXPANDED_KEY, v ? '0' : '1'); } catch { /* private mode */ }
    return !v;
  });

  // Is there more list above or below what is showing?
  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setMore({ up: el.scrollTop > 4, down: el.scrollTop + el.clientHeight < el.scrollHeight - 4 });
  }, []);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [measure, expanded]);
  const nudge = (dir: 1 | -1) => listRef.current?.scrollBy({ top: dir * 220, behavior: 'smooth' });

  // A staff member sees only what the agency ticked. Overview always shows.
  const nav = user?.isStaff
    ? NAV.filter((item) => {
        const key = item.href.split('/')[2] ?? '';
        return key === '' || (user.staffPages ?? []).includes(key);
      })
    : NAV;

  // The most specific match wins, so /agent/website/content lights
  // "Site content" alone rather than "Website" as well.
  const activeHref = [...nav].filter((i) => (i.href === '/agent' ? pathname === '/agent' : pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

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

  return (
    <>
    <MobileNav items={nav} bottom={BOTTOM} badges={badges} home="/agent" />
    <nav
      aria-label="Agent menu"
      className={cn(
        'sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col justify-between gap-2 bg-white py-3 transition-[width] duration-200 ease-out md:flex',
        expanded ? 'w-64 items-stretch px-3' : 'w-16 items-center border-r border-gray-100',
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
        aria-expanded={expanded}
        title={expanded ? 'Collapse menu' : 'Expand menu'}
        className={cn('flex h-9 shrink-0 items-center rounded-full text-[#3c4043] transition-colors hover:bg-[#f1f3f4]', expanded ? 'w-9 justify-center self-start' : 'w-9 justify-center')}
      >
        <MaterialIcon name={expanded ? 'menu_open' : 'menu'} size={20} />
      </button>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Scrolls when the viewport is shorter than the list, so the bottom
            links never fall off-screen. Scrollbar hidden, as Google does. */}
        <div
          ref={listRef}
          onScroll={measure}
          className={cn('flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', expanded ? 'items-stretch' : 'items-center')}
        >
          {nav.map((item) => (
            <RailItem
              key={item.href}
              {...item}
              expanded={expanded}
              active={item.href === activeHref}
              badge={badgeFor(item.href)}
            />
          ))}
        </div>

        {/* More-to-scroll hints: a fade over the edge and an arrow that scrolls. */}
        {more.up && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-10 justify-center bg-gradient-to-b from-white via-white/85 to-transparent">
            <button type="button" aria-label="Scroll menu up" onClick={() => nudge(-1)}
              className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#5f6368] shadow-[0_1px_3px_rgba(60,64,67,0.3)] hover:text-[#202124]">
              <MaterialIcon name="keyboard_arrow_up" size={18} />
            </button>
          </div>
        )}
        {more.down && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-gradient-to-t from-white via-white/85 to-transparent pb-0.5">
            <button type="button" aria-label="Scroll menu down — more items" onClick={() => nudge(1)}
              className="pointer-events-auto flex h-6 w-6 animate-bounce items-center justify-center rounded-full bg-white text-[#5f6368] shadow-[0_1px_3px_rgba(60,64,67,0.3)] [animation-iteration-count:2] hover:text-[#202124]">
              <MaterialIcon name="keyboard_arrow_down" size={18} />
            </button>
          </div>
        )}
      </div>

      <div className={cn('flex shrink-0 flex-col gap-1 pt-2', expanded ? 'items-stretch' : 'items-center border-t border-[#f1f3f4]')}>
        {BOTTOM.map((item) => (
          <RailItem key={item.href} {...item} expanded={expanded} active={pathname === item.href} badge={badgeFor(item.href)} />
        ))}
      </div>
    </nav>
    </>
  );
}
