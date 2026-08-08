'use client';

import Image from 'next/image';
import { MapPin, Phone, Building2, ArrowUpRight } from 'lucide-react';
import { DirectoryCard, IconPillLink, PillLink, Tag } from './DirectoryPrimitives';
import { WhatsAppIcon } from './WhatsAppIcon';
import type { DeveloperCard as DeveloperCardData } from '../../lib/api/developers';

/** Digits only, e.g. "254712345678" — wa.me needs no leading +. */
function waLink(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}`;
}
function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function DeveloperCard({ developer }: { developer: DeveloperCardData }) {
  const propertyCount = developer._count.properties;

  return (
    <DirectoryCard className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f0f0f2]">
          {developer.logoUrl ? (
            <Image
              src={developer.logoUrl}
              alt=""
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 size={22} className="text-[#8a8a90]" />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate text-[16px] font-semibold text-[#111112]">
            {developer.companyName}
          </h3>
          {developer.location && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-[#6b6b70]">
              <MapPin size={12} className="shrink-0" />
              {developer.location}
            </p>
          )}
        </div>

        {/* Contact shortcuts — sit at the top so they never depend on card height */}
        <div className="flex shrink-0 items-center gap-1.5">
          {developer.phone && (
            <IconPillLink href={telLink(developer.phone)} label={`Call ${developer.companyName}`}>
              <Phone size={15} />
            </IconPillLink>
          )}
          {developer.whatsapp && (
            <IconPillLink
              href={waLink(developer.whatsapp)}
              label={`WhatsApp ${developer.companyName}`}
              tone="whatsapp"
            >
              <WhatsAppIcon size={15} />
            </IconPillLink>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Tag tone="blue">
          {propertyCount} listing{propertyCount === 1 ? '' : 's'}
        </Tag>
        {developer.establishedYear && <Tag tone="gray">Since {developer.establishedYear}</Tag>}
        {developer.completedProjects > 0 && (
          <Tag tone="green">{developer.completedProjects} completed</Tag>
        )}
      </div>

      <PillLink
        href={`/developers/${developer.id}`}
        className="mt-5 w-full justify-between px-5"
      >
        Explore
        <ArrowUpRight size={16} />
      </PillLink>
    </DirectoryCard>
  );
}
