'use client';

import { useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';
import { LeadButtons, ListingTools, SaveHeart, SiteKitLayer, useListingSearch } from '../kit';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, CATEGORY, firstSentence, hasTour, heroImage, Icon, ICON, Img, orderedSections, placeLabel, priceLabel,
  specialtyLabel, statusLabel, useListingFilter, waLink,
} from '../shared';
import { CountUp, EASE, KenBurns, Marquee, motion, Reveal, Stagger, WordReveal } from '../motion';
import { navFor, statsFor, stepsFor, useScrolled } from '../base';

/**
 * TERRACE — a warm agency site. Full-bleed photo hero with feature chips,
 * a statement that fills in as you scroll, a bento of numbers and photos,
 * photo-led listing cards, a big image with step tabs, and an area strip.
 */

const BG = '#efebe4';
const INK = '#1a1916';
const MUTED = '#6f6a61';
const SUPPORTED = ALL_SECTIONS;

export function TerraceTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#3d5a47';
  const order = orderedSections(data, SUPPORTED);
  const hero = heroImage(data);
  const f = useListingFilter(listings);
  const search = useListingSearch(listings);
  const shown = search.apply(f.shown);
  const areas = areasOf(data);
  const scrolled = useScrolled(60);
  const stats = statsFor(data, 4);
  const photos = listings.map((l) => l.heroImageUrl).filter(Boolean) as string[];
  const steps = stepsFor(data).slice(0, 4);
  const [step, setStep] = useState(0);
  const nav = navFor(data, order);
  const chips = (agent.specialties.length ? agent.specialties.map(specialtyLabel) : ['Verified listings', 'Virtual tours', 'Off-plan specialists', 'Honest advice']).slice(0, 4);

  const theme: SiteTheme = { ink: INK, muted: MUTED, accent, card: '#f8f6f2', line: 'rgba(0,0,0,0.09)', radius: 20 };
  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),

    about: agent.bio ? (
      <section id="about" className="scroll-mt-24">
        <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>About {agent.kind === 'COMPANY' ? 'us' : 'me'}</p>
          <WordReveal text={agent.bio.split(/(?<=[.!?])\s/).slice(0, 3).join(' ')} className="mt-5 text-[26px] font-medium leading-[1.35] tracking-tight sm:text-[38px]" />
          <div className="mt-10 flex items-center gap-4">
            <Img src={agent.photoUrl ?? agent.logoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className="text-[16px] font-medium">{agent.displayName}</p>
              <p className="text-[14px]" style={{ color: MUTED }}>{agent.yearsExperience ? `${agent.yearsExperience} years in property` : agent.serviceAreas.slice(0, 2).join(' · ')}</p>
            </div>
          </div>
        </div>
      </section>
    ) : null,

    stats: stats.length ? (
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid auto-rows-[160px] grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className={i % 2 === 1 && photos[0] ? 'md:col-start-4' : ''}>
              <div className="flex h-full flex-col justify-between rounded-[20px] p-5" style={{ background: i === 0 ? accent : '#fff', color: i === 0 ? '#fff' : INK }}>
                <p className="text-[13px]" style={{ color: i === 0 ? 'rgba(255,255,255,0.75)' : MUTED }}>{s.label}</p>
                <p className="text-[44px] font-medium leading-none tracking-tight"><CountUp value={s.v} decimals={s.d ?? 0} suffix={s.s} /></p>
              </div>
            </Reveal>
          ))}
          {photos[0] && (
            <Reveal className="col-span-2 row-span-2 overflow-hidden rounded-[20px] md:col-start-2 md:row-start-1">
              <Img src={photos[0]} className="h-full w-full object-cover" />
            </Reveal>
          )}
        </div>
      </section>
    ) : null,

    listings: (
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>Featured properties</p>
              <h2 className="mt-3 max-w-xl text-[34px] font-medium leading-[1.08] tracking-tight sm:text-[46px]">Homes we’re proud to show you</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {f.tabs.length > 1 && f.tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                  className="cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
                  style={f.tab === t.key ? { background: INK, color: '#fff' } : { background: '#fff', color: INK }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <ListingTools f={search} theme={theme} />
        </Reveal>
        {shown.length === 0 ? (
          <p className="mt-10 rounded-[20px] bg-white p-10 text-center text-[15px]" style={{ color: MUTED }}>
            {search.active ? 'No homes match these filters.' : 'New homes are on the way. Get in touch to hear first.'}
          </p>
        ) : (
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((l) => (
              <a key={l.id} href={l.href} className="group relative block aspect-[4/5] overflow-hidden rounded-[22px]">
                <Img src={l.heroImageUrl} alt={l.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[12px] font-medium" style={{ color: INK }}>{statusLabel(l)}</span>
                <SaveHeart listing={l} className="absolute right-4 top-4" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h3 className="text-[22px] font-medium leading-snug">{l.name}</h3>
                  <p className="mt-1 text-[14px] text-white/75">{placeLabel(l) || 'Kenya'}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px]">
                    <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">{priceLabel(l)}</span>
                    {CATEGORY[l.category] && <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">{CATEGORY[l.category]}</span>}
                    {l.units > 0 && <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">{l.units} units</span>}
                    {hasTour(l) && <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">3D tour</span>}
                  </div>
                </div>
              </a>
            ))}
          </Stagger>
        )}
      </section>
    ),

    process: steps.length ? (
      <section id="process" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <Reveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>How it works</p>
          <h2 className="mt-3 max-w-xl text-[34px] font-medium leading-[1.08] tracking-tight sm:text-[46px]">Simple, from first call to keys</h2>
        </Reveal>
        <Reveal delay={0.1} className="relative mt-10 overflow-hidden rounded-[28px]">
          <Img src={photos[2] ?? photos[0] ?? hero} className="aspect-[4/5] w-full object-cover sm:aspect-[16/8]" />
          <div className="absolute inset-x-3 bottom-3 rounded-[22px] bg-white p-5 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[420px] sm:p-6">
            <div className="flex gap-1.5">
              {steps.map((s, i) => (
                <button key={s.id} type="button" onClick={() => setStep(i)} aria-pressed={step === i}
                  className="cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors"
                  style={step === i ? { background: INK, color: '#fff' } : { background: BG, color: INK }}>
                  Step {String(i + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }}>
                <p className="mt-5 text-[22px] font-medium leading-snug">{steps[step]?.title}</p>
                {steps[step]?.description && <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: MUTED }}>{steps[step].description}</p>}
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </section>
    ) : null,

    areas: areas.length ? (
      <section id="areas" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>Where we work</p>
            <h2 className="mt-3 text-[34px] font-medium tracking-tight sm:text-[46px]">Neighbourhoods we know well</h2>
          </Reveal>
        </div>
        <Marquee speed={50} className="mt-10">
          {areas.map((a, i) => {
            const pic = listings.find((l) => (l.neighborhood === a.name || l.city === a.name) && l.heroImageUrl)?.heroImageUrl ?? photos[i % Math.max(photos.length, 1)];
            return (
              <div key={a.name} className="relative h-56 w-72 shrink-0 overflow-hidden rounded-[20px] bg-white">
                {pic && <Img src={pic} className="h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-[19px] font-medium">{a.name}</p>
                  {a.count > 0 && <p className="text-[13px] text-white/75">{a.count} listing{a.count === 1 ? '' : 's'}</p>}
                </div>
              </div>
            );
          })}
        </Marquee>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="scroll-mt-24 px-4 pb-6 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] text-white">
          {hero ? <Img src={hero} className="absolute inset-0 h-full w-full object-cover" /> : null}
          <div className="absolute inset-0" style={{ background: hero ? 'rgba(20,20,18,0.62)' : INK }} />
          <div className="relative px-6 py-20 sm:px-14 sm:py-28">
            <WordReveal text="Ready to find the right home? Let’s talk." dim={0.3} className="max-w-3xl text-[36px] font-medium leading-[1.08] tracking-tight sm:text-[60px]" />
            <p className="mt-5 max-w-lg text-[16px] text-white/75">Ask about a home, book a viewing or a live guided tour. We reply the same day.</p>
            <div className="mt-8"><LeadButtons theme={theme} tone="dark" /></div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-white/80">
              {agent.phone && <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-2 hover:text-white"><Icon d={ICON.phone} size={15} /> {agent.phone}</a>}
              {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white"><Icon d={ICON.chat} size={15} /> WhatsApp</a>}
              {agent.officeAddress && <span className="inline-flex items-center gap-2"><Icon d={ICON.pin} size={15} /> {agent.officeAddress}</span>}
            </div>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, ['--accent' as string]: accent }}>
      <header className="fixed inset-x-0 top-0 z-40 transition-colors duration-300"
        style={{ background: scrolled ? 'rgba(239,235,228,0.96)' : 'transparent', color: scrolled ? INK : '#fff', borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent' }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-2.5">
            {agent.logoUrl ? <Img src={agent.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" eager />
              : <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[14px] font-semibold text-white" style={{ background: accent }}>{agent.displayName.charAt(0)}</span>}
            <span className="truncate text-[16px] font-semibold tracking-tight">{agent.displayName}</span>
          </a>
          <nav className="hidden items-center gap-7 text-[14px] md:flex">
            {nav.map((n) => <a key={n.href} href={n.href} className="opacity-80 transition-opacity hover:opacity-100">{n.label}</a>)}
          </nav>
          <a href="#contact" className="rounded-full px-5 py-2.5 text-[14px] font-medium transition-colors"
            style={scrolled ? { background: INK, color: '#fff' } : { background: '#fff', color: INK }}>Contact</a>
        </div>
      </header>

      <section id="top" className="relative flex min-h-[92vh] items-end overflow-hidden text-white">
        {hero ? <KenBurns src={hero} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: INK }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/30" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-32 sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-medium" style={{ color: INK }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
              {agent.ratingCount > 0 && agent.ratingAverage ? `Rated ${agent.ratingAverage.toFixed(1)} by ${agent.ratingCount} clients` : agent.serviceAreas[0] ? `Agent in ${agent.serviceAreas[0]}` : 'Trusted property agent'}
            </span>
            <h1 className="mt-6 max-w-3xl text-[44px] font-medium leading-[1.02] tracking-tight sm:text-[76px]">
              {agent.siteTagline ?? 'Find a home that fits your life.'}
            </h1>
            {firstSentence(agent.bio) && <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/80">{firstSentence(agent.bio)}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#listings" className="rounded-full bg-white px-6 py-3 text-[15px] font-medium" style={{ color: INK }}>Explore homes</a>
              <a href="#contact" className="rounded-full border border-white/40 px-6 py-3 text-[15px] font-medium hover:bg-white/10">Book a viewing</a>
            </div>
          </Reveal>
          <Reveal delay={0.2} className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/15 md:grid-cols-4">
            {chips.map((c) => (
              <div key={c} className="flex items-center gap-2.5 bg-black/20 px-4 py-4 text-[14px]">
                <Icon d="M5 12.5l4.5 4.5L19 7.5" size={16} /> {c}
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="mt-16 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <p className="text-[14px]" style={{ color: MUTED }}>Say hello</p>
              {agent.email ? <a href={`mailto:${agent.email}`} className="mt-2 block break-all text-[26px] font-medium tracking-tight hover:opacity-70 sm:text-[34px]">{agent.email}</a>
                : agent.phone && <a href={`tel:${agent.phone}`} className="mt-2 block text-[30px] font-medium tracking-tight">{agent.phone}</a>}
            </div>
            <div className="space-y-2 text-[14.5px]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: MUTED }}>Explore</p>
              {nav.map((n) => <a key={n.href} href={n.href} className="block hover:opacity-70">{n.label}</a>)}
              <a href="#contact" className="block hover:opacity-70">Contact</a>
            </div>
            <div className="space-y-2 text-[14.5px]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: MUTED }}>Follow</p>
              {Object.entries(agent.socials ?? {}).filter(([, v]) => v).slice(0, 5).map(([k, v]) => (
                <a key={k} href={v} target="_blank" rel="noreferrer" className="block capitalize hover:opacity-70">{k}</a>
              ))}
              {agent.phone && <a href={`tel:${agent.phone}`} className="block hover:opacity-70">{agent.phone}</a>}
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.08)', color: MUTED }}>
            <span>© {new Date().getFullYear()} {agent.displayName}</span>
            <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a>
            <LegalLine data={data} color={MUTED} />
          </div>
        </div>
      </footer>
      <SiteKitLayer theme={theme} />
    </div>
  );
}
