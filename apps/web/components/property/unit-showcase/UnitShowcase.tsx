'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Bath, BedDouble, Box, Building2, CalendarDays, Check, ChevronRight,
  Film, Images, Layers, MapPin, Maximize2, Play, View, X,
} from 'lucide-react';
import { cn, formatPrice } from '../../../lib/utils';
import { buildTheme, themeVars } from '../../../lib/branding/theme';
import { leftLabel, type TourScene, type TypeCounts } from '../../../lib/api/unit-types';
import { ChatWithDeveloper } from '../../chat/ChatWithDeveloper';
import { FloatingChat } from '../../chat/FloatingChat';
import { UnitNavbar } from './UnitNavbar';

/**
 * One layout for both a single unit and a unit type.
 *
 * The buyer's questions run in the same order either way — what is it, what
 * does it look like, how much, is any left, can I walk through it — so the
 * page answers them in that order: a photo mosaic, the facts and price, then
 * availability, video and tours, the plan, and what comes with it. The
 * booking card stays beside the content on desktop and becomes a bottom bar
 * on a phone.
 */

export interface ShowcaseRow {
  id: string;
  name: string;
  floor?: number | null;
  sqm?: number | null;
  price?: number | null;
  status: string;
  href: string;
}

export interface ShowcaseData {
  kind: 'unit' | 'type';
  title: string;
  /** Short line above the title: "Unit type" / "3 Bedroom". */
  eyebrow: string;
  status?: { label: string; tone: 'green' | 'amber' | 'grey' };
  counts?: TypeCounts;
  priceLabel: string | null;
  priceNote?: string;
  bedrooms: number;
  bathrooms: number;
  sqm?: number | null;
  sqft?: number | null;
  floor?: number | null;
  description?: string | null;
  features: string[];
  images: { url: string; title?: string | null }[];
  videos: { url: string; title?: string | null; poster?: string | null }[];
  floorPlan?: { url: string; name?: string | null } | null;
  cinematic: TourScene[];
  sections3D: { id: string; label: string; scenes: TourScene[] }[];
  vr: TourScene[];
  rows: ShowcaseRow[];
  rowsTitle: string;
  otherTypes?: {
    id: string; name: string; bedrooms: number; sqm?: number | null; sqft?: number | null;
    priceFrom?: number | null; coverImageUrl?: string | null; counts: TypeCounts;
  }[];
  currency: string;
  property: {
    slug: string;
    name: string;
    tagline?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    brandColor?: string | null;
    ownerName?: string | null;
    /** The owner's public profile. */
    ownerHref?: string | null;
    logoUrl?: string | null;
    completionDate?: string | null;
    hasCinematicTour: boolean;
    has3DTour: boolean;
    hasVRTour: boolean;
    unitFeatures: string[];
    features: string[];
    agentListed: boolean;
  };
}

const TONE = {
  green: 'bg-[#e6f4ea] text-[#137333]',
  amber: 'bg-[#fef7e0] text-[#b06000]',
  grey: 'bg-gray-100 text-gray-600',
};

export function ordinalFloor(n: number): string {
  if (n === 0) return 'Ground floor';
  const r = n % 100;
  const suf = r >= 11 && r <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${suf} floor`;
}

function rowStatus(s: string) {
  const k = s.toLowerCase();
  if (k === 'available') return { label: 'Available', cls: 'text-[#137333]' };
  if (k === 'reserved') return { label: 'Reserved', cls: 'text-[#b06000]' };
  return { label: 'Sold', cls: 'text-gray-400' };
}

const h2 = 'text-[22px] font-semibold tracking-[-0.01em] text-gray-900';

export function UnitShowcase({ data: d }: { data: ShowcaseData }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [playing, setPlaying] = useState<{ url: string; title?: string | null } | null>(null);
  const p = d.property;
  const style = useMemo(() => themeVars(buildTheme(p.brandColor)), [p.brandColor]);

  const tourCount = d.cinematic.length + d.sections3D.length + d.vr.length;
  const showPropertyTours = tourCount === 0 && (p.hasCinematicTour || p.has3DTour || p.hasVRTour);
  const allFeatures = d.features;

  const sections = [
    { id: 'overview', label: 'Overview' },
    ...(d.counts || d.rows.length ? [{ id: 'availability', label: 'Availability' }] : []),
    ...(d.videos.length ? [{ id: 'video', label: 'Video' }] : []),
    ...(tourCount || showPropertyTours ? [{ id: 'tours', label: 'Tours' }] : []),
    ...(d.floorPlan ? [{ id: 'floorplan', label: 'Floor plan' }] : []),
    ...(allFeatures.length || p.unitFeatures.length || p.features.length ? [{ id: 'features', label: 'Features' }] : []),
    ...(d.otherTypes?.length ? [{ id: 'layouts', label: 'Other layouts' }] : []),
  ];

  const where = [p.neighborhood, p.city].filter(Boolean).join(', ');
  const size = [d.sqm ? `${d.sqm} m²` : null, d.sqft ? `${d.sqft.toLocaleString()} sqft` : null].filter(Boolean).join(' · ');
  const specs = [
    { icon: BedDouble, label: d.bedrooms === 0 ? 'Layout' : 'Bedrooms', value: d.bedrooms === 0 ? 'Studio' : String(d.bedrooms) },
    { icon: Bath, label: 'Bathrooms', value: String(d.bathrooms) },
    ...(size ? [{ icon: Maximize2, label: 'Size', value: size }] : []),
    ...(d.floor != null ? [{ icon: Layers, label: 'Floor', value: ordinalFloor(d.floor) }] : []),
    ...(p.completionDate
      ? [{ icon: CalendarDays, label: 'Completion', value: new Date(p.completionDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) }]
      : []),
  ];

  const step = (by: number) => {
    if (lightbox === null || !d.images.length) return;
    setLightbox((lightbox + by + d.images.length) % d.images.length);
  };

  const mosaic = d.images.slice(0, 5);
  const chatLabel = p.agentListed ? 'Chat with agent' : 'Chat with developer';

  return (
    <div style={style} className="min-h-screen bg-white pb-24 pt-[112px] text-[16px] text-gray-900 lg:pb-0 lg:pt-16">
      <UnitNavbar
        propertySlug={p.slug}
        propertyName={p.name}
        ownerName={p.ownerName}
        logoUrl={p.logoUrl}
        sections={sections}
      />
      <FloatingChat propertySlug={p.slug} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Trail ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13.5px] text-gray-500">
          <Link href={`/${p.slug}`} className="hover:text-gray-900">{p.name}</Link>
          <ChevronRight size={13} className="text-gray-300" />
          <Link href={`/${p.slug}#units`} className="hover:text-gray-900">{d.kind === 'type' ? 'Layouts' : 'Units'}</Link>
          <ChevronRight size={13} className="text-gray-300" />
          <span className="truncate font-medium text-gray-900">{d.title}</span>
        </nav>

        {/* ── Title ── */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gray-500">{d.eyebrow}</p>
            <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-gray-900 sm:text-[38px]">{d.title}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14.5px] text-gray-600">
              {where && <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {where}</span>}
              <span className="text-gray-400">{p.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {d.status && <span className={cn('rounded-full px-3 py-1 text-[13px] font-medium', TONE[d.status.tone])}>{d.status.label}</span>}
            {d.counts && d.counts.total > 0 && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[13px] font-medium text-gray-700">{leftLabel(d.counts)}</span>
            )}
          </div>
        </div>

        {/* ── Gallery mosaic ── */}
        <div className="relative mt-5">
          {mosaic.length === 0 ? (
            <div className="flex aspect-[21/9] items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Building2 size={36} />
            </div>
          ) : (
            <div className={cn(
              'grid gap-2 overflow-hidden rounded-2xl',
              mosaic.length >= 5 ? 'sm:grid-cols-4 sm:grid-rows-2' : mosaic.length >= 3 ? 'sm:grid-cols-3 sm:grid-rows-2' : 'sm:grid-cols-2',
              'h-[280px] sm:h-[460px]',
            )}>
              {mosaic.map((img, i) => (
                <button key={img.url + i} onClick={() => setLightbox(i)}
                  className={cn(
                    'group relative overflow-hidden bg-gray-100',
                    i === 0 && (mosaic.length >= 3 ? 'sm:col-span-2 sm:row-span-2' : ''),
                    i > 0 && 'hidden sm:block',
                  )}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.title ?? d.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                </button>
              ))}
            </div>
          )}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {d.videos.length > 0 && (
              <button onClick={() => setPlaying(d.videos[0])}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13.5px] font-medium text-gray-900 shadow-sm ring-1 ring-black/10 hover:bg-gray-50">
                <Play size={14} className="fill-current" /> Watch video
              </button>
            )}
            {d.images.length > 1 && (
              <button onClick={() => setLightbox(0)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13.5px] font-medium text-gray-900 shadow-sm ring-1 ring-black/10 hover:bg-gray-50">
                <Images size={14} /> All {d.images.length} photos
              </button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="min-w-0">
            {/* Overview */}
            <section id="overview" className="scroll-mt-32">
              <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 sm:grid-cols-3 lg:flex">
                {specs.map((s) => (
                  <div key={s.label} className="flex-1 border-b border-r border-gray-200 px-5 py-4 last:border-r-0 lg:border-b-0">
                    <s.icon size={18} className="text-gray-400" />
                    <p className="mt-2 text-[17px] font-semibold text-gray-900">{s.value}</p>
                    <p className="text-[12.5px] text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
              {(d.description || p.tagline) && (
                <div className="mt-8">
                  <h2 className={h2}>About this {d.kind === 'type' ? 'layout' : 'home'}</h2>
                  <p className="mt-3 whitespace-pre-line text-[16px] leading-[1.75] text-gray-700">{d.description || p.tagline}</p>
                </div>
              )}
            </section>

            {/* Availability */}
            {(d.counts || d.rows.length > 0) && (
              <section id="availability" className="mt-14 scroll-mt-32 border-t border-gray-200 pt-12">
                <h2 className={h2}>Availability</h2>
                {d.counts && d.counts.total > 0 && (
                  <div className="mt-5 rounded-2xl border border-gray-200 p-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <p className="text-[28px] font-semibold tracking-[-0.02em] text-gray-900">
                        {d.counts.available}<span className="text-[18px] font-normal text-gray-400"> / {d.counts.total} units left</span>
                      </p>
                      <p className="text-[13.5px] text-gray-500">{d.counts.available === 0 ? 'This layout is sold out' : 'Updated by the sales team'}</p>
                    </div>
                    <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <span style={{ width: `${(d.counts.available / d.counts.total) * 100}%`, background: 'var(--brand)' }} />
                      <span style={{ width: `${(d.counts.reserved / d.counts.total) * 100}%`, background: 'color-mix(in srgb, var(--brand) 35%, white)' }} />
                    </div>
                    <dl className="mt-5 grid grid-cols-3 gap-4">
                      {([
                        ['Available', d.counts.available, 'var(--brand)'],
                        ['Reserved', d.counts.reserved, 'color-mix(in srgb, var(--brand) 35%, white)'],
                        ['Sold', d.counts.sold, '#e5e7eb'],
                      ] as const).map(([l, v, c]) => (
                        <div key={l}>
                          <dt className="flex items-center gap-1.5 text-[13px] text-gray-500"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /> {l}</dt>
                          <dd className="mt-0.5 text-[20px] font-semibold text-gray-900">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                {d.rows.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-2 text-[14px] font-medium text-gray-700">{d.rowsTitle}</p>
                    <div className="overflow-hidden rounded-2xl border border-gray-200">
                      {d.rows.map((r) => {
                        const st = rowStatus(r.status);
                        return (
                          <Link key={r.id} href={r.href}
                            className="group flex items-center gap-4 border-b border-gray-100 px-5 py-3.5 last:border-b-0 hover:bg-gray-50">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[15px] font-medium text-gray-900">{r.name}</span>
                              <span className="text-[12.5px] text-gray-500">
                                {[r.floor != null ? ordinalFloor(r.floor) : null, r.sqm ? `${r.sqm} m²` : null].filter(Boolean).join(' · ')}
                              </span>
                            </span>
                            <span className={cn('text-[13px] font-medium', st.cls)}>{st.label}</span>
                            {r.price ? <span className="hidden w-32 text-right text-[14.5px] font-semibold text-gray-900 sm:block">{formatPrice(r.price, d.currency)}</span> : null}
                            <ArrowRight size={15} className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-600" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Video */}
            {d.videos.length > 0 && (
              <section id="video" className="mt-14 scroll-mt-32 border-t border-gray-200 pt-12">
                <h2 className={h2}>Video</h2>
                <div className={cn('mt-5 grid gap-4', d.videos.length > 1 && 'sm:grid-cols-2')}>
                  {d.videos.map((v) => (
                    <button key={v.url} onClick={() => setPlaying(v)} className="group relative aspect-video overflow-hidden rounded-2xl bg-black">
                      <video src={`${v.url}#t=0.5`} muted playsInline preload="metadata" poster={v.poster ?? undefined} className="h-full w-full object-cover opacity-90" />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow transition-transform group-hover:scale-105">
                          <Play size={20} className="ml-0.5 fill-current" />
                        </span>
                      </span>
                      {v.title && <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[12.5px] text-white">{v.title}</span>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Tours */}
            {(tourCount > 0 || showPropertyTours) && (
              <section id="tours" className="mt-14 scroll-mt-32 border-t border-gray-200 pt-12">
                <h2 className={h2}>Walk through it</h2>
                <p className="mt-1.5 text-[15px] text-gray-600">
                  {tourCount > 0 ? `Tours chosen for this ${d.kind === 'type' ? 'layout' : 'home'}.` : 'Tours of the development.'}
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {d.cinematic.map((s) => (
                    <button key={s.id} onClick={() => s.videoUrl && setPlaying({ url: s.videoUrl, title: s.label })}
                      className="group relative aspect-video overflow-hidden rounded-2xl bg-gray-900 text-left">
                      {s.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : s.videoUrl ? (
                        <video src={`${s.videoUrl}#t=1`} muted preload="metadata" className="h-full w-full object-cover opacity-85" />
                      ) : null}
                      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <span className="absolute bottom-4 left-4 right-4 flex items-center gap-3 text-white">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 text-gray-900"><Play size={15} className="ml-0.5 fill-current" /></span>
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-semibold">{s.label}</span>
                          <span className="block text-[12.5px] text-white/75">Cinematic{s.sublabel ? ` · ${s.sublabel}` : ''}</span>
                        </span>
                      </span>
                    </button>
                  ))}
                  {d.sections3D.map((s) => (
                    <TourLink key={s.id} href={`/${p.slug}/tour/3d`} icon={<Box size={18} />} title={s.label}
                      sub={`3D tour · ${s.scenes.length} scene${s.scenes.length === 1 ? '' : 's'}`} thumb={s.scenes[0]?.thumbnailUrl ?? s.scenes[0]?.imageUrl} />
                  ))}
                  {d.vr.map((s) => (
                    <TourLink key={s.id} href={`/${p.slug}/tour/vr`} icon={<View size={18} />} title={s.label}
                      sub="VR / 360°" thumb={s.thumbnailUrl ?? s.imageUrl} />
                  ))}
                  {showPropertyTours && (
                    <>
                      {p.hasCinematicTour && <TourLink href={`/${p.slug}/tour/cinematic`} icon={<Film size={18} />} title="Cinematic tour" sub="Film of the development" />}
                      {p.has3DTour && <TourLink href={`/${p.slug}/tour/3d`} icon={<Box size={18} />} title="3D tour" sub="Walk the building in 3D" />}
                      {p.hasVRTour && <TourLink href={`/${p.slug}/tour/vr`} icon={<View size={18} />} title="VR / 360° tour" sub="Look around every room" />}
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Floor plan */}
            {d.floorPlan && (
              <section id="floorplan" className="mt-14 scroll-mt-32 border-t border-gray-200 pt-12">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className={h2}>Floor plan</h2>
                  {d.floorPlan.name && <span className="text-[13.5px] text-gray-500">{d.floorPlan.name}</span>}
                </div>
                <a href={d.floorPlan.url} target="_blank" rel="noopener noreferrer"
                  className="mt-5 block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 sm:p-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.floorPlan.url} alt={`${d.title} floor plan`} className="mx-auto max-h-[560px] w-auto object-contain" />
                </a>
              </section>
            )}

            {/* Features */}
            {(allFeatures.length > 0 || p.unitFeatures.length > 0 || p.features.length > 0) && (
              <section id="features" className="mt-14 scroll-mt-32 border-t border-gray-200 pt-12">
                <h2 className={h2}>What comes with it</h2>
                <div className="mt-5 grid gap-8 sm:grid-cols-2">
                  {[
                    { title: d.kind === 'type' ? 'This layout' : 'This home', items: allFeatures },
                    { title: 'In every home', items: p.unitFeatures.filter((f) => !allFeatures.includes(f)) },
                    { title: 'In the development', items: p.features },
                  ].filter((g) => g.items.length).map((g) => (
                    <div key={g.title}>
                      <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gray-500">{g.title}</p>
                      <ul className="mt-3 space-y-2.5">
                        {g.items.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-[15px] text-gray-800">
                            <Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--brand)' }} /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Other layouts */}
            {d.otherTypes && d.otherTypes.length > 0 && (
              <section id="layouts" className="mt-14 scroll-mt-32 border-t border-gray-200 pt-12">
                <h2 className={h2}>Other layouts at {p.name}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {d.otherTypes.map((t) => (
                    <Link key={t.id} href={`/${p.slug}/types/${t.id}`} className="group overflow-hidden rounded-2xl border border-gray-200 hover:border-gray-300">
                      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                        {t.coverImageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="truncate text-[15.5px] font-semibold text-gray-900">{t.name}</p>
                        <p className="text-[13px] text-gray-500">
                          {[t.bedrooms === 0 ? 'Studio' : `${t.bedrooms} bed`, t.sqm ? `${t.sqm} m²` : null, t.sqft ? `${t.sqft} sqft` : null].filter(Boolean).join(' · ')}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[13.5px]">
                          <span className="font-semibold text-gray-900">{t.priceFrom ? `From ${formatPrice(t.priceFrom, d.currency)}` : 'Price on request'}</span>
                          <span className="text-gray-500">{leftLabel(t.counts)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="mb-16 mt-14 border-t border-gray-200 pt-8">
              <Link href={`/${p.slug}`} className="inline-flex items-center gap-2 text-[14.5px] font-medium text-gray-700 hover:text-gray-900">
                <ArrowLeft size={15} /> Back to {p.name}
              </Link>
            </div>
          </main>

          {/* ── Booking card ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
              <p className="text-[13px] text-gray-500">{d.priceNote ?? 'Price'}</p>
              <p className="mt-0.5 text-[28px] font-semibold tracking-[-0.02em] text-gray-900">{d.priceLabel ?? 'Price on request'}</p>
              {d.counts && d.counts.total > 0 && (
                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-[13.5px]">
                    <span className="font-medium text-gray-900">{leftLabel(d.counts)}</span>
                    <span className="text-gray-500">{d.counts.sold} sold · {d.counts.reserved} reserved</span>
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <span style={{ width: `${(d.counts.available / d.counts.total) * 100}%`, background: 'var(--brand)' }} />
                    <span style={{ width: `${(d.counts.reserved / d.counts.total) * 100}%`, background: 'color-mix(in srgb, var(--brand) 35%, white)' }} />
                  </div>
                </div>
              )}
              {d.status && (
                <p className="mt-4"><span className={cn('rounded-full px-2.5 py-1 text-[12.5px] font-medium', TONE[d.status.tone])}>{d.status.label}</span></p>
              )}
              <dl className="mt-5 space-y-2.5 border-t border-gray-100 pt-5 text-[14px]">
                {specs.slice(0, 4).map((s) => (
                  <div key={s.label} className="flex justify-between gap-3">
                    <dt className="text-gray-500">{s.label}</dt>
                    <dd className="truncate font-medium text-gray-900">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 space-y-2">
                <Link href={`/${p.slug}#booking`}
                  className="flex w-full items-center justify-center rounded-xl py-3.5 text-[15px] font-semibold transition-opacity hover:opacity-90"
                  style={{ background: 'var(--brand)', color: 'var(--brand-on)' }}>
                  Book a viewing
                </Link>
                <ChatWithDeveloper propertySlug={p.slug} className="w-full" label={chatLabel} />
              </div>
              {p.ownerName && (
                <p className="mt-4 text-center text-[12.5px] text-gray-500">
                  {p.agentListed ? 'Marketed by' : 'Developed by'}{' '}
                  {p.ownerHref
                    ? <Link href={p.ownerHref} className="font-medium text-gray-700 underline-offset-2 hover:underline">{p.ownerName}</Link>
                    : <span className="font-medium text-gray-700">{p.ownerName}</span>}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── Phone booking bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold text-gray-900">{d.priceLabel ?? 'Price on request'}</p>
          <p className="truncate text-[12.5px] text-gray-500">{d.counts && d.counts.total > 0 ? leftLabel(d.counts) : d.status?.label ?? d.title}</p>
        </div>
        <Link href={`/${p.slug}#booking`} className="shrink-0 rounded-xl px-5 py-3 text-[14.5px] font-semibold"
          style={{ background: 'var(--brand)', color: 'var(--brand-on)' }}>
          Book a viewing
        </Link>
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && d.images[lightbox] && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} aria-label="Close" className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={18} /></button>
          {d.images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous" className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ArrowLeft size={18} /></button>
              <button onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next" className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ArrowRight size={18} /></button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] text-white">{lightbox + 1} / {d.images.length}</span>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.images[lightbox].url} alt={d.images[lightbox].title ?? ''} className="max-h-[86vh] max-w-[92vw] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* ── Video player ── */}
      {playing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4" onClick={() => setPlaying(null)}>
          <button onClick={() => setPlaying(null)} aria-label="Close video" className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={20} /></button>
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <video src={playing.url} controls autoPlay playsInline className="w-full rounded-xl bg-black" />
            {playing.title && <p className="mt-3 flex items-center gap-2 text-white"><Film size={16} /> {playing.title}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function TourLink({ href, icon, title, sub, thumb }: { href: string; icon: React.ReactNode; title: string; sub: string; thumb?: string | null }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50">
      <span className="relative flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-gray-500">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-gray-900">{title}</span>
        <span className="block text-[13px] text-gray-500">{sub}</span>
      </span>
      <ArrowRight size={16} className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-600" />
    </Link>
  );
}
