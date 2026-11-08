'use client';

import { useRef, type ReactNode } from 'react';
import { AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';
import { ContactForm, ListingTools, SaveHeart, SiteKitLayer, useListingSearch, useSiteKit } from '../kit';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, firstSentence, heroImage, Icon, ICON, Img, orderedSections, placeLabel, priceLabel, statusLabel,
  useListingFilter, waLink,
} from '../shared';
import { CountUp, EASE, motion, Reveal, Stagger, useAutoplay } from '../motion';
import { navFor, statsFor, stepsFor } from '../base';

/**
 * ARCADIA — a warm one-page site for an individual agent. Cream, terracotta
 * and mustard; arch-shaped photos with geometric shapes that drift as you
 * scroll; buyer and seller paths; one client story at a time; and the
 * contact form right on the page.
 */

const BG = '#f7f0e6';
const INK = '#2a2420';
const MUTED = '#7a6c60';
const MUSTARD = '#e0a93b';
const DISPLAY = 'var(--font-jakarta), system-ui, sans-serif';
const SUPPORTED = ALL_SECTIONS;

function Arches({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
      {[90, 72, 54, 36].map((r) => <path key={r} d={`M${100 - r} 200 V${200 - r} A${r} ${r} 0 0 1 ${100 + r} ${200 - r} V200`} stroke={color} strokeWidth="2" />)}
    </svg>
  );
}

export function ArcadiaTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#c8643b';
  const order = orderedSections(data, SUPPORTED);
  const hero = heroImage(data);
  const kit = useSiteKit();
  const f = useListingFilter(listings);
  const search = useListingSearch(listings);
  const shown = search.apply(f.shown);
  const areas = areasOf(data);
  const stats = statsFor(data, 3);
  const nav = navFor(data, order, { listings: 'Listings' });
  const city = agent.serviceAreas[0] ?? listings.find((l) => l.city)?.city ?? 'Kenya';
  const quotes = data.content?.testimonials ?? [];
  const story = useAutoplay(quotes.length, 7000);
  const buyers = stepsFor(data, 'BUYERS').slice(0, 3);
  const sellers = stepsFor(data, 'SELLERS').slice(0, 3);

  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const yA = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80]);
  const yB = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 60]);
  const yC = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -140]);

  const theme: SiteTheme = { ink: INK, muted: MUTED, accent, card: '#fffaf3', line: 'rgba(42,36,32,0.12)', radius: 24, display: DISPLAY, weight: 600 };
  const h2 = (eyebrow: string, children: ReactNode) => (
    <Reveal>
      <p className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>{eyebrow}</p>
      <h2 className="mt-3 text-[34px] leading-[1.08] tracking-tight sm:text-[48px]" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>{children}</h2>
    </Reveal>
  );

  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),

    stats: stats.length ? (
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 text-center sm:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <p className="text-[52px] leading-none tracking-tight" style={{ fontFamily: DISPLAY, fontWeight: 600, color: i === 1 ? accent : INK }}>
                <CountUp value={s.v} decimals={s.d ?? 0} suffix={s.s} />
              </p>
              <p className="mt-2 text-[14px]" style={{ color: MUTED }}>{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>
    ) : null,

    about: (
      <section id="about" className="scroll-mt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 md:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="relative mx-auto w-full max-w-sm">
            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full" style={{ background: MUSTARD }} />
            <div className="relative aspect-[3/4] overflow-hidden rounded-t-full" style={{ background: '#eadfce' }}>
              <Img src={agent.photoUrl ?? agent.logoUrl ?? hero} alt={agent.displayName} className="h-full w-full object-cover" />
            </div>
          </Reveal>
          <div>
            {h2('A little about me', <>{agent.kind === 'COMPANY' ? `We’re ${agent.displayName}.` : `Hi, I’m ${agent.displayName.split(' ')[0]}.`}</>)}
            {agent.bio && <Reveal delay={0.1}><p className="mt-6 whitespace-pre-line text-[17px] leading-relaxed" style={{ color: '#4a3f37' }}>{agent.bio}</p></Reveal>}
            <Reveal delay={0.15}>
              <a href="#contact" className="group mt-8 inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-[15px] font-medium text-white" style={{ background: INK }}>
                Let’s talk
                <span className="flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:rotate-45" style={{ background: accent }}><Icon d={ICON.arrowUpRight} size={15} /></span>
              </a>
            </Reveal>
          </div>
        </div>
      </section>
    ),

    listings: (
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {h2('Listings', <>Homes I’d love to show you</>)}
          {f.tabs.length > 1 && (
            <div className="flex gap-2">
              {f.tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                  className="cursor-pointer rounded-full border px-4 py-2 text-[13px] font-medium"
                  style={f.tab === t.key ? { background: INK, borderColor: INK, color: '#fff' } : { borderColor: 'rgba(42,36,32,0.2)' }}>{t.label}</button>
              ))}
            </div>
          )}
        </div>
        <ListingTools f={search} theme={theme} />
        {shown.length === 0 ? (
          <p className="mt-10 text-[15px]" style={{ color: MUTED }}>{search.active ? 'No homes match these filters.' : 'New homes are coming soon. Get in touch to hear first.'}</p>
        ) : (
          <Stagger className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((l) => (
              <a key={l.id} href={l.href} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px]" style={{ background: '#eadfce' }}>
                  <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                  <SaveHeart listing={l} className="absolute bottom-4 right-4" />
                  <span className="absolute bottom-4 left-4 rounded-full px-3 py-1 text-[12px] font-medium text-white" style={{ background: accent }}>{statusLabel(l)}</span>
                </div>
                <h3 className="mt-5 text-[20px] leading-snug" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>{l.name}</h3>
                <p className="mt-1 text-[14px]" style={{ color: MUTED }}>{placeLabel(l) || 'Kenya'}</p>
                <p className="mt-2 text-[15.5px] font-medium">{priceLabel(l)}</p>
              </a>
            ))}
          </Stagger>
        )}
      </section>
    ),

    process: (
      <section id="process" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          {h2('Buy & sell', <>Help with your next move</>)}
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[{ title: 'For buyers', steps: buyers, bg: '#fffaf3', fg: INK, dot: accent }, { title: 'For sellers', steps: sellers, bg: accent, fg: '#fff', dot: MUSTARD }].map((col, ci) => (
              <Reveal key={col.title} delay={ci * 0.1}>
                <div className="flex h-full flex-col rounded-[28px] p-7 sm:p-9" style={{ background: col.bg, color: col.fg }}>
                  <p className="text-[26px]" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>{col.title}</p>
                  <ol className="mt-6 space-y-5">
                    {col.steps.map((s, i) => (
                      <li key={s.id} className="flex gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold" style={{ background: col.dot, color: '#fff' }}>{i + 1}</span>
                        <span>
                          <span className="block text-[16.5px] font-medium">{s.title}</span>
                          {s.description && <span className="mt-0.5 block text-[14.5px] leading-relaxed" style={{ opacity: 0.75 }}>{s.description}</span>}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <button type="button" onClick={() => kit?.open({ kind: 'contact' })} className="mt-auto self-start pt-8 text-[15px] font-medium underline underline-offset-4">
                    {ci === 0 ? 'Start your search' : 'Get a valuation'}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    ),

    ...(quotes.length ? {
      testimonials: (
        <section id="testimonials" className="scroll-mt-24">
          <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>Client stories</p>
            <div className="relative mt-8 min-h-[260px] text-center">
              <AnimatePresence mode="wait">
                <motion.figure key={story.index} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5, ease: EASE }}>
                  <blockquote className="mx-auto max-w-3xl text-[26px] leading-[1.35] tracking-tight sm:text-[36px]" style={{ fontFamily: DISPLAY, fontWeight: 500 }}>
                    “{quotes[story.index]?.quote}”
                  </blockquote>
                  <figcaption className="mt-6 text-[15px]">
                    <span className="font-medium">{quotes[story.index]?.author}</span>
                    {quotes[story.index]?.context && <span style={{ color: MUTED }}> · {quotes[story.index].context}</span>}
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>
            {quotes.length > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button type="button" onClick={story.prev} aria-label="Previous story" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border" style={{ borderColor: 'rgba(42,36,32,0.2)' }}><Icon d={ICON.prev} size={16} /></button>
                <span className="w-16 text-center text-[14px] tabular-nums" style={{ color: MUTED }}>{String(story.index + 1).padStart(2, '0')} / {String(quotes.length).padStart(2, '0')}</span>
                <button type="button" onClick={story.next} aria-label="Next story" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border" style={{ borderColor: 'rgba(42,36,32,0.2)' }}><Icon d={ICON.next} size={16} /></button>
                <button type="button" onClick={story.toggle} aria-label={story.playing ? 'Pause stories' : 'Play stories'} className="ml-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white" style={{ background: INK }}>
                  <Icon d={story.playing ? ICON.pause : ICON.play} size={14} />
                </button>
              </div>
            )}
          </div>
        </section>
      ),
    } : {}),

    areas: areas.length ? (
      <section id="areas" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        {h2('Neighbourhoods', <>Where I work</>)}
        <div className="mt-8 flex flex-wrap gap-3">
          {areas.map((a, i) => (
            <Reveal key={a.name} delay={Math.min(i, 8) * 0.04}>
              <span className="inline-flex items-center gap-2.5 rounded-full bg-[#fffaf3] px-5 py-3 text-[15px]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: i % 2 ? MUSTARD : accent }} />{a.name}
                {a.count > 0 && <span style={{ color: MUTED }}>{a.count}</span>}
              </span>
            </Reveal>
          ))}
        </div>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="scroll-mt-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-24 sm:px-6 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            {h2('Contact', <>Let’s find your place.</>)}
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed" style={{ color: MUTED }}>Tell me a little about what you’re looking for and I’ll be in touch within a day.</p>
              <div className="mt-8 space-y-3 text-[15px]">
                {agent.phone && <a href={`tel:${agent.phone}`} className="flex items-center gap-3 hover:opacity-70"><Icon d={ICON.phone} size={17} /> {agent.phone}</a>}
                {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-70"><Icon d={ICON.chat} size={17} /> WhatsApp</a>}
                {agent.email && <a href={`mailto:${agent.email}`} className="flex items-center gap-3 hover:opacity-70"><Icon d={ICON.mail} size={17} /> {agent.email}</a>}
                {agent.officeAddress && <p className="flex items-center gap-3"><Icon d={ICON.pin} size={17} /> {agent.officeAddress}</p>}
              </div>
              {kit?.forms.viewing && (
                <button type="button" onClick={() => kit.open({ kind: 'viewing' })} className="mt-8 cursor-pointer text-[15px] font-medium underline underline-offset-4" style={{ color: accent }}>
                  Or book a viewing time
                </button>
              )}
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="rounded-[28px] bg-[#fffaf3] p-6 sm:p-8">
              {kit?.forms.contact ? <ContactForm theme={theme} /> : (
                <p className="text-[15px]" style={{ color: MUTED }}>Call or WhatsApp — I reply the same day.</p>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, ['--accent' as string]: accent }}>
      <header className="fixed inset-x-0 top-4 z-40 px-4">
        <nav className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full bg-[#fffaf3]/95 px-3 py-2 shadow-[0_6px_24px_rgba(42,36,32,0.08)] backdrop-blur">
          <a href="#top" className="truncate pl-3 text-[16px]" style={{ fontFamily: DISPLAY, fontWeight: 700 }}>{agent.displayName}</a>
          <div className="hidden items-center gap-6 text-[14px] sm:flex" style={{ color: MUTED }}>
            {nav.slice(0, 4).map((n) => <a key={n.href} href={n.href} className="hover:text-black">{n.label}</a>)}
          </div>
          <a href="#contact" className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium text-white" style={{ background: accent }}>
            Let’s talk <Icon d={ICON.arrowUpRight} size={14} />
          </a>
        </nav>
      </header>

      <section id="top" ref={heroRef} className="relative overflow-hidden px-4 pt-32 sm:px-6 sm:pt-40">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: MUTED }}>{agent.displayName} / {city}</p>
          <h1 className="mt-5 text-[44px] leading-[1.02] tracking-tight sm:text-[76px]" style={{ fontFamily: DISPLAY, fontWeight: 700 }}>
            {agent.siteTagline ?? 'Home starts with the right guide.'}
          </h1>
          {firstSentence(agent.bio) && <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed" style={{ color: MUTED }}>{firstSentence(agent.bio)}</p>}
          <a href="#listings" className="mt-8 inline-flex rounded-full px-7 py-3.5 text-[15px] font-medium text-white" style={{ background: INK }}>See my listings</a>
        </Reveal>
        <div className="relative mx-auto mt-16 max-w-4xl">
          <motion.div style={{ y: yA }} className="absolute -left-6 bottom-6 hidden w-44 sm:block md:-left-24 md:w-56"><Arches color={accent} className="w-full" /></motion.div>
          <motion.div style={{ y: yB, background: accent }} className="absolute -right-4 bottom-0 hidden h-48 w-28 rounded-t-full sm:block md:-right-16 md:h-64 md:w-36" />
          <motion.div style={{ y: yC, background: MUSTARD }} className="absolute -top-8 right-[18%] h-20 w-20 rounded-full sm:h-28 sm:w-28" />
          <Reveal delay={0.15} className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-t-full sm:aspect-[5/6]">
            {hero ? <Img src={hero} className="h-full w-full object-cover" eager /> : <div className="h-full w-full" style={{ background: '#eadfce' }} />}
          </Reveal>
        </div>
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="border-t" style={{ borderColor: 'rgba(42,36,32,0.12)' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-[13px] sm:px-6" style={{ color: MUTED }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, color: INK }}>{agent.displayName}</span>
          <span>© {new Date().getFullYear()} · <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a></span>
          <LegalLine data={data} color={MUTED} />
        </div>
      </footer>
      <SiteKitLayer theme={theme} />
    </div>
  );
}
