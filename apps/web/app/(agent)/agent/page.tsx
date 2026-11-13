'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight, Building2, CalendarDays, Check, Globe, Handshake, KeyRound, MessageSquare, Phone, Star, Users,
} from 'lucide-react';
import { agentsApi } from '../../../lib/api/agents';
import { partnershipsApi } from '../../../lib/api/partnerships';
import { chatApi } from '../../../lib/api/chat';
import { leadsApi, type LeadRow } from '../../../lib/api/leads';
import { agentContentApi, agentSiteApi } from '../../../lib/api/agent-site';
import { AgentStatusBanner } from '../../../components/agent/AgentStatusBanner';
import { WelcomeTemplateModal } from '../../../components/agent/WelcomeTemplateModal';
import { cn, formatPrice } from '../../../lib/utils';
import { useMyRentListings } from '../../../lib/api/queries';

/**
 * The agent's home: headline numbers, their website at a glance, what is
 * left to set up, viewings booked from the site, the latest leads and the
 * developments partners have assigned.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white p-6';
const DAY = 86_400_000;

const STATUS_LABEL: Record<string, string> = {
  NEW: 'New', READ: 'Seen', REPLIED: 'Replied', CLOSED: 'Closed', PENDING: 'Requested', CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled', LEAD: 'Introduced', VIEWING: 'Viewing', RESERVED: 'Reserved',
  SPA_SIGNED: 'SPA signed', LOST: 'Lost', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', NEGOTIATING: 'Negotiating',
  WON: 'Won', VIEWED: 'Browsing',
};

function relDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const isNew = (l: LeadRow) => ['NEW', 'PENDING', 'LEAD'].includes(l.status);
const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, '').replace(/^0/, '254')}`;

export default function AgentOverview() {
  const { data: me } = useQuery({ queryKey: ['agent', 'me'], queryFn: () => agentsApi.me() });
  const { data: assignments } = useQuery({
    queryKey: ['agent', 'assignments', 1],
    queryFn: () => partnershipsApi.myAssignments({ limit: 5 }),
  });
  const { data: partners } = useQuery({
    queryKey: ['partnerships', 'ACTIVE'],
    queryFn: () => partnershipsApi.list({ status: 'ACTIVE', limit: 1 }),
  });
  const { data: unread } = useQuery({ queryKey: ['chat', 'unread'], queryFn: () => chatApi.unreadCount() });
  const { data: leadsData } = useQuery({ queryKey: ['leads'], queryFn: leadsApi.list });
  const { data: site } = useQuery({ queryKey: ['agent-site'], queryFn: agentSiteApi.mine });
  const { data: templates } = useQuery({ queryKey: ['agent-templates'], queryFn: agentSiteApi.templates });
  const { data: content } = useQuery({ queryKey: ['agent-content'], queryFn: agentContentApi.list });
  const { data: rentals } = useMyRentListings({ limit: 6 });

  const leads = leadsData?.leads ?? [];
  const ownListings = leadsData?.properties.length ?? 0;
  const assigned = assignments?.meta.total ?? 0;
  const weekAgo = Date.now() - 7 * DAY;
  const monthAgo = Date.now() - 30 * DAY;
  const newLeads = leads.filter((l) => l.kind !== 'VIEWER' && isNew(l));
  const thisWeek = leads.filter((l) => l.kind !== 'VIEWER' && new Date(l.createdAt).getTime() >= weekAgo).length;
  const siteLeads = leads.filter((l) => l.kind === 'SITE' && l.siteType !== 'NEWSLETTER' && new Date(l.createdAt).getTime() >= monthAgo).length;
  const subscribers = leads.filter((l) => l.siteType === 'NEWSLETTER').length;
  const viewings = leads
    .filter((l) => l.siteType === 'VIEWING' && l.slotAt && new Date(l.slotAt).getTime() > Date.now() - 2 * 3_600_000 && l.status !== 'LOST')
    .sort((a, b) => new Date(a.slotAt!).getTime() - new Date(b.slotAt!).getTime());
  const recent = leads.filter((l) => l.kind !== 'VIEWER').slice(0, 6);

  const items = content?.items ?? [];
  const count = (t: string) => items.filter((i) => i.type === t && i.isPublished).length;
  const currentTemplate = templates?.templates.find((t) => t.key === templates.current);
  const steps = [
    { done: !!(me?.photoUrl || me?.logoUrl) && !!me?.bio, label: 'Add your photo and bio', hint: 'They lead your profile and website.', href: '/agent/profile' },
    { done: !!site?.url, label: 'Get your website address', hint: 'yourname.e-resi.com or your own domain.', href: '/agent/website' },
    { done: !!templates && templates.current !== 'CLASSIC', label: 'Choose a website template', hint: '14 designs to pick from.', href: '/agent/website' },
    { done: count('TESTIMONIAL') > 0, label: 'Add client testimonials', hint: 'Reviews build trust fastest.', href: '/agent/website/content' },
    { done: count('SERVICE') > 0 || count('FAQ') > 0, label: 'Add services or FAQs', hint: 'Start from the suggested sets.', href: '/agent/website/content' },
    { done: !!content?.licenceNo, label: 'Show your licence number', hint: 'Shown in your website footer.', href: '/agent/website/content' },
  ];
  const left = steps.filter((s) => !s.done);
  const loaded = !!me && !!site && !!templates && !!content;

  return (
    <div className="space-y-6">
      <WelcomeTemplateModal />
      <section className="dash-hero relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-200 via-emerald-200 to-sky-300 px-4 py-5 sm:rounded-3xl sm:px-10 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-[24px] font-medium leading-tight text-[#202124] sm:text-[2.5rem]">{me ? me.displayName : 'Your agency'}</h1>
          <p className="mt-1 text-[14px] text-[#3c4043] sm:mt-3 sm:text-base">Your listings, website, leads and partners in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/agent/listings/new" className="rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">Add a listing</Link>
          <Link href="/agent/rentals/new" className="rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">List a rental</Link>
          <Link href="/agent/leads" className="rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc]">Open leads</Link>
          <a href="/properties" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa]"><Building2 size={15} className="text-[#5f6368]" />Properties for sale</a>
          <a href="/rent" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa]"><KeyRound size={15} className="text-[#5f6368]" />Properties for rent</a>
        </div>
      </div>
      </section>

      <AgentStatusBanner />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        <Stat icon={<Building2 size={18} />} label="Listings" value={ownListings + assigned}
          sub={`${ownListings} yours · ${assigned} assigned`} href="/agent/listings" />
        <Stat icon={<KeyRound size={18} />} label="Rentals" value={rentals?.total ?? 0}
          sub={`${(rentals?.items ?? []).filter((r) => r.status === 'available').length} open to tenants`} href="/agent/rentals" />
        <Stat icon={<Users size={18} />} label="New leads" value={newLeads.length} sub={`${thisWeek} this week`} href="/agent/leads" accent={newLeads.length > 0} />
        <Stat icon={<MessageSquare size={18} />} label="Unread messages" value={unread?.count ?? 0} href="/agent/messages" accent={(unread?.count ?? 0) > 0} />
        <Stat icon={<Handshake size={18} />} label="Active partners" value={partners?.meta.total ?? 0} href="/agent/partners" />
        <Stat icon={<Star size={18} />} label="Rating" value={me?.ratingCount ? me.ratingAverage.toFixed(1) : '—'}
          sub={me?.ratingCount ? `${me.ratingCount} review${me.ratingCount === 1 ? '' : 's'}` : 'No reviews yet'} href="/agent/reviews" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Website */}
        <section className={card}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1967d2]"><Globe size={19} /></span>
              <div>
                <h2 className="text-[18px] font-normal text-[#202124]">Your website</h2>
                {site?.url ? (
                  <a href={site.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[14px] text-[#1a73e8] hover:underline">
                    {site.url.replace(/^https?:\/\//, '')} <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <p className="text-[14px] text-[#5f6368]">{site ? 'Not live yet' : 'Loading…'}</p>
                )}
                {site?.url && !site.customDomain && (
                  <p className="mt-0.5 text-[12.5px] text-[#5f6368]">On your free e-resi address. Add your own domain, like www.youragency.co.ke.</p>
                )}
              </div>
            </div>
            {site?.url && <span className="shrink-0 rounded-full bg-[#e6f4ea] px-3 py-1 text-[12.5px] font-medium text-[#188038]">Live</span>}
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[#e8eaed] bg-[#e8eaed]">
            <div className="bg-white px-4 py-3">
              <dt className="text-[12.5px] text-[#5f6368]">Template</dt>
              <dd className="mt-0.5 truncate text-[15px] text-[#202124]">{currentTemplate?.name ?? '—'}</dd>
            </div>
            <div className="bg-white px-4 py-3">
              <dt className="text-[12.5px] text-[#5f6368]">Website leads (30 days)</dt>
              <dd className="mt-0.5 text-[15px] text-[#202124]">{siteLeads}</dd>
            </div>
            <div className="bg-white px-4 py-3">
              <dt className="text-[12.5px] text-[#5f6368]">Newsletter</dt>
              <dd className="mt-0.5 text-[15px] text-[#202124]">{subscribers} subscriber{subscribers === 1 ? '' : 's'}</dd>
            </div>
          </dl>

          {!site?.url && site && (
            <p className="mt-4 rounded-2xl bg-[#f8f9fa] px-4 py-3 text-[14px] text-[#3c4043]">
              Claim your e-resi address to put your listings, reviews, viewing bookings and chat on a site of your own.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/agent/website" className="rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc]">
              {site?.url ? 'Edit website' : 'Set up website'}
            </Link>
            <Link href="/agent/website/content" className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">Site content</Link>
            <a href="/site/agent-preview" target="_blank" rel="noreferrer" className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">Preview</a>
            {site?.url && !site.customDomain && (
              <Link href="/agent/website#domain" className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">Connect your domain</Link>
            )}
          </div>
        </section>

        {/* Set-up checklist, or upcoming viewings once everything is done */}
        {loaded && left.length > 0 ? (
          <section className={card}>
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-normal text-[#202124]">Getting set up</h2>
              <span className="text-[13px] text-[#5f6368]">{steps.length - left.length} of {steps.length} done</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f1f3f4]">
              <div className="h-full rounded-full bg-[#1a73e8] transition-[width]" style={{ width: `${((steps.length - left.length) / steps.length) * 100}%` }} />
            </div>
            <ul className="mt-4 space-y-1">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className={cn('flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors', s.done ? 'pointer-events-none' : 'hover:bg-[#f8f9fa]')}>
                    <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', s.done ? 'border-[#188038] bg-[#188038] text-white' : 'border-[#dadce0]')}>
                      {s.done && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-[14.5px]', s.done ? 'text-[#80868b] line-through' : 'text-[#202124]')}>{s.label}</span>
                      {!s.done && <span className="block text-[12.5px] text-[#5f6368]">{s.hint}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <Viewings viewings={viewings} />
        )}
      </div>

      {loaded && left.length > 0 && viewings.length > 0 && <Viewings viewings={viewings} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-normal text-[#202124]">Recent leads</h2>
            <Link href="/agent/leads" className="text-[14px] font-medium text-[#1a73e8] hover:text-[#1765cc]">View all</Link>
          </div>
          {!recent.length ? (
            <p className="py-6 text-center text-[14px] text-[#5f6368]">
              {leadsData ? 'No leads yet. Messages, viewing bookings and valuation requests from your website land here.' : 'Loading…'}
            </p>
          ) : (
            <ul className="divide-y divide-[#f1f3f4]">
              {recent.map((l) => (
                <li key={`${l.kind}-${l.id}`}>
                  <Link href="/agent/leads" className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-[#202124]">{l.name}</span>
                      <span className="block truncate text-[13px] text-[#5f6368]">{l.sourceLabel}{l.property ? ` · ${l.property.name}` : ''}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium', isNew(l) ? 'bg-[#e8f0fe] text-[#1967d2]' : 'bg-[#f1f3f4] text-[#5f6368]')}>
                        {STATUS_LABEL[l.status] ?? l.status}
                      </span>
                      <span className="text-[12px] text-[#80868b]">{relDate(l.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-normal text-[#202124]">Recently assigned</h2>
            <Link href="/agent/properties" className="text-[14px] font-medium text-[#1a73e8] hover:text-[#1765cc]">View all</Link>
          </div>
          {!assignments?.data.length ? (
            <p className="py-6 text-center text-[14px] text-[#5f6368]">
              No developments assigned yet. Partner with a developer to start selling their units.
            </p>
          ) : (
            <ul className="divide-y divide-[#f1f3f4]">
              {assignments.data.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-[#202124]">{a.property.name}</p>
                    <p className="truncate text-[13px] text-[#5f6368]">{a.partnership.developer.companyName} · {a.property.city}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#e8f0fe] px-3 py-1 text-[13px] font-medium text-[#1967d2]">
                    {a.effectiveCommission != null ? `${a.effectiveCommission}%` : 'No rate set'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[18px] font-normal text-[#202124]"><KeyRound size={18} className="text-[#5f6368]" /> Your rentals</h2>
          <div className="flex items-center gap-4">
            <Link href="/agent/rentals/new" className="text-[14px] font-medium text-[#1a73e8] hover:text-[#1765cc]">List a rental</Link>
            <Link href="/agent/rentals" className="text-[14px] text-[#5f6368] hover:text-[#202124]">View all</Link>
          </div>
        </div>
        {!rentals?.items.length ? (
          <p className="py-6 text-center text-[14px] text-[#5f6368]">
            No rentals yet. Let units on your own developments, or ones a developer assigned you for letting.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rentals.items.map((r) => {
              const open = r.units.reduce((n, u) => n + (u.available ?? 0), 0);
              return (
                <li key={r.id}>
                  <Link href={`/agent/rentals/${r.slug}`} className="flex gap-3 rounded-2xl border border-[#f1f3f4] p-3 hover:bg-[#f8f9fa]">
                    <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f1f3f4]">
                      {r.heroImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.heroImageUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-medium text-[#202124]">{r.name}</p>
                      <p className="truncate text-[13px] text-[#5f6368]">
                        {r.priceFrom ? `From ${formatPrice(r.priceFrom, r.currency)}/mo` : 'Rent on request'}
                      </p>
                      <p className="text-[12.5px] text-[#80868b]">{open} unit{open === 1 ? '' : 's'} open · {r.status}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Viewings({ viewings }: { viewings: LeadRow[] }) {
  return (
    <section className={card}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[18px] font-normal text-[#202124]"><CalendarDays size={18} className="text-[#5f6368]" /> Upcoming viewings</h2>
        <Link href="/agent/website" className="text-[13px] text-[#5f6368] hover:text-[#202124]">Viewing hours</Link>
      </div>
      {!viewings.length ? (
        <p className="py-6 text-center text-[14px] text-[#5f6368]">No viewings booked. Visitors book open times straight from your website.</p>
      ) : (
        <ul className="divide-y divide-[#f1f3f4]">
          {viewings.slice(0, 5).map((v) => {
            const at = new Date(v.slotAt!);
            return (
              <li key={v.id} className="flex items-center gap-3 py-3">
                <span className="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-[#f8f9fa] py-1.5">
                  <span className="text-[11px] font-medium uppercase text-[#5f6368]">{at.toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', month: 'short' })}</span>
                  <span className="text-[19px] leading-tight text-[#202124]">{at.toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', day: 'numeric' })}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-[#202124]">{v.name}</span>
                  <span className="block truncate text-[13px] text-[#5f6368]">
                    {at.toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi', weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                    {v.interest?.includes('Video') ? ' · Video call' : ''}{v.property ? ` · ${v.property.name}` : ''}
                  </span>
                </span>
                {v.phone && (
                  <span className="flex shrink-0 gap-1">
                    <a href={`tel:${v.phone}`} aria-label={`Call ${v.name}`} className="flex h-9 w-9 items-center justify-center rounded-full text-[#1a73e8] hover:bg-[#e8f0fe]"><Phone size={16} /></a>
                    <a href={waLink(v.phone)} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${v.name}`} className="flex h-9 w-9 items-center justify-center rounded-full text-[#188038] hover:bg-[#e6f4ea]"><MessageSquare size={16} /></a>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Stat({
  icon, label, value, href, sub, accent = false,
}: {
  icon: React.ReactNode; label: string; value: number | string; href: string; sub?: string; accent?: boolean;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-[#dadce0] bg-white p-3.5 transition-colors hover:bg-[#f8f9fa] sm:rounded-3xl sm:p-5">
      <div className="flex items-center justify-between gap-2 sm:block">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9', accent ? 'bg-[#1a73e8] text-white' : 'bg-[#e8f0fe] text-[#1967d2]')}>
          {icon}
        </span>
        <p className="text-[22px] font-normal leading-none text-[#202124] sm:mt-3 sm:text-[24px]">{value}</p>
      </div>
      <p className="mt-2 text-[12.5px] text-[#5f6368] sm:mt-1 sm:text-[13px]">{label}</p>
      {sub && <p className="mt-0.5 truncate text-[11.5px] text-[#80868b] sm:text-[12px]">{sub}</p>}
    </Link>
  );
}
