'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, MapPin, Phone, Mail, Globe, ArrowLeft, ArrowRight, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { developersApi, type DeveloperPropertyPreview } from '../../lib/api/developers';
import { formatPrice } from '../../lib/utils';
import { DirectoryCard, DirectoryShell } from './DirectoryPrimitives';
import { WhatsAppIcon } from './WhatsAppIcon';
import { InstagramIcon, FacebookIcon, TwitterIcon, LinkedinIcon } from './SocialIcons';
import { PartnersStrip } from './PartnersStrip';

// Leaflet touches `window` at import time — must not run during SSR.
const DirectoryMap = dynamic(
  () => import('./DirectoryMap').then((m) => m.DirectoryMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[#e8eaea]" /> },
);

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

export function DeveloperProfilePage({ profileId }: { profileId: string }) {
  const { data: developer, isLoading, isError } = useQuery({
    queryKey: ['developer-profile', profileId],
    queryFn: () => developersApi.get(profileId),
  });

  if (isLoading) {
    return (
      <DirectoryShell className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 size={24} className="animate-spin text-[#8a8a90]" />
      </DirectoryShell>
    );
  }

  if (isError || !developer) {
    return (
      <DirectoryShell className="flex min-h-screen flex-col items-center justify-center gap-4 pt-16 text-center">
        <Building2 size={32} className="text-[#c4c4c8]" />
        <p className="text-[15px] text-[#6b6b70]">This developer couldn&apos;t be found.</p>
        <Link href="/developers" className="text-[14px] font-medium text-[#111112] underline">
          Back to all developers
        </Link>
      </DirectoryShell>
    );
  }

  const properties = developer.properties;
  const socialLinks = developer.socials
    ? (Object.entries(developer.socials) as [keyof typeof SOCIAL_ICONS, string | undefined][])
        .filter(([key, url]) => url && key in SOCIAL_ICONS)
    : [];
  // No cover image exists on a developer profile, so their first development
  // with a photo stands in for one.
  const heroImage = properties.find((p) => p.heroImageUrl)?.heroImageUrl ?? null;

  const mapPlaces = properties
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      heroImageUrl: p.heroImageUrl,
      city: p.city,
      neighborhood: p.neighborhood,
      priceFrom: p.priceFrom,
      currency: p.currency,
      latitude: p.latitude,
      longitude: p.longitude,
    }));

  return (
    <DirectoryShell className="pt-16">
      {/* ── Hero ──
          A developer's own building, at the size their work deserves. The
          previous header was a logo tile and a paragraph in a bordered card,
          which read like a directory row rather than a company's own page.

          There is no cover image on the profile, so the first development's
          hero stands in — a developer who has listed anything has one. */}
      <section className="relative isolate overflow-hidden bg-[#0b0d11]">
        {heroImage && (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0b0d11] via-[#0b0d11]/55 to-[#0b0d11]/25"
        />

        <div className="relative mx-auto flex min-h-[clamp(340px,48vh,520px)] max-w-6xl flex-col justify-between px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <Link
              href="/developers"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-white/70 transition-colors hover:text-white"
            >
              <ArrowLeft size={15} /> All developers
            </Link>

            {/* Socials stay at the top, as asked — over the image rather than
                buried under a description. */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                {socialLinks.map(([key, url]) => {
                  const Icon = SOCIAL_ICONS[key];
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={key}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-12 flex flex-wrap items-end gap-5">
            {developer.logoUrl && (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-1.5">
                <Image
                  src={developer.logoUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-[52px]">
                {developer.companyName}
              </h1>
              {developer.location && (
                <p className="mt-3 flex items-center gap-1.5 text-[15px] text-white/70">
                  <MapPin size={15} /> {developer.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Intro band ──
          The reference pairs the hero with a short statement and the two
          things a visitor might do next. */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
            <div>
              {developer.description ? (
                <p className="max-w-[62ch] text-[16px] leading-relaxed text-[#3f3f45] sm:text-[17px]">
                  {developer.description}
                </p>
              ) : (
                <p className="max-w-[62ch] text-[16px] leading-relaxed text-[#6b6b70]">
                  {developer.companyName} has {properties.length} live
                  {properties.length === 1 ? ' development' : ' developments'} on e-resi.
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {developer.whatsapp && (
                  <a
                    href={waLink(developer.whatsapp)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    <WhatsAppIcon size={15} /> Message them
                  </a>
                )}
                {developer.phone && (
                  <a
                    href={telLink(developer.phone)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-5 py-2.5 text-[14px] font-semibold text-[#111112] transition-colors hover:bg-[#f5f5f6]"
                  >
                    <Phone size={15} /> Call
                  </a>
                )}
                {developer.email && (
                  <a
                    href={`mailto:${developer.email}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-5 py-2.5 text-[14px] font-semibold text-[#111112] transition-colors hover:bg-[#f5f5f6]"
                  >
                    <Mail size={15} /> Email
                  </a>
                )}
                {developer.website && (
                  <a
                    href={developer.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-5 py-2.5 text-[14px] font-semibold text-[#111112] transition-colors hover:bg-[#f5f5f6]"
                  >
                    <Globe size={15} /> Website
                  </a>
                )}
              </div>
            </div>

            {/* The facts that were chips in the old header, as a table — the
                same treatment the listing cards use. */}
            <dl className="lg:border-l lg:border-black/5 lg:pl-14">
              {/* Written out rather than left behind an icon: someone deciding
                  whether to trust a developer with a deposit wants to see a
                  real number and a real address, not just a button that
                  promises one. Both are selectable, so they can be copied. */}
              {developer.phone && (
                <Fact
                  label="Phone"
                  value={
                    <a
                      href={telLink(developer.phone)}
                      className="transition-colors hover:text-brand-600"
                    >
                      {developer.phone}
                    </a>
                  }
                />
              )}
              {developer.email && (
                <Fact
                  label="Email"
                  value={
                    <a
                      href={`mailto:${developer.email}`}
                      className="break-all transition-colors hover:text-brand-600"
                    >
                      {developer.email}
                    </a>
                  }
                />
              )}
              <Fact
                label="Live listings"
                value={`${properties.length} development${properties.length === 1 ? '' : 's'}`}
              />
              {developer.establishedYear && (
                <Fact label="Established" value={String(developer.establishedYear)} />
              )}
              {developer.completedProjects > 0 && (
                <Fact label="Completed" value={`${developer.completedProjects} projects`} />
              )}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Agents ── kept up here, beside the company rather than below its
          work: they are who a buyer actually talks to. */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <PartnersStrip side="developer" profileId={profileId} />
      </div>

      {/* ── Developments ── */}
      <section className="bg-white pb-4 pt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-[28px] font-semibold tracking-[-0.01em] text-[#111112] sm:text-[36px]">
            Latest developments
          </h2>
        </div>

        {properties.length === 0 ? (
          <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6 lg:px-8">
            <DirectoryCard className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Building2 size={28} className="text-[#c4c4c8]" />
              <p className="text-[14px] text-[#6b6b70]">No live listings yet.</p>
            </DirectoryCard>
          </div>
        ) : (
          /* Full-bleed bands rather than a card grid: one development at a
             time, at a size where the photography carries the page. */
          <div className="mt-8">
            {properties.map((p, i) => (
              <ProjectBand key={p.id} property={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── Map ── last, as asked: it answers "where are these" once a visitor
          has seen what the developments actually are. */}
      {mapPlaces.length > 0 && (
        <section className="bg-white pb-14 pt-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-5 text-[22px] font-semibold text-[#111112]">
              Where they build
            </h2>
            <DirectoryCard className="h-[420px] overflow-hidden">
              <DirectoryMap places={mapPlaces} className="rounded-[28px]" />
            </DirectoryCard>
          </div>
        </section>
      )}
    </DirectoryShell>
  );
}

/** One labelled fact on a hairline rule. */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-black/5 py-3.5 last:border-b-0">
      <dt className="text-[14px] text-[#6b6b70]">{label}</dt>
      <dd className="text-[15px] font-semibold text-[#111112]">{value}</dd>
    </div>
  );
}

/**
 * A development as a full-width band.
 *
 * The reference runs its projects edge to edge with the name and a category
 * over the image — at that size a building reads as a piece of work rather
 * than a search result.
 */
function ProjectBand({
  property,
  index,
}: {
  property: DeveloperPropertyPreview;
  index: number;
}) {
  const where = [property.neighborhood, property.city].filter(Boolean).join(', ');

  return (
    <Link
      href={`/${property.slug}`}
      className="group relative block h-[clamp(280px,42vh,440px)] w-full overflow-hidden"
    >
      {property.heroImageUrl ? (
        <Image
          src={property.heroImageUrl}
          alt={property.name}
          fill
          priority={index === 0}
          sizes="100vw"
          className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 bg-[#e8eaea]" />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pb-8 sm:px-6 lg:px-8">
          <div className="min-w-0">
            {where && (
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
                {where}
              </p>
            )}
            <h3 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.01em] text-white sm:text-[34px]">
              {property.name}
            </h3>
            {!!property.priceFrom && property.priceFrom > 0 && (
              <p className="mt-1.5 text-[15px] text-white/75">
                From {formatPrice(property.priceFrom, property.currency)}
              </p>
            )}
          </div>

          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[13px] font-semibold text-white backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-[#111112]">
            View development <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
