'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Building, Building2, Heart, Home, LayoutGrid, Search, Store, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Logo } from '../brand/Logo';
import { UserAvatar } from '../account/UserAvatar';
import { useAuthStore } from '../../lib/stores/auth.store';
import { homePathFor, homeLabelFor } from '../../lib/auth/role-home';

/**
 * The rent marketplace's app frame: a quiet grey ground, a sidebar of pill
 * links on the left, and the page itself on one white rounded sheet. On a
 * phone the sidebar becomes a top bar plus a bottom tab bar.
 */

const NAV = [
  { href: '/rent', label: 'Home', icon: LayoutGrid, match: (p: string, v: string | null) => p === '/rent' && !v },
  { href: '/rent?view=search', label: 'Search', icon: Search, match: (p: string, v: string | null) => p === '/rent' && v === 'search' },
  { href: '/rent/apartments', label: 'Apartments', icon: Building2, match: (p: string) => p === '/rent/apartments' },
  { href: '/rent/villas', label: 'Villas', icon: Home, match: (p: string) => p === '/rent/villas' },
  { href: '/rent/commercial', label: 'Commercial', icon: Store, match: (p: string) => p === '/rent/commercial' },
  { href: '/rent?view=saved', label: 'Saved', icon: Heart, match: (p: string, v: string | null) => p === '/rent' && v === 'saved' },
  { href: '/agents', label: 'Agents', icon: Users, match: () => false },
];

const MOBILE = [NAV[0], NAV[1], NAV[5], NAV[6]];

export function RentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const view = useSearchParams().get('view');
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#f2f2f2] font-google text-[#18181b]">
      {/* ── Phone top bar ── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-[#f2f2f2] px-4 lg:hidden">
        <Link href="/" aria-label="e-resi home"><Logo markSize={26} /></Link>
        <Account isAuthenticated={isAuthenticated} user={user} />
      </header>

      <div className="flex gap-0 lg:gap-5 lg:p-4">
        {/* ── Sidebar ── */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[200px] shrink-0 flex-col lg:flex">
          <Link href="/" aria-label="e-resi home" className="px-2 pb-6 pt-1"><Logo markSize={28} /></Link>
          <nav className="space-y-1" aria-label="Rent">
            {NAV.map((n) => {
              const on = n.match(pathname, view);
              return (
                <Link key={n.label} href={n.href}
                  className={cn(
                    'flex items-center gap-3 rounded-full px-4 py-2.5 text-[16px] font-medium transition-colors',
                    on ? 'bg-white font-medium text-[#18181b] shadow-[0_1px_3px_rgba(0,0,0,0.06)]' : 'text-[#52525b] hover:bg-white/60 hover:text-[#18181b]',
                  )}>
                  <n.icon size={17} className={on ? 'text-[#1a73e8]' : 'text-[#9aa0a6]'} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-1 px-1 pb-1">
            <Link href="/properties" className="flex items-center gap-3 rounded-full px-3 py-2 text-[14px] text-[#52525b] hover:bg-white/60 hover:text-[#18181b]">
              <Building size={16} className="text-[#9aa0a6]" /> Buy off-plan
            </Link>
            {isAuthenticated && user ? (
              <Link href={homePathFor(user.role)} className="flex items-center gap-3 rounded-full px-3 py-2 text-[14px] text-[#52525b] hover:bg-white/60 hover:text-[#18181b]">
                <UserAvatar user={user} size={22} /> {homeLabelFor(user.role)}
              </Link>
            ) : (
              <Link href="/login?redirect=/rent" className="flex items-center justify-center rounded-full bg-[#18181b] px-4 py-2.5 text-[14px] font-medium text-white hover:bg-black">
                Sign in
              </Link>
            )}
          </div>
        </aside>

        {/* ── The sheet ── */}
        <main className="min-w-0 flex-1 bg-white px-4 pb-28 pt-4 sm:px-6 lg:rounded-[28px] lg:px-8 lg:pb-8 lg:pt-7">
          {children}
        </main>
      </div>

      {/* ── Phone tab bar ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-black/[0.06] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Rent">
        {MOBILE.map((n) => {
          const on = n.match(pathname, view);
          return (
            <Link key={n.label} href={n.href} className={cn('flex flex-col items-center gap-0.5 py-2.5 text-[11.5px]', on ? 'font-medium text-[#1a73e8]' : 'text-[#52525b]')}>
              <n.icon size={20} /> {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Account({ isAuthenticated, user }: { isAuthenticated: boolean; user: ReturnType<typeof useAuthStore.getState>['user'] }) {
  if (isAuthenticated && user) {
    return <Link href={homePathFor(user.role)} aria-label="Your account"><UserAvatar user={user} size={34} /></Link>;
  }
  return <Link href="/login?redirect=/rent" className="rounded-full bg-[#18181b] px-4 py-1.5 text-[13.5px] font-medium text-white">Sign in</Link>;
}

/** The greeting header every rent page opens with. */
export function RentHeader({ title, children }: { title?: string; children?: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const [greeting, setGreeting] = useState('Find your next home');
  useEffect(() => {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    setGreeting(user?.firstName ? `${part}, ${user.firstName}` : part);
  }, [user?.firstName]);

  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      {title ? (
        <h1 className="rent-greeting text-[28px] font-medium tracking-[-0.04em] text-[#52525b] sm:text-[32px]">{title}</h1>
      ) : (
        // The greeting changes by hour and person, so it is not the heading a
        // search engine files the page under; the line below it is.
        <div>
          <p className="rent-greeting text-[28px] font-medium tracking-[-0.04em] text-[#52525b] sm:text-[32px]">{greeting}</p>
          <h1 className="mt-0.5 text-[15px] text-[#71717a]">Houses and apartments for rent in Nairobi</h1>
        </div>
      )}
      <div className="flex flex-1 items-center justify-end gap-3">
        {children}
        <span className="hidden lg:block">
          {isAuthenticated && user ? (
            <Link href={homePathFor(user.role)} aria-label="Your account"><UserAvatar user={user} size={40} /></Link>
          ) : (
            <Link href="/login?redirect=/rent" aria-label="Sign in" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f2f2] text-[#52525b] hover:bg-[#e8e8e8]">
              <Users size={17} />
            </Link>
          )}
        </span>
      </div>
    </div>
  );
}

/** Section heading with a "See all" link, as on the reference. */
export function RentSection({ title, action, children }: { title: string; action?: { label: string; href: string }; children: React.ReactNode }) {
  return (
    <section className="mt-9 first:mt-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] font-medium tracking-[-0.01em] text-[#52525b]">{title}</h2>
        {action && <Link href={action.href} className="text-[16px] font-medium text-[#18181b] hover:underline">{action.label}</Link>}
      </div>
      {children}
    </section>
  );
}

// ── Saved rentals (this browser only) ─────────────────────────────────────

const KEY = 'eresi:saved-rentals';
const EVT = 'eresi:saved-rentals';

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function useSavedRentals() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(read());
    const sync = () => setIds(read());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const toggle = useCallback((id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
    setIds(next);
    window.dispatchEvent(new Event(EVT));
  }, []);
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
