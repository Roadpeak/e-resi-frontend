'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';
import { ContactForm, ListingTools, SaveHeart, SiteKitLayer, useListingSearch, useSiteKit } from '../kit';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, heroImage, Icon, ICON, Img, orderedSections, placeLabel, priceLabel, statusLabel, useListingFilter, waLink,
} from '../shared';
import { CountUp, EASE, KenBurns, motion, Reveal, Stagger, useAutoplay } from '../motion';
import { navFor, statsFor, useScrolled } from '../base';

/**
 * SUMMIT — quiet luxury for a brokerage. The hero sits in a rounded inset
 * frame with the name in huge thin type and a floating card that cycles
 * through featured homes; a full-screen menu; a photo band of numbers; and
 * a short "let's talk" form with a buying / selling switch.
 */

const BG = '#ebebe8';
const INK = '#161616';
const MUTED = '#77756f';
const GOLD = '#c6a15b';
const SUPPORTED = ALL_SECTIONS;

export function SummitTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? GOLD;
  const order = orderedSections(data, SUPPORTED);
  const hero = heroImage(data);
  const kit = useSiteKit();
  const f = useListingFilter(listings);
  const search = useListingSearch(listings);
  const shown = search.apply(f.shown);
  const areas = areasOf(data);
  const stats = statsFor(data, 3);
  const nav = navFor(data, order, { listings: 'Properties' });
  const scrolled = useScrolled(80);
  const [menu, setMenu] = useState(false);
  const featured = listings.filter((l) => l.heroImageUrl).slice(0, 5);
  const auto = useAutoplay(featured.length, 4500);
  const card = featured[auto.index];
  const theme: SiteTheme = { ink: INK, muted: MUTED, accent: INK, card: '#f4f4f1', line: 'rgba(0,0,0,0.1)', radius: 18, weight: 400, width: 'max-w-7xl' };

  useEffect(() => {
    if (!menu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [menu]);

  const big = 'text-[34px] font-light leading-[1.05] tracking-[-0.03em] sm:text-[56px]';
  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),

    listings: (
      <section id="listings" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal><h2 className={big}>Selected properties</h2></Reveal>
          {f.tabs.length > 1 && (
            <div className="flex gap-2">
              {f.tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                  className="cursor-pointer rounded-full border px-4 py-2 text-[13px]" style={f.tab === t.key ? { background: INK, borderColor: INK, color: '#fff' } : { borderColor: 'rgba(0,0,0,0.15)' }}>{t.label}</button>
              ))}
            </div>
          )}
        </div>
        <ListingTools f={search} theme={theme} />
        {shown.length === 0 ? <p className="mt-10 text-[15px]" style={{ color: MUTED }}>{search.active ? 'No homes match these filters.' : 'New homes coming soon.'}</p> : (
          <Stagger className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((l) => (
              <a key={l.id} href={l.href} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[18px]">
                  <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]" />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px]">
                    <span className="h-2 w-2 rounded-full bg-[#34a853]" />{statusLabel(l)}
                  </span>
                  <SaveHeart listing={l} className="absolute right-4 top-4" />
                </div>
                <p className="mt-4 text-[20px] font-light tracking-tight">{l.name}</p>
                <div className="mt-1 flex items-center justify-between text-[14px]" style={{ color: MUTED }}>
                  <span>{placeLabel(l) || 'Kenya'}</span><span style={{ color: INK }}>{priceLabel(l)}</span>
                </div>
              </a>
            ))}
          </Stagger>
        )}
      </section>
    ),

    stats: stats.length ? (
      <section className="px-3 sm:px-4">
        <div className="relative overflow-hidden rounded-[28px] text-white">
          {listings[1]?.heroImageUrl || hero ? <Img src={listings[1]?.heroImageUrl ?? hero} className="absolute inset-0 h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10">
            <p className="text-[13px] uppercase tracking-[0.2em] text-white/70">Why choose us</p>
            <div className="mt-10 grid gap-10 sm:grid-cols-3">
              {stats.map((s) => (
                <Reveal key={s.label}>
                  <p className="text-[64px] font-extralight leading-none tracking-[-0.04em] sm:text-[88px]"><CountUp value={s.v} decimals={s.d ?? 0} suffix={s.s} /></p>
                  <p className="mt-3 text-[15px] text-white/75">{s.label}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    ) : null,

    about: (
      <section id="about" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-28 text-center sm:px-8">
        <Reveal>
          <p className="text-[26px] font-light leading-[1.35] tracking-tight sm:text-[38px]">
            “{agent.bio ? agent.bio.split(/(?<=[.!?])\s/).slice(0, 2).join(' ') : 'Every home has a story. Our job is to make sure the next chapter starts well.'}”
          </p>
          <p className="mt-8 text-[14px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>{agent.displayName}</p>
          <div className="mt-8 flex justify-center gap-3">
            {!!data.content?.team.length && <a href="#team" className="rounded-full border px-6 py-3 text-[14px]" style={{ borderColor: 'rgba(0,0,0,0.2)' }}>Meet the team</a>}
            <a href="#contact" className="rounded-full px-6 py-3 text-[14px] text-black" style={{ background: accent }}>Get in touch</a>
          </div>
        </Reveal>
      </section>
    ),

    areas: areas.length ? (
      <section id="areas" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-8">
        <Reveal><h2 className={big}>Neighbourhoods</h2></Reveal>
        <ul className="mt-10 border-t" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
          {areas.map((a) => (
            <li key={a.name} className="flex items-baseline justify-between border-b py-6" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
              <span className="text-[26px] font-light tracking-tight sm:text-[34px]">{a.name}</span>
              <span className="text-[14px]" style={{ color: MUTED }}>{a.count ? `${a.count} available` : 'Ask us'}</span>
            </li>
          ))}
        </ul>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr]">
          <div>
            <Reveal><h2 className="text-[48px] font-light leading-none tracking-[-0.04em] sm:text-[88px]">Let’s talk.</h2></Reveal>
            <div className="mt-8 space-y-2 text-[16px]" style={{ color: MUTED }}>
              {agent.phone && <a href={`tel:${agent.phone}`} className="block hover:text-black">{agent.phone}</a>}
              {agent.email && <a href={`mailto:${agent.email}`} className="block hover:text-black">{agent.email}</a>}
              {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="block hover:text-black">WhatsApp</a>}
              {agent.officeAddress && <p>{agent.officeAddress}</p>}
            </div>
          </div>
          <div className="rounded-[24px] bg-white p-6 sm:p-8">
            {kit?.forms.contact ? <ContactForm theme={theme} /> : <p style={{ color: MUTED }}>Call or email — we reply the same day.</p>}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, ['--accent' as string]: accent }}>
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className={`mx-auto flex h-16 items-center justify-between rounded-[20px] px-5 transition-colors duration-300 sm:px-8 ${scrolled ? 'bg-white/95 shadow-sm backdrop-blur' : ''}`}
          style={{ color: scrolled ? INK : '#fff' }}>
          <a href="#top" className="truncate text-[17px] font-light tracking-[0.02em]">{agent.displayName}</a>
          <nav className="hidden items-center gap-8 text-[14px] md:flex">
            {nav.slice(0, 4).map((n) => <a key={n.href} href={n.href} className="opacity-85 hover:opacity-100">{n.label}</a>)}
          </nav>
          <button type="button" onClick={() => setMenu(true)} aria-label="Open menu"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors" style={{ background: scrolled ? INK : '#fff', color: scrolled ? '#fff' : INK }}>
            <Icon d={ICON.menu} size={18} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50 flex flex-col p-6 text-white sm:p-10" style={{ background: INK }}
            initial={{ clipPath: 'circle(0% at 95% 5%)' }} animate={{ clipPath: 'circle(150% at 95% 5%)' }} exit={{ clipPath: 'circle(0% at 95% 5%)' }} transition={{ duration: 0.7, ease: EASE }}>
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-light">{agent.displayName}</span>
              <button type="button" onClick={() => setMenu(false)} aria-label="Close menu" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-black"><Icon d={ICON.close} size={18} /></button>
            </div>
            <nav className="mt-auto space-y-2">
              {[...nav, { href: '#contact', label: 'Contact' }].map((n, i) => (
                <motion.a key={n.href} href={n.href} onClick={() => setMenu(false)} className="block text-[44px] font-extralight leading-tight tracking-[-0.03em] hover:text-[color:var(--accent)] sm:text-[72px]"
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.5, ease: EASE }}>{n.label}</motion.a>
              ))}
            </nav>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-[14px] text-white/60">
              {agent.phone && <span>{agent.phone}</span>}{agent.email && <span>{agent.email}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section id="top" className="p-3 sm:p-4">
        <div className="relative flex h-[92vh] min-h-[560px] items-end overflow-hidden rounded-[28px] text-white">
          {hero ? <KenBurns src={hero} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: INK }} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />
          <div className="relative w-full px-5 pb-8 sm:px-10 sm:pb-12">
            <motion.h1 className="text-[16vw] font-extralight leading-[0.85] tracking-[-0.06em] sm:text-[12vw]"
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE }}>
              {agent.displayName}
            </motion.h1>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <p className="max-w-md text-[16px] font-light text-white/85">{agent.siteTagline ?? `Exceptional homes in ${agent.serviceAreas[0] ?? 'Kenya'}.`}</p>
              {card && (
                <AnimatePresence mode="wait">
                  <motion.a key={card.id} href={card.href} className="flex w-full max-w-sm items-center gap-4 rounded-[20px] bg-white p-3 text-black sm:w-auto"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5, ease: EASE }}>
                    <Img src={card.heroImageUrl} className="h-20 w-24 shrink-0 rounded-[14px] object-cover" />
                    <span className="min-w-0 pr-2">
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-[0.12em]" style={{ color: MUTED }}><span className="h-1.5 w-1.5 rounded-full bg-[#34a853]" />{statusLabel(card)}</span>
                      <span className="block truncate text-[16px]">{card.name}</span>
                      <span className="block text-[14px]" style={{ color: MUTED }}>{priceLabel(card)}</span>
                    </span>
                  </motion.a>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <p className="text-[14vw] font-extralight leading-none tracking-[-0.06em] opacity-15 sm:text-[9vw]">{agent.displayName}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.12)', color: MUTED }}>
          <span>© {new Date().getFullYear()} {agent.displayName}</span>
          <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a>
          <LegalLine data={data} color={MUTED} />
        </div>
      </footer>
      <SiteKitLayer theme={theme} />
    </div>
  );
}
