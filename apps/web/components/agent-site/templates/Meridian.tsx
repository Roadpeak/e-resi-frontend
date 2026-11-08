'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, CATEGORY, heroImage, Icon, ICON, Img, orderedSections, placeLabel, priceLabel, specialtyLabel, waLink,
} from '../shared';
import { CountUp, EASE, KenBurns, motion, Reveal, useAutoplay } from '../motion';
import { useReducedMotion } from 'framer-motion';

/**
 * MERIDIAN — quiet luxury. Serif display type on sand, a slowly turning
 * ornament, slash-labelled sections, a centre-focus listing carousel with
 * autoplay and pause, hairline numbers, and a private-consultation call to
 * action.
 */

const SUPPORTED: readonly SiteSectionId[] = ['listings', 'about', 'stats', 'areas', 'contact'];
const SAND = '#efe9df';
const INK = '#26231f';
const MUTED = '#7a7268';
const GREEN = '#2f3a30';
const SERIF = 'var(--font-cormorant), Georgia, "Times New Roman", serif';

function Ornament({ color, className }: { color: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg viewBox="0 0 200 200" className={className} aria-hidden
      animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 140, ease: 'linear', repeat: Infinity }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse key={i} cx="100" cy="58" rx="22" ry="52" fill="none" stroke={color} strokeWidth="1" transform={`rotate(${i * 22.5} 100 100)`} />
      ))}
      <circle cx="100" cy="100" r="10" fill="none" stroke={color} strokeWidth="1" />
    </motion.svg>
  );
}

function Label({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: light ? 'rgba(255,255,255,0.6)' : MUTED }}>/ {children}</p>;
}

export function MeridianTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#a5793f';
  const order = orderedSections(data, SUPPORTED);
  const hero = heroImage(data);
  const areas = areasOf(data);
  const auto = useAutoplay(listings.length, 5500);
  const [solid, setSolid] = useState(false);
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > window.innerHeight * 0.8);
    const size = () => setWide(window.innerWidth >= 768);
    on(); size();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', size);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', size); };
  }, []);

  const current = listings[auto.index];
  const stats = [
    { v: listings.length, label: 'Residences represented' },
    agent.yearsExperience ? { v: agent.yearsExperience, label: 'Years of practice', s: '+' } : null,
    agent.dealsCompleted > 0 ? { v: agent.dealsCompleted, label: 'Transactions closed', s: '+' } : null,
    (data.stats?.cities ?? 0) > 0 ? { v: data.stats!.cities, label: data.stats!.cities === 1 ? 'City' : 'Cities' } : null,
  ].filter(Boolean) as { v: number; label: string; s?: string }[];

  const blocks: Record<SiteSectionId, ReactNode> = {
    listings: listings.length ? (
      <section id="listings" className="scroll-mt-20 overflow-hidden py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <Reveal>
            <Label>Portfolio</Label>
            <h2 className="mt-4 text-[44px] leading-[1.02] sm:text-[64px]" style={{ fontFamily: SERIF }}>Signature residences</h2>
          </Reveal>
        </div>
        <div className="relative mx-auto mt-14 h-[300px] max-w-6xl sm:h-[420px]">
          {listings.map((l, i) => {
            let d = i - auto.index;
            const n = listings.length;
            if (d > n / 2) d -= n;
            if (d < -n / 2) d += n;
            const far = Math.abs(d) > 2;
            return (
              <motion.button key={l.id} type="button" onClick={() => (d === 0 ? window.open(l.href, '_self') : auto.go(i))}
                aria-label={d === 0 ? `Open ${l.name}` : `Show ${l.name}`}
                className="absolute left-1/2 top-0 h-full w-[78vw] max-w-[560px] cursor-pointer overflow-hidden"
                style={{ zIndex: 10 - Math.abs(d), pointerEvents: far ? 'none' : 'auto' }}
                initial={false}
                animate={{
                  x: `calc(-50% + ${d * (wide ? 70 : 84)}%)`,
                  scale: d === 0 ? 1 : 0.78,
                  opacity: far ? 0 : d === 0 ? 1 : 0.45,
                  filter: d === 0 ? 'blur(0px)' : 'blur(2px)',
                }}
                transition={{ duration: 0.9, ease: EASE }}>
                <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover" />
                {d === 0 && l.status === 'OFF_PLAN' && (
                  <span className="absolute left-4 top-4 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: INK }}>Off-plan</span>
                )}
              </motion.button>
            );
          })}
        </div>
        {current && (
          <div className="mx-auto mt-10 max-w-3xl px-4 text-center sm:px-6">
            <motion.div key={current.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <p className="text-[13px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>{placeLabel(current)}{CATEGORY[current.category] ? ` · ${CATEGORY[current.category]}` : ''}</p>
              <a href={current.href} className="mt-2 block text-[36px] leading-tight hover:opacity-70 sm:text-[44px]" style={{ fontFamily: SERIF }}>{current.name}</a>
              <p className="mt-2 text-[15px] font-semibold tracking-[0.08em]" style={{ color: accent }}>{priceLabel(current)}</p>
            </motion.div>
            {listings.length > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button type="button" onClick={auto.prev} aria-label="Previous" className="flex h-11 w-11 cursor-pointer items-center justify-center border hover:bg-white" style={{ borderColor: 'rgba(0,0,0,0.2)' }}><Icon d={ICON.prev} size={16} /></button>
                <span className="w-20 text-center text-[13px] tabular-nums tracking-[0.12em]" style={{ color: MUTED }}>
                  {String(auto.index + 1).padStart(2, '0')} / {String(listings.length).padStart(2, '0')}
                </span>
                <button type="button" onClick={auto.next} aria-label="Next" className="flex h-11 w-11 cursor-pointer items-center justify-center border hover:bg-white" style={{ borderColor: 'rgba(0,0,0,0.2)' }}><Icon d={ICON.next} size={16} /></button>
                <button type="button" onClick={auto.toggle} aria-label={auto.playing ? 'Pause' : 'Play'} className="ml-2 flex h-11 w-11 cursor-pointer items-center justify-center border hover:bg-white" style={{ borderColor: 'rgba(0,0,0,0.2)' }}>
                  <Icon d={auto.playing ? ICON.pause : ICON.play} size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    ) : null,

    about: (
      <section id="about" className="relative scroll-mt-20 overflow-hidden py-24">
        <Ornament color={accent} className="pointer-events-none absolute -left-24 top-10 h-[420px] w-[420px] opacity-[0.18]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 md:grid-cols-2">
          <Reveal>
            <Label>Philosophy</Label>
            <h2 className="mt-4 text-[42px] leading-[1.04] sm:text-[58px]" style={{ fontFamily: SERIF }}>
              {agent.kind === 'COMPANY' ? 'Built around better living' : 'A more personal way to move'}
            </h2>
            <p className="mt-6 whitespace-pre-line text-[16px] leading-[1.8]" style={{ color: MUTED }}>
              {agent.bio ?? `${agent.displayName} represents a considered selection of residences, with discreet service from the first viewing to the final signature.`}
            </p>
            {agent.specialties.length > 0 && (
              <p className="mt-6 text-[13px] uppercase tracking-[0.16em]" style={{ color: INK }}>
                {agent.specialties.map(specialtyLabel).join('  ·  ')}
              </p>
            )}
          </Reveal>
          <Reveal delay={0.15} className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-0 translate-x-4 translate-y-4" style={{ background: GREEN }} />
            <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
              <Img src={agent.photoUrl ?? listings[1]?.heroImageUrl ?? hero} alt={agent.displayName} className="h-full w-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>
    ),

    stats: stats.length ? (
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 border-y md:grid-cols-4" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className={`px-2 py-10 text-center ${i ? 'md:border-l' : ''}`}>
              <p className="text-[56px] leading-none" style={{ fontFamily: SERIF }}><CountUp value={s.v} suffix={s.s ?? ''} /></p>
              <p className="mt-3 text-[12px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>
    ) : null,

    areas: areas.length ? (
      <section id="areas" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-24 sm:px-6">
        <Reveal className="text-center">
          <Label>Communities</Label>
          <h2 className="mt-4 text-[42px] leading-tight sm:text-[56px]" style={{ fontFamily: SERIF }}>Where we are at home</h2>
        </Reveal>
        <ul className="mt-12 border-t" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
          {areas.slice(0, 8).map((a, i) => (
            <Reveal as="li" key={a.name} delay={i * 0.04} blur={false} y={12}>
              <div className="group flex items-baseline justify-between gap-6 border-b py-5" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
                <span className="flex items-baseline gap-5">
                  <span className="w-8 text-[13px] tabular-nums" style={{ color: MUTED }}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[28px] transition-transform duration-500 group-hover:translate-x-2" style={{ fontFamily: SERIF }}>{a.name}</span>
                </span>
                <span className="text-[13px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>{a.count ? `${a.count} residence${a.count === 1 ? '' : 's'}` : 'On request'}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="scroll-mt-20 px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden px-6 py-20 text-center text-white sm:px-12" style={{ background: GREEN }}>
          <Ornament color="#ffffff" className="pointer-events-none absolute -right-20 -top-20 h-[360px] w-[360px] opacity-[0.08]" />
          <Reveal className="relative">
            <Label light>Private consultation</Label>
            <h2 className="mx-auto mt-5 max-w-2xl text-[44px] leading-[1.04] sm:text-[64px]" style={{ fontFamily: SERIF }}>Begin a private conversation</h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-white/70">Viewings by appointment, in person or by live guided tour, at a time that suits you.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {agent.whatsapp && (
                <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-white" style={{ background: accent }}>
                  <Icon d={ICON.chat} size={16} /> WhatsApp
                </a>
              )}
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-2 border border-white/40 px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.16em] hover:bg-white/10">
                  <Icon d={ICON.phone} size={16} /> {agent.phone}
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-2 border border-white/40 px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.16em] hover:bg-white/10">
                  <Icon d={ICON.mail} size={16} /> Email
                </a>
              )}
            </div>
            {agent.officeAddress && <p className="mt-8 text-[13px] text-white/50">{agent.officeAddress}</p>}
          </Reveal>
        </div>
      </section>
    ),
  };

  const nav = [
    order.includes('listings') && listings.length && { href: '#listings', label: 'Residences' },
    order.includes('about') && { href: '#about', label: 'About' },
    order.includes('areas') && areas.length && { href: '#areas', label: 'Communities' },
  ].filter(Boolean) as { href: string; label: string }[];
  const tone = solid ? INK : '#fff';

  return (
    <div className="min-h-screen" style={{ background: SAND, color: INK, fontFamily: 'var(--font-geist), system-ui, sans-serif', ['--accent' as string]: accent }}>
      <header className="fixed inset-x-0 top-0 z-40 transition-colors duration-500" style={{ background: solid ? SAND : 'transparent', color: tone }}>
        <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-8">
          <nav className="hidden gap-7 text-[12px] font-semibold uppercase tracking-[0.18em] md:flex">
            {nav.map((n) => <a key={n.href} href={n.href} className="hover:opacity-60">{n.label}</a>)}
          </nav>
          <a href="#top" className="col-start-2 flex items-center gap-2.5">
            {agent.logoUrl
              ? <Img src={agent.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" eager />
              : <Ornament color={tone} className="h-7 w-7" />}
            <span className="whitespace-nowrap text-[24px] leading-none" style={{ fontFamily: SERIF }}>{agent.displayName}</span>
          </a>
          <div className="col-start-3 flex justify-end gap-2">
            {agent.phone && <a href={`tel:${agent.phone}`} aria-label="Call" className="flex h-9 w-9 items-center justify-center text-white" style={{ background: accent }}><Icon d={ICON.phone} size={15} /></a>}
            {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hidden h-9 w-9 items-center justify-center text-white sm:flex" style={{ background: accent }}><Icon d={ICON.chat} size={15} /></a>}
            {agent.email && <a href={`mailto:${agent.email}`} aria-label="Email" className="hidden h-9 w-9 items-center justify-center text-white sm:flex" style={{ background: accent }}><Icon d={ICON.mail} size={15} /></a>}
          </div>
        </div>
      </header>

      <section id="top" className="relative h-[100svh] min-h-[600px] overflow-hidden bg-black text-white">
        {hero && <KenBurns src={hero} className="absolute inset-0 h-full w-full object-cover opacity-80" />}
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.h1 className="max-w-5xl text-[56px] leading-[0.98] sm:text-[96px]" style={{ fontFamily: SERIF }}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}>
            {agent.siteTagline ?? 'Luxury living, redefined'}
          </motion.h1>
          <motion.p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/80"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }}>
            Exclusive access to {agent.kind === 'COMPANY' ? 'our' : 'my'} finest residences, with white-glove service at every turn.
          </motion.p>
          <motion.a href="#contact" className="mt-10 flex items-center gap-4 text-[12px] font-semibold uppercase tracking-[0.22em] hover:opacity-70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.9 }}>
            <span className="h-px w-10 bg-white/70" /> Schedule a private consultation <span className="h-px w-10 bg-white/70" />
          </motion.a>
        </div>
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-[12px] uppercase tracking-[0.14em] sm:px-8" style={{ color: MUTED }}>
          <span>© {new Date().getFullYear()} {agent.displayName}</span>
          <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a>
        </div>
      </footer>
    </div>
  );
}
