'use client';

import { motion } from 'framer-motion';
import { Eye, MessageSquare, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { StatCard } from '../../../../components/dashboard/StatCard';
import { useDeveloperStats, useMyProperties, useDeveloperInquiries, useDeveloperEngagement } from '../../../../lib/api/queries';
import { ReferralTrafficPanel } from '../../../../components/analytics/ReferralTrafficPanel';
import { InterestedVisitorsPanel } from '../../../../components/analytics/InterestedVisitorsPanel';

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
            className="w-full rounded-t-lg bg-white/25 min-h-1"
          />
          <span className="text-[12px] text-[#9aa0a6]">{point.date}</span>
        </div>
      ))}
    </div>
  );
}

const SOURCE_COLORS = [
  'bg-[#1a73e8]',
  'bg-[#8430ce]',
  'bg-[#188038]',
  'bg-[#f9ab00]',
  'bg-[#d93025]',
  'bg-[#4285f4]',
];

const weekday = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-KE', { weekday: 'short' });

export default function DashboardAnalytics() {
  const { data: stats } = useDeveloperStats();
  const { data: propertiesData } = useMyProperties({ limit: 10 });
  const { data: inquiriesData } = useDeveloperInquiries({ limit: 100 });
  const { data: engagement } = useDeveloperEngagement(7);

  const properties = propertiesData?.items ?? [];
  const daily = engagement?.daily ?? [];
  const chartData = daily.map((d) => ({
    date: weekday(d.date),
    views: d.views + d.inquiries + d.bookings,
  }));
  const totalInteractions = daily.reduce((n, d) => n + d.views + d.inquiries + d.bookings, 0);

  const sources = engagement?.sources ?? [];
  const sourceTotal = sources.reduce((n, s) => n + s.count, 0);

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Analytics</h2>
        <p className="text-base text-[#5f6368] mt-1">Performance overview for all your properties</p>
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
        <div className="lg:col-span-2 rounded-3xl border border-transparent bg-[#131314] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-normal text-white">Activity Trend</h3>
              <p className="text-[13px] text-[#9aa0a6] mt-0.5">Views, inquiries & bookings — last 7 days</p>
            </div>
            <span className="text-[13px] font-medium text-[#81c995]">
              {totalInteractions} total interactions
            </span>
          </div>
          {totalInteractions === 0 ? (
            <div className="flex h-40 items-center justify-center text-[15px] text-[#9aa0a6]">
              No activity yet — data appears as buyers view and inquire about your properties.
            </div>
          ) : (
            <BarChart data={chartData} />
          )}
        </div>

        {/* Traffic sources */}
        <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
          <h3 className="mb-5 text-[18px] font-normal text-[#202124]">Traffic Sources</h3>
          {sources.length === 0 ? (
            <p className="text-[15px] text-[#80868b]">
              No traffic recorded yet — sources appear once visitors reach your property pages.
            </p>
          ) : (
            <div className="space-y-4">
              {sources.map(({ source, count }, i) => {
                const pct = sourceTotal ? Math.round((count / sourceTotal) * 100) : 0;
                return (
                  <div key={source}>
                    <div className="mb-1.5 flex justify-between text-[15px]">
                      <span className="text-[#5f6368]">{source}</span>
                      <span className="font-medium text-[#202124]">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#f1f3f4]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-full rounded-full ${SOURCE_COLORS[i % SOURCE_COLORS.length]}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Property performance table */}
      <div className="rounded-3xl border border-[#dadce0] bg-white overflow-hidden">
        <div className="border-b border-[#dadce0] px-6 py-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-[#1a73e8]" />
          <h3 className="text-[18px] font-normal text-[#202124]">Property Performance</h3>
        </div>
        {properties.length === 0 ? (
          <div className="px-6 py-10 text-center text-[15px] text-[#5f6368]">No properties yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#dadce0]">
                  <th className="px-6 py-3 text-left text-[13px] font-medium uppercase tracking-wider text-[#5f6368]">Property</th>
                  <th className="px-6 py-3 text-right text-[13px] font-medium uppercase tracking-wider text-[#5f6368]">Units Available</th>
                  <th className="px-6 py-3 text-right text-[13px] font-medium uppercase tracking-wider text-[#5f6368]">Total Units</th>
                  <th className="px-6 py-3 text-right text-[13px] font-medium uppercase tracking-wider text-[#5f6368]">Inquiries (30d)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0]">
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
                      className="hover:bg-[#f8f9fa] transition-colors"
                    >
                      <td className="px-6 py-4 text-[15px] font-medium text-[#202124]">{p.name}</td>
                      <td className="px-6 py-4 text-[15px] text-right text-[#5f6368]">{p.availableUnits}</td>
                      <td className="px-6 py-4 text-[15px] text-right text-[#5f6368]">{p.totalUnits}</td>
                      <td className="px-6 py-4 text-[15px] text-right font-medium text-[#188038]">{propertyInquiries}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Which partner agents actually drive traffic and leads — per development. */}
      <ReferralTrafficPanel side="developer" />
      {/* Signed-in customers quietly browsing — one tap files them as leads. */}
      <InterestedVisitorsPanel side="developer" />
    </div>
  );
}
