'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle, Box, Building2, Clock, Eye, Globe, Headset, LayoutGrid, LayoutTemplate, List, Loader2, MapPin, Plus, Search,
} from 'lucide-react';
import { formatPrice, getStatusLabel, cn } from '../../../../lib/utils';
import { useMyProperties } from '../../../../lib/api/queries';
import { REVIEW_CHIP, reviewStateOf } from '../../../../components/dashboard/ReviewStatus';
import { PropertyActionsMenu } from '../../../../components/dashboard/PropertyActionsMenu';

/**
 * The developer's portfolio: summary figures, search and status tabs, and
 * each development as a photo card (or a table row, for those who prefer
 * it — remembered per browser). Every card carries the same actions as the
 * table: manage, templates, domain and the full menu.
 */

const STATUS_CHIPS: Record<string, string> = {
  OFF_PLAN: 'bg-[#e8f0fe] text-[#1967d2]',
  ACTIVE: 'bg-[#e6f4ea] text-[#188038]',
  SOLD_OUT: 'bg-[#fce8e6] text-[#c5221f]',
  ARCHIVED: 'bg-[#f1f3f4] text-[#5f6368]',
};

type Filter = 'all' | 'live' | 'review' | 'changes' | 'archived';
type View = 'grid' | 'list';

type P = NonNullable<ReturnType<typeof useMyProperties>['data']>['items'][number];

const isLive = (p: P) => p.status === 'ACTIVE' || p.status === 'OFF_PLAN';

function fmtShortDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function StatusChip({ p }: { p: P }) {
  const review = reviewStateOf(p);
  if (review) return <span className={cn('whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium', REVIEW_CHIP[review].cls)}>{REVIEW_CHIP[review].label}</span>;
  return <span className={cn('whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium', STATUS_CHIPS[p.status] ?? 'bg-[#f1f3f4] text-[#5f6368]')}>{getStatusLabel(p.status)}</span>;
}

export default function DashboardProperties() {
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [view, setView] = useState<View>('grid');
  const { data, isLoading } = useMyProperties({ limit: 50 });
  const properties = useMemo(() => data?.items ?? [], [data]);

  useEffect(() => {
    try { const v = localStorage.getItem('eresi-properties-view'); if (v === 'grid' || v === 'list') setView(v); } catch { /* private mode */ }
  }, []);
  const changeView = (v: View) => { setView(v); try { localStorage.setItem('eresi-properties-view', v); } catch { /* private mode */ } };

  const counts = {
    all: properties.length,
    live: properties.filter(isLive).length,
    review: properties.filter((p) => reviewStateOf(p) === 'pending').length,
    changes: properties.filter((p) => reviewStateOf(p) === 'changes').length,
    archived: properties.filter((p) => p.status === 'ARCHIVED').length,
  };
  const units = properties.reduce((a, p) => ({ avail: a.avail + (p.availableUnits ?? 0), total: a.total + (p.totalUnits ?? 0) }), { avail: 0, total: 0 });

  const shown = properties.filter((p) => {
    const match = filter === 'all' ? true
      : filter === 'live' ? isLive(p)
      : filter === 'review' ? reviewStateOf(p) === 'pending'
      : filter === 'changes' ? reviewStateOf(p) === 'changes'
      : p.status === 'ARCHIVED';
    const needle = q.trim().toLowerCase();
    return match && (!needle || [p.name, p.address?.neighborhood, p.address?.city].some((v) => v?.toLowerCase().includes(needle)));
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 size={24} className="animate-spin text-[#1a73e8]" /></div>;
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'live', label: 'Live' },
    { key: 'review', label: 'In review' },
    { key: 'changes', label: 'Needs changes' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Your properties</h1>
          <p className="text-[14px] text-[#5f6368]">{properties.length} development{properties.length === 1 ? '' : 's'} in your portfolio</p>
        </div>
        <Link href="/dashboard/developments/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]">
          <Plus size={15} /> Add development
        </Link>
      </div>

      {actionError && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{actionError}</p>}

      {properties.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white p-16 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-[#bdc1c6]" />
          <p className="text-[16px] font-medium text-[#202124]">No developments yet</p>
          <p className="mx-auto mt-1 max-w-md text-[14px] text-[#5f6368]">Submit a development. Once our team approves it, buyers can find it and send inquiries.</p>
          <Link href="/dashboard/developments/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1765cc]">
            <Plus size={14} /> Add development
          </Link>
        </div>
      ) : (
        <>
          {/* ── Summary ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Developments', value: String(counts.all) },
              { label: 'Live on the marketplace', value: String(counts.live), tone: 'text-[#188038]' },
              { label: 'Units available', value: `${units.avail}`, sub: units.total ? `of ${units.total}` : undefined },
              { label: 'Waiting on review', value: String(counts.review + counts.changes), tone: counts.changes ? 'text-[#c5221f]' : counts.review ? 'text-[#b06000]' : undefined },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#dadce0] bg-white px-4 py-4">
                <p className="text-[13px] text-[#5f6368]">{s.label}</p>
                <p className={cn('mt-1.5 text-[26px] font-normal leading-none text-[#202124] tabular-nums', s.tone)}>
                  {s.value}{s.sub && <span className="ml-1 text-[14px] text-[#80868b]">{s.sub}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* ── Review notices ── */}
          {counts.changes > 0 && (
            <div className="flex gap-3 rounded-2xl bg-[#fce8e6] px-4 py-3.5">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#c5221f]" />
              <p className="text-[14px] text-[#3c4043]">
                <span className="font-medium text-[#202124]">{counts.changes === 1 ? '1 development needs' : `${counts.changes} developments need`} changes.</span>{' '}
                Open it to read the reviewer&apos;s note.{' '}
                <button type="button" onClick={() => setFilter('changes')} className="font-medium text-[#c5221f] hover:underline">Show</button>
              </p>
            </div>
          )}
          {counts.review > 0 && (
            <div className="flex gap-3 rounded-2xl bg-[#fef7e0] px-4 py-3.5">
              <Clock size={18} className="mt-0.5 shrink-0 text-[#b06000]" />
              <p className="text-[14px] text-[#3c4043]">
                <span className="font-medium text-[#202124]">{counts.review === 1 ? '1 development is' : `${counts.review} developments are`} in review.</span>{' '}
                We check every submission before it goes live and email you once it&apos;s approved. You can keep adding units and media meanwhile.
              </p>
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => setFilter(t.key)} aria-pressed={filter === t.key}
                  className={cn('rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                    filter === t.key ? 'border-[#202124] bg-[#202124] text-white' : 'border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]')}>
                  {t.label}<span className="ml-1.5 tabular-nums opacity-60">{counts[t.key]}</span>
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="flex h-9 items-center gap-2 rounded-full border border-[#dadce0] bg-white px-3 focus-within:border-[#1a73e8]">
                <Search size={15} className="text-[#80868b]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or area"
                  className="w-44 bg-transparent text-[13px] text-[#202124] outline-none placeholder:text-[#9aa0a6]" />
              </label>
              <div className="flex rounded-full border border-[#dadce0] bg-white p-0.5" role="group" aria-label="View">
                {(['grid', 'list'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => changeView(v)} aria-pressed={view === v} aria-label={v === 'grid' ? 'Grid view' : 'List view'}
                    className={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', view === v ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]')}>
                    {v === 'grid' ? <LayoutGrid size={15} /> : <List size={15} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="rounded-3xl border border-[#dadce0] bg-white px-6 py-14 text-center text-[14px] text-[#5f6368]">No developments match.</p>
          ) : view === 'grid' ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((p) => <PropertyCard key={p.id} p={p} onError={setActionError} />)}
              <Link href="/dashboard/developments/new"
                className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-[#dadce0] bg-white text-[#5f6368] transition-colors hover:border-[#1a73e8] hover:text-[#1a73e8]">
                <Plus size={26} />
                <span className="text-[14px] font-medium">Add a development</span>
              </Link>
            </div>
          ) : (
            <PropertyTable rows={shown} onError={setActionError} />
          )}
        </>
      )}
    </div>
  );
}

/** Units-available bar: how much is still for sale. */
function Availability({ p }: { p: P }) {
  const total = p.totalUnits ?? 0;
  const avail = p.availableUnits ?? 0;
  const pct = total ? Math.round((avail / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[12.5px]">
        <span className="text-[#5f6368]">Units available</span>
        <span className="tabular-nums text-[#202124]">{avail}<span className="text-[#80868b]"> / {total}</span></span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1f3f4]">
        <div className="h-full rounded-full bg-[#1a73e8]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Features({ p }: { p: P }) {
  if (!p.has3DTour && !p.hasVRTour && !p.hasDigitalTwin) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {p.has3DTour && <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11.5px] font-medium text-[#1967d2]"><Box size={10} /> 3D</span>}
      {p.hasVRTour && <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[11.5px] font-medium text-[#5f6368]"><Headset size={10} /> VR</span>}
      {p.hasDigitalTwin && <span className="rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[11.5px] font-medium text-[#188038]">✦ Twin</span>}
    </div>
  );
}

function Actions({ p, onError }: { p: P; onError: (m: string) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <ActionIcon href={`/dashboard/properties/${p.slug}`} label="Manage development"><Eye size={15} /></ActionIcon>
      <ActionIcon href={`/dashboard/properties/${p.slug}/customise`} label="Templates"><LayoutTemplate size={15} /></ActionIcon>
      <ActionIcon href={`/dashboard/properties/${p.slug}/domain`} label="Domain"><Globe size={15} /></ActionIcon>
      <PropertyActionsMenu property={p} onError={onError} />
    </div>
  );
}

function PropertyCard({ p, onError }: { p: P; onError: (m: string) => void }) {
  const review = reviewStateOf(p);
  const where = [p.address?.neighborhood, p.address?.city].filter(Boolean).join(', ');
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-[#dadce0] bg-white transition-shadow hover:shadow-[0_8px_28px_rgba(32,33,36,0.10)]">
      <Link href={`/dashboard/properties/${p.slug}`} className="group relative block aspect-[16/10] overflow-hidden bg-[#f1f3f4]">
        {p.heroImageUrl
          ? <Image src={p.heroImageUrl} alt={p.name} fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          : <Building2 size={30} className="absolute inset-0 m-auto text-[#bdc1c6]" />}
        <span className="absolute left-3 top-3"><StatusChip p={p} /></span>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <Link href={`/dashboard/properties/${p.slug}`} className="block truncate text-[16px] font-medium text-[#202124] hover:underline">{p.name}</Link>
          <p className="flex items-center gap-1 truncate text-[13px] text-[#5f6368]"><MapPin size={12} className="shrink-0" />{where || 'Location not set'}</p>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12.5px] text-[#5f6368]">From</span>
          <span className="text-[16px] font-medium tabular-nums text-[#202124]">{p.priceFrom ? formatPrice(p.priceFrom, p.currency) : '—'}</span>
        </div>
        <Availability p={p} />
        <Features p={p} />
        {review && (
          <p className="text-[12px] text-[#80868b]">{review === 'pending' ? `Submitted ${fmtShortDate(p.createdAt)}` : 'Open it to see the reviewer’s note'}</p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-[#f1f3f4] pt-3">
          <Link href={`/dashboard/properties/${p.slug}`} className="text-[13.5px] font-medium text-[#1a73e8] hover:underline">Manage</Link>
          <Actions p={p} onError={onError} />
        </div>
      </div>
    </article>
  );
}

function PropertyTable({ rows, onError }: { rows: P[]; onError: (m: string) => void }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#dadce0] text-left text-[12px] font-medium uppercase tracking-[0.08em] text-[#5f6368]">
              <th className="px-6 py-3.5">Property</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Units</th>
              <th className="px-4 py-3.5">Price from</th>
              <th className="px-4 py-3.5">Features</th>
              <th className="px-4 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f3f4]">
            {rows.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-[#f8f9fa]">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f1f3f4]">
                      {p.heroImageUrl && <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover" sizes="64px" />}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/dashboard/properties/${p.slug}`} className="block max-w-56 truncate text-[15px] font-medium text-[#202124] hover:underline">{p.name}</Link>
                      <p className="text-[12.5px] text-[#5f6368]">{[p.address?.neighborhood, p.address?.city].filter(Boolean).join(', ') || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5"><StatusChip p={p} /></td>
                <td className="px-4 py-3.5 text-[14.5px] tabular-nums text-[#202124]">{p.availableUnits} <span className="text-[#80868b]">/ {p.totalUnits}</span></td>
                <td className="px-4 py-3.5 text-[14.5px] font-medium tabular-nums text-[#202124]">{p.priceFrom ? formatPrice(p.priceFrom, p.currency) : '—'}</td>
                <td className="px-4 py-3.5"><Features p={p} /></td>
                <td className="px-4 py-3.5"><Actions p={p} onError={onError} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * An action icon with its name shown on hover, positioned against the
 * viewport so the table's scroll container can't clip it.
 */
function ActionIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const show = (el: HTMLElement) => { const r = el.getBoundingClientRect(); setTip({ x: r.left + r.width / 2, y: r.top }); };
  return (
    <Link href={href} aria-label={label}
      onMouseEnter={(e) => show(e.currentTarget)} onMouseLeave={() => setTip(null)}
      onFocus={(e) => show(e.currentTarget)} onBlur={() => setTip(null)}
      className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4] hover:text-[#202124]">
      {children}
      {tip && (
        <span role="tooltip" className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-[#3c4043] px-2 py-1 text-xs font-medium text-white shadow-md"
          style={{ left: tip.x, top: tip.y - 6 }}>
          {label}
        </span>
      )}
    </Link>
  );
}
