'use client';

import { Suspense, use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Bath, BedDouble, Box, Building2, CalendarClock, CalendarDays, Check, CheckCircle2,
  Film, Heart, Images, KeyRound, Loader2, MapPin, Maximize2, PawPrint, Play, Plus, Share2, Sofa, View, X,
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

const card = 'rounded-[20px] border border-[#ececec] bg-[#fafafa] p-5 sm:p-6';
const cardTitle = 'mb-4 text-[14px] text-[#5f6368]';

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
          <p className="text-[18px] text-[#1d1d1f]">This rental could not be found.</p>
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
  const buildingFeatures: string[] = property.features ?? [];
  const nearby: { id?: string; name: string; distance?: string }[] = property.amenities ?? [];
  const lat = r?.latitude ?? property.latitude;
  const lng = r?.longitude ?? property.longitude;
  const agent = r?.managerKind === 'AGENT' ? r?.managingAgent : null;
  const contact = agent
    ? { name: agent.displayName, role: 'Letting agent', image: agent.photoUrl || agent.logoUrl }
    : r?.developer
      ? { name: r.developer.companyName, role: 'Developer', image: r.developer.logoUrl }
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
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f2f2f2] text-[#1d1d1f] hover:bg-[#e8e8e8]">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={share} className="flex h-11 items-center gap-2 rounded-full bg-[#f2f2f2] px-4 text-[14px] text-[#1d1d1f] hover:bg-[#e8e8e8]">
            {copied ? <Check size={16} /> : <Share2 size={16} />} <span className="hidden sm:inline">{copied ? 'Link copied' : 'Share'}</span>
          </button>
          <button onClick={() => toggle(listing.id)} aria-pressed={saved}
            className={cn('flex h-11 items-center gap-2 rounded-full px-4 text-[14px]', saved ? 'bg-[#fce8e6] text-[#d93025]' : 'bg-[#f2f2f2] text-[#1d1d1f] hover:bg-[#e8e8e8]')}>
            <Heart size={16} className={saved ? 'fill-current' : ''} /> <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="relative h-[340px] overflow-hidden rounded-[24px] bg-[#1d1d1f] sm:h-[520px]">
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
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {photos.length > 1 && (
          <div className="absolute right-0 top-0 hidden gap-1.5 rounded-bl-[20px] bg-white p-1.5 sm:flex">
            {photos.slice(0, 4).map((p, i) => (
              <button key={p} onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`}
                className={cn('relative h-14 w-[74px] overflow-hidden rounded-xl transition-opacity', i === active ? 'ring-2 ring-[#1d1d1f]' : 'opacity-75 hover:opacity-100')}>
                <Image src={p} alt="" fill className="object-cover" sizes="74px" />
              </button>
            ))}
            {photos.length > 4 && (
              <button onClick={() => setLightbox(4)} className="flex h-14 w-[74px] items-center justify-center rounded-xl bg-[#f2f2f2] text-[13.5px] text-[#1d1d1f] hover:bg-[#e8e8e8]">
                +{photos.length - 4}
              </button>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4 sm:bottom-7 sm:left-7 sm:right-7">
          <div className="min-w-0 text-white">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white px-3 py-1 text-[12.5px] text-[#1d1d1f]">{STATUS[listing.status] ?? 'For rent'}</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[12.5px] backdrop-blur-sm">{FURNISHING[listing.furnishing] ?? 'Rent'}</span>
            </div>
            <h1 className="text-[26px] font-normal leading-tight tracking-[-0.01em] sm:text-[34px]">
              {listing.name}
              {listing.priceFrom > 0 && (
                <span className="text-white/85"> · {formatPrice(listing.priceFrom, listing.currency)}<span className="text-[0.6em] text-white/70"> / month</span></span>
              )}
            </h1>
            {where && <p className="mt-1 flex items-center gap-1.5 text-[15px] text-white/80"><MapPin size={15} /> {where}</p>}
          </div>
          <div className="pointer-events-auto flex gap-2">
            {property.slug && property.has3DTour && (
              <Link href={`/${property.slug}/tour/3d`} className="flex h-10 items-center gap-1.5 rounded-full bg-white/20 px-4 text-[13.5px] text-white backdrop-blur-sm hover:bg-white/30">
                <Box size={15} /> 3D tour
              </Link>
            )}
            {photos.length > 0 && (
              <button onClick={() => setLightbox(active)} className="flex h-10 items-center gap-1.5 rounded-full bg-white/20 px-4 text-[13.5px] text-white backdrop-blur-sm hover:bg-white/30">
                <Images size={15} /> {photos.length}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {/* Facts */}
          <div className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-[#ececec] bg-[#fafafa] sm:grid-cols-4">
            {facts.map((f, i) => (
              <div key={f.label} className={cn('flex items-center gap-3 px-5 py-4', i % 2 === 1 && 'border-l border-[#ececec]', i > 1 && 'border-t border-[#ececec] sm:border-t-0', i === 2 && 'sm:border-l')}>
                <f.icon size={20} strokeWidth={1.6} className="shrink-0 text-[#9aa0a6]" />
                <div className="min-w-0">
                  <p className="truncate text-[16px] text-[#1d1d1f]">{f.value}</p>
                  <p className="text-[12.5px] text-[#5f6368]">{f.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <section className={card}>
            <p className={cardTitle}>Description</p>
            <p className="whitespace-pre-line text-[15.5px] leading-[1.7] text-[#3c4043]">
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
                <span key={t as string} className="rounded-full border border-[#e3e3e3] bg-white px-3.5 py-1.5 text-[13px] capitalize text-[#3c4043]">{t}</span>
              ))}
            </div>
          </section>

          {/* Units */}
          {units.length > 0 && (
            <section className={card}>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <p className="text-[14px] text-[#5f6368]">Units to rent</p>
                <p className="text-[13.5px] text-[#5f6368]"><span className="text-[#1d1d1f]">{totalAvailable}</span> of {totalUnits} available</p>
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
                  {homeFeatures.length > 0 && buildingFeatures.length > 0 && <p className="mb-2.5 text-[13px] text-[#9aa0a6]">{g.title}</p>}
                  <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                    {g.items.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-[15px] capitalize text-[#1d1d1f]">
                        <Plus size={14} className="shrink-0 text-[#1a73e8]" /> {f.replace(/-/g, ' ')}
                      </li>
                    ))}
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
                      className={cn('rounded-full px-4 py-1.5 text-[13.5px] transition-colors', i === plan ? 'bg-[#1d1d1f] text-white' : 'border border-[#e3e3e3] bg-white text-[#3c4043] hover:bg-[#f2f2f2]')}>
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
                  <p className="mt-3 text-[13.5px] text-[#5f6368]">
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
                <p className="text-[14px] text-[#5f6368]">Video</p>
                {property.slug && property.hasCinematicTour && (
                  <Link href={`/${property.slug}/tour/cinematic`} className="text-[13.5px] text-[#1d1d1f] hover:underline">Full cinematic tour</Link>
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
                    <button key={v.url} onClick={() => setPlaying(v.url)} className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e3e3] bg-white px-3.5 py-1.5 text-[13px] text-[#3c4043] hover:bg-[#f2f2f2]">
                      <Film size={13} /> {v.label || 'Video'}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Map + nearby */}
          {(lat && lng) || nearby.length ? (
            <section className={card}>
              <p className={cardTitle}>Location</p>
              {lat && lng ? (
                <div className="h-[300px] overflow-hidden rounded-2xl">
                  <PropertyMiniMap latitude={lat} longitude={lng} label={listing.name} className="h-full w-full" />
                </div>
              ) : null}
              {nearby.length > 0 && (
                <ul className={cn('grid gap-x-6 gap-y-2.5 sm:grid-cols-2', lat && lng && 'mt-5')}>
                  {nearby.map((a) => (
                    <li key={a.id ?? a.name} className="flex items-center gap-2.5 text-[14.5px] text-[#1d1d1f]">
                      <MapPin size={14} className="shrink-0 text-[#9aa0a6]" />
                      <span className="min-w-0 flex-1 truncate">{a.name}</span>
                      {a.distance && <span className="shrink-0 text-[13px] text-[#5f6368]">{a.distance}</span>}
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
              <div className="space-y-3 text-[15px] text-[#1d1d1f]">
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
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {contact.image ? <Image src={contact.image} alt="" fill className="object-cover" sizes="48px" unoptimized /> : <Building2 size={18} className="text-[#9aa0a6]" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[16px] text-[#1d1d1f]">{contact.name}</p>
                  <p className="text-[13px] text-[#5f6368]">{contact.role}</p>
                </div>
              </div>
            )}
            <dl className={cn('space-y-2.5 text-[14px]', contact && 'pt-4')}>
              <div className="flex justify-between gap-3">
                <dt className="text-[#5f6368]">Rent</dt>
                <dd className="text-right text-[#1d1d1f]">
                  {listing.priceFrom > 0 ? formatPrice(listing.priceFrom, listing.currency) : 'On request'}
                  {listing.priceTo > listing.priceFrom && <span className="text-[#5f6368]"> – {formatPrice(listing.priceTo, listing.currency)}</span>}
                  <span className="text-[#5f6368]"> / mo</span>
                </dd>
              </div>
              {totalUnits > 0 && (
                <div className="flex justify-between gap-3"><dt className="text-[#5f6368]">Available</dt><dd className="text-[#1d1d1f]">{totalAvailable} of {totalUnits} units</dd></div>
              )}
              <div className="flex justify-between gap-3"><dt className="text-[#5f6368]">Furnishing</dt><dd className="text-[#1d1d1f]">{FURNISHING[listing.furnishing] ?? '—'}</dd></div>
              {listing.availableFrom && (
                <div className="flex justify-between gap-3"><dt className="text-[#5f6368]">Move in</dt>
                  <dd className="text-[#1d1d1f]">{new Date(listing.availableFrom) > new Date() ? new Date(listing.availableFrom).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Now'}</dd></div>
              )}
            </dl>
            <div className="mt-5 space-y-2">
              <button onClick={() => setModal('VIEWING')} className="w-full rounded-full bg-[#1d1d1f] py-3 text-[14.5px] text-white hover:bg-black">Book a viewing</button>
              <div className="flex gap-2">
                <button onClick={() => setModal('ENQUIRY')} className="flex-1 rounded-full border border-[#e3e3e3] bg-white py-3 text-[14.5px] text-[#1d1d1f] hover:bg-[#f2f2f2]">Send enquiry</button>
                <ChatWithDeveloper rentListingSlug={listing.slug} variant="icon" label={agent ? 'Chat with agent' : 'Chat'} />
              </div>
            </div>
          </div>

          {property.slug && (
            <Link href={`/${property.slug}`} className="flex items-center gap-3 rounded-[20px] border border-[#ececec] bg-[#fafafa] p-3 hover:bg-[#f4f4f4]">
              <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-[#efefef]">
                {property.heroImageUrl && <Image src={property.heroImageUrl} alt="" fill className="object-cover" sizes="64px" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] text-[#5f6368]">Part of</span>
                <span className="block truncate text-[15px] text-[#1d1d1f]">{property.name}</span>
              </span>
              <ArrowRight size={16} className="mr-1 text-[#9aa0a6]" />
            </Link>
          )}

          {property.slug && (property.hasCinematicTour || property.has3DTour || property.hasVRTour) && (
            <div className="rounded-[20px] border border-[#ececec] bg-[#fafafa] p-4">
              <p className="mb-2.5 text-[14px] text-[#5f6368]">Tour it from home</p>
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
          <p className="truncate text-[15.5px] text-[#1d1d1f]">{listing.priceFrom > 0 ? `${formatPrice(listing.priceFrom, listing.currency)} / mo` : 'Rent on request'}</p>
          <p className="truncate text-[12.5px] text-[#5f6368]">{totalUnits ? `${totalAvailable} of ${totalUnits} available` : STATUS[listing.status]}</p>
        </div>
        <button onClick={() => setModal('VIEWING')} className="shrink-0 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] text-white">Book a viewing</button>
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
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e3e3] bg-white px-3.5 py-1.5 text-[13.5px] text-[#1d1d1f] hover:bg-[#f2f2f2]">
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
          <p className="text-[16px] text-[#1d1d1f]">
            {unit.unitType || unit.label}
            {unit.unitType && unit.label !== unit.unitType && <span className="text-[#9aa0a6]"> · {unit.label}</span>}
            {unit.floor != null && <span className="text-[#9aa0a6]"> · {ordinalFloor(unit.floor)}</span>}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-[#5f6368]">
            <span className="inline-flex items-center gap-1"><BedDouble size={14} /> {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}</span>
            {unit.bathrooms ? <span className="inline-flex items-center gap-1"><Bath size={14} /> {unit.bathrooms} bath</span> : null}
            {unit.sqm > 0 && <span className="inline-flex items-center gap-1"><Maximize2 size={14} /> {unit.sqm} m²</span>}
            {unit.furnishing && <span className="inline-flex items-center gap-1"><Sofa size={14} /> {FURNISHING[unit.furnishing] ?? unit.furnishing}</span>}
          </p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="h-1.5 w-28 overflow-hidden rounded-full bg-[#efefef]">
              <span className={cn('block h-full rounded-full', soldOut ? 'bg-[#d0d0d0]' : 'bg-[#1d1d1f]')} style={{ width: `${Math.max(pct, 4)}%` }} />
            </span>
            <span className="text-[12.5px] text-[#5f6368]">{soldOut ? 'Fully let' : `${unit.available} of ${unit.total} left`}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="text-[18px] text-[#1d1d1f]">{formatPrice(unit.pricePerMonth, unit.currency)}<span className="text-[13px] text-[#5f6368]"> / mo</span></p>
          <Reserve unit={unit} />
        </div>
      </div>
      {tours.length > 0 && propertySlug && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#f2f2f2] pt-3">
          {tours.map((t) => (
            <Link key={t.label} href={t.href} className="inline-flex items-center gap-1 rounded-full bg-[#f2f2f2] px-3 py-1 text-[12.5px] text-[#3c4043] hover:bg-[#e8e8e8]">
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
        className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] text-white hover:bg-black disabled:opacity-40">
        {busy ? 'Reserving…' : soldOut ? 'Fully let' : <><KeyRound size={13} /> Reserve</>}
      </button>
      {error && <span className="text-[12px] text-[#d93025]">{error}</span>}
    </>
  );
}
