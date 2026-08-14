'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { analyticsApi, type MiniSiteReport } from '../../../../lib/api/analytics';
import { useMyProperties } from '../../../../lib/api/queries';
import { cn } from '../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const PERIODS = [7, 30, 90];

const TOUR_LABELS: Record<string, string> = {
  CINEMATIC: 'Cinematic tour',
  '3D': '3D walkthrough',
  VR: 'VR tour',
  UNKNOWN: 'Tour',
};

/** 134 → "2m 14s". Seconds alone stop being readable past a minute. */
function duration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

const pct = (value: number, of: number) => (of > 0 ? Math.round((value / of) * 100) : 0);

export default function PerformancePage() {
  const [days, setDays] = useState(30);
  const [slug, setSlug] = useState<string>('');

  const { data: propertiesData, isLoading: loadingProps } = useMyProperties({ limit: 50 });
  const properties = propertiesData?.items ?? [];

  // Default to the first development once the list arrives, so the page opens
  // on data rather than on an empty picker.
  useEffect(() => {
    if (!slug && properties.length) setSlug(properties[0].slug);
  }, [properties, slug]);

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['performance', slug, days],
    queryFn: () => analyticsApi.miniSiteReport(slug, days),
    enabled: !!slug,
  });

  if (loadingProps) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Loading…</p>;
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center">
        <MaterialIcon name="insights" size={28} className="text-[#80868b]" />
        <p className="mt-2 text-[15px] text-[#5f6368]">
          Performance appears once you have a development listed.
        </p>
        <Link
          href="/dashboard/developments/new"
          className="mt-4 inline-block rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]"
        >
          Add a development
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Performance</h1>
          <p className="text-[14px] text-[#5f6368]">
            What happens after you share a development — who arrives, what they watch,
            and who gets in touch.
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((d) => (
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

      {/* Development picker — one row of chips rather than a select, so a
          developer can see all their developments at once. */}
      {properties.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {properties.map((p) => (
            <button
              key={p.slug}
              onClick={() => setSlug(p.slug)}
              className={cn(
                'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer',
                slug === p.slug
                  ? 'border border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]'
                  : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]',
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="py-16 text-center text-[14px] text-[#5f6368]">Loading…</p>
      ) : isError || !report ? (
        <p className="py-16 text-center text-[14px] text-[#5f6368]">
          Could not load performance for this development.
        </p>
      ) : (
        <Report report={report} slug={slug} />
      )}
    </div>
  );
}

function Report({ report, slug }: { report: MiniSiteReport; slug: string }) {
  const h = report.headline;
  const empty = h.views === 0 && h.tourStarts === 0;

  if (empty) {
    return (
      <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center">
        <MaterialIcon name="query_stats" size={28} className="text-[#80868b]" />
        <p className="mt-2 text-[15px] text-[#5f6368]">Nothing recorded in this period yet.</p>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-[#80868b]">
          Numbers appear as soon as people open your page. Share the link with your buyers
          and check back.
        </p>
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-block rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]"
        >
          Open the page
        </a>
      </div>
    );
  }

  return (
    <>
      {/* The sentence a developer repeats to their board. */}
      <section className={cardCls}>
        <p className="text-[15px] leading-relaxed text-[#202124]">
          <strong>{h.uniqueVisitors.toLocaleString()}</strong> people opened this page
          {h.tourStarts > 0 && (
            <>
              , <strong>{h.tourStarts.toLocaleString()}</strong> started a tour
              {h.tourCompletes > 0 && (
                <>
                  , and <strong>{h.tourCompletes.toLocaleString()}</strong> stayed with it —
                  averaging <strong>{duration(h.averageTourSeconds)}</strong>
                </>
              )}
            </>
          )}
          {h.inquiries > 0 && <>. <strong>{h.inquiries}</strong> got in touch</>}.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Unique visitors" value={h.uniqueVisitors} sub={`${h.views} total views`} />
        <Stat label="Opened a tour" value={h.tourStarts} sub={`${h.tourOpenRate}% of visitors`} />
        <Stat label="Enquiries" value={h.inquiries} sub={`${h.shares} shares`} />
        <Stat
          label="Viewings booked"
          value={h.bookings}
          sub={`${report.bookingsByType.virtual} virtual · ${report.bookingsByType.physical} in person`}
        />
      </div>

      {/* ── Funnel ── */}
      <section className={cardCls}>
        <h2 className="mb-1 text-[16px] font-medium text-[#202124]">From visit to viewing</h2>
        <p className="mb-4 text-[13px] text-[#5f6368]">
          Each step as a share of the one above it — where people stop is where to look.
        </p>
        <ul className="space-y-3">
          {report.funnel.map((f, i) => {
            const share = pct(f.value, f.of);
            const drop = i > 0 && f.of > 0 && share < 100 ? f.of - f.value : 0;
            return (
              <li key={f.step}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14px] text-[#202124]">{f.step}</span>
                  <span className="text-[13px] text-[#5f6368]">
                    <strong className="text-[#202124]">{f.value.toLocaleString()}</strong>
                    {i > 0 && <> · {share}%</>}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#f1f3f4]">
                  <div
                    className="h-full rounded-full bg-[#1a73e8]"
                    style={{ width: `${Math.min(share, 100)}%` }}
                  />
                </div>
                {drop > 0 && i > 0 && (
                  <p className="mt-1 text-[12px] text-[#80868b]">
                    {drop.toLocaleString()} did not go further
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Tours ── */}
        <section className={cardCls}>
          <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Tour views</h2>
          <p className="mb-4 text-[13px] text-[#5f6368]">
            Which format your buyers use — worth knowing before commissioning the next one.
          </p>
          {report.tours.length === 0 ? (
            <p className="text-[14px] text-[#5f6368]">No tour activity in this period.</p>
          ) : (
            <ul className="space-y-3">
              {report.tours.map((t) => (
                <li key={t.tour}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-medium text-[#202124]">
                      {TOUR_LABELS[t.tour] ?? t.tour}
                    </span>
                    <span className="text-[13px] text-[#5f6368]">
                      {t.starts} opened · avg {duration(t.averageSeconds)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f1f3f4]">
                    <div
                      className="h-full rounded-full bg-[#1a73e8]"
                      style={{ width: `${pct(t.completes, t.starts)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[12px] text-[#5f6368]">
                    {t.completes} of {t.starts} watched past the first 30 seconds
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Sources ── */}
        <section className={cardCls}>
          <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Where visitors came from</h2>
          <p className="mb-4 text-[13px] text-[#5f6368]">
            &ldquo;Marketplace&rdquo; is traffic e-resi sent you on top of your own links.
          </p>
          {report.sources.length === 0 ? (
            <p className="text-[14px] text-[#5f6368]">No visits in this period.</p>
          ) : (
            <ul className="space-y-2.5">
              {report.sources.map((s) => {
                const share = pct(s.visits, h.views);
                return (
                  <li key={s.source} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-[14px] text-[#202124]">{s.source}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f1f3f4]">
                      <div className="h-full rounded-full bg-[#188038]" style={{ width: `${share}%` }} />
                    </div>
                    <span className="w-20 shrink-0 text-right text-[13px] text-[#5f6368]">
                      {s.visits} · {share}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Units ── */}
        <section className={cardCls}>
          <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Most-viewed units</h2>
          <p className="mb-4 text-[13px] text-[#5f6368]">
            What your sales team should lead with.
          </p>
          {report.topUnits.length === 0 ? (
            <p className="text-[14px] text-[#5f6368]">No unit pages opened in this period.</p>
          ) : (
            <ul className="divide-y divide-[#f1f3f4]">
              {report.topUnits.map((u, i) => (
                <li key={u.unitId} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 text-[13px] text-[#80868b]">{i + 1}</span>
                  <span className="flex-1 text-[14px] text-[#202124]">{u.name}</span>
                  <span className="text-[13px] text-[#5f6368]">
                    {u.uniqueViewers} {u.uniqueViewers === 1 ? 'person' : 'people'} · {u.views} views
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Agent-introduced leads ── */}
        <section className={cardCls}>
          <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Leads from your agents</h2>
          <p className="mb-4 text-[13px] text-[#5f6368]">
            Enquiries and viewings credited to a partnered agent.
          </p>
          {report.byAgent.length === 0 ? (
            <p className="text-[14px] text-[#5f6368]">
              No agent-introduced leads yet on this development.
            </p>
          ) : (
            <ul className="divide-y divide-[#f1f3f4]">
              {report.byAgent.map((a) => (
                <li key={a.agentId} className="flex items-center gap-3 py-2.5">
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-[14px] text-[#202124]">{a.name}</span>
                    <span className="text-[12px] text-[#5f6368]">
                      {a.kind === 'COMPANY' ? 'Company' : 'Individual'}
                    </span>
                  </span>
                  <span className="text-right text-[13px] text-[#5f6368]">
                    <strong className="text-[#202124]">{a.total}</strong> leads
                    <span className="block text-[12px]">
                      {a.inquiries} enquiries · {a.bookings} viewings
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-[12px] text-[#5f6368]">
        Saved by {h.saved} {h.saved === 1 ? 'person' : 'people'} · Period: last{' '}
        {report.period.days} days ·{' '}
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[#1a73e8] hover:underline"
        >
          Open the live page
        </a>
      </p>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className={cardCls}>
      <p className="text-[12px] uppercase tracking-wide text-[#5f6368]">{label}</p>
      <p className="mt-1 text-[28px] font-normal tabular-nums text-[#202124]">
        {value.toLocaleString()}
      </p>
      {sub && <p className="text-[12px] text-[#5f6368]">{sub}</p>}
    </div>
  );
}
