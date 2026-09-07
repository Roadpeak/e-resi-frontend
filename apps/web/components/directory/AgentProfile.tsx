'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, BadgeCheck, Box, Building2, Clapperboard, Globe2, Headset,
  Loader2, Mail, MapPin, Phone, User,
} from 'lucide-react';
import { agentsApi, SPECIALTY_LABELS, type Agent, type AgentProperty } from '../../lib/api/agents';
import { formatPrice } from '../../lib/utils';
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
  const { data: properties } = useQuery({
    queryKey: ['agent', agentId, 'properties'],
    queryFn: () => agentsApi.properties(agentId),
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

        <AgentHeader agent={agent} propertyCount={properties?.length ?? 0} />

        {(properties?.length ?? 0) > 0 && (
          <AgentProperties agent={agent} properties={properties!} />
        )}

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

function AgentHeader({ agent, propertyCount }: { agent: Agent; propertyCount: number }) {
  const isCompany = agent.kind === 'COMPANY';
  const avatar = isCompany ? agent.logoUrl : agent.photoUrl;
  const FallbackIcon = isCompany ? Building2 : User;

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#151519] via-[#1e1d26] to-[#2c2740] text-white">
      <div className="flex flex-wrap items-center gap-6 p-6 sm:p-8">
        <div
          className={`flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden bg-white/10 ring-2 ring-[#d8b45c]/70 ring-offset-2 ring-offset-[#1a1a20] sm:h-32 sm:w-32 ${
            isCompany ? 'rounded-3xl' : 'rounded-full'
          }`}
        >
          {avatar ? (
            <Image src={avatar} alt="" width={128} height={128} className="h-full w-full object-cover" />
          ) : (
            <FallbackIcon size={44} className="text-white/50" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d8b45c]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#e8cc84]">
            <BadgeCheck size={13} /> Verified agent
          </span>
          <h1 className="mt-2 text-[30px] font-semibold leading-tight sm:text-[36px]">
            {agent.displayName}
          </h1>
          <p className="mt-1 text-[15px] text-white/70">
            {isCompany ? 'Property agency' : 'Property agent'}
            {agent.yearsExperience ? ` · ${agent.yearsExperience}+ years of experience` : ''}
            {agent.location ? ` · ${agent.location}` : ''}
          </p>
          <div className="mt-2">
            <StarRating value={agent.ratingAverage} count={agent.ratingCount} size={16} />
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <ChatWithAgentButton
            agentId={agent.id}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-[#111112] transition-colors hover:bg-white/85 disabled:opacity-50"
          />
          {agent.whatsapp && (
            <a
              href={waLink(agent.whatsapp)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              <WhatsAppIcon size={16} /> WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Stats band, PropertyFinder-style: the numbers behind the profile. */}
      <div className="grid grid-cols-2 divide-white/10 border-t border-white/10 bg-white/[0.04] sm:grid-cols-4 sm:divide-x">
        {[
          { value: propertyCount, label: 'Properties for sale' },
          { value: agent.yearsExperience ? `${agent.yearsExperience}+` : '—', label: 'Years of experience' },
          { value: agent.ratingAverage ? agent.ratingAverage.toFixed(1) : '—', label: 'Rating' },
          { value: agent.ratingCount, label: 'Reviews' },
        ].map((st) => (
          <div key={st.label} className="px-6 py-5 text-center">
            <p className="text-[26px] font-semibold leading-tight">{st.value}</p>
            <p className="mt-0.5 text-[13px] text-white/60">{st.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The agent's storefront inventory: every property a developer has assigned
 * to them, each card carrying this agent's referral link — a visitor who
 * clicks through tours, books and reserves as this agent's client, and the
 * attribution flows to their deals and traffic reports.
 */
function AgentProperties({ agent, properties }: { agent: Agent; properties: AgentProperty[] }) {
  return (
    <section className="mt-4">
      <h2 className="mb-3 mt-6 text-[20px] font-semibold text-[#111112]">
        Properties by {agent.displayName}
        <span className="ml-2 text-[15px] font-normal text-[#8a8a90]">{properties.length}</span>
      </h2>
      <div className="space-y-4">
        {properties.map((p) => {
          const href = `/${p.slug}?ref=${agent.id}`;
          const price =
            p.priceFrom
              ? `${formatPrice(p.priceFrom, p.currency)}${p.priceTo && p.priceTo !== p.priceFrom ? ` – ${formatPrice(p.priceTo, p.currency)}` : ''}`
              : 'Price on request';
          return (
            <DirectoryCard key={p.id} className="overflow-hidden border border-black/5 p-0">
              <Link href={href} className="flex flex-col gap-0 sm:flex-row">
                {/* Frame */}
                <div className="relative h-52 w-full shrink-0 overflow-hidden sm:h-auto sm:w-72 sm:self-stretch">
                  {p.heroImageUrl ? (
                    <Image
                      src={p.heroImageUrl}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 288px"
                    />
                  ) : (
                    <div className="flex h-full min-h-52 items-center justify-center bg-[#f0f0f2]">
                      <Building2 size={32} className="text-[#c4c4c8]" />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1a7d43]">
                    <BadgeCheck size={12} /> Verified
                  </span>
                </div>

                {/* Facts */}
                <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium uppercase tracking-wide text-[#8a8a90]">
                        {p.category.toLowerCase()}
                        {p.status === 'OFF_PLAN' ? ' · off plan' : ''}
                      </p>
                      <p className="mt-0.5 text-[22px] font-semibold text-[#111112]">{price}</p>
                      <p className="mt-0.5 truncate text-[16px] font-medium text-[#111112]">{p.name}</p>
                      {p.tagline && (
                        <p className="mt-0.5 line-clamp-1 text-[14px] text-[#6b6b70]">{p.tagline}</p>
                      )}
                    </div>
                    {p.developer.logoUrl && (
                      <Image
                        src={p.developer.logoUrl}
                        alt={p.developer.companyName}
                        width={44}
                        height={44}
                        className="hidden h-11 w-11 shrink-0 rounded-xl border border-black/5 object-contain sm:block"
                      />
                    )}
                  </div>

                  <p className="mt-2 flex items-center gap-1.5 text-[14px] text-[#6b6b70]">
                    <MapPin size={14} className="shrink-0" />
                    {[p.neighborhood, p.city].filter(Boolean).join(', ')}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-black/5 pt-3 text-[13px] text-[#6b6b70]">
                    <span>{p._count.units} unit{p._count.units !== 1 ? 's' : ''}</span>
                    {p.hasCinematicTour && (
                      <span className="flex items-center gap-1"><Clapperboard size={13} /> Cinematic</span>
                    )}
                    {p.has3DTour && <span className="flex items-center gap-1"><Box size={13} /> 3D tour</span>}
                    {p.hasVRTour && <span className="flex items-center gap-1"><Headset size={13} /> VR</span>}
                    <span className="ml-auto rounded-full bg-[#111112] px-4 py-1.5 text-[13px] font-medium text-white">
                      View property
                    </span>
                  </div>
                </div>
              </Link>
            </DirectoryCard>
          );
        })}
      </div>
    </section>
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
