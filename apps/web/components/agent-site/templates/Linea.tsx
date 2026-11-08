'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';
import { LeadButtons, SaveHeart, SiteKitLayer, useListingSearch } from '../kit';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, CATEGORY, Icon, ICON, Img, orderedSections, placeLabel, priceLabel, specialtyLabel, statusLabel,
  useListingFilter, waLink,
} from '../shared';
import { EASE, LiveClock, motion, Reveal, Stagger } from '../motion';

/**
 * LINEA — minimal, like a well-made link-in-bio. Live search in the header,
 * a sentence for a hero with the agent's photo set inline, a live clock,
 * badges, and a clean listing grid that loads more as you go.
 */

const BG = '#ececea';
const INK = '#151515';
const MUTED = '#8a8a86';
const SUPPORTED = ALL_SECTIONS;
const PAGE = 6;

export function LineaTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#ff5a3c';
  const order = orderedSections(data, SUPPORTED);
  const f = useListingFilter(listings);
  const search = useListingSearch(listings);
  const shown = search.apply(f.shown);
  const areas = areasOf(data);
  const [limit, setLimit] = useState(PAGE);
  const [menu, setMenu] = useState(false);
  const [focus, setFocus] = useState(false);
  const theme: SiteTheme = { ink: INK, muted: MUTED, accent, card: '#f6f6f4', line: 'rgba(0,0,0,0.1)', radius: 18 };
  const parts = agent.displayName.split(' ');
  const last = parts.length > 1 ? parts.pop()! : '';
  const first = parts.join(' ');
  const city = agent.serviceAreas[0] ?? listings.find((l) => l.city)?.city ?? 'Nairobi';
  const badges = (data.content?.awards?.length
    ? data.content.awards.map((a) => ({ t: a.title, s: [a.issuer, a.year].filter(Boolean).join(' · ') }))
    : agent.specialties.map((s) => ({ t: specialtyLabel(s), s: 'Specialist' }))).slice(0, 4);
  const hits = useMemo(() => {
    const q = search.q.trim().toLowerCase();
    if (!q) return [];
    return listings.filter((l) => [l.name, l.city, l.neighborhood].some((v) => v?.toLowerCase().includes(q))).slice(0, 5);
  }, [search.q, listings]);

  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),
    stats: null,
    about: null,

    listings: (
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em]">Listings <span style={{ color: MUTED }}>{shown.length}</span></h2>
          <div className="flex flex-wrap gap-2 text-[13px]">
            {f.tabs.length > 1 && f.tabs.map((t) => (
              <button key={t.key} type="button" onClick={() => { f.setTab(t.key); setLimit(PAGE); }} aria-pressed={f.tab === t.key}
                className="cursor-pointer rounded-full px-3 py-1" style={f.tab === t.key ? { background: INK, color: '#fff' } : { color: MUTED }}>{t.label}</button>
            ))}
            {search.categories.length > 1 && search.categories.map((c) => (
              <button key={c.key} type="button" onClick={() => { search.setCategory(search.category === c.key ? '' : c.key); setLimit(PAGE); }} aria-pressed={search.category === c.key}
                className="cursor-pointer rounded-full px-3 py-1" style={search.category === c.key ? { background: accent, color: '#fff' } : { color: MUTED }}>{c.label}</button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="mt-8 text-[15px]" style={{ color: MUTED }}>{search.active ? 'Nothing matches yet.' : 'New listings soon.'}</p>
        ) : (
          <>
            <Stagger className="mt-6 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {shown.slice(0, limit).map((l) => (
                <a key={l.id} href={l.href} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[18px]">
                    <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
                    <p className="absolute left-4 top-4 text-[20px] font-semibold tracking-tight text-white">{priceLabel(l, '')}</p>
                    <SaveHeart listing={l} className="absolute right-3 top-3" />
                  </div>
                  <p className="mt-3 text-[15.5px] font-medium" style={{ color: accent }}>{l.name}</p>
                  <p className="mt-0.5 text-[14px]" style={{ color: MUTED }}>{placeLabel(l) || 'Kenya'}</p>
                  <div className="mt-2 flex gap-4 text-[13px]" style={{ color: INK }}>
                    <span>{statusLabel(l)}</span>{CATEGORY[l.category] && <span>{CATEGORY[l.category]}</span>}{l.units > 0 && <span>{l.units} units</span>}
                  </div>
                </a>
              ))}
            </Stagger>
            {shown.length > limit && (
              <div className="mt-10 text-center">
                <button type="button" onClick={() => setLimit((n) => n + PAGE)} className="cursor-pointer rounded-full px-6 py-3 text-[14px] font-medium text-white" style={{ background: INK }}>
                  Load more <span className="opacity-60">({shown.length - limit})</span>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    ),

    areas: areas.length ? (
      <section id="areas" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em]">Areas</p>
        <p className="mt-4 max-w-4xl text-[28px] leading-snug tracking-tight sm:text-[36px]">
          {areas.map((a, i) => (
            <span key={a.name}>
              <button type="button" onClick={() => { search.setQ(a.name); document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="cursor-pointer transition-colors hover:text-[color:var(--accent)]" style={{ color: i % 2 ? MUTED : INK }}>{a.name}</button>
              {i < areas.length - 1 ? <span style={{ color: MUTED }}>, </span> : '.'}
            </span>
          ))}
        </p>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="rounded-[24px] bg-white p-8 sm:p-12">
          <p className="max-w-3xl text-[30px] leading-[1.2] tracking-tight sm:text-[44px]">
            <span style={{ color: MUTED }}>Interested?</span> Let’s talk about what you’re looking for.
          </p>
          <div className="mt-8"><LeadButtons theme={theme} /></div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px]" style={{ color: MUTED }}>
            {agent.phone && <a href={`tel:${agent.phone}`} className="hover:text-black">{agent.phone}</a>}
            {agent.email && <a href={`mailto:${agent.email}`} className="hover:text-black">{agent.email}</a>}
            {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="hover:text-black">WhatsApp</a>}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, ['--accent' as string]: accent }}>
      <header className="sticky top-0 z-40" style={{ background: 'rgba(236,236,234,0.92)', backdropFilter: 'blur(10px)' }}>
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
          <div className="relative">
            <label className="flex h-10 w-full max-w-[240px] items-center gap-2 rounded-full bg-white px-3.5">
              <Icon d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.4-4.4" size={14} className="opacity-50" />
              <input value={search.q} onChange={(e) => search.setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
                placeholder="Search for a listing" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9a9a96]" />
            </label>
            <AnimatePresence>
              {focus && hits.length > 0 && (
                <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE }}
                  className="absolute left-0 top-12 w-[300px] overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
                  {hits.map((l) => (
                    <li key={l.id}>
                      <a href={l.href} className="flex items-center gap-3 rounded-xl p-2 hover:bg-black/[0.04]">
                        <Img src={l.heroImageUrl} className="h-10 w-12 rounded-lg object-cover" />
                        <span className="min-w-0"><span className="block truncate text-[13.5px] font-medium">{l.name}</span><span className="text-[12px]" style={{ color: MUTED }}>{priceLabel(l)}</span></span>
                      </a>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <a href="#top" className="whitespace-nowrap text-[17px] font-semibold tracking-tight">
            {first} {last && <span className="rounded-md px-1.5 text-white" style={{ background: accent }}>{last}</span>}
          </a>
          <div className="flex items-center justify-end gap-3 text-[13.5px]">
            <span className="hidden tabular-nums sm:inline" style={{ color: MUTED }}>{city} · <LiveClock /></span>
            <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} className="flex h-10 cursor-pointer items-center rounded-full bg-white px-4 font-medium">
              {menu ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menu && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
              <div className="mx-auto flex max-w-6xl flex-wrap justify-end gap-x-8 gap-y-2 px-4 pb-5 text-[15px] sm:px-6">
                <a href="#listings" onClick={() => setMenu(false)}>Listings</a>
                <a href="#contact" onClick={() => setMenu(false)}>Contact</a>
                {agent.phone && <a href={`tel:${agent.phone}`}>{agent.phone}</a>}
                {agent.email && <a href={`mailto:${agent.email}`}>{agent.email}</a>}
                {Object.entries(agent.socials ?? {}).filter(([, v]) => v).slice(0, 4).map(([k, v]) => <a key={k} href={v} target="_blank" rel="noreferrer" className="capitalize">{k}</a>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section id="top" className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
        <Reveal>
          <h1 className="max-w-5xl text-[34px] font-medium leading-[1.25] tracking-tight sm:text-[56px]">
            <span style={{ color: MUTED }}>Hi, {agent.kind === 'COMPANY' ? 'we’re' : 'I’m'}</span> {agent.kind === 'COMPANY' ? agent.displayName : first || agent.displayName}
            <span className="mx-2 inline-block h-[0.95em] w-[0.95em] translate-y-[0.12em] overflow-hidden rounded-full align-baseline sm:mx-3">
              <Img src={agent.photoUrl ?? agent.logoUrl} alt="" className="h-full w-full object-cover" eager />
            </span>
            <span style={{ color: MUTED }}>{agent.kind === 'COMPANY' ? 'a property team' : 'a property agent'}</span>
            {agent.yearsExperience ? <> with {agent.yearsExperience} years</> : null}
            <span style={{ color: MUTED }}> helping people find homes in </span>{city}.
          </h1>
        </Reveal>
        {badges.length > 0 && (
          <Stagger className="mt-10 flex flex-wrap gap-3">
            {badges.map((b) => (
              <div key={b.t} className="flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ background: accent }}>
                  <Icon d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" size={15} />
                </span>
                <span><span className="block text-[14px] font-medium">{b.t}</span>{b.s && <span className="text-[12px]" style={{ color: MUTED }}>{b.s}</span>}</span>
              </div>
            ))}
          </Stagger>
        )}
        {agent.bio && <Reveal delay={0.1}><p className="mt-10 max-w-2xl whitespace-pre-line text-[16px] leading-relaxed" style={{ color: '#4a4a46' }}>{agent.bio}</p></Reveal>}
        <Reveal delay={0.15}><a href="#contact" className="mt-8 inline-flex items-center gap-2 text-[15px] font-medium" style={{ color: accent }}>Get in touch <Icon d={ICON.arrow} size={16} /></a></Reveal>
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.1)', color: MUTED }}>
          <span>© {new Date().getFullYear()} {agent.displayName}</span>
          <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a>
          <LegalLine data={data} color={MUTED} />
        </div>
      </footer>
      <SiteKitLayer theme={theme} />
    </div>
  );
}
