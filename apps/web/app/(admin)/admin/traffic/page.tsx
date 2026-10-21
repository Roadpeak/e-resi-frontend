'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import {
  trafficApi, type SiteVisit, type TrafficRow, type TrafficUser, type VisitFilters,
} from '../../../../lib/api/traffic';
import { cn } from '../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';
const inputCls =
  'rounded-full border border-[#dadce0] bg-white px-3.5 py-1.5 text-[13px] text-[#202124] outline-none focus:border-[#1a73e8]';

const RANGES = [
  { days: 1, label: '24 hours' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

const DEVICE_ICON: Record<string, string> = { desktop: 'computer', mobile: 'smartphone', tablet: 'tablet' };

// ── Formatting ──────────────────────────────────────────────────────────────

const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

function countryName(code?: string | null) {
  if (!code) return 'Unknown';
  try { return regionNames?.of(code) ?? code; } catch { return code; }
}

function flag(code?: string | null) {
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

function place(v: { city?: string | null; country?: string | null }) {
  return [v.city, countryName(v.country) === 'Unknown' && v.city ? null : countryName(v.country)]
    .filter(Boolean).join(', ');
}

function duration(ms?: number | null) {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function ago(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function stamp(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const who = (u?: TrafficUser | null) => (u ? `${u.firstName} ${u.lastName}`.trim() || u.email : null);

// ── Page ────────────────────────────────────────────────────────────────────

/**
 * Every page view on the site, signed in or not: how many, from where, on
 * what device, and each visitor's trail. Location is Cloudflare's lookup of
 * the visitor's IP; device and browser come from the user agent.
 */
export default function AdminTraffic() {
  const [days, setDays] = useState(7);
  const [visitor, setVisitor] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-traffic', days],
    queryFn: () => trafficApi.overview(days),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Traffic</h1>
          <p className="text-[14px] text-[#5f6368]">
            Everyone visiting e-resi — where they come from, what they use and where they go.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                'cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                days === r.days
                  ? 'bg-[#202124] text-white'
                  : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex h-64 items-center justify-center">
          <MaterialIcon name="progress_activity" size={30} className="animate-spin text-[#80868b]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Page views" value={data.totals.views.toLocaleString()} icon="visibility" />
            <Stat label="Unique visitors" value={data.totals.visitors.toLocaleString()} icon="group" />
            <Stat
              label="Signed in · anonymous"
              value={`${data.totals.signedInVisitors.toLocaleString()} · ${data.totals.anonymousVisitors.toLocaleString()}`}
              hint={`${data.totals.signedInUsers.toLocaleString()} distinct accounts`}
              icon="badge"
            />
            <Stat
              label="On the site now"
              value={data.totals.liveNow.toLocaleString()}
              hint="Active in the last 5 minutes"
              icon="radio_button_checked"
              live
            />
            <Stat label="Sessions" value={data.totals.sessions.toLocaleString()} icon="timeline" />
            <Stat
              label="Pages per session"
              value={data.totals.sessions ? (data.totals.views / data.totals.sessions).toFixed(1) : '—'}
              icon="layers"
            />
            <Stat
              label="Bounce rate"
              value={`${Math.round(data.totals.bounceRate * 100)}%`}
              hint="Sessions that saw one page"
              icon="logout"
            />
            <Stat label="Avg. time on page" value={duration(data.totals.avgTimeOnPageMs)} icon="schedule" />
          </div>

          <Trend series={data.series} hourly={data.days === 1} />

          <LiveNow />

          <div className="grid gap-4 lg:grid-cols-2">
            <BarList title="Top pages" rows={data.pages} mono />
            <BarList title="Traffic sources" rows={data.sources} hint="UTM source, else referring site" />
            <BarList
              title="Countries"
              rows={data.countries}
              render={(r) => (
                <span className="flex items-center gap-2">
                  <span>{flag(r.label)}</span>
                  {countryName(r.label)}
                </span>
              )}
            />
            <BarList
              title="Cities"
              rows={data.cities}
              render={(r) => (
                <span className="flex items-center gap-2">
                  <span>{flag(r.country)}</span>
                  {r.label}
                </span>
              )}
              empty="City data appears once Cloudflare's visitor location headers are on."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <BarList
              title="Devices"
              rows={data.devices}
              render={(r) => (
                <span className="flex items-center gap-2 capitalize">
                  <MaterialIcon name={DEVICE_ICON[r.label ?? ''] ?? 'devices'} size={16} className="text-[#5f6368]" />
                  {r.label}
                </span>
              )}
            />
            <BarList title="Operating systems" rows={data.os} />
            <BarList title="Browsers" rows={data.browsers} />
          </div>

          <VisitFeed days={days} onVisitor={setVisitor} />
        </>
      )}

      {visitor && <VisitorDrawer visitorId={visitor} onClose={() => setVisitor(null)} />}
    </div>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────────

function Stat({
  label, value, hint, icon, live,
}: { label: string; value: string; hint?: string; icon: string; live?: boolean }) {
  return (
    <div className={cardCls}>
      <div className="flex items-center gap-2 text-[13px] text-[#5f6368]">
        {live ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34a853] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#34a853]" />
          </span>
        ) : (
          <MaterialIcon name={icon} size={16} />
        )}
        {label}
      </div>
      <p className="mt-2 text-[24px] font-normal text-[#202124]">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-[#80868b]">{hint}</p>}
    </div>
  );
}

function Trend({ series, hourly }: { series: { t: string; views: number; visitors: number }[]; hourly: boolean }) {
  const max = Math.max(1, ...series.map((s) => s.views));
  return (
    <section className={cardCls}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[18px] font-normal text-[#202124]">Visits over time</h2>
        <div className="flex gap-4 text-[12px] text-[#5f6368]">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#c6dafc]" />Page views</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#1a73e8]" />Visitors</span>
        </div>
      </div>
      {series.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-[#80868b]">No visits recorded in this window yet.</p>
      ) : (
        <div className="flex h-44 items-end gap-[3px]">
          {series.map((s) => (
            <div
              key={s.t}
              className="group relative flex h-full min-w-0 flex-1 items-end"
              title={`${new Date(s.t).toLocaleString('en-GB', hourly
                ? { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }
                : { day: 'numeric', month: 'short' })} — ${s.views} views, ${s.visitors} visitors`}
            >
              <div className="relative w-full rounded-t bg-[#c6dafc]" style={{ height: `${(s.views / max) * 100}%` }}>
                <div
                  className="absolute bottom-0 w-full rounded-t bg-[#1a73e8]"
                  style={{ height: `${s.views ? (s.visitors / s.views) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {series.length > 0 && (
        <div className="mt-2 flex justify-between text-[11px] text-[#80868b]">
          <span>{stamp(series[0].t)}</span>
          <span>{stamp(series[series.length - 1].t)}</span>
        </div>
      )}
    </section>
  );
}

function BarList({
  title, rows, hint, mono, render, empty,
}: {
  title: string;
  rows: TrafficRow[];
  hint?: string;
  mono?: boolean;
  render?: (r: TrafficRow) => React.ReactNode;
  empty?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <section className={cardCls}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-[16px] font-medium text-[#202124]">{title}</h2>
        <span className="text-[12px] text-[#80868b]">{hint ?? 'views · visitors'}</span>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[#80868b]">{empty ?? 'Nothing yet.'}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={`${r.label}-${i}`} className="relative overflow-hidden rounded-lg">
              <span className="absolute inset-y-0 left-0 bg-[#e8f0fe]" style={{ width: `${(r.views / max) * 100}%` }} />
              <span className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-[13px]">
                <span className={cn('min-w-0 truncate text-[#202124]', mono && 'font-mono text-[12.5px]')}>
                  {render ? render(r) : r.label ?? 'Unknown'}
                </span>
                <span className="shrink-0 tabular-nums text-[#5f6368]">
                  <span className="font-medium text-[#202124]">{r.views.toLocaleString()}</span>
                  {' · '}
                  {r.visitors.toLocaleString()}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LiveNow() {
  const { data } = useQuery({
    queryKey: ['admin-traffic-live'],
    queryFn: () => trafficApi.live(),
    refetchInterval: 15_000,
  });
  const rows = data?.rows ?? [];
  return (
    <section className={cardCls}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[18px] font-normal text-[#202124]">Live now</h2>
        <span className="text-[12px] text-[#80868b]">Refreshes every 15 seconds</span>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[#80868b]">Nobody on the site in the last 5 minutes.</p>
      ) : (
        <ul className="divide-y divide-[#f1f3f4]">
          {rows.map((r) => (
            <li key={r.visitorId} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-[13px]">
              <span className="flex w-40 items-center gap-2 truncate text-[#202124]">
                <MaterialIcon name={DEVICE_ICON[r.deviceType] ?? 'devices'} size={16} className="text-[#5f6368]" />
                {who(r.user) ?? <span className="text-[#80868b]">Anonymous</span>}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-[#1a73e8]">{r.path}</span>
              <span className="text-[#5f6368]">{flag(r.country)} {place(r)}</span>
              <span className="w-16 text-right text-[#80868b]">{ago(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function VisitFeed({ days, onVisitor }: { days: number; onVisitor: (id: string) => void }) {
  const [filters, setFilters] = useState<Omit<VisitFilters, 'days'>>({ page: 1, audience: '' });
  const [pathInput, setPathInput] = useState('');

  // Debounce the path search so each keystroke isn't a request.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, path: pathInput.trim() || undefined, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [pathInput]);

  const { data, isFetching } = useQuery({
    queryKey: ['admin-traffic-visits', days, filters],
    queryFn: () => trafficApi.visits({ days, ...filters }),
    placeholderData: (prev) => prev,
  });
  const set = (patch: Partial<VisitFilters>) => setFilters((f) => ({ ...f, ...patch, page: 1 }));
  const page = filters.page ?? 1;

  return (
    <section className={cardCls}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-normal text-[#202124]">
          Every visit
          {data && <span className="ml-2 text-[14px] text-[#80868b]">{data.meta.total.toLocaleString()}</span>}
          {isFetching && <MaterialIcon name="progress_activity" size={16} className="ml-2 inline animate-spin text-[#80868b]" />}
        </h2>
        <div className="flex flex-wrap gap-2">
          <select value={filters.audience} onChange={(e) => set({ audience: e.target.value as VisitFilters['audience'] })} className={inputCls}>
            <option value="">Everyone</option>
            <option value="signed">Signed in</option>
            <option value="anonymous">Anonymous</option>
          </select>
          <select value={filters.deviceType ?? ''} onChange={(e) => set({ deviceType: e.target.value || undefined })} className={inputCls}>
            <option value="">All devices</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
          </select>
          <input
            value={filters.country ?? ''}
            onChange={(e) => set({ country: e.target.value.slice(0, 2).toUpperCase() || undefined })}
            placeholder="Country (KE)"
            className={cn(inputCls, 'w-28')}
          />
          <input value={pathInput} onChange={(e) => setPathInput(e.target.value)} placeholder="Page contains…" className={cn(inputCls, 'w-40')} />
        </div>
      </div>

      {!data || data.data.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-[#80868b]">No visits match.</p>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="text-[12px] text-[#80868b]">
              <tr className="border-b border-[#f1f3f4]">
                <th className="py-2 pr-3 font-medium">When</th>
                <th className="py-2 pr-3 font-medium">Visitor</th>
                <th className="py-2 pr-3 font-medium">Page</th>
                <th className="py-2 pr-3 font-medium">Location</th>
                <th className="py-2 pr-3 font-medium">Device</th>
                <th className="py-2 pr-3 font-medium">Source</th>
                <th className="py-2 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {data.data.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => onVisitor(v.visitorId)}
                  className="cursor-pointer transition-colors hover:bg-[#f8f9fa]"
                >
                  <td className="whitespace-nowrap py-2 pr-3 text-[#5f6368]">{stamp(v.createdAt)}</td>
                  <td className="max-w-[180px] truncate py-2 pr-3">
                    {v.user ? (
                      <span className="text-[#202124]">{who(v.user)}</span>
                    ) : (
                      <span className="text-[#80868b]">Anonymous · {v.visitorId.slice(0, 6)}</span>
                    )}
                  </td>
                  <td className="max-w-[220px] truncate py-2 pr-3 font-mono text-[12.5px] text-[#1a73e8]">{v.path}</td>
                  <td className="whitespace-nowrap py-2 pr-3 text-[#3c4043]">{flag(v.country)} {place(v) || 'Unknown'}</td>
                  <td className="whitespace-nowrap py-2 pr-3 text-[#3c4043]">
                    <span className="inline-flex items-center gap-1.5">
                      <MaterialIcon name={DEVICE_ICON[v.deviceType] ?? 'devices'} size={15} className="text-[#5f6368]" />
                      {[v.os, v.browser].filter(Boolean).join(' · ') || v.deviceType}
                    </span>
                  </td>
                  <td className="max-w-[140px] truncate py-2 pr-3 text-[#5f6368]">{sourceOf(v)}</td>
                  <td className="py-2 text-right tabular-nums text-[#5f6368]">{duration(v.durationMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-[13px] text-[#5f6368]">
          <button
            disabled={page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: page - 1 }))}
            className="cursor-pointer rounded-full border border-[#dadce0] px-3 py-1 disabled:cursor-default disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {page} of {data.meta.totalPages}</span>
          <button
            disabled={page >= data.meta.totalPages}
            onClick={() => setFilters((f) => ({ ...f, page: page + 1 }))}
            className="cursor-pointer rounded-full border border-[#dadce0] px-3 py-1 disabled:cursor-default disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}

function sourceOf(v: SiteVisit) {
  if (v.utmSource) return [v.utmSource, v.utmMedium].filter(Boolean).join(' / ');
  return v.referrerHost ?? (v.referrer ? 'Internal' : '—');
}

function VisitorDrawer({ visitorId, onClose }: { visitorId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-traffic-visitor', visitorId],
    queryFn: () => trafficApi.visitor(visitorId),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Group the trail by session so separate visits read as separate stories.
  const sessions: SiteVisit[][] = [];
  for (const v of data?.visits ?? []) {
    const last = sessions[sessions.length - 1];
    if (last && last[0].sessionId === v.sessionId) last.push(v);
    else sessions.push([v]);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[20px] font-normal text-[#202124]">
              {who(data?.user) ?? 'Anonymous visitor'}
            </h2>
            <p className="truncate text-[13px] text-[#80868b]">
              {data?.user?.email ?? `ID ${visitorId.slice(0, 13)}`}
              {data?.user?.role ? ` · ${data.user.role.toLowerCase()}` : ''}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]">
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="flex h-40 items-center justify-center">
            <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <Fact label="Location" value={`${flag(data.location.country)} ${[data.location.city, data.location.region, countryName(data.location.country)].filter(Boolean).join(', ')}`} />
              <Fact label="IP address" value={data.location.ip ?? '—'} />
              <Fact label="Device" value={[data.device.deviceType, data.device.os, data.device.browser].filter(Boolean).join(' · ')} />
              <Fact label="Screen" value={data.device.screen ?? '—'} />
              <Fact label="First seen" value={stamp(data.firstSeen)} />
              <Fact label="Last seen" value={ago(data.lastSeen)} />
              <Fact label="Visits · pages" value={`${data.sessions} · ${data.views}`} />
              <Fact label="Came from" value={data.firstReferrer ? hostOf(data.firstReferrer) : 'Direct'} />
            </dl>

            <h3 className="mb-2 mt-6 text-[14px] font-medium text-[#202124]">Journey</h3>
            <div className="space-y-4">
              {[...sessions].reverse().map((s) => (
                <div key={s[0].sessionId} className="rounded-2xl border border-[#f1f3f4] p-3">
                  <p className="mb-2 text-[12px] text-[#80868b]">
                    {stamp(s[0].createdAt)} · {s.length} page{s.length === 1 ? '' : 's'}
                    {s[0].referrerHost ? ` · from ${s[0].referrerHost}` : ''}
                  </p>
                  <ol className="space-y-1">
                    {s.map((v) => (
                      <li key={v.id} className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="min-w-0 truncate font-mono text-[12.5px] text-[#1a73e8]">{v.path}</span>
                        <span className="shrink-0 tabular-nums text-[#80868b]">{duration(v.durationMs)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f8f9fa] px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-[#80868b]">{label}</dt>
      <dd className="mt-0.5 truncate text-[#202124]">{value}</dd>
    </div>
  );
}

function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}
