'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '../../../components/dashboard/MaterialIcon';
import { adminApi } from '../../../lib/api/admin';
import { cn } from '../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

function fmt(n: number) {
  return n.toLocaleString();
}

export default function AdminOverview() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: adminApi.overview,
  });
  const { data: trends } = useQuery({
    queryKey: ['admin-trends', 30],
    queryFn: () => adminApi.trends(30),
  });
  const { data: attention } = useQuery({
    queryKey: ['admin-attention'],
    queryFn: adminApi.attention,
  });

  if (isLoading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <MaterialIcon name="progress_activity" size={30} className="animate-spin text-[#80868b]" />
      </div>
    );
  }

  const stats = [
    { label: 'Users', value: fmt(overview.users.total), icon: 'group', tone: 'text-[#1a73e8]' },
    { label: 'Live properties', value: fmt(overview.properties.live), icon: 'domain', tone: 'text-[#188038]' },
    { label: 'Rent listings', value: fmt(overview.rentListings), icon: 'key', tone: 'text-[#b06000]' },
    { label: 'Active reservations', value: fmt(overview.reservations.active), icon: 'event_available', tone: 'text-[#8430ce]' },
  ];

  const queues = [
    { label: 'KYB awaiting review', value: overview.queues.kybPending, href: '/admin/developers', icon: 'verified_user' },
    { label: 'Agent KYC awaiting review', value: overview.queues.agentKycPending, href: '/admin/agents', icon: 'support_agent' },
    { label: 'Properties to approve', value: overview.queues.pendingReview, href: '/admin/properties', icon: 'fact_check' },
    { label: 'Failed payments', value: overview.queues.failedPayments, href: '/admin/billing', icon: 'credit_card_off' },
    { label: 'Open inquiries', value: overview.queues.openInquiries, href: '/admin/inquiries', icon: 'forum' },
  ];

  const peak = Math.max(1, ...(trends?.daily ?? []).map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Platform overview</h1>
        <p className="text-[14px] text-[#5f6368]">Everything happening across e-resi.</p>
      </div>

      {/* Headline counters */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cardCls}>
            <MaterialIcon name={s.icon} size={22} className={s.tone} fill />
            <p className="mt-3 text-[32px] font-normal leading-none text-[#202124]">{s.value}</p>
            <p className="mt-1.5 text-[14px] text-[#5f6368]">{s.label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Revenue + signups */}
        <section className={cardCls}>
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="text-[18px] font-normal text-[#202124]">Revenue &amp; signups</h2>
              <p className="text-[13px] text-[#5f6368]">Last 30 days</p>
            </div>
            <p className="text-[15px] font-medium text-[#202124]">
              KES {fmt(overview.revenue.collected)} collected
            </p>
          </div>
          <div className="flex h-40 items-end gap-[3px]">
            {(trends?.daily ?? []).map((d) => (
              <div key={d.date} className="group relative flex-1" title={`${d.date}: KES ${fmt(d.revenue)}, ${d.signups} signups`}>
                <div
                  className="w-full rounded-t bg-[#1a73e8] transition-colors group-hover:bg-[#1765cc]"
                  style={{ height: `${Math.max(2, (d.revenue / peak) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Users by role */}
        <section className={cardCls}>
          <h2 className="mb-4 text-[18px] font-normal text-[#202124]">Users by role</h2>
          <ul className="space-y-3">
            {Object.entries(overview.users.byRole)
              .sort((a, b) => b[1] - a[1])
              .map(([role, count]) => (
                <li key={role} className="flex items-center gap-3">
                  <span className="w-24 text-[13px] capitalize text-[#5f6368]">
                    {role.toLowerCase()}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#f1f3f4]">
                    <span
                      className="block h-full rounded-full bg-[#1a73e8]"
                      style={{ width: `${(count / Math.max(1, overview.users.total)) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-[14px] font-medium text-[#202124]">{count}</span>
                </li>
              ))}
          </ul>
        </section>
      </div>

      {/* Needs attention */}
      <section>
        <h2 className="mb-3 text-[18px] font-normal text-[#202124]">Needs attention</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {queues.map((q) => (
            <Link
              key={q.label}
              href={q.href}
              className={cn(
                cardCls,
                'group transition-shadow hover:shadow-md',
                q.value > 0 && 'border-[#f9ab00] bg-[#fffbf0]',
              )}
            >
              <MaterialIcon
                name={q.icon}
                size={20}
                className={q.value > 0 ? 'text-[#b06000]' : 'text-[#80868b]'}
              />
              <p className="mt-2 text-[28px] font-normal leading-none text-[#202124]">{q.value}</p>
              <p className="mt-1.5 text-[13px] text-[#5f6368]">{q.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Queues detail */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardCls}>
          <h2 className="mb-3 text-[18px] font-normal text-[#202124]">Developers awaiting KYB</h2>
          {attention?.kybPending.length ? (
            <ul className="divide-y divide-[#f1f3f4]">
              {attention.kybPending.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5">
                  <span className="text-[14px] text-[#202124]">{d.companyName}</span>
                  <span className="text-[12px] text-[#80868b]">
                    {d.onboardingSubmittedAt
                      ? new Date(d.onboardingSubmittedAt).toLocaleDateString()
                      : '—'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-[#80868b]">Nothing waiting.</p>
          )}
        </section>

        <section className={cardCls}>
          <h2 className="mb-3 text-[18px] font-normal text-[#202124]">Properties to approve</h2>
          {attention?.propertiesAwaitingReview.length ? (
            <ul className="divide-y divide-[#f1f3f4]">
              {attention.propertiesAwaitingReview.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] text-[#202124]">{p.name}</span>
                    <span className="block truncate text-[12px] text-[#80868b]">
                      {p.developer?.companyName ?? 'Unknown developer'}
                    </span>
                  </span>
                  <span className="text-[12px] text-[#80868b]">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-[#80868b]">Nothing waiting.</p>
          )}
        </section>
      </div>
    </div>
  );
}
