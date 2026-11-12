'use client';

import 'material-symbols/rounded.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { MaterialIcon } from './MaterialIcon';
import { cn } from '../../lib/utils';

export interface MobileNavItem { label: string; href: string; icon: string }

/**
 * Phone navigation for the developer dashboard and the agent portal.
 *
 * The icon rails are desktop-only, which left phones with no way to move
 * between pages except the top-bar search. This is a bottom bar with the
 * four pages people open most and a "More" sheet listing everything else,
 * so every page is reachable with a thumb.
 */
export function MobileNav({
  items, bottom = [], badges = {}, home,
}: {
  items: MobileNavItem[];
  bottom?: MobileNavItem[];
  badges?: Record<string, number | undefined>;
  /** The overview path, matched exactly. */
  home: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const isActive = (href: string) => (href === home ? pathname === home : href !== '/' && pathname.startsWith(href));
  const primary = items.slice(0, 4);
  const rest = [...items.slice(4), ...bottom];
  const restActive = rest.some((i) => isActive(i.href));
  const moreBadge = rest.reduce((n, i) => n + (badges[i.href] ?? 0), 0);

  const Tab = ({ item, active, badge, onClick }: { item: MobileNavItem; active: boolean; badge?: number; onClick?: () => void }) => {
    const inner = (
      <>
        <span className={cn('relative flex h-8 w-14 items-center justify-center rounded-full transition-colors', active && 'bg-[#d3e3fd]')}>
          <MaterialIcon name={item.icon} size={22} fill={active} weight={active ? 500 : 400} />
          {!!badge && badge > 0 && (
            <span className="absolute right-2 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ea4335] px-1 text-[9px] font-bold text-white">{badge > 9 ? '9+' : badge}</span>
          )}
        </span>
        <span className={cn('text-[11px] leading-none', active ? 'font-medium text-[#0b57d0]' : 'text-[#5f6368]')}>{item.label}</span>
      </>
    );
    const cls = 'flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5';
    return onClick
      ? <button type="button" onClick={onClick} className={cls} aria-expanded={open}>{inner}</button>
      : <Link href={item.href} className={cls}>{inner}</Link>;
  };

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-[#e8eaed] bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Pages">
        {primary.map((item) => <Tab key={item.href} item={item} active={isActive(item.href) && !open} badge={badges[item.href]} />)}
        {rest.length > 0 && (
          <Tab item={{ label: 'More', href: '#more', icon: open ? 'close' : 'apps' }} active={open || restActive} badge={moreBadge} onClick={() => setOpen((v) => !v)} />
        )}
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-[#202124]/40 md:hidden" onClick={() => setOpen(false)}>
            <motion.div
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-4 pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
            >
              <p className="px-1 text-[12px] font-medium uppercase tracking-wide text-[#5f6368]">All pages</p>
              <ul className="mt-3 grid grid-cols-4 gap-2">
                {rest.map((item) => {
                  const active = isActive(item.href);
                  const badge = badges[item.href];
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className={cn('flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-center', active ? 'bg-[#e8f0fe] text-[#0b57d0]' : 'text-[#3c4043] active:bg-[#f1f3f4]')}>
                        <span className="relative">
                          <MaterialIcon name={item.icon} size={24} fill={active} />
                          {!!badge && badge > 0 && <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ea4335] px-1 text-[9px] font-bold text-white">{badge > 9 ? '9+' : badge}</span>}
                        </span>
                        <span className="text-[11px] leading-tight">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
