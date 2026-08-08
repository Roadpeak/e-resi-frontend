'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, MapPin, Phone, Globe, ArrowLeft, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { developersApi } from '../../lib/api/developers';
import { DirectoryCard, DirectoryShell, IconPillLink, Tag } from './DirectoryPrimitives';
import { WhatsAppIcon } from './WhatsAppIcon';
import { InstagramIcon, FacebookIcon, TwitterIcon, LinkedinIcon } from './SocialIcons';
import { DirectoryPropertyCard } from './DirectoryPropertyCard';

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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/developers"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#6b6b70] transition-colors hover:text-[#111112]"
        >
          <ArrowLeft size={15} /> All developers
        </Link>

        {/* ── Header card ── */}
        <DirectoryCard className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#f0f0f2]">
              {developer.logoUrl ? (
                <Image src={developer.logoUrl} alt="" width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                <Building2 size={28} className="text-[#8a8a90]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-[24px] font-semibold text-[#111112] sm:text-[28px]">
                {developer.companyName}
              </h1>
              {developer.location && (
                <p className="mt-1 flex items-center gap-1.5 text-[14px] text-[#6b6b70]">
                  <MapPin size={14} /> {developer.location}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Tag tone="blue">
                  {properties.length} live listing{properties.length === 1 ? '' : 's'}
                </Tag>
                {developer.establishedYear && <Tag tone="gray">Since {developer.establishedYear}</Tag>}
                {developer.completedProjects > 0 && (
                  <Tag tone="green">{developer.completedProjects} completed projects</Tag>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {developer.phone && (
                <IconPillLink href={telLink(developer.phone)} label={`Call ${developer.companyName}`}>
                  <Phone size={16} />
                </IconPillLink>
              )}
              {developer.whatsapp && (
                <IconPillLink href={waLink(developer.whatsapp)} label={`WhatsApp ${developer.companyName}`} tone="whatsapp">
                  <WhatsAppIcon size={16} />
                </IconPillLink>
              )}
              {developer.website && (
                <IconPillLink href={developer.website} label={`${developer.companyName} website`}>
                  <Globe size={16} />
                </IconPillLink>
              )}
            </div>
          </div>

          {developer.description && (
            <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-[#3f3f45]">
              {developer.description}
            </p>
          )}

          {/* ── Socials ── */}
          {socialLinks.length > 0 && (
            <div className="mt-6 flex items-center gap-2 border-t border-black/5 pt-6">
              <span className="mr-1 text-[13px] font-medium text-[#6b6b70]">Follow</span>
              {socialLinks.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={key}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f6] text-[#111112] transition-colors hover:bg-[#eaeaec]"
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          )}
        </DirectoryCard>

        {/* ── Map of their developments ── */}
        {mapPlaces.length > 0 && (
          <DirectoryCard className="mt-6 h-[360px] overflow-hidden">
            <DirectoryMap places={mapPlaces} className="rounded-[28px]" />
          </DirectoryCard>
        )}

        {/* ── Property grid ── */}
        <div className="mt-8">
          <h2 className="mb-4 text-[20px] font-semibold text-[#111112]">
            Developments by {developer.companyName}
          </h2>

          {properties.length === 0 ? (
            <DirectoryCard className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Building2 size={28} className="text-[#c4c4c8]" />
              <p className="text-[14px] text-[#6b6b70]">No live listings yet.</p>
            </DirectoryCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p) => (
                <DirectoryPropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DirectoryShell>
  );
}
