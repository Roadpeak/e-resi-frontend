'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentContentApi, type ContentItem, type ContentState, type ContentType } from '../../../../../lib/api/agent-site';
import { ApiError } from '../../../../../lib/api/client';
import { ImageUpload } from '../../../../../components/dashboard/ImageUpload';
import { cn } from '../../../../../lib/utils';

/**
 * Website content: everything an agent adds to their site beyond listings —
 * team, testimonials, past sales, services, process, FAQ, journal, awards —
 * plus the licence line. Every template draws whatever is published here.
 */

type Field = {
  key: string; label: string; required?: boolean; hint?: string; placeholder?: string;
  kind: 'text' | 'textarea' | 'long' | 'number' | 'month' | 'image' | 'url' | 'lines' | 'select';
  options?: { value: string; label: string }[];
};
type TypeDef = { type: ContentType; label: string; one: string; intro: string; fields: Field[]; title: (d: Record<string, unknown>) => string; sub?: (d: Record<string, unknown>) => string; starter?: Record<string, unknown>[] };

const s = (v: unknown) => (v == null ? '' : String(v));

const TYPES: TypeDef[] = [
  {
    type: 'TESTIMONIAL', label: 'Testimonials', one: 'testimonial', intro: 'Quotes from buyers, sellers, tenants and landlords. Six or more scroll in two rows.',
    fields: [
      { key: 'quote', label: 'What they said', kind: 'textarea', required: true },
      { key: 'author', label: 'Name', kind: 'text', required: true, placeholder: 'Wanjiru & Brian' },
      { key: 'context', label: 'Context', kind: 'text', placeholder: 'Bought a 2-bed in Kilimani' },
      { key: 'dealType', label: 'Client type', kind: 'select', options: [{ value: '', label: '—' }, { value: 'BUYER', label: 'Buyer' }, { value: 'SELLER', label: 'Seller' }, { value: 'TENANT', label: 'Tenant' }, { value: 'LANDLORD', label: 'Landlord' }, { value: 'INVESTOR', label: 'Investor' }] },
      { key: 'rating', label: 'Rating', kind: 'select', options: [{ value: '', label: '—' }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n === 1 ? '' : 's'}` }))] },
      { key: 'date', label: 'When', kind: 'month' },
      { key: 'photoUrl', label: 'Photo', kind: 'image' },
    ],
    title: (d) => s(d.author), sub: (d) => s(d.quote).slice(0, 90),
  },
  {
    type: 'TEAM', label: 'Team', one: 'team member', intro: 'The people clients will deal with. Great for agencies.',
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'role', label: 'Role', kind: 'text', placeholder: 'Sales agent' },
      { key: 'photoUrl', label: 'Photo', kind: 'image' },
      { key: 'bio', label: 'Short bio', kind: 'textarea' },
      { key: 'phone', label: 'Phone', kind: 'text' },
      { key: 'email', label: 'Email', kind: 'text' },
      { key: 'years', label: 'Years of experience', kind: 'number' },
      { key: 'sales', label: 'Deals closed', kind: 'number' },
      { key: 'linkedin', label: 'LinkedIn link', kind: 'url' },
    ],
    title: (d) => s(d.name), sub: (d) => s(d.role),
  },
  {
    type: 'PAST_SALE', label: 'Past sales', one: 'past sale', intro: 'Homes you have sold or let — your track record.',
    fields: [
      { key: 'title', label: 'Property', kind: 'text', required: true, placeholder: '3-bed townhouse' },
      { key: 'location', label: 'Location', kind: 'text', placeholder: 'Runda, Nairobi' },
      { key: 'outcome', label: 'Outcome', kind: 'select', required: true, options: [{ value: 'SOLD', label: 'Sold' }, { value: 'LET', label: 'Let' }] },
      { key: 'price', label: 'Price', kind: 'number', hint: 'Leave empty to keep it private' },
      { key: 'currency', label: 'Currency', kind: 'text', placeholder: 'KES' },
      { key: 'date', label: 'When', kind: 'month' },
      { key: 'imageUrl', label: 'Photo', kind: 'image' },
      { key: 'note', label: 'Note', kind: 'textarea', placeholder: 'Sold above asking in 3 weeks' },
    ],
    title: (d) => s(d.title), sub: (d) => [d.outcome === 'LET' ? 'Let' : 'Sold', s(d.location)].filter(Boolean).join(' · '),
  },
  {
    type: 'SERVICE', label: 'Services', one: 'service', intro: 'What you offer: buying, selling, letting, management, valuations.',
    fields: [
      { key: 'title', label: 'Service', kind: 'text', required: true, placeholder: 'Sell your home' },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'points', label: 'What’s included', kind: 'lines', hint: 'One per line, up to 6' },
      { key: 'imageUrl', label: 'Image', kind: 'image' },
    ],
    title: (d) => s(d.title), sub: (d) => s(d.description).slice(0, 90),
    starter: [
      { title: 'Buy a home', description: 'We shortlist homes that fit your life and budget, arrange viewings and live guided tours, and negotiate for you.', points: ['Curated shortlist', 'Viewings & live tours', 'Offer negotiation'] },
      { title: 'Sell your property', description: 'Honest pricing, great presentation and a launch that brings serious buyers.', points: ['Free valuation', 'Photography & 3D tour', 'Buyer screening'] },
      { title: 'Let & manage', description: 'Vetted tenants, rent collected on time and a property that stays in shape.', points: ['Tenant referencing', 'Rent collection', 'Maintenance'] },
    ],
  },
  {
    type: 'STEP', label: 'How it works', one: 'step', intro: 'Your process in a few steps. Mark steps for buyers or sellers to show a toggle.',
    fields: [
      { key: 'title', label: 'Step', kind: 'text', required: true },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'audience', label: 'For', kind: 'select', options: [{ value: 'ALL', label: 'Everyone' }, { value: 'BUYERS', label: 'Buyers' }, { value: 'SELLERS', label: 'Sellers' }] },
    ],
    title: (d) => s(d.title), sub: (d) => (d.audience === 'BUYERS' ? 'Buyers' : d.audience === 'SELLERS' ? 'Sellers' : 'Everyone'),
    starter: [
      { title: 'Tell us what you need', description: 'A short call about your budget, timing and the kind of home you want.', audience: 'ALL' },
      { title: 'Explore and view', description: 'Shortlisted homes, virtual tours and in-person or live guided viewings.', audience: 'ALL' },
      { title: 'Offer and negotiate', description: 'We handle the offer, the negotiation and the paperwork with the seller.', audience: 'ALL' },
      { title: 'Get your keys', description: 'Closing, handover and help settling in.', audience: 'ALL' },
    ],
  },
  {
    type: 'FAQ', label: 'FAQ', one: 'question', intro: 'Answers to what clients always ask.',
    fields: [
      { key: 'question', label: 'Question', kind: 'text', required: true },
      { key: 'answer', label: 'Answer', kind: 'textarea', required: true },
    ],
    title: (d) => s(d.question), sub: (d) => s(d.answer).slice(0, 90),
    starter: [
      { question: 'Do you charge buyers a fee?', answer: 'Our fees are agreed upfront and explained before you commit. Ask us for the details on any listing.' },
      { question: 'Can I view a home without travelling?', answer: 'Yes. Most of our listings have virtual tours, and we run live guided video tours at a time that suits you.' },
      { question: 'How do I book a viewing?', answer: 'Message us on WhatsApp or call, tell us the development and a time, and we’ll confirm the same day.' },
      { question: 'Do you help with off-plan purchases?', answer: 'Yes — we explain payment plans, completion timelines and what to check before you reserve.' },
    ],
  },
  {
    type: 'POST', label: 'Journal', one: 'post', intro: 'Articles with their own page on your site — good for search and trust.',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true },
      { key: 'category', label: 'Category', kind: 'text', placeholder: 'Buying guide' },
      { key: 'publishedAt', label: 'Date', kind: 'month' },
      { key: 'coverUrl', label: 'Cover image', kind: 'image' },
      { key: 'excerpt', label: 'Summary', kind: 'textarea', hint: 'One or two sentences shown on cards' },
      { key: 'body', label: 'Article', kind: 'long', required: true, hint: 'Leave a blank line between paragraphs. Start a line with "## " for a subheading, "- " for bullets.' },
    ],
    title: (d) => s(d.title), sub: (d) => [s(d.category), s(d.publishedAt)].filter(Boolean).join(' · '),
  },
  {
    type: 'AWARD', label: 'Awards', one: 'award', intro: 'Recognition and memberships, shown as a row of badges.',
    fields: [
      { key: 'title', label: 'Award', kind: 'text', required: true, placeholder: 'Top agent 2025' },
      { key: 'issuer', label: 'From', kind: 'text' },
      { key: 'year', label: 'Year', kind: 'number' },
    ],
    title: (d) => s(d.title), sub: (d) => [s(d.issuer), s(d.year)].filter(Boolean).join(' · '),
  },
  {
    type: 'AREA', label: 'Area guides', one: 'area guide', intro: 'Neighbourhoods you know. With a write-up, each guide gets its own page listing your homes there.',
    fields: [
      { key: 'name', label: 'Area', kind: 'text', required: true, placeholder: 'Kilimani' },
      { key: 'tagline', label: 'One-liner', kind: 'text', placeholder: 'Leafy, central and always in demand' },
      { key: 'coverUrl', label: 'Cover photo', kind: 'image' },
      { key: 'summary', label: 'Summary', kind: 'textarea', hint: 'Shown at the top of the page' },
      { key: 'body', label: 'Guide', kind: 'long', hint: 'Leave empty for a card only. "## " for subheadings, "- " for bullets.' },
      { key: 'highlights', label: 'Why people love it', kind: 'lines', hint: 'One per line, up to 8' },
      { key: 'priceFrom', label: 'Homes from (KES)', kind: 'number' },
      { key: 'rentFrom', label: 'Rent from (KES / month)', kind: 'number' },
      { key: 'commute', label: 'Getting around', kind: 'text', placeholder: '15 min to CBD via Argwings Kodhek' },
      { key: 'schools', label: 'Schools nearby', kind: 'lines' },
      { key: 'match', label: 'Match listings by', kind: 'text', hint: 'Listings whose area or city contains this word show on the page. Defaults to the area name.' },
    ],
    title: (d) => s(d.name), sub: (d) => s(d.tagline),
  },
  {
    type: 'CASE_STUDY', label: 'Case studies', one: 'case study', intro: 'A deal told as a story: the brief, what you did, and the result.',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true, placeholder: 'Sold a Lavington villa in 19 days' },
      { key: 'clientType', label: 'Client', kind: 'select', options: [{ value: '', label: '—' }, { value: 'BUYER', label: 'Buyer' }, { value: 'SELLER', label: 'Seller' }, { value: 'TENANT', label: 'Tenant' }, { value: 'LANDLORD', label: 'Landlord' }, { value: 'INVESTOR', label: 'Investor' }, { value: 'DEVELOPER', label: 'Developer' }] },
      { key: 'location', label: 'Location', kind: 'text' },
      { key: 'coverUrl', label: 'Photo', kind: 'image' },
      { key: 'metrics', label: 'Key numbers', kind: 'lines', hint: 'Up to 4, number first: "19 days on market", "104% of asking"' },
      { key: 'challenge', label: 'The brief', kind: 'textarea' },
      { key: 'approach', label: 'What you did', kind: 'textarea' },
      { key: 'result', label: 'The result', kind: 'textarea' },
      { key: 'quote', label: 'Client quote', kind: 'textarea' },
      { key: 'date', label: 'When', kind: 'month' },
    ],
    title: (d) => s(d.title), sub: (d) => s(d.location),
  },
  {
    type: 'PACKAGE', label: 'Landlord packages', one: 'package', intro: 'Your letting and management options with fees. Mark one as most chosen.',
    fields: [
      { key: 'name', label: 'Package', kind: 'text', required: true, placeholder: 'Fully managed' },
      { key: 'fee', label: 'Fee', kind: 'text', required: true, placeholder: '10% of rent' },
      { key: 'feeNote', label: 'Fee note', kind: 'text', placeholder: 'Plus VAT, monthly' },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'points', label: 'What’s included', kind: 'lines', hint: 'One per line, up to 10' },
      { key: 'featured', label: 'Highlight', kind: 'select', options: [{ value: 'NO', label: 'No' }, { value: 'YES', label: 'Most chosen' }] },
    ],
    title: (d) => s(d.name), sub: (d) => s(d.fee),
    starter: [
      { name: 'Tenant find', fee: '1 month’s rent', feeNote: 'One-off, when a tenant moves in', description: 'We find and vet the tenant; you manage from there.', points: ['Listing on e-resi and portals', 'Viewings handled', 'Tenant referencing', 'Lease and inventory'], featured: 'NO' },
      { name: 'Rent collection', fee: '7% of rent', feeNote: 'Monthly', description: 'Tenant find plus rent collected and paid to you every month.', points: ['Everything in Tenant find', 'Monthly rent collection', 'Arrears follow-up', 'Monthly statement'], featured: 'NO' },
      { name: 'Fully managed', fee: '10% of rent', feeNote: 'Monthly', description: 'We look after the property and the tenant so you don’t have to.', points: ['Everything in Rent collection', 'Repairs and maintenance', 'Quarterly inspections', 'Renewals and move-outs', '24/7 tenant line'], featured: 'YES' },
    ],
  },
  {
    type: 'ROLE', label: 'Careers', one: 'open role', intro: 'Jobs you are hiring for. Applications arrive in Leads. The section hides when there are no roles.',
    fields: [
      { key: 'title', label: 'Role', kind: 'text', required: true, placeholder: 'Sales agent' },
      { key: 'location', label: 'Location', kind: 'text', placeholder: 'Nairobi' },
      { key: 'employment', label: 'Type', kind: 'select', options: [{ value: '', label: '—' }, { value: 'FULL_TIME', label: 'Full-time' }, { value: 'PART_TIME', label: 'Part-time' }, { value: 'COMMISSION', label: 'Commission' }, { value: 'CONTRACT', label: 'Contract' }, { value: 'INTERNSHIP', label: 'Internship' }] },
      { key: 'description', label: 'About the role', kind: 'textarea' },
      { key: 'requirements', label: 'What you need', kind: 'lines', hint: 'One per line, up to 8' },
    ],
    title: (d) => s(d.title), sub: (d) => s(d.location),
  },
];

const input = 'w-full rounded-xl border border-[#dadce0] px-3 py-2.5 text-[15px] text-[#202124] outline-none focus:border-[#1a73e8]';
const btn = 'rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50';
const ghost = 'rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa] disabled:opacity-50';

function toForm(def: TypeDef, data: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const f of def.fields) out[f.key] = f.kind === 'lines' ? (Array.isArray(data[f.key]) ? (data[f.key] as string[]).join('\n') : '') : s(data[f.key]);
  if (def.type === 'PAST_SALE' && !out.outcome) out.outcome = 'SOLD';
  return out;
}
function fromForm(def: TypeDef, form: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const f of def.fields) {
    const v = form[f.key]?.trim();
    if (!v) continue;
    out[f.key] = f.kind === 'number' ? Number(v) : f.kind === 'lines' ? v.split('\n').map((x) => x.trim()).filter(Boolean) : v;
  }
  return out;
}

function Editor({ def, item, onDone }: { def: TypeDef; item: ContentItem | null; onDone: (next: ContentState | null) => void }) {
  const [form, setForm] = useState<Record<string, string>>(() => toForm(def, item?.data ?? {}));
  const [published, setPublished] = useState(item?.isPublished ?? true);
  const [err, setErr] = useState('');
  const save = useMutation({
    mutationFn: () => (item
      ? agentContentApi.update(item.id, { data: fromForm(def, form), isPublished: published })
      : agentContentApi.create(def.type, fromForm(def, form), published)),
    onSuccess: onDone,
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Could not save'),
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="rounded-3xl border border-[#1a73e8] bg-white p-5">
      <p className="text-[16px] font-medium text-[#202124]">{item ? `Edit ${def.one}` : `New ${def.one}`}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {def.fields.map((f) => {
          const wide = ['textarea', 'long', 'image', 'lines'].includes(f.kind);
          return (
            <label key={f.key} className={cn('block', wide && 'sm:col-span-2')}>
              {f.kind !== 'image' && <span className="text-[13px] text-[#5f6368]">{f.label}{f.required ? ' *' : ''}</span>}
              {f.kind === 'image' ? (
                <ImageUpload value={form[f.key] ?? ''} onChange={(v) => set(f.key, v)} folder="logos" label={f.label} hint={f.hint ?? 'JPG or PNG'} />
              ) : f.kind === 'select' ? (
                <select value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} className={cn(input, 'mt-1 bg-white')}>
                  {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.kind === 'textarea' || f.kind === 'lines' || f.kind === 'long' ? (
                <textarea value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} rows={f.kind === 'long' ? 14 : 3}
                  placeholder={f.placeholder} className={cn(input, 'mt-1', f.kind === 'long' && 'font-[inherit] leading-relaxed')} />
              ) : (
                <input value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder ?? (f.kind === 'url' ? 'https://' : undefined)}
                  type={f.kind === 'number' ? 'number' : f.kind === 'month' ? 'month' : 'text'} className={cn(input, 'mt-1')} />
              )}
              {f.hint && f.kind !== 'image' && <span className="mt-1 block text-[12px] text-[#80868b]">{f.hint}</span>}
            </label>
          );
        })}
      </div>
      {err && <p className="mt-3 text-[13px] text-[#c5221f]">{err}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className={btn}>{save.isPending ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={() => onDone(null)} className={ghost}>Cancel</button>
        <label className="ml-auto flex items-center gap-2 text-[14px] text-[#3c4043]">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-[#1a73e8]" /> Show on my site
        </label>
      </div>
    </div>
  );
}

function Legal({ data, onSaved }: { data: ContentState; onSaved: (n: ContentState) => void }) {
  const [licence, setLicence] = useState(data.licenceNo ?? '');
  const [note, setNote] = useState(data.footerNote ?? '');
  useEffect(() => { setLicence(data.licenceNo ?? ''); setNote(data.footerNote ?? ''); }, [data.licenceNo, data.footerNote]);
  const save = useMutation({ mutationFn: () => agentContentApi.legal({ licenceNo: licence || null, footerNote: note || null }), onSuccess: onSaved });
  return (
    <section className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <h2 className="text-[18px] font-normal text-[#202124]">Licence and footer</h2>
      <p className="mt-1 text-[14px] text-[#5f6368]">Shown at the bottom of every page of your site.</p>
      <div className="mt-4 grid gap-4">
        <label className="block"><span className="text-[13px] text-[#5f6368]">Licence / registration</span>
          <input value={licence} onChange={(e) => setLicence(e.target.value)} maxLength={120} placeholder="EARB Reg. No. 1234" className={cn(input, 'mt-1')} /></label>
        <label className="block"><span className="text-[13px] text-[#5f6368]">Footer note</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} placeholder="Prices and availability may change. Please confirm details before you commit." className={cn(input, 'mt-1')} /></label>
      </div>
      <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className={cn(btn, 'mt-4')}>{save.isPending ? 'Saving…' : 'Save'}</button>
    </section>
  );
}

export default function AgentSiteContentPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['agent-content'], queryFn: agentContentApi.list });
  const [tab, setTab] = useState<ContentType>('TESTIMONIAL');
  const [editing, setEditing] = useState<ContentItem | 'new' | null>(null);
  const [err, setErr] = useState('');
  const def = TYPES.find((t) => t.type === tab)!;
  const done = (next: ContentState | null) => {
    if (next) qc.setQueryData(['agent-content'], next);
    setEditing(null); setErr('');
  };
  const fail = (e: unknown) => setErr(e instanceof ApiError ? e.message : 'Something went wrong');
  const toggle = useMutation({ mutationFn: (i: ContentItem) => agentContentApi.update(i.id, { isPublished: !i.isPublished }), onSuccess: done, onError: fail });
  const remove = useMutation({ mutationFn: (id: string) => agentContentApi.remove(id), onSuccess: done, onError: fail });
  const reorder = useMutation({ mutationFn: (ids: string[]) => agentContentApi.reorder(tab, ids), onSuccess: done, onError: fail });
  const starter = useMutation({
    mutationFn: async () => {
      let last: ContentState | null = null;
      for (const d of def.starter ?? []) last = await agentContentApi.create(def.type, d);
      return last!;
    },
    onSuccess: done, onError: fail,
  });

  if (!data) return <div className="p-8 text-[14px] text-[#5f6368]">Loading…</div>;
  const items = data.items.filter((i) => i.type === tab);
  const count = (t: ContentType) => data.items.filter((i) => i.type === t).length;
  const move = (i: number, d: -1 | 1) => {
    const ids = items.map((x) => x.id); const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder.mutate(ids);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124] sm:text-[28px]">Site content</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-[#5f6368]">
            Everything beyond your listings. Whatever you publish here appears on your website in any template; turn
            sections on, off or reorder them on the <Link href="/agent/website" className="text-[#1a73e8] hover:underline">Website</Link> page.
          </p>
        </div>
        <Link href="/agent/website" className={ghost}>Back to Website</Link>
      </header>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TYPES.map((t) => (
          <button key={t.type} type="button" onClick={() => { setTab(t.type); setEditing(null); }} aria-pressed={tab === t.type}
            className={cn('shrink-0 rounded-full border px-4 py-2 text-[14px] font-medium', tab === t.type ? 'border-[#202124] bg-[#202124] text-white' : 'border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f1f3f4]')}>
            {t.label} <span className="ml-1 opacity-60">{count(t.type)}</span>
          </button>
        ))}
      </div>

      {err && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{err}</p>}

      <section className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-normal text-[#202124]">{def.label}</h2>
            <p className="mt-1 text-[14px] text-[#5f6368]">{def.intro}</p>
          </div>
          {editing === null && <button type="button" onClick={() => setEditing('new')} className={btn}>Add {def.one}</button>}
        </div>

        {editing === 'new' && <div className="mt-5"><Editor key="new" def={def} item={null} onDone={done} /></div>}

        {items.length === 0 && editing === null ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#dadce0] p-8 text-center">
            <p className="text-[14px] text-[#5f6368]">Nothing here yet.</p>
            {def.starter && (
              <button type="button" onClick={() => starter.mutate()} disabled={starter.isPending} className={cn(ghost, 'mt-3')}>
                {starter.isPending ? 'Adding…' : `Start with suggested ${def.label.toLowerCase()}`}
              </button>
            )}
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {items.map((i, idx) => (
              editing !== 'new' && editing?.id === i.id ? (
                <li key={i.id}><Editor key={i.id} def={def} item={i} onDone={done} /></li>
              ) : (
                <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e8eaed] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-[15px]', i.isPublished ? 'text-[#202124]' : 'text-[#9aa0a6]')}>{def.title(i.data)}</p>
                    {def.sub && <p className="truncate text-[13px] text-[#80868b]">{def.sub(i.data)}</p>}
                  </div>
                  {!i.isPublished && <span className="rounded-full bg-[#f1f3f4] px-2.5 py-0.5 text-[12px] text-[#5f6368]">Hidden</span>}
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0 || reorder.isPending} aria-label="Move up" className="h-8 w-8 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1 || reorder.isPending} aria-label="Move down" className="h-8 w-8 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => toggle.mutate(i)} className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#1a73e8] hover:bg-[#f1f3f4]">{i.isPublished ? 'Hide' : 'Show'}</button>
                    <button type="button" onClick={() => setEditing(i)} className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#1a73e8] hover:bg-[#f1f3f4]">Edit</button>
                    <button type="button" onClick={() => { if (window.confirm(`Delete this ${def.one}?`)) remove.mutate(i.id); }}
                      className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#c5221f] hover:bg-[#fce8e6]">Delete</button>
                  </span>
                </li>
              )
            ))}
          </ul>
        )}
      </section>

      <Legal data={data} onSaved={(n) => qc.setQueryData(['agent-content'], n)} />
    </div>
  );
}
