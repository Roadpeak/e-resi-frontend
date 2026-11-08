'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';
import { LeadButtons, SaveHeart, SiteKitLayer, useListingSearch, useSiteKit } from '../kit';
import type { AgentSiteData, AgentSiteListing, SiteSectionId } from '../types';
import {
  areasOf, CATEGORY, hasTour, heroImage, Icon, ICON, Img, orderedSections, placeLabel, priceLabel,
  specialtyLabel, statusLabel, useListingFilter, waLink,
} from '../shared';
import { CountUp, EASE, motion, Reveal, Stagger, useAutoplay } from '../motion';
import { greeting, statsFor } from '../base';

/**
 * PORTAL — the agent's site as a property app. A sidebar (a bottom bar on
 * phones), a greeting, a featured carousel with a thumbnail strip, and a
 * search panel with category tiles, location chips and budget bands beside
 * the results.
 */

const BG = '#f4f4f2';
const INK = '#141414';
const MUTED = '#6b6b6b';
const SUPPORTED = ALL_SECTIONS;

const I = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.4-4.4',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  user: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  chat: ICON.chat,
  building: 'M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M8 8h3M8 12h3M8 16h3M2 21h20',
  house: 'M3 11.5 12 4l9 7.5M5 10v10h14V10',
  land: 'M2 18c3-4 6-6 10-6s7 2 10 6M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  shop: 'M4 9h16l-1-5H5zM5 9v11h14V9M9 20v-6h6v6',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
};
const CAT_ICON: Record<string, string> = { APARTMENT: I.building, PENTHOUSE: I.building, VILLA: I.house, TOWNHOUSE: I.house, LAND: I.land, COMMERCIAL: I.shop, MIXED_USE: I.shop };

function useActive(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}

/** Circular text that turns slowly, like a sticker. */
function Badge({ text, accent }: { text: string; accent: string }) {
  return (
    <motion.div className="relative h-24 w-24" animate={{ rotate: 360 }} transition={{ duration: 18, ease: 'linear', repeat: Infinity }}>
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
        <defs><path id="portal-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
        <circle cx="50" cy="50" r="50" fill={accent} />
        <text fill="#fff" fontSize="10.5" fontWeight="600" letterSpacing="2.2"><textPath href="#portal-circle">{text}</textPath></text>
      </svg>
      <span className="absolute inset-0 m-auto flex h-8 w-8 items-center justify-center text-white"><Icon d={I.home} size={20} /></span>
    </motion.div>
  );
}

function Card({ l, accent }: { l: AgentSiteListing; accent: string }) {
  return (
    <a href={l.href} className="group block rounded-[20px] bg-white p-2.5 transition-shadow hover:shadow-[0_10px_30px_rgba(0,0,0,0.07)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[14px]">
        <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
        <span className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-white" style={{ background: accent }}>{statusLabel(l)}</span>
        {hasTour(l) && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium" style={{ color: INK }}>
            <Icon d={ICON.cube} size={12} /> Tour
          </span>
        )}
        <SaveHeart listing={l} className="absolute right-2.5 top-2.5" />
      </div>
      <div className="px-1.5 pb-1 pt-3">
        <p className="text-[17px] font-semibold tracking-tight">{priceLabel(l)}</p>
        <p className="mt-0.5 truncate text-[14.5px] font-medium">{l.name}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[13px]" style={{ color: MUTED }}><Icon d={ICON.pin} size={12} /> {placeLabel(l) || 'Kenya'}</p>
        <div className="mt-3 flex gap-3 border-t border-black/[0.06] pt-3 text-[12.5px]" style={{ color: MUTED }}>
          {CATEGORY[l.category] && <span>{CATEGORY[l.category]}</span>}
          {l.units > 0 && <span>{l.units} units</span>}
          {l.kind === 'PARTNER' && l.developerName && <span className="truncate">by {l.developerName}</span>}
        </div>
      </div>
    </a>
  );
}

export function PortalTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#f0532c';
  const order = orderedSections(data, SUPPORTED);
  const kit = useSiteKit();
  const f = useListingFilter(listings);
  const search = useListingSearch(listings);
  const shown = search.apply(f.shown);
  const areas = areasOf(data);
  const stats = statsFor(data, 4);
  const featured = listings.filter((l) => l.heroImageUrl).slice(0, 6);
  const auto = useAutoplay(featured.length, 5500);
  const cur = featured[auto.index];
  const hero = heroImage(data);
  const active = useActive(['top', 'listings', 'about', 'contact']);
  const [hello, setHello] = useState('Welcome');
  useEffect(() => setHello(greeting()), []);

  const theme: SiteTheme = { ink: INK, muted: MUTED, accent, card: '#ffffff', line: 'rgba(0,0,0,0.08)', radius: 20 };
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const tabs = [
    { id: 'top', label: 'Home', icon: I.home, on: () => go('top') },
    { id: 'listings', label: 'Search', icon: I.search, on: () => go('listings') },
    { id: 'saved', label: 'Saved', icon: I.heart, on: () => kit?.open({ kind: 'saved' }), badge: kit?.saved.length },
    { id: 'about', label: agent.kind === 'COMPANY' ? 'About' : 'Agent', icon: I.user, on: () => go('about') },
    { id: 'contact', label: 'Contact', icon: I.chat, on: () => go('contact') },
  ];

  const pill = (on: boolean) => (on ? { background: INK, color: '#fff', borderColor: INK } : { background: '#fff', color: INK, borderColor: 'rgba(0,0,0,0.1)' });

  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),

    stats: stats.length ? (
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <Reveal key={s.label} className="rounded-[20px] bg-white p-5">
              <p className="text-[32px] font-semibold leading-none tracking-tight"><CountUp value={s.v} decimals={s.d ?? 0} suffix={s.s} /></p>
              <p className="mt-2 text-[13px]" style={{ color: MUTED }}>{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>
    ) : null,

    listings: (
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[28px] font-semibold tracking-tight">Search homes</h2>
            <p className="text-[14px]" style={{ color: MUTED }}>{shown.length} of {listings.length} {listings.length === 1 ? 'property' : 'properties'}</p>
          </div>
          <select value={search.sort} onChange={(e) => search.setSort(e.target.value as 'new' | 'low' | 'high')} aria-label="Sort"
            className="h-10 cursor-pointer rounded-full border border-black/10 bg-white px-4 text-[13.5px] outline-none">
            <option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
          </select>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6 rounded-[20px] bg-white p-5 lg:sticky lg:top-6 lg:self-start">
            <label className="flex h-11 items-center gap-2 rounded-full border border-black/10 px-4">
              <Icon d={I.search} size={15} className="opacity-50" />
              <input value={search.q} onChange={(e) => search.setQ(e.target.value)} placeholder="Name or area" className="w-full bg-transparent text-[14px] outline-none" />
            </label>
            {search.categories.length > 1 && (
              <div>
                <p className="mb-2.5 text-[12.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: MUTED }}>Category</p>
                <div className="grid grid-cols-3 gap-2">
                  {search.categories.map((c) => {
                    const on = search.category === c.key;
                    return (
                      <button key={c.key} type="button" onClick={() => search.setCategory(on ? '' : c.key)} aria-pressed={on}
                        className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-[11.5px] font-medium transition-colors"
                        style={on ? { borderColor: accent, color: accent, background: `${accent}10` } : { borderColor: 'rgba(0,0,0,0.08)' }}>
                        <Icon d={CAT_ICON[c.key] ?? I.building} size={20} />{c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {f.cities.length > 1 && (
              <div>
                <p className="mb-2.5 text-[12.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: MUTED }}>Location</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.cities.map((c) => (
                    <button key={c} type="button" onClick={() => f.setCity(f.city === c ? '' : c)} aria-pressed={f.city === c}
                      className="cursor-pointer rounded-full border px-3 py-1.5 text-[12.5px] font-medium" style={pill(f.city === c)}>{c}</button>
                  ))}
                </div>
              </div>
            )}
            {f.tabs.length > 1 && (
              <div>
                <p className="mb-2.5 text-[12.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: MUTED }}>Listed by</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.tabs.map((t) => (
                    <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                      className="cursor-pointer rounded-full border px-3 py-1.5 text-[12.5px] font-medium" style={pill(f.tab === t.key)}>{t.label}</button>
                  ))}
                </div>
              </div>
            )}
            {search.bands.length > 1 && (
              <div>
                <p className="mb-2.5 text-[12.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: MUTED }}>Budget</p>
                <div className="space-y-1.5">
                  {search.bands.map((b) => (
                    <label key={b.key} className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
                      <input type="radio" name="portal-band" checked={search.band === b.key} onChange={() => search.setBand(b.key)} style={{ accentColor: accent }} />
                      {b.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {(search.active || f.city || f.tab !== 'ALL') && (
              <button type="button" onClick={() => { search.reset(); f.setCity(''); f.setTab('ALL'); }}
                className="w-full cursor-pointer rounded-full border border-black/10 py-2.5 text-[13.5px] font-medium hover:bg-black/[0.03]">Clear filters</button>
            )}
          </aside>
          <div>
            {shown.length === 0 ? (
              <p className="rounded-[20px] bg-white p-10 text-center text-[15px]" style={{ color: MUTED }}>
                {listings.length ? 'No homes match these filters.' : 'New homes are on the way. Get in touch to hear first.'}
              </p>
            ) : (
              <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((l) => <Card key={l.id} l={l} accent={accent} />)}
              </Stagger>
            )}
          </div>
        </div>
      </section>
    ),

    about: (
      <section id="about" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-10 sm:px-6">
        <div className="grid gap-6 rounded-[24px] bg-white p-6 sm:p-8 md:grid-cols-[200px_1fr]">
          <Img src={agent.photoUrl ?? agent.logoUrl} alt={agent.displayName} className="aspect-square w-full rounded-[18px] object-cover" />
          <div>
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: accent }}>{agent.kind === 'COMPANY' ? 'About us' : 'Your agent'}</p>
            <h2 className="mt-1.5 text-[28px] font-semibold tracking-tight">{agent.displayName}</h2>
            {agent.bio && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: '#3a3a3a' }}>{agent.bio}</p>}
            {agent.specialties.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {agent.specialties.map((s) => <span key={s} className="rounded-full bg-black/[0.05] px-3 py-1 text-[12.5px]">{specialtyLabel(s)}</span>)}
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2 text-[13.5px]">
              {agent.phone && <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 hover:bg-black/[0.03]"><Icon d={ICON.phone} size={14} /> {agent.phone}</a>}
              {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 hover:bg-black/[0.03]"><Icon d={ICON.chat} size={14} /> WhatsApp</a>}
              {agent.email && <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 hover:bg-black/[0.03]"><Icon d={ICON.mail} size={14} /> Email</a>}
            </div>
          </div>
        </div>
      </section>
    ),

    areas: areas.length ? (
      <section id="areas" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-10 sm:px-6">
        <h2 className="text-[24px] font-semibold tracking-tight">Browse by area</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {areas.slice(0, 12).map((a) => (
            <button key={a.name} type="button"
              onClick={() => { if (f.cities.includes(a.name)) f.setCity(a.name); else search.setQ(a.name); go('listings'); }}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-[16px] bg-white px-4 py-4 text-left transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium">{a.name}</span>
                <span className="text-[12.5px]" style={{ color: MUTED }}>{a.count ? `${a.count} listing${a.count === 1 ? '' : 's'}` : 'Ask us'}</span>
              </span>
              <Icon d={ICON.arrowUpRight} size={15} />
            </button>
          ))}
        </div>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-6 rounded-[24px] p-8 text-white md:flex-row md:items-center md:justify-between" style={{ background: INK }}>
          <div>
            <h2 className="text-[30px] font-semibold tracking-tight">Found something you like?</h2>
            <p className="mt-2 max-w-md text-[15px] text-white/70">Send a message or book a viewing. {agent.displayName} replies the same day.</p>
          </div>
          <LeadButtons theme={theme} tone="dark" />
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, ['--accent' as string]: accent }}>
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-black/[0.06] bg-white px-4 py-6 lg:flex">
        <a href="#top" className="flex items-center gap-2.5 px-2">
          {agent.logoUrl ? <Img src={agent.logoUrl} alt="" className="h-9 w-9 rounded-xl object-cover" eager />
            : <span className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold text-white" style={{ background: accent }}>{agent.displayName.charAt(0)}</span>}
          <span className="truncate text-[16px] font-semibold tracking-tight">{agent.displayName}</span>
        </a>
        <nav className="mt-8 space-y-1">
          {tabs.map((t) => {
            const on = active === t.id;
            return (
              <button key={t.id} type="button" onClick={t.on}
                className="relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition-colors"
                style={{ color: on ? '#fff' : INK }}>
                {on && <motion.span layoutId="portal-nav" className="absolute inset-0 rounded-xl" style={{ background: INK }} transition={{ duration: 0.35, ease: EASE }} />}
                <span className="relative flex items-center gap-3"><Icon d={t.icon} size={18} />{t.label}</span>
                {!!t.badge && <span className="relative ml-auto rounded-full px-2 text-[11.5px] font-semibold text-white" style={{ background: accent }}>{t.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-black/[0.04] p-3">
          <div className="flex items-center gap-2.5">
            <Img src={agent.photoUrl ?? agent.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold">{agent.displayName}</p>
              <p className="truncate text-[12px]" style={{ color: MUTED }}>{agent.phone ?? agent.email ?? 'Property agent'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Bottom bar (phones) */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl bg-white px-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] lg:hidden">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={t.on} aria-label={t.label}
            className="relative flex cursor-pointer flex-col items-center gap-0.5 px-2 py-1 text-[10.5px] font-medium"
            style={{ color: active === t.id ? accent : MUTED }}>
            <Icon d={t.icon} size={20} />{t.label}
            {!!t.badge && <span className="absolute -top-0.5 right-1 h-2 w-2 rounded-full" style={{ background: accent }} />}
          </button>
        ))}
      </nav>

      <main className="pb-24 lg:ml-60 lg:pb-0">
        <section id="top" className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[14px]" style={{ color: MUTED }}>{hello}</p>
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">{agent.siteTagline ?? `Find your next home with ${agent.displayName}`}</h1>
            </div>
            {kit?.forms.viewing && (
              <button type="button" onClick={() => kit.open({ kind: 'viewing' })} className="hidden cursor-pointer rounded-full px-5 py-2.5 text-[14px] font-medium text-white sm:block" style={{ background: accent }}>
                Book a viewing
              </button>
            )}
          </div>

          {cur ? (
            <div className="relative mt-6">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] sm:aspect-[21/9]">
                <AnimatePresence initial={false}>
                  <motion.div key={cur.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: EASE }}>
                    <Img src={cur.heroImageUrl} alt={cur.name} className="h-full w-full object-cover" eager />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
                  <a href={cur.href} className="max-w-sm rounded-[20px] bg-white p-4 sm:p-5">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: accent }}>Featured · {statusLabel(cur)}</p>
                    <p className="mt-1 text-[19px] font-semibold leading-snug">{cur.name}</p>
                    <p className="text-[13px]" style={{ color: MUTED }}>{placeLabel(cur)}</p>
                    <p className="mt-2 text-[16px] font-semibold">{priceLabel(cur)}</p>
                  </a>
                  {featured.length > 1 && (
                    <div className="flex gap-2">
                      <button type="button" onClick={auto.prev} aria-label="Previous" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white"><Icon d={ICON.prev} size={17} /></button>
                      <button type="button" onClick={auto.next} aria-label="Next" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white"><Icon d={ICON.next} size={17} /></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -right-2 -top-6 hidden sm:block"><Badge text="VERIFIED HOMES • LIVE TOURS • " accent={accent} /></div>
              {featured.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {featured.map((l, i) => (
                    <button key={l.id} type="button" onClick={() => auto.go(i)} aria-label={`Show ${l.name}`}
                      className="relative h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl transition-opacity"
                      style={{ opacity: i === auto.index ? 1 : 0.55, outline: i === auto.index ? `2px solid ${accent}` : 'none', outlineOffset: 2 }}>
                      <Img src={l.heroImageUrl} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : hero ? (
            <Img src={hero} className="mt-6 aspect-[21/9] w-full rounded-[28px] object-cover" eager />
          ) : null}
        </section>

        {order.map((id) => <div key={id}>{blocks[id]}</div>)}

        <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.07] pt-6 text-[13px]" style={{ color: MUTED }}>
            <span>© {new Date().getFullYear()} {agent.displayName}</span>
            <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a>
            <LegalLine data={data} color={MUTED} />
          </div>
        </footer>
      </main>
      <SiteKitLayer theme={theme} hideDock />
    </div>
  );
}
