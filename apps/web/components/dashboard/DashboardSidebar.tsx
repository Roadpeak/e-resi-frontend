'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, DoorOpen, MessageSquare,
  CalendarDays, BarChart3, FileText, Settings,
  ChevronLeft, ChevronRight, Globe, Home,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Properties', href: '/dashboard/properties', icon: Building2 },
  { label: 'Units', href: '/dashboard/units', icon: DoorOpen },
  { label: 'Rentals', href: '/dashboard/rentals', icon: Home },
  { label: 'Inquiries', href: '/dashboard/inquiries', icon: MessageSquare, badge: 14 },
  { label: 'Bookings', href: '/dashboard/bookings', icon: CalendarDays },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText },
];

const bottomItems = [
  { label: 'Visit Site', href: '/', icon: Globe },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative hidden md:flex flex-col border-r border-white/5 bg-surface-900 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-white/5 px-4', collapsed && 'justify-center')}>
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <span className="text-xs font-bold text-white">VR</span>
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <span className="text-xs font-bold text-white">VR</span>
            </div>
            <span className="text-base font-semibold text-white">
              Hom<span className="text-brand-400">VR</span>
            </span>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-brand-600/15 text-brand-300 border border-brand-500/20'
                  : 'text-white/40 hover:text-white hover:bg-white/5',
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/5 py-3 px-2 space-y-0.5">
        {bottomItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/30 hover:text-white/70 hover:bg-white/5 transition-all',
              collapsed && 'justify-center px-2',
            )}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {/* User */}
        {!collapsed && (
          <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/20 text-brand-300 text-xs font-semibold shrink-0">
              PD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">Pristine Dev.</p>
              <p className="text-[10px] text-white/30 truncate">developer</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-surface-800 text-white/40 hover:text-white transition-colors cursor-pointer z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
