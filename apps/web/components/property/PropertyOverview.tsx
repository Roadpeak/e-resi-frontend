'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MouseEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, CalendarCheck2, BedDouble, Maximize2, CheckCircle2, MapPin, Film, Headset, Box,
} from 'lucide-react';
import type { Property, Unit } from '../../lib/types';
import { formatPrice, formatCompletionDate, pluralize, cn } from '../../lib/utils';

interface Props { property: Property }

// ── Small visual primitives ────────────────────

function ProgressRing({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="#6172f3"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - Math.min(value, 100) / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-baseline justify-center pt-6 text-xl font-bold text-gray-900">
        {value}
        <span className="text-[10px] font-medium text-gray-400">%</span>
      </span>
    </div>
  );
}

function MiniDonut({ pct, color }: { pct: number; color: string }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 22 22" className="h-5 w-5 -rotate-90">
      <circle cx="11" cy="11" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
      <circle
        cx="11"
        cy="11"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)}
        strokeLinecap="round"
      />
    </svg>
  );
}

const DONUT_COLORS = ['#6172f3', '#f59e0b', '#eab308', '#8098fa'];

// ── Overview ──────────────────────────────────

export function PropertyOverview({ property }: Props) {
  const units: Unit[] = property.units ?? [];
  const floorPlans = property.floorPlans ?? [];

  // Bedroom + size ranges (units first, floor plans as fallback)
  const bedSource = units.length ? units.map((u) => u.bedrooms) : floorPlans.map((f) => f.bedrooms);
  const sqmSource = units.length ? units.map((u) => u.sqm) : floorPlans.map((f) => f.sqm);
  const bedLabel = bedSource.length
    ? (() => {
        const min = Math.min(...bedSource);
        const max = Math.max(...bedSource);
        const fmt = (n: number) => (n === 0 ? 'Studio' : `${n}`);
        return min === max ? fmt(min) : `${fmt(min)}–${max}`;
      })()
    : null;
  const sqmLabel = sqmSource.length
    ? (() => {
        const min = Math.min(...sqmSource);
        const max = Math.max(...sqmSource);
        return min === max ? `${min}` : `${min}–${max}`;
      })()
    : null;

  // Totals — trust explicit fields, fall back to the units array
  const statusOf = (u: Unit) => (u.status ?? '').toLowerCase();
  const availableFromUnits = units.filter((u) => statusOf(u) === 'available').length;
  const total = property.totalUnits || units.length;
  const available = property.availableUnits ?? availableFromUnits;

  const stats = [
    {
      icon: CalendarCheck2,
      value: property.completionDate ? `${new Date(property.completionDate).getFullYear()}` : 'Ready',
      label: 'Completion',
    },
    { icon: Building2, value: `${total}`, label: 'Total Units' },
    { icon: CheckCircle2, value: `${available}`, label: 'Available' },
    ...(bedLabel ? [{ icon: BedDouble, value: bedLabel, label: 'Bedrooms' }] : []),
    ...(sqmLabel ? [{ icon: Maximize2, value: sqmLabel, label: 'Size (sqm)' }] : []),
  ].slice(0, 5);

  // Construction / sales progress
  const cu = property.constructionUpdates ?? [];
  const latestUpdate = cu[cu.length - 1];
  const soldPct = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
  const progress = latestUpdate?.percentComplete ?? soldPct;

  // Unit status split for the segmented bar
  const counts = units.length
    ? {
        sold: units.filter((u) => statusOf(u) === 'sold').length,
        reserved: units.filter((u) => statusOf(u) === 'reserved').length,
        available: units.filter((u) => statusOf(u) === 'available').length,
      }
    : { sold: Math.max(total - available, 0), reserved: 0, available };
  const segTotal = Math.max(counts.sold + counts.reserved + counts.available, 1);
  const segments = [
    { key: 'Sold', count: counts.sold, bar: 'bg-brand-500', dot: 'bg-brand-500' },
    { key: 'Reserved', count: counts.reserved, bar: 'bg-amber-400', dot: 'bg-amber-400' },
    { key: 'Available', count: counts.available, bar: 'bg-gold-300', dot: 'bg-gold-300' },
  ];

  // Unit availability by bedroom type
  const groupMap = new Map<number, Unit[]>();
  units.forEach((u) => {
    groupMap.set(u.bedrooms, [...(groupMap.get(u.bedrooms) ?? []), u]);
  });
  const groups = [...groupMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bedrooms, list], i) => {
      const availableCount = list.filter((u) => statusOf(u) === 'available').length;
      const prices = list.map((u) => u.price);
      return {
        bedrooms,
        label: bedrooms === 0 ? 'Studio' : `${bedrooms} Bedroom`,
        initial: bedrooms === 0 ? 'St' : `${bedrooms}B`,
        available: availableCount,
        total: list.length,
        minPrice: Math.min(...prices),
        pct: Math.round((availableCount / list.length) * 100),
        color: DONUT_COLORS[i % DONUT_COLORS.length],
      };
    });

  // ✳ feature list — property features + closest amenities
  const featureItems = [
    ...(property.features ?? []),
    ...(property.amenities ?? [])
      .slice(0, 4)
      .map((a) => (a.distance ? `${a.name} · ${a.distance}` : a.name)),
  ];

  const fullAddress = [
    property.address.street,
    property.address.neighborhood,
    property.address.city,
    property.address.county,
    property.address.country,
  ]
    .filter(Boolean)
    .join(', ');

  const scrollToBooking = (e: MouseEvent) => {
    e.preventDefault();
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tourPill =
    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors';

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-14">
      {/* ── LEFT: identity, price, stats, story ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="lg:col-span-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{property.name}</h1>
        <p className="mt-2 flex items-start gap-1.5 text-gray-500">
          <MapPin size={15} className="mt-1 shrink-0 text-gray-400" />
          <span>{fullAddress}</span>
        </p>

        {/* Price + CTA row */}
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">From</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(property.priceFrom, property.currency)}
              {property.priceTo > property.priceFrom && (
                <span className="ml-2 text-base font-medium text-gray-400">
                  – {formatPrice(property.priceTo, property.currency)}
                </span>
              )}
            </p>
          </div>
          <a
            href="#booking"
            onClick={scrollToBooking}
            className="inline-flex items-center rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            Book a Viewing
          </a>
          <div className="flex flex-wrap items-center gap-2">
            {property.hasCinematicTour && (
              <Link
                href={`/${property.slug}/tour/cinematic`}
                className={cn(tourPill, 'border-warm-500/25 bg-warm-500/10 text-warm-700 hover:bg-warm-500/20')}
              >
                <Film size={12} /> Cinematic
              </Link>
            )}
            {property.hasVRTour && (
              <Link
                href={`/${property.slug}/tour/vr`}
                className={cn(tourPill, 'border-violet-500/25 bg-violet-500/10 text-violet-700 hover:bg-violet-500/20')}
              >
                <Headset size={12} /> VR Tour
              </Link>
            )}
            {property.has3DTour && (
              <Link
                href={`/${property.slug}/tour/3d`}
                className={cn(tourPill, 'border-brand-500/25 bg-brand-500/10 text-brand-700 hover:bg-brand-500/20')}
              >
                <Box size={12} /> 3D Tour
              </Link>
            )}
          </div>
        </div>

        {/* Stat tiles */}
        <div className="mt-8 flex flex-wrap overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex min-w-[150px] flex-1 items-center gap-3 border-r border-gray-100 px-5 py-4 last:border-r-0"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tagline + description */}
        <p className="mt-10 text-lg font-semibold text-gray-900">{property.tagline}</p>
        <p className="mt-4 leading-relaxed text-gray-500">{property.description}</p>

        {/* ✳ features */}
        {featureItems.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((feat) => (
              <div key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                <span aria-hidden className="leading-5 text-brand-500">✳</span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── RIGHT rail ── */}
      <motion.aside
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-5 self-start lg:sticky lg:top-24"
      >
        {/* Progress card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <ProgressRing value={progress} />
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-gray-900">
                {property.address.neighborhood}, {property.address.city}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {available} of {total} units left
                {property.completionDate && <> · {formatCompletionDate(property.completionDate)}</>}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {latestUpdate ? 'Construction progress' : 'Units sold'}
              </p>
            </div>
          </div>

          {/* Segmented bar */}
          <div className="mt-5 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-gray-100">
            {segments.map(
              (s) =>
                s.count > 0 && (
                  <motion.div
                    key={s.key}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(s.count / segTotal) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className={cn('h-full', s.bar)}
                  />
                ),
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {segments.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={cn('h-2 w-2 rounded-full', s.dot)} />
                {s.key} {s.count}
              </span>
            ))}
          </div>
        </div>

        {/* Unit availability + developer card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <p className="border-b border-gray-100 pb-4 text-sm font-semibold text-gray-900">Unit availability</p>

          {groups.length > 0 ? (
            <div>
              {groups.map((g) => (
                <div
                  key={g.bedrooms}
                  className="flex items-center gap-3 border-b border-gray-100 py-3.5 last:border-b-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                    {g.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{g.label}</p>
                    <p className="text-xs text-gray-500">
                      {g.available} of {g.total} available · from {formatPrice(g.minPrice, property.currency)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <MiniDonut pct={g.pct} color={g.color} />
                    <span className="text-sm font-semibold text-gray-900">{g.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-3 text-sm text-gray-500">
              {available} of {total} units currently available.
            </p>
          )}

          {/* Developer */}
          <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-5">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-500">
              {property.developer?.logoUrl ? (
                <Image
                  src={property.developer.logoUrl}
                  alt={property.developer.name ?? 'Developer'}
                  fill
                  className="object-contain p-1.5"
                  sizes="40px"
                />
              ) : (
                (property.developer?.name ?? '?')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{property.developer?.name ?? '—'}</p>
              <p className="text-xs text-gray-500">
                {property.developer?.establishedYear ? `Est. ${property.developer.establishedYear} · ` : ''}
                {pluralize(property.developer?.completedProjects ?? 0, 'project')} completed
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
