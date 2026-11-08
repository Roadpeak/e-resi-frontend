'use client';

import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from './sections';

import type { ReactNode } from 'react';
import type { AgentSiteData, SiteSectionId } from './types';
import {
  areasOf, CATEGORY, Icon, ICON, orderedSections, priceLabel, specialtyLabel, useListingFilter, waLink,
} from './shared';

export type { AgentSiteData, AgentSiteListing } from './types';

const SUPPORTED = ALL_SECTIONS;

/** CLASSIC — the original, always-free agent site. */
export function AgentSiteView({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#1a73e8';
  const f = useListingFilter(listings);
  const mark = agent.logoUrl ?? agent.photoUrl;
  const hero = agent.siteHeroUrl ?? listings.find((l) => l.heroImageUrl)?.heroImageUrl ?? null;
  const order = orderedSections(data, SUPPORTED);
  const areas = areasOf(data);

  const theme: SiteTheme = { ink: '#111111', muted: '#666666', accent, card: '#f6f6f6', line: 'rgba(0,0,0,0.08)', radius: 16 };
  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),
    stats: (
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-10 gap-y-3 px-4 py-6 text-[14px] text-[#555] sm:px-6">
        <span><strong className="text-[18px] font-semibold text-black">{listings.length}</strong> developments</span>
        {agent.dealsCompleted > 0 && <span><strong className="text-[18px] font-semibold text-black">{agent.dealsCompleted}</strong> deals closed</span>}
        {agent.yearsExperience ? <span><strong className="text-[18px] font-semibold text-black">{agent.yearsExperience}</strong> years experience</span> : null}
        {agent.ratingCount > 0 && agent.ratingAverage != null && (
          <span><strong className="text-[18px] font-semibold text-black">{agent.ratingAverage.toFixed(1)}</strong> rating · {agent.ratingCount} reviews</span>
        )}
      </div>
    ),
    listings: (
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[26px] font-semibold tracking-tight">Listings</h2>
          <div className="flex flex-wrap items-center gap-2">
            {f.tabs.length > 1 && f.tabs.map((t) => (
              <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                className="rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors"
                style={f.tab === t.key ? { background: '#111', borderColor: '#111', color: '#fff' } : { borderColor: '#ddd', color: '#333' }}>
                {t.label} <span className="opacity-60">{t.n}</span>
              </button>
            ))}
            {f.cities.length > 1 && (
              <select value={f.city} onChange={(e) => f.setCity(e.target.value)} aria-label="Filter by city"
                className="rounded-full border border-[#ddd] bg-white px-3 py-1.5 text-[13px] text-[#333]">
                <option value="">All locations</option>
                {f.cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>
        {f.shown.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-[#ddd] p-10 text-center text-[15px] text-[#666]">
            New listings are on the way. Get in touch to hear about them first.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {f.shown.map((l) => (
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
                    <span className="mt-1 shrink-0 text-[#999] transition-colors group-hover:text-[color:var(--accent)]"><Icon d={ICON.arrow} size={16} /></span>
                  </div>
                  <p className="mt-0.5 text-[14px] text-[#666]">
                    {[l.neighborhood, l.city].filter(Boolean).join(', ')}
                    {CATEGORY[l.category] ? ` · ${CATEGORY[l.category]}` : ''}
                  </p>
                  <p className="mt-1.5 text-[14px] font-medium">{priceLabel(l)}</p>
                  {l.developerName && <p className="mt-0.5 text-[12.5px] text-[#888]">By {l.developerName}</p>}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    ),
    about: agent.bio ? (
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
            {agent.specialties.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {agent.specialties.map((t) => (
                  <span key={t} className="rounded-full border border-[#ddd] bg-white px-3 py-1 text-[13px] text-[#444]">{specialtyLabel(t)}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    ) : null,
    areas: areas.length ? (
      <section id="areas" className="scroll-mt-20 border-t border-black/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-[26px] font-semibold tracking-tight">Areas we cover</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {areas.map((a) => (
              <span key={a.name} className="rounded-full border border-[#ddd] px-4 py-2 text-[14px] text-[#333]">
                {a.name}{a.count ? <span className="ml-1.5 text-[#999]">{a.count}</span> : null}
              </span>
            ))}
          </div>
        </div>
      </section>
    ) : null,
    contact: (
      <section id="contact" className="scroll-mt-20 border-t border-black/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-[26px] font-semibold tracking-tight">Talk to {agent.displayName}</h2>
          <p className="mt-2 max-w-xl text-[15px] text-[#666]">Ask about a development, book a viewing or a live guided tour.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {agent.whatsapp && (
              <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium text-white" style={{ background: accent }}>
                <Icon d={ICON.chat} /> WhatsApp
              </a>
            )}
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-2 rounded-full border border-[#ddd] px-5 py-3 text-[15px] font-medium hover:bg-[#f6f6f6]">
                <Icon d={ICON.phone} /> {agent.phone}
              </a>
            )}
            {agent.email && (
              <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-2 rounded-full border border-[#ddd] px-5 py-3 text-[15px] font-medium hover:bg-[#f6f6f6]">
                <Icon d={ICON.mail} /> {agent.email}
              </a>
            )}
          </div>
          {agent.officeAddress && (
            <p className="mt-5 inline-flex items-center gap-2 text-[14px] text-[#666]"><Icon d={ICON.pin} size={16} /> {agent.officeAddress}</p>
          )}
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ ['--accent' as string]: accent }}>
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
            {order.includes('listings') && <a href="#listings" className="hover:text-black">Listings</a>}
            {order.includes('about') && agent.bio && <a href="#about" className="hover:text-black">About</a>}
            {order.includes('contact') && <a href="#contact" className="hover:text-black">Contact</a>}
          </nav>
          <a href="#contact" className="shrink-0 rounded-full px-4 py-2 text-[14px] font-medium text-white" style={{ background: accent }}>
            Get in touch
          </a>
        </div>
      </header>

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
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="border-t border-black/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-[#888] sm:px-6">
          <span>© {new Date().getFullYear()} {agent.displayName}</span>
          <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a>
          <LegalLine data={data} color={'#888'} />
        </div>
      </footer>
    </div>
  );
}
