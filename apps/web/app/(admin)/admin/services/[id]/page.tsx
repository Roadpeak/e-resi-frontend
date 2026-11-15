'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Loader2, Plus, Send, Trash2 } from 'lucide-react';
import { ApiError } from '../../../../../lib/api/client';
import {
  money, serviceRequestsApi, STATUS_LABEL, STATUS_STYLE, type AdminServiceRequest,
} from '../../../../../lib/api/service-requests';
import { cn } from '../../../../../lib/utils';

type Line = { description: string; quantity: string; unitAmount: string };

const box = 'rounded-3xl border border-[#dadce0] bg-white p-6';
const inp = 'w-full rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] outline-none focus:border-[#1a73e8]';
const fmt = (v: string) => new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** The quote template: one line per requested service at the catalogue price, or the last quote if re-quoting. */
function templateLines(r: AdminServiceRequest): Line[] {
  if (r.quoteLines?.length) {
    return r.quoteLines.map((l) => ({ description: l.description, quantity: String(l.quantity), unitAmount: String(l.unitAmount) }));
  }
  const byKey = new Map(r.catalog.map((c) => [c.key, c]));
  const lines: Line[] = r.services.map((k) => {
    const c = byKey.get(k);
    return { description: c?.label ?? k, quantity: '1', unitAmount: c ? String(c.price) : '' };
  });
  if (r.otherService) lines.push({ description: r.otherService, quantity: '1', unitAmount: '' });
  return lines.length ? lines : [{ description: '', quantity: '1', unitAmount: '' }];
}

export default function AdminServiceRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [lines, setLines] = useState<Line[] | null>(null);
  const [validDays, setValidDays] = useState('14');
  const [notes, setNotes] = useState('');
  const [note, setNote] = useState('');

  const { data: r, isLoading } = useQuery({ queryKey: ['admin-service-request', id], queryFn: () => serviceRequestsApi.admin.get(id) });
  useEffect(() => {
    if (r && lines === null) { setLines(templateLines(r)); setNotes(r.quoteNotes ?? ''); }
  }, [r, lines]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 6000); };
  const onErr = (e: unknown) => setError(e instanceof ApiError ? e.message : 'Something went wrong');
  const put = (x: AdminServiceRequest) => {
    qc.setQueryData(['admin-service-request', id], x);
    qc.invalidateQueries({ queryKey: ['admin-service-requests'] });
  };

  const totals = useMemo(() => {
    const sub = (lines ?? []).reduce((n, l) => n + (Number(l.quantity) || 0) * (Number(l.unitAmount) || 0), 0);
    const tax = r ? Math.round(sub * (r.taxRatePercent / 100) * 100) / 100 : 0;
    return { sub, tax, total: sub + tax };
  }, [lines, r]);

  const send = useMutation({
    mutationFn: () => serviceRequestsApi.admin.sendQuote(id, {
      lines: (lines ?? []).map((l) => ({ description: l.description.trim(), quantity: Number(l.quantity), unitAmount: Number(l.unitAmount) })),
      validDays: Number(validDays) || 14,
      notes: notes.trim() || undefined,
    }),
    onSuccess: (x) => { put(x); setError(''); flash(x.emailSent === false ? `Quote ${x.quoteNumber} saved and in the customer’s account, but the email failed to send.` : `Quote ${x.quoteNumber} sent to ${x.user.email} and their account.`); },
    onError: onErr,
  });
  const move = useMutation({
    mutationFn: (status: 'IN_PRODUCTION' | 'DELIVERED' | 'DECLINED') => serviceRequestsApi.admin.setStatus(id, status, note.trim() || undefined),
    onSuccess: (x) => { put(x); setNote(''); flash(`Moved to ${STATUS_LABEL[x.status].toLowerCase()}; the customer was notified.`); },
    onError: onErr,
  });

  if (isLoading || !r || !lines) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5f6368]" /></div>;

  const quotable = r.status === 'SUBMITTED' || r.status === 'QUOTED' || r.status === 'CHANGES_REQUESTED';
  const linesValid = lines.length > 0 && lines.every((l) => l.description.trim() && Number(l.quantity) > 0 && Number(l.unitAmount) >= 0 && l.unitAmount !== '');
  const setLine = (i: number, k: keyof Line, v: string) => setLines(lines.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  return (
    <div className="space-y-5">
      <Link href="/admin/services" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1a73e8]"><ArrowLeft size={16} /> Service requests</Link>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-medium text-[#202124]">{r.number}</h1>
        <span className={cn('rounded-full px-3 py-1 text-[13px] font-medium', STATUS_STYLE[r.status])}>{STATUS_LABEL[r.status]}</span>
        {r.status === 'SUBMITTED' && <span className="text-[13.5px] text-[#5f6368]">Quote promised by {fmt(r.quoteDueBy)}</span>}
      </header>
      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}
      {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Customer change request */}
          {r.status === 'CHANGES_REQUESTED' && r.changeRequest && (
            <div className="rounded-3xl bg-[#fef7e0] p-5 text-[14px] text-[#3c4043]">
              <p className="font-medium text-[#b06000]">The customer asked for changes</p>
              <p className="mt-1 whitespace-pre-line">{r.changeRequest}</p>
            </div>
          )}

          {/* Quote template / composer */}
          <section className={box}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-medium text-[#202124]">{r.quoteNumber ? `Quote ${r.quoteNumber}` : 'Quote'}</h2>
                <p className="mt-0.5 text-[13px] text-[#5f6368]">
                  {r.quoteNumber ? `Sent ${r.quotedAt ? fmt(r.quotedAt) : ''} · version ${r.quoteVersion}` : 'Pre-filled with the requested services at catalogue prices. Adjust and send.'}
                </p>
              </div>
              {r.quoteNumber && (
                <button type="button" onClick={() => serviceRequestsApi.admin.downloadQuote(r).catch(() => setError('Could not download the PDF'))}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] px-3.5 py-1.5 text-[13.5px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">
                  <Download size={15} /> PDF
                </button>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <div className="hidden grid-cols-[1fr_80px_130px_110px_32px] gap-2 px-1 text-[12px] font-medium text-[#5f6368] sm:grid">
                <span>Description</span><span>Qty</span><span>Unit price ({r.currency})</span><span className="text-right">Amount</span><span />
              </div>
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px] gap-2 sm:grid-cols-[1fr_80px_130px_110px_32px] sm:items-center">
                  <input disabled={!quotable} className={cn(inp, 'col-span-2 sm:col-span-1')} placeholder="e.g. Drone photography — 20 edited stills" value={l.description} onChange={(e) => setLine(i, 'description', e.target.value)} />
                  <input disabled={!quotable} type="number" min={0} step="any" className={inp} value={l.quantity} onChange={(e) => setLine(i, 'quantity', e.target.value)} />
                  <input disabled={!quotable} type="number" min={0} step="any" className={inp} placeholder="0" value={l.unitAmount} onChange={(e) => setLine(i, 'unitAmount', e.target.value)} />
                  <span className="text-right text-[14px] tabular-nums text-[#202124]">{money((Number(l.quantity) || 0) * (Number(l.unitAmount) || 0), r.currency)}</span>
                  {quotable && (
                    <button type="button" aria-label="Remove line" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="justify-self-end rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"><Trash2 size={15} /></button>
                  )}
                </div>
              ))}
              {quotable && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" onClick={() => setLines([...lines, { description: '', quantity: '1', unitAmount: '' }])} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13.5px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe]"><Plus size={15} /> Add line</button>
                  <select value="" onChange={(e) => {
                    const c = r.catalog.find((x) => x.key === e.target.value);
                    if (c) setLines([...lines, { description: c.label, quantity: '1', unitAmount: String(c.price) }]);
                  }} className="rounded-full border border-[#dadce0] px-3 py-1.5 text-[13.5px] text-[#3c4043]">
                    <option value="">Add from catalogue…</option>
                    {r.catalog.map((c) => <option key={c.key} value={c.key}>{c.label} — {money(c.price, c.currency)}</option>)}
                  </select>
                  <button type="button" onClick={() => setLines(templateLines({ ...r, quoteLines: null }))} className="rounded-full px-3 py-1.5 text-[13.5px] text-[#5f6368] hover:bg-[#f1f3f4]">Reset to template</button>
                </div>
              )}
            </div>

            <dl className="ml-auto mt-5 max-w-xs space-y-1 text-[14px]">
              <div className="flex justify-between text-[#5f6368]"><dt>Subtotal</dt><dd className="tabular-nums">{money(totals.sub, r.currency)}</dd></div>
              <div className="flex justify-between text-[#5f6368]"><dt>VAT ({r.taxRatePercent}%)</dt><dd className="tabular-nums">{money(totals.tax, r.currency)}</dd></div>
              <div className="flex justify-between border-t border-[#dadce0] pt-1.5 text-[16px] font-medium text-[#202124]"><dt>Total</dt><dd className="tabular-nums">{money(totals.total, r.currency)}</dd></div>
            </dl>

            {quotable && (
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_140px]">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#202124]">Note to the customer (optional)</label>
                  <textarea rows={3} className={inp} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What’s included, travel, delivery time…" />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#202124]">Valid for (days)</label>
                  <input type="number" min={1} max={90} className={inp} value={validDays} onChange={(e) => setValidDays(e.target.value)} />
                </div>
              </div>
            )}
            {quotable && (
              <button type="button" disabled={!linesValid || send.isPending} onClick={() => { setError(''); send.mutate(); }}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40">
                {send.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {r.quoteNumber ? 'Send revised quote' : 'Send quote'}
              </button>
            )}
            {quotable && <p className="mt-2 text-[12.5px] text-[#80868b]">Goes to the customer’s e-resi notifications and email, with the PDF attached and Accept / Request changes buttons.</p>}
          </section>

          {/* Invoice */}
          {r.invoice && (
            <section className={box}>
              <h2 className="text-[18px] font-medium text-[#202124]">Invoice {r.invoice.number}</h2>
              <p className="mt-1 text-[14px] text-[#5f6368]">
                {money(r.invoice.total, r.invoice.currency)} · {r.invoice.status.toLowerCase()}{r.invoice.paidAt ? ` ${fmt(r.invoice.paidAt)}` : ` · due ${fmt(r.invoice.dueAt)}`}
              </p>
              <Link href="/admin/billing/invoices" className="mt-3 inline-block text-[13.5px] font-medium text-[#1a73e8]">Open in Invoices</Link>
            </section>
          )}

          {/* Production status */}
          {(r.status === 'PAID' || r.status === 'IN_PRODUCTION' || quotable) && (
            <section className={box}>
              <h2 className="text-[18px] font-medium text-[#202124]">Update the customer</h2>
              <textarea rows={2} className={cn(inp, 'mt-3')} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note shown to the customer (shoot date, delivery link, reason for declining…)" />
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === 'PAID' && <button type="button" disabled={move.isPending} onClick={() => move.mutate('IN_PRODUCTION')} className="rounded-full bg-[#8430ce] px-4 py-2 text-[13.5px] font-medium text-white disabled:opacity-50">Mark in production</button>}
                {(r.status === 'PAID' || r.status === 'IN_PRODUCTION') && <button type="button" disabled={move.isPending} onClick={() => move.mutate('DELIVERED')} className="rounded-full bg-[#188038] px-4 py-2 text-[13.5px] font-medium text-white disabled:opacity-50">Mark delivered</button>}
                {quotable && <button type="button" disabled={move.isPending} onClick={() => { if (window.confirm('Decline this request? The customer is notified.')) move.mutate('DECLINED'); }} className="rounded-full border border-[#dadce0] px-4 py-2 text-[13.5px] font-medium text-[#c5221f] disabled:opacity-50">Decline</button>}
              </div>
            </section>
          )}
        </div>

        {/* The request */}
        <aside className="space-y-5">
          <section className={box}>
            <h2 className="text-[16px] font-medium text-[#202124]">Customer</h2>
            <p className="mt-2 text-[14px] text-[#202124]">{r.user.firstName} {r.user.lastName}</p>
            <p className="text-[13.5px] text-[#5f6368]">{r.user.email}</p>
            {(r.contactPhone || r.user.phone) && <p className="text-[13.5px] text-[#5f6368]">{r.contactPhone ?? r.user.phone}</p>}
            <p className="mt-1 text-[13px] text-[#80868b]">Says they are: {r.requesterType.toLowerCase()} · account: {r.user.role.toLowerCase()}</p>
          </section>
          <section className={box}>
            <h2 className="text-[16px] font-medium text-[#202124]">Request</h2>
            <dl className="mt-3 space-y-3 text-[13.5px]">
              <div><dt className="text-[#5f6368]">Services</dt><dd className="text-[#202124]">{[...r.serviceLabels, ...(r.otherService ? [`Other: ${r.otherService}`] : [])].join(', ')}</dd></div>
              <div><dt className="text-[#5f6368]">Location</dt><dd className="text-[#202124]">{r.location}{r.address ? ` — ${r.address}` : ''}</dd></div>
              {r.propertyType && <div><dt className="text-[#5f6368]">Property type</dt><dd className="text-[#202124]">{r.propertyType.toLowerCase()}</dd></div>}
              {(r.preferredDate || r.timing) && <div><dt className="text-[#5f6368]">When</dt><dd className="text-[#202124]">{[r.preferredDate && new Date(r.preferredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), r.timing].filter(Boolean).join(' · ')}</dd></div>}
              {r.scope && <div><dt className="text-[#5f6368]">Scope</dt><dd className="text-[#202124]">{r.scope}</dd></div>}
              {r.budget && <div><dt className="text-[#5f6368]">Budget</dt><dd className="text-[#202124]">{r.budget}</dd></div>}
              <div><dt className="text-[#5f6368]">Details</dt><dd className="whitespace-pre-line text-[#202124]">{r.details}</dd></div>
              <div><dt className="text-[#5f6368]">Sent</dt><dd className="text-[#202124]">{fmt(r.createdAt)}</dd></div>
            </dl>
          </section>
          <section className={box}>
            <h2 className="text-[16px] font-medium text-[#202124]">Timeline</h2>
            <ol className="mt-3 space-y-3">
              {[...r.events].reverse().map((e) => (
                <li key={e.id} className="text-[13px]">
                  <p className="text-[#202124]">{e.message}</p>
                  <p className="text-[#80868b]">{e.actor === 'TEAM' ? 'Team' : 'Customer'} · {fmt(e.createdAt)}</p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
