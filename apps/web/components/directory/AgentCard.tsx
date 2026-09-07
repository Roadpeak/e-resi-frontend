'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Award, Building2, MapPin, Phone, User } from 'lucide-react';
import { ChatWithAgentButton } from '../agents/ChatWithAgentButton';
import { DirectoryCard } from './DirectoryPrimitives';
import { StarRating } from './StarRating';
import { WhatsAppIcon } from './WhatsAppIcon';
import { SPECIALTY_LABELS, type Agent } from '../../lib/api/agents';

function waLink(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}`;
}
function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

const iconAction =
  'flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#3c3c43] transition-colors hover:bg-[#f5f5f6]';

/**
 * One agent, laid out as a directory row: identity left, the record in the
 * middle, actions right. Everything reads as text on white — no coloured
 * chip backgrounds; the one accent is the rating gold that badges borrow.
 * `compact` keeps the self-contained card shape for the picker modal.
 */
export function AgentCard({ agent, compact = false }: { agent: Agent; compact?: boolean }) {
  const isCompany = agent.kind === 'COMPANY';
  const avatar = isCompany ? agent.logoUrl : agent.photoUrl;
  const FallbackIcon = isCompany ? Building2 : User;

  const identity = (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#f0f0f2] ${
        // A person reads as a person at a circle; a company as a mark in a tile.
        isCompany ? 'rounded-2xl' : 'rounded-full'
      } ${compact ? 'h-14 w-14' : 'h-20 w-20'}`}
    >
      {avatar ? (
        <Image src={avatar} alt="" width={80} height={80} className="h-full w-full object-cover" unoptimized />
      ) : (
        <FallbackIcon size={compact ? 22 : 28} className="text-[#8a8a90]" />
      )}
    </div>
  );

  const facts = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <h3 className="truncate text-[16.5px] font-semibold text-[#111112]">
          {agent.displayName}
        </h3>
        {(agent.badges ?? []).map((b) => (
          <span key={b} className="flex items-center gap-1 text-[12.5px] font-medium text-[#6b6b70]">
            <Award size={13} className="text-gold-400" /> {b}
          </span>
        ))}
      </div>

      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13.5px] text-[#6b6b70]">
        <span>{isCompany ? 'Agency' : 'Individual agent'}</span>
        {agent.yearsExperience ? <span>· {agent.yearsExperience} yrs experience</span> : null}
        {agent.location && (
          <span className="flex items-center gap-1">
            · <MapPin size={12} className="shrink-0" /> {agent.location}
          </span>
        )}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarRating value={agent.ratingAverage} count={agent.ratingCount} />
        {agent.dealsCompleted > 0 && (
          <span className="text-[13px] text-[#3c3c43]">
            <span className="font-semibold text-[#111112]">{agent.dealsCompleted}</span>{' '}
            closing{agent.dealsCompleted === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {!compact && agent.specialties.length > 0 && (
        <p className="mt-1.5 line-clamp-1 text-[13px] text-[#8a8a90]">
          {agent.specialties.map((s) => SPECIALTY_LABELS[s]).join(' · ')}
        </p>
      )}
    </div>
  );

  if (compact) {
    return (
      <DirectoryCard className="p-4">
        <div className="flex items-center gap-4">
          {identity}
          {facts}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Link
            href={`/agents/${agent.id}`}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#111112] underline underline-offset-2 hover:text-[#6b6b70]"
          >
            View profile
          </Link>
          <ChatWithAgentButton
            agentId={agent.id}
            label="Chat"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-[14px] font-medium text-[#111112] transition-colors hover:bg-[#f5f5f6] disabled:opacity-50"
          />
        </div>
      </DirectoryCard>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-5 px-5 py-6 transition-colors hover:bg-[#fafafa] sm:px-7">
      {identity}
      {facts}

      {/* Actions, one quiet rail: neutral icon pills, chat, then the single
          filled control — the profile is the destination. */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {agent.phone && (
          <a href={telLink(agent.phone)} aria-label={`Call ${agent.displayName}`} className={iconAction}>
            <Phone size={15} />
          </a>
        )}
        {agent.whatsapp && (
          <a
            href={waLink(agent.whatsapp)}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`WhatsApp ${agent.displayName}`}
            className={iconAction}
          >
            <span className="text-[#1fa855]"><WhatsAppIcon size={15} /></span>
          </a>
        )}
        <ChatWithAgentButton
          agentId={agent.id}
          label="Chat"
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 text-[14px] font-medium text-[#111112] transition-colors hover:bg-[#f5f5f6] disabled:opacity-50"
        />
        <Link
          href={`/agents/${agent.id}`}
          className="inline-flex h-10 items-center rounded-full bg-[#111112] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#2a2a2c]"
        >
          View profile
        </Link>
      </div>
    </div>
  );
}
