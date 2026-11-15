'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2, Plus } from 'lucide-react';
import { money, serviceRequestsApi, STATUS_LABEL, STATUS_STYLE } from '../../lib/api/service-requests';
import { cn } from '../../lib/utils';

export function ServiceRequestList({ basePath = '/services/requests' }: { basePath?: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['service-requests'], queryFn: () => serviceRequestsApi.mine() });

  return (
    <div className="font-google">
      <div className="mb-6 flex justify-end">
        <Link href="/services#request" className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1765cc]">
          <Plus size={16} /> New request
        </Link>
      </div>
      {isLoading && <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#5f6368]" /></div>}
      {data && data.length === 0 && (
        <div className="rounded-[28px] bg-white px-8 py-14 text-center">
          <p className="text-[18px] font-semibold text-[#202124]">No requests yet</p>
          <p className="mt-2 text-[15px] text-[#5f6368]">Tell us what you want produced and we’ll send you a quote within an hour.</p>
        </div>
      )}
      <div className="space-y-3">
        {data?.map((r) => (
          <Link key={r.id} href={`${basePath}/${r.id}`} className="flex items-center gap-4 rounded-[22px] bg-white px-5 py-4 transition hover:shadow-[0_2px_10px_rgba(16,26,58,0.08)] sm:px-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-semibold text-[#202124]">{r.number}</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium', STATUS_STYLE[r.status])}>{STATUS_LABEL[r.status]}</span>
              </div>
              <p className="mt-1 truncate text-[14px] text-[#5f6368]">
                {r.location} · {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            {r.quoteTotal != null && r.quoteCurrency && (
              <span className="hidden text-[15px] font-semibold tabular-nums text-[#202124] sm:block">{money(r.quoteTotal, r.quoteCurrency)}</span>
            )}
            <ChevronRight size={18} className="shrink-0 text-[#9aa0a6]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
