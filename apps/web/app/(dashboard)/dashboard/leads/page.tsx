'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { ApiError } from '../../../../lib/api/client';
import {
  LEAD_SOURCES, LEAD_STATUSES, leadsApi,
  type LeadChannel, type LeadInput, type LeadRow, type LeadSource, type LeadStatus,
} from '../../../../lib/api/leads';
import { cn } from '../../../../lib/utils';
import { viewersApi } from '../../../../lib/api/referrals';

/**
 * Every lead in one place: inquiries and viewing requests collected from the
 * development pages, clients agents registered or referred, and people the
 * team added by hand. Each row opens where that lead is worked on.
 */

const CHANNELS: { key: 'ALL' | LeadChannel; label: string }[] = [
  { key: 'ALL', label: 'All leads' },
  { key: 'AUTOMATIC', label: 'Automatic' },
  { key: 'AGENT', label: 'From agents' },
  { key: 'MANUAL', label: 'Added by team' },
];

const CHANNEL_STYLE: Record<LeadChannel, { cls: string; icon: string; label: string }> = {
  AUTOMATIC: { cls: 'bg-[#e8f0fe] text-[#1967d2]', icon: 'bolt', label: 'Automatic' },
  AGENT: { cls: 'bg-[#fef7e0] text-[#b06000]', icon: 'handshake', label: 'Agent' },
  MANUAL: { cls: 'bg-[#e6f4ea] text-[#188038]', icon: 'person_add', label: 'Team' },
};

/** Status across the four sources, reduced to one readable scale. */
const STATUS_LABEL: Record<string, string> = {
  NEW: 'New', READ: 'Seen', REPLIED: 'Replied', CLOSED: 'Closed',
  PENDING: 'Requested', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
  LEAD: 'Introduced', VIEWING: 'Viewing', RESERVED: 'Reserved', SPA_SIGNED: 'SPA signed', LOST: 'Lost',
  CONTACTED: 'Contacted', QUALIFIED: 'Qualified', NEGOTIATING: 'Negotiating', WON: 'Won',
  VIEWED: 'Browsing',
};
function statusTone(status: string) {
  if (['NEW', 'PENDING', 'LEAD', 'VIEWED'].includes(status)) return 'bg-[#e8f0fe] text-[#1967d2]';
  if (['WON', 'COMPLETED', 'SPA_SIGNED', 'RESERVED', 'CONFIRMED'].includes(status)) return 'bg-[#e6f4ea] text-[#188038]';
  if (['LOST', 'CANCELLED', 'CLOSED'].includes(status)) return 'bg-[#f1f3f4] text-[#5f6368]';
  return 'bg-[#fef7e0] text-[#b06000]';
}

function hrefFor(l: LeadRow, agent = false): string | null {
  const root = agent ? '/agent' : '/dashboard';
  if (l.kind === 'INQUIRY') return `${root}/inquiries`;
  if (l.kind === 'BOOKING') return `${root}/bookings`;
  if (l.kind === 'AGENT_DEAL') return `${root}/deals/${l.id}`;
  return null;
}

/** In the agent portal, "agent" leads are the agent's own referrals. */
const AGENT_LABELS: Record<string, string> = { AGENT: 'Your referrals', MANUAL: 'Added by you' };

function relDate(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: days > 300 ? 'numeric' : undefined });
}

function csvCell(v: unknown) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function LeadsPage() {
  const router = useRouter();
  // Same page serves the agent portal (/agent/leads) for agent-owned listings.
  const agentPortal = (usePathname() ?? '').startsWith('/agent');
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['leads'], queryFn: leadsApi.list });
  const [channel, setChannel] = useState<'ALL' | LeadChannel>('ALL');
  const [q, setQ] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [editing, setEditing] = useState<LeadRow | 'new' | null>(null);
  const [capturing, setCapturing] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState('');

  /** Turn someone who only browsed into a lead (an inquiry the team can reply to). */
  async function capture(l: LeadRow) {
    if (!l.viewer) return;
    setCapturing(l.id);
    setCaptureError('');
    try {
      await viewersApi.capture(l.viewer.userId, l.viewer.propertyId);
      await qc.invalidateQueries({ queryKey: ['leads'] });
    } catch (e) {
      setCaptureError(e instanceof Error ? e.message : 'Could not save this person as a lead.');
    } finally {
      setCapturing(null);
    }
  }

  const leads = useMemo(() => data?.leads ?? [], [data]);
  const properties = data?.properties ?? [];

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) =>
      (channel === 'ALL' || l.channel === channel)
      && (!propertyId || l.property?.id === propertyId)
      && (!needle || [l.name, l.email, l.phone, l.property?.name, l.agent?.displayName, l.sourceLabel]
        .some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [leads, channel, q, propertyId]);

  const weekAgo = Date.now() - 7 * 86_400_000;
  const counts = {
    ALL: leads.length,
    AUTOMATIC: leads.filter((l) => l.channel === 'AUTOMATIC').length,
    AGENT: leads.filter((l) => l.channel === 'AGENT').length,
    MANUAL: leads.filter((l) => l.channel === 'MANUAL').length,
    week: leads.filter((l) => new Date(l.createdAt).getTime() >= weekAgo).length,
  };

  function exportCsv() {
    const head = ['Name', 'Email', 'Phone', 'Channel', 'Source', 'Development', 'Status', 'Agent', 'Added by', 'Interest', 'Budget', 'Message / notes', 'Date'];
    const rows = shown.map((l) => [
      l.name, l.email, l.phone, CHANNEL_STYLE[l.channel].label, l.sourceLabel, l.property?.name, STATUS_LABEL[l.status] ?? l.status,
      l.agent?.displayName, l.addedBy, l.interest, l.budget, l.message, new Date(l.createdAt).toISOString().slice(0, 10),
    ]);
    const csv = [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Leads</h1>
          <p className="max-w-[70ch] text-[14px] text-[#5f6368]">
            {agentPortal
              ? 'Everyone interested in the developments you list: buyers who opened your pages, inquiries and viewing requests, plus the clients you referred or registered elsewhere, and people you added.'
              : 'Everyone interested in your developments: signed-in buyers who opened your pages, inquiries and viewing requests, clients agents brought you, and people your team added.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} disabled={!shown.length}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#3c4043] transition-colors hover:bg-[#f1f3f4] disabled:opacity-50">
            <MaterialIcon name="download" size={17} /> Export
          </button>
          <button type="button" onClick={() => setEditing('new')}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]">
            <MaterialIcon name="person_add" size={17} /> Add lead
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: 'All leads', value: counts.ALL, icon: 'groups' },
          { label: 'Automatic', value: counts.AUTOMATIC, icon: 'bolt' },
          { label: 'From agents', value: counts.AGENT, icon: 'handshake' },
          { label: 'Added by team', value: counts.MANUAL, icon: 'person_add' },
          { label: 'Last 7 days', value: counts.week, icon: 'trending_up' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#dadce0] bg-white px-4 py-4">
            <div className="flex items-center gap-2 text-[13px] text-[#5f6368]"><MaterialIcon name={s.icon} size={17} />{s.label}</div>
            <p className="mt-2 text-[28px] font-normal leading-none text-[#202124] tabular-nums">{isLoading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {CHANNELS.map((c) => (
          <button key={c.key} type="button" onClick={() => setChannel(c.key)} aria-pressed={channel === c.key}
            className={cn('cursor-pointer rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors',
              channel === c.key ? 'border-[#202124] bg-[#202124] text-white' : 'border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]')}>
            {(agentPortal && AGENT_LABELS[c.key]) || c.label}<span className="ml-1.5 tabular-nums opacity-60">{counts[c.key]}</span>
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          {properties.length > 1 && (
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} aria-label="Filter by development"
              className="h-9 rounded-full border border-[#dadce0] bg-white px-3 text-[13px] text-[#3c4043] outline-none focus:border-[#1a73e8]">
              <option value="">All developments</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <label className="flex h-9 items-center gap-2 rounded-full border border-[#dadce0] bg-white px-3 focus-within:border-[#1a73e8]">
            <MaterialIcon name="search" size={17} className="text-[#80868b]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email, agent"
              className="w-56 bg-transparent text-[13px] text-[#202124] outline-none placeholder:text-[#9aa0a6]" />
          </label>
        </div>
      </div>

      {captureError && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{captureError}</p>}

      {/* List */}
      <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
        <div className="hidden grid-cols-[1.6fr_1.3fr_1fr_0.8fr_0.9fr] gap-4 border-b border-[#f1f3f4] bg-[#f8f9fa] px-5 py-2.5 text-[12px] font-medium text-[#5f6368] md:grid">
          <span>Lead</span><span>Source</span><span>Development</span><span>Status</span><span className="text-right">Received</span>
        </div>
        {isLoading ? (
          <p className="px-5 py-16 text-center text-[14px] text-[#5f6368]">Loading leads…</p>
        ) : isError ? (
          <p className="px-5 py-16 text-center text-[14px] text-[#c5221f]">Leads couldn&apos;t be loaded. Refresh to try again.</p>
        ) : shown.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <MaterialIcon name="person_search" size={30} className="text-[#9aa0a6]" />
            <p className="mt-2 text-[15px] text-[#202124]">{leads.length ? 'No leads match these filters.' : 'No leads yet'}</p>
            {!leads.length && (
              <p className="mx-auto mt-1 max-w-md text-[13.5px] text-[#5f6368]">
                Inquiries and viewing requests from your pages appear here automatically. Add walk-ins, calls and event contacts with Add lead.
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[#f1f3f4]">
            {shown.map((l) => {
              const ch = CHANNEL_STYLE[l.channel];
              const href = hrefFor(l, agentPortal);
              const open = () => (href ? router.push(href) : setEditing(l));
              const isViewer = l.kind === 'VIEWER';
              const Row = isViewer ? 'div' : 'button';
              return (
                <li key={`${l.kind}-${l.id}`}>
                  <Row {...(isViewer ? {} : { type: 'button' as const, onClick: open })}
                    className={cn('grid w-full grid-cols-1 gap-2 px-5 py-3.5 text-left transition-colors hover:bg-[#f8f9fa] md:grid-cols-[1.6fr_1.3fr_1fr_0.8fr_0.9fr] md:items-center md:gap-4', !isViewer && 'cursor-pointer')}>
                    <span className="min-w-0">
                      <span className="block truncate text-[14.5px] font-medium text-[#202124]">{l.name}</span>
                      <span className="block truncate text-[12.5px] text-[#5f6368]">{[l.phone, l.email].filter(Boolean).join(' · ') || 'No contact details'}</span>
                    </span>
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium', ch.cls)}>
                        <MaterialIcon name={ch.icon} size={13} />{agentPortal && l.channel === 'AGENT' ? 'Referral' : agentPortal && l.channel === 'MANUAL' ? 'You' : ch.label}
                      </span>
                      <span className="truncate text-[12.5px] text-[#3c4043]">
                        {l.sourceLabel}{l.agent ? ` · ${l.agent.displayName}` : ''}{l.addedBy ? ` · by ${l.addedBy}` : ''}
                      </span>
                    </span>
                    <span className="truncate text-[13px] text-[#3c4043]">{l.property?.name ?? <span className="text-[#9aa0a6]">Not set</span>}</span>
                    <span><span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium', statusTone(l.status))}>{STATUS_LABEL[l.status] ?? l.status}</span></span>
                    <span className="flex items-center justify-between gap-2 text-[12.5px] text-[#5f6368] md:justify-end">
                      {relDate(l.createdAt)}
                      {isViewer ? (
                        <button type="button" onClick={() => capture(l)} disabled={capturing === l.id}
                          className="cursor-pointer rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[12.5px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] disabled:opacity-50">
                          {capturing === l.id ? 'Saving…' : 'Save as lead'}
                        </button>
                      ) : (
                        <MaterialIcon name={href ? 'open_in_new' : 'edit'} size={15} className="text-[#9aa0a6]" />
                      )}
                    </span>
                  </Row>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <LeadDrawer
          lead={editing === 'new' ? null : editing}
          properties={properties}
          onClose={() => setEditing(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['leads'] }); setEditing(null); }}
        />
      )}
    </div>
  );
}

const field = 'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[14px] text-[#202124] outline-none placeholder:text-[#9aa0a6] focus:border-[#1a73e8]';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';

/** Add a lead, or edit / delete a hand-added one, in a right-hand panel. */
function LeadDrawer({
  lead, properties, onClose, onSaved,
}: {
  lead: LeadRow | null;
  properties: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: lead?.name ?? '',
    phone: lead?.phone ?? '',
    email: lead?.email ?? '',
    propertyId: lead?.property?.id ?? (properties.length === 1 ? properties[0].id : ''),
    source: (lead?.source ?? 'WALK_IN') as LeadSource,
    status: ((lead?.status as LeadStatus) ?? 'NEW') as LeadStatus,
    interest: lead?.interest ?? '',
    budget: lead?.budget != null ? String(lead.budget) : '',
    notes: lead?.message ?? '',
  });
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: async () => {
      const budget = form.budget.trim() ? Number(form.budget.replace(/[,\s]/g, '')) : undefined;
      if (budget !== undefined && (!Number.isFinite(budget) || budget < 0)) throw new Error('Budget must be a number.');
      const body: LeadInput = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        propertyId: form.propertyId || undefined,
        source: form.source,
        status: form.status,
        interest: form.interest.trim() || undefined,
        budget,
        notes: form.notes.trim() || undefined,
      };
      return lead ? leadsApi.update(lead.id, body) : leadsApi.create(body);
    },
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof ApiError || e instanceof Error ? e.message : 'Could not save the lead.'),
  });
  const remove = useMutation({
    mutationFn: () => leadsApi.remove(lead!.id),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not delete the lead.'),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Add the lead’s name.');
    if (!form.phone.trim() && !form.email.trim()) return setError('Add a phone number or an email so the team can reach them.');
    save.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={lead ? 'Edit lead' : 'Add lead'}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/30" />
      <form onSubmit={submit} className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#f1f3f4] px-6 py-4">
          <div>
            <h2 className="text-[18px] font-normal text-[#202124]">{lead ? 'Edit lead' : 'Add a lead'}</h2>
            <p className="text-[12.5px] text-[#5f6368]">{lead?.addedBy ? `Added by ${lead.addedBy}` : 'Walk-ins, calls, events and referrals.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]">
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label className={labelCls} htmlFor="lead-name">Name *</label>
            <input id="lead-name" className={field} value={form.name} onChange={set('name')} maxLength={100} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="lead-phone">Phone</label>
              <input id="lead-phone" className={field} value={form.phone} onChange={set('phone')} placeholder="+254…" />
            </div>
            <div>
              <label className={labelCls} htmlFor="lead-email">Email</label>
              <input id="lead-email" type="email" className={field} value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="lead-property">Development</label>
            <select id="lead-property" className={field} value={form.propertyId} onChange={set('propertyId')}>
              <option value="">Not decided yet</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="lead-source">Where from</label>
              <select id="lead-source" className={field} value={form.source} onChange={set('source')}>
                {LEAD_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="lead-status">Status</label>
              <select id="lead-status" className={field} value={form.status} onChange={set('status')}>
                {LEAD_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="lead-interest">Looking for</label>
              <input id="lead-interest" className={field} value={form.interest} onChange={set('interest')} placeholder="2 bed, high floor" maxLength={200} />
            </div>
            <div>
              <label className={labelCls} htmlFor="lead-budget">Budget</label>
              <input id="lead-budget" inputMode="numeric" className={field} value={form.budget} onChange={set('budget')} placeholder="15,000,000" />
            </div>
          </div>
          {form.budget.trim() && Number.isFinite(Number(form.budget.replace(/[,\s]/g, ''))) && (
            <p className="-mt-2 text-[12px] text-[#5f6368]">{Number(form.budget.replace(/[,\s]/g, '')).toLocaleString()}</p>
          )}
          <div>
            <label className={labelCls} htmlFor="lead-notes">Notes</label>
            <textarea id="lead-notes" rows={4} className={cn(field, 'resize-none')} value={form.notes} onChange={set('notes')} maxLength={2000}
              placeholder="What they said, when to follow up…" />
          </div>
          {error && <p className="rounded-xl bg-[#fce8e6] px-4 py-2.5 text-[13.5px] text-[#c5221f]">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[#f1f3f4] px-6 py-4">
          {lead ? (
            confirmDelete ? (
              <span className="flex items-center gap-2 text-[13px] text-[#5f6368]">
                Delete this lead?
                <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending} className="cursor-pointer font-medium text-[#c5221f] hover:underline">Delete</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="cursor-pointer hover:underline">Keep</button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex cursor-pointer items-center gap-1 text-[13px] text-[#c5221f] hover:underline">
                <MaterialIcon name="delete" size={16} /> Delete
              </button>
            )
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-full px-4 py-2 text-[14px] font-medium text-[#3c4043] hover:bg-[#f1f3f4]">Cancel</button>
            <button type="submit" disabled={save.isPending}
              className="cursor-pointer rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50">
              {save.isPending ? 'Saving…' : lead ? 'Save changes' : 'Add lead'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
