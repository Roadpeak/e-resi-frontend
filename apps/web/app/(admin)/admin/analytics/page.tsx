'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { adminOpsApi } from '../../../../lib/api/admin';
import { cn } from '../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const STEPS = [
  { key: 'views', label: 'Page views', icon: 'visibility', tone: 'bg-[#1a73e8]' },
  { key: 'inquiries', label: 'Inquiries', icon: 'forum', tone: 'bg-[#188038]' },
  { key: 'bookings', label: 'Viewings booked', icon: 'event', tone: 'bg-[#b06000]' },
  { key: 'reservations', label: 'Reservations', icon: 'vpn_key', tone: 'bg-[#8430ce]' },
] as const;

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-funnel', days],
    queryFn: () => adminOpsApi.funnel(days),
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <MaterialIcon name="progress_activity" size={30} className="animate-spin text-[#80868b]" />
      </div>
    );
  }

  const top = data.funnel.views || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Analytics</h1>
          <p className="text-[14px] text-[#5f6368]">How interest turns into commitment.</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer',
                days === d
                  ? 'bg-[#202124] text-white'
                  : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]',
              )}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Funnel — each bar is proportional to views, so drop-off is visible */}
      <section className={cardCls}>
        <h2 className="mb-4 text-[18px] font-normal text-[#202124]">Conversion funnel</h2>
        <div className="space-y-3">
          {STEPS.map((s) => {
            const value = data.funnel[s.key];
            const pct = (value / top) * 100;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <MaterialIcon name={s.icon} size={18} className="shrink-0 text-[#5f6368]" />
                <span className="w-32 shrink-0 text-[13px] text-[#5f6368]">{s.label}</span>
                <span className="h-6 flex-1 overflow-hidden rounded-full bg-[#f1f3f4]">
                  <span
                    className={cn('block h-full rounded-full transition-all', s.tone)}
                    style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%` }}
                  />
                </span>
                <span className="w-20 shrink-0 text-right text-[15px] font-medium text-[#202124]">
                  {value.toLocaleString()}
                </span>
                <span className="w-14 shrink-0 text-right text-[12px] text-[#80868b]">
                  {s.key === 'views' ? '' : `${pct.toFixed(1)}%`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Most-viewed */}
      <section className={cardCls}>
        <h2 className="mb-3 text-[18px] font-normal text-[#202124]">Most-viewed properties</h2>
        {data.topProperties.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-[#80868b]">
            No page views recorded in this window.
          </p>
        ) : (
          <ul className="divide-y divide-[#f1f3f4]">
            {data.topProperties.map((t, i) => (
              <li key={t.property?.slug ?? i} className="flex items-center gap-3 py-2.5">
                <span className="w-6 text-[13px] text-[#80868b]">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  {t.property ? (
                    <Link
                      href={`/${t.property.slug}`}
                      className="block truncate text-[14px] font-medium text-[#1a73e8] hover:underline"
                    >
                      {t.property.name}
                    </Link>
                  ) : (
                    <span className="text-[14px] text-[#5f6368]">Removed property</span>
                  )}
                  <span className="block truncate text-[12px] text-[#80868b]">
                    {t.property?.developer?.companyName ?? '—'}
                  </span>
                </span>
                <span className="text-[14px] font-medium text-[#202124]">
                  {t.views.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
