'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { formatPrice } from '../../lib/utils';
import type { AgentSiteData, AgentSiteListing, AreaGuideSummary, CaseStudy, Package } from './types';
import type { SiteTheme } from './sections';
import { Icon, ICON, Img } from './shared';
import { EASE, motion, Reveal, Stagger } from './motion';
import { useSiteKit } from './kit';

/**
 * Phase-4 sections every template draws through contentBlocks: area guides
 * (each with its own page), case studies, landlord packages and a mortgage
 * calculator. Styled from the template's theme like the other content.
 */

export const areaHref = (agentId: string, slug: string) => `/site/agent/${agentId}/areas/${slug}`;

/** Listings a guide covers: its match text (or name) in the listing's area or city. */
export function listingsIn(listings: AgentSiteListing[], g: { name: string; match?: string }) {
  const needle = (g.match || g.name).trim().toLowerCase();
  if (!needle) return [];
  return listings.filter((l) => [l.neighborhood, l.city].some((v) => v?.toLowerCase().includes(needle)));
}

const money = (n?: number) => (n ? formatPrice(n, 'KES') : null);
const r = (theme: SiteTheme, max = 24) => Math.min(theme.radius, max);

function Shell({ id, theme, children }: { id: string; theme: SiteTheme; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className={`mx-auto ${theme.width ?? 'max-w-6xl'} px-4 py-20 sm:px-6`}>{children}</div>
    </section>
  );
}

// ─── Area guides ────────────────────────────────────────────────────────────

export function GuidesSection({ items, theme, data, head }: { items: AreaGuideSummary[]; theme: SiteTheme; data: AgentSiteData; head: ReactNode }) {
  if (!items.length) return null;
  return (
    <Shell id="guides" theme={theme}>
      {head}
      <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => {
          const count = listingsIn(data.listings, g).length;
          const body = (
            <>
              <div className="relative aspect-[4/3] overflow-hidden" style={{ borderRadius: r(theme) }}>
                <Img src={g.coverUrl ?? null} alt={g.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-[24px] leading-tight" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500 }}>{g.name}</p>
                  {g.tagline && <p className="mt-1 text-[13.5px] text-white/80">{g.tagline}</p>}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[13.5px]" style={{ color: theme.muted }}>
                <span>{[g.priceFrom && `Homes from ${money(g.priceFrom)}`, count ? `${count} listing${count === 1 ? '' : 's'}` : null].filter(Boolean).join(' · ') || g.summary?.slice(0, 60)}</span>
                {g.hasPage && <Icon d={ICON.arrowUpRight} size={16} className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
              </div>
            </>
          );
          return g.hasPage
            ? <a key={g.id} href={areaHref(data.agent.id, g.slug)} className="group block">{body}</a>
            : <div key={g.id} className="group">{body}</div>;
        })}
      </Stagger>
    </Shell>
  );
}

// ─── Case studies ───────────────────────────────────────────────────────────

const CLIENT: Record<string, string> = { BUYER: 'Buyer', SELLER: 'Seller', TENANT: 'Tenant', LANDLORD: 'Landlord', INVESTOR: 'Investor', DEVELOPER: 'Developer' };

export function CasesSection({ items, theme, head }: { items: CaseStudy[]; theme: SiteTheme; head: ReactNode }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!items.length) return null;
  return (
    <Shell id="cases" theme={theme}>
      {head}
      <div className="mt-10 space-y-5">
        {items.map((c, i) => {
          const isOpen = open === c.id;
          return (
            <Reveal key={c.id} delay={Math.min(i, 4) * 0.05}>
              <article className="overflow-hidden" style={{ background: theme.card, borderRadius: r(theme, 28) }}>
                <div className={`grid gap-0 ${c.coverUrl ? 'md:grid-cols-[0.9fr_1.1fr]' : ''}`}>
                  {c.coverUrl && <Img src={c.coverUrl} alt="" className="h-full min-h-[220px] w-full object-cover" />}
                  <div className="p-6 sm:p-8">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: theme.accent }}>
                      {[c.clientType && CLIENT[c.clientType], c.location].filter(Boolean).join(' · ') || 'Case study'}
                    </p>
                    <h3 className="mt-2 text-[24px] leading-snug sm:text-[28px]" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500, color: theme.ink }}>{c.title}</h3>
                    {!!c.metrics?.length && (
                      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                        {c.metrics.map((m) => {
                          const [v, ...rest] = m.split(/\s+/);
                          return (
                            <div key={m}>
                              <p className="text-[26px] leading-none tabular-nums" style={{ fontFamily: theme.display, color: theme.ink }}>{v}</p>
                              <p className="mt-1 text-[12.5px]" style={{ color: theme.muted }}>{rest.join(' ')}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {c.result && <p className="mt-5 text-[15px] leading-relaxed" style={{ color: theme.muted }}>{c.result}</p>}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                          <div className="space-y-4 pt-5 text-[15px] leading-relaxed" style={{ color: theme.ink }}>
                            {c.challenge && <div><p className="text-[12.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.muted }}>The brief</p><p className="mt-1 whitespace-pre-line">{c.challenge}</p></div>}
                            {c.approach && <div><p className="text-[12.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.muted }}>What we did</p><p className="mt-1 whitespace-pre-line">{c.approach}</p></div>}
                            {c.quote && <blockquote className="border-l-2 pl-4 italic" style={{ borderColor: theme.accent }}>“{c.quote}”</blockquote>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {(c.challenge || c.approach || c.quote) && (
                      <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen}
                        className="mt-5 inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium" style={{ color: theme.ink }}>
                        {isOpen ? 'Show less' : 'Read the story'}
                        <Icon d={ICON.next} size={15} className={`transition-transform ${isOpen ? '-rotate-90' : 'rotate-90'}`} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Shell>
  );
}

// ─── Landlord packages ──────────────────────────────────────────────────────

export function PackagesSection({ items, theme, head }: { items: Package[]; theme: SiteTheme; head: ReactNode }) {
  const kit = useSiteKit();
  if (!items.length) return null;
  const cols = items.length >= 3 ? 'lg:grid-cols-3' : items.length === 2 ? 'md:grid-cols-2' : '';
  return (
    <Shell id="packages" theme={theme}>
      {head}
      <Stagger className={`mt-10 grid gap-5 ${cols}`}>
        {items.map((p) => {
          const hot = p.featured === 'YES';
          return (
            <div key={p.id} className="flex h-full flex-col p-7"
              style={{
                borderRadius: r(theme, 28), background: hot ? theme.ink : theme.card, color: hot ? '#fff' : theme.ink,
                border: hot ? 'none' : `1px solid ${theme.line}`,
              }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[18px] font-medium" style={{ fontFamily: theme.display }}>{p.name}</p>
                {hot && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ background: theme.accent, color: '#fff' }}>Most chosen</span>}
              </div>
              <p className="mt-5 text-[38px] leading-none tracking-tight" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500 }}>{p.fee}</p>
              {p.feeNote && <p className="mt-1.5 text-[13px]" style={{ opacity: 0.65 }}>{p.feeNote}</p>}
              {p.description && <p className="mt-4 text-[14.5px] leading-relaxed" style={{ opacity: 0.8 }}>{p.description}</p>}
              {!!p.points?.length && (
                <ul className="mt-5 space-y-2.5 text-[14.5px]">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-2.5">
                      <Icon d="M5 12.5l4.5 4.5L19 7.5" size={16} className="mt-0.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto pt-7">
                {kit?.forms.contact ? (
                  <button type="button" onClick={() => kit.open({ kind: 'contact' })}
                    className="w-full cursor-pointer py-3 text-[14.5px] font-medium transition-opacity hover:opacity-90"
                    style={{
                      borderRadius: theme.radius >= 16 ? 999 : Math.min(theme.radius, 12),
                      background: hot ? theme.accent : 'transparent', color: hot ? '#fff' : theme.ink, border: hot ? 'none' : `1px solid ${theme.line}`,
                    }}>
                    Talk about {p.name}
                  </button>
                ) : (
                  <a href="#contact" className="block w-full py-3 text-center text-[14.5px] font-medium underline underline-offset-4">Get in touch</a>
                )}
              </div>
            </div>
          );
        })}
      </Stagger>
    </Shell>
  );
}

// ─── Mortgage calculator ────────────────────────────────────────────────────

function monthly(principal: number, ratePct: number, years: number) {
  const n = years * 12;
  const r = ratePct / 100 / 12;
  if (principal <= 0 || n <= 0) return 0;
  return r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
}

function Slider({ label, value, display, min, max, step, onChange, theme }: {
  label: string; value: number; display: string; min: number; max: number; step: number; onChange: (n: number) => void; theme: SiteTheme;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-[13.5px]">
        <span style={{ color: theme.muted }}>{label}</span>
        <span className="font-medium tabular-nums" style={{ color: theme.ink }}>{display}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full cursor-pointer" style={{ accentColor: theme.accent }} />
    </label>
  );
}

export function CalculatorSection({ theme, data, head }: { theme: SiteTheme; data: AgentSiteData; head: ReactNode }) {
  const f = data.forms;
  const priced = useMemo(() => data.listings.filter((l) => l.priceFrom).sort((a, b) => a.priceFrom! - b.priceFrom!), [data.listings]);
  const start = priced.length ? priced[Math.floor(priced.length / 2)].priceFrom! : 15_000_000;
  const [price, setPrice] = useState(Math.round(start / 100_000) * 100_000);
  const [deposit, setDeposit] = useState(f?.depositPct ?? 20);
  const [rate, setRate] = useState(f?.mortgageRate ?? 13);
  const [years, setYears] = useState(f?.termYears ?? 20);
  const kit = useSiteKit();
  if (!f?.calculator) return null;

  const loan = price * (1 - deposit / 100);
  const pay = monthly(loan, rate, years);
  const total = pay * years * 12;
  const interest = Math.max(0, total - loan);
  const max = Math.max(200_000_000, Math.ceil((priced.at(-1)?.priceFrom ?? 0) / 10_000_000) * 10_000_000);
  const fmt = (n: number) => formatPrice(Math.round(n), 'KES');
  const share = loan > 0 ? Math.min(100, (loan / total) * 100) : 0;
  const affordable = priced.filter((l) => l.priceFrom! <= price).length;

  return (
    <Shell id="calculator" theme={theme}>
      {head}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 p-6 sm:p-8" style={{ background: theme.card, borderRadius: r(theme, 28) }}>
          <Slider theme={theme} label="Home price" value={price} display={fmt(price)} min={1_000_000} max={max} step={100_000} onChange={setPrice} />
          {priced.length > 0 && (
            <div className="-mt-3 flex flex-wrap gap-1.5">
              {priced.slice(0, 6).map((l) => (
                <button key={l.id} type="button" onClick={() => setPrice(l.priceFrom!)}
                  className="cursor-pointer rounded-full px-3 py-1 text-[12px] transition-colors hover:opacity-80"
                  style={{ border: `1px solid ${theme.line}`, color: theme.ink, background: price === l.priceFrom ? 'rgba(0,0,0,0.06)' : 'transparent' }}>
                  {l.name}
                </button>
              ))}
            </div>
          )}
          <Slider theme={theme} label="Deposit" value={deposit} display={`${deposit}% · ${fmt(price * deposit / 100)}`} min={0} max={80} step={5} onChange={setDeposit} />
          <Slider theme={theme} label="Interest rate" value={rate} display={`${rate.toFixed(1)}% a year`} min={5} max={25} step={0.25} onChange={setRate} />
          <Slider theme={theme} label="Repay over" value={years} display={`${years} years`} min={5} max={30} step={1} onChange={setYears} />
        </div>
        <div className="flex flex-col p-6 sm:p-8" style={{ background: theme.ink, color: '#fff', borderRadius: r(theme, 28) }}>
          <p className="text-[13px] uppercase tracking-[0.14em] text-white/60">Estimated monthly payment</p>
          <p className="mt-3 text-[40px] leading-none tracking-tight tabular-nums sm:text-[52px]" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500 }}>{fmt(pay)}</p>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/15" aria-hidden>
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${share}%`, background: theme.accent }} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-[13.5px]">
            <div><dt className="flex items-center gap-1.5 text-white/60"><span className="h-2 w-2 rounded-full" style={{ background: theme.accent }} />Loan</dt><dd className="mt-1 tabular-nums">{fmt(loan)}</dd></div>
            <div><dt className="flex items-center gap-1.5 text-white/60"><span className="h-2 w-2 rounded-full bg-white/30" />Interest</dt><dd className="mt-1 tabular-nums">{fmt(interest)}</dd></div>
            <div><dt className="text-white/60">Deposit</dt><dd className="mt-1 tabular-nums">{fmt(price * deposit / 100)}</dd></div>
            <div><dt className="text-white/60">Total repaid</dt><dd className="mt-1 tabular-nums">{fmt(total)}</dd></div>
          </dl>
          {priced.length > 0 && (
            <p className="mt-6 text-[13.5px] text-white/70">{affordable} of {priced.length} listed homes start at or below this price.</p>
          )}
          <div className="mt-auto pt-6">
            {kit?.forms.contact && (
              <button type="button" onClick={() => kit.open({ kind: 'contact' })}
                className="w-full cursor-pointer py-3 text-[14.5px] font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: theme.accent, borderRadius: theme.radius >= 16 ? 999 : Math.min(theme.radius, 12) }}>
                Get help with financing
              </button>
            )}
            <p className="mt-3 text-[11.5px] leading-relaxed text-white/50">An estimate only, not a loan offer. Banks set the final rate, fees and terms.</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
