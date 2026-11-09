'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Loader2, MessageCircle, Phone, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { rentListingsApi, type RentalStats as Stats } from '../../lib/api/rent-listings';

/**
 * How one rental is doing: visits by day, who came, where from, how many
 * tapped WhatsApp or call, and the leads it produced.
 */

const SOURCE: Record<string, string> = {
  direct: 'Direct', whatsapp: 'WhatsApp', facebook: 'Facebook', instagram: 'Instagram',
  google: 'Google', twitter: 'X', linkedin: 'LinkedIn', email: 'Email', 'e-resi': 'e-resi',
};

const waLink = (p: string) => `https://wa.me/${p.replace(/[^\d]/g, '').replace(/^0/, '254')}`;

export function RentalStats({ id }: { id: string }) {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ['rent-listing-stats', id, days],
    queryFn: () => rentListingsApi.stats(id, days),
  });

  return (
    <section className="rounded-3xl border border-[#dadce0] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f3f4] px-6 py-4">
        <div>
          <h2 className="text-[18px] font-normal text-[#202124]">Visits & leads</h2>
          <p className="text-[13.5px] text-[#5f6368]">Who opened this rental and what they did.</p>
        </div>
        <div className="flex rounded-full bg-[#f1f3f4] p-1">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={cn('rounded-full px-3.5 py-1 text-[13px] font-medium', days === d ? 'bg-white text-[#202124] shadow-sm' : 'text-[#5f6368]')}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex h-48 items-center justify-center"><Loader2 size={20} className="animate-spin text-[#80868b]" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-px bg-[#f1f3f4] sm:grid-cols-3 lg:grid-cols-6">
            <Tile icon={<Eye size={15} />} label="Page visits" value={data.totals.views} />
            <Tile icon={<Users size={15} />} label="Visitors" value={data.totals.visitors} sub={data.totals.signedInVisitors ? `${data.totals.signedInVisitors} signed in` : undefined} />
            <Tile icon={<MessageCircle size={15} />} label="WhatsApp taps" value={data.totals.whatsapp} />
            <Tile icon={<Phone size={15} />} label="Call taps" value={data.totals.calls} />
            <Tile label="Enquiries" value={data.totals.enquiries} />
            <Tile label="Viewing requests" value={data.totals.viewings} sub={data.totals.reservations ? `${data.totals.reservations} reserved` : undefined} />
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_240px]">
            <VisitsChart daily={data.daily} />
            <div>
              <p className="mb-3 text-[13px] font-medium text-[#5f6368]">Where visitors came from</p>
              {data.sources.length === 0 ? (
                <p className="text-[13.5px] text-[#80868b]">No visits yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.sources.slice(0, 6).map((s) => (
                    <li key={s.source}>
                      <div className="flex justify-between text-[13.5px]">
                        <span className="text-[#202124]">{SOURCE[s.source] ?? s.source}</span>
                        <span className="text-[#5f6368]">{s.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-[#f1f3f4]">
                        <div className="h-full rounded-full bg-[#1a73e8]" style={{ width: `${(s.count / data.sources[0].count) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="border-t border-[#f1f3f4] px-6 py-4">
            <p className="mb-2 text-[13px] font-medium text-[#5f6368]">Latest leads from this rental</p>
            {data.leads.length === 0 ? (
              <p className="py-3 text-[13.5px] text-[#80868b]">No enquiries or viewing requests yet.</p>
            ) : (
              <ul className="divide-y divide-[#f1f3f4]">
                {data.leads.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium', l.kind === 'VIEWING' ? 'bg-[#e8f0fe] text-[#1967d2]' : 'bg-[#f1f3f4] text-[#3c4043]')}>
                      {l.kind === 'VIEWING' ? 'Viewing' : 'Enquiry'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-medium text-[#202124]">{l.name}</p>
                      <p className="truncate text-[13px] text-[#5f6368]">{[l.note, l.email].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span className="text-[12.5px] text-[#80868b]">{new Date(l.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    {l.phone && (
                      <span className="flex gap-1">
                        <a href={`tel:${l.phone}`} aria-label="Call" className="rounded-full border border-[#dadce0] p-1.5 text-[#5f6368] hover:bg-[#f8f9fa]"><Phone size={13} /></a>
                        <a href={waLink(l.phone)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="rounded-full border border-[#dadce0] p-1.5 text-[#188038] hover:bg-[#f8f9fa]"><MessageCircle size={13} /></a>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Tile({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="flex items-center gap-1.5 text-[12.5px] text-[#5f6368]">{icon}{label}</p>
      <p className="mt-1 text-[24px] font-normal text-[#202124]">{value.toLocaleString()}</p>
      {sub && <p className="text-[12px] text-[#80868b]">{sub}</p>}
    </div>
  );
}

/** Daily visits — one series, thin bars on a quiet baseline, a tooltip per day. */
function VisitsChart({ daily }: { daily: Stats['daily'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.views));
  const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const h = hover !== null ? daily[hover] : null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-[13px] font-medium text-[#5f6368]">Visits per day</p>
        <p className="text-[12.5px] text-[#80868b]">peak {max}</p>
      </div>
      <div className="relative">
        {h && (
          <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[#202124] px-2.5 py-1.5 text-[12px] text-white shadow"
            style={{ left: `${((hover! + 0.5) / daily.length) * 100}%` }}>
            <p className="font-medium">{fmt(h.date)}</p>
            <p>{h.views} visit{h.views === 1 ? '' : 's'}{h.leads ? ` · ${h.leads} lead${h.leads === 1 ? '' : 's'}` : ''}</p>
          </div>
        )}
        <div className="flex h-40 items-end gap-[2px] border-b border-[#e8eaed]" onMouseLeave={() => setHover(null)} role="img"
          aria-label={`Visits per day over ${daily.length} days, peak ${max}`}>
          {daily.map((d, i) => (
            <div key={d.date} className="flex h-full flex-1 cursor-default items-end" onMouseEnter={() => setHover(i)}>
              <div className={cn('w-full rounded-t-[4px] transition-colors', hover === i ? 'bg-[#1557b0]' : 'bg-[#1a73e8]')}
                style={{ height: d.views ? `${Math.max(3, (d.views / max) * 100)}%` : '0%' }} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[11.5px] text-[#80868b]">
          <span>{fmt(daily[0].date)}</span>
          <span>{fmt(daily[daily.length - 1].date)}</span>
        </div>
      </div>
    </div>
  );
}
