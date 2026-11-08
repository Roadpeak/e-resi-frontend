'use client';

import { useMemo, useState } from 'react';
import { formatPrice } from '../../lib/utils';

export interface AgentSiteListing {
  id: string; slug: string; name: string; tagline: string | null; heroImageUrl: string | null;
  city: string | null; neighborhood: string | null; category: string; status: string;
  priceFrom: number | null; priceTo: number | null; currency: string | null;
  has3DTour: boolean; hasVRTour: boolean; hasCinematicTour: boolean;
  developerName: string | null; units: number; kind: 'OWN' | 'PARTNER'; href: string;
}

export interface AgentSiteData {
  url: string | null;
  agent: {
    id: string; kind: 'COMPANY' | 'INDIVIDUAL'; displayName: string; logoUrl: string | null; photoUrl: string | null;
    bio: string | null; yearsExperience: number | null; specialties: string[]; serviceAreas: string[];
    phone: string | null; whatsapp: string | null; email: string | null; officeAddress: string | null;
    socials: Record<string, string> | null; ratingAverage: number | null; ratingCount: number; dealsCompleted: number;
    siteTagline: string | null; siteAccent: string | null; siteHeroUrl: string | null;
  };
  listings: AgentSiteListing[];
}

const CATEGORY: Record<string, string> = {
  APARTMENT: 'Apartments', VILLA: 'Villas', TOWNHOUSE: 'Townhouses', MIXED_USE: 'Mixed use',
  COMMERCIAL: 'Commercial', LAND: 'Land', PENTHOUSE: 'Penthouses',
};

const waLink = (n: string) => `https://wa.me/${n.replace(/[^\d]/g, '')}`;

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const PHONE = 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z';
const MAIL = 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm18 2-10 7L2 6';
const CHAT = 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 20l1.1-4.5A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z';
const PIN = 'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z';
const ARROW = 'M5 12h14M13 6l6 6-6 6';

export function AgentSiteView({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#1a73e8';
  const own = listings.filter((l) => l.kind === 'OWN');
  const partner = listings.filter((l) => l.kind === 'PARTNER');
  const tabs = [
    { key: 'ALL', label: 'All', n: listings.length },
    ...(own.length && partner.length ? [
      { key: 'OWN', label: 'Our listings', n: own.length },
      { key: 'PARTNER', label: 'Partner developments', n: partner.length },
    ] : []),
  ];
  const [tab, setTab] = useState('ALL');
  const [city, setCity] = useState('');
  const cities = useMemo(() => [...new Set(listings.map((l) => l.city).filter(Boolean) as string[])].sort(), [listings]);
  const shown = listings.filter((l) => (tab === 'ALL' || l.kind === tab) && (!city || l.city === city));
  const mark = agent.logoUrl ?? agent.photoUrl;
  const hero = agent.siteHeroUrl ?? listings.find((l) => l.heroImageUrl)?.heroImageUrl ?? null;

  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ ['--accent' as string]: accent }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            {mark ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mark} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white" style={{ background: accent }}>
                {agent.displayName.charAt(0)}
              </span>
            )}
            <span className="truncate text-[16px] font-semibold tracking-tight">{agent.displayName}</span>
          </a>
          <nav className="hidden items-center gap-7 text-[14px] text-[#444] sm:flex">
            <a href="#listings" className="hover:text-black">Listings</a>
            {agent.bio && <a href="#about" className="hover:text-black">About</a>}
            <a href="#contact" className="hover:text-black">Contact</a>
          </nav>
          <a href="#contact" className="shrink-0 rounded-full px-4 py-2 text-[14px] font-medium text-white" style={{ background: accent }}>
            Get in touch
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative">
        {hero ? (
          <div className="relative h-[52vh] min-h-[340px] w-full overflow-hidden bg-[#f2f2f2]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
                <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/80">
                  {agent.kind === 'COMPANY' ? 'Real estate agency' : 'Real estate agent'}
                </p>
                <h1 className="mt-2 max-w-3xl text-[34px] font-semibold leading-tight text-white sm:text-[48px]">
                  {agent.siteTagline ?? `Homes and developments with ${agent.displayName}`}
                </h1>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl px-4 pb-6 pt-14 sm:px-6">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em]" style={{ color: accent }}>
              {agent.kind === 'COMPANY' ? 'Real estate agency' : 'Real estate agent'}
            </p>
            <h1 className="mt-2 max-w-3xl text-[34px] font-semibold leading-tight sm:text-[48px]">
              {agent.siteTagline ?? `Homes and developments with ${agent.displayName}`}
            </h1>
          </div>
        )}
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-10 gap-y-3 px-4 py-6 text-[14px] text-[#555] sm:px-6">
          <span><strong className="text-[18px] font-semibold text-black">{listings.length}</strong> developments</span>
          {agent.dealsCompleted > 0 && <span><strong className="text-[18px] font-semibold text-black">{agent.dealsCompleted}</strong> deals closed</span>}
          {agent.yearsExperience ? <span><strong className="text-[18px] font-semibold text-black">{agent.yearsExperience}</strong> years experience</span> : null}
          {agent.ratingCount > 0 && agent.ratingAverage != null && (
            <span><strong className="text-[18px] font-semibold text-black">{agent.ratingAverage.toFixed(1)}</strong> rating · {agent.ratingCount} reviews</span>
          )}
        </div>
      </section>

      {/* Listings */}
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[26px] font-semibold tracking-tight">Listings</h2>
          <div className="flex flex-wrap items-center gap-2">
            {tabs.length > 1 && tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className="rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors"
                style={tab === t.key ? { background: '#111', borderColor: '#111', color: '#fff' } : { borderColor: '#ddd', color: '#333' }}
              >
                {t.label} <span className="opacity-60">{t.n}</span>
              </button>
            ))}
            {cities.length > 1 && (
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Filter by city"
                className="rounded-full border border-[#ddd] bg-white px-3 py-1.5 text-[13px] text-[#333]"
              >
                <option value="">All locations</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-[#ddd] p-10 text-center text-[15px] text-[#666]">
            New listings are on the way. Get in touch to hear about them first.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((l) => (
              <a key={l.id} href={l.href} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f2f2f2]">
                  {l.heroImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.heroImageUrl} alt={l.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {l.status === 'OFF_PLAN' && <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium">Off-plan</span>}
                    {l.status === 'SOLD_OUT' && <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium">Sold out</span>}
                    {(l.has3DTour || l.hasVRTour) && <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium">3D tour</span>}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[17px] font-semibold leading-snug">{l.name}</h3>
                    <span className="mt-1 shrink-0 text-[#999] transition-colors group-hover:text-[color:var(--accent)]"><Icon d={ARROW} size={16} /></span>
                  </div>
                  <p className="mt-0.5 text-[14px] text-[#666]">
                    {[l.neighborhood, l.city].filter(Boolean).join(', ')}
                    {CATEGORY[l.category] ? ` · ${CATEGORY[l.category]}` : ''}
                  </p>
                  <p className="mt-1.5 text-[14px] font-medium">
                    {l.priceFrom ? `From ${formatPrice(l.priceFrom, l.currency ?? 'KES')}` : 'Price on request'}
                  </p>
                  {l.developerName && <p className="mt-0.5 text-[12.5px] text-[#888]">By {l.developerName}</p>}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* About */}
      {agent.bio && (
        <section id="about" className="scroll-mt-20 border-t border-black/[0.06] bg-[#fafafa]">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-[26px] font-semibold tracking-tight">About</h2>
              {agent.photoUrl && agent.kind === 'INDIVIDUAL' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agent.photoUrl} alt={agent.displayName} className="mt-5 h-40 w-40 rounded-2xl object-cover" />
              )}
            </div>
            <div>
              <p className="whitespace-pre-line text-[16px] leading-relaxed text-[#333]">{agent.bio}</p>
              {(agent.specialties.length > 0 || agent.serviceAreas.length > 0) && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {[...agent.serviceAreas, ...agent.specialties.map((s) => s.replace(/_/g, ' ').toLowerCase())].map((t) => (
                    <span key={t} className="rounded-full border border-[#ddd] bg-white px-3 py-1 text-[13px] capitalize text-[#444]">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 border-t border-black/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-[26px] font-semibold tracking-tight">Talk to {agent.displayName}</h2>
          <p className="mt-2 max-w-xl text-[15px] text-[#666]">Ask about a development, book a viewing or a live guided tour.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {agent.whatsapp && (
              <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium text-white" style={{ background: accent }}>
                <Icon d={CHAT} /> WhatsApp
              </a>
            )}
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-2 rounded-full border border-[#ddd] px-5 py-3 text-[15px] font-medium hover:bg-[#f6f6f6]">
                <Icon d={PHONE} /> {agent.phone}
              </a>
            )}
            {agent.email && (
              <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-2 rounded-full border border-[#ddd] px-5 py-3 text-[15px] font-medium hover:bg-[#f6f6f6]">
                <Icon d={MAIL} /> {agent.email}
              </a>
            )}
          </div>
          {agent.officeAddress && (
            <p className="mt-5 inline-flex items-center gap-2 text-[14px] text-[#666]"><Icon d={PIN} size={16} /> {agent.officeAddress}</p>
          )}
        </div>
      </section>

      <footer className="border-t border-black/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-[#888] sm:px-6">
          <span>© {new Date().getFullYear()} {agent.displayName}</span>
          <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a>
        </div>
      </footer>
    </div>
  );
}
