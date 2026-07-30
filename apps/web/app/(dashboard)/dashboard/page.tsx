'use client';

import { Building2, DoorOpen, MessageSquare, Eye, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { StatCard } from '../../../components/dashboard/StatCard';
import { formatPrice, formatDate, getStatusColor, getStatusLabel, cn } from '../../../lib/utils';
import { useDeveloperStats, useProperties, useDeveloperInquiries, useDeveloperBookings } from '../../../lib/api/queries';
import { useAuthStore } from '../../../lib/stores/auth.store';

export default function DashboardOverview() {
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useDeveloperStats();
  const { data: propertiesData } = useProperties({ limit: 5 });
  const { data: inquiriesData } = useDeveloperInquiries({ limit: 4 });
  const { data: bookingsData } = useDeveloperBookings({ limit: 4 });

  const properties = propertiesData?.items ?? [];
  const inquiries = inquiriesData?.items ?? [];
  const bookings = bookingsData?.items ?? [];

  const firstName = user?.firstName ?? 'there';

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Good morning, {firstName}. 👋</h2>
        <p className="mt-1 text-sm text-white/40">Here's what's happening across your portfolio today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Properties" value={stats?.properties.total ?? '—'} icon={Building2} change="0" positive />
        <StatCard label="Active Listings" value={stats?.properties.active ?? '—'} icon={DoorOpen} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" change="" positive />
        <StatCard label="Inquiries (30d)" value={stats?.inquiries.last30Days ?? '—'} icon={MessageSquare} iconColor="text-gold-400" iconBg="bg-gold-500/10 border-gold-500/20" change="" positive />
        <StatCard label="Pending Bookings" value={stats?.bookings.pending ?? '—'} icon={Eye} iconColor="text-violet-400" iconBg="bg-violet-500/10 border-violet-500/20" change="" positive />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Properties list */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-surface-800">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <h3 className="font-semibold text-white">Your Properties</h3>
            <Link href="/dashboard/properties" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {properties.length > 0 ? properties.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{p.name}</p>
                  <p className="text-xs text-white/40">{p.address?.neighborhood ?? '—'} · {p.availableUnits ?? 0} units available</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-white">{formatPrice(p.priceFrom, p.currency)}</p>
                  <span className={cn('text-xs rounded-full px-2 py-0.5', getStatusColor(p.status))}>
                    {getStatusLabel(p.status)}
                  </span>
                </div>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-white/30">No properties yet</div>
            )}
          </div>
        </div>

        {/* Traffic sources */}
        <div className="rounded-2xl border border-white/5 bg-surface-800">
          <div className="border-b border-white/5 px-6 py-4">
            <h3 className="font-semibold text-white">Traffic Sources</h3>
            <p className="text-xs text-white/30 mt-0.5">Last 7 days</p>
          </div>
          <div className="p-6 space-y-4">
            {[{ source: 'Direct', percent: 45 }, { source: 'Search', percent: 30 }, { source: 'Social', percent: 15 }, { source: 'Referral', percent: 10 }].map(({ source, percent }) => (
              <div key={source}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-white/60">{source}</span>
                  <span className="font-medium text-white">{percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Top performers */}
          <div className="border-t border-white/5 px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-white/30 mb-3">Top Performer</p>
            {properties[0] ? (
              <div className="flex items-center gap-3">
                <TrendingUp size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">{properties[0].name}</p>
                  <p className="text-xs text-white/40">{properties[0].availableUnits} units available</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/25">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent inquiries */}
        <div className="rounded-2xl border border-white/5 bg-surface-800">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <h3 className="font-semibold text-white">Recent Inquiries</h3>
            <Link href="/dashboard/inquiries" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {inquiries.length > 0 ? inquiries.map((inq) => (
              <div key={inq.id} className="flex items-start gap-3 px-6 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-brand-300 text-xs font-semibold">
                  {inq.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">{inq.name}</p>
                    <span className={cn('text-[10px] rounded-full px-2 py-0.5 font-medium',
                      inq.status === 'NEW' ? 'bg-brand-500/15 text-brand-300' :
                      inq.status === 'REPLIED' ? 'bg-emerald-500/15 text-emerald-300' :
                      'bg-white/5 text-white/40'
                    )}>
                      {inq.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 truncate">{inq.property?.name ?? '—'}</p>
                  <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{inq.message}</p>
                </div>
                <span className="text-[10px] text-white/25 shrink-0">{formatDate(inq.createdAt)}</span>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-white/30">No inquiries yet</div>
            )}
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="rounded-2xl border border-white/5 bg-surface-800">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <h3 className="font-semibold text-white">Upcoming Bookings</h3>
            <Link href="/dashboard/bookings" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {bookings.length > 0 ? bookings.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-white/5 bg-surface-700 leading-none">
                  <span className="text-[10px] text-white/40 uppercase">{new Date(b.date).toLocaleDateString('en', { month: 'short' })}</span>
                  <span className="text-base font-semibold text-white">{new Date(b.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{b.name}</p>
                  <p className="text-xs text-white/40">{b.property?.name ?? '—'} · {b.time}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn('text-[10px] rounded-full px-2 py-0.5 font-medium',
                    b.status === 'CONFIRMED' ? 'bg-emerald-500/15 text-emerald-300' :
                    b.status === 'PENDING' ? 'bg-gold-500/15 text-gold-300' :
                    'bg-red-500/15 text-red-300'
                  )}>
                    {b.status.toLowerCase()}
                  </span>
                  <p className="text-[10px] text-white/30 mt-0.5 capitalize">{b.type.toLowerCase()}</p>
                </div>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-white/30">No bookings yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
