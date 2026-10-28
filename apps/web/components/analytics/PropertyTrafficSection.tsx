'use client';

import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { trafficApi, type TrafficRow } from '../../lib/api/traffic';
import {
  BarList, Stat, Trend, ago, cardCls, countryName, duration, flag, place,
} from './TrafficWidgets';

const DEVICE_ICON: Record<string, string> = { desktop: 'computer', mobile: 'smartphone', tablet: 'tablet' };

/** Turn referrer hosts into the names developers know. */
function sourceName(label: string | null) {
  if (!label || label === 'Direct') return 'Direct / typed or shared link';
  const h = label.toLowerCase();
  if (/(^|\.)whatsapp\.(com|net)$|^wa\.me$/.test(h)) return 'WhatsApp';
  if (/facebook\.com$|^fb\.me$/.test(h)) return 'Facebook';
  if (/instagram\.com$/.test(h)) return 'Instagram';
  if (/(^|\.)google\./.test(h)) return 'Google';
  if (/^t\.co$|(^|\.)x\.com$|twitter\.com$/.test(h)) return 'X (Twitter)';
  if (/linkedin\.com$|^lnkd\.in$/.test(h)) return 'LinkedIn';
  if (/tiktok\.com$/.test(h)) return 'TikTok';
  if (/youtube\.com$|^youtu\.be$/.test(h)) return 'YouTube';
  if (/bing\.com$/.test(h)) return 'Bing';
  if (/e-resi\.com$/.test(h)) return 'e-resi marketplace';
  return label;
}

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

/**
 * Who visits one development — guests and signed-in buyers alike, on every
 * address it is served on: where they are, what they use, how they found it.
 */
export function PropertyTrafficSection({ slug, days }: { slug: string; days: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['property-traffic', slug, days],
    queryFn: () => trafficApi.property(slug, days),
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <MaterialIcon name="progress_activity" size={24} className="animate-spin text-[#80868b]" />
      </div>
    );
  }
  if (!data) return null;

  const t = data.totals;
  if (t.views === 0) {
    return (
      <section className={cardCls}>
        <h2 className="text-[18px] font-normal text-[#202124]">Visitors</h2>
        <p className="mt-1 text-[14px] text-[#5f6368]">
          No visits in this period yet. Every visit is counted here — signed in or not, on e-resi.com,
          your e-resi address or your own domain.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-normal text-[#202124]">Visitors</h2>
        <p className="text-[14px] text-[#5f6368]">
          Everyone who opened this development — signed in or not — on any of its addresses.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="visibility" label="Page views" value={t.views.toLocaleString()} hint={`${t.sessions.toLocaleString()} visits`} />
        <Stat
          icon="group"
          label="Unique visitors"
          value={t.visitors.toLocaleString()}
          hint={`${t.newVisitors.toLocaleString()} new · ${t.returningVisitors.toLocaleString()} returning`}
        />
        <Stat
          icon="person_outline"
          label="Guests (not signed in)"
          value={t.guestVisitors.toLocaleString()}
          hint={`${pct(t.guestVisitors, t.visitors)}% of visitors · ${t.signedInVisitors.toLocaleString()} signed in`}
        />
        <Stat
          icon="schedule"
          label="Avg. time on page"
          value={duration(t.avgTimeOnPageMs)}
          hint={`${Math.round(t.bounceRate * 100)}% left after one page`}
        />
      </div>

      {/* Guests vs signed-in at a glance */}
      <section className={cardCls}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#5f6368]">
          <span>Guests vs signed-in visitors</span>
          <span className="tabular-nums">
            <span className="text-[#202124]">{t.guestVisitors.toLocaleString()}</span> guests ·{' '}
            <span className="text-[#202124]">{t.signedInVisitors.toLocaleString()}</span> signed in
          </span>
        </div>
        <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-[#e8eaed]">
          <div className="bg-[#1a73e8]" style={{ width: `${pct(t.guestVisitors, t.visitors)}%` }} />
          <div className="bg-[#34a853]" style={{ width: `${pct(t.signedInVisitors, t.visitors)}%` }} />
        </div>
      </section>

      <Trend series={data.series} hourly={data.days === 1} />

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList
          title="Countries"
          rows={data.countries}
          render={(r) => (
            <span className="flex items-center gap-2"><span>{flag(r.label)}</span>{countryName(r.label)}</span>
          )}
        />
        <BarList
          title="Cities"
          rows={data.cities}
          render={(r) => (
            <span className="flex items-center gap-2"><span>{flag(r.country)}</span>{r.label}</span>
          )}
          empty="City-level location isn't available for these visits."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList
          title="How they found it"
          rows={data.sources}
          hint="link source · views · visitors"
          render={(r) => sourceName(r.label)}
        />
        <BarList
          title="Address they used"
          rows={data.addresses}
          mono
          hint="e-resi link, e-resi address or your domain"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BarList
          title="Devices"
          rows={data.devices}
          render={(r) => (
            <span className="flex items-center gap-2 capitalize">
              <MaterialIcon name={DEVICE_ICON[r.label ?? ''] ?? 'devices'} size={15} className="text-[#5f6368]" />
              {r.label ?? 'Unknown'}
            </span>
          )}
        />
        <BarList title="Browsers" rows={data.browsers} />
        <BarList title="Operating systems" rows={data.os} />
      </div>

      <BarList title="What they looked at" rows={data.pages as TrafficRow[]} />

      <section className={cardCls}>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[16px] font-medium text-[#202124]">Recent visits</h2>
          <span className="text-[12px] text-[#80868b]">latest {data.recent.length}</span>
        </div>
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e8eaed] text-[12px] text-[#80868b]">
                <th className="px-5 py-2 font-normal">When</th>
                <th className="px-3 py-2 font-normal">Where</th>
                <th className="px-3 py-2 font-normal">Device</th>
                <th className="px-3 py-2 font-normal">Page</th>
                <th className="px-3 py-2 font-normal">From</th>
                <th className="px-3 py-2 font-normal">Visitor</th>
                <th className="px-5 py-2 text-right font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((v, i) => (
                <tr key={i} className="border-b border-[#f1f3f4] last:border-0">
                  <td className="whitespace-nowrap px-5 py-2.5 text-[#5f6368]">{ago(v.at)}</td>
                  <td className="px-3 py-2.5 text-[#202124]">
                    <span className="mr-1.5">{flag(v.country)}</span>{place(v) || 'Unknown'}
                  </td>
                  <td className="px-3 py-2.5 text-[#3c4043]">
                    <span className="inline-flex items-center gap-1.5 capitalize">
                      <MaterialIcon name={DEVICE_ICON[v.deviceType ?? ''] ?? 'devices'} size={14} className="text-[#80868b]" />
                      {[v.deviceType, v.browser, v.os].filter(Boolean).join(' · ') || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[#3c4043]">{v.page}</td>
                  <td className="px-3 py-2.5 text-[#3c4043]">{sourceName(v.source)}</td>
                  <td className="px-3 py-2.5">
                    <span className={v.signedIn
                      ? 'rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[12px] text-[#188038]'
                      : 'rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[12px] text-[#5f6368]'}
                    >
                      {v.signedIn ? 'Signed in' : 'Guest'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right tabular-nums text-[#5f6368]">{duration(v.durationMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
