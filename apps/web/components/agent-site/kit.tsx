'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ApiError } from '../../lib/api/client';
import { siteFormsApi, type SiteLeadInput, type SiteLeadType, type ViewingSlots } from '../../lib/api/agent-site';
import type { AgentSiteData, AgentSiteListing, Role, SiteFormsPublic } from './types';
import type { SiteTheme } from './sections';
import { Icon, ICON, Img, placeLabel, priceLabel } from './shared';
import { EASE, motion } from './motion';

/**
 * The interactive layer every template shares: saved homes, and the forms a
 * visitor sends (message, viewing booking, job application). State lives in
 * one provider so a heart on a card and the saved list stay in step; each
 * template renders <SiteKitLayer theme> once to draw the pop-ups in its look.
 */

type Modal =
  | { kind: 'contact'; listingIds?: string[] }
  | { kind: 'viewing'; listing?: AgentSiteListing }
  | { kind: 'apply'; role?: Role }
  | { kind: 'saved' };

interface Kit {
  agentId: string;
  agentName: string;
  preview: boolean;
  forms: SiteFormsPublic;
  listings: AgentSiteListing[];
  saved: string[];
  toggleSave: (id: string) => void;
  modal: Modal | null;
  open: (m: Modal) => void;
  close: () => void;
}

const OFF: SiteFormsPublic = { contact: false, valuation: false, viewing: false, newsletter: false, careers: false, modes: ['IN_PERSON'], slotMinutes: 60 };
const KitContext = createContext<Kit | null>(null);
export const useSiteKit = () => useContext(KitContext);

export function SiteKitProvider({ data, preview = false, children }: { data: AgentSiteData; preview?: boolean; children: ReactNode }) {
  const key = `eresi:saved:${data.agent.id}`;
  const [saved, setSaved] = useState<string[]>([]);
  const [modal, setModal] = useState<Modal | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const ids = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(ids)) setSaved(ids.filter((id) => data.listings.some((l) => l.id === id)));
    } catch { /* storage blocked: saved homes just don't persist */ }
  }, [key, data.listings]);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [key]);

  const value = useMemo<Kit>(() => ({
    agentId: data.agent.id, agentName: data.agent.displayName, preview,
    forms: data.forms ?? OFF, listings: data.listings,
    saved, toggleSave, modal, open: setModal, close: () => setModal(null),
  }), [data, preview, saved, toggleSave, modal]);

  return <KitContext.Provider value={value}>{children}</KitContext.Provider>;
}

// ─── Small pieces templates drop in ─────────────────────────────────────────

const HEART = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z';

/** Heart on a listing card. Sits inside the card's link, so it stops the click. */
export function SaveHeart({ listing, className = '', tone = 'light' }: { listing: AgentSiteListing; className?: string; tone?: 'light' | 'dark' }) {
  const kit = useSiteKit();
  if (!kit) return null;
  const on = kit.saved.includes(listing.id);
  return (
    <button type="button" aria-pressed={on} aria-label={on ? `Remove ${listing.name} from saved` : `Save ${listing.name}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); kit.toggleSave(listing.id); }}
      className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-90 ${tone === 'light' ? 'bg-white/95 text-[#1d1c1a] shadow-sm' : 'bg-black/5 text-current'} ${className}`}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill={on ? '#e0473a' : 'none'} stroke={on ? '#e0473a' : 'currentColor'} strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
        <path d={HEART} />
      </svg>
    </button>
  );
}

/** "Send a message" / "Book a viewing" for a contact block. */
export function LeadButtons({ theme, tone = 'light', center = false }: { theme: SiteTheme; tone?: 'light' | 'dark'; center?: boolean }) {
  const kit = useSiteKit();
  if (!kit || (!kit.forms.contact && !kit.forms.viewing)) return null;
  const r = Math.min(theme.radius, 999);
  const solid = { background: theme.accent, color: '#fff', borderRadius: r >= 16 ? 999 : r };
  const ghost = tone === 'dark'
    ? { border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: r >= 16 ? 999 : r }
    : { border: `1px solid ${theme.line}`, color: theme.ink, borderRadius: r >= 16 ? 999 : r };
  return (
    <div className={`flex flex-wrap gap-3 ${center ? 'justify-center' : ''}`}>
      {kit.forms.contact && (
        <button type="button" onClick={() => kit.open({ kind: 'contact' })} style={solid}
          className="inline-flex cursor-pointer items-center gap-2 px-6 py-3 text-[15px] font-medium transition-opacity hover:opacity-90">
          <Icon d={ICON.mail} size={17} /> Send a message
        </button>
      )}
      {kit.forms.viewing && (
        <button type="button" onClick={() => kit.open({ kind: 'viewing' })} style={ghost}
          className="inline-flex cursor-pointer items-center gap-2 px-6 py-3 text-[15px] font-medium transition-opacity hover:opacity-80">
          <Icon d={CAL} size={17} /> Book a viewing
        </button>
      )}
    </div>
  );
}

const CAL = 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z';
const SEARCH = 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.4-4.4';

/** Search, type, budget and sort above a template's listings. */
export function ListingTools({ f, theme, tone = 'light' }: { f: ListingFilter; theme: SiteTheme; tone?: 'light' | 'dark' }) {
  const kit = useSiteKit();
  if (!f.searchable) return null;
  const r = theme.radius >= 16 ? 999 : theme.radius;
  const box = {
    borderRadius: r, border: `1px solid ${tone === 'dark' ? 'rgba(255,255,255,0.18)' : theme.line}`,
    background: tone === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff', color: tone === 'dark' ? '#fff' : theme.ink,
  };
  const sel = 'h-10 cursor-pointer bg-transparent px-3 text-[13.5px] outline-none';
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <label className="flex h-10 min-w-[200px] flex-1 items-center gap-2 px-3.5 sm:max-w-xs" style={box}>
        <Icon d={SEARCH} size={15} className="opacity-50" />
        <input value={f.q} onChange={(e) => f.setQ(e.target.value)} placeholder="Search by name or area"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50" />
      </label>
      {f.categories.length > 1 && (
        <select value={f.category} onChange={(e) => f.setCategory(e.target.value)} aria-label="Type" className={sel} style={box}>
          <option value="">Any type</option>
          {f.categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      )}
      {f.bands.length > 1 && (
        <select value={f.band} onChange={(e) => f.setBand(e.target.value)} aria-label="Budget" className={sel} style={box}>
          <option value="">Any budget</option>
          {f.bands.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
        </select>
      )}
      <select value={f.sort} onChange={(e) => f.setSort(e.target.value as ListingFilter['sort'])} aria-label="Sort" className={sel} style={box}>
        <option value="new">Newest</option>
        <option value="low">Price: low to high</option>
        <option value="high">Price: high to low</option>
      </select>
      {kit && kit.saved.length > 0 && (
        <button type="button" onClick={() => f.setSavedOnly(!f.savedOnly)} aria-pressed={f.savedOnly}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 px-4 text-[13.5px] font-medium"
          style={f.savedOnly ? { ...box, background: theme.accent, borderColor: theme.accent, color: '#fff' } : box}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={HEART} /></svg>
          Saved {kit.saved.length}
        </button>
      )}
      {f.active && (
        <button type="button" onClick={f.reset} className="h-10 cursor-pointer px-2 text-[13.5px] underline underline-offset-4 opacity-70 hover:opacity-100">
          Clear
        </button>
      )}
    </div>
  );
}

export interface ListingFilter {
  searchable: boolean;
  q: string; setQ: (v: string) => void;
  category: string; setCategory: (v: string) => void; categories: { key: string; label: string }[];
  band: string; setBand: (v: string) => void; bands: { key: string; label: string }[];
  sort: 'new' | 'low' | 'high'; setSort: (v: 'new' | 'low' | 'high') => void;
  savedOnly: boolean; setSavedOnly: (v: boolean) => void;
  active: boolean; reset: () => void;
  apply: (list: AgentSiteListing[]) => AgentSiteListing[];
}

const BANDS = [
  { key: 'u10', label: 'Under 10M', min: 0, max: 10e6 },
  { key: '10-25', label: '10M – 25M', min: 10e6, max: 25e6 },
  { key: '25-50', label: '25M – 50M', min: 25e6, max: 50e6 },
  { key: '50+', label: '50M and above', min: 50e6, max: Infinity },
];

const CATEGORY_LABEL: Record<string, string> = {
  APARTMENT: 'Apartments', VILLA: 'Villas', TOWNHOUSE: 'Townhouses', MIXED_USE: 'Mixed use',
  COMMERCIAL: 'Commercial', LAND: 'Land', PENTHOUSE: 'Penthouses',
};

/** The search / filter state; useListingFilter folds it into `shown`. */
export function useListingSearch(listings: AgentSiteListing[]): ListingFilter {
  const kit = useSiteKit();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [band, setBand] = useState('');
  const [sort, setSort] = useState<'new' | 'low' | 'high'>('new');
  const [savedOnly, setSavedOnly] = useState(false);
  const categories = useMemo(() => [...new Set(listings.map((l) => l.category))].map((key) => ({ key, label: CATEGORY_LABEL[key] ?? key })), [listings]);
  const bands = useMemo(() => BANDS.filter((b) => listings.some((l) => l.priceFrom != null && l.priceFrom >= b.min && l.priceFrom < b.max)), [listings]);
  const saved = kit?.saved ?? [];
  const savedOn = savedOnly && saved.length > 0;
  const apply = (list: AgentSiteListing[]) => {
    const needle = q.trim().toLowerCase();
    const b = BANDS.find((x) => x.key === band);
    const out = list.filter((l) =>
      (!needle || [l.name, l.city, l.neighborhood, l.tagline, l.developerName].some((v) => v?.toLowerCase().includes(needle)))
      && (!category || l.category === category)
      && (!b || (l.priceFrom != null && l.priceFrom >= b.min && l.priceFrom < b.max))
      && (!savedOn || saved.includes(l.id)));
    if (sort === 'new') return out;
    // Listings without a price go last either way.
    return [...out].sort((x, y) => {
      if (x.priceFrom == null) return 1;
      if (y.priceFrom == null) return -1;
      return sort === 'low' ? x.priceFrom - y.priceFrom : y.priceFrom - x.priceFrom;
    });
  };
  return {
    searchable: listings.length >= 4,
    q, setQ, category, setCategory, categories, band, setBand, bands, sort, setSort,
    savedOnly: savedOn, setSavedOnly,
    active: !!(q || category || band || sort !== 'new' || savedOn),
    reset: () => { setQ(''); setCategory(''); setBand(''); setSort('new'); setSavedOnly(false); },
    apply,
  };
}

// ─── Form plumbing ─────────────────────────────────────────────────────────

function useSubmit(type: SiteLeadType) {
  const kit = useSiteKit();
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  async function send(body: Omit<SiteLeadInput, 'type'>) {
    if (!kit) return;
    setError('');
    setState('sending');
    try {
      // The agent's own preview shows the flow without creating a lead.
      if (kit.preview) await new Promise((r) => setTimeout(r, 500));
      else await siteFormsApi.submit(kit.agentId, { ...body, type });
      setState('sent');
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'Could not send. Try again.');
      setState('idle');
    }
  }
  return { state, error, send, preview: !!kit?.preview, reset: () => setState('idle') };
}

function fieldStyle(theme: SiteTheme, dark = false) {
  return {
    borderRadius: Math.min(theme.radius, 14),
    border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : theme.line}`,
    background: dark ? 'rgba(255,255,255,0.06)' : '#fff',
    color: dark ? '#fff' : theme.ink,
  };
}
const inputCls = 'w-full px-3.5 py-3 text-[14.5px] outline-none transition-shadow placeholder:opacity-50 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]';

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-[12.5px] font-medium opacity-70">{label}</span>
      {children}
    </label>
  );
}

/** Text input bound to a key in a form object. */
function useForm<T extends Record<string, string>>(init: T) {
  const [form, setForm] = useState(init);
  const bind = (k: keyof T) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });
  return { form, setForm, bind };
}

/** Bots fill every field; people never see this one. */
function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden value={value} onChange={(e) => onChange(e.target.value)}
      className="absolute -left-[9999px] h-0 w-0 opacity-0" />
  );
}

function Sent({ theme, title, body, preview, onDone }: { theme: SiteTheme; title: string; body: string; preview: boolean; onDone?: () => void }) {
  return (
    <div className="py-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: theme.accent }}>
        <Icon d="M5 12.5l4.5 4.5L19 7.5" size={22} />
      </span>
      <p className="mt-4 text-[20px]" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500 }}>{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[14px] opacity-70">{body}</p>
      {preview && <p className="mx-auto mt-3 max-w-sm text-[12.5px] opacity-60">Preview: nothing was sent. Forms deliver to your Leads once the site is live.</p>}
      {onDone && (
        <button type="button" onClick={onDone} className="mt-5 cursor-pointer text-[14px] font-medium underline underline-offset-4">Close</button>
      )}
    </div>
  );
}

function SubmitButton({ theme, sending, label }: { theme: SiteTheme; sending: boolean; label: string }) {
  return (
    <button type="submit" disabled={sending}
      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: theme.accent, borderRadius: theme.radius >= 16 ? 999 : Math.min(theme.radius, 14) }}>
      {sending ? 'Sending…' : label}
    </button>
  );
}

const INTENTS = [
  { key: 'BUY', label: 'Buy' }, { key: 'RENT', label: 'Rent' }, { key: 'SELL', label: 'Sell' },
  { key: 'LET', label: 'Let out' }, { key: 'INVEST', label: 'Invest' }, { key: 'OTHER', label: 'Something else' },
];
const TIMEFRAMES = [
  { key: 'NOW', label: 'Right away' }, { key: 'THREE_MONTHS', label: 'Within 3 months' },
  { key: 'SIX_MONTHS', label: 'Within 6 months' }, { key: 'LATER', label: 'Just looking' },
];

function Chips({ options, value, onChange, theme, dark }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void; theme: SiteTheme; dark?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.key;
        return (
          <button key={o.key} type="button" aria-pressed={on} onClick={() => onChange(on ? '' : o.key)}
            className="cursor-pointer px-3.5 py-2 text-[13.5px] transition-colors"
            style={{
              borderRadius: theme.radius >= 16 ? 999 : Math.min(theme.radius, 10),
              border: `1px solid ${on ? theme.accent : dark ? 'rgba(255,255,255,0.2)' : theme.line}`,
              background: on ? theme.accent : 'transparent', color: on ? '#fff' : 'inherit',
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Forms ─────────────────────────────────────────────────────────────────

export function ContactForm({ theme, listingIds, onDone }: { theme: SiteTheme; listingIds?: string[]; onDone?: () => void }) {
  const kit = useSiteKit()!;
  const s = useSubmit('CONTACT');
  const { form, setForm, bind } = useForm({ name: '', phone: '', email: '', intent: listingIds?.length ? 'BUY' : '', timeframe: '', area: '', budget: '', message: '', website: '' });
  const picked = (listingIds ?? []).map((id) => kit.listings.find((l) => l.id === id)).filter(Boolean) as AgentSiteListing[];
  if (s.state === 'sent') {
    return <Sent theme={theme} title="Message sent" body={`${kit.agentName} will get back to you soon.`} preview={s.preview} onDone={onDone} />;
  }
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      s.send({
        name: form.name, phone: form.phone, email: form.email, message: form.message, website: form.website,
        data: { intent: form.intent || undefined, timeframe: form.timeframe || undefined, area: form.area || undefined, budget: form.budget || undefined, listingIds: listingIds?.length ? listingIds : undefined },
      });
    }}>
      {picked.length > 0 && (
        <div className="rounded-xl p-3 text-[13px]" style={{ background: theme.card }}>
          <p className="font-medium">About {picked.length === 1 ? 'this home' : `${picked.length} saved homes`}</p>
          <p className="mt-0.5 opacity-70">{picked.map((l) => l.name).join(', ')}</p>
        </div>
      )}
      <Field label="I’m looking to"><Chips options={INTENTS} value={form.intent} onChange={(v) => setForm((f) => ({ ...f, intent: v }))} theme={theme} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Your name"><input required {...bind('name')} className={inputCls} style={fieldStyle(theme)} autoComplete="name" /></Field>
        <Field label="Phone"><input {...bind('phone')} type="tel" className={inputCls} style={fieldStyle(theme)} autoComplete="tel" /></Field>
        <Field label="Email" wide><input {...bind('email')} type="email" className={inputCls} style={fieldStyle(theme)} autoComplete="email" /></Field>
        <Field label="Area you prefer"><input {...bind('area')} className={inputCls} style={fieldStyle(theme)} placeholder="e.g. Kilimani" /></Field>
        <Field label="Budget (optional)"><input {...bind('budget')} inputMode="numeric" className={inputCls} style={fieldStyle(theme)} placeholder="e.g. 15,000,000" /></Field>
      </div>
      <Field label="When"><Chips options={TIMEFRAMES} value={form.timeframe} onChange={(v) => setForm((f) => ({ ...f, timeframe: v }))} theme={theme} /></Field>
      <Field label="Message"><textarea {...bind('message')} rows={3} className={inputCls} style={fieldStyle(theme)} placeholder="Anything we should know?" /></Field>
      <Honeypot value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
      {s.error && <p className="text-[13.5px] text-[#c5221f]">{s.error}</p>}
      <SubmitButton theme={theme} sending={s.state === 'sending'} label="Send message" />
    </form>
  );
}

function ViewingForm({ theme, listing, onDone }: { theme: SiteTheme; listing?: AgentSiteListing; onDone: () => void }) {
  const kit = useSiteKit()!;
  const s = useSubmit('VIEWING');
  const [slots, setSlots] = useState<ViewingSlots | null>(null);
  const [loadError, setLoadError] = useState('');
  const [day, setDay] = useState(0);
  const [at, setAt] = useState('');
  const { form, setForm, bind } = useForm({ name: '', phone: '', email: '', message: '', website: '', mode: (kit.forms.modes[0] ?? 'IN_PERSON') as string, propertyId: listing?.id ?? '' });

  useEffect(() => {
    siteFormsApi.slots(kit.agentId, kit.preview).then(setSlots).catch(() => setLoadError('Times could not be loaded. Send a message instead and we’ll find one.'));
  }, [kit.agentId, kit.preview]);

  if (s.state === 'sent') {
    const chosen = slots?.days.flatMap((d) => d.slots.map((x) => ({ ...x, day: d.label }))).find((x) => x.at === at);
    return (
      <Sent theme={theme} title="Viewing requested"
        body={`${chosen ? `${chosen.day} at ${chosen.label}. ` : ''}${kit.agentName} will confirm shortly${form.email ? ' — we’ve emailed you the details' : ''}.`}
        preview={s.preview} onDone={onDone} />
    );
  }
  const today = slots?.days[day];
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      if (!at) return;
      s.send({ name: form.name, phone: form.phone, email: form.email, message: form.message, website: form.website, slotAt: at, propertyId: form.propertyId || undefined, data: { mode: form.mode } });
    }}>
      {kit.listings.length > 0 && (
        <Field label="Home">
          <select {...bind('propertyId')} className={inputCls} style={fieldStyle(theme)}>
            <option value="">Not sure yet — help me choose</option>
            {kit.listings.map((l) => <option key={l.id} value={l.id}>{l.name}{placeLabel(l) ? ` · ${placeLabel(l)}` : ''}</option>)}
          </select>
        </Field>
      )}
      {kit.forms.modes.length > 1 && (
        <Field label="How">
          <Chips options={[{ key: 'IN_PERSON', label: 'In person' }, { key: 'VIDEO', label: 'Video call' }]} value={form.mode}
            onChange={(v) => setForm((f) => ({ ...f, mode: v || f.mode }))} theme={theme} />
        </Field>
      )}
      <div>
        <span className="mb-1.5 block text-[12.5px] font-medium opacity-70">Day and time</span>
        {loadError ? <p className="text-[13.5px] opacity-70">{loadError}</p>
          : !slots ? <p className="text-[13.5px] opacity-60">Loading times…</p>
            : !slots.days.length ? <p className="text-[13.5px] opacity-70">No open times in the next two weeks. Send a message and we’ll arrange one.</p>
              : (
                <>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {slots.days.map((d, i) => (
                      <button key={d.date} type="button" onClick={() => { setDay(i); setAt(''); }} aria-pressed={i === day}
                        className="shrink-0 cursor-pointer px-3.5 py-2 text-[13px] transition-colors"
                        style={{
                          borderRadius: Math.min(theme.radius, 12), border: `1px solid ${i === day ? theme.ink : theme.line}`,
                          background: i === day ? theme.ink : 'transparent', color: i === day ? '#fff' : theme.ink,
                        }}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {today?.slots.map((x) => (
                      <button key={x.at} type="button" onClick={() => setAt(x.at)} aria-pressed={x.at === at}
                        className="cursor-pointer py-2.5 text-[13.5px] tabular-nums transition-colors"
                        style={{
                          borderRadius: Math.min(theme.radius, 10), border: `1px solid ${x.at === at ? theme.accent : theme.line}`,
                          background: x.at === at ? theme.accent : '#fff', color: x.at === at ? '#fff' : theme.ink,
                        }}>
                        {x.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[12px] opacity-55">Times are Nairobi time.</p>
                </>
              )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Your name"><input required {...bind('name')} className={inputCls} style={fieldStyle(theme)} autoComplete="name" /></Field>
        <Field label="Phone"><input {...bind('phone')} type="tel" className={inputCls} style={fieldStyle(theme)} autoComplete="tel" /></Field>
        <Field label="Email" wide><input {...bind('email')} type="email" className={inputCls} style={fieldStyle(theme)} autoComplete="email" /></Field>
      </div>
      <Honeypot value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
      {s.error && <p className="text-[13.5px] text-[#c5221f]">{s.error}</p>}
      <button type="submit" disabled={!at || s.state === 'sending'}
        className="inline-flex w-full cursor-pointer items-center justify-center px-6 py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: theme.accent, borderRadius: theme.radius >= 16 ? 999 : Math.min(theme.radius, 14) }}>
        {s.state === 'sending' ? 'Booking…' : at ? 'Request this time' : 'Pick a time'}
      </button>
    </form>
  );
}

const EMPLOYMENT: Record<string, string> = { FULL_TIME: 'Full-time', PART_TIME: 'Part-time', COMMISSION: 'Commission', CONTRACT: 'Contract', INTERNSHIP: 'Internship' };

function ApplyForm({ theme, role, onDone }: { theme: SiteTheme; role?: Role; onDone: () => void }) {
  const s = useSubmit('CAREER');
  const { form, setForm, bind } = useForm({ name: '', phone: '', email: '', experience: '', linkedin: '', cvUrl: '', message: '', website: '' });
  if (s.state === 'sent') return <Sent theme={theme} title="Application sent" body="Thank you. We’ll be in touch if it’s a fit." preview={s.preview} onDone={onDone} />;
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      s.send({
        name: form.name, phone: form.phone, email: form.email, message: form.message, website: form.website,
        data: { roleId: role?.id, experience: form.experience || undefined, linkedin: form.linkedin || undefined, cvUrl: form.cvUrl || undefined },
      });
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Your name"><input required {...bind('name')} className={inputCls} style={fieldStyle(theme)} autoComplete="name" /></Field>
        <Field label="Phone"><input {...bind('phone')} type="tel" className={inputCls} style={fieldStyle(theme)} autoComplete="tel" /></Field>
        <Field label="Email"><input {...bind('email')} type="email" className={inputCls} style={fieldStyle(theme)} autoComplete="email" /></Field>
        <Field label="Years in real estate"><input {...bind('experience')} inputMode="numeric" className={inputCls} style={fieldStyle(theme)} /></Field>
        <Field label="LinkedIn (optional)" wide><input {...bind('linkedin')} type="url" placeholder="https://linkedin.com/in/…" className={inputCls} style={fieldStyle(theme)} /></Field>
        <Field label="Link to your CV (optional)" wide><input {...bind('cvUrl')} type="url" placeholder="Google Drive, Dropbox…" className={inputCls} style={fieldStyle(theme)} /></Field>
      </div>
      <Field label="Why you?"><textarea {...bind('message')} rows={3} className={inputCls} style={fieldStyle(theme)} /></Field>
      <Honeypot value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
      {s.error && <p className="text-[13.5px] text-[#c5221f]">{s.error}</p>}
      <SubmitButton theme={theme} sending={s.state === 'sending'} label="Send application" />
    </form>
  );
}

function SavedList({ theme }: { theme: SiteTheme }) {
  const kit = useSiteKit()!;
  const homes = kit.saved.map((id) => kit.listings.find((l) => l.id === id)).filter(Boolean) as AgentSiteListing[];
  if (!homes.length) return <p className="py-8 text-center text-[14px] opacity-70">Tap the heart on any home to save it here.</p>;
  return (
    <div>
      <ul className="space-y-3">
        {homes.map((l) => (
          <li key={l.id} className="flex items-center gap-3">
            <a href={l.href} className="flex min-w-0 flex-1 items-center gap-3">
              <Img src={l.heroImageUrl} alt="" className="h-14 w-20 shrink-0 object-cover" />
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-medium">{l.name}</span>
                <span className="block truncate text-[12.5px] opacity-65">{[placeLabel(l), priceLabel(l)].filter(Boolean).join(' · ')}</span>
              </span>
            </a>
            <button type="button" onClick={() => kit.toggleSave(l.id)} aria-label={`Remove ${l.name}`}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-60 hover:bg-black/5 hover:opacity-100">
              <Icon d={ICON.close} size={15} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {kit.forms.contact && (
          <button type="button" onClick={() => kit.open({ kind: 'contact', listingIds: homes.map((l) => l.id) })}
            className="cursor-pointer px-5 py-3 text-[14.5px] font-medium text-white" style={{ background: theme.accent, borderRadius: theme.radius >= 16 ? 999 : Math.min(theme.radius, 12) }}>
            Ask about {homes.length === 1 ? 'this home' : 'these homes'}
          </button>
        )}
        {kit.forms.viewing && (
          <button type="button" onClick={() => kit.open({ kind: 'viewing', listing: homes[0] })}
            className="cursor-pointer px-5 py-3 text-[14.5px] font-medium" style={{ border: `1px solid ${theme.line}`, borderRadius: theme.radius >= 16 ? 999 : Math.min(theme.radius, 12) }}>
            Book a viewing
          </button>
        )}
      </div>
    </div>
  );
}

/** Pop-ups and the floating saved button, drawn in the template's theme. */
export function SiteKitLayer({ theme, hideDock = false }: { theme: SiteTheme; hideDock?: boolean }) {
  const kit = useSiteKit();
  const panel = useRef<HTMLDivElement>(null);
  const modal = kit?.modal ?? null;
  useEffect(() => {
    if (!modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') kit?.close(); };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>('input:not([tabindex="-1"]),select,textarea,button')?.focus(), 60);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [modal, kit]);
  if (!kit) return null;

  const title = !modal ? '' : modal.kind === 'contact' ? 'Send a message'
    : modal.kind === 'viewing' ? (modal.listing ? `View ${modal.listing.name}` : 'Book a viewing')
      : modal.kind === 'apply' ? (modal.role ? `Apply — ${modal.role.title}` : 'Send an open application')
        : 'Saved homes';
  const sub = !modal ? '' : modal.kind === 'apply' && modal.role
    ? [modal.role.location, modal.role.employment && EMPLOYMENT[modal.role.employment]].filter(Boolean).join(' · ')
    : modal.kind === 'viewing' ? 'Pick a time that suits you. We’ll confirm it.' : '';

  return (
    <>
      <AnimatePresence>
        {kit.saved.length > 0 && !modal && !hideDock && (
          <motion.button type="button" onClick={() => kit.open({ kind: 'saved' })}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.3, ease: EASE }}
            className="fixed bottom-5 left-5 z-40 inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
            style={{ background: theme.ink }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="#e0473a" aria-hidden><path d={HEART} /></svg>
            Saved · {kit.saved.length}
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal && (
          <motion.div key="kit-modal" className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <button type="button" aria-label="Close" onClick={kit.close} className="absolute inset-0 cursor-default bg-black/45" />
            <motion.div ref={panel} role="dialog" aria-modal="true" aria-label={title}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}
              className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto bg-white px-5 pb-6 pt-5 shadow-2xl sm:px-7"
              style={{ color: theme.ink, borderRadius: `${Math.min(theme.radius, 24)}px ${Math.min(theme.radius, 24)}px ${theme.radius ? Math.min(theme.radius, 24) : 0}px ${theme.radius ? Math.min(theme.radius, 24) : 0}px` }}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[22px] leading-tight" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500 }}>{title}</h2>
                  {sub && <p className="mt-1 text-[13.5px]" style={{ color: theme.muted }}>{sub}</p>}
                </div>
                <button type="button" onClick={kit.close} aria-label="Close"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-black/5">
                  <Icon d={ICON.close} size={18} />
                </button>
              </div>
              {modal.kind === 'apply' && modal.role?.description && (
                <div className="mb-5 space-y-2 text-[14px] leading-relaxed" style={{ color: theme.muted }}>
                  <p className="whitespace-pre-line">{modal.role.description}</p>
                  {!!modal.role.requirements?.length && (
                    <ul className="list-disc space-y-0.5 pl-5">{modal.role.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
                  )}
                </div>
              )}
              {modal.kind === 'contact' && <ContactForm key={(modal.listingIds ?? []).join()} theme={theme} listingIds={modal.listingIds} onDone={kit.close} />}
              {modal.kind === 'viewing' && <ViewingForm key={modal.listing?.id ?? 'any'} theme={theme} listing={modal.listing} onDone={kit.close} />}
              {modal.kind === 'apply' && <ApplyForm key={modal.role?.id ?? 'open'} theme={theme} role={modal.role} onDone={kit.close} />}
              {modal.kind === 'saved' && <SavedList theme={theme} />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Sections (drawn through contentBlocks) ─────────────────────────────────

const PROPERTY_TYPES = [
  { key: 'APARTMENT', label: 'Apartment' }, { key: 'HOUSE', label: 'House' }, { key: 'VILLA', label: 'Villa' },
  { key: 'TOWNHOUSE', label: 'Townhouse' }, { key: 'LAND', label: 'Land' }, { key: 'COMMERCIAL', label: 'Commercial' },
];

/** "What's my home worth?" — a valuation request with the answers an agent needs to call back prepared. */
export function ValuationSection({ theme, eyebrow }: { theme: SiteTheme; eyebrow: ReactNode }) {
  const kit = useSiteKit();
  const s = useSubmit('VALUATION');
  const { form, setForm, bind } = useForm({ purpose: 'SELL', address: '', propertyType: '', bedrooms: '', timeframe: '', name: '', phone: '', email: '', message: '', website: '' });
  if (!kit?.forms.valuation) return null;
  return (
    <section id="valuation" className="scroll-mt-24">
      <div className={`mx-auto ${theme.width ?? 'max-w-6xl'} px-4 py-20 sm:px-6`}>
        <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14" style={{ background: theme.card, borderRadius: theme.radius }}>
          <div>
            {eyebrow}
            <h2 className="mt-3 text-[30px] leading-[1.1] tracking-tight sm:text-[40px]" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500 }}>
              What is your home worth?
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: theme.muted }}>
              Thinking of selling or letting? Tell {kit.agentName} about the property and get a free, no-obligation valuation based on recent sales nearby.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14.5px]">
              {['Free and no obligation', 'Based on real recent sales and lettings', 'A reply within one working day'].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: theme.accent }}><Icon d="M5 12.5l4.5 4.5L19 7.5" size={12} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          {s.state === 'sent' ? (
            <div className="flex items-center justify-center bg-white p-6" style={{ borderRadius: Math.min(theme.radius, 20) }}>
              <Sent theme={theme} title="Request received" body={`${kit.agentName} will be in touch with your valuation.`} preview={s.preview} />
            </div>
          ) : (
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              s.send({
                name: form.name, phone: form.phone, email: form.email, message: form.message, website: form.website,
                data: { purpose: form.purpose, address: form.address, propertyType: form.propertyType || undefined, bedrooms: form.bedrooms || undefined, timeframe: form.timeframe || undefined },
              });
            }}>
              <Field label="I want to"><Chips options={[{ key: 'SELL', label: 'Sell' }, { key: 'LET', label: 'Let it out' }]} value={form.purpose} onChange={(v) => setForm((f) => ({ ...f, purpose: v || 'SELL' }))} theme={theme} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Property location" wide><input required {...bind('address')} placeholder="Estate, road or building, area" className={inputCls} style={fieldStyle(theme)} /></Field>
                <Field label="Type">
                  <select {...bind('propertyType')} className={inputCls} style={fieldStyle(theme)}>
                    <option value="">Choose</option>
                    {PROPERTY_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Bedrooms">
                  <select {...bind('bedrooms')} className={inputCls} style={fieldStyle(theme)}>
                    <option value="">Choose</option>
                    {['0', '1', '2', '3', '4', '5', '6'].map((n) => <option key={n} value={n}>{n === '0' ? 'Studio / none' : n === '6' ? '6+' : n}</option>)}
                  </select>
                </Field>
                <Field label="Your name"><input required {...bind('name')} className={inputCls} style={fieldStyle(theme)} autoComplete="name" /></Field>
                <Field label="Phone"><input {...bind('phone')} type="tel" className={inputCls} style={fieldStyle(theme)} autoComplete="tel" /></Field>
                <Field label="Email" wide><input {...bind('email')} type="email" className={inputCls} style={fieldStyle(theme)} autoComplete="email" /></Field>
              </div>
              <Field label="When"><Chips options={TIMEFRAMES} value={form.timeframe} onChange={(v) => setForm((f) => ({ ...f, timeframe: v }))} theme={theme} /></Field>
              <Honeypot value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
              {s.error && <p className="text-[13.5px] text-[#c5221f]">{s.error}</p>}
              <SubmitButton theme={theme} sending={s.state === 'sending'} label="Get my free valuation" />
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/** Open roles, each opening an application form; plus an open application. */
export function CareersSection({ theme, roles, head }: { theme: SiteTheme; roles: Role[]; head: ReactNode }) {
  const kit = useSiteKit();
  if (!kit?.forms.careers || !roles.length) return null;
  return (
    <section id="careers" className="scroll-mt-24">
      <div className={`mx-auto ${theme.width ?? 'max-w-6xl'} px-4 py-20 sm:px-6`}>
        {head}
        <ul className="mt-10 border-t" style={{ borderColor: theme.line }}>
          {roles.map((r) => (
            <li key={r.id} className="border-b" style={{ borderColor: theme.line }}>
              <button type="button" onClick={() => kit.open({ kind: 'apply', role: r })}
                className="group flex w-full cursor-pointer flex-wrap items-center justify-between gap-4 py-6 text-left">
                <span className="min-w-0">
                  <span className="block text-[20px] leading-snug transition-opacity group-hover:opacity-70" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500 }}>{r.title}</span>
                  <span className="mt-1 block text-[14px]" style={{ color: theme.muted }}>
                    {[r.location, r.employment && EMPLOYMENT[r.employment]].filter(Boolean).join(' · ') || 'Open role'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 text-[14px] font-medium" style={{ color: theme.accent }}>
                  Apply <Icon d={ICON.arrow} size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[14px]" style={{ color: theme.muted }}>
          Don’t see your role?{' '}
          <button type="button" onClick={() => kit.open({ kind: 'apply' })} className="cursor-pointer font-medium underline underline-offset-4" style={{ color: theme.ink }}>
            Send an open application
          </button>
        </p>
      </div>
    </section>
  );
}

/** Email sign-up for the agent's market updates and new listings. */
export function NewsletterSection({ theme }: { theme: SiteTheme }) {
  const kit = useSiteKit();
  const s = useSubmit('NEWSLETTER');
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  if (!kit?.forms.newsletter) return null;
  return (
    <section id="newsletter" className="scroll-mt-24">
      <div className={`mx-auto ${theme.width ?? 'max-w-6xl'} px-4 py-16 sm:px-6`}>
        <div className="flex flex-col gap-6 border-y py-10 md:flex-row md:items-center md:justify-between" style={{ borderColor: theme.line }}>
          <div className="max-w-md">
            <h2 className="text-[26px] leading-tight tracking-tight" style={{ fontFamily: theme.display, fontWeight: theme.weight ?? 500 }}>New homes, first.</h2>
            <p className="mt-2 text-[14.5px]" style={{ color: theme.muted }}>New listings, price changes and market notes from {kit.agentName}. About once a month. Unsubscribe any time.</p>
          </div>
          {s.state === 'sent' ? (
            <p className="text-[15px] font-medium" style={{ color: theme.accent }}>
              You’re on the list.{s.preview ? ' (Preview: nothing was sent.)' : ''}
            </p>
          ) : (
            <form className="relative flex w-full max-w-md flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); s.send({ email, website: hp }); }}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" aria-label="Your email"
                className={`${inputCls} flex-1`} style={{ ...fieldStyle(theme), borderRadius: theme.radius >= 16 ? 999 : Math.min(theme.radius, 12) }} />
              <Honeypot value={hp} onChange={setHp} />
              <button type="submit" disabled={s.state === 'sending'}
                className="shrink-0 cursor-pointer px-6 py-3 text-[14.5px] font-medium text-white disabled:opacity-60"
                style={{ background: theme.accent, borderRadius: theme.radius >= 16 ? 999 : Math.min(theme.radius, 12) }}>
                {s.state === 'sending' ? 'Joining…' : 'Subscribe'}
              </button>
              {s.error && <p className="text-[13px] text-[#c5221f] sm:absolute sm:-bottom-6">{s.error}</p>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
