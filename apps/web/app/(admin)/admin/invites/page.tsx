'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { Pagination } from '../../../../components/ui/Pagination';
import {
  invitesAdminApi, type CreateInviteInput, type InviteKind, type InviteState, type PartnerInvite,
} from '../../../../lib/api/invites';
import { ApiError } from '../../../../lib/api/client';
import { uploadFile } from '../../../../lib/api/media';
import { cn } from '../../../../lib/utils';

/**
 * Personal invites for agents and developers.
 *
 * Each invite is one named person or company, a note written to them and
 * the team member who will share the link. Signing up through the link
 * skips verification and activates their free website, so the list shows
 * exactly which invites were opened, which converted and who sent them.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const field = 'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[14px] text-[#202124] outline-none placeholder:text-[#9aa0a6] focus:border-[#1a73e8]';
const label = 'mb-1.5 block text-[13px] font-medium text-[#3c4043]';
const pill = (on: boolean) => cn(
  'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer',
  on ? 'bg-[#202124] text-white' : 'bg-[#f1f3f4] text-[#3c4043] hover:bg-[#e8eaed]',
);

const STATE_STYLE: Record<InviteState, string> = {
  pending: 'bg-[#f1f3f4] text-[#5f6368]',
  opened: 'bg-[#fef7e0] text-[#b06000]',
  signed_up: 'bg-[#e6f4ea] text-[#188038]',
  revoked: 'bg-[#fce8e6] text-[#c5221f]',
};
const STATE_LABEL: Record<InviteState, string> = { pending: 'Not opened', opened: 'Opened', signed_up: 'Signed up', revoked: 'Revoked' };

function suggestMessage(kind: InviteKind, name: string, contact: string, agentKind: 'COMPANY' | 'INDIVIDUAL' = 'COMPANY') {
  const hi = contact.trim() ? `Hi ${contact.trim().split(' ')[0]},` : 'Hello,';
  if (kind === 'DEVELOPER') {
    return `${hi}\n\nAs one of the leading property developers in the market, we would like to invite you to sell your developments faster on e-resi.\n\nEvery development gets its own branded website in seconds, with 3D and VR tours buyers can walk through from anywhere, live guided tours, chat and document sharing, and every interested buyer delivered to you as a lead with full details. Sell off-plan, before a single brick is laid.\n\nNo commissions. 100% free to start. Your account is already approved — just complete the signup below.`;
  }
  const who = agentKind === 'INDIVIDUAL' ? 'property agents' : 'property agencies';
  return `${hi}\n\nAs one of the leading ${who} in the market, we would like to invite you to increase your sales and lettings on e-resi.\n\nThis is not another listing site. You get your own premium website in seconds, every property you sell or let ready to share with one link, and every person who opens it turned into a lead with their full details — plus developer partnerships and discovery across e-resi.\n\nNo commissions. 100% free to start. Your account is already approved — just complete the signup below.`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

// ─── Create form ──────────────────────────────────────────────────────────

const EMPTY: CreateInviteInput = { kind: 'AGENT', agentKind: 'COMPANY', name: '', contactName: '', email: '', phone: '', logoUrl: '', message: '', referrer: '', notes: '' };

function CreateInvite({ onCreated, lastReferrer }: { onCreated: (inv: PartnerInvite) => void; lastReferrer: string }) {
  const [form, setForm] = useState<CreateInviteInput>({ ...EMPTY, referrer: lastReferrer });
  const [touchedMessage, setTouchedMessage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof CreateInviteInput>(k: K, v: CreateInviteInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Keep the suggested note in step with the name until it is edited by hand.
  useEffect(() => {
    if (!touchedMessage) setForm((f) => ({ ...f, message: suggestMessage(f.kind, f.name, f.contactName ?? '', f.agentKind) }));
  }, [form.kind, form.agentKind, form.name, form.contactName, touchedMessage]);

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr('');
    try {
      const up = await uploadFile(file, 'logos');
      set('logoUrl', up.url);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const create = useMutation({
    mutationFn: () => invitesAdminApi.create({
      ...form,
      contactName: form.contactName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      logoUrl: form.logoUrl || undefined,
      notes: form.notes || undefined,
      agentKind: form.kind === 'AGENT' ? form.agentKind : undefined,
    }),
    onSuccess: (inv) => {
      onCreated(inv);
      setForm({ ...EMPTY, referrer: form.referrer });
      setTouchedMessage(false);
      setErr('');
    },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Could not create the invite'),
  });

  const ready = form.name.trim().length >= 2 && form.referrer.trim().length >= 2 && form.message.trim().length >= 10;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (ready) create.mutate(); }} className={cn(card, 'p-6')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-normal text-[#202124]">New personal invite</h2>
        <div className="flex gap-2">
          {(['AGENT', 'DEVELOPER'] as const).map((k) => (
            <button key={k} type="button" onClick={() => set('kind', k)} className={pill(form.kind === k)}>
              {k === 'AGENT' ? 'Agent / agency' : 'Property developer'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          {form.kind === 'AGENT' && (
            <div>
              <span className={label}>They are</span>
              <div className="flex gap-2">
                {([['COMPANY', 'An agency / company'], ['INDIVIDUAL', 'An individual agent']] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set('agentKind', v)} className={pill(form.agentKind === v)}>{l}</button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={label} htmlFor="inv-name">{form.kind === 'AGENT' ? (form.agentKind === 'COMPANY' ? 'Agency name' : 'Agent’s trading name') : 'Developer / company name'}</label>
            <input id="inv-name" className={field} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={form.kind === 'AGENT' ? 'Bora Property Agents' : 'Pristine Developments Ltd'} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="inv-contact">Contact person</label>
              <input id="inv-contact" className={field} value={form.contactName ?? ''} onChange={(e) => set('contactName', e.target.value)} placeholder="Asha Mwangi" />
            </div>
            <div>
              <label className={label} htmlFor="inv-referrer">Shared by (team member)</label>
              <input id="inv-referrer" className={field} value={form.referrer} onChange={(e) => set('referrer', e.target.value)} placeholder="David" required />
            </div>
            <div>
              <label className={label} htmlFor="inv-email">Email <span className="font-normal text-[#80868b]">(prefills signup)</span></label>
              <input id="inv-email" type="email" className={field} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="asha@bora.co.ke" />
            </div>
            <div>
              <label className={label} htmlFor="inv-phone">Phone</label>
              <input id="inv-phone" className={field} value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+254712345678" />
            </div>
          </div>

          <div>
            <span className={label}>{form.kind === 'AGENT' && form.agentKind === 'INDIVIDUAL' ? 'Their picture' : 'Their logo'}</span>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#dadce0] bg-[#f8f9fa]">
                {form.logoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={form.logoUrl} alt="" className="h-full w-full object-cover" />
                  : <MaterialIcon name="image" size={22} className="text-[#9aa0a6]" />}
              </div>
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[13px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa] disabled:opacity-50">
                  {uploading ? 'Uploading…' : form.logoUrl ? 'Replace' : 'Upload image'}
                </button>
                {form.logoUrl && (
                  <button type="button" onClick={() => set('logoUrl', '')} className="rounded-full px-3 py-2 text-[13px] text-[#5f6368] hover:bg-[#f1f3f4]">Remove</button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className={label} htmlFor="inv-notes">Private notes <span className="font-normal text-[#80868b]">(team only)</span></label>
            <input id="inv-notes" className={field} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} placeholder="Met at the Nairobi expo, follow up Friday" />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[13px] font-medium text-[#3c4043]" htmlFor="inv-message">Personal message</label>
            <button type="button" onClick={() => { setTouchedMessage(false); set('message', suggestMessage(form.kind, form.name, form.contactName ?? '', form.agentKind)); }}
              className="text-[12.5px] font-medium text-[#1a73e8] hover:underline">Reset to suggested</button>
          </div>
          <textarea id="inv-message" className={cn(field, 'min-h-[260px] flex-1 resize-y leading-relaxed')} value={form.message}
            onChange={(e) => { setTouchedMessage(true); set('message', e.target.value); }} />
          <p className="mt-1.5 text-[12.5px] text-[#80868b]">Shown on their welcome page under their name and logo. Acknowledge their work, then say how e-resi makes selling easier.</p>
        </div>
      </div>

      {err && <p className="mt-4 text-[13px] text-[#c5221f]">{err}</p>}

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#f1f3f4] pt-5">
        <button type="submit" disabled={!ready || create.isPending}
          className="rounded-full bg-[#1a73e8] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40">
          {create.isPending ? 'Creating…' : 'Create invite link'}
        </button>
      </div>
    </form>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────

function Row({ inv }: { inv: PartnerInvite }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-invites'] }); qc.invalidateQueries({ queryKey: ['admin-invites-stats'] }); };
  const revoke = useMutation({
    mutationFn: () => invitesAdminApi.update(inv.id, { status: inv.status === 'REVOKED' ? 'ACTIVE' : 'REVOKED' }),
    onSuccess: refresh, onError: (e) => setErr(e instanceof ApiError ? e.message : 'Failed'),
  });
  const remove = useMutation({
    mutationFn: () => invitesAdminApi.remove(inv.id),
    onSuccess: refresh, onError: (e) => setErr(e instanceof ApiError ? e.message : 'Failed'),
  });
  const profileHref = inv.signedUpUser?.agentProfileId
    ? `/admin/agents/${inv.signedUpUser.agentProfileId}`
    : inv.signedUpUser?.developerProfileId ? `/admin/developers/${inv.signedUpUser.developerProfileId}` : null;

  return (
    <li className="grid gap-3 px-5 py-4 lg:grid-cols-[2fr_1fr_1fr_1.2fr_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e8eaed] bg-[#f8f9fa]">
          {inv.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={inv.logoUrl} alt="" className="h-full w-full object-cover" />
            : <span className="text-[15px] font-medium text-[#5f6368]">{inv.name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] text-[#202124]">{inv.name}</p>
          <p className="truncate text-[12.5px] text-[#5f6368]">
            {inv.kind === 'AGENT' ? (inv.agentKind === 'COMPANY' ? 'Agency' : 'Individual agent') : 'Developer'}
            {inv.contactName && ` · ${inv.contactName}`}
            {inv.email && ` · ${inv.email}`}
          </p>
        </div>
      </div>
      <div className="text-[13.5px] text-[#3c4043]"><span className="text-[#80868b] lg:hidden">Shared by </span>{inv.referrer}</div>
      <div>
        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium', STATE_STYLE[inv.state])}>{STATE_LABEL[inv.state]}</span>
        {inv.openCount > 0 && <span className="ml-2 text-[12px] text-[#80868b]">{inv.openCount} open{inv.openCount === 1 ? '' : 's'}</span>}
      </div>
      <div className="text-[12.5px] text-[#5f6368]">
        {inv.signedUpUser && profileHref ? (
          <Link href={profileHref} className="text-[#1a73e8] hover:underline">{inv.signedUpUser.name} · {fmtDate(inv.signedUpAt)}</Link>
        ) : (
          <>Created {fmtDate(inv.createdAt)}{inv.openedAt && ` · opened ${fmtDate(inv.openedAt)}`}</>
        )}
        {err && <p className="text-[#c5221f]">{err}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" onClick={async () => { if (await copy(inv.url)) { setCopied(true); setTimeout(() => setCopied(false), 1500); } }}
          className="inline-flex items-center gap-1 rounded-full border border-[#dadce0] px-3 py-1.5 text-[12.5px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">
          <MaterialIcon name={copied ? 'check' : 'link'} size={15} /> {copied ? 'Copied' : 'Copy link'}
        </button>
        <a href={inv.url} target="_blank" rel="noreferrer" className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4]" aria-label="Open the invite page"><MaterialIcon name="open_in_new" size={17} /></a>
        {!inv.signedUpAt && (
          <button type="button" onClick={() => revoke.mutate()} disabled={revoke.isPending} className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4]" aria-label={inv.status === 'REVOKED' ? 'Reactivate' : 'Revoke'}>
            <MaterialIcon name={inv.status === 'REVOKED' ? 'restart_alt' : 'block'} size={17} />
          </button>
        )}
        {!inv.signedUpAt && (
          <button type="button" onClick={() => { if (confirm(`Delete the invite for ${inv.name}?`)) remove.mutate(); }} disabled={remove.isPending} className="rounded-full p-2 text-[#5f6368] hover:bg-[#fce8e6] hover:text-[#c5221f]" aria-label="Delete">
            <MaterialIcon name="delete" size={17} />
          </button>
        )}
      </div>
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className={cn(card, 'px-5 py-4')}>
      <p className="text-[12.5px] text-[#5f6368]">{label}</p>
      <p className="mt-1 text-[26px] font-normal leading-none text-[#202124]">{value}</p>
      {sub && <p className="mt-1.5 text-[12.5px] text-[#80868b]">{sub}</p>}
    </div>
  );
}

export default function AdminInvitesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [created, setCreated] = useState<PartnerInvite | null>(null);
  const [copiedNew, setCopiedNew] = useState(false);
  const [kind, setKind] = useState<InviteKind | ''>('');
  const [state, setState] = useState<InviteState | 'all'>('all');
  const [referrer, setReferrer] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data: stats } = useQuery({ queryKey: ['admin-invites-stats'], queryFn: invitesAdminApi.stats });
  const { data, isLoading } = useQuery({
    queryKey: ['admin-invites', kind, state, referrer, q, page],
    queryFn: () => invitesAdminApi.list({ kind, state, referrer, q, page, limit: 25 }),
  });
  const items = data?.data ?? [];
  const t = stats?.total;
  const conversion = t && t.created ? Math.round((t.signedUp / t.created) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Partner invites</h1>
          <p className="max-w-3xl text-[14px] text-[#5f6368]">
            Personal invitation links for agents and developers. Whoever opens one sees a welcome written to them;
            signing up through it needs no email code or documents, and their free website goes live as they join.
          </p>
        </div>
        <button type="button" onClick={() => { setShowForm((v) => !v); setCreated(null); }}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1765cc]">
          <MaterialIcon name={showForm ? 'close' : 'add'} size={18} /> {showForm ? 'Close' : 'New invite'}
        </button>
      </div>

      {created && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c8e6c9] bg-[#e6f4ea] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[#188038]">Invite for {created.name} is ready — share this link with them</p>
            <p className="truncate font-mono text-[13px] text-[#202124]">{created.url}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={async () => { if (await copy(created.url)) { setCopiedNew(true); setTimeout(() => setCopiedNew(false), 1500); } }}
              className="inline-flex items-center gap-1 rounded-full bg-[#188038] px-4 py-2 text-[13px] font-medium text-white">
              <MaterialIcon name={copiedNew ? 'check' : 'content_copy'} size={16} /> {copiedNew ? 'Copied' : 'Copy link'}
            </button>
            <a href={created.url} target="_blank" rel="noreferrer" className="rounded-full border border-[#188038]/30 px-4 py-2 text-[13px] font-medium text-[#188038]">Preview</a>
          </div>
        </div>
      )}

      {showForm && (
        <CreateInvite
          lastReferrer={stats?.referrers[0]?.referrer ?? ''}
          onCreated={(inv) => {
            setCreated(inv);
            qc.invalidateQueries({ queryKey: ['admin-invites'] });
            qc.invalidateQueries({ queryKey: ['admin-invites-stats'] });
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Invites created" value={t?.created ?? 0} sub={t ? `${stats.byKind.AGENT.created} agents · ${stats.byKind.DEVELOPER.created} developers` : undefined} />
        <Stat label="Opened" value={t?.opened ?? 0} sub={t ? `${t.opens} total opens` : undefined} />
        <Stat label="Signed up" value={t?.signedUp ?? 0} sub={t ? `${t.agents} agents · ${t.developers} developers` : undefined} />
        <Stat label="Conversion" value={`${conversion}%`} sub="signed up ÷ created" />
      </div>

      {!!stats?.referrers.length && (
        <section className={cn(card, 'overflow-hidden')}>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-[16px] font-medium text-[#202124]">By team member</h2>
            <p className="text-[12.5px] text-[#80868b]">Click a name to filter the list</p>
          </div>
          <table className="w-full text-[13.5px]">
            <thead className="bg-[#f8f9fa] text-left text-[12px] uppercase tracking-wide text-[#5f6368]">
              <tr>
                <th className="px-5 py-2 font-medium">Shared by</th>
                <th className="px-5 py-2 font-medium">Invites</th>
                <th className="px-5 py-2 font-medium">Opened</th>
                <th className="px-5 py-2 font-medium">Signed up</th>
                <th className="px-5 py-2 font-medium">Agents</th>
                <th className="px-5 py-2 font-medium">Developers</th>
                <th className="px-5 py-2 font-medium">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {stats.referrers.map((r) => (
                <tr key={r.referrer} className={cn('hover:bg-[#f8f9fa]', referrer.toLowerCase() === r.referrer.toLowerCase() && 'bg-[#e8f0fe]')}>
                  <td className="px-5 py-2.5">
                    <button type="button" className="font-medium text-[#1a73e8] hover:underline" onClick={() => { setReferrer(referrer.toLowerCase() === r.referrer.toLowerCase() ? '' : r.referrer); setPage(1); }}>{r.referrer}</button>
                  </td>
                  <td className="px-5 py-2.5 text-[#3c4043]">{r.created}</td>
                  <td className="px-5 py-2.5 text-[#3c4043]">{r.opened}</td>
                  <td className="px-5 py-2.5 font-medium text-[#188038]">{r.signedUp}</td>
                  <td className="px-5 py-2.5 text-[#3c4043]">{r.agents}</td>
                  <td className="px-5 py-2.5 text-[#3c4043]">{r.developers}</td>
                  <td className="px-5 py-2.5 text-[#3c4043]">{r.created ? Math.round((r.signedUp / r.created) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {([['', 'All'], ['AGENT', 'Agents'], ['DEVELOPER', 'Developers']] as const).map(([v, l]) => (
          <button key={v || 'all'} type="button" onClick={() => { setKind(v); setPage(1); }} className={pill(kind === v)}>{l}</button>
        ))}
        <span className="mx-1 h-5 w-px bg-[#dadce0]" />
        {([['all', 'Any state'], ['pending', 'Not opened'], ['opened', 'Opened'], ['signed_up', 'Signed up'], ['revoked', 'Revoked']] as const).map(([v, l]) => (
          <button key={v} type="button" onClick={() => { setState(v); setPage(1); }} className={pill(state === v)}>{l}</button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {referrer && (
            <button type="button" onClick={() => setReferrer('')} className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fe] px-3 py-1.5 text-[12.5px] font-medium text-[#1967d2]">
              {referrer} <MaterialIcon name="close" size={14} />
            </button>
          )}
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email or code"
            className="w-60 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[13.5px] outline-none focus:border-[#1a73e8]" />
        </div>
      </div>

      <section className={cn(card, 'overflow-hidden')}>
        <div className="hidden grid-cols-[2fr_1fr_1fr_1.2fr_auto] gap-3 bg-[#f8f9fa] px-5 py-2 text-[12px] uppercase tracking-wide text-[#5f6368] lg:grid">
          <span>Who</span><span>Shared by</span><span>Status</span><span>Signed up / dates</span><span className="w-[200px]">Link</span>
        </div>
        {isLoading ? (
          <p className="px-5 py-8 text-[14px] text-[#5f6368]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-[14px] text-[#5f6368]">No invites yet. Create one and share the link.</p>
        ) : (
          <ul className="divide-y divide-[#f1f3f4]">{items.map((inv) => <Row key={inv.id} inv={inv} />)}</ul>
        )}
      </section>
      {data && data.meta.totalPages > 1 && <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </div>
  );
}
