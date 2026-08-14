'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, Globe2, Loader2, Mail, MapPin, Phone, User,
} from 'lucide-react';
import { agentsApi, SPECIALTY_LABELS, type Agent } from '../../lib/api/agents';
import { DirectoryCard, DirectoryShell, PillLink, Tag } from './DirectoryPrimitives';
import {
  FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon,
} from './SocialIcons';
import { ChatWithAgentButton } from '../agents/ChatWithAgentButton';
import { AgentReviews } from './AgentReviews';
import { PartnersStrip } from './PartnersStrip';
import { StarRating } from './StarRating';
import { WhatsAppIcon } from './WhatsAppIcon';

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
} as const;

function waLink(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}`;
}
function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/**
 * An agent's own page inside e-resi — their storefront rather than a row in a
 * list, with reviews and partner developers. Assigned properties land here in later
 * stages; this establishes the shell they slot into.
 */
export function AgentProfile({ agentId }: { agentId: string }) {
  const { data: agent, isLoading, isError } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentsApi.get(agentId),
    retry: false,
  });

  if (isLoading) {
    return (
      <DirectoryShell className="pt-16">
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 size={26} className="animate-spin text-[#8a8a90]" />
        </div>
      </DirectoryShell>
    );
  }

  // A delisted or unverified agent 404s from the API, so this covers both
  // "does not exist" and "not currently listed" without leaking which.
  if (isError || !agent) {
    return (
      <DirectoryShell className="pt-16">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-[24px] font-semibold text-[#111112]">Agent not available</h1>
          <p className="mt-2 text-[15px] text-[#6b6b70]">
            This agent is not currently listed on e-resi.
          </p>
          <PillLink href="/agents" className="mt-6 inline-flex">
            Browse all agents
          </PillLink>
        </div>
      </DirectoryShell>
    );
  }

  return (
    <DirectoryShell className="pt-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/agents"
          className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#6b6b70] transition-colors hover:text-[#111112]"
        >
          <ArrowLeft size={15} /> All agents
        </Link>

        <AgentHeader agent={agent} />

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {agent.bio && (
              <DirectoryCard className="p-6">
                <h2 className="mb-2 text-[18px] font-semibold text-[#111112]">About</h2>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#6b6b70]">
                  {agent.bio}
                </p>
              </DirectoryCard>
            )}

            <DirectoryCard className="p-6">
              <h2 className="mb-3 text-[18px] font-semibold text-[#111112]">What they handle</h2>
              {agent.specialties.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agent.specialties.map((s) => (
                    <Tag key={s} tone="blue">{SPECIALTY_LABELS[s]}</Tag>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-[#8a8a90]">Not specified.</p>
              )}

              {agent.serviceAreas.length > 0 && (
                <>
                  <h3 className="mb-2 mt-5 text-[15px] font-medium text-[#111112]">Areas covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.serviceAreas.map((a) => (
                      <Tag key={a} tone="gray">{a}</Tag>
                    ))}
                  </div>
                </>
              )}
            </DirectoryCard>
          </div>

          <div className="space-y-4">
            <ContactCard agent={agent} />
          </div>

          <div className="lg:col-span-3">
            {/* Who they actually work with — the evidence behind the profile. */}
            <PartnersStrip side="agent" profileId={agent.id} />
            <AgentReviews agentId={agent.id} />
          </div>
        </div>
      </div>
    </DirectoryShell>
  );
}

function AgentHeader({ agent }: { agent: Agent }) {
  const isCompany = agent.kind === 'COMPANY';
  const avatar = isCompany ? agent.logoUrl : agent.photoUrl;
  const FallbackIcon = isCompany ? Building2 : User;

  return (
    <DirectoryCard className="flex flex-wrap items-center gap-5 p-6">
      <div
        className={`flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden bg-[#f0f0f2] ${
          isCompany ? 'rounded-3xl' : 'rounded-full'
        }`}
      >
        {avatar ? (
          <Image src={avatar} alt="" width={112} height={112} className="h-full w-full object-cover" />
        ) : (
          <FallbackIcon size={40} className="text-[#8a8a90]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-[26px] font-semibold leading-tight text-[#111112] sm:text-[30px]">
          {agent.displayName}
        </h1>
        <p className="mt-1 text-[15px] text-[#6b6b70]">
          {isCompany ? 'Property agency' : 'Individual property agent'}
          {agent.yearsExperience ? ` · ${agent.yearsExperience} years` : ''}
        </p>
        {agent.location && (
          <p className="mt-1 flex items-center gap-1.5 text-[14px] text-[#6b6b70]">
            <MapPin size={14} /> {agent.location}
          </p>
        )}
        <div className="mt-2">
          <StarRating value={agent.ratingAverage} count={agent.ratingCount} size={16} />
        </div>
      </div>
    </DirectoryCard>
  );
}

function ContactCard({ agent }: { agent: Agent }) {
  const hasContact = agent.phone || agent.whatsapp || agent.email || agent.website;
  // Only render icons we actually have, rather than a fixed row of five.
  const socialLinks = agent.socials
    ? (Object.entries(agent.socials) as [keyof typeof SOCIAL_ICONS, string | undefined][])
        .filter((entry): entry is [keyof typeof SOCIAL_ICONS, string] =>
          Boolean(entry[1]) && entry[0] in SOCIAL_ICONS)
    : [];

  return (
    <DirectoryCard className="p-6">
      <h2 className="mb-3 text-[18px] font-semibold text-[#111112]">Get in touch</h2>

      {/* Chat first: it keeps the conversation on-platform, and is what makes
          the reviewer eligible to rate this agent afterwards. */}
      <div className="mb-3">
        <ChatWithAgentButton agentId={agent.id} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#111112] px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#2a2a2c] cursor-pointer disabled:opacity-50" />
      </div>

      {!hasContact && (
        <p className="text-[14px] text-[#8a8a90]">No other contact details published.</p>
      )}

      <div className="flex flex-col gap-2">
        {agent.phone && (
          <a
            href={telLink(agent.phone)}
            className="flex items-center gap-2.5 rounded-2xl bg-[#f5f5f6] px-4 py-3 text-[15px] font-medium text-[#111112] transition-colors hover:bg-[#eaeaec]"
          >
            <Phone size={16} /> {agent.phone}
          </a>
        )}
        {agent.whatsapp && (
          <a
            href={waLink(agent.whatsapp)}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2.5 rounded-2xl bg-[#e9faf0] px-4 py-3 text-[15px] font-medium text-[#1fa855] transition-colors hover:bg-[#d8f5e3]"
          >
            <WhatsAppIcon size={16} /> WhatsApp
          </a>
        )}
        {agent.email && (
          <a
            href={`mailto:${agent.email}`}
            className="flex items-center gap-2.5 rounded-2xl bg-[#f5f5f6] px-4 py-3 text-[15px] font-medium text-[#111112] transition-colors hover:bg-[#eaeaec]"
          >
            <Mail size={16} /> <span className="truncate">{agent.email}</span>
          </a>
        )}
        {agent.website && (
          <a
            href={agent.website}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2.5 rounded-2xl bg-[#f5f5f6] px-4 py-3 text-[15px] font-medium text-[#111112] transition-colors hover:bg-[#eaeaec]"
          >
            <Globe2 size={16} /> Website
          </a>
        )}
      </div>

      {agent.officeAddress && (
        <>
          <h3 className="mb-1 mt-5 text-[14px] font-medium text-[#111112]">Office</h3>
          <p className="text-[14px] leading-relaxed text-[#6b6b70]">{agent.officeAddress}</p>
        </>
      )}

      {socialLinks.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {socialLinks.map(([key, url]) => {
            const Icon = SOCIAL_ICONS[key];
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={key}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-[#f5f5f6] text-[#111112] transition-colors hover:bg-[#eaeaec]"
              >
                <Icon size={15} />
              </a>
            );
          })}
        </div>
      )}
    </DirectoryCard>
  );
}
