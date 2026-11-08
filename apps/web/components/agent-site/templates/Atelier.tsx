'use client';

import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, CATEGORY, heroImage, Icon, ICON, Img, orderedSections, placeLabel, priceLabel, specialtyLabel,
  statusLabel, useListingFilter, waLink,
} from '../shared';
import { CountUp, EASE, KenBurns, LiveClock, Marquee, motion, Reveal, useAutoplay, WordReveal } from '../motion';

/**
 * ATELIER — editorial and cinematic, for agencies and established agents.
 * Full-screen hero with an agent ID card, a live local clock, a full-screen
 * menu, a statement that fills in word by word as you scroll, a rotating
 * listing spotlight, an area marquee and an oversized contact block, all
 * laid over faint column lines.
 */

const SUPPORTED = ALL_SECTIONS;
const BG = '#eeece7';
const INK = '#121211';
const MUTED = '#6e6b65';

function GridLines({ dark = false }: { dark?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-8 md:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`border-l ${i >= 2 ? 'hidden md:block' : ''} ${i === 1 ? 'border-r md:border-r-0' : ''} ${i === 3 ? 'md:border-r' : ''}`}
          style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }} />
      ))}
    </div>
  );
}

export function AtelierTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#d9532b';
  const order = orderedSections(data, SUPPORTED);
  const hero = heroImage(data);
  const areas = areasOf(data);
  const f = useListingFilter(listings);
  const spotlight = listings.filter((l) => l.heroImageUrl).slice(0, 5);
  const auto = useAutoplay(spotlight.length, 6000);
  const [menu, setMenu] = useState(false);
  const [solid, setSolid] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const city = agent.serviceAreas[0] ?? listings.find((l) => l.city)?.city ?? 'Nairobi';

  useEffect(() => {
    const on = () => setSolid(window.scrollY > window.innerHeight * 0.75);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menu]);

  const statement = agent.bio
    ? agent.bio.split(/\s+/).slice(0, 48).join(' ') + (agent.bio.split(/\s+/).length > 48 ? '…' : '')
    : `${agent.displayName} brings buyers and the right homes together across ${city}, with honest advice, real numbers and viewings that respect your time.`;

  const stats = [
    { v: listings.length, s: '', label: 'Developments', note: 'On offer right now' },
    agent.yearsExperience ? { v: agent.yearsExperience, s: '+', label: 'Years selling', note: 'In this market' } : null,
    agent.dealsCompleted > 0 ? { v: agent.dealsCompleted, s: '+', label: 'Deals closed', note: 'Buyers and sellers' } : null,
    (data.stats?.units ?? 0) > 0 ? { v: data.stats!.units, s: '', label: 'Homes available', note: 'Across all listings' } : null,
    agent.ratingCount > 0 && agent.ratingAverage != null ? { v: agent.ratingAverage, s: '/5', d: 1, label: 'Client rating', note: `${agent.ratingCount} verified reviews` } : null,
    (data.stats?.cities ?? 0) > 1 ? { v: data.stats!.cities, s: '', label: 'Cities', note: 'Where we sell' } : null,
  ].filter(Boolean).slice(0, 4) as { v: number; s: string; d?: number; label: string; note: string }[];

  const links = [
    order.includes('listings') && { href: '#listings', label: 'Listings' },
    order.includes('about') && agent.bio && { href: '#about', label: 'About' },
    order.includes('areas') && areas.length && { href: '#areas', label: 'Areas' },
    order.includes('team') && data.content?.team.length && { href: '#team', label: 'Team' },
    order.includes('journal') && data.content?.posts.length && { href: '#journal', label: 'Journal' },
    order.includes('contact') && { href: '#contact', label: 'Contact' },
  ].filter(Boolean) as { href: string; label: string }[];

  const current = spotlight[auto.index];

  const theme: SiteTheme = { ink: INK, muted: MUTED, accent, card: '#e5e2dc', line: 'rgba(0,0,0,0.12)', radius: 12, width: 'max-w-7xl' };
  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),
    stats: (
      <section className="relative">
        <GridLines />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-8 sm:py-32">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em]" style={{ color: MUTED }}>Why choose us</p>
          <WordReveal text={statement} className="mt-6 max-w-5xl text-[28px] font-medium leading-[1.2] tracking-tight sm:text-[44px] md:ml-[25%] md:max-w-[75%]" />
          {stats.length > 0 && (
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4">
              {stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.08} className="border-t border-black/15 py-6 pr-4">
                  <p className="text-[44px] font-medium leading-none tracking-tight sm:text-[64px]"><CountUp value={s.v} decimals={s.d ?? 0} suffix={s.s} /></p>
                  <p className="mt-4 text-[15px] font-medium">{s.label}</p>
                  <p className="mt-1 text-[13px]" style={{ color: MUTED }}>{s.note}</p>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    ),

    listings: (
      <section id="listings" className="relative scroll-mt-16">
        {current && (
          <div className="relative h-[88svh] min-h-[520px] overflow-hidden bg-black text-white">
            <AnimatePresence initial={false}>
              <motion.div key={current.id} className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: EASE }}>
                <Img src={current.heroImageUrl} alt={current.name} className="h-full w-full object-cover opacity-75" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 sm:px-8">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/70">Spotlight · {statusLabel(current)}</p>
              <AnimatePresence mode="wait">
                <motion.div key={current.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.6, ease: EASE }}>
                  <h2 className="mt-3 max-w-4xl text-[44px] font-medium leading-[0.95] tracking-tight sm:text-[88px]">{current.name}</h2>
                  <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 text-[15px] text-white/80">
                    <span>{placeLabel(current)}</span>
                    {CATEGORY[current.category] && <span>{CATEGORY[current.category]}</span>}
                    {current.units > 0 && <span>{current.units} homes</span>}
                    <span className="font-medium text-white">{priceLabel(current)}</span>
                  </div>
                  <a href={current.href} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-medium text-black">
                    View development <Icon d={ICON.arrowUpRight} size={15} />
                  </a>
                </motion.div>
              </AnimatePresence>
              {spotlight.length > 1 && (
                <div className="mt-10 flex items-center gap-4">
                  <div className="flex flex-1 gap-2">
                    {spotlight.map((s, i) => (
                      <button key={s.id} type="button" onClick={() => auto.go(i)} aria-label={`Show ${s.name}`} className="h-6 flex-1 cursor-pointer">
                        <span className="block h-[2px] w-full overflow-hidden bg-white/25">
                          {i === auto.index ? (
                            <motion.span key={`${s.id}-${auto.index}-${auto.playing}`} className="block h-full bg-white"
                              initial={{ width: '0%' }} animate={{ width: auto.playing ? '100%' : '35%' }}
                              transition={{ duration: auto.playing ? 6 : 0.3, ease: 'linear' }} />
                          ) : (
                            <span className={`block h-full bg-white ${i < auto.index ? 'w-full' : 'w-0'}`} />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={auto.toggle} aria-label={auto.playing ? 'Pause' : 'Play'}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/30 hover:bg-white/10">
                    <Icon d={auto.playing ? ICON.pause : ICON.play} size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative">
          <GridLines />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-[34px] font-medium tracking-tight sm:text-[52px]">All listings</h2>
              <div className="flex flex-wrap gap-2">
                {f.tabs.length > 1 && f.tabs.map((t) => (
                  <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                    className="cursor-pointer rounded-full border px-4 py-1.5 text-[13px] font-medium"
                    style={f.tab === t.key ? { background: INK, color: '#fff', borderColor: INK } : { borderColor: 'rgba(0,0,0,0.15)' }}>
                    {t.label} <span className="opacity-50">{t.n}</span>
                  </button>
                ))}
                {f.cities.length > 1 && (
                  <select value={f.city} onChange={(e) => f.setCity(e.target.value)} aria-label="Filter by city"
                    className="rounded-full border bg-transparent px-3 py-1.5 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
                    <option value="">All cities</option>
                    {f.cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
            </div>
            {f.shown.length === 0 ? (
              <p className="mt-10 text-[15px]" style={{ color: MUTED }}>New listings are on the way.</p>
            ) : (
              <ul className="mt-10 border-t" style={{ borderColor: 'rgba(0,0,0,0.12)' }} onMouseLeave={() => setHover(null)}>
                {f.shown.map((l, i) => (
                  <Reveal as="li" key={l.id} delay={Math.min(i, 6) * 0.04} blur={false} y={14}>
                    <a href={l.href} onMouseEnter={() => setHover(l.id)}
                      className="group relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b py-5 sm:grid-cols-[4rem_1.4fr_1fr_auto_2rem]"
                      style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
                      <span className="text-[13px] tabular-nums" style={{ color: MUTED }}>{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-[20px] font-medium tracking-tight transition-transform duration-300 group-hover:translate-x-2 sm:text-[26px]">{l.name}</span>
                      <span className="hidden text-[14px] sm:block" style={{ color: MUTED }}>{placeLabel(l)}</span>
                      <span className="text-right text-[14px] font-medium">{priceLabel(l, '')}</span>
                      <span className="hidden justify-end sm:flex" style={{ color: accent }}><Icon d={ICON.arrowUpRight} size={18} /></span>
                      <AnimatePresence>
                        {hover === l.id && l.heroImageUrl && (
                          <motion.span className="pointer-events-none absolute right-24 top-1/2 z-10 hidden h-36 w-52 -translate-y-1/2 overflow-hidden rounded-lg shadow-xl lg:block"
                            initial={{ opacity: 0, scale: 0.9, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.25 }}>
                            <Img src={l.heroImageUrl} className="h-full w-full object-cover" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </a>
                  </Reveal>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    ),

    about: agent.bio ? (
      <section id="about" className="relative scroll-mt-16">
        <GridLines />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-8 md:grid-cols-4">
          <Reveal className="md:col-span-1">
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-black/5">
              <Img src={agent.photoUrl ?? agent.logoUrl} alt={agent.displayName} className="h-full w-full object-cover grayscale transition duration-700 hover:grayscale-0" />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-3 md:pl-8">
            <p className="text-[12px] font-medium uppercase tracking-[0.18em]" style={{ color: MUTED }}>About</p>
            <h2 className="mt-4 text-[34px] font-medium leading-[1.05] tracking-tight sm:text-[56px]">{agent.displayName}</h2>
            <p className="mt-6 max-w-3xl whitespace-pre-line text-[17px] leading-relaxed" style={{ color: '#3d3b37' }}>{agent.bio}</p>
            {agent.specialties.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {agent.specialties.map((s) => (
                  <span key={s} className="rounded-full border px-4 py-1.5 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>{specialtyLabel(s)}</span>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </section>
    ) : null,

    areas: areas.length ? (
      <section id="areas" className="scroll-mt-16 border-y py-14" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        <Marquee speed={45}>
          {areas.map((a) => (
            <span key={a.name} className="flex items-center gap-10 whitespace-nowrap text-[48px] font-medium tracking-tight sm:text-[88px]">
              <span style={{ WebkitTextStroke: `1.5px ${INK}`, color: 'transparent' }}>{a.name}</span>
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: accent }} />
            </span>
          ))}
        </Marquee>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="relative scroll-mt-16 text-white" style={{ background: INK }}>
        <GridLines dark />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-8 sm:py-32">
          <Reveal>
            <h2 className="text-[64px] font-medium leading-[0.9] tracking-tight sm:text-[140px]">Let’s talk.</h2>
          </Reveal>
          <div className="mt-14 border-t border-white/15">
            {[
              agent.whatsapp && { href: waLink(agent.whatsapp), label: 'WhatsApp', value: agent.whatsapp, ext: true },
              agent.phone && { href: `tel:${agent.phone}`, label: 'Call', value: agent.phone },
              agent.email && { href: `mailto:${agent.email}`, label: 'Email', value: agent.email },
            ].filter(Boolean).map((r) => {
              const row = r as { href: string; label: string; value: string; ext?: boolean };
              return (
                <a key={row.label} href={row.href} target={row.ext ? '_blank' : undefined} rel={row.ext ? 'noreferrer' : undefined}
                  className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/15 py-6 sm:grid-cols-[12rem_1fr_auto]">
                  <span className="text-[13px] uppercase tracking-[0.16em] text-white/50">{row.label}</span>
                  <span className="hidden truncate text-[22px] font-medium sm:block">{row.value}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 transition-all duration-300 group-hover:translate-x-1 group-hover:border-transparent group-hover:bg-[color:var(--accent)]">
                    <Icon d={ICON.arrowUpRight} size={17} />
                  </span>
                </a>
              );
            })}
          </div>
          {agent.officeAddress && <p className="mt-8 text-[14px] text-white/50">{agent.officeAddress}</p>}
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, ['--accent' as string]: accent }}>
      {/* Header */}
      <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${solid ? 'border-b border-black/10' : ''}`}
        style={{ background: solid ? BG : 'transparent', color: solid ? INK : '#fff' }}>
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-8 md:grid-cols-3">
          <a href="#top" className="truncate text-[16px] font-medium tracking-tight">{agent.displayName}</a>
          <p className="hidden justify-center gap-3 text-[12px] font-medium uppercase tracking-[0.16em] md:flex">
            <span>{city}</span><LiveClock className="tabular-nums" />
          </p>
          <div className="flex items-center justify-end gap-5">
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="hidden text-[12px] font-medium uppercase tracking-[0.16em] lg:inline">Call {agent.phone}</a>
            )}
            <button type="button" onClick={() => setMenu(true)} aria-label="Open menu"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border" style={{ borderColor: solid ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
              <Icon d={ICON.menu} size={17} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50 flex flex-col text-white" style={{ background: INK }}
            initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: EASE }}>
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
              <span className="text-[16px] font-medium">{agent.displayName}</span>
              <button type="button" onClick={() => setMenu(false)} aria-label="Close menu" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/30">
                <Icon d={ICON.close} size={17} />
              </button>
            </div>
            <nav className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-2 px-4 sm:px-8">
              {links.map((l, i) => (
                <motion.a key={l.href} href={l.href} onClick={() => setMenu(false)}
                  className="text-[48px] font-medium leading-[1.05] tracking-tight hover:opacity-60 sm:text-[88px]"
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: EASE }}>
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-x-8 gap-y-2 px-4 pb-10 text-[14px] text-white/60 sm:px-8">
              {agent.phone && <a href={`tel:${agent.phone}`}>{agent.phone}</a>}
              {agent.email && <a href={`mailto:${agent.email}`}>{agent.email}</a>}
              {agent.officeAddress && <span>{agent.officeAddress}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section id="top" className="relative h-[100svh] min-h-[600px] overflow-hidden bg-black text-white">
        {hero && <KenBurns src={hero} className="absolute inset-0 h-full w-full object-cover opacity-80" />}
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col px-4 pb-8 pt-28 sm:px-8">
          <motion.h1 className="max-w-6xl text-[52px] font-medium leading-[0.92] tracking-[-0.03em] sm:text-[104px] lg:text-[128px]"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.2 }}>
            {agent.siteTagline ?? `Where ${city} lives.`}
          </motion.h1>
          {agent.specialties.length > 0 && (
            <ul className="mt-8 space-y-1 text-[15px] text-white/85">
              {agent.specialties.slice(0, 4).map((s) => <li key={s}>{specialtyLabel(s)}.</li>)}
            </ul>
          )}
          <div className="mt-auto flex flex-wrap items-end justify-between gap-6">
            <motion.div className="flex max-w-sm items-stretch gap-3 rounded-2xl bg-white p-2 text-black"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}>
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-black/5">
                <Img src={agent.photoUrl ?? agent.logoUrl} alt="" className="h-full w-full object-cover" eager />
              </div>
              <div className="flex min-w-0 flex-col justify-between py-1 pr-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-black/50">{agent.kind === 'COMPANY' ? 'Real estate agency' : 'Real estate agent'} · {city}</p>
                  <p className="mt-0.5 truncate text-[17px] font-medium">{agent.displayName}</p>
                </div>
                <a href="#contact" className="mt-2 inline-flex w-fit items-center rounded-full px-4 py-1.5 text-[13px] font-medium text-white" style={{ background: accent }}>Book a viewing</a>
              </div>
            </motion.div>
            {agent.ratingCount > 0 && agent.ratingAverage != null && (
              <div className="text-right">
                <p className="text-[40px] font-medium leading-none">{agent.ratingAverage.toFixed(1)}<span className="text-[20px] text-white/60">/5</span></p>
                <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-white/60">From {agent.ratingCount} reviews</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="text-white/50" style={{ background: INK }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-6 text-[13px] sm:px-8">
          <span>© {new Date().getFullYear()} {agent.displayName}</span>
          <a href="https://e-resi.com" className="hover:text-white">Powered by e-resi</a>
          <LegalLine data={data} color={'rgba(255,255,255,0.45)'} />
        </div>
      </footer>
    </div>
  );
}
