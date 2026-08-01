'use client';

import { motion } from 'framer-motion';
import { Eye, MessageSquare, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { StatCard } from '../../../../components/dashboard/StatCard';
import { useDeveloperStats, useProperties, useDeveloperInquiries } from '../../../../lib/api/queries';

function BarChart({ data }: { data: { date: string; views: number }[] }) {
  const max = Math.max(...data.map((d) => d.views), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((point, i) => (
        <div key={point.date} className="flex-1 flex flex-col items-center gap-1.5">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(point.views / max) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-500 min-h-1"
          />
          <span className="text-[10px] text-gray-400">{point.date}</span>
        </div>
      ))}
    </div>
  );
}

// Generate last-7-days placeholder bars from inquiry/booking counts
function buildPlaceholderChart(total: number): { date: string; views: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base = Math.max(Math.floor(total / 7), 1);
  return days.map((d, i) => ({ date: d, views: base + Math.floor(Math.sin(i) * base * 0.4) }));
}

const TRAFFIC_SOURCES = [
  { source: 'Direct', gradient: 'from-brand-600 to-brand-400' },
  { source: 'Search', gradient: 'from-violet-600 to-violet-400' },
  { source: 'Social', gradient: 'from-emerald-600 to-emerald-400' },
  { source: 'Referral', gradient: 'from-gold-600 to-gold-400' },
];

export default function DashboardAnalytics() {
  const { data: stats } = useDeveloperStats();
  const { data: propertiesData } = useProperties({ limit: 10 });
  const { data: inquiriesData } = useDeveloperInquiries({ limit: 100 });

  const properties = propertiesData?.items ?? [];
  const totalInquiries = stats?.inquiries.last30Days ?? 0;
  const totalBookings = stats?.bookings.pending ?? 0;
  const chartData = buildPlaceholderChart(totalInquiries + totalBookings);

  // Distribute traffic sources proportionally (placeholder until backend exposes event tracking)
  const trafficPercents = [45, 30, 15, 10];

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">Performance overview for all your properties</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Properties" value={stats?.properties.total ?? '—'} icon={Eye} change="" positive />
        <StatCard label="Active Listings" value={stats?.properties.active ?? '—'} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-50 border-emerald-200" change="" positive />
        <StatCard label="Inquiries (30d)" value={stats?.inquiries.last30Days ?? '—'} icon={MessageSquare} iconColor="text-gold-600" iconBg="bg-gold-50 border-gold-200" change="" positive />
        <StatCard label="Pending Bookings" value={stats?.bookings.pending ?? '—'} icon={TrendingUp} iconColor="text-violet-600" iconBg="bg-violet-50 border-violet-200" change="" positive />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Page views chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Activity Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days (estimated)</p>
            </div>
            <span className="text-sm font-semibold text-emerald-600">
              {totalInquiries + totalBookings} total interactions
            </span>
          </div>
          <BarChart data={chartData} />
        </div>

        {/* Traffic sources */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-5 font-semibold text-gray-900">Traffic Sources</h3>
          <div className="space-y-4">
            {TRAFFIC_SOURCES.map(({ source, gradient }, i) => (
              <div key={source}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-gray-500">{source}</span>
                  <span className="font-medium text-gray-900">{trafficPercents[i]}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${trafficPercents[i]}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Property performance table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-brand-600" />
          <h3 className="font-semibold text-gray-900">Property Performance</h3>
        </div>
        {properties.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">No properties yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Property</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Units Available</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total Units</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Inquiries (30d)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {properties.map((p, i) => {
                  const propertyInquiries = (inquiriesData?.items ?? []).filter(
                    (inq) => inq.property?.slug === p.slug,
                  ).length;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">{p.availableUnits}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">{p.totalUnits}</td>
                      <td className="px-6 py-4 text-sm text-right text-emerald-600">{propertyInquiries}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
