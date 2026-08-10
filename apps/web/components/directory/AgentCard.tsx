'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Building2, MapPin, Phone, User } from 'lucide-react';
import { ChatWithAgentButton } from '../agents/ChatWithAgentButton';
import { DirectoryCard, IconPillLink } from './DirectoryPrimitives';
import { StarRating } from './StarRating';
import { WhatsAppIcon } from './WhatsAppIcon';
import { SPECIALTY_LABELS, type Agent } from '../../lib/api/agents';

function waLink(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}`;
}
function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/**
 * One agent in the directory or the "Need agent help?" picker.
 *
 * An individual leads with their photo and a company with its logo — buyers
 * choose a person differently from how they choose a firm.
 */
export function AgentCard({ agent, compact = false }: { agent: Agent; compact?: boolean }) {
  const isCompany = agent.kind === 'COMPANY';
  const avatar = isCompany ? agent.logoUrl : agent.photoUrl;
  const FallbackIcon = isCompany ? Building2 : User;

  return (
    <DirectoryCard className="flex flex-col p-5">
      <div className="flex items-center gap-4">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#f0f0f2] ${
            // A person reads as a person at a circle; a company as a mark in a tile.
            isCompany ? 'h-20 w-20 rounded-2xl' : 'h-20 w-20 rounded-full'
          }`}
        >
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <FallbackIcon size={28} className="text-[#8a8a90]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[16px] font-semibold text-[#111112]">
            {agent.displayName}
          </h3>
          <p className="mt-0.5 text-[13px] text-[#6b6b70]">
            {isCompany ? 'Agency' : 'Individual agent'}
            {agent.yearsExperience ? ` · ${agent.yearsExperience} yrs` : ''}
          </p>
          {agent.location && (
            <p className="mt-1 flex items-center gap-1 truncate text-[13px] text-[#6b6b70]">
              <MapPin size={12} className="shrink-0" />
              {agent.location}
            </p>
          )}
          <div className="mt-1.5">
            <StarRating value={agent.ratingAverage} count={agent.ratingCount} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {agent.phone && (
            <IconPillLink href={telLink(agent.phone)} label={`Call ${agent.displayName}`}>
              <Phone size={15} />
            </IconPillLink>
          )}
          {agent.whatsapp && (
            <IconPillLink
              href={waLink(agent.whatsapp)}
              label={`WhatsApp ${agent.displayName}`}
              tone="whatsapp"
            >
              <WhatsAppIcon size={15} />
            </IconPillLink>
          )}
        </div>
      </div>

      {!compact && agent.specialties.length > 0 && (
        <p className="mt-3 line-clamp-2 text-[13px] text-[#6b6b70]">
          {agent.specialties.map((s) => SPECIALTY_LABELS[s]).join(' · ')}
        </p>
      )}

      {/* Both routes the picker offers: look them over, or start talking. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/agents/${agent.id}`}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#4A80F5] transition-colors hover:text-[#3457E0]"
        >
          Visit agent
          <ArrowUpRight size={16} />
        </Link>
        <ChatWithAgentButton
          agentId={agent.id}
          label="Chat"
          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[#f5f5f6] px-3.5 py-1.5 text-[14px] font-medium text-[#111112] transition-colors hover:bg-[#eaeaec] cursor-pointer disabled:opacity-50"
        />
      </div>
    </DirectoryCard>
  );
}
