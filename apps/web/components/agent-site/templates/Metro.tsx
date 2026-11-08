'use client';

import { useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';
import { LeadButtons, ListingTools, SaveHeart, SiteKitLayer, useListingSearch, useSiteKit } from '../kit';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, CATEGORY, firstSentence, heroImage, Icon, ICON, Img, orderedSections, priceLabel, statusLabel,
  useListingFilter, waLink,
} from '../shared';
import { EASE, KenBurns, motion, Reveal, Stagger } from '../motion';
import { navFor, statsFor, stepsFor, useScrolled } from '../base';

/**
 * METRO — a full-service agency. A header that turns solid with a
 * Properties dropdown (buy, sell, landlords), a centred photo hero,
 * numbers that roll like an odometer, fact-rich listings and a numbered
 * four-step process.
 */

const BG = '#f0f0ee';
const INK = '#101010';
const MUTED = '#6c6c6a';
const SUPPORTED = ALL_SECTIONS;

/** Digits that roll into place, one column per digit. */
function Odometer({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  const text = value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} className="inline-flex overflow-hidden leading-none" aria-label={`${text}${suffix}`}>
      {text.split('').map((ch, i) => /\d/.test(ch) ? (
        <span key={i} className="relative inline-block h-[1em] overflow-hidden" aria-hidden>
          <motion.span className="flex flex-col" initial={{ y: 0 }} animate={{ y: seen || reduce ? `-${Number(ch)}em` : 0 }}
            transition={{ duration: reduce ? 0 : 1.4 + i * 0.12, ease: EASE }}>
            {Array.from({ length: 10 }, (_, d) => <span key={d} className="h-[1em]">{d}</span>)}
          </motion.span>
        </span>
      ) : <span key={i} aria-hidden>{ch}</span>)}
      <span aria-hidden>{suffix}</span>
    </span>
  );
}

export function MetroTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? INK;
  const order = orderedSections(data, SUPPORTED);
  const hero = heroImage(data);
  const kit = useSiteKit();
  const f = useListingFilter(listings);
  const search = useListingSearch(listings);
  const shown = search.apply(f.shown);
  const areas = areasOf(data);
  const stats = statsFor(data, 3);
  const nav = navFor(data, order).filter((n) => n.href !== '#listings');
  const scrolled = useScrolled(60);
  const [drop, setDrop] = useState(false);
  const steps = stepsFor(data, 'BUYERS').slice(0, 4);
  const theme: SiteTheme = { ink: INK, muted: MUTED, accent, card: '#ffffff', line: 'rgba(0,0,0,0.1)', radius: 16 };
  const has = (id: SiteSectionId) => order.includes(id);
  const menuItems = [
    { href: '#listings', title: 'Buy a home', text: 'Browse every listing' },
    has('valuation') && kit?.forms.valuation && { href: '#valuation', title: 'Sell your property', text: 'Free valuation and listing' },
    has('packages') && data.content?.packages?.length && { href: '#packages', title: 'Let or manage', text: 'Landlord packages and fees' },
    has('calculator') && kit?.forms.calculator && { href: '#calculator', title: 'Mortgage calculator', text: 'Estimate your monthly payment' },
  ].filter(Boolean) as { href: string; title: string; text: string }[];

  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),

    stats: stats.length ? (
      <section id="numbers" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="text-[13px] font-medium uppercase tracking-[0.16em]" style={{ color: MUTED }}>{agent.kind === 'COMPANY' ? 'About us' : 'About'}</p>
            <p className="mt-4 text-[24px] font-medium leading-[1.35] tracking-tight sm:text-[30px]">{firstSentence(agent.bio, 220) ?? `${agent.displayName} helps people buy, sell and let property with clear advice and no surprises.`}</p>
          </Reveal>
          <div className="grid gap-8 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="border-t pt-5" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
                <p className="text-[48px] font-semibold tracking-tight sm:text-[56px]"><Odometer value={s.v} suffix={s.s} decimals={s.d ?? 0} /></p>
                <p className="mt-3 text-[14px]" style={{ color: MUTED }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ) : null,

    listings: (
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal><h2 className="text-[34px] font-semibold tracking-tight sm:text-[46px]">Recent listings</h2></Reveal>
          {f.tabs.length > 1 && (
            <div className="flex gap-2">
              {f.tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                  className="cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium" style={f.tab === t.key ? { background: INK, color: '#fff' } : { background: '#fff' }}>{t.label}</button>
              ))}
            </div>
          )}
        </div>
        <ListingTools f={search} theme={theme} />
        {shown.length === 0 ? <p className="mt-10 text-[15px]" style={{ color: MUTED }}>{search.active ? 'No homes match these filters.' : 'New listings soon.'}</p> : (
          <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((l) => (
              <a key={l.id} href={l.href} className="group block overflow-hidden rounded-[16px] bg-white">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                  <span className="absolute left-3 top-3 rounded-md bg-white px-2.5 py-1 text-[12px] font-medium">{statusLabel(l)}</span>
                  <SaveHeart listing={l} className="absolute right-3 top-3" />
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[22px] font-semibold tracking-tight">{priceLabel(l, '')}</p>
                    <span className="text-[12.5px]" style={{ color: MUTED }}>{l.kind === 'PARTNER' ? 'Partner' : 'Our listing'}</span>
                  </div>
                  <p className="mt-1 text-[15px] font-medium">{l.name}</p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-[12.5px]" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <div><dt style={{ color: MUTED }}>Area</dt><dd className="truncate font-medium">{l.neighborhood ?? l.city ?? '—'}</dd></div>
                    <div><dt style={{ color: MUTED }}>Type</dt><dd className="truncate font-medium">{CATEGORY[l.category] ?? '—'}</dd></div>
                    <div><dt style={{ color: MUTED }}>Units</dt><dd className="font-medium">{l.units || '—'}</dd></div>
                  </dl>
                </div>
              </a>
            ))}
          </Stagger>
        )}
      </section>
    ),

    process: steps.length ? (
      <section id="process" className="scroll-mt-20" style={{ background: INK }}>
        <div className="mx-auto max-w-6xl px-4 py-24 text-white sm:px-6">
          <Reveal><h2 className="text-[34px] font-semibold tracking-tight sm:text-[46px]">How it works</h2></Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[16px] bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.08}>
                <div className="h-full p-6" style={{ background: INK }}>
                  <p className="text-[44px] font-semibold leading-none text-white/25">{String(i + 1).padStart(2, '0')}</p>
                  <p className="mt-8 text-[18px] font-medium">{s.title}</p>
                  {s.description && <p className="mt-2 text-[14px] leading-relaxed text-white/60">{s.description}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    ) : null,

    about: null,

    areas: areas.length ? (
      <section id="areas" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <Reveal><h2 className="text-[34px] font-semibold tracking-tight sm:text-[46px]">Neighbourhoods</h2></Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.slice(0, 6).map((a) => {
            const pic = listings.find((l) => (l.neighborhood === a.name || l.city === a.name) && l.heroImageUrl)?.heroImageUrl ?? null;
            return (
              <div key={a.name} className="group relative aspect-[16/10] overflow-hidden rounded-[16px] bg-white">
                <Img src={pic} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white"><p className="text-[20px] font-semibold">{a.name}</p><p className="text-[13px] text-white/75">{a.count} listing{a.count === 1 ? '' : 's'}</p></div>
              </div>
            );
          })}
        </div>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid gap-8 rounded-[20px] bg-white p-8 sm:p-12 md:grid-cols-2 md:items-center">
          <h2 className="text-[34px] font-semibold leading-[1.05] tracking-tight sm:text-[48px]">Thinking of moving? Start here.</h2>
          <div>
            <LeadButtons theme={theme} />
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[14px]" style={{ color: MUTED }}>
              {agent.phone && <a href={`tel:${agent.phone}`} className="hover:text-black">{agent.phone}</a>}
              {agent.email && <a href={`mailto:${agent.email}`} className="hover:text-black">{agent.email}</a>}
              {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="hover:text-black">WhatsApp</a>}
            </div>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, ['--accent' as string]: accent }}>
      <header className="fixed inset-x-0 top-0 z-40 transition-colors duration-300"
        style={{ background: scrolled || drop ? '#ffffff' : 'transparent', color: scrolled || drop ? INK : '#fff', boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,0.06)' : 'none' }}
        onMouseLeave={() => setDrop(false)}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="truncate text-[17px] font-semibold tracking-tight">{agent.displayName}</a>
          <nav className="hidden items-center gap-7 text-[14px] md:flex">
            <button type="button" onMouseEnter={() => setDrop(true)} onClick={() => setDrop((d) => !d)} aria-expanded={drop}
              className="inline-flex cursor-pointer items-center gap-1">Properties <Icon d="m6 9 6 6 6-6" size={14} className={`transition-transform ${drop ? 'rotate-180' : ''}`} /></button>
            {nav.slice(0, 4).map((n) => <a key={n.href} href={n.href} className="opacity-85 hover:opacity-100">{n.label}</a>)}
          </nav>
          <a href="#contact" className="rounded-full px-5 py-2.5 text-[14px] font-medium transition-colors" style={scrolled || drop ? { background: INK, color: '#fff' } : { background: '#fff', color: INK }}>Contact us</a>
        </div>
        <AnimatePresence>
          {drop && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: EASE }}
              className="hidden border-t border-black/[0.06] bg-white md:block">
              <div className="mx-auto grid max-w-6xl gap-2 px-4 py-6 sm:px-6" style={{ gridTemplateColumns: `repeat(${Math.max(menuItems.length, 1)}, minmax(0, 1fr))` }}>
                {menuItems.map((m) => (
                  <a key={m.href} href={m.href} onClick={() => setDrop(false)} className="group rounded-[14px] p-4 hover:bg-black/[0.03]">
                    <p className="flex items-center gap-2 text-[16px] font-medium" style={{ color: INK }}>{m.title}<Icon d={ICON.arrow} size={15} className="transition-transform group-hover:translate-x-1" /></p>
                    <p className="mt-1 text-[13.5px]" style={{ color: MUTED }}>{m.text}</p>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section id="top" className="relative flex min-h-[90vh] items-center justify-center overflow-hidden text-center text-white">
        {hero ? <KenBurns src={hero} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: INK }} />}
        <div className="absolute inset-0 bg-black/45" />
        <Reveal className="relative mx-auto max-w-4xl px-4 pt-16">
          <h1 className="text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-[80px]">{agent.siteTagline ?? 'Buy, sell and let with confidence.'}</h1>
          <p className="mx-auto mt-5 max-w-xl text-[17px] text-white/80">{agent.displayName}{agent.serviceAreas.length ? ` · ${agent.serviceAreas.slice(0, 3).join(', ')}` : ''}</p>
          <a href="#listings" className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-medium" style={{ color: INK }}>Explore properties <Icon d={ICON.arrow} size={16} /></a>
        </Reveal>
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="text-white/60" style={{ background: INK }}>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <p className="text-[20px] font-semibold text-white">{agent.displayName}</p>
              {agent.officeAddress && <p className="mt-2 max-w-xs text-[14px]">{agent.officeAddress}</p>}
            </div>
            <div className="space-y-2 text-[14px]">{menuItems.map((m) => <a key={m.href} href={m.href} className="block hover:text-white">{m.title}</a>)}</div>
            <div className="space-y-2 text-[14px]">
              {agent.phone && <a href={`tel:${agent.phone}`} className="block hover:text-white">{agent.phone}</a>}
              {agent.email && <a href={`mailto:${agent.email}`} className="block hover:text-white">{agent.email}</a>}
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[13px]">
            <span>© {new Date().getFullYear()} {agent.displayName}</span>
            <a href="https://e-resi.com" className="hover:text-white">Powered by e-resi</a>
            <LegalLine data={data} color="rgba(255,255,255,0.5)" />
          </div>
        </div>
      </footer>
      <SiteKitLayer theme={theme} />
    </div>
  );
}
