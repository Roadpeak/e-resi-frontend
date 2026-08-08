'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Building2, ArrowUpRight } from 'lucide-react';
import { DirectoryCard, IconPillLink } from './DirectoryPrimitives';
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
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f0f0f2]">
          {developer.logoUrl ? (
            <Image
              src={developer.logoUrl}
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 size={28} className="text-[#8a8a90]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[16px] font-semibold text-[#111112]">
            {developer.companyName}
          </h3>
          {developer.location && (
            <p className="mt-1 flex items-center gap-1 truncate text-[13px] text-[#6b6b70]">
              <MapPin size={12} className="shrink-0" />
              {developer.location}
            </p>
          )}
          <p className="mt-1 truncate text-[13px] text-[#6b6b70]">
            {propertyCount} listing{propertyCount === 1 ? '' : 's'}
            {developer.establishedYear && ` · Since ${developer.establishedYear}`}
            {developer.completedProjects > 0 && ` · ${developer.completedProjects} completed`}
          </p>
        </div>

        {/* Contact shortcuts */}
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

      <Link
        href={`/developers/${developer.id}`}
        className="mt-4 inline-flex items-center gap-1.5 self-start text-[14px] font-medium text-[#4A80F5] transition-colors hover:text-[#3457E0]"
      >
        Explore
        <ArrowUpRight size={16} />
      </Link>
    </DirectoryCard>
  );
}
