'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, MapPin, Phone, Mail, Globe, ArrowLeft, ArrowUpRight, Loader2,
} from 'lucide-react';
import { developersApi, type DeveloperPropertyPreview } from '../../lib/api/developers';
import { formatPrice, formatPriceRange, cn } from '../../lib/utils';
import { WhatsAppIcon } from './WhatsAppIcon';
import { InstagramIcon, FacebookIcon, TwitterIcon, LinkedinIcon } from './SocialIcons';
import { PartnersStrip } from './PartnersStrip';

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

/** "APARTMENT" → "Apartment", "MIXED_USE" → "Mixed use". */
function categoryLabel(category: string) {
  const s = category.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Admin-boundary suffixes ("Kilimani ward") read as data, not a place name. */
function areaName(p: DeveloperPropertyPreview) {
  const n = p.neighborhood?.replace(/\s+(ward|sub-?county|constituency)$/i, '').trim();
  return n || p.city;
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

/** Group a developer's work by area, so a visitor sees where they build. */
function groupPlaces(properties: DeveloperPropertyPreview[]): Place[] {
  const map = new Map<string, Place>();
  for (const p of properties) {
    const area = areaName(p);
    const key = `${area}|${p.city}`.toLowerCase();
    const place = map.get(key) ?? { key, area, city: p.city, imageUrl: null, count: 0, minPrice: null };
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

const placeKeyOf = (p: DeveloperPropertyPreview) => `${areaName(p)}|${p.city}`.toLowerCase();

/**
 * Developers often paste bullet lists ("• Founded: 2014 by …"). Render those as
 * labelled rows instead of one run-on paragraph; plain prose stays prose.
 */
function Description({ text }: { text: string }) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const bullet = /^[•\-*–·]\s*/;
  const isList = lines.length > 1 && lines.filter((l) => bullet.test(l)).length >= lines.length / 2;

  if (!isList) {
    return (
      <div className="space-y-4">
        {lines.map((l, i) => (
          <p key={i} className="max-w-[62ch] text-[16px] leading-[1.75] text-[#3d3a36] sm:text-[17px]">{l}</p>
        ))}
      </div>
    );
  }

  return (
    <dl className="divide-y divide-black/[0.07] border-y border-black/[0.07]">
      {lines.map((raw, i) => {
        const line = raw.replace(bullet, '');
        const m = line.match(/^([^:]{2,32}):\s*(.+)$/);
        return (
          <div key={i} className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
            {m ? (
              <>
                <dt className="text-[12px] font-semibold uppercase tracking-[0.16em] text-warm-700">{m[1]}</dt>
                <dd className="text-[15.5px] leading-relaxed text-[#2b2926]">{m[2]}</dd>
              </>
            ) : (
              <dd className="text-[15.5px] leading-relaxed text-[#2b2926] sm:col-span-2">{line}</dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}

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
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 size={24} className="animate-spin text-[#8a857e]" />
      </div>
    );
  }

  if (isError || !developer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-16 text-center">
        <Building2 size={32} className="text-[#c9c3ba]" />
        <p className="text-[15px] text-[#6b665f]">This developer couldn&apos;t be found.</p>
        <Link href="/developers" className="text-[14px] font-medium text-ink underline">
          Back to all developers
        </Link>
      </div>
    );
  }

  const socialLinks = developer.socials
    ? (Object.entries(developer.socials) as [keyof typeof SOCIAL_ICONS, string | undefined][])
        .filter(([key, url]) => url && key in SOCIAL_ICONS)
    : [];
  const featured = properties.find((p) => p.heroImageUrl) ?? properties[0] ?? null;
  const cities = [...new Set(properties.map((p) => p.city).filter(Boolean))];
  const placeSummary = places.slice(0, 3).map((p) => (p.area === p.city ? p.city : `${p.area}, ${p.city}`));
  const hasDirectContact = !!(developer.phone || developer.email || developer.whatsapp);

  const stats = [
    developer.establishedYear && { label: 'Established', value: String(developer.establishedYear) },
    developer.completedProjects > 0 && { label: 'Projects completed', value: String(developer.completedProjects) },
    { label: 'Live on e-resi', value: String(properties.length) },
    places.length > 0 && { label: cities.length > 1 ? 'Cities' : 'Locations', value: String(cities.length > 1 ? cities.length : places.length) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="pt-16">
      {/* ── Hero: identity on the left, their best building on the right ── */}
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/developers"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#6b665f] transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} /> All developers
          </Link>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-1.5">
              {socialLinks.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={key}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#3d3a36] transition-colors hover:border-ink hover:text-ink"
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 grid items-end gap-10 lg:mt-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="min-w-0">
            {developer.logoUrl && (
              <span className="mb-8 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <Image src={developer.logoUrl} alt={`${developer.companyName} logo`} width={72} height={72} className="h-full w-full object-contain" />
              </span>
            )}
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.32em] text-warm-700">
              Property developer
            </p>
            <h1 className="mt-3 text-balance font-display text-[46px] font-normal leading-[0.98] tracking-[-0.01em] text-ink sm:text-[68px] lg:text-[76px]">
              {developer.companyName}
            </h1>
            {(placeSummary.length > 0 || developer.location) && (
              <p className="mt-5 flex items-start gap-2 text-[15px] text-[#5c5750]">
                <MapPin size={16} className="mt-[3px] shrink-0 text-warm-600" />
                <span>
                  {placeSummary.length > 0 ? (
                    <>
                      Building in {placeSummary.join(' · ')}
                      {places.length > 3 && ` and ${places.length - 3} more`}
                    </>
                  ) : (
                    developer.location
                  )}
                </span>
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              {properties.length > 0 && (
                <a
                  href="#developments"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[#2b2926]"
                >
                  View developments
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[12px] tabular-nums">{properties.length}</span>
                </a>
              )}
              {developer.whatsapp && (
                <a
                  href={waLink(developer.whatsapp)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-5 py-3.5 text-[14px] font-medium text-ink transition-colors hover:border-ink"
                >
                  <WhatsAppIcon size={15} /> WhatsApp
                </a>
              )}
              {developer.website && (
                <a
                  href={developer.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-5 py-3.5 text-[14px] font-medium text-ink transition-colors hover:border-ink"
                >
                  Visit website <ArrowUpRight size={15} />
                </a>
              )}
            </div>
          </div>

          {featured && (
            <Link
              href={`/${featured.slug}`}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-[#e7e2da]"
            >
              {featured.heroImageUrl ? (
                <Image
                  src={featured.heroImageUrl}
                  alt={featured.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 size={40} className="text-[#c9c3ba]" />
                </div>
              )}
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-4 rounded-[20px] bg-white/95 px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:inset-x-4 sm:bottom-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-warm-700">Featured development</p>
                  <p className="mt-1 truncate font-display text-[22px] leading-tight text-ink sm:text-[26px]">{featured.name}</p>
                  <p className="mt-0.5 truncate text-[13px] text-[#6b665f]">
                    {areaName(featured) === featured.city ? featured.city : `${areaName(featured)}, ${featured.city}`}
                    {priceLabel(featured) && <> · {priceLabel(featured)}</>}
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ── Track record ── */}
      <section className="border-y border-black/[0.07] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                'py-7 sm:py-9',
                i % 2 === 1 && 'border-l border-black/[0.07] pl-5 sm:pl-8',
                i >= 2 && 'border-t border-black/[0.07] lg:border-t-0',
                i === 2 && 'lg:border-l lg:pl-8',
              )}
            >
              <p className="font-display text-[40px] leading-none text-ink tabular-nums sm:text-[52px]">{s.value}</p>
              <p className="mt-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-[#7a746c]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About + contact ── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div className="min-w-0">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.32em] text-warm-700">About</p>
            <h2 className="mt-3 font-display text-[34px] font-normal leading-tight text-ink sm:text-[44px]">
              About {developer.companyName}
            </h2>
            <div className="mt-8">
              {developer.description ? (
                <Description text={developer.description} />
              ) : (
                <p className="max-w-[62ch] text-[16px] leading-relaxed text-[#5c5750]">
                  {developer.companyName} has {properties.length} live
                  {properties.length === 1 ? ' development' : ' developments'} on e-resi.
                </p>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-[24px] border border-black/[0.07] bg-white p-6 sm:p-7 lg:sticky lg:top-24">
            <p className="font-display text-[24px] leading-tight text-ink">Talk to {developer.companyName}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#6b665f]">
              {hasDirectContact
                ? 'Reach the sales team directly, or enquire from any development page.'
                : 'Enquire from any development page to reach the sales team, book a guided virtual tour or request documents.'}
            </p>
            <div className="mt-5 divide-y divide-black/[0.07] border-t border-black/[0.07]">
              {developer.phone && (
                <ContactRow icon={<Phone size={15} />} label="Phone" href={telLink(developer.phone)} value={developer.phone} />
              )}
              {developer.whatsapp && (
                <ContactRow icon={<WhatsAppIcon size={15} />} label="WhatsApp" href={waLink(developer.whatsapp)} value={developer.whatsapp} external />
              )}
              {developer.email && (
                <ContactRow icon={<Mail size={15} />} label="Email" href={`mailto:${developer.email}`} value={developer.email} />
              )}
              {developer.website && (
                <ContactRow
                  icon={<Globe size={15} />}
                  label="Website"
                  href={developer.website}
                  value={developer.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  external
                />
              )}
              {developer.location && (
                <div className="flex items-center gap-3 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3efe9] text-[#5c5750]"><MapPin size={15} /></span>
                  <div className="min-w-0">
                    <p className="text-[12px] text-[#8a847b]">Office</p>
                    <p className="text-[14.5px] font-medium text-ink">{developer.location}</p>
                  </div>
                </div>
              )}
            </div>
            {properties.length > 0 && (
              <a
                href="#developments"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[#2b2926]"
              >
                Enquire on a development
              </a>
            )}
          </aside>
        </div>
      </section>

      {/* ── Agents ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PartnersStrip side="developer" profileId={profileId} />
      </div>

      {/* ── Where they build ── */}
      {places.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.32em] text-warm-700">Locations</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[34px] font-normal leading-tight text-ink sm:text-[44px]">
              Where {developer.companyName} builds
            </h2>
            {places.length > 1 && (
              <p className="text-[14px] text-[#6b665f]">Select a location to filter the developments below.</p>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {places.map((place) => {
              const active = placeFilter === place.key;
              return (
                <button
                  key={place.key}
                  type="button"
                  onClick={() => {
                    setPlaceFilter(active ? null : place.key);
                    if (!active) document.getElementById('developments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  aria-pressed={active}
                  className={cn(
                    'group flex items-center gap-4 rounded-[20px] border bg-white p-3 pr-5 text-left transition-all',
                    active ? 'border-ink shadow-[0_0_0_1px_#0a0a0a]' : 'border-black/[0.07] hover:border-black/25',
                  )}
                >
                  <span className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[14px] bg-[#e7e2da]">
                    {place.imageUrl ? (
                      <Image src={place.imageUrl} alt="" fill sizes="76px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <MapPin size={20} className="absolute inset-0 m-auto text-[#b3aca2]" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-semibold text-ink">{place.area}</span>
                    {place.area !== place.city && (
                      <span className="block truncate text-[13px] text-[#6b665f]">{place.city}</span>
                    )}
                    <span className="mt-1 block text-[12.5px] text-[#8a847b]">
                      {place.count} development{place.count === 1 ? '' : 's'}
                      {place.minPrice && <> · from {formatPrice(place.minPrice.amount, place.minPrice.currency)}</>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Developments ── */}
      <section id="developments" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.32em] text-warm-700">Portfolio</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[34px] font-normal leading-tight text-ink sm:text-[44px]">
            Developments
            <span className="ml-3 align-middle font-sans text-[15px] font-medium text-[#8a847b] tabular-nums">{shown.length}</span>
          </h2>
          {places.length > 1 && (
            <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1">
              <FilterChip active={!placeFilter} onClick={() => setPlaceFilter(null)}>All locations</FilterChip>
              {places.map((place) => (
                <FilterChip key={place.key} active={placeFilter === place.key} onClick={() => setPlaceFilter(place.key)}>
                  {place.area}
                </FilterChip>
              ))}
            </div>
          )}
        </div>

        {properties.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-black/15 bg-white py-20 text-center">
            <Building2 size={28} className="text-[#c9c3ba]" />
            <p className="text-[14.5px] text-[#6b665f]">No live developments yet.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {shown[0] && <WideCard property={shown[0]} />}
            {shown.length > 1 && (
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {shown.slice(1).map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ContactRow({
  icon, label, value, href, external,
}: { icon: React.ReactNode; label: string; value: string; href: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      className="group flex items-center gap-3 py-3.5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3efe9] text-[#5c5750]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-[#8a847b]">{label}</span>
        <span className="block truncate text-[14.5px] font-medium text-ink group-hover:underline">{value}</span>
      </span>
      <ArrowUpRight size={15} className="shrink-0 text-[#b3aca2] transition-colors group-hover:text-ink" />
    </a>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors',
        active ? 'border-ink bg-ink text-white' : 'border-black/10 bg-white text-[#3d3a36] hover:border-black/30',
      )}
    >
      {children}
    </button>
  );
}

/** The lead development: image and details side by side, at a size the photography deserves. */
function WideCard({ property }: { property: DeveloperPropertyPreview }) {
  const where = areaName(property) === property.city ? property.city : `${areaName(property)}, ${property.city}`;
  const price = priceLabel(property);
  return (
    <Link
      href={`/${property.slug}`}
      className="group grid overflow-hidden rounded-[28px] border border-black/[0.07] bg-white transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] lg:grid-cols-[1.45fr_1fr]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#e7e2da] lg:aspect-auto lg:min-h-[440px]">
        {property.heroImageUrl ? (
          <Image
            src={property.heroImageUrl}
            alt={property.name}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <Building2 size={40} className="absolute inset-0 m-auto text-[#c9c3ba]" />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-medium text-ink">
          {categoryLabel(property.category)}
        </span>
      </div>
      <div className="flex flex-col justify-between gap-8 p-6 sm:p-9">
        <div>
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-[#7a746c]">
            <MapPin size={13} /> {where}
          </p>
          <h3 className="mt-3 text-balance font-display text-[34px] font-normal leading-[1.05] text-ink sm:text-[44px]">
            {property.name}
          </h3>
        </div>
        <div>
          <dl className="divide-y divide-black/[0.07] border-y border-black/[0.07]">
            <div className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="text-[13.5px] text-[#7a746c]">Type</dt>
              <dd className="text-[14.5px] font-medium text-ink">{categoryLabel(property.category)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="text-[13.5px] text-[#7a746c]">Location</dt>
              <dd className="text-right text-[14.5px] font-medium text-ink">{where}</dd>
            </div>
            {price && (
              <div className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="text-[13.5px] text-[#7a746c]">Price</dt>
                <dd className="text-[14.5px] font-medium text-ink">{price}</dd>
              </div>
            )}
          </dl>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[14px] font-medium text-white transition-colors group-hover:bg-[#2b2926]">
            Explore development
            <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:rotate-45" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PropertyCard({ property }: { property: DeveloperPropertyPreview }) {
  const where = areaName(property) === property.city ? property.city : `${areaName(property)}, ${property.city}`;
  const price = priceLabel(property);
  return (
    <Link href={`/${property.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#e7e2da]">
        {property.heroImageUrl ? (
          <Image
            src={property.heroImageUrl}
            alt={property.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <Building2 size={36} className="absolute inset-0 m-auto text-[#c9c3ba]" />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-medium text-ink">
          {categoryLabel(property.category)}
        </span>
        <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowUpRight size={17} />
        </span>
      </div>
      <div className="mt-4 px-1">
        <p className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em] text-[#7a746c]">
          <MapPin size={12} /> {where}
        </p>
        <h3 className="mt-1.5 font-display text-[26px] leading-tight text-ink">{property.name}</h3>
        {price && <p className="mt-1 text-[14.5px] text-[#3d3a36]">{price}</p>}
      </div>
    </Link>
  );
}
