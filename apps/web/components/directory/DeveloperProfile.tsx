'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, MapPin, Phone, Mail, Globe, ArrowLeft, ArrowRight, ChevronDown, Loader2, X,
} from 'lucide-react';
import { developersApi, type DeveloperPropertyPreview, type DeveloperProfileDetail } from '../../lib/api/developers';
import { formatPrice, formatPriceRange, cn } from '../../lib/utils';
import { WhatsAppIcon } from './WhatsAppIcon';
import { InstagramIcon, FacebookIcon, TwitterIcon, LinkedinIcon } from './SocialIcons';
import { PartnersStrip } from './PartnersStrip';

/*
 * The developer page as the developer's own website: its own header and menu,
 * a full-screen hero, centred uppercase section headings, full-bleed bands for
 * each development, and a dark enquiry band and footer. Content and links are
 * e-resi's; the presentation borrows from luxury developer sites.
 */

const SERIF = 'font-[family-name:var(--font-marcellus)]';
const NAVY = 'text-[#0a0a3d]';
const GOLD = 'text-[#a2865a]';

function waLink(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}`;
}
function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
} as const;

function categoryLabel(category: string) {
  const s = category.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Admin-boundary suffixes ("Kilimani ward") read as data, not a place name. */
function areaName(p: DeveloperPropertyPreview) {
  const n = p.neighborhood?.replace(/\s+(ward|sub-?county|constituency)$/i, '').trim();
  return n || p.city;
}
function whereLabel(p: DeveloperPropertyPreview) {
  const a = areaName(p);
  return a === p.city ? p.city : `${a}, ${p.city}`;
}
function priceLabel(p: DeveloperPropertyPreview) {
  if (!p.priceFrom || p.priceFrom <= 0) return null;
  if (p.priceTo && p.priceTo > p.priceFrom) return formatPriceRange(p.priceFrom, p.priceTo, p.currency);
  return `From ${formatPrice(p.priceFrom, p.currency)}`;
}

interface Place {
  key: string;
  area: string;
  city: string;
  imageUrl: string | null;
  count: number;
  minPrice: { amount: number; currency: string } | null;
}

const placeKeyOf = (p: DeveloperPropertyPreview) => `${areaName(p)}|${p.city}`.toLowerCase();

function groupPlaces(properties: DeveloperPropertyPreview[]): Place[] {
  const map = new Map<string, Place>();
  for (const p of properties) {
    const key = placeKeyOf(p);
    const place = map.get(key) ?? { key, area: areaName(p), city: p.city, imageUrl: null, count: 0, minPrice: null };
    place.count += 1;
    place.imageUrl ??= p.heroImageUrl;
    if (p.priceFrom && p.priceFrom > 0) {
      if (!place.minPrice || (place.minPrice.currency === p.currency && p.priceFrom < place.minPrice.amount)) {
        place.minPrice = { amount: p.priceFrom, currency: p.currency };
      }
    }
    map.set(key, place);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ───────────────────────── shared pieces ───────────────────────── */

function SectionHeading({
  eyebrow, title, intro, light,
}: { eyebrow: string; title: string; intro?: React.ReactNode; light?: boolean }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className={cn('text-[12px] font-medium uppercase tracking-[0.28em]', light ? 'text-[#c9b48c]' : GOLD)}>{eyebrow}</p>
      <h2
        className={cn(
          SERIF,
          'mt-4 text-balance text-[30px] uppercase leading-[1.12] tracking-[0.02em] sm:text-[44px] lg:text-[48px]',
          light ? 'text-white' : NAVY,
        )}
      >
        {title}
      </h2>
      {intro && (
        <div className={cn('mx-auto mt-5 max-w-[56ch] text-[15.5px] leading-[1.8]', light ? 'text-white/75' : 'text-[#0a0a3d]/80')}>
          {intro}
        </div>
      )}
    </div>
  );
}

function SquareButton({
  children, onClick, href, variant = 'dark', external,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'dark' | 'ghost' | 'light' | 'outline';
  external?: boolean;
}) {
  const cls = cn(
    'inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.16em] transition-colors',
    variant === 'dark' && 'bg-[#0a0a3d] text-white hover:bg-[#1c1c5c]',
    variant === 'ghost' && 'border border-white/25 bg-black/35 text-white backdrop-blur-sm hover:bg-white hover:text-[#0a0a3d]',
    variant === 'light' && 'bg-white text-[#0a0a3d] hover:bg-[#ece7dd]',
    variant === 'outline' && 'border border-[#0a0a3d]/25 text-[#0a0a3d] hover:border-[#0a0a3d]',
  );
  if (href) {
    const isInternal = href.startsWith('/');
    if (isInternal) return <Link href={href} className={cls}>{children}</Link>;
    return (
      <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}>
        {children}
      </a>
    );
  }
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/** Bulleted descriptions ("• Founded: 2014 by …") become labelled rows; prose stays prose. */
function Story({ text }: { text: string }) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const bullet = /^[•\-*–·]\s*/;
  const isList = lines.length > 1 && lines.filter((l) => bullet.test(l)).length >= lines.length / 2;

  if (!isList) {
    return (
      <div className="mx-auto max-w-[60ch] space-y-5 text-center">
        {lines.map((l, i) => (
          <p key={i} className="text-[16px] leading-[1.85] text-[#0a0a3d]/80">{l}</p>
        ))}
      </div>
    );
  }

  return (
    <dl className="mx-auto grid max-w-5xl gap-px overflow-hidden bg-[#0a0a3d]/10 sm:grid-cols-2 lg:grid-cols-3">
      {lines.map((raw, i) => {
        const line = raw.replace(bullet, '');
        const m = line.match(/^([^:]{2,32}):\s*(.+)$/);
        return (
          <div key={i} className="bg-white px-6 py-7 text-center sm:px-8">
            {m && <dt className={cn('text-[11.5px] font-medium uppercase tracking-[0.24em]', GOLD)}>{m[1]}</dt>}
            <dd className="mt-3 text-[15px] leading-[1.75] text-[#0a0a3d]/85">{m ? m[2] : line}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/* ───────────────────────── header + menu ───────────────────────── */

function SiteHeader({
  developer, onEnquire, sections,
}: {
  developer: DeveloperProfileDetail;
  onEnquire: () => void;
  sections: { id: string; label: string }[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const solid = scrolled && !open;

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
          solid ? 'bg-white/95 shadow-[0_1px_0_rgba(10,10,61,0.08)] backdrop-blur' : 'bg-gradient-to-b from-black/45 to-transparent',
        )}
      >
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:h-[72px] sm:px-8">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className={cn('flex h-10 w-10 items-center justify-start', solid ? 'text-[#0a0a3d]' : 'text-white')}
          >
            {open ? (
              <X size={22} strokeWidth={1.5} />
            ) : (
              <span className="flex w-[22px] flex-col gap-[6px]">
                <span className="h-px w-full bg-current" />
                <span className="h-px w-full bg-current" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex min-w-0 items-center justify-center gap-3"
            aria-label={`${developer.companyName} — back to top`}
          >
            {developer.logoUrl && (
              <span className="relative h-9 w-9 shrink-0 overflow-hidden bg-white">
                <Image src={developer.logoUrl} alt="" fill sizes="36px" className="object-contain p-0.5" />
              </span>
            )}
            <span
              className={cn(
                SERIF,
                'truncate text-[17px] uppercase tracking-[0.32em] sm:text-[20px]',
                solid ? 'text-[#0a0a3d]' : 'text-white',
              )}
            >
              {developer.companyName}
            </span>
          </button>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onEnquire}
              className={cn(
                'px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.14em] transition-colors sm:px-5',
                solid ? 'bg-[#0a0a3d] text-white hover:bg-[#1c1c5c]' : 'bg-black/40 text-white backdrop-blur-sm hover:bg-white hover:text-[#0a0a3d]',
              )}
            >
              Enquire
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen menu */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-[#0d0d14] transition-opacity duration-300',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!open}
      >
        <nav className="mx-auto flex h-full max-w-[1440px] flex-col justify-between px-6 pb-10 pt-28 sm:px-12">
          <ul className="space-y-2 sm:space-y-3">
            {sections.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => {
                    setOpen(false);
                    setTimeout(() => scrollToId(s.id), 50);
                  }}
                  className={cn(
                    SERIF,
                    'group flex items-baseline gap-5 text-left text-[38px] uppercase leading-tight tracking-[0.02em] text-white/85 transition-colors hover:text-white sm:text-[60px]',
                  )}
                >
                  <span className="font-sans text-[12px] tracking-[0.2em] text-[#c9b48c] tabular-nums">0{i + 1}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end justify-between gap-6 border-t border-white/10 pt-6 text-[13px] text-white/55">
            <Link
              href="/developers"
              tabIndex={open ? 0 : -1}
              className="inline-flex items-center gap-2 uppercase tracking-[0.16em] transition-colors hover:text-white"
            >
              <ArrowLeft size={14} /> All developers on e-resi
            </Link>
            {developer.website && (
              <a
                href={developer.website}
                target="_blank"
                rel="noreferrer noopener"
                tabIndex={open ? 0 : -1}
                className="uppercase tracking-[0.16em] transition-colors hover:text-white"
              >
                {developer.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}

/* ───────────────────────── page ───────────────────────── */

export function DeveloperProfilePage({ profileId }: { profileId: string }) {
  const { data: developer, isLoading, isError } = useQuery({
    queryKey: ['developer-profile', profileId],
    queryFn: () => developersApi.get(profileId),
  });
  const [placeFilter, setPlaceFilter] = useState<string | null>(null);

  const properties = useMemo(() => developer?.properties ?? [], [developer]);
  const places = useMemo(() => groupPlaces(properties), [properties]);
  const shown = placeFilter ? properties.filter((p) => placeKeyOf(p) === placeFilter) : properties;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d14]">
        <Loader2 size={24} className="animate-spin text-white/50" />
      </div>
    );
  }

  if (isError || !developer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Building2 size={32} className="text-[#c9c3ba]" />
        <p className="text-[15px] text-[#6b665f]">This developer couldn&apos;t be found.</p>
        <Link href="/developers" className="text-[14px] font-medium text-[#0a0a3d] underline">
          Back to all developers
        </Link>
      </div>
    );
  }

  const socialLinks = developer.socials
    ? (Object.entries(developer.socials) as [keyof typeof SOCIAL_ICONS, string | undefined][])
        .filter(([key, url]) => url && key in SOCIAL_ICONS)
    : [];
  const withImages = properties.filter((p) => p.heroImageUrl);
  const featured = withImages[0] ?? properties[0] ?? null;
  // A second image for the closing band where there is one; otherwise the featured one again.
  const closingImage = (withImages[1] ?? withImages[0])?.heroImageUrl ?? null;
  const cities = [...new Set(properties.map((p) => p.city).filter(Boolean))];
  const placeSummary = places.slice(0, 3).map((p) => (p.area === p.city ? p.city : `${p.area}, ${p.city}`));

  const stats = [
    developer.establishedYear && { label: 'Established', value: String(developer.establishedYear) },
    developer.completedProjects > 0 && { label: 'Projects completed', value: String(developer.completedProjects) },
    { label: properties.length === 1 ? 'Live development' : 'Live developments', value: String(properties.length).padStart(2, '0') },
    places.length > 0 && {
      label: cities.length > 1 ? 'Cities' : places.length === 1 ? 'Destination' : 'Destinations',
      value: String(cities.length > 1 ? cities.length : places.length).padStart(2, '0'),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  const sections = [
    { id: 'story', label: 'Our story' },
    ...(places.length > 0 ? [{ id: 'destinations', label: 'Destinations' }] : []),
    { id: 'developments', label: 'Developments' },
    { id: 'enquire', label: 'Enquire' },
  ];

  const pickPlace = (key: string | null) => {
    setPlaceFilter(key);
    if (key) setTimeout(() => scrollToId('developments'), 30);
  };

  return (
    <div className="bg-white text-[#0a0a3d]">
      <SiteHeader developer={developer} sections={sections} onEnquire={() => scrollToId('enquire')} />

      {/* ── Hero ── */}
      <section className="relative isolate flex h-[100svh] min-h-[560px] items-center justify-center overflow-hidden bg-[#0d0d14]">
        {featured?.heroImageUrl && (
          <Image
            src={featured.heroImageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover motion-safe:animate-[dp-zoom_14s_ease-out_forwards]"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />

        <div className="relative mx-auto max-w-5xl px-5 text-center">
          <p className="text-[12px] font-medium uppercase tracking-[0.34em] text-white/75">Property developer</p>
          <h1 className={cn(SERIF, 'mt-5 text-balance text-[44px] uppercase leading-[1.02] tracking-[0.06em] text-white sm:text-[80px] lg:text-[104px]')}>
            {developer.companyName}
          </h1>
          {placeSummary.length > 0 && (
            <p className="mx-auto mt-6 max-w-[52ch] text-[15px] leading-relaxed text-white/80 sm:text-[16px]">
              Building in {placeSummary.join(' · ')}
              {places.length > 3 && ` and ${places.length - 3} more`}
            </p>
          )}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <SquareButton variant="ghost" onClick={() => scrollToId('developments')}>
              Explore developments
            </SquareButton>
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollToId('story')}
          aria-label="Scroll to our story"
          className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/70 transition-colors hover:text-white"
        >
          Scroll
          <ChevronDown size={18} strokeWidth={1.5} className="animate-bounce" />
        </button>
      </section>

      {/* ── Our story + numbers ── */}
      <section id="story" className="scroll-mt-16 px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeading
          eyebrow="Our story"
          title={`About ${developer.companyName}`}
          intro={
            !developer.description
              ? `${developer.companyName} has ${properties.length} live ${properties.length === 1 ? 'development' : 'developments'} on e-resi.`
              : undefined
          }
        />
        {developer.description && (
          <div className="mt-12">
            <Story text={developer.description} />
          </div>
        )}

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-y-10 sm:mt-20 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border-l-[1.5px] border-[#0a0a3d]/25 pl-5 sm:pl-6">
              <p className={cn(SERIF, 'text-[44px] leading-none tabular-nums sm:text-[60px]', NAVY)}>{s.value}</p>
              <p className="mt-3 text-[13px] text-[#0a0a3d]/60">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Destinations ── */}
      {places.length > 0 && (
        <section id="destinations" className="scroll-mt-16 bg-[#f7f5f1] px-5 py-20 sm:px-8 sm:py-28">
          <SectionHeading
            eyebrow="Destinations"
            title={`Where ${developer.companyName} builds`}
            intro={
              places.length > 1
                ? 'Choose a destination to see the developments there.'
                : `Every ${developer.companyName} development on e-resi, by location.`
            }
          />
          <div
            className={cn(
              'mx-auto mt-12 grid gap-4 sm:mt-14',
              places.length === 1 ? 'max-w-xl' : places.length === 2 ? 'max-w-4xl sm:grid-cols-2' : 'max-w-6xl sm:grid-cols-2 lg:grid-cols-3',
            )}
          >
            {places.map((place) => {
              const active = placeFilter === place.key;
              return (
                <button
                  key={place.key}
                  type="button"
                  onClick={() => pickPlace(active ? null : place.key)}
                  aria-pressed={active}
                  className="group relative block aspect-[4/5] w-full overflow-hidden bg-[#1a1a24] text-left sm:aspect-[4/5]"
                >
                  {place.imageUrl && (
                    <Image
                      src={place.imageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                    />
                  )}
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />
                  {active && <div aria-hidden="true" className="absolute inset-3 border border-white/80" />}
                  <div className="absolute inset-x-0 bottom-0 p-7 text-center">
                    <p className="text-[11.5px] uppercase tracking-[0.28em] text-white/70">{place.city}</p>
                    <p className={cn(SERIF, 'mt-2 text-[30px] uppercase leading-tight tracking-[0.04em] text-white sm:text-[34px]')}>
                      {place.area}
                    </p>
                    <p className="mt-2 text-[13px] text-white/75">
                      {place.count} development{place.count === 1 ? '' : 's'}
                      {place.minPrice && <> · from {formatPrice(place.minPrice.amount, place.minPrice.currency)}</>}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Developments ── */}
      <section id="developments" className="scroll-mt-16 pt-20 sm:pt-28">
        <div className="px-5 sm:px-8">
          <SectionHeading
            eyebrow="Portfolio"
            title="Our developments"
            intro="Step inside each development for units, pricing, virtual tours and documents, or enquire directly with the sales team."
          />
          {places.length > 1 && (
            <div className="mx-auto mt-10 flex max-w-full flex-wrap justify-center gap-2">
              <FilterChip active={!placeFilter} onClick={() => setPlaceFilter(null)}>All</FilterChip>
              {places.map((place) => (
                <FilterChip key={place.key} active={placeFilter === place.key} onClick={() => setPlaceFilter(place.key)}>
                  {place.area}
                </FilterChip>
              ))}
            </div>
          )}
        </div>

        {properties.length === 0 ? (
          <div className="mx-5 mt-12 flex flex-col items-center justify-center gap-3 border border-dashed border-[#0a0a3d]/20 py-20 text-center sm:mx-8">
            <Building2 size={28} className="text-[#c9c3ba]" />
            <p className="text-[14.5px] text-[#0a0a3d]/60">No live developments yet.</p>
          </div>
        ) : (
          <div className="mt-14 sm:mt-16">
            {shown.map((p, i) => (
              <DevelopmentBand key={p.id} property={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── Agents ── */}
      <div className="mx-auto max-w-6xl px-5 pb-6 sm:px-8">
        <PartnersStrip side="developer" profileId={profileId} />
      </div>

      {/* ── Enquire + footer ── */}
      <section id="enquire" className="scroll-mt-16 bg-[#16161c] px-4 pb-10 pt-16 sm:px-8 sm:pt-20">
        <div className="relative mx-auto flex min-h-[460px] max-w-[1380px] items-center justify-center overflow-hidden px-5 py-16 text-center">
          {closingImage && (
            <Image src={closingImage} alt="" fill sizes="100vw" className="object-cover" />
          )}
          <div aria-hidden="true" className="absolute inset-0 bg-black/55" />
          <div className="relative max-w-2xl">
            <h2 className={cn(SERIF, 'text-balance text-[32px] uppercase leading-[1.1] tracking-[0.03em] text-white sm:text-[52px]')}>
              {featured ? `Discover ${featured.name}` : `Talk to ${developer.companyName}`}
            </h2>
            <p className="mx-auto mt-4 max-w-[48ch] text-[15px] leading-relaxed text-white/75">
              Enquire for more details, book a guided virtual tour, or request brochures and floor plans.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {featured && (
                <SquareButton variant="light" href={`/${featured.slug}`}>
                  Enquire now <ArrowRight size={15} />
                </SquareButton>
              )}
              {developer.whatsapp && (
                <SquareButton variant="ghost" href={waLink(developer.whatsapp)} external>
                  <WhatsAppIcon size={15} /> WhatsApp
                </SquareButton>
              )}
              {developer.phone && (
                <SquareButton variant="ghost" href={telLink(developer.phone)}>
                  <Phone size={15} /> Call
                </SquareButton>
              )}
            </div>
          </div>
        </div>

        <footer className="mx-auto max-w-[1380px] pt-16 text-center">
          <p className={cn(SERIF, 'text-[34px] uppercase tracking-[0.3em] text-white sm:text-[52px]')}>{developer.companyName}</p>

          {(developer.phone || developer.email || developer.website || developer.location) && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[14px] text-white/65">
              {developer.location && (
                <span className="inline-flex items-center gap-2"><MapPin size={14} /> {developer.location}</span>
              )}
              {developer.phone && (
                <a href={telLink(developer.phone)} className="inline-flex items-center gap-2 hover:text-white"><Phone size={14} /> {developer.phone}</a>
              )}
              {developer.email && (
                <a href={`mailto:${developer.email}`} className="inline-flex items-center gap-2 break-all hover:text-white"><Mail size={14} /> {developer.email}</a>
              )}
              {developer.website && (
                <a href={developer.website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 hover:text-white">
                  <Globe size={14} /> {developer.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              )}
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className="mt-7 flex items-center justify-center gap-2">
              {socialLinks.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={key}
                    className="flex h-10 w-10 items-center justify-center border border-white/15 text-white/75 transition-colors hover:border-white hover:text-white"
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          )}

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-[12.5px] text-white/45 sm:flex-row">
            <Link href="/developers" className="inline-flex items-center gap-2 uppercase tracking-[0.14em] hover:text-white">
              <ArrowLeft size={13} /> All developers
            </Link>
            <span>
              Listed on{' '}
              <Link href="/" className="text-white/70 hover:text-white">e-resi</Link>
            </span>
          </div>
        </footer>
      </section>

      <style>{'@keyframes dp-zoom{from{transform:scale(1.08)}to{transform:scale(1)}}'}</style>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'border px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors',
        active ? 'border-[#0a0a3d] bg-[#0a0a3d] text-white' : 'border-[#0a0a3d]/20 text-[#0a0a3d] hover:border-[#0a0a3d]',
      )}
    >
      {children}
    </button>
  );
}

/** A development as a full-bleed band: title over the photograph, facts and the way in along the bottom. */
function DevelopmentBand({ property, index }: { property: DeveloperPropertyPreview; index: number }) {
  const price = priceLabel(property);
  return (
    <Link
      href={`/${property.slug}`}
      className="group relative block h-[78svh] min-h-[480px] max-h-[860px] w-full overflow-hidden bg-[#1a1a24]"
    >
      {property.heroImageUrl ? (
        <Image
          src={property.heroImageUrl}
          alt={property.name}
          fill
          priority={index === 0}
          sizes="100vw"
          className="object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <Building2 size={44} className="absolute inset-0 m-auto text-white/20" />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="absolute inset-0 mx-auto flex max-w-[1380px] flex-col justify-between px-6 py-10 sm:px-12 sm:py-14">
        <div>
          <p className="text-[11.5px] uppercase tracking-[0.3em] text-white/70">
            {String(index + 1).padStart(2, '0')} · {categoryLabel(property.category)}
          </p>
          <h3 className={cn(SERIF, 'mt-4 max-w-[14ch] text-balance text-[38px] uppercase leading-[1.04] tracking-[0.02em] text-white sm:text-[64px] lg:text-[76px]')}>
            {property.name}
          </h3>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <dl className="flex flex-wrap gap-x-10 gap-y-4 text-white">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.24em] text-white/60">Location</dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-[15px]"><MapPin size={14} /> {whereLabel(property)}</dd>
            </div>
            {price && (
              <div>
                <dt className="text-[11px] uppercase tracking-[0.24em] text-white/60">Price</dt>
                <dd className="mt-1.5 text-[15px]">{price}</dd>
              </div>
            )}
          </dl>
          <span className="inline-flex items-center gap-2.5 border border-white/40 bg-black/25 px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-colors duration-300 group-hover:border-white group-hover:bg-white group-hover:text-[#0a0a3d]">
            Discover <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
