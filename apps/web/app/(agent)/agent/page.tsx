'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, Handshake, MessageSquare, Star } from 'lucide-react';
import { agentsApi } from '../../../lib/api/agents';
import { partnershipsApi } from '../../../lib/api/partnerships';
import { chatApi } from '../../../lib/api/chat';
import { AgentStatusBanner } from '../../../components/agent/AgentStatusBanner';

export default function AgentOverview() {
  const { data: me } = useQuery({ queryKey: ['agent', 'me'], queryFn: () => agentsApi.me() });
  const { data: assignments } = useQuery({
    queryKey: ['agent', 'assignments', 1],
    queryFn: () => partnershipsApi.myAssignments({ limit: 5 }),
  });
  const { data: partners } = useQuery({
    queryKey: ['partnerships', 'ACTIVE'],
    queryFn: () => partnershipsApi.list({ status: 'ACTIVE', limit: 1 }),
  });
  const { data: unread } = useQuery({
    queryKey: ['chat', 'unread'],
    queryFn: () => chatApi.unreadCount(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">
          {me ? me.displayName : 'Your agency'}
        </h1>
        <p className="text-[14px] text-[#5f6368]">
          Your listings, partners and enquiries in one place.
        </p>
      </div>

      <AgentStatusBanner />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Building2 size={18} />}
          label="Assigned listings"
          value={assignments?.meta.total ?? 0}
          href="/agent/properties"
        />
        <Stat
          icon={<Handshake size={18} />}
          label="Active partners"
          value={partners?.meta.total ?? 0}
          href="/agent/partners"
        />
        <Stat
          icon={<MessageSquare size={18} />}
          label="Unread messages"
          value={unread?.count ?? 0}
          href="/agent/messages"
        />
        <Stat
          icon={<Star size={18} />}
          label="Rating"
          value={me?.ratingCount ? `${me.ratingAverage.toFixed(1)} (${me.ratingCount})` : '—'}
          href="/agent/reviews"
        />
      </div>

      <section className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-normal text-[#202124]">Recently assigned</h2>
          <Link href="/agent/properties" className="text-[14px] font-medium text-[#1a73e8] hover:text-[#1765cc]">
            View all
          </Link>
        </div>
        {!assignments?.data.length ? (
          <p className="py-6 text-center text-[14px] text-[#5f6368]">
            No properties assigned yet. Partner with a developer to start receiving listings.
          </p>
        ) : (
          <ul className="divide-y divide-[#f1f3f4]">
            {assignments.data.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-[#202124]">{a.property.name}</p>
                  <p className="truncate text-[13px] text-[#5f6368]">
                    {a.partnership.developer.companyName} · {a.property.city}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#e8f0fe] px-3 py-1 text-[13px] font-medium text-[#1967d2]">
                  {a.effectiveCommission != null ? `${a.effectiveCommission}%` : 'No rate set'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon, label, value, href,
}: {
  icon: React.ReactNode; label: string; value: number | string; href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-[#dadce0] bg-white p-5 transition-colors hover:bg-[#f8f9fa]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1967d2]">
        {icon}
      </span>
      <p className="mt-3 text-[24px] font-normal text-[#202124]">{value}</p>
      <p className="text-[13px] text-[#5f6368]">{label}</p>
    </Link>
  );
}
