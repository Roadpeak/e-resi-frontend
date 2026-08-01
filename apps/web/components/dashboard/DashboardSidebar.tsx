'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, DoorOpen, MessageSquare,
  CalendarDays, BarChart3, FileText, Settings,
  ChevronLeft, ChevronRight, Globe, Home, BadgeCheck,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Logo, LogoMark } from '../brand/Logo';
import { useDeveloperInquiries } from '../../lib/api/queries';
import { useAuthStore } from '../../lib/stores/auth.store';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Properties', href: '/dashboard/properties', icon: Building2 },
  { label: 'Units', href: '/dashboard/units', icon: DoorOpen },
  { label: 'Rentals', href: '/dashboard/rentals', icon: Home },
  { label: 'Inquiries', href: '/dashboard/inquiries', icon: MessageSquare },
  { label: 'Bookings', href: '/dashboard/bookings', icon: CalendarDays },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText },
  { label: 'Company Profile', href: '/dashboard/profile', icon: BadgeCheck },
];

const bottomItems = [
  { label: 'Visit Site', href: '/', icon: Globe },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // live count of unanswered inquiries for the nav badge
  const { data: newInquiries } = useDeveloperInquiries({ status: 'NEW', limit: 1 });
  const user = useAuthStore((s) => s.user);
  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : '';
  const badges: Record<string, number> = {
    '/dashboard/inquiries': newInquiries?.total ?? 0,
  };

  return (
    <aside
      className={cn(
        'relative hidden md:flex flex-col border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-gray-200 px-4', collapsed && 'justify-center')}>
        {collapsed ? (
          <Link href="/" aria-label="e-resi home">
            <LogoMark size={28} />
          </Link>
        ) : (
          <Link href="/" aria-label="e-resi home">
            <Logo markSize={26} textClassName="text-gray-900 text-[1.15rem]" />
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          const badge = badges[href] ?? 0;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200 py-3 px-2 space-y-0.5">
        {bottomItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all',
              collapsed && 'justify-center px-2',
            )}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {/* User */}
        {!collapsed && user && (
          <Link href="/dashboard/profile" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-100 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.role.toLowerCase()}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:text-gray-900 transition-colors cursor-pointer z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
