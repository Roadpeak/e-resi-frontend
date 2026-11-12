'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { formatPrice } from '../../lib/utils';
import type {
  AgentSiteData, AgentSiteRental, Award, Faq, PastSale, PostSummary, Service, SiteSectionId, Step, TeamMember, Testimonial,
} from './types';
import { bedsLabel, FURNISHING, Icon, ICON, Img, rentLabel } from './shared';
import { EASE, Marquee, motion, Reveal, Stagger } from './motion';
import { CareersSection, NewsletterSection, ValuationSection } from './kit';
import { CalculatorSection, CasesSection, GuidesSection, PackagesSection } from './guides';

/**
 * Content sections every template draws — team, testimonials, past sales,
 * FAQ, services, process, awards, journal — styled by the template's theme
 * so one implementation looks native in each design.
 */

export interface SiteTheme {
  ink: string;
  muted: string;
  accent: string;
  /** Card / panel background. */
  card: string;
  /** Hairline colour. */
  line: string;
  /** Display font for headings (CSS font-family), or undefined for the body font. */
  display?: string;
  /** Corner radius for cards and images, in px. */
  radius: number;
  /** How eyebrow labels read: "uppercase" (default) or "slash" ("/ LABEL"). */
  eyebrow?: 'uppercase' | 'slash';
  /** Max content width class. */
  width?: string;
  /** Heading weight. */
  weight?: number;
}

const DEAL: Record<string, string> = { BUYER: 'Buyer', SELLER: 'Seller', TENANT: 'Tenant', LANDLORD: 'Landlord', INVESTOR: 'Investor' };

export function monthLabel(m?: string) {
  if (!m) return '';
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, (mo || 1) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function postHref(agentId: string, slug: string) {
  return `/site/agent/${agentId}/journal/${slug}`;
}

function Wrap({ id, theme, children, className = '' }: { id: string; theme: SiteTheme; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div className={`mx-auto ${theme.width ?? 'max-w-6xl'} px-4 py-20 sm:px-6`}>{children}</div>
    </section>
  );
}

export function SectionHead({ theme, eyebrow, title, intro, center = false }: {
  theme: SiteTheme; eyebrow: string; title: string; intro?: string; center?: boolean;
}) {
  return (
    <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.eyebrow === 'slash' ? theme.muted : theme.accent }}>
        {theme.eyebrow === 'slash' ? `/ ${eyebrow}` : eyebrow}
      </p>
      <h2 className="mt-3 text-[32px] leading-[1.08] tracking-tight sm:text-[44px]"
        style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500, color: theme.ink }}>{title}</h2>
      {intro && <p className="mt-4 text-[16px] leading-relaxed" style={{ color: theme.muted }}>{intro}</p>}
    </Reveal>
  );
}

function Stars({ n, color }: { n: number; color: string }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= Math.round(n) ? color : 'none'} stroke={color} strokeWidth="1.5" aria-hidden>
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
        </svg>
      ))}
    </span>
  );
}

// ─── Team ───────────────────────────────────────────────────────────────

export function TeamSection({ items, theme }: { items: TeamMember[]; theme: SiteTheme }) {
  if (!items.length) return null;
  return (
    <Wrap id="team" theme={theme}>
      <SectionHead theme={theme} eyebrow="Our team" title="The people behind every move" />
      <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <article key={m.id} className="group overflow-hidden" style={{ background: theme.card, borderRadius: theme.radius }}>
            <div className="aspect-[4/5] overflow-hidden" style={{ borderRadius: theme.radius ? `${theme.radius}px ${theme.radius}px 0 0` : 0 }}>
              <Img src={m.photoUrl ?? null} alt={m.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            </div>
            <div className="p-5">
              <h3 className="text-[19px]" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500, color: theme.ink }}>{m.name}</h3>
              {m.role && <p className="mt-0.5 text-[14px]" style={{ color: theme.muted }}>{m.role}</p>}
              {(m.years || m.sales) ? (
                <p className="mt-3 flex gap-4 text-[13px]" style={{ color: theme.ink }}>
                  {m.years ? <span><strong>{m.years}+</strong> yrs</span> : null}
                  {m.sales ? <span><strong>{m.sales}</strong> deals</span> : null}
                </p>
              ) : null}
              {m.bio && <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed" style={{ color: theme.muted }}>{m.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {m.phone && <a href={`tel:${m.phone}`} aria-label={`Call ${m.name}`} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: theme.line, color: theme.ink }}><Icon d={ICON.phone} size={15} /></a>}
                {m.email && <a href={`mailto:${m.email}`} aria-label={`Email ${m.name}`} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: theme.line, color: theme.ink }}><Icon d={ICON.mail} size={15} /></a>}
                {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer" className="flex h-9 items-center rounded-full border px-3 text-[12px] font-medium" style={{ borderColor: theme.line, color: theme.ink }}>LinkedIn</a>}
              </div>
            </div>
          </article>
        ))}
      </Stagger>
    </Wrap>
  );
}

// ─── Testimonials ───────────────────────────────────────────────────────

function Quote({ t, theme, fixed }: { t: Testimonial; theme: SiteTheme; fixed?: boolean }) {
  return (
    <figure className={`flex flex-col p-6 ${fixed ? 'w-[320px] shrink-0 sm:w-[380px]' : ''}`} style={{ background: theme.card, borderRadius: theme.radius }}>
      {t.rating ? <Stars n={t.rating} color={theme.accent} /> : null}
      <blockquote className="mt-4 flex-1 text-[16px] leading-relaxed" style={{ color: theme.ink, fontFamily: theme.display }}>“{t.quote}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t pt-4" style={{ borderColor: theme.line }}>
        {t.photoUrl
          ? <Img src={t.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          : <span className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold text-white" style={{ background: theme.accent }}>{t.author.charAt(0)}</span>}
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium" style={{ color: theme.ink }}>{t.author}</span>
          <span className="block truncate text-[12.5px]" style={{ color: theme.muted }}>
            {[t.dealType && DEAL[t.dealType], t.context, monthLabel(t.date)].filter(Boolean).join(' · ')}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialsSection({ items, theme, data }: { items: Testimonial[]; theme: SiteTheme; data: AgentSiteData }) {
  if (!items.length) return null;
  const { ratingAverage, ratingCount } = data.agent;
  const rows = items.length >= 6 ? [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)] : null;
  return (
    <section id="testimonials" className="scroll-mt-24 overflow-hidden py-20">
      <div className={`mx-auto ${theme.width ?? 'max-w-6xl'} px-4 sm:px-6`}>
        <SectionHead theme={theme} eyebrow="Client stories" title="What people say once the keys change hands" center />
        {ratingCount > 0 && ratingAverage != null && (
          <Reveal className="mt-6 flex justify-center">
            <span className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-[14px]" style={{ borderColor: theme.line, color: theme.ink }}>
              <Stars n={ratingAverage} color={theme.accent} /> {ratingAverage.toFixed(1)} from {ratingCount} review{ratingCount === 1 ? '' : 's'}
            </span>
          </Reveal>
        )}
      </div>
      {rows ? (
        <div className="mt-12 space-y-5">
          <Marquee speed={60}>{rows[0].map((t) => <Quote key={t.id} t={t} theme={theme} fixed />)}</Marquee>
          <Marquee speed={70} reverse>{rows[1].map((t) => <Quote key={t.id} t={t} theme={theme} fixed />)}</Marquee>
        </div>
      ) : (
        <Stagger className={`mx-auto mt-12 grid ${theme.width ?? 'max-w-6xl'} gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3`}>
          {items.map((t) => <Quote key={t.id} t={t} theme={theme} />)}
        </Stagger>
      )}
    </section>
  );
}

// ─── Past sales ─────────────────────────────────────────────────────────

export function SoldSection({ items, theme }: { items: PastSale[]; theme: SiteTheme }) {
  if (!items.length) return null;
  const sold = items.filter((s) => s.outcome === 'SOLD').length;
  const let_ = items.length - sold;
  return (
    <Wrap id="sold" theme={theme}>
      <SectionHead theme={theme} eyebrow="Track record" title="Recently sold and let"
        intro={[sold && `${sold} sold`, let_ && `${let_} let`].filter(Boolean).join(' · ') + ' — a selection of homes we have closed for clients.'} />
      <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <article key={s.id} className="overflow-hidden" style={{ background: theme.card, borderRadius: theme.radius }}>
            <div className="relative aspect-[4/3] overflow-hidden">
              <Img src={s.imageUrl ?? null} alt={s.title} className="h-full w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white" style={{ background: s.outcome === 'SOLD' ? theme.ink : theme.accent }}>
                {s.outcome === 'SOLD' ? 'Sold' : 'Let'}
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[17px]" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500, color: theme.ink }}>{s.title}</h3>
                {s.price ? <span className="shrink-0 text-[15px] font-medium" style={{ color: theme.ink }}>{formatPrice(s.price, s.currency ?? 'KES')}</span> : null}
              </div>
              <p className="mt-1 text-[13.5px]" style={{ color: theme.muted }}>{[s.location, monthLabel(s.date)].filter(Boolean).join(' · ')}</p>
              {s.note && <p className="mt-3 text-[14px] leading-relaxed" style={{ color: theme.muted }}>{s.note}</p>}
            </div>
          </article>
        ))}
      </Stagger>
    </Wrap>
  );
}

// ─── Homes to rent ───────────────────────────────────────────────────────

/**
 * The agent's rentals, drawn by every template. Separate from the sale
 * listings because the questions differ: monthly rent, furnishing,
 * bedrooms and when it is free, not price-from and construction status.
 */
export function RentalsSection({ items, theme }: { items: AgentSiteRental[]; theme: SiteTheme }) {
  const [city, setCity] = useState('');
  const [furnishing, setFurnishing] = useState('');
  const [beds, setBeds] = useState('');
  const [budget, setBudget] = useState('');
  const cities = useMemo(() => [...new Set(items.map((r) => r.city).filter(Boolean) as string[])].sort(), [items]);
  const furnishings = useMemo(() => [...new Set(items.map((r) => r.furnishing))], [items]);
  const bedOptions = useMemo(() => {
    const set = new Set<number>();
    for (const r of items) if (r.bedroomsFrom != null) for (let b = r.bedroomsFrom; b <= (r.bedroomsTo ?? r.bedroomsFrom); b++) set.add(b);
    return [...set].sort((a, b) => a - b);
  }, [items]);
  const budgets = [
    { key: '0-50000', label: 'Under 50K' }, { key: '50000-100000', label: '50K – 100K' },
    { key: '100000-200000', label: '100K – 200K' }, { key: '200000-', label: '200K+' },
  ].filter((b) => {
    const [lo, hi] = b.key.split('-').map((n) => (n === '' ? Infinity : Number(n)));
    return items.some((r) => r.priceFrom != null && r.priceFrom >= lo && r.priceFrom < hi);
  });
  if (!items.length) return null;
  const shown = items.filter((r) => {
    if (city && r.city !== city) return false;
    if (furnishing && r.furnishing !== furnishing) return false;
    if (beds !== '') {
      const b = Number(beds);
      if (r.bedroomsFrom == null || b < r.bedroomsFrom || b > (r.bedroomsTo ?? r.bedroomsFrom)) return false;
    }
    if (budget) {
      const [lo, hi] = budget.split('-').map((n) => (n === '' ? Infinity : Number(n)));
      if (r.priceFrom == null || r.priceFrom < lo || r.priceFrom >= hi) return false;
    }
    return true;
  });
  const active = !!(city || furnishing || beds !== '' || budget);
  const units = items.reduce((n, r) => n + r.units, 0);
  const select = 'rounded-full border px-4 py-2 text-[13px] outline-none';
  const selectStyle = { borderColor: theme.line, background: theme.card, color: theme.ink };
  const available = (r: AgentSiteRental) => {
    if (r.status === 'PARTIALLY_AVAILABLE' && r.units) return `${r.units} left`;
    if (r.availableFrom && new Date(r.availableFrom) > new Date()) {
      return `From ${new Date(r.availableFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    }
    return 'Available now';
  };

  return (
    <Wrap id="rentals" theme={theme}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead theme={theme} eyebrow="To rent" title="Homes to rent"
          intro={`${items.length} ${items.length === 1 ? 'home' : 'homes'} available to let${units > items.length ? `, ${units} units open` : ''}. Viewings in person or by live guided tour.`} />
        {(cities.length > 1 || furnishings.length > 1 || bedOptions.length > 1 || budgets.length > 1) && (
          <div className="flex flex-wrap gap-2">
            {cities.length > 1 && (
              <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Area" className={select} style={selectStyle}>
                <option value="">Anywhere</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {bedOptions.length > 1 && (
              <select value={beds} onChange={(e) => setBeds(e.target.value)} aria-label="Bedrooms" className={select} style={selectStyle}>
                <option value="">Any bedrooms</option>
                {bedOptions.map((b) => <option key={b} value={b}>{b === 0 ? 'Studio' : `${b} bed`}</option>)}
              </select>
            )}
            {furnishings.length > 1 && (
              <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} aria-label="Furnishing" className={select} style={selectStyle}>
                <option value="">Any furnishing</option>
                {furnishings.map((f) => <option key={f} value={f}>{FURNISHING[f] ?? f}</option>)}
              </select>
            )}
            {budgets.length > 1 && (
              <select value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Monthly budget" className={select} style={selectStyle}>
                <option value="">Any rent</option>
                {budgets.map((b) => <option key={b.key} value={b.key}>{b.label} / month</option>)}
              </select>
            )}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 p-10 text-center text-[15px]" style={{ background: theme.card, borderRadius: theme.radius, color: theme.muted }}>
          {active ? 'No homes match these filters.' : 'New rentals are on the way. Get in touch to hear about them first.'}
        </p>
      ) : (
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <a key={r.id} href={r.href} className="group block overflow-hidden transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
              style={{ background: theme.card, borderRadius: theme.radius }}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Img src={r.heroImageUrl} alt={r.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white" style={{ background: theme.accent }}>
                  To rent
                </span>
                {(r.has3DTour || r.hasCinematicTour) && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-black">
                    <Icon d={ICON.cube} size={12} /> Tour
                  </span>
                )}
                <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[11.5px] font-medium text-black">{available(r)}</span>
              </div>
              <div className="p-5">
                <h3 className="text-[17px] leading-snug" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500, color: theme.ink }}>{r.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-[13.5px]" style={{ color: theme.muted }}>
                  <Icon d={ICON.pin} size={13} /> {[r.neighborhood, r.city].filter(Boolean).join(', ') || 'Kenya'}
                </p>
                <p className="mt-2 text-[13px]" style={{ color: theme.muted }}>
                  {[bedsLabel(r), FURNISHING[r.furnishing] ?? null, r.minLeaseTerm ? `${r.minLeaseTerm}-month min` : null].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: theme.line }}>
                  <span className="text-[15.5px] font-medium" style={{ color: theme.ink }}>{rentLabel(r)}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full transition-colors group-hover:text-white" style={{ background: `${theme.accent}1a`, color: theme.ink }}>
                    <Icon d={ICON.arrowUpRight} size={15} />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </Stagger>
      )}
    </Wrap>
  );
}

// ─── FAQ ────────────────────────────────────────────────────────────────

export function FaqSection({ items, theme }: { items: Faq[]; theme: SiteTheme }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  if (!items.length) return null;
  return (
    <Wrap id="faq" theme={theme}>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHead theme={theme} eyebrow="Questions" title="Good questions, clear answers" intro="If yours isn’t here, ask — every move is different." />
        <ul className="space-y-3">
          {items.map((f) => {
            const isOpen = open === f.id;
            return (
              <li key={f.id} className="overflow-hidden" style={{ background: theme.card, borderRadius: Math.min(theme.radius, 20) }}>
                <button type="button" onClick={() => setOpen(isOpen ? null : f.id)} aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="text-[16px] font-medium" style={{ color: theme.ink }}>{f.question}</span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[18px] leading-none" style={{ borderColor: theme.line, color: theme.ink }}>+</motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                      <p className="whitespace-pre-line px-5 pb-5 text-[15px] leading-relaxed" style={{ color: theme.muted }}>{f.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </Wrap>
  );
}

// ─── Services ───────────────────────────────────────────────────────────

export function ServicesSection({ items, theme }: { items: Service[]; theme: SiteTheme }) {
  if (!items.length) return null;
  return (
    <Wrap id="services" theme={theme}>
      <SectionHead theme={theme} eyebrow="Services" title="Expert help, from first viewing to keys" />
      <Stagger className={`mt-12 grid gap-5 ${items.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {items.map((s, i) => (
          <article key={s.id} className="flex h-full flex-col overflow-hidden" style={{ background: theme.card, borderRadius: theme.radius }}>
            {s.imageUrl && <div className="aspect-[16/10] overflow-hidden"><Img src={s.imageUrl} alt="" className="h-full w-full object-cover" /></div>}
            <div className="flex flex-1 flex-col p-6">
              <span className="text-[13px] tabular-nums" style={{ color: theme.accent }}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-[21px]" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500, color: theme.ink }}>{s.title}</h3>
              {s.description && <p className="mt-3 text-[15px] leading-relaxed" style={{ color: theme.muted }}>{s.description}</p>}
              {!!s.points?.length && (
                <ul className="mt-5 space-y-2 border-t pt-5" style={{ borderColor: theme.line }}>
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[14px]" style={{ color: theme.ink }}>
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />{p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </Stagger>
    </Wrap>
  );
}

// ─── Process ────────────────────────────────────────────────────────────

export function ProcessSection({ items, theme }: { items: Step[]; theme: SiteTheme }) {
  const buyers = items.filter((s) => s.audience === 'BUYERS');
  const sellers = items.filter((s) => s.audience === 'SELLERS');
  const general = items.filter((s) => !s.audience || s.audience === 'ALL');
  const split = buyers.length > 0 && sellers.length > 0;
  const [side, setSide] = useState<'BUYERS' | 'SELLERS'>('BUYERS');
  if (!items.length) return null;
  const steps = split ? [...general, ...(side === 'BUYERS' ? buyers : sellers)] : items;
  return (
    <Wrap id="process" theme={theme}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead theme={theme} eyebrow="How it works" title="From first conversation to the final keys" />
        {split && (
          <div className="flex rounded-full border p-1" style={{ borderColor: theme.line }}>
            {(['BUYERS', 'SELLERS'] as const).map((k) => (
              <button key={k} type="button" onClick={() => setSide(k)} aria-pressed={side === k}
                className="cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium"
                style={side === k ? { background: theme.ink, color: '#fff' } : { color: theme.ink }}>
                For {k === 'BUYERS' ? 'buyers' : 'sellers'}
              </button>
            ))}
          </div>
        )}
      </div>
      <ol className={`mt-12 grid gap-px overflow-hidden sm:grid-cols-2 ${steps.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
        style={{ background: theme.line, borderRadius: theme.radius }}>
        {steps.map((s, i) => (
          <motion.li key={`${side}-${s.id}`} className="p-6" style={{ background: theme.card }}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}>
            <span className="text-[34px] leading-none" style={{ fontFamily: theme.display, color: theme.accent }}>{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-5 text-[18px]" style={{ fontWeight: theme.weight ?? 500, color: theme.ink }}>{s.title}</h3>
            {s.description && <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: theme.muted }}>{s.description}</p>}
          </motion.li>
        ))}
      </ol>
    </Wrap>
  );
}

// ─── Awards ─────────────────────────────────────────────────────────────

export function AwardsSection({ items, theme }: { items: Award[]; theme: SiteTheme }) {
  if (!items.length) return null;
  return (
    <section id="awards" className="scroll-mt-24 border-y py-10" style={{ borderColor: theme.line }}>
      <div className={`mx-auto flex ${theme.width ?? 'max-w-6xl'} flex-wrap items-center justify-center gap-x-10 gap-y-5 px-4 sm:px-6`}>
        {items.map((a) => (
          <Reveal key={a.id} blur={false} y={10} className="flex items-center gap-3">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.4" aria-hidden>
              <circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8" />
            </svg>
            <span>
              <span className="block text-[14px] font-medium" style={{ color: theme.ink }}>{a.title}</span>
              <span className="block text-[12.5px]" style={{ color: theme.muted }}>{[a.issuer, a.year].filter(Boolean).join(' · ')}</span>
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── Journal ────────────────────────────────────────────────────────────

export function JournalSection({ items, theme, agentId }: { items: PostSummary[]; theme: SiteTheme; agentId: string }) {
  if (!items.length) return null;
  const [lead, ...rest] = items.slice(0, 4);
  return (
    <Wrap id="journal" theme={theme}>
      <SectionHead theme={theme} eyebrow="Journal" title="Notes on buying, selling and the market" />
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <a href={postHref(agentId, lead.slug)} className="group block overflow-hidden" style={{ background: theme.card, borderRadius: theme.radius }}>
            <div className="aspect-[16/10] overflow-hidden"><Img src={lead.coverUrl ?? null} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div>
            <div className="p-6">
              <p className="text-[12.5px]" style={{ color: theme.muted }}>{[lead.category, monthLabel(lead.publishedAt), `${lead.readMinutes} min read`].filter(Boolean).join(' · ')}</p>
              <h3 className="mt-2 text-[24px] leading-snug" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500, color: theme.ink }}>{lead.title}</h3>
              {lead.excerpt && <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed" style={{ color: theme.muted }}>{lead.excerpt}</p>}
            </div>
          </a>
        </Reveal>
        <div className="space-y-4">
          {rest.map((p, i) => (
            <Reveal key={p.id} delay={0.08 * (i + 1)}>
              <a href={postHref(agentId, p.slug)} className="group flex items-center justify-between gap-4 p-5" style={{ background: theme.card, borderRadius: Math.min(theme.radius, 20) }}>
                <span>
                  <span className="block text-[12.5px]" style={{ color: theme.muted }}>{[p.category, monthLabel(p.publishedAt), `${p.readMinutes} min`].filter(Boolean).join(' · ')}</span>
                  <span className="mt-1 block text-[17px] leading-snug" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500, color: theme.ink }}>{p.title}</span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-transform group-hover:translate-x-1" style={{ borderColor: theme.line, color: theme.ink }}>
                  <Icon d={ICON.arrow} size={15} />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </Wrap>
  );
}

/** Licence number and footer note, for every template's footer. */
export function LegalLine({ data, color }: { data: AgentSiteData; color: string }) {
  const l = data.legal;
  if (!l?.licenceNo && !l?.footerNote) return null;
  return (
    <div className="w-full space-y-1 text-[12px] leading-relaxed" style={{ color }}>
      {l.licenceNo && <p>{l.licenceNo}</p>}
      {l.footerNote && <p>{l.footerNote}</p>}
    </div>
  );
}

/** The content blocks for a template, given its theme. */
export function contentBlocks(data: AgentSiteData, theme: SiteTheme): Partial<Record<SiteSectionId, ReactNode>> {
  const c = data.content;
  const forms: Partial<Record<SiteSectionId, ReactNode>> = {
    valuation: (
      <ValuationSection theme={theme} eyebrow={
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.eyebrow === 'slash' ? theme.muted : theme.accent }}>
          {theme.eyebrow === 'slash' ? '/ Free valuation' : 'Free valuation'}
        </p>
      } />
    ),
    newsletter: <NewsletterSection theme={theme} />,
    rentals: <RentalsSection items={data.rentals ?? []} theme={theme} />,
    careers: (
      <CareersSection theme={theme} roles={c?.roles ?? []}
        head={<SectionHead theme={theme} eyebrow="Careers" title="Join the team" intro="We’re growing. If you love property and people, we’d like to hear from you." />} />
    ),
    calculator: (
      <CalculatorSection theme={theme} data={data}
        head={<SectionHead theme={theme} eyebrow="Mortgage calculator" title="What would it cost each month?" intro="Move the sliders to see an estimate. Tap a listing to use its price." />} />
    ),
  };
  if (!c) return forms;
  return {
    ...forms,
    guides: (
      <GuidesSection items={c.guides ?? []} theme={theme} data={data}
        head={<SectionHead theme={theme} eyebrow="Area guides" title="Know the neighbourhood" intro="What it’s like to live there, what homes cost, and what’s nearby." />} />
    ),
    cases: <CasesSection items={c.cases ?? []} theme={theme} head={<SectionHead theme={theme} eyebrow="Case studies" title="How we got it done" />} />,
    packages: (
      <PackagesSection items={c.packages ?? []} theme={theme}
        head={<SectionHead theme={theme} eyebrow="For landlords" title="Letting and management" intro="Choose how much you want handled. No surprises on fees." />} />
    ),
    services: <ServicesSection items={c.services} theme={theme} />,
    process: <ProcessSection items={c.steps} theme={theme} />,
    team: <TeamSection items={c.team} theme={theme} />,
    sold: <SoldSection items={c.sold} theme={theme} />,
    testimonials: <TestimonialsSection items={c.testimonials} theme={theme} data={data} />,
    awards: <AwardsSection items={c.awards} theme={theme} />,
    journal: <JournalSection items={c.posts} theme={theme} agentId={data.agent.id} />,
    faq: <FaqSection items={c.faqs} theme={theme} />,
  };
}

export const ALL_SECTIONS: readonly SiteSectionId[] = [
  'stats', 'listings', 'rentals', 'services', 'packages', 'process', 'valuation', 'calculator', 'about', 'team', 'sold', 'cases',
  'testimonials', 'areas', 'guides', 'awards', 'journal', 'careers', 'faq', 'newsletter', 'contact',
];
