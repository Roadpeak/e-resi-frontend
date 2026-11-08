'use client';

import type { ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';
import { LeadButtons, ListingTools, SaveHeart, SiteKitLayer, useListingSearch, useSiteKit } from '../kit';
import type { AgentSiteData, SiteSectionId, Testimonial } from '../types';
import {
  areasOf, CATEGORY, hasTour, heroImage, Icon, ICON, Img, orderedSections, placeLabel, priceLabel, statusLabel,
  useListingFilter, waLink,
} from '../shared';
import { CountUp, motion, Reveal, Stagger } from '../motion';
import { statsFor } from '../base';

/**
 * NEST — app-like and friendly. A bento hero (dark promo card, a big photo,
 * reviews scrolling upward, number cards), listing cards like a booking app,
 * and a floating tab bar at the bottom of the screen.
 */

const INK = '#111111';
const MUTED = '#6b6b70';
const SOFT = '#f5f5f7';
const SUPPORTED = ALL_SECTIONS;

const I = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.4-4.4',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
};

function ReviewTicker({ items }: { items: Testimonial[] }) {
  const reduce = useReducedMotion();
  const list = items.slice(0, 8);
  const card = (t: Testimonial, k: string) => (
    <div key={k} className="rounded-2xl bg-white p-4">
      <div className="flex gap-0.5 text-[#f5a524]">{[1, 2, 3, 4, 5].map((i) => <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= (t.rating ?? 5) ? 'currentColor' : 'none'} stroke="currentColor" aria-hidden><path d={I.star} /></svg>)}</div>
      <p className="mt-2 line-clamp-4 text-[13.5px] leading-relaxed">“{t.quote}”</p>
      <p className="mt-2 text-[12.5px] font-semibold">{t.author}</p>
    </div>
  );
  if (reduce || list.length < 3) return <div className="space-y-3">{list.slice(0, 3).map((t) => card(t, t.id))}</div>;
  return (
    <div className="h-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
      <motion.div className="space-y-3" animate={{ y: ['0%', '-50%'] }} transition={{ duration: list.length * 5, ease: 'linear', repeat: Infinity }}>
        {list.map((t) => card(t, `a${t.id}`))}
        {list.map((t) => card(t, `b${t.id}`))}
      </motion.div>
    </div>
  );
}

export function NestTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#6d4aff';
  const order = orderedSections(data, SUPPORTED);
  const hero = heroImage(data);
  const kit = useSiteKit();
  const f = useListingFilter(listings);
  const search = useListingSearch(listings);
  const shown = search.apply(f.shown);
  const areas = areasOf(data);
  const stats = statsFor(data, 2);
  const reviews = data.content?.testimonials ?? [];
  const theme: SiteTheme = { ink: INK, muted: MUTED, accent, card: SOFT, line: 'rgba(0,0,0,0.08)', radius: 24 };
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),
    stats: null,

    listings: (
      <section id="listings" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] p-7 text-white sm:p-10" style={{ background: INK }}>
          <p className="relative text-[13px] text-white/60">{listings.length} {listings.length === 1 ? 'home' : 'homes'} available</p>
          <h2 className="relative mt-1 text-[30px] font-semibold tracking-tight sm:text-[40px]">Find your stay, for good.</h2>
          {f.tabs.length > 1 && (
            <div className="relative mt-5 flex flex-wrap gap-2">
              {f.tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                  className="cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium"
                  style={f.tab === t.key ? { background: '#fff', color: INK } : { background: 'rgba(255,255,255,0.1)' }}>{t.label}</button>
              ))}
            </div>
          )}
        </div>
        <ListingTools f={search} theme={theme} />
        {shown.length === 0 ? (
          <p className="mt-8 rounded-3xl p-10 text-center text-[15px]" style={{ background: SOFT, color: MUTED }}>{search.active ? 'No homes match these filters.' : 'New homes are on the way.'}</p>
        ) : (
          <Stagger className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((l) => (
              <a key={l.id} href={l.href} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-[24px]">
                  <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  {hasTour(l) && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[12px] font-semibold" style={{ color: INK }}>Agent’s pick · 3D tour</span>}
                  <SaveHeart listing={l} className="absolute right-3 top-3" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15.5px] font-semibold">{l.name}</p>
                    <p className="truncate text-[14px]" style={{ color: MUTED }}>{placeLabel(l) || 'Kenya'}</p>
                    <p className="text-[14px]" style={{ color: MUTED }}>{[statusLabel(l), CATEGORY[l.category]].filter(Boolean).join(' · ')}</p>
                  </div>
                  {agent.ratingAverage && <span className="flex shrink-0 items-center gap-1 text-[13.5px]"><Icon d={I.star} size={13} />{agent.ratingAverage.toFixed(1)}</span>}
                </div>
                <p className="mt-1.5 text-[15.5px]"><span className="font-semibold">{priceLabel(l)}</span></p>
              </a>
            ))}
          </Stagger>
        )}
      </section>
    ),

    about: agent.bio ? (
      <section id="about" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-12 sm:px-6">
        <div className="grid gap-8 rounded-[28px] p-6 sm:p-10 md:grid-cols-[auto_1fr] md:items-center" style={{ background: SOFT }}>
          <Img src={agent.photoUrl ?? agent.logoUrl} alt={agent.displayName} className="h-28 w-28 rounded-full object-cover" />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: accent }}>Meet your {agent.kind === 'COMPANY' ? 'team' : 'host'}</p>
            <h2 className="mt-1 text-[26px] font-semibold tracking-tight">{agent.displayName}</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-[15.5px] leading-relaxed" style={{ color: '#3d3d42' }}>{agent.bio}</p>
          </div>
        </div>
      </section>
    ) : null,

    areas: areas.length ? (
      <section id="areas" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-12 sm:px-6">
        <h2 className="text-[24px] font-semibold tracking-tight">Popular areas</h2>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
          {areas.map((a) => {
            const pic = listings.find((l) => (l.neighborhood === a.name || l.city === a.name) && l.heroImageUrl)?.heroImageUrl ?? null;
            return (
              <button key={a.name} type="button" onClick={() => { search.setQ(a.name); go('listings'); }}
                className="flex shrink-0 cursor-pointer items-center gap-3 rounded-2xl p-2 pr-5 text-left" style={{ background: SOFT }}>
                <Img src={pic} className="h-14 w-14 rounded-xl object-cover" />
                <span><span className="block text-[15px] font-semibold">{a.name}</span><span className="text-[12.5px]" style={{ color: MUTED }}>{a.count} listing{a.count === 1 ? '' : 's'}</span></span>
              </button>
            );
          })}
        </div>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-16 sm:px-6">
        <div className="grid gap-6 rounded-[28px] p-8 text-white sm:p-12 md:grid-cols-[1.2fr_1fr] md:items-center" style={{ background: accent }}>
          <div>
            <h2 className="text-[32px] font-semibold leading-tight tracking-tight sm:text-[44px]">Ready when you are.</h2>
            <p className="mt-3 text-[15.5px] text-white/80">Message, call or book a time to view. Replies the same day.</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[14.5px] text-white/90">
              {agent.phone && <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-2"><Icon d={ICON.phone} size={15} /> {agent.phone}</a>}
              {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2"><Icon d={ICON.chat} size={15} /> WhatsApp</a>}
            </div>
          </div>
          <LeadButtons theme={{ ...theme, accent: INK }} tone="dark" />
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen bg-white pb-28" style={{ color: INK, ['--accent' as string]: accent }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Img src={agent.photoUrl ?? agent.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" eager />
          <div className="min-w-0">
            <p className="text-[13px]" style={{ color: MUTED }}>Hi there</p>
            <p className="truncate text-[16px] font-semibold">{agent.displayName}</p>
          </div>
        </div>
        {kit && (kit.forms.viewing || kit.forms.contact) && (
          <button type="button" onClick={() => kit.open(kit.forms.viewing ? { kind: 'viewing' } : { kind: 'contact' })}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-semibold text-white" style={{ background: INK }}>
            <Icon d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" size={15} />
            {kit.forms.viewing ? 'Book a viewing' : 'Send a message'}
          </button>
        )}
      </header>

      <section id="top" className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="grid gap-3 md:h-[560px] md:grid-cols-[1fr_1.6fr_0.9fr] md:grid-rows-2">
          <Reveal className="md:row-span-1">
            <div className="flex h-full flex-col justify-between rounded-[28px] p-7 text-white" style={{ background: INK }}>
              <div>
                <p className="text-[13px] text-white/60">{agent.serviceAreas[0] ?? 'Your next home'}</p>
                <h1 className="mt-2 text-[30px] font-semibold leading-[1.08] tracking-tight sm:text-[36px]">{agent.siteTagline ?? 'Homes that feel right from day one.'}</h1>
              </div>
              <button type="button" onClick={() => go('listings')} className="mt-6 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold" style={{ color: INK }}>
                Explore homes <Icon d={ICON.arrow} size={15} />
              </button>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="md:row-span-2">
            <div className="relative h-72 overflow-hidden rounded-[28px] md:h-full">
              {hero ? <Img src={hero} className="h-full w-full object-cover" eager /> : <div className="h-full w-full" style={{ background: SOFT }} />}
            </div>
          </Reveal>
          <Reveal delay={0.16} className="hidden md:row-span-2 md:block">
            <div className="h-full rounded-[28px] p-3" style={{ background: SOFT }}>
              {reviews.length ? <ReviewTicker items={reviews} /> : (
                <div className="flex h-full flex-col justify-end p-4">
                  <p className="text-[22px] font-semibold leading-snug">Viewings in person or by live guided tour.</p>
                  <p className="mt-2 text-[14px]" style={{ color: MUTED }}>Pick a time that suits you.</p>
                </div>
              )}
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-3">
            {(stats.length ? stats : [{ v: listings.length, s: '', label: 'Homes listed' }]).map((s, i) => (
              <Reveal key={s.label} delay={0.2 + i * 0.06}>
                <div className="flex h-full flex-col justify-between rounded-[28px] p-5" style={{ background: i === 0 ? accent : SOFT, color: i === 0 ? '#fff' : INK }}>
                  <p className="text-[32px] font-semibold leading-none tracking-tight"><CountUp value={s.v} decimals={s.d ?? 0} suffix={s.s} /></p>
                  <p className="mt-3 text-[13px]" style={{ opacity: 0.75 }}>{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.07] pt-6 text-[13px]" style={{ color: MUTED }}>
          <span>© {new Date().getFullYear()} {agent.displayName}</span>
          <a href="https://e-resi.com" className="hover:text-black">Powered by e-resi</a>
          <LegalLine data={data} color={MUTED} />
        </div>
      </footer>

      {/* Floating tab bar */}
      <nav className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full p-1.5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)]" style={{ background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)' }}>
        <a href="#top" className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-semibold" style={{ color: INK }}><Icon d={I.home} size={17} /> <span className="hidden sm:inline">Home</span></a>
        <button type="button" onClick={() => kit?.open({ kind: 'saved' })} aria-label="Saved homes" className="relative flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[13.5px] hover:bg-white/10">
          <Icon d={I.heart} size={17} /><span className="hidden sm:inline">Saved</span>
          {!!kit?.saved.length && <span className="rounded-full px-1.5 text-[11px] font-bold" style={{ background: accent }}>{kit.saved.length}</span>}
        </button>
        <button type="button" onClick={() => go('listings')} aria-label="Search" className="flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[13.5px] hover:bg-white/10"><Icon d={I.search} size={17} /><span className="hidden sm:inline">Search</span></button>
        <button type="button" onClick={() => (kit?.forms.contact ? kit.open({ kind: 'contact' }) : go('contact'))} className="flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold" style={{ background: accent }}>
          <Icon d={ICON.chat} size={17} /> <span className="hidden sm:inline">Contact</span>
        </button>
      </nav>
      <SiteKitLayer theme={theme} hideDock chatClassName="bottom-24 right-4 lg:bottom-5 lg:right-5" />
    </div>
  );
}
