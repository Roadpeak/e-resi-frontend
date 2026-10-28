'use client';

import type { ReactNode } from 'react';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { cn } from '../../lib/utils';

/** A label with view and visitor counts — the shape every breakdown returns. */
export type { TrafficRow } from '../../lib/api/traffic';
import type { TrafficRow } from '../../lib/api/traffic';

export const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

// ── Formatting ──────────────────────────────────────────────────────────────

const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

export function countryName(code?: string | null) {
  if (!code) return 'Unknown';
  try { return regionNames?.of(code) ?? code; } catch { return code; }
}

export function flag(code?: string | null) {
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export function place(v: { city?: string | null; country?: string | null }) {
  return [v.city, countryName(v.country) === 'Unknown' && v.city ? null : countryName(v.country)]
    .filter(Boolean).join(', ');
}

export function duration(ms?: number | null) {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function ago(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function stamp(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}


// ── Pieces ──────────────────────────────────────────────────────────────────

export function Stat({
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

export function Trend({ series, hourly }: { series: { t: string; views: number; visitors: number }[]; hourly: boolean }) {
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

export function BarList({
  title, rows, hint, mono, render, empty,
}: {
  title: string;
  rows: TrafficRow[];
  hint?: string;
  mono?: boolean;
  render?: (r: TrafficRow) => ReactNode;
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

