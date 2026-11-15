'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Clock, Loader2, Search } from 'lucide-react';
import {
  money, serviceRequestsApi, STATUS_LABEL, STATUS_STYLE, type ServiceRequestStatus,
} from '../../../../lib/api/service-requests';
import { cn } from '../../../../lib/utils';

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'SUBMITTED', label: 'Needs quote' },
  { key: 'CHANGES_REQUESTED', label: 'Changes requested' },
  { key: 'QUOTED', label: 'Quoted' },
  { key: 'ACCEPTED', label: 'Awaiting payment' },
  { key: 'PAID', label: 'Paid' },
  { key: 'IN_PRODUCTION', label: 'In production' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const NEEDS_QUOTE: ServiceRequestStatus[] = ['SUBMITTED', 'CHANGES_REQUESTED'];

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);
  return now;
}

/** Custom production requests, with the one-hour quote promise front and centre. */
export default function AdminServiceRequestsPage() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const now = useNow();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-service-requests', status, query],
    queryFn: () => serviceRequestsApi.admin.list(status, query),
    refetchInterval: 60_000,
  });
  const counts = data?.counts ?? {};
  const total = Object.values(counts).reduce((a, n) => a + (n ?? 0), 0);
  const waiting = (counts.SUBMITTED ?? 0) + (counts.CHANGES_REQUESTED ?? 0);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[26px] font-medium text-[#202124]">Service requests</h1>
        <p className="mt-1 text-[14px] text-[#5f6368]">
          Custom production jobs priced by quote. Customers are promised a quote within 1 hour of sending.
          {waiting > 0 && <span className="font-medium text-[#b06000]"> {waiting} waiting for a quote.</span>}
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const n = t.key ? counts[t.key as ServiceRequestStatus] ?? 0 : total;
            return (
              <button key={t.key} type="button" onClick={() => setStatus(t.key)}
                className={cn('rounded-full px-3.5 py-1.5 text-[13.5px] font-medium', status === t.key ? 'bg-[#e8f0fe] text-[#1967d2]' : 'text-[#5f6368] hover:bg-[#f1f3f4]')}>
                {t.label} <span className="tabular-nums opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); }} className="flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-3 py-1.5">
          <Search size={15} className="text-[#5f6368]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Number, name, email, place" className="w-56 bg-transparent text-[14px] outline-none" />
        </form>
      </div>

      {isLoading && <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#5f6368]" /></div>}
      {data && data.rows.length === 0 && <p className="rounded-3xl border border-[#dadce0] bg-white px-6 py-12 text-center text-[14px] text-[#5f6368]">No requests here.</p>}

      <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
        {data?.rows.map((r) => {
          const late = NEEDS_QUOTE.includes(r.status) && new Date(r.quoteDueBy).getTime() < now;
          const minsLeft = Math.round((new Date(r.quoteDueBy).getTime() - now) / 60_000);
          return (
            <Link key={r.id} href={`/admin/services/${r.id}`} className="flex items-center gap-4 border-b border-[#f1f3f4] px-5 py-4 last:border-0 hover:bg-[#f8f9fa]">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14.5px] font-medium text-[#202124]">{r.number}</span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium', STATUS_STYLE[r.status])}>{STATUS_LABEL[r.status]}</span>
                  {NEEDS_QUOTE.includes(r.status) && r.status === 'SUBMITTED' && (
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium', late ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-[#fef7e0] text-[#b06000]')}>
                      <Clock size={12} /> {late ? `${-minsLeft} min late` : `${minsLeft} min left`}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[13.5px] text-[#5f6368]">
                  {r.user.firstName} {r.user.lastName} · {r.requesterType.toLowerCase()} · {r.location} · {new Date(r.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {r.quoteTotal != null && r.quoteCurrency && <span className="hidden text-[14px] tabular-nums text-[#202124] sm:block">{money(r.quoteTotal, r.quoteCurrency)}</span>}
              <ChevronRight size={18} className="text-[#9aa0a6]" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
