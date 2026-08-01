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
        <h2 className="text-2xl font-semibold text-gray-900">Good morning, {firstName}. 👋</h2>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening across your portfolio today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Properties" value={stats?.properties.total ?? '—'} icon={Building2} change="0" positive />
        <StatCard label="Active Listings" value={stats?.properties.active ?? '—'} icon={DoorOpen} iconColor="text-emerald-600" iconBg="bg-emerald-50 border-emerald-200" change="" positive />
        <StatCard label="Inquiries (30d)" value={stats?.inquiries.last30Days ?? '—'} icon={MessageSquare} iconColor="text-gold-600" iconBg="bg-gold-50 border-gold-200" change="" positive />
        <StatCard label="Pending Bookings" value={stats?.bookings.pending ?? '—'} icon={Eye} iconColor="text-violet-600" iconBg="bg-violet-50 border-violet-200" change="" positive />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Properties list */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Your Properties</h3>
            <Link href="/dashboard/properties" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {properties.length > 0 ? properties.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.address?.neighborhood ?? '—'} · {p.availableUnits ?? 0} units available</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-gray-900">{formatPrice(p.priceFrom, p.currency)}</p>
                  <span className={cn('text-xs rounded-full px-2 py-0.5', getStatusColor(p.status))}>
                    {getStatusLabel(p.status)}
                  </span>
                </div>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">No properties yet</div>
            )}
          </div>
        </div>

        {/* Traffic sources */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Traffic Sources</h3>
            <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
          </div>
          <div className="p-6 space-y-4">
            {[{ source: 'Direct', percent: 45 }, { source: 'Search', percent: 30 }, { source: 'Social', percent: 15 }, { source: 'Referral', percent: 10 }].map(({ source, percent }) => (
              <div key={source}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{source}</span>
                  <span className="font-medium text-gray-900">{percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Top performers */}
          <div className="border-t border-gray-200 px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Top Performer</p>
            {properties[0] ? (
              <div className="flex items-center gap-3">
                <TrendingUp size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{properties[0].name}</p>
                  <p className="text-xs text-gray-500">{properties[0].availableUnits} units available</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent inquiries */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Recent Inquiries</h3>
            <Link href="/dashboard/inquiries" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {inquiries.length > 0 ? inquiries.map((inq) => (
              <div key={inq.id} className="flex items-start gap-3 px-6 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                  {inq.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{inq.name}</p>
                    <span className={cn('text-[10px] rounded-full px-2 py-0.5 font-medium',
                      inq.status === 'NEW' ? 'bg-brand-50 text-brand-700' :
                      inq.status === 'REPLIED' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-gray-100 text-gray-500'
                    )}>
                      {inq.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{inq.property?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{inq.message}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{formatDate(inq.createdAt)}</span>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">No inquiries yet</div>
            )}
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Upcoming Bookings</h3>
            <Link href="/dashboard/bookings" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {bookings.length > 0 ? bookings.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-100 leading-none">
                  <span className="text-[10px] text-gray-500 uppercase">{new Date(b.date).toLocaleDateString('en', { month: 'short' })}</span>
                  <span className="text-base font-semibold text-gray-900">{new Date(b.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.property?.name ?? '—'} · {b.time}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn('text-[10px] rounded-full px-2 py-0.5 font-medium',
                    b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                    b.status === 'PENDING' ? 'bg-gold-50 text-gold-700' :
                    'bg-red-50 text-red-700'
                  )}>
                    {b.status.toLowerCase()}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{b.type.toLowerCase()}</p>
                </div>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">No bookings yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
