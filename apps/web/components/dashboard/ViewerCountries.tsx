'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { MaterialIcon } from './MaterialIcon';
import { cn } from '../../lib/utils';

interface CountryRow { country: string; views: number; visitors: number; signedViews: number; guestViews: number }
interface CountriesResponse {
  days: number;
  totals: { views: number; visitors: number; signedViews: number; guestViews: number; unknownViews: number };
  countries: CountryRow[];
}

const PERIODS = [7, 30, 90] as const;

/** A country's flag. An image rather than an emoji: Windows shows emoji flags as two plain letters. */
function Flag({ code, name }: { code: string; name: string }) {
  const cc = code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${cc}.png`}
      srcSet={`https://flagcdn.com/w80/${cc}.png 2x`}
      width={24}
      height={18}
      alt={`${name} flag`}
      loading="lazy"
      className="h-[18px] w-6 shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
    />
  );
}

/**
 * Which countries an owner's listings are being opened from — developments,
 * rentals and (for agents) their website — with signed-in and guest views
 * shown separately. Counts only; nobody is named.
 */
export function ViewerCountries() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['viewer-countries', days],
    queryFn: () => apiClient.get<CountriesResponse>(`/traffic/mine/countries?days=${days}`),
    staleTime: 60_000,
  });

  const names = useMemo(() => {
    try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; }
  }, []);
  const nameOf = (cc: string) => names?.of(cc.toUpperCase()) ?? cc.toUpperCase();

  const rows = data?.countries ?? [];
  const top = rows[0]?.views ?? 0;
  const shown = showAll ? rows : rows.slice(0, 8);
  const totals = data?.totals;

  return (
    <section className="rounded-2xl border border-[#dadce0] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-medium text-[#202124]">
            <MaterialIcon name="public" size={19} className="text-[#1a73e8]" /> Where your listings are viewed from
          </h2>
          <p className="mt-0.5 text-[13px] text-[#5f6368]">
            Countries opening your developments, rentals and website — signed-in visitors and guests.
          </p>
        </div>
        <div className="flex rounded-full border border-[#dadce0] p-0.5" role="tablist" aria-label="Period">
          {PERIODS.map((d) => (
            <button key={d} type="button" role="tab" aria-selected={days === d} onClick={() => { setDays(d); setShowAll(false); }}
              className={cn('rounded-full px-3 py-1 text-[12.5px] font-medium', days === d ? 'bg-[#e8f0fe] text-[#1967d2]' : 'text-[#5f6368] hover:bg-[#f1f3f4]')}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {totals && totals.views > 0 && (
        <p className="mt-3 text-[13px] text-[#3c4043]">
          <span className="font-medium tabular-nums">{totals.views.toLocaleString()}</span> views from{' '}
          <span className="font-medium tabular-nums">{totals.visitors.toLocaleString()}</span> people ·{' '}
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#1a73e8]" />{totals.signedViews.toLocaleString()} signed in</span>{' '}·{' '}
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#9ec2fa]" />{totals.guestViews.toLocaleString()} guests</span>
        </p>
      )}

      <div className="mt-4">
        {isLoading && <p className="py-6 text-center text-[13px] text-[#5f6368]">Loading…</p>}
        {isError && <p className="py-6 text-center text-[13px] text-[#5f6368]">Couldn’t load viewer countries right now.</p>}
        {!isLoading && !isError && rows.length === 0 && (
          <p className="py-6 text-center text-[13px] text-[#5f6368]">No views with a known country in the last {days} days yet.</p>
        )}
        <ul className="space-y-2.5">
          {shown.map((r) => {
            const name = nameOf(r.country);
            const signedPct = r.views ? (r.signedViews / r.views) * 100 : 0;
            return (
              <li key={r.country} className="flex items-center gap-3">
                <Flag code={r.country} name={name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[14px] text-[#202124]">{name}</span>
                    <span className="shrink-0 text-[13px] tabular-nums text-[#3c4043]">
                      <span className="font-medium">{r.views.toLocaleString()}</span>
                      <span className="text-[#5f6368]"> views · {r.signedViews} signed in · {r.guestViews} guests</span>
                    </span>
                  </div>
                  {/* Bar: length = share of the top country; dark part = signed-in views. */}
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1f3f4]">
                    <div className="flex h-full rounded-full" style={{ width: `${top ? Math.max(4, (r.views / top) * 100) : 0}%` }}>
                      <span className="h-full bg-[#1a73e8]" style={{ width: `${signedPct}%` }} />
                      <span className="h-full flex-1 bg-[#9ec2fa]" />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {rows.length > 8 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 text-[13px] font-medium text-[#1a73e8] hover:underline">
            {showAll ? 'Show fewer' : `Show all ${rows.length} countries`}
          </button>
        )}
        {totals && totals.unknownViews > 0 && (
          <p className="mt-3 text-[12px] text-[#80868b]">{totals.unknownViews.toLocaleString()} views came from an unknown location and aren’t listed.</p>
        )}
      </div>
    </section>
  );
}
