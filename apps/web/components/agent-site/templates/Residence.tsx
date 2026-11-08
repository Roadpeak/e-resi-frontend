'use client';

import { useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';
import { areaHref, listingsIn } from '../guides';
import { LeadButtons, SaveHeart, SiteKitLayer, useListingSearch, useSiteKit } from '../kit';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, CATEGORY, heroImage, Icon, Img, orderedSections, placeLabel, priceLabel, statusLabel,
  useListingFilter, waLink,
} from '../shared';
import { CountUp, EASE, motion, Reveal, Stagger } from '../motion';
import { navFor, statsFor } from '../base';

/**
 * RESIDENCE — a complete estate-agency site. A rounded hero with a search
 * panel overlapping it and popular-search chips, a KPI strip, featured
 * homes, a numbered neighbourhood list that previews the one you point
 * at, and owner cards for selling and letting.
 */

const BG = '#f6f3ee';
const INK = '#1b1a18';
const MUTED = '#77736b';
const SUPPORTED = ALL_SECTIONS;

export function ResidenceTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#1b1a18';
  const order = orderedSections(data, SUPPORTED);
  const hero = heroImage(data);
  const kit = useSiteKit();
  const f = useListingFilter(listings);
  const search = useListingSearch(listings);
  const shown = search.apply(f.shown);
  const stats = statsFor(data, 4);
  const nav = navFor(data, order, { listings: 'Buy' });
  const [where, setWhere] = useState('');
  const [type, setType] = useState('');
  const [band, setBand] = useState('');
  const [hover, setHover] = useState(0);
  const since = data.stats?.onPlatformSince;
  const region = agent.serviceAreas[0] ?? listings.find((l) => l.city)?.city ?? 'Nairobi';
  const theme: SiteTheme = { ink: INK, muted: MUTED, accent, card: '#ffffff', line: 'rgba(0,0,0,0.1)', radius: 20 };
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const valuation = () => (kit?.forms.valuation && order.includes('valuation') ? go('valuation') : kit?.open({ kind: 'contact' }));

  const runSearch = () => { f.setCity(where); search.setCategory(type); search.setBand(band); go('listings'); };
  const chips = [
    ...search.categories.slice(0, 2).map((c) => ({ label: c.label, on: () => { search.setCategory(c.key); go('listings'); } })),
    ...search.bands.slice(0, 1).map((b) => ({ label: b.label, on: () => { search.setBand(b.key); go('listings'); } })),
    ...f.cities.slice(0, 1).map((c) => ({ label: `In ${c}`, on: () => { f.setCity(c); go('listings'); } })),
  ];

  // Neighbourhoods: the agent's area guides when there are some, else where the listings are.
  const guides = data.content?.guides ?? [];
  const hoods = (guides.length
    ? guides.map((g) => ({ name: g.name, blurb: g.summary ?? g.tagline ?? '', img: g.coverUrl ?? null, count: listingsIn(listings, g).length, price: g.priceFrom, commute: g.commute, href: g.hasPage ? areaHref(agent.id, g.slug) : null }))
    : areasOf(data).map((a) => ({ name: a.name, blurb: '', img: listings.find((l) => (l.neighborhood === a.name || l.city === a.name) && l.heroImageUrl)?.heroImageUrl ?? null, count: a.count, price: undefined as number | undefined, commute: undefined as string | undefined, href: null as string | null }))
  ).slice(0, 6);
  const h = hoods[hover];

  const sel = 'h-12 w-full cursor-pointer rounded-xl border border-black/10 bg-white px-3 text-[14px] outline-none';
  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),

    stats: stats.length ? (
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 border-y md:grid-cols-4" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
          {stats.map((s, i) => (
            <div key={s.label} className={`px-4 py-7 ${i ? 'md:border-l' : ''} ${i % 2 ? 'border-l md:border-l' : ''}`} style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
              <p className="text-[36px] font-medium leading-none tracking-tight"><CountUp value={s.v} decimals={s.d ?? 0} suffix={s.s} /></p>
              <p className="mt-2 text-[13.5px]" style={{ color: MUTED }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    listings: (
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal><h2 className="text-[32px] font-medium tracking-tight sm:text-[44px]">Featured homes</h2></Reveal>
          <div className="flex flex-wrap items-center gap-2">
            {f.tabs.length > 1 && f.tabs.map((t) => (
              <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                className="relative cursor-pointer px-3 py-2 text-[14px] font-medium" style={{ color: f.tab === t.key ? INK : MUTED }}>
                {t.label}
                {f.tab === t.key && <motion.span layoutId="residence-tab" className="absolute inset-x-3 -bottom-0.5 h-0.5" style={{ background: INK }} />}
              </button>
            ))}
            {(search.active || f.city) && <button type="button" onClick={() => { search.reset(); f.setCity(''); }} className="cursor-pointer text-[13.5px] underline underline-offset-4" style={{ color: MUTED }}>Clear search</button>}
          </div>
        </div>
        {shown.length === 0 ? <p className="mt-10 rounded-[20px] bg-white p-10 text-center text-[15px]" style={{ color: MUTED }}>{search.active || f.city ? 'No homes match that search.' : 'New homes coming soon.'}</p> : (
          <Stagger className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((l, i) => (
              <a key={l.id} href={l.href} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[18px]">
                  <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  {i < 2 && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[12px] font-medium">New</span>}
                  <SaveHeart listing={l} className="absolute right-3 top-3" />
                </div>
                <p className="mt-4 text-[12.5px] uppercase tracking-[0.12em]" style={{ color: MUTED }}>{statusLabel(l)} · Guide price</p>
                <p className="mt-0.5 text-[20px] font-medium tracking-tight">{priceLabel(l, '')}</p>
                <p className="mt-1 text-[15.5px]">{l.name}</p>
                <p className="mt-0.5 text-[14px]" style={{ color: MUTED }}>{[placeLabel(l), CATEGORY[l.category], l.units ? `${l.units} units` : null].filter(Boolean).join(' · ')}</p>
              </a>
            ))}
          </Stagger>
        )}
      </section>
    ),

    areas: (
      <section id="areas" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        {hoods.length > 0 && (
          <>
            <Reveal><h2 className="text-[32px] font-medium tracking-tight sm:text-[44px]">Neighbourhoods</h2></Reveal>
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
              <ul className="border-t" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
                {hoods.map((n, i) => {
                  const row = (
                    <span className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-3 py-5">
                      <span className="text-[13px] tabular-nums" style={{ color: MUTED }}>{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-[24px] tracking-tight transition-transform duration-300 sm:text-[30px]" style={{ transform: hover === i ? 'translateX(8px)' : 'none' }}>{n.name}</span>
                      <span className="text-right text-[13.5px]" style={{ color: MUTED }}>{n.count ? `${n.count} home${n.count === 1 ? '' : 's'}` : ''}</span>
                    </span>
                  );
                  return (
                    <li key={n.name} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} className="border-b" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
                      {n.href ? <a href={n.href} className="block">{row}</a> : <button type="button" onClick={() => { search.setQ(n.name); go('listings'); }} className="block w-full cursor-pointer text-left">{row}</button>}
                    </li>
                  );
                })}
              </ul>
              <div className="hidden lg:block">
                <div className="sticky top-28 overflow-hidden rounded-[20px] bg-white">
                  <AnimatePresence mode="wait">
                    {h && (
                      <motion.div key={h.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: EASE }}>
                        <Img src={h.img} className="aspect-[4/3] w-full object-cover" />
                        <div className="p-5">
                          <p className="text-[20px] font-medium">{h.name}</p>
                          {h.blurb && <p className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed" style={{ color: MUTED }}>{h.blurb}</p>}
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                            {h.price ? <span>From KES {h.price.toLocaleString('en-KE')}</span> : null}
                            {h.commute && <span style={{ color: MUTED }}>{h.commute}</span>}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </>
        )}
        <div className={`grid gap-5 md:grid-cols-2 ${hoods.length ? 'mt-20' : ''}`}>
          {[
            { t: 'Selling?', d: 'Get a free valuation based on real recent sales, and a plan to sell well.', cta: 'Book a valuation', on: valuation, img: listings[0]?.heroImageUrl ?? hero },
            { t: 'Letting?', d: 'Tenant find, rent collection or full management — choose what you need.', cta: data.content?.packages?.length ? 'See landlord fees' : 'Talk to us', on: () => (data.content?.packages?.length && order.includes('packages') ? go('packages') : kit?.open({ kind: 'contact' })), img: listings[1]?.heroImageUrl ?? hero },
          ].map((c) => (
            <Reveal key={c.t}>
              <div className="relative overflow-hidden rounded-[22px] text-white">
                {c.img ? <Img src={c.img} className="absolute inset-0 h-full w-full object-cover" /> : null}
                <div className="absolute inset-0" style={{ background: c.img ? 'rgba(20,19,17,0.6)' : INK }} />
                <div className="relative flex min-h-[260px] flex-col justify-end p-7">
                  <p className="text-[12.5px] uppercase tracking-[0.16em] text-white/70">For owners</p>
                  <p className="mt-2 text-[30px] font-medium tracking-tight">{c.t}</p>
                  <p className="mt-2 max-w-sm text-[15px] text-white/80">{c.d}</p>
                  <button type="button" onClick={c.on} className="mt-5 w-fit cursor-pointer rounded-full bg-white px-5 py-2.5 text-[14px] font-medium" style={{ color: INK }}>{c.cta}</button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    ),

    about: agent.bio ? (
      <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[320px_1fr] md:items-start">
          <Img src={agent.photoUrl ?? agent.logoUrl} alt={agent.displayName} className="aspect-[4/5] w-full rounded-[20px] object-cover" />
          <div>
            <p className="text-[12.5px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>{since ? `${region} homes since ${since}` : 'About'}</p>
            <h2 className="mt-3 text-[32px] font-medium tracking-tight sm:text-[42px]">{agent.displayName}</h2>
            <p className="mt-5 whitespace-pre-line text-[16.5px] leading-relaxed" style={{ color: '#46433e' }}>{agent.bio}</p>
          </div>
        </div>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="rounded-[24px] p-8 text-white sm:p-12" style={{ background: INK }}>
          <div className="grid gap-8 md:grid-cols-2 md:items-end">
            <div>
              <h2 className="text-[34px] font-medium leading-[1.05] tracking-tight sm:text-[48px]">Speak to the {region} team</h2>
              <div className="mt-6 space-y-1.5 text-[15px] text-white/75">
                {agent.phone && <a href={`tel:${agent.phone}`} className="block hover:text-white">{agent.phone}</a>}
                {agent.email && <a href={`mailto:${agent.email}`} className="block hover:text-white">{agent.email}</a>}
                {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="block hover:text-white">WhatsApp</a>}
                {agent.officeAddress && <p>{agent.officeAddress}</p>}
              </div>
            </div>
            <LeadButtons theme={{ ...theme, accent: '#ffffff' }} tone="dark" onAccent={INK} />
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, ['--accent' as string]: accent }}>
      <header className="sticky top-0 z-40 border-b border-black/[0.06]" style={{ background: 'rgba(246,243,238,0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="truncate text-[17px] font-semibold tracking-tight">{agent.displayName}</a>
          <nav className="hidden items-center gap-6 text-[14px] lg:flex">
            {nav.map((n) => <a key={n.href} href={n.href} className="hover:opacity-60">{n.label}</a>)}
            {order.includes('valuation') && kit?.forms.valuation && <a href="#valuation" className="hover:opacity-60">Sell</a>}
          </nav>
          <div className="flex items-center gap-2">
            {agent.phone && <a href={`tel:${agent.phone}`} className="hidden text-[14px] md:block">{agent.phone}</a>}
            <button type="button" onClick={() => kit?.open({ kind: 'saved' })} aria-label="Saved homes" className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full hover:bg-black/5">
              <Icon d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" size={18} />
              {!!kit?.saved.length && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold text-white" style={{ background: INK }}>{kit.saved.length}</span>}
            </button>
            <button type="button" onClick={valuation} className="cursor-pointer rounded-full px-4 py-2.5 text-[13.5px] font-medium text-white" style={{ background: INK }}>Book a valuation</button>
          </div>
        </div>
      </header>

      <section id="top" className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px]">
          {hero ? <Img src={hero} className="aspect-[4/5] w-full object-cover sm:aspect-[21/10]" eager /> : <div className="aspect-[21/10] w-full" style={{ background: '#e4ded4' }} />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
          <Reveal className="absolute left-6 top-8 max-w-xl text-white sm:left-12 sm:top-14">
            <p className="text-[12.5px] uppercase tracking-[0.18em] text-white/75">{since ? `${region} homes since ${since}` : `Homes in ${region}`}</p>
            <h1 className="mt-4 text-[38px] font-medium leading-[1.05] tracking-tight sm:text-[64px]">{agent.siteTagline ?? 'Find your place in the city.'}</h1>
          </Reveal>
        </div>
        <Reveal delay={0.15} className="relative z-10 mx-auto -mt-16 max-w-5xl px-2 sm:-mt-20">
          <div className="rounded-[22px] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.1)] sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <label className="block"><span className="mb-1 block text-[12px] font-medium" style={{ color: MUTED }}>Where</span>
                <select value={where} onChange={(e) => setWhere(e.target.value)} className={sel}><option value="">Anywhere</option>{f.cities.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
              <label className="block"><span className="mb-1 block text-[12px] font-medium" style={{ color: MUTED }}>Type</span>
                <select value={type} onChange={(e) => setType(e.target.value)} className={sel}><option value="">Any type</option>{search.categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
              </label>
              <label className="block"><span className="mb-1 block text-[12px] font-medium" style={{ color: MUTED }}>Max price</span>
                <select value={band} onChange={(e) => setBand(e.target.value)} className={sel}><option value="">No max</option>{search.bands.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}</select>
              </label>
              <button type="button" onClick={runSearch} className="mt-auto inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-[14.5px] font-medium text-white" style={{ background: INK }}>
                <Icon d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.4-4.4" size={16} /> Search
              </button>
            </div>
            {chips.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[12.5px]" style={{ color: MUTED }}>Popular:</span>
                {chips.map((c) => <button key={c.label} type="button" onClick={c.on} className="cursor-pointer rounded-full border border-black/10 px-3 py-1.5 text-[12.5px] hover:bg-black/[0.03]">{c.label}</button>)}
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="border-t border-black/[0.08]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2"><p className="text-[18px] font-semibold">{agent.displayName}</p>{agent.officeAddress && <p className="mt-2 text-[14px]" style={{ color: MUTED }}>{agent.officeAddress}</p>}</div>
            <div className="space-y-2 text-[14px]">{nav.map((n) => <a key={n.href} href={n.href} className="block hover:opacity-60">{n.label}</a>)}</div>
            <div className="space-y-2 text-[14px]">{agent.phone && <a href={`tel:${agent.phone}`} className="block">{agent.phone}</a>}{agent.email && <a href={`mailto:${agent.email}`} className="block">{agent.email}</a>}</div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.08)', color: MUTED }}>
            <span>© {new Date().getFullYear()} {agent.displayName}</span>
            <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a>
            <LegalLine data={data} color={MUTED} />
          </div>
        </div>
      </footer>
      <SiteKitLayer theme={theme} hideDock />
    </div>
  );
}
