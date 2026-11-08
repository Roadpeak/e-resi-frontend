'use client';

import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';

import { useEffect, useState, type ReactNode } from 'react';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, firstSentence, hasTour, heroImage, Icon, ICON, Img, orderedSections, placeLabel, priceLabel,
  specialtyLabel, statusLabel, useListingFilter, waLink,
} from '../shared';
import { CountUp, Reveal, Stagger } from '../motion';

/**
 * HAVEN — a warm personal-brand site for an individual agent. Floating pill
 * navigation, a framed hero with a featured-listing card, the agent's own
 * story up front, and calm reveal-on-scroll motion throughout.
 */

const SUPPORTED = ALL_SECTIONS;
const BG = '#f6f4ef';
const INK = '#1d1c1a';
const MUTED = '#6b675f';

export function HavenTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#b4532a';
  const order = orderedSections(data, SUPPORTED);
  const hero = heroImage(data);
  const featured = listings.find((l) => l.heroImageUrl) ?? listings[0];
  const f = useListingFilter(listings);
  const areas = areasOf(data);
  const firstName = agent.kind === 'INDIVIDUAL' ? agent.displayName.split(' ')[0] : agent.displayName;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const stats = [
    agent.yearsExperience ? { v: agent.yearsExperience, s: '+', label: 'Years helping clients' } : null,
    { v: listings.length, s: '', label: listings.length === 1 ? 'Development on offer' : 'Developments on offer' },
    agent.dealsCompleted > 0 ? { v: agent.dealsCompleted, s: '+', label: 'Moves supported' } : null,
    agent.ratingCount > 0 && agent.ratingAverage != null ? { v: agent.ratingAverage, s: '', d: 1, label: `Rating from ${agent.ratingCount} reviews` } : null,
    (data.stats?.withTours ?? 0) > 0 ? { v: data.stats!.withTours, s: '', label: 'With virtual tours' } : null,
  ].filter(Boolean).slice(0, 4) as { v: number; s: string; d?: number; label: string }[];

  const theme: SiteTheme = { ink: INK, muted: MUTED, accent, card: '#ffffff', line: 'rgba(0,0,0,0.07)', radius: 28 };
  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),
    stats: stats.length ? (
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-black/[0.07] md:grid-cols-4">
          {stats.map((s) => (
            <Reveal key={s.label} className="bg-white p-6 sm:p-8">
              <p className="text-[40px] font-medium leading-none tracking-tight sm:text-[48px]" style={{ color: INK }}>
                <CountUp value={s.v} decimals={s.d ?? 0} suffix={s.s} />
              </p>
              <p className="mt-3 text-[14px]" style={{ color: MUTED }}>{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>
    ) : null,

    listings: (
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <Reveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: accent }}>A place to begin</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-xl text-[32px] font-medium leading-[1.1] tracking-tight sm:text-[42px]">Homes worth a closer look.</h2>
            <div className="flex flex-wrap items-center gap-2">
              {f.tabs.length > 1 && f.tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                  className="cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
                  style={f.tab === t.key ? { background: INK, color: '#fff' } : { background: '#fff', color: INK }}>
                  {t.label}
                </button>
              ))}
              {f.cities.length > 1 && (
                <select value={f.city} onChange={(e) => f.setCity(e.target.value)} aria-label="Filter by location"
                  className="rounded-full border-0 bg-white px-4 py-2 text-[13px]" style={{ color: INK }}>
                  <option value="">Everywhere</option>
                  {f.cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>
        </Reveal>
        {f.shown.length === 0 ? (
          <p className="mt-10 rounded-3xl bg-white p-10 text-center text-[15px]" style={{ color: MUTED }}>
            New homes are on the way. Get in touch to hear about them first.
          </p>
        ) : (
          <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {f.shown.map((l) => (
              <a key={l.id} href={l.href} className="group block rounded-[28px] bg-white p-2 transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[22px]">
                  <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: INK }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />{statusLabel(l)}
                  </span>
                  {hasTour(l) && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium" style={{ color: INK }}>
                      <Icon d={ICON.cube} size={12} /> Tour
                    </span>
                  )}
                </div>
                <div className="px-3 pb-3 pt-4">
                  <h3 className="text-[18px] font-medium leading-snug" style={{ color: INK }}>{l.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-[13.5px]" style={{ color: MUTED }}>
                    <Icon d={ICON.pin} size={13} /> {placeLabel(l) || 'Kenya'}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-4">
                    <span className="text-[17px] font-medium" style={{ color: INK }}>{priceLabel(l)}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f4ef] transition-colors group-hover:bg-[color:var(--accent)] group-hover:text-white">
                      <Icon d={ICON.arrowUpRight} size={15} />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </Stagger>
        )}
      </section>
    ),

    about: agent.bio ? (
      <section id="about" className="scroll-mt-24 bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-t-[999px] rounded-b-[32px]" style={{ background: BG }}>
              <Img src={agent.photoUrl ?? agent.logoUrl} alt={agent.displayName} className="h-full w-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: accent }}>
              {agent.kind === 'INDIVIDUAL' ? 'A little about me' : 'About us'}
            </p>
            <h2 className="mt-3 text-[30px] font-medium leading-[1.15] tracking-tight sm:text-[38px]">
              {agent.kind === 'INDIVIDUAL' ? `Hi, I’m ${firstName}.` : `We are ${agent.displayName}.`}
            </h2>
            <p className="mt-5 whitespace-pre-line text-[16px] leading-relaxed" style={{ color: MUTED }}>{agent.bio}</p>
            {agent.specialties.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {agent.specialties.map((s) => (
                  <li key={s} className="rounded-full px-3.5 py-1.5 text-[13px]" style={{ background: BG, color: INK }}>{specialtyLabel(s)}</li>
                ))}
              </ul>
            )}
            <div className="mt-8 grid gap-4 border-t border-black/[0.07] pt-6 text-[14px] sm:grid-cols-2">
              {agent.phone && <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED }}>Phone</p><a href={`tel:${agent.phone}`} className="mt-1 block" style={{ color: INK }}>{agent.phone}</a></div>}
              {agent.email && <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED }}>Email</p><a href={`mailto:${agent.email}`} className="mt-1 block break-all" style={{ color: INK }}>{agent.email}</a></div>}
              {agent.officeAddress && <div className="sm:col-span-2"><p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED }}>Office</p><p className="mt-1" style={{ color: INK }}>{agent.officeAddress}</p></div>}
            </div>
          </Reveal>
        </div>
      </section>
    ) : null,

    areas: areas.length ? (
      <section id="areas" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <Reveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: accent }}>Where I work</p>
          <h2 className="mt-3 text-[30px] font-medium tracking-tight sm:text-[38px]">Neighbourhoods I know street by street.</h2>
        </Reveal>
        <Stagger className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" step={0.05}>
          {areas.slice(0, 9).map((a) => (
            <div key={a.name} className="flex items-center justify-between rounded-2xl bg-white px-5 py-4">
              <span className="text-[16px]" style={{ color: INK }}>{a.name}</span>
              <span className="text-[13px]" style={{ color: MUTED }}>{a.count ? `${a.count} listing${a.count === 1 ? '' : 's'}` : 'Ask me'}</span>
            </div>
          ))}
        </Stagger>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-20 pt-6 sm:px-6">
        <Reveal>
          <div className="rounded-[36px] px-6 py-14 text-center text-white sm:px-12" style={{ background: INK }}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/60">Your next chapter</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-[32px] font-medium leading-[1.1] tracking-tight sm:text-[46px]">Let’s talk about your move.</h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] text-white/70">Ask about a home, book a viewing or a live guided tour. I reply the same day.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {agent.whatsapp && (
                <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium text-white" style={{ background: accent }}>
                  <Icon d={ICON.chat} /> WhatsApp
                </a>
              )}
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-medium" style={{ color: INK }}>
                  <Icon d={ICON.phone} /> Call
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[15px] font-medium text-white hover:bg-white/10">
                  <Icon d={ICON.mail} /> Email
                </a>
              )}
            </div>
          </div>
        </Reveal>
      </section>
    ),
  };

  const nav = [
    order.includes('listings') && { href: '#listings', label: 'Homes' },
    order.includes('about') && agent.bio && { href: '#about', label: 'About' },
    order.includes('areas') && areas.length && { href: '#areas', label: 'Areas' },
    order.includes('team') && data.content?.team.length && { href: '#team', label: 'Team' },
    order.includes('journal') && data.content?.posts.length && { href: '#journal', label: 'Journal' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, ['--accent' as string]: accent }}>
      {/* Floating pill navigation */}
      <header className="fixed inset-x-0 top-3 z-40 px-4">
        <nav className={`mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full bg-white px-3 py-2 transition-shadow ${scrolled ? 'shadow-[0_8px_30px_rgba(0,0,0,0.08)]' : ''}`}>
          <a href="#top" className="flex min-w-0 items-center gap-2.5 pl-1">
            {agent.logoUrl || agent.photoUrl ? (
              <Img src={agent.logoUrl ?? agent.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" eager />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white" style={{ background: accent }}>{agent.displayName.charAt(0)}</span>
            )}
            <span className="truncate text-[15px] font-medium">{agent.displayName}</span>
          </a>
          <div className="hidden items-center gap-6 text-[14px] sm:flex" style={{ color: MUTED }}>
            {nav.map((n) => <a key={n.href} href={n.href} className="hover:text-black">{n.label}</a>)}
          </div>
          <a href="#contact" className="inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-[14px] font-medium text-white" style={{ background: accent }}>
            Let’s talk
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/25"><Icon d={ICON.arrowUpRight} size={14} /></span>
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section id="top" className="mx-auto max-w-6xl px-4 pt-28 sm:px-6 sm:pt-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: MUTED }}>
            {agent.displayName}{agent.serviceAreas[0] ? `  /  ${agent.serviceAreas[0]}` : ''}
          </p>
          <h1 className="mt-5 text-[40px] font-medium leading-[1.05] tracking-tight sm:text-[64px]">
            {agent.siteTagline ?? 'Let’s find the place you’ll call home.'}
          </h1>
          {firstSentence(agent.bio) && <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: MUTED }}>{firstSentence(agent.bio)}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#listings" className="rounded-full px-6 py-3 text-[15px] font-medium text-white" style={{ background: INK }}>Explore homes</a>
            <a href="#contact" className="rounded-full bg-white px-6 py-3 text-[15px] font-medium" style={{ color: INK }}>Book a viewing</a>
          </div>
        </Reveal>
        {hero && (
          <Reveal delay={0.15} className="relative mt-12">
            <div className="aspect-[16/9] overflow-hidden rounded-[36px] sm:aspect-[21/9]">
              <Img src={hero} className="h-full w-full object-cover" eager />
            </div>
            {featured && (
              <a href={featured.href} className="absolute bottom-4 right-4 hidden max-w-xs rounded-3xl bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: accent }}>Featured</p>
                <p className="mt-1 text-[16px] font-medium leading-snug">{featured.name}</p>
                <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>{placeLabel(featured)}</p>
                <p className="mt-2 text-[15px] font-medium">{priceLabel(featured)}</p>
              </a>
            )}
          </Reveal>
        )}
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="border-t border-black/[0.07]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-[13px] sm:px-6" style={{ color: MUTED }}>
          <span>© {new Date().getFullYear()} {agent.displayName}</span>
          <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a>
          <LegalLine data={data} color={MUTED} />
        </div>
      </footer>
    </div>
  );
}
