'use client';

import type { ReactNode } from 'react';
import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';
import { LeadButtons, ListingTools, SaveHeart, SiteKitLayer, useListingSearch, useSiteKit } from '../kit';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, CATEGORY, firstSentence, heroImage, Icon, ICON, Img, orderedSections, placeLabel, priceLabel, statusLabel,
  useListingFilter, waLink,
} from '../shared';
import { CountUp, EASE, Marquee, motion, Reveal, Stagger } from '../motion';
import { navFor, statsFor } from '../base';

/**
 * ROAM — bold and friendly for a solo agent. A giant headline with the
 * hero photo rising behind it, an appraisal call to action, a dark band of
 * tilted client cards drifting past, and a bright strip of areas.
 */

const INK = '#0d0d0d';
const MUTED = '#6a6a6a';
const LIME = '#c8f03c';
const SUPPORTED = ALL_SECTIONS;

export function RoamTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? LIME;
  const order = orderedSections(data, SUPPORTED);
  const hero = heroImage(data);
  const kit = useSiteKit();
  const f = useListingFilter(listings);
  const search = useListingSearch(listings);
  const shown = search.apply(f.shown);
  const areas = areasOf(data);
  const stats = statsFor(data, 2);
  const nav = navFor(data, order, { listings: 'Portfolio' });
  const quotes = data.content?.testimonials ?? [];
  const first = agent.kind === 'COMPANY' ? agent.displayName : agent.displayName.split(' ')[0];
  const theme: SiteTheme = { ink: INK, muted: MUTED, accent: INK, card: '#f4f4f1', line: 'rgba(0,0,0,0.1)', radius: 22 };
  const appraisal = () => (kit?.forms.valuation ? document.getElementById('valuation')?.scrollIntoView({ behavior: 'smooth' }) : kit?.open({ kind: 'contact' }));
  const tilt = [-6, 4, -3, 7, -5, 3];

  // Client cards: testimonials, else listings — each pinned with a home photo.
  const cards = (quotes.length ? quotes.slice(0, 8).map((q, i) => ({
    id: q.id, img: q.photoUrl ?? listings[i % Math.max(listings.length, 1)]?.heroImageUrl ?? null,
    pin: listings[(i + 1) % Math.max(listings.length, 1)]?.heroImageUrl ?? null, title: q.author, text: q.quote,
  })) : listings.slice(0, 8).map((l) => ({ id: l.id, img: l.heroImageUrl, pin: null, title: l.name, text: placeLabel(l) })));

  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),

    stats: (
      <section className="overflow-hidden py-24 text-white" style={{ background: INK }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-end">
            <Reveal><h2 className="text-[34px] font-bold leading-[1.05] tracking-tight sm:text-[52px]">Real people. <span style={{ color: accent }}>Real homes.</span> Real results.</h2></Reveal>
            <div className="flex gap-10">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-[46px] font-bold leading-none" style={{ color: accent }}><CountUp value={s.v} decimals={s.d ?? 0} suffix={s.s} /></p>
                  <p className="mt-2 text-[14px] text-white/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {cards.length > 0 && (
          <Marquee speed={55} className="mt-16 py-6">
            {cards.map((c, i) => (
              <div key={c.id} className="relative w-64 shrink-0 rounded-[22px] bg-white p-3 text-black" style={{ transform: `rotate(${tilt[i % tilt.length]}deg)` }}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[16px]">
                  <Img src={c.img} className="h-full w-full object-cover grayscale" />
                  {c.pin && <Img src={c.pin} className="absolute bottom-3 right-3 h-16 w-20 rotate-6 rounded-lg border-4 border-white object-cover shadow-lg" />}
                </div>
                <p className="mt-3 truncate px-1 text-[15px] font-bold">{c.title}</p>
                {c.text && <p className="line-clamp-2 px-1 text-[13px]" style={{ color: MUTED }}>{c.text}</p>}
              </div>
            ))}
          </Marquee>
        )}
      </section>
    ),

    about: (
      <section id="about" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 md:grid-cols-2 md:items-center">
          <Reveal className="overflow-hidden rounded-[28px]"><Img src={agent.photoUrl ?? agent.logoUrl ?? hero} alt={agent.displayName} className="aspect-[4/5] w-full object-cover" /></Reveal>
          <div>
            <p className="inline-block rounded-full px-3 py-1 text-[12.5px] font-bold" style={{ background: accent }}>About {first}</p>
            <h2 className="mt-5 text-[38px] font-bold leading-[1.02] tracking-tight sm:text-[56px]">{agent.displayName}</h2>
            {agent.bio && <p className="mt-6 whitespace-pre-line text-[17px] leading-relaxed" style={{ color: '#3a3a3a' }}>{agent.bio}</p>}
            <div className="mt-8 flex flex-wrap gap-2">
              {Object.entries(agent.socials ?? {}).filter(([, v]) => v).slice(0, 4).map(([k, v]) => (
                <a key={k} href={v} target="_blank" rel="noreferrer" className="rounded-full border border-black/15 px-4 py-2 text-[13.5px] font-semibold capitalize hover:bg-black hover:text-white">{k}</a>
              ))}
              {agent.email && <a href={`mailto:${agent.email}`} className="rounded-full border border-black/15 px-4 py-2 text-[13.5px] font-semibold hover:bg-black hover:text-white">Email</a>}
            </div>
          </div>
        </div>
      </section>
    ),

    areas: areas.length ? (
      <section id="areas" className="scroll-mt-20 py-6" style={{ background: accent }}>
        <Marquee speed={35}>
          {areas.map((a) => (
            <span key={a.name} className="flex items-center gap-10 whitespace-nowrap text-[28px] font-bold tracking-tight sm:text-[40px]" style={{ color: INK }}>
              {a.name}<Icon d={ICON.cube} size={26} />
            </span>
          ))}
        </Marquee>
      </section>
    ) : null,

    listings: (
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal><h2 className="text-[40px] font-bold leading-none tracking-tight sm:text-[64px]">Property portfolio</h2></Reveal>
          {f.tabs.length > 1 && (
            <div className="flex gap-2">
              {f.tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                  className="cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-semibold" style={f.tab === t.key ? { background: INK, color: '#fff' } : { background: '#f1f1ee' }}>{t.label}</button>
              ))}
            </div>
          )}
        </div>
        <ListingTools f={search} theme={theme} />
        {shown.length === 0 ? (
          <p className="mt-10 text-[15px]" style={{ color: MUTED }}>{search.active ? 'No homes match these filters.' : 'New homes soon.'}</p>
        ) : (
          <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((l) => (
              <a key={l.id} href={l.href} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[22px]">
                  <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: accent, color: INK }}>{statusLabel(l)}</span>
                    {CATEGORY[l.category] && <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold">{CATEGORY[l.category]}</span>}
                  </div>
                  <SaveHeart listing={l} className="absolute right-3 top-3" />
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[19px] font-bold">{l.name}</h3>
                    <p className="text-[14px]" style={{ color: MUTED }}>{placeLabel(l) || 'Kenya'}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors group-hover:bg-[color:var(--lime)] group-hover:text-black" style={{ background: INK }}><Icon d={ICON.arrowUpRight} size={16} /></span>
                </div>
                <p className="mt-2 text-[16px] font-bold">{priceLabel(l)}{l.units > 0 && <span className="ml-2 text-[13px] font-medium" style={{ color: MUTED }}>{l.units} units</span>}</p>
              </a>
            ))}
          </Stagger>
        )}
      </section>
    ),

    contact: (
      <section id="contact" className="scroll-mt-20 px-4 pb-10 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[32px] px-6 py-16 text-white sm:px-14 sm:py-20" style={{ background: INK }}>
          <h2 className="max-w-3xl text-[40px] font-bold leading-[1] tracking-tight sm:text-[72px]">Let’s get you <span style={{ color: accent }}>moving.</span></h2>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <LeadButtons theme={{ ...theme, accent: '#ffffff' }} tone="dark" onAccent={INK} />
            <button type="button" onClick={appraisal} className="cursor-pointer rounded-full px-6 py-3 text-[15px] font-bold" style={{ background: accent, color: INK }}>Request a property appraisal</button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14.5px] text-white/70">
            {agent.phone && <a href={`tel:${agent.phone}`} className="hover:text-white">{agent.phone}</a>}
            {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp</a>}
            {agent.officeAddress && <span>{agent.officeAddress}</span>}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen bg-white" style={{ color: INK, ['--accent' as string]: accent, ['--lime' as string]: accent }}>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="truncate text-[22px] italic tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontWeight: 600 }}>{agent.displayName}</a>
          <nav className="hidden items-center gap-7 text-[14.5px] font-medium md:flex">
            {nav.map((n) => <a key={n.href} href={n.href} className="hover:opacity-60">{n.label}</a>)}
          </nav>
          <button type="button" onClick={appraisal} className="cursor-pointer rounded-full px-5 py-2.5 text-[14px] font-semibold text-white" style={{ background: INK }}>
            <span className="hidden sm:inline">Request a property </span>appraisal
          </button>
        </div>
      </header>

      <section id="top" className="relative mx-auto max-w-6xl overflow-hidden px-4 pt-10 sm:px-6 sm:pt-14">
        <h1 className="relative z-10 text-[19vw] font-black leading-[0.82] tracking-[-0.05em] sm:text-[150px] lg:text-[190px]">
          <motion.span className="block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            {(agent.siteTagline ?? 'Find home.').split(' ').slice(0, 3).join(' ')}
          </motion.span>
        </h1>
        <motion.div className="relative -mt-[6vw] overflow-hidden rounded-[32px] sm:-mt-14"
          initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}>
          {hero ? <Img src={hero} className="aspect-[4/3] w-full object-cover sm:aspect-[21/9]" eager /> : <div className="aspect-[21/9] w-full bg-[#f1f1ee]" />}
        </motion.div>
        <Reveal delay={0.4} className="mt-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Img src={agent.photoUrl ?? agent.logoUrl} alt="" className="h-14 w-14 rounded-full object-cover" eager />
            <p className="max-w-md text-[16px] leading-snug">
              <span className="font-bold">{agent.displayName}</span>
              <span style={{ color: MUTED }}> — {firstSentence(agent.bio, 120) ?? `property ${agent.kind === 'COMPANY' ? 'team' : 'agent'} in ${agent.serviceAreas[0] ?? 'Kenya'}`}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#listings" className="rounded-full px-6 py-3 text-[15px] font-semibold text-white" style={{ background: INK }}>See properties</a>
            <button type="button" onClick={appraisal} className="cursor-pointer rounded-full px-6 py-3 text-[15px] font-bold" style={{ background: accent, color: INK }}>Property appraisal</button>
          </div>
        </Reveal>
      </section>

      <div className="mt-20">{order.map((id) => <div key={id}>{blocks[id]}</div>)}</div>

      <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]" style={{ color: MUTED }}>
          <span className="italic" style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: INK }}>{agent.displayName}</span>
          <span>© {new Date().getFullYear()} · <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a></span>
          <LegalLine data={data} color={MUTED} />
        </div>
      </footer>
      <SiteKitLayer theme={theme} />
    </div>
  );
}
