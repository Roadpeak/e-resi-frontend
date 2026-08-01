'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, CalendarDays, MessageSquare, MessagesSquare, KeyRound, User, Settings, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/stores/auth.store';

const navItems = [
  { label: 'Saved Properties', href: '/account/saved', icon: Heart },
  { label: 'My Viewings', href: '/account/viewings', icon: CalendarDays },
  { label: 'Messages', href: '/account/messages', icon: MessagesSquare },
  { label: 'My Inquiries', href: '/account/inquiries', icon: MessageSquare },
  { label: 'Reservations', href: '/account/reservations', icon: KeyRound },
];

const bottomItems = [
  { label: 'Profile', href: '/account', icon: User },
  { label: 'Browse Properties', href: '/properties', icon: Globe },
  { label: 'Settings', href: '/account/settings', icon: Settings },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';
  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <span className="text-xs font-bold text-white">VR</span>
          </div>
          <span className="text-base font-semibold text-gray-900">
            Hom<span className="text-brand-600">VR</span>
          </span>
        </Link>
      </div>

      {/* User card */}
      <div className="border-b border-gray-200 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email ?? ''}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-brand-50 text-brand-700 border border-brand-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
              )}
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200 py-3 px-3 space-y-0.5">
        {bottomItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <Icon size={17} className="shrink-0" />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
