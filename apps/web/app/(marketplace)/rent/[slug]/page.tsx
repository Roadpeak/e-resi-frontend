'use client';

import { Suspense, use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Baby, Bath, BedDouble, Box, Building2, CalendarClock, CalendarDays, Car, Check, CheckCircle2,
  DoorOpen, Droplets, Dumbbell, Eye, Film, Heart, Images, KeyRound, Loader2, MapPin, Maximize2, MoveVertical, PawPrint, Phone, Play,
  Share2, ShieldCheck, Snowflake, Sofa, Sun, TreePine, Tv, Utensils, View, WashingMachine, Waves, Wifi, X, Zap,
} from 'lucide-react';
import { RentShell, useSavedRentals } from '../../../../components/rent/RentShell';
import { rentListingsApi, toRentListing } from '../../../../lib/api/rent-listings';
import { floorPlansApi } from '../../../../lib/api/floor-plans';
import { ChatWithDeveloper } from '../../../../components/chat/ChatWithDeveloper';
import { RentEnquiryModal } from '../../../../components/rent/RentEnquiryModal';
import { formatPrice, cn } from '../../../../lib/utils';
import { apiClient, ApiError } from '../../../../lib/api/client';
import { useAuthStore } from '../../../../lib/stores/auth.store';
import { referralPayload } from '../../../../lib/analytics/referral';
import { track } from '../../../../lib/analytics/track';
import type { RentUnit } from '../../../../lib/types';

const PropertyMiniMap = dynamic(
  () => import('../../../../components/property/PropertyMiniMap').then((m) => m.PropertyMiniMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[#efefef]" /> },
);

const FURNISHING: Record<string, string> = {
  furnished: 'Furnished', semi_furnished: 'Semi-furnished', unfurnished: 'Unfurnished',
  FURNISHED: 'Furnished', SEMI_FURNISHED: 'Semi-furnished', UNFURNISHED: 'Unfurnished',
};
const STATUS: Record<string, string> = {
  available: 'Available now', partially_available: 'Partly let', fully_let: 'Fully let',
};

function ordinalFloor(n: number): string {
  if (n === 0) return 'Ground floor';
  const r = n % 100;
  const s = r >= 11 && r <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${s} floor`;
}

function range(nums: number[], unit = '', studio = false): string | null {
  const n = nums.filter((x) => Number.isFinite(x) && (studio || x > 0));
  if (!n.length) return null;
  const lo = Math.min(...n);
  const hi = Math.max(...n);
  const f = (v: number) => (studio && v === 0 ? 'Studio' : `${v}`);
  return lo === hi ? `${f(lo)}${unit}` : `${f(lo)}–${hi}${unit}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = any;

/** A line icon for an amenity, matched on its wording; a tick when nothing fits. */
const AMENITY_ICONS: [RegExp, typeof Check][] = [
  [/park|garage|carport/i, Car],
  [/pool|swim/i, Waves],
  [/gym|fitness/i, Dumbbell],
  [/secur|cctv|guard|gate|alarm|intercom/i, ShieldCheck],
  [/generator|backup|power|electric/i, Zap],
  [/borehole|water|tank/i, Droplets],
  [/lift|elevator/i, MoveVertical],
  [/wifi|internet|fibre|fiber|broadband/i, Wifi],
  [/garden|lawn|green|tree/i, TreePine],
  [/balcon|terrace|rooftop|solar|sun/i, Sun],
  [/pet|dog|cat/i, PawPrint],
  [/kid|child|play/i, Baby],
  [/dsq|servant|staff|store|study/i, DoorOpen],
  [/laundr|wash/i, WashingMachine],
  [/kitchen|cook|oven|fridge/i, Utensils],
  [/air ?con|ac\b|cool/i, Snowflake],
  [/tv|dstv|cable|satellite/i, Tv],
  [/furnish|wardrobe|sofa|closet/i, Sofa],
  [/bath|shower|ensuite|en-suite/i, Bath],
];
function amenityIcon(name: string) {
  return AMENITY_ICONS.find(([re]) => re.test(name))?.[1] ?? Check;
}

const card = 'rounded-[20px] border border-[#ececec] bg-[#fafafa] p-5 sm:p-6';
const cardTitle = 'mb-4 text-[16px] font-medium text-[#52525b]';

/**
 * A rental listing, laid out like an app detail screen: one large photo with
 * its thumbnails tucked into the corner, then soft panels — the key facts,
 * the description, the units you can take, what comes with them, plans,
 * film, the map — beside a contact card that stays in view.
 */
export default function RentListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: raw, isLoading, isError } = useQuery({
    queryKey: ['rent-listing', slug],
    queryFn: () => rentListingsApi.get(slug),
    enabled: !!slug,
  });
  const listing = raw ? toRentListing(raw as Raw) : null;
  const r = raw as Raw;

  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [modal, setModal] = useState<'VIEWING' | 'ENQUIRY' | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [plan, setPlan] = useState(0);
  const [copied, setCopied] = useState(false);
  const [mapShown, setMapShown] = useState(false);
  const { has, toggle } = useSavedRentals();

  const { data: floorPlans = [] } = useQuery({
    queryKey: ['floor-plans', listing?.propertySlug],
    queryFn: () => floorPlansApi.list(listing!.propertySlug),
    enabled: !!listing?.propertySlug,
  });

  // Photos: the listing's own, then the building's.
  const propertyMedia: { url: string; title?: string; type?: string }[] = r?.property?.media ?? [];
  const ownMedia: { url: string; title?: string; type?: string }[] = r?.media ?? [];
  const isPhoto = (m: { url: string; title?: string; type?: string }) => m?.url && m.title !== '__logo__' && (!m.type || m.type === 'PHOTO' || m.type === 'DRONE_PHOTO');
  const photos = [listing?.heroImageUrl, ...ownMedia.filter(isPhoto).map((m) => m.url), ...propertyMedia.filter(isPhoto).map((m) => m.url)]
    .filter((u, i, a): u is string => !!u && a.indexOf(u) === i);

  // One visit per page load; the rental's own numbers, not the building's.
  const listingId = listing?.id;
  useEffect(() => {
    if (listingId) track({ type: 'PAGE_VIEW', rentListingId: listingId });
  }, [listingId]);

  useEffect(() => {
    if (photos.length < 2 || lightbox !== null) return;
    const t = setInterval(() => setActive((x) => (x + 1) % photos.length), 7000);
    return () => clearInterval(t);
  }, [photos.length, lightbox]);

  if (isLoading) {
    return <Frame><div className="flex h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-[#9aa0a6]" /></div></Frame>;
  }
  if (isError || !listing) {
    return (
      <Frame>
        <div className="mx-auto max-w-md py-32 text-center">
          <p className="text-[18px] text-[#18181b]">This rental could not be found.</p>
          <Link href="/rent" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f2f2f2] px-4 py-2 text-[14px]"><ArrowLeft size={14} /> Back to rentals</Link>
        </div>
      </Frame>
    );
  }

  const units = listing.units ?? [];
  const totalAvailable = units.reduce((a, u) => a + (u.available ?? 0), 0);
  const totalUnits = units.reduce((a, u) => a + (u.total ?? 0), 0);
  const beds = range(units.map((u) => u.bedrooms), '', true);
  const baths = range(units.map((u) => u.bathrooms ?? 0));
  const size = range(units.map((u) => u.sqm ?? 0), ' m²');
  const property = r?.property ?? {};
  const videos: { url: string; poster?: string; label?: string }[] = [
    ...ownMedia.filter((m) => m.type === 'VIDEO').map((m) => ({ url: m.url, label: m.title })),
    ...(listing.showCinematicTour ? (property.cinematicScenes ?? []).filter((s: Raw) => s.videoUrl).map((s: Raw) => ({ url: s.videoUrl, poster: s.thumbnailUrl, label: s.label })) : []),
  ];
  const homeFeatures: string[] = [...new Set([...(units.flatMap((u) => u.features ?? [])), ...(property.unitFeatures ?? [])])] as string[];
  const buildingFeatures: string[] = [...new Set([...(property.features ?? []), ...(r?.features ?? [])])] as string[];
  const nearby: { id?: string; name: string; distance?: string }[] = property.amenities ?? [];
  const lat = r?.latitude ?? property.latitude;
  const lng = r?.longitude ?? property.longitude;
  const agent = r?.managerKind === 'AGENT' ? r?.managingAgent : null;
  // Links to the public profile, never a dashboard.
  const contact = agent
    ? { name: agent.displayName, role: 'Letting agent', image: agent.photoUrl || agent.logoUrl, href: `/agents/${agent.id}` }
    : r?.developer
      ? { name: r.developer.companyName, role: 'Developer', image: r.developer.logoUrl, href: r.developer.id ? `/developers/${r.developer.id}` : null }
      : null;
  // WhatsApp of whoever runs the letting: the agent, else the developer.
  const waRaw: string | null = agent ? (agent.whatsapp || null) : (r?.developer?.whatsapp || null);
  const phoneRaw: string | null = agent ? (agent.phone || null) : (r?.developer?.phone || null);
  const waDigits = waRaw ? waRaw.replace(/[^\d]/g, '').replace(/^0/, '254') : null;
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hi, I'm interested in ${listing.name} on e-resi: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`
    : null;
  const saved = has(listing.id);
  const where = [listing.address.neighborhood, listing.address.city].filter(Boolean).join(', ');
  const plans = floorPlans as { id: string; name: string; imageUrl: string; bedrooms?: number | null; bathrooms?: number | null; sqm?: number | null }[];

  async function share() {
    try {
      if (navigator.share) { await navigator.share({ title: listing!.name, url: location.href }); return; }
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* dismissed */ }
  }

  const facts = [
    { icon: BedDouble, value: beds ?? '—', label: beds === 'Studio' ? 'Layout' : 'Bedrooms' },
    { icon: Bath, value: baths ?? '—', label: 'Bathrooms' },
    { icon: Maximize2, value: size ?? '—', label: 'Size' },
    { icon: CalendarClock, value: `${listing.minLeaseTerm} mo`, label: 'Minimum lease' },
  ];

  return (
    <Frame>
      {/* ── Top row ── */}
      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => (history.length > 1 ? router.back() : router.push('/rent'))} aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f2f2f2] text-[#18181b] hover:bg-[#e8e8e8]">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={share} className="flex h-11 items-center gap-2 rounded-full bg-[#f2f2f2] px-4 text-[14px] text-[#18181b] hover:bg-[#e8e8e8]">
            {copied ? <Check size={16} /> : <Share2 size={16} />} <span className="hidden sm:inline">{copied ? 'Link copied' : 'Share'}</span>
          </button>
          <button onClick={() => toggle(listing.id)} aria-pressed={saved}
            className={cn('flex h-11 items-center gap-2 rounded-full px-4 text-[14px]', saved ? 'bg-[#fce8e6] text-[#d93025]' : 'bg-[#f2f2f2] text-[#18181b] hover:bg-[#e8e8e8]')}>
            <Heart size={16} className={saved ? 'fill-current' : ''} /> <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* ── Property info, above the photos ── */}
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[#18181b] px-3 py-1 text-[12px] font-medium text-white">{STATUS[listing.status] ?? 'For rent'}</span>
          <span className="rounded-full bg-[#f2f2f2] px-3 py-1 text-[12px] font-medium text-[#18181b]">{FURNISHING[listing.furnishing] ?? 'Rent'}</span>
        </div>
        <h1 className="text-[24px] font-medium leading-tight tracking-[-0.01em] text-[#18181b] sm:text-[30px]">{listing.name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          {listing.priceFrom > 0 && (
            <p className="text-[18px] font-medium text-[#18181b] sm:text-[20px]">
              {formatPrice(listing.priceFrom, listing.currency)}<span className="text-[14px] font-normal text-[#52525b]"> / month</span>
            </p>
          )}
          {where && <p className="flex items-center gap-1.5 text-[15px] text-[#52525b]"><MapPin size={15} className="text-[#9aa0a6]" /> {where}</p>}
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="relative h-[340px] overflow-hidden rounded-[24px] bg-[#18181b] sm:h-[520px]">
        {photos.length ? (
          photos.map((p, i) => (
            <button key={p} onClick={() => setLightbox(i)} aria-label="Open photos"
              className={cn('absolute inset-0 transition-opacity duration-700', i === active ? 'opacity-100' : 'pointer-events-none opacity-0')}>
              <Image src={p} alt={listing.name} fill priority={i === 0} className="object-cover" sizes="(max-width: 1024px) 100vw, 75vw" />
            </button>
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-white/40"><Building2 size={44} strokeWidth={1.2} /></div>
        )}

        <div className="pointer-events-none absolute bottom-4 right-4 flex gap-2 sm:bottom-5 sm:right-5">
          <div className="pointer-events-auto flex gap-2">
            {property.slug && property.has3DTour && (
              <Link href={`/${property.slug}/tour/3d`} className="flex h-10 items-center gap-1.5 rounded-full bg-white/90 px-4 text-[13.5px] text-[#18181b] shadow-sm backdrop-blur-sm hover:bg-white">
                <Box size={15} /> 3D tour
              </Link>
            )}
            {photos.length > 0 && (
              <button onClick={() => setLightbox(active)} className="flex h-10 items-center gap-1.5 rounded-full bg-white/90 px-4 text-[13.5px] text-[#18181b] shadow-sm backdrop-blur-sm hover:bg-white">
                <Images size={15} /> {photos.length}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Thumbnails: tap one to show it above ── */}
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((p, i) => (
            <button key={p} onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`} aria-current={i === active}
              className={cn('relative h-16 w-[88px] shrink-0 overflow-hidden rounded-xl transition-opacity sm:h-20 sm:w-28',
                i === active ? 'ring-2 ring-[#18181b] ring-offset-2' : 'opacity-70 hover:opacity-100')}>
              <Image src={p} alt="" fill className="object-cover" sizes="112px" />
            </button>
          ))}
        </div>
      )}

      {/* ── Body ── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {/* Facts */}
          <div className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-[#ececec] bg-[#fafafa] sm:grid-cols-4">
            {facts.map((f, i) => (
              <div key={f.label} className={cn('flex items-center gap-3 px-5 py-4', i % 2 === 1 && 'border-l border-[#ececec]', i > 1 && 'border-t border-[#ececec] sm:border-t-0', i === 2 && 'sm:border-l')}>
                <f.icon size={20} strokeWidth={1.6} className="shrink-0 text-[#9aa0a6]" />
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-medium tracking-[-0.01em] text-[#18181b]">{f.value}</p>
                  <p className="text-[13px] font-medium text-[#52525b]">{f.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <section className={card}>
            <p className={cardTitle}>Description</p>
            <p className="whitespace-pre-line text-[16px] leading-[1.6] text-[#18181b]">
              {listing.description || listing.tagline || `${listing.name} offers ${beds ?? ''} homes to rent${where ? ` in ${where}` : ''}.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'Rent',
                FURNISHING[listing.furnishing],
                listing.address.neighborhood,
                listing.availableFrom && new Date(listing.availableFrom) > new Date()
                  ? `From ${new Date(listing.availableFrom).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
                  : 'Move in now',
                ...listing.tags.map((t) => t.replace(/-/g, ' ')),
              ].filter(Boolean).map((t) => (
                <span key={t as string} className="rounded-full border border-[#e3e3e3] bg-white px-3.5 py-1.5 text-[13px] font-medium capitalize text-[#3f3f46]">{t}</span>
              ))}
            </div>
          </section>

          {/* Units */}
          {units.length > 0 && (
            <section className={card}>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <p className="text-[16px] font-medium text-[#52525b]">Units to rent</p>
                <p className="text-[13.5px] font-medium text-[#52525b]"><span className="font-medium text-[#18181b]">{totalAvailable}</span> of {totalUnits} available</p>
              </div>
              <div className="space-y-3">
                {units.map((u) => <UnitRow key={u.id} unit={u} propertySlug={listing.propertySlug} />)}
              </div>
            </section>
          )}

          {/* Amenities */}
          {(homeFeatures.length > 0 || buildingFeatures.length > 0) && (
            <section className={card}>
              <p className={cardTitle}>Amenities & features</p>
              {[
                { title: 'In the home', items: homeFeatures },
                { title: 'In the building', items: buildingFeatures },
              ].filter((g) => g.items.length).map((g, gi) => (
                <div key={g.title} className={gi ? 'mt-5' : ''}>
                  {homeFeatures.length > 0 && buildingFeatures.length > 0 && <p className="mb-2.5 text-[13px] font-medium uppercase tracking-[0.06em] text-[#9aa0a6]">{g.title}</p>}
                  <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                    {g.items.map((f) => {
                      const Icon = amenityIcon(f);
                      return (
                        <li key={f} className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 text-[15px] font-medium capitalize text-[#18181b]">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-[#18181b]">
                            <Icon size={17} strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0 truncate">{f.replace(/-/g, ' ')}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {/* Floor plans */}
          {plans.length > 0 && (
            <section className={card}>
              <p className={cardTitle}>Floor plans</p>
              {plans.length > 1 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {plans.map((p, i) => (
                    <button key={p.id} onClick={() => setPlan(i)}
                      className={cn('rounded-full px-4 py-1.5 text-[13.5px] transition-colors', i === plan ? 'bg-[#18181b] text-white' : 'border border-[#e3e3e3] bg-white text-[#3f3f46] hover:bg-[#f2f2f2]')}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {plans[plan] && (
                <>
                  <a href={plans[plan].imageUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl bg-white p-4 sm:p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={plans[plan].imageUrl} alt={plans[plan].name} className="mx-auto max-h-[480px] w-auto object-contain" />
                  </a>
                  <p className="mt-3 text-[13.5px] text-[#52525b]">
                    {[plans[plan].name,
                      plans[plan].bedrooms == null ? null : plans[plan].bedrooms === 0 ? 'Studio' : `${plans[plan].bedrooms} bed`,
                      plans[plan].bathrooms == null ? null : `${plans[plan].bathrooms} bath`,
                      plans[plan].sqm == null ? null : `${plans[plan].sqm} m²`].filter(Boolean).join(' · ')}
                  </p>
                </>
              )}
            </section>
          )}

          {/* Video */}
          {videos.length > 0 && (
            <section className={card}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#52525b]">Video</p>
                {property.slug && property.hasCinematicTour && (
                  <Link href={`/${property.slug}/tour/cinematic`} className="text-[13.5px] text-[#18181b] hover:underline">Full cinematic tour</Link>
                )}
              </div>
              <button onClick={() => setPlaying(videos[0].url)} className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-black">
                {videos[0].poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={videos[0].poster} alt="" className="h-full w-full object-cover opacity-90" />
                ) : (
                  <video src={`${videos[0].url}#t=1`} muted playsInline preload="metadata" className="h-full w-full object-cover opacity-90" />
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform group-hover:scale-105">
                    <Play size={24} className="ml-1 fill-current" />
                  </span>
                </span>
              </button>
              {videos.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {videos.slice(1).map((v) => (
                    <button key={v.url} onClick={() => setPlaying(v.url)} className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e3e3] bg-white px-3.5 py-1.5 text-[13px] text-[#3f3f46] hover:bg-[#f2f2f2]">
                      <Film size={13} /> {v.label || 'Video'}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Map + nearby */}
          {(lat && lng) || nearby.length || r?.hideExactLocation ? (
            <section className={card}>
              <p className={cardTitle}>Location</p>
              {lat && lng ? (
                <div className={cn('relative overflow-hidden rounded-2xl transition-all', mapShown ? 'h-[300px]' : 'h-[180px]')}>
                  <div className={cn('h-full w-full', !mapShown && 'pointer-events-none blur-[6px] scale-105')}>
                    <PropertyMiniMap latitude={lat} longitude={lng} label={listing.name} className="h-full w-full" />
                  </div>
                  {!mapShown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                      <button onClick={() => setMapShown(true)}
                        className="flex h-11 items-center gap-2 rounded-full bg-[#18181b] px-5 text-[14.5px] font-medium text-white shadow-lg hover:bg-black">
                        <Eye size={16} /> View location
                      </button>
                    </div>
                  )}
                </div>
              ) : r?.hideExactLocation ? (
                <div className="flex items-start gap-3 rounded-2xl bg-white p-4">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-[#1a73e8]" />
                  <div>
                    <p className="text-[15px] font-medium text-[#18181b]">{where || listing.address.city}</p>
                    <p className="mt-0.5 text-[14px] text-[#52525b]">The exact location is shared by the {agent ? 'agent' : 'landlord'} once you get in touch.</p>
                  </div>
                </div>
              ) : null}
              {nearby.length > 0 && (
                <ul className={cn('grid gap-x-6 gap-y-2.5 sm:grid-cols-2', lat && lng && 'mt-5')}>
                  {nearby.map((a) => (
                    <li key={a.id ?? a.name} className="flex items-center gap-2.5 text-[14.5px] text-[#18181b]">
                      <MapPin size={14} className="shrink-0 text-[#9aa0a6]" />
                      <span className="min-w-0 flex-1 truncate">{a.name}</span>
                      {a.distance && <span className="shrink-0 text-[13px] text-[#52525b]">{a.distance}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {/* House rules */}
          {(property.petsAllowed != null || property.leaseTerms) && (
            <section className={card}>
              <p className={cardTitle}>House rules</p>
              <div className="space-y-3 text-[15px] text-[#18181b]">
                {property.petsAllowed != null && (
                  <p className="flex items-start gap-2.5"><PawPrint size={16} className="mt-0.5 text-[#9aa0a6]" />
                    {property.petsAllowed ? 'Pets allowed' : 'No pets'}{property.petPolicy ? ` · ${property.petPolicy}` : ''}</p>
                )}
                {property.leaseTerms && (
                  <p className="flex items-start gap-2.5"><CalendarDays size={16} className="mt-0.5 text-[#9aa0a6]" /> {property.leaseTerms}</p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── Contact card ── */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[20px] border border-[#ececec] bg-[#fafafa] p-5">
            {contact && (
              <div className="flex items-center gap-3 border-b border-[#ececec] pb-4">
                <ContactLink href={contact.href} className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {contact.image ? <Image src={contact.image} alt="" fill className="object-cover" sizes="48px" unoptimized /> : <Building2 size={18} className="text-[#9aa0a6]" />}
                </ContactLink>
                <div className="min-w-0 flex-1">
                  <ContactLink href={contact.href} className="block truncate text-[18px] font-medium tracking-[-0.01em] text-[#18181b] hover:underline">{contact.name}</ContactLink>
                  <p className="text-[13px] text-[#52525b]">{contact.role}</p>
                </div>
                {contact.href && (
                  <Link href={contact.href} className="shrink-0 rounded-full border border-[#e3e3e3] bg-white px-3 py-1.5 text-[13px] font-medium text-[#18181b] hover:bg-[#f2f2f2]">
                    View profile
                  </Link>
                )}
              </div>
            )}
            <dl className={cn('space-y-2.5 text-[16px]', contact && 'pt-4')}>
              <div className="flex justify-between gap-3">
                <dt className="text-[#52525b]">Rent</dt>
                <dd className="text-right font-medium text-[#18181b]">
                  {listing.priceFrom > 0 ? formatPrice(listing.priceFrom, listing.currency) : 'On request'}
                  {listing.priceTo > listing.priceFrom && <span className="text-[#52525b]"> – {formatPrice(listing.priceTo, listing.currency)}</span>}
                  <span className="text-[#52525b]"> / mo</span>
                </dd>
              </div>
              {totalUnits > 0 && (
                <div className="flex justify-between gap-3"><dt className="text-[#52525b]">Available</dt><dd className="font-medium text-[#18181b]">{totalAvailable} of {totalUnits} units</dd></div>
              )}
              <div className="flex justify-between gap-3"><dt className="text-[#52525b]">Furnishing</dt><dd className="font-medium text-[#18181b]">{FURNISHING[listing.furnishing] ?? '—'}</dd></div>
              {listing.availableFrom && (
                <div className="flex justify-between gap-3"><dt className="text-[#52525b]">Move in</dt>
                  <dd className="font-medium text-[#18181b]">{new Date(listing.availableFrom) > new Date() ? new Date(listing.availableFrom).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Now'}</dd></div>
              )}
            </dl>
            <div className="mt-5 space-y-2">
              <button onClick={() => setModal('VIEWING')} className="w-full rounded-full bg-[#18181b] py-3 text-[14.5px] font-medium text-white hover:bg-black">Book a viewing</button>
              <div className="flex gap-2">
                <button onClick={() => setModal('ENQUIRY')} className="flex-1 rounded-full border border-[#e3e3e3] bg-white py-3 text-[14.5px] font-medium text-[#18181b] hover:bg-[#f2f2f2]">Send enquiry</button>
                <ChatWithDeveloper rentListingSlug={listing.slug} variant="icon" label={agent ? 'Chat with agent' : 'Chat'} />
              </div>
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer"
                  onClick={() => track({ type: 'CONTACT_CLICK', rentListingId: listing.id, metadata: { channel: 'whatsapp' } })}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] py-3 text-[14.5px] font-medium text-white hover:bg-[#1ebe5b]">
                  <WhatsAppIcon /> WhatsApp {agent ? 'the agent' : 'the developer'}
                </a>
              )}
              {phoneRaw && (
                <a href={`tel:${phoneRaw.replace(/\s/g, '')}`}
                  onClick={() => track({ type: 'CONTACT_CLICK', rentListingId: listing.id, metadata: { channel: 'phone' } })}
                  className="flex w-full items-center justify-center gap-2 py-1.5 text-[14px] font-medium text-[#18181b] hover:underline">
                  <Phone size={15} /> {phoneRaw}
                </a>
              )}
            </div>
          </div>

          {property.slug && (
            <Link href={`/${property.slug}`} className="flex items-center gap-3 rounded-[20px] border border-[#ececec] bg-[#fafafa] p-3 hover:bg-[#f4f4f4]">
              <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-[#efefef]">
                {property.heroImageUrl && <Image src={property.heroImageUrl} alt="" fill className="object-cover" sizes="64px" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] text-[#52525b]">Part of</span>
                <span className="block truncate text-[15px] font-medium text-[#18181b]">{property.name}</span>
              </span>
              <ArrowRight size={16} className="mr-1 text-[#9aa0a6]" />
            </Link>
          )}

          {property.slug && (property.hasCinematicTour || property.has3DTour || property.hasVRTour) && (
            <div className="rounded-[20px] border border-[#ececec] bg-[#fafafa] p-4">
              <p className="mb-2.5 text-[15px] font-medium text-[#18181b]">Tour it from home</p>
              <div className="flex flex-wrap gap-2">
                {property.hasCinematicTour && <TourChip href={`/${property.slug}/tour/cinematic`} icon={<Film size={14} />} label="Cinematic" />}
                {property.has3DTour && <TourChip href={`/${property.slug}/tour/3d`} icon={<Box size={14} />} label="3D" />}
                {property.hasVRTour && <TourChip href={`/${property.slug}/tour/vr`} icon={<View size={14} />} label="VR / 360°" />}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Phone booking bar (above the tab bar) ── */}
      <div className="fixed inset-x-0 bottom-[58px] z-30 flex items-center justify-between gap-3 border-t border-black/[0.06] bg-white px-4 py-2.5 lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-[15.5px] font-medium text-[#18181b]">{listing.priceFrom > 0 ? `${formatPrice(listing.priceFrom, listing.currency)} / mo` : 'Rent on request'}</p>
          <p className="truncate text-[12.5px] text-[#52525b]">{totalUnits ? `${totalAvailable} of ${totalUnits} available` : STATUS[listing.status]}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {waHref && (
            <a href={waHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              onClick={() => track({ type: 'CONTACT_CLICK', rentListingId: listing.id, metadata: { channel: 'whatsapp' } })}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25d366] text-white"><WhatsAppIcon /></a>
          )}
          <button onClick={() => setModal('VIEWING')} className="rounded-full bg-[#18181b] px-5 py-2.5 text-[14px] font-medium text-white">Book a viewing</button>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && photos[lightbox] && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} aria-label="Close" className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={18} /></button>
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + photos.length) % photos.length); }} aria-label="Previous"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ArrowLeft size={18} /></button>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % photos.length); }} aria-label="Next"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ArrowRight size={18} /></button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] text-white">{lightbox + 1} / {photos.length}</span>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[lightbox]} alt="" className="max-h-[86vh] max-w-[92vw] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {playing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4" onClick={() => setPlaying(null)}>
          <button onClick={() => setPlaying(null)} aria-label="Close video" className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={20} /></button>
          <video src={playing} controls autoPlay playsInline className="w-full max-w-5xl rounded-xl bg-black" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {modal && (
        <RentEnquiryModal mode={modal} listingId={listing.id} listingName={listing.name}
          propertySlug={listing.propertySlug || undefined} onClose={() => setModal(null)} />
      )}
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <RentShell><div className="pb-20 lg:pb-0">{children}</div></RentShell>
    </Suspense>
  );
}

function TourChip({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e3e3] bg-white px-3.5 py-1.5 text-[13.5px] text-[#18181b] hover:bg-[#f2f2f2]">
      {icon} {label}
    </Link>
  );
}

/** One unit type as a white row: what it is, how many are free, the rent, and reserve. */
function UnitRow({ unit, propertySlug }: { unit: RentUnit; propertySlug?: string }) {
  const soldOut = unit.available < 1;
  const pct = unit.total > 0 ? (unit.available / unit.total) * 100 : 0;
  const tours = [
    unit.showCinematicTour && { href: `/${propertySlug}/tour/cinematic`, label: 'Cinematic', icon: Film },
    unit.show3DTour && { href: `/${propertySlug}/tour/3d`, label: '3D', icon: Box },
    unit.showVRTour && { href: `/${propertySlug}/tour/vr`, label: 'VR', icon: View },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Film }[];

  return (
    <div className={cn('rounded-2xl bg-white p-4 sm:p-5', soldOut && 'opacity-60')}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-medium tracking-[-0.01em] text-[#18181b]">
            {unit.unitType || unit.label}
            {unit.unitType && unit.label !== unit.unitType && <span className="text-[#9aa0a6]"> · {unit.label}</span>}
            {unit.floor != null && <span className="text-[#9aa0a6]"> · {ordinalFloor(unit.floor)}</span>}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-[#52525b]">
            <span className="inline-flex items-center gap-1"><BedDouble size={14} /> {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}</span>
            {unit.bathrooms ? <span className="inline-flex items-center gap-1"><Bath size={14} /> {unit.bathrooms} bath</span> : null}
            {unit.sqm > 0 && <span className="inline-flex items-center gap-1"><Maximize2 size={14} /> {unit.sqm} m²</span>}
            {unit.furnishing && <span className="inline-flex items-center gap-1"><Sofa size={14} /> {FURNISHING[unit.furnishing] ?? unit.furnishing}</span>}
          </p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="h-1.5 w-28 overflow-hidden rounded-full bg-[#efefef]">
              <span className={cn('block h-full rounded-full', soldOut ? 'bg-[#d0d0d0]' : 'bg-[#18181b]')} style={{ width: `${Math.max(pct, 4)}%` }} />
            </span>
            <span className="text-[12.5px] text-[#52525b]">{soldOut ? 'Fully let' : `${unit.available} of ${unit.total} left`}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="text-[16px] font-medium text-[#18181b]">{formatPrice(unit.pricePerMonth, unit.currency)}<span className="text-[13px] text-[#52525b]"> / mo</span></p>
          <Reserve unit={unit} />
        </div>
      </div>
      {tours.length > 0 && propertySlug && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#f2f2f2] pt-3">
          {tours.map((t) => (
            <Link key={t.label} href={t.href} className="inline-flex items-center gap-1 rounded-full bg-[#f2f2f2] px-3 py-1 text-[12.5px] text-[#3f3f46] hover:bg-[#e8e8e8]">
              <t.icon size={12} /> {t.label} tour
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Reserve({ unit }: { unit: RentUnit }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const soldOut = unit.available < 1;

  async function reserve() {
    if (!isAuthenticated) { router.push(`/login?redirect=${encodeURIComponent(location.pathname)}`); return; }
    setError('');
    setBusy(true);
    try {
      // A reservation is the most valuable thing to credit back to the agent
      // who introduced the tenant.
      await apiClient.post(`/reservations/rent-units/${unit.id}`, referralPayload());
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reserve.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-4 py-2 text-[13px] text-[#137333]"><CheckCircle2 size={14} /> Reserved</span>;
  }
  return (
    <>
      <button onClick={reserve} disabled={busy || soldOut}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#18181b] px-4 py-2 text-[13px] font-medium text-white hover:bg-black disabled:opacity-40">
        {busy ? 'Reserving…' : soldOut ? 'Fully let' : <><KeyRound size={13} /> Reserve</>}
      </button>
      {error && <span className="text-[12px] text-[#d93025]">{error}</span>}
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.06-17.52A11.32 11.32 0 0 0 12.04.64C5.76.64.64 5.75.64 12.04c0 2.01.53 3.97 1.52 5.7L.55 23.62l6.03-1.58a11.37 11.37 0 0 0 5.45 1.39h.01c6.28 0 11.4-5.12 11.4-11.4 0-3.05-1.19-5.91-3.34-8.06z" />
    </svg>
  );
}

function ContactLink({ href, className, children }: { href?: string | null; className?: string; children: React.ReactNode }) {
  return href ? <Link href={href} className={className}>{children}</Link> : <span className={className}>{children}</span>;
}
