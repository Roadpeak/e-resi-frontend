'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../../../components/dashboard/MaterialIcon';
import { analyticsApi, type MiniSiteReport } from '../../../../../../lib/api/analytics';
import { cn } from '../../../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const PERIODS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

const TOUR_LABELS: Record<string, string> = {
  CINEMATIC: 'Cinematic tour',
  '3D': '3D tour',
  VR: 'VR tour',
  UNKNOWN: 'Tour',
};

/** 95 -> "1m 35s"; keeps the unit obvious at a glance. */
function duration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

export default function MiniSiteInsights() {
  const { slug } = useParams<{ slug: string }>();
  const [days, setDays] = useState(30);

  const { data: report, isLoading } = useQuery({
    queryKey: ['mini-site-report', slug, days],
    queryFn: () => analyticsApi.miniSiteReport(slug, days),
  });

  if (isLoading) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Loading…</p>;
  }
  if (!report) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">No data for this development.</p>;
  }

  const h = report.headline;
  // Nothing recorded yet reads as a broken page unless we say otherwise —
  // and a brand-new development legitimately has no data.
  const empty = h.views === 0 && h.tourStarts === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/properties/${slug}`}
            className="inline-flex items-center gap-1 text-[13px] text-[#5f6368] transition-colors hover:text-[#202124]"
          >
            <MaterialIcon name="arrow_back" className="text-[16px]" />
            Back to development
          </Link>
          <h1 className="mt-2 text-[26px] font-normal text-[#202124]">
            {report.property.name} — insights
          </h1>
          <p className="text-[14px] text-[#5f6368]">
            How buyers are engaging with the page you share with them.
          </p>
        </div>

        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={cn(
                'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer',
                days === p.days
                  ? 'bg-[#202124] text-white'
                  : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center">
          <MaterialIcon name="insights" size={28} className="text-[#80868b]" />
          <p className="mt-2 text-[15px] text-[#5f6368]">
            Nothing recorded in this period yet.
          </p>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-[#80868b]">
            Numbers appear here as soon as people open your page. Share the link with your
            buyers and check back.
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
      ) : (
        <>
          {/* Headline — the sentence a developer repeats to their board. */}
          <section className={cardCls}>
            <p className="text-[15px] leading-relaxed text-[#202124]">
              <strong>{h.uniqueVisitors.toLocaleString()}</strong> people opened this page
              {h.tourStarts > 0 && (
                <>
                  , <strong>{h.tourStarts.toLocaleString()}</strong> started a tour
                  {h.tourCompletes > 0 && (
                    <>
                      , and <strong>{h.tourCompletes.toLocaleString()}</strong> stayed in it —
                      averaging <strong>{duration(h.averageTourSeconds)}</strong>
                    </>
                  )}
                </>
              )}
              {h.inquiries > 0 && <>. <strong>{h.inquiries}</strong> enquired</>}.
            </p>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Unique visitors" value={h.uniqueVisitors} sub={`${h.views} total views`} />
            <Stat
              label="Opened a tour"
              value={h.tourStarts}
              sub={`${h.tourOpenRate}% of visitors`}
            />
            <Stat
              label="Watched the tour"
              value={h.tourCompletes}
              sub={`${h.tourEngagementRate}% of those who opened`}
            />
            <Stat label="Enquiries" value={h.inquiries} sub={`${h.bookings} viewings booked`} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Per-tour engagement */}
            <section className={cardCls}>
              <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Tours</h2>
              <p className="mb-4 text-[13px] text-[#5f6368]">
                Which format your buyers actually use — worth knowing before commissioning
                the next one.
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
                          style={{
                            width: `${t.starts ? Math.round((t.completes / t.starts) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[12px] text-[#5f6368]">
                        {t.completes} of {t.starts} stayed past the first 30 seconds
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Traffic sources */}
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
                    const pct = h.views ? Math.round((s.visits / h.views) * 100) : 0;
                    return (
                      <li key={s.source} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-[14px] text-[#202124]">{s.source}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f1f3f4]">
                          <div className="h-full rounded-full bg-[#188038]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-20 shrink-0 text-right text-[13px] text-[#5f6368]">
                          {s.visits} · {pct}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Per-unit demand — the most directly actionable table here. */}
          <section className={cardCls}>
            <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Most-viewed units</h2>
            <p className="mb-4 text-[13px] text-[#5f6368]">
              What your sales team should be leading with.
            </p>
            {report.topUnits.length === 0 ? (
              <p className="text-[14px] text-[#5f6368]">
                No unit pages opened in this period.
              </p>
            ) : (
              <ul className="divide-y divide-[#f1f3f4]">
                {report.topUnits.map((u, i) => (
                  <li key={u.unitId} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 text-[13px] text-[#80868b]">{i + 1}</span>
                    <span className="flex-1 text-[14px] text-[#202124]">{u.name}</span>
                    <span className="text-[13px] text-[#5f6368]">
                      {u.uniqueViewers} {u.uniqueViewers === 1 ? 'person' : 'people'} · {u.views} views
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-[12px] text-[#5f6368]">
            Shares: {h.shares} · Saved by {h.saved}{' '}
            {h.saved === 1 ? 'person' : 'people'} · Period: last {report.period.days} days
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className={cardCls}>
      <p className="text-[12px] uppercase tracking-wide text-[#5f6368]">{label}</p>
      <p className="mt-1 text-[28px] font-normal text-[#202124]">{value.toLocaleString()}</p>
      {sub && <p className="text-[12px] text-[#5f6368]">{sub}</p>}
    </div>
  );
}
