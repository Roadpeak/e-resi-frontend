'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ALL_SECTIONS, contentBlocks, LegalLine, type SiteTheme } from '../sections';
import { LeadButtons, ListingTools, SaveHeart, SiteKitLayer, useListingSearch, useSiteKit } from '../kit';
import type { AgentSiteData, SiteSectionId } from '../types';
import {
  areasOf, CATEGORY, hasTour, heroImage, Icon, ICON, Img, orderedSections, placeLabel, priceLabel, statusLabel,
  useListingFilter, waLink,
} from '../shared';
import { CountUp, EASE, KenBurns, motion, Reveal, Stagger, WordReveal } from '../motion';
import { navFor, statsFor, useScrolled } from '../base';

/**
 * CREST — crisp and confident for a small brokerage. A floating bar with a
 * slide-in menu, a hero built on one featured development with its key
 * facts, a statement that fills in on scroll, numbered category cards and
 * tagged listings.
 */

const INK = '#0f1724';
const MUTED = '#5b6475';
const SOFT = '#f3f5f9';
const SUPPORTED = ALL_SECTIONS;

export function CrestTemplate({ data }: { data: AgentSiteData }) {
  const { agent, listings } = data;
  const accent = agent.siteAccent ?? '#1f4fd8';
  const order = orderedSections(data, SUPPORTED);
  const kit = useSiteKit();
  const f = useListingFilter(listings);
  const search = useListingSearch(listings);
  const shown = search.apply(f.shown);
  const areas = areasOf(data);
  const stats = statsFor(data, 4);
  const nav = navFor(data, order, { listings: 'Properties' });
  const scrolled = useScrolled(40);
  const [menu, setMenu] = useState(false);
  const featured = listings.find((l) => l.heroImageUrl) ?? listings[0];
  const hero = featured?.heroImageUrl ?? heroImage(data);
  const area = agent.serviceAreas[0] ?? featured?.city ?? 'Kenya';
  const cats = [...new Set(listings.map((l) => l.category))]
    .map((c) => ({ key: c, label: CATEGORY[c] ?? c, img: listings.find((l) => l.category === c && l.heroImageUrl)?.heroImageUrl ?? null, n: listings.filter((l) => l.category === c).length }))
    .slice(0, 4);

  useEffect(() => {
    if (!menu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [menu]);

  const theme: SiteTheme = { ink: INK, muted: MUTED, accent, card: SOFT, line: 'rgba(15,23,36,0.1)', radius: 14 };
  const eyebrow = (t: string) => <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: accent }}>{t}</p>;
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const blocks: Partial<Record<SiteSectionId, ReactNode>> = {
    ...contentBlocks(data, theme),

    about: (
      <section id="about" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          {eyebrow(agent.kind === 'COMPANY' ? 'About us' : 'About')}
          <WordReveal
            text={agent.bio ? agent.bio.split(/(?<=[.!?])\s/).slice(0, 2).join(' ') : `${agent.displayName} helps buyers and investors find the right home in ${area}, with honest advice from first viewing to keys.`}
            className="mt-5 max-w-4xl text-[28px] font-semibold leading-[1.3] tracking-tight sm:text-[40px]" />
          <div className="mt-12 grid items-end gap-8 md:grid-cols-[1fr_1.1fr]">
            <Reveal className="overflow-hidden rounded-[14px]">
              <Img src={agent.photoUrl ?? agent.logoUrl ?? hero} alt={agent.displayName} className="aspect-[4/3] w-full object-cover" />
            </Reveal>
            {stats.length > 0 && (
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px]" style={{ background: 'rgba(15,23,36,0.1)' }}>
                {stats.map((s) => (
                  <Reveal key={s.label} className="bg-white p-6">
                    <p className="text-[44px] font-semibold leading-none tracking-tight" style={{ color: INK }}><CountUp value={s.v} decimals={s.d ?? 0} suffix={s.s} /></p>
                    <p className="mt-2 text-[14px]" style={{ color: MUTED }}>{s.label}</p>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    ),

    stats: null,

    listings: (
      <section id="listings" className="scroll-mt-24" style={{ background: SOFT }}>
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          {cats.length > 1 && (
            <div className="mb-20">
              {eyebrow('Browse by category')}
              <h2 className="mt-3 text-[34px] font-semibold tracking-tight sm:text-[44px]">What are you looking for?</h2>
              <div className="-mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
                {cats.map((c, i) => (
                  <button key={c.key} type="button" onClick={() => { search.setCategory(c.key); go('listing-grid'); }}
                    className="group relative aspect-[3/4] w-[70vw] shrink-0 cursor-pointer snap-start overflow-hidden rounded-[14px] text-left sm:w-auto">
                    <Img src={c.img} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
                    <span className="absolute left-5 top-4 text-[40px] font-semibold leading-none text-white/90">{i + 1}</span>
                    <span className="absolute inset-x-5 bottom-5 flex items-end justify-between text-white">
                      <span><span className="block text-[20px] font-semibold">{c.label}</span><span className="text-[13px] text-white/75">{c.n} listing{c.n === 1 ? '' : 's'}</span></span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:-rotate-45"><Icon d={ICON.arrow} size={16} /></span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div id="listing-grid" className="scroll-mt-24 flex flex-wrap items-end justify-between gap-4">
            <div>
              {eyebrow('Featured listings')}
              <h2 className="mt-3 text-[34px] font-semibold tracking-tight sm:text-[44px]">Available now</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {f.tabs.length > 1 && f.tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => f.setTab(t.key)} aria-pressed={f.tab === t.key}
                  className="cursor-pointer rounded-lg border px-4 py-2 text-[13.5px] font-medium"
                  style={f.tab === t.key ? { background: INK, color: '#fff', borderColor: INK } : { background: '#fff', borderColor: 'rgba(15,23,36,0.12)' }}>{t.label}</button>
              ))}
            </div>
          </div>
          <ListingTools f={search} theme={theme} />
          {shown.length === 0 ? (
            <p className="mt-10 rounded-[14px] bg-white p-10 text-center text-[15px]" style={{ color: MUTED }}>{search.active ? 'No homes match these filters.' : 'New listings are on the way.'}</p>
          ) : (
            <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((l, i) => {
                const tags = [statusLabel(l), hasTour(l) && '3D tour', i < 2 && 'New', l.units > 20 && 'Many units'].filter(Boolean) as string[];
                return (
                  <a key={l.id} href={l.href} className="group block overflow-hidden rounded-[14px] bg-white transition-shadow hover:shadow-[0_14px_40px_rgba(15,23,36,0.1)]">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        {tags.slice(0, 2).map((t, j) => (
                          <span key={t} className="rounded-md px-2 py-1 text-[11.5px] font-semibold" style={j === 0 ? { background: accent, color: '#fff' } : { background: '#fff', color: INK }}>{t}</span>
                        ))}
                      </div>
                      <SaveHeart listing={l} className="absolute right-3 top-3" />
                    </div>
                    <div className="p-5">
                      <p className="text-[12.5px] font-medium uppercase tracking-[0.08em]" style={{ color: MUTED }}>{CATEGORY[l.category] ?? 'Development'}</p>
                      <h3 className="mt-1 text-[19px] font-semibold leading-snug">{l.name}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-[14px]" style={{ color: MUTED }}><Icon d={ICON.pin} size={13} /> {placeLabel(l) || 'Kenya'}</p>
                      <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: 'rgba(15,23,36,0.08)' }}>
                        <span className="text-[17px] font-semibold" style={{ color: accent }}>{priceLabel(l)}</span>
                        {l.units > 0 && <span className="text-[13px]" style={{ color: MUTED }}>{l.units} units</span>}
                      </div>
                    </div>
                  </a>
                );
              })}
            </Stagger>
          )}
        </div>
      </section>
    ),

    areas: areas.length ? (
      <section id="areas" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        {eyebrow('Areas we cover')}
        <ul className="mt-8 grid gap-x-10 border-t sm:grid-cols-2" style={{ borderColor: 'rgba(15,23,36,0.1)' }}>
          {areas.map((a) => (
            <li key={a.name} className="flex items-center justify-between border-b py-4 text-[17px]" style={{ borderColor: 'rgba(15,23,36,0.1)' }}>
              <span className="font-medium">{a.name}</span>
              <span className="text-[14px]" style={{ color: MUTED }}>{a.count ? `${a.count} listing${a.count === 1 ? '' : 's'}` : '—'}</span>
            </li>
          ))}
        </ul>
      </section>
    ) : null,

    contact: (
      <section id="contact" className="scroll-mt-24" style={{ background: accent }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 text-white sm:px-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-[36px] font-semibold leading-[1.08] tracking-tight sm:text-[52px]">Book a consultation</h2>
            <p className="mt-4 max-w-md text-[16px] text-white/80">Tell us what you’re looking for. We’ll come back with options, prices and a time to view.</p>
          </div>
          <div className="space-y-5">
            <LeadButtons theme={{ ...theme, accent: INK }} tone="dark" />
            <div className="space-y-2 text-[15px] text-white/85">
              {agent.phone && <a href={`tel:${agent.phone}`} className="flex items-center gap-2.5 hover:text-white"><Icon d={ICON.phone} size={16} /> {agent.phone}</a>}
              {agent.whatsapp && <a href={waLink(agent.whatsapp)} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-white"><Icon d={ICON.chat} size={16} /> WhatsApp</a>}
              {agent.email && <a href={`mailto:${agent.email}`} className="flex items-center gap-2.5 hover:text-white"><Icon d={ICON.mail} size={16} /> {agent.email}</a>}
            </div>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen bg-white" style={{ color: INK, ['--accent' as string]: accent }}>
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className={`mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-xl bg-white px-4 transition-shadow ${scrolled ? 'shadow-[0_8px_30px_rgba(15,23,36,0.1)]' : 'shadow-[0_2px_10px_rgba(15,23,36,0.06)]'}`}>
          <a href="#top" className="flex min-w-0 items-center gap-2.5">
            {agent.logoUrl ? <Img src={agent.logoUrl} alt="" className="h-8 w-8 rounded-md object-cover" eager />
              : <span className="flex h-8 w-8 items-center justify-center rounded-md text-[14px] font-bold text-white" style={{ background: accent }}>{agent.displayName.charAt(0)}</span>}
            <span className="truncate text-[16px] font-semibold tracking-tight">{agent.displayName}</span>
          </a>
          <div className="flex items-center gap-4">
            {agent.phone && <a href={`tel:${agent.phone}`} className="hidden items-center gap-2 text-[14px] font-medium md:flex"><Icon d={ICON.phone} size={15} /> {agent.phone}</a>}
            <button type="button" onClick={() => setMenu(true)} className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-medium text-white" style={{ background: INK }}>
              Menu <Icon d={ICON.menu} size={16} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="absolute inset-0 cursor-default bg-black/40" />
            <motion.aside role="dialog" aria-label="Menu" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white p-6 sm:p-8"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.45, ease: EASE }}>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">{agent.displayName}</span>
                <button type="button" onClick={() => setMenu(false)} aria-label="Close" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full hover:bg-black/5"><Icon d={ICON.close} size={20} /></button>
              </div>
              <nav className="mt-10 border-t" style={{ borderColor: 'rgba(15,23,36,0.1)' }}>
                {[...nav, { href: '#contact', label: 'Contact' }].map((n, i) => (
                  <motion.a key={n.href} href={n.href} onClick={() => setMenu(false)}
                    initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: EASE }}
                    className="group flex items-center justify-between border-b py-5 text-[28px] font-semibold tracking-tight" style={{ borderColor: 'rgba(15,23,36,0.1)' }}>
                    {n.label}
                    <span className="transition-transform group-hover:translate-x-1" style={{ color: accent }}><Icon d={ICON.arrow} size={22} /></span>
                  </motion.a>
                ))}
              </nav>
              <div className="mt-auto space-y-4 pt-8">
                {kit?.forms.contact && (
                  <button type="button" onClick={() => { setMenu(false); kit.open({ kind: 'contact' }); }}
                    className="w-full cursor-pointer rounded-lg py-3.5 text-[15px] font-medium text-white" style={{ background: accent }}>Book a consultation</button>
                )}
                <div className="space-y-1 text-[14px]" style={{ color: MUTED }}>
                  {agent.phone && <p>{agent.phone}</p>}
                  {agent.email && <p>{agent.email}</p>}
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <section id="top" className="relative flex min-h-[88vh] items-end overflow-hidden text-white">
        {hero ? <KenBurns src={hero} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: INK }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 pb-10 pt-32 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <Reveal>
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-white/75">{agent.kind === 'COMPANY' ? 'Agency' : 'Agent'} in {area}</p>
            <h1 className="mt-4 text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-[72px]">{featured ? featured.name : agent.siteTagline ?? agent.displayName}</h1>
            <p className="mt-4 max-w-lg text-[16px] text-white/80">{featured?.tagline ?? agent.siteTagline ?? 'Homes chosen with care, and advice you can rely on.'}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact" className="rounded-lg px-6 py-3 text-[15px] font-medium text-white" style={{ background: accent }}>Contact us</a>
              {featured && <a href={featured.href} className="rounded-lg bg-white px-6 py-3 text-[15px] font-medium" style={{ color: INK }}>View property</a>}
            </div>
          </Reveal>
          {featured && (
            <Reveal delay={0.2} className="grid grid-cols-2 overflow-hidden rounded-xl bg-white text-[14px]" >
              {[
                { k: 'Type', v: CATEGORY[featured.category] ?? 'Development' },
                { k: 'Location', v: placeLabel(featured) || 'Kenya' },
                { k: 'Units', v: featured.units ? String(featured.units) : '—' },
                { k: 'Price', v: priceLabel(featured) },
              ].map((x, i) => (
                <div key={x.k} className={`p-4 ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t' : ''}`} style={{ borderColor: 'rgba(15,23,36,0.08)', color: INK }}>
                  <p className="text-[12px] uppercase tracking-[0.1em]" style={{ color: MUTED }}>{x.k}</p>
                  <p className="mt-1 truncate font-semibold">{x.v}</p>
                </div>
              ))}
            </Reveal>
          )}
        </div>
      </section>

      {order.map((id) => <div key={id}>{blocks[id]}</div>)}

      <footer style={{ background: INK }} className="text-white/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="text-[18px] font-semibold text-white">{agent.displayName}</p>
              {agent.officeAddress && <p className="mt-2 max-w-xs text-[14px]">{agent.officeAddress}</p>}
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[14px]">
              {nav.map((n) => <a key={n.href} href={n.href} className="hover:text-white">{n.label}</a>)}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[13px]">
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
