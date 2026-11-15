'use client';

import 'material-symbols/rounded.css';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MaterialIcon } from './MaterialIcon';
import { MobileNav } from './MobileNav';
import { cn } from '../../lib/utils';

export interface SideRailItem { label: string; href: string; icon: string; group?: string }

function RailItem({
  label, href, icon, active, badge, expanded,
}: {
  label: string; href: string; icon: string; active?: boolean; badge?: number; expanded?: boolean;
}) {
  // Fixed-position tooltip: the list scrolls on short viewports, and an
  // absolute label would be clipped. Only for the collapsed rail; expanded
  // rows carry their own label.
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
        expanded
          ? 'h-9 w-full gap-3.5 px-3'
          // Many items do not fit a laptop-height rail at 36px; step down on short screens.
          : 'h-9 w-9 justify-center [@media(max-height:880px)]:h-8 [@media(max-height:880px)]:w-8',
        active ? 'bg-[#d3e3fd] text-[#0b57d0]' : 'text-[#3c4043] hover:bg-[#f1f3f4] hover:text-[#202124]',
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

/**
 * The developer dashboard's and the agent portal's side menu.
 *
 * Collapsed (icons) by default; the menu button widens it to icons and labels
 * the way Google's apps do — no divider, same ground as the page, scrollbar
 * hidden, a line and small heading where each group starts — and the choice
 * is remembered per portal. A fade and arrow at either end show when there is
 * more of the list to scroll to.
 */
export function SideRail({
  items, bottom, badges, home, storageKey, label,
}: {
  items: SideRailItem[];
  bottom: SideRailItem[];
  badges: Record<string, number | undefined>;
  /** The portal's index route: matched exactly, never as a prefix. */
  home: string;
  storageKey: string;
  label: string;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ up: false, down: false });

  useEffect(() => {
    try { setExpanded(localStorage.getItem(storageKey) === '1'); } catch { /* private mode */ }
  }, [storageKey]);
  const toggle = () => setExpanded((v) => {
    try { localStorage.setItem(storageKey, v ? '0' : '1'); } catch { /* private mode */ }
    return !v;
  });

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
  }, [measure, expanded, items.length]);
  const nudge = (dir: 1 | -1) => listRef.current?.scrollBy({ top: dir * 220, behavior: 'smooth' });

  // The most specific match wins, so a sub-page lights its own entry only.
  const activeHref = items
    .filter((i) => (i.href === home ? pathname === home : pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <>
      <MobileNav items={items} bottom={bottom} badges={badges} home={home} />
      <nav
        aria-label={label}
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
          className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3c4043] transition-colors hover:bg-[#f1f3f4]', expanded && 'self-start')}
        >
          <MaterialIcon name={expanded ? 'menu_open' : 'menu'} size={20} />
        </button>

        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* Scrolls when the viewport is shorter than the list; scrollbar hidden, as Google does. */}
          <div
            ref={listRef}
            onScroll={measure}
            className={cn('flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', expanded ? 'items-stretch' : 'items-center')}
          >
            {items.map((item, i) => (
              <Fragment key={item.href}>
                {expanded && item.group && item.group !== items[i - 1]?.group && (
                  <div className="mt-2 border-t border-[#e8eaed] px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f6368]">
                    {item.group}
                  </div>
                )}
                <RailItem {...item} expanded={expanded} active={item.href === activeHref} badge={badges[item.href]} />
              </Fragment>
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

        <div className={cn('flex shrink-0 flex-col gap-1 border-t pt-2', expanded ? 'items-stretch border-[#e8eaed]' : 'items-center border-[#f1f3f4]')}>
          {bottom.map((item) => (
            <RailItem key={item.href} {...item} expanded={expanded} active={pathname === item.href} badge={badges[item.href]} />
          ))}
        </div>
      </nav>
    </>
  );
}
