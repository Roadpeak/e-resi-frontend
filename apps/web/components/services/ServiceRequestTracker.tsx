'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, CreditCard, Download, Loader2, Smartphone } from 'lucide-react';
import { ApiError } from '../../lib/api/client';
import { billingApi } from '../../lib/api/billing';
import { useAuthStore } from '../../lib/stores/auth.store';
import {
  money, serviceRequestsApi, STATUS_LABEL, STATUS_STYLE, type ServiceRequest, type ServiceRequestStatus,
} from '../../lib/api/service-requests';
import { cn } from '../../lib/utils';

const STEPS: { key: string; label: string; reached: ServiceRequestStatus[] }[] = [
  { key: 'sent', label: 'Request sent', reached: ['SUBMITTED', 'QUOTED', 'CHANGES_REQUESTED', 'ACCEPTED', 'PAID', 'IN_PRODUCTION', 'DELIVERED'] },
  { key: 'quote', label: 'Quote', reached: ['QUOTED', 'CHANGES_REQUESTED', 'ACCEPTED', 'PAID', 'IN_PRODUCTION', 'DELIVERED'] },
  { key: 'accepted', label: 'Accepted', reached: ['ACCEPTED', 'PAID', 'IN_PRODUCTION', 'DELIVERED'] },
  { key: 'paid', label: 'Paid', reached: ['PAID', 'IN_PRODUCTION', 'DELIVERED'] },
  { key: 'production', label: 'In production', reached: ['IN_PRODUCTION', 'DELIVERED'] },
  { key: 'delivered', label: 'Delivered', reached: ['DELIVERED'] },
];

const time = (v: string) => new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const date = (v: string) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTime = (v: string) => `${new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time(v)}`;

const card = 'rounded-[28px] bg-white p-6 sm:p-8';

export function ServiceRequestTracker({ id, basePath = '/services/requests' }: { id: string; basePath?: string }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [changesOpen, setChangesOpen] = useState(false);
  const [changes, setChanges] = useState('');
  const [mpesaOpen, setMpesaOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [waitingMpesa, setWaitingMpesa] = useState(false);
  const [sent, setSent] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  const { data: r, isLoading, error: loadError } = useQuery({
    queryKey: ['service-request', id],
    queryFn: () => serviceRequestsApi.get(id),
    // Waiting on a quote or an M-Pesa confirmation: keep the page live.
    refetchInterval: (q) => {
      const s = (q.state.data as ServiceRequest | undefined)?.status;
      if (waitingMpesa) return 4000;
      return s === 'SUBMITTED' || s === 'CHANGES_REQUESTED' ? 30_000 : false;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['service-request', id] });
    qc.invalidateQueries({ queryKey: ['service-requests'] });
  };
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 7000); };
  const fail = (e: unknown, fallback: string) => setError(e instanceof ApiError ? e.message : fallback);

  // Arrivals: just sent, a link from the quote email, or back from card checkout.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sent') === '1') setSent(true);
    const action = params.get('action');
    if (action === 'changes') setChangesOpen(true);
    if (action) setTimeout(() => quoteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);

    const reference = params.get('reference') ?? params.get('trxref');
    const invoiceId = sessionStorage.getItem('eresi:payingInvoice');
    if (params.get('sent') || action || reference) window.history.replaceState({}, '', window.location.pathname);
    if (reference && invoiceId && !reference.startsWith('link_')) {
      sessionStorage.removeItem('eresi:payingInvoice');
      billingApi.confirmInvoice(invoiceId, reference)
        .then((x) => { flash(`Payment received. Receipt ${x.number} is on its way to your inbox.`); refresh(); })
        .catch(() => { flash('Payment received. Your receipt will arrive shortly.'); refresh(); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = (user as { phone?: string | null } | null)?.phone;
    if (p && !phone) setPhone(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (waitingMpesa && r && r.status !== 'ACCEPTED') {
      setWaitingMpesa(false);
      if (r.status === 'PAID') flash('M-Pesa payment received. Thank you — we’ll be in touch to schedule production.');
    }
  }, [r, waitingMpesa]);

  const accept = useMutation({
    mutationFn: () => serviceRequestsApi.accept(id),
    onSuccess: (x) => { qc.setQueryData(['service-request', id], x); flash(`Quote accepted. Invoice ${x.invoice?.number ?? ''} is ready to pay below.`); },
    onError: (e) => fail(e, 'Could not accept the quote.'),
  });
  const askChanges = useMutation({
    mutationFn: () => serviceRequestsApi.requestChanges(id, changes),
    onSuccess: (x) => { qc.setQueryData(['service-request', id], x); setChangesOpen(false); setChanges(''); flash('Sent. We’ll revise the quote and let you know.'); },
    onError: (e) => fail(e, 'Could not send your changes.'),
  });
  const cancel = useMutation({
    mutationFn: () => serviceRequestsApi.cancel(id),
    onSuccess: (x) => { qc.setQueryData(['service-request', id], x); flash('Request cancelled.'); },
    onError: (e) => fail(e, 'Could not cancel the request.'),
  });
  const payCard = useMutation({
    mutationFn: (invoiceId: string) => billingApi.payInvoice(invoiceId),
    onSuccess: (x, invoiceId) => {
      if (x.paid) { flash('Payment complete. Thank you.'); refresh(); return; }
      sessionStorage.setItem('eresi:payingInvoice', invoiceId);
      window.location.href = x.authorizationUrl;
    },
    onError: (e) => fail(e, 'Could not start the card payment.'),
  });
  const payMpesa = useMutation({
    mutationFn: (invoiceId: string) => billingApi.payInvoiceMpesa(invoiceId, phone),
    onSuccess: () => {
      setMpesaOpen(false);
      setWaitingMpesa(true);
      setTimeout(() => setWaitingMpesa(false), 120_000);
      flash('Check your phone and enter your M-Pesa PIN. This page updates once the payment clears.');
    },
    onError: (e) => fail(e, 'Could not send the M-Pesa request.'),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5f6368]" /></div>;
  if (loadError || !r) {
    return (
      <div className={cn(card, 'text-center font-google')}>
        <p className="text-[18px] font-semibold text-[#202124]">We couldn’t find that request.</p>
        <Link href={basePath} className="mt-4 inline-block text-[15px] font-medium text-[#1a73e8]">See your requests</Link>
      </div>
    );
  }

  const stopped = r.status === 'DECLINED' || r.status === 'CANCELLED';
  const quoteExpired = !!r.quoteValidUntil && new Date(r.quoteValidUntil).getTime() < Date.now();
  const invoiceOpen = r.invoice && (r.invoice.status === 'ISSUED' || r.invoice.status === 'OVERDUE');
  const canCancel = r.status === 'SUBMITTED' || r.status === 'QUOTED' || r.status === 'CHANGES_REQUESTED';

  return (
    <div className="space-y-5 font-google">
      <Link href={basePath} className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1a73e8]"><ArrowLeft size={16} /> All requests</Link>

      {sent && (
        <div className="flex items-start gap-3 rounded-[22px] bg-[#e6f4ea] px-5 py-4 text-[15px] text-[#137333]">
          <Check size={18} className="mt-0.5 shrink-0" />
          <span>Request sent. Your quote will reach your account and your email by about {time(r.quoteDueBy)}.</span>
        </div>
      )}
      {toast && <p className="rounded-[22px] bg-[#e8f0fe] px-5 py-4 text-[15px] text-[#174ea6]">{toast}</p>}
      {error && <p className="rounded-[22px] bg-[#fce8e6] px-5 py-4 text-[15px] text-[#c5221f]">{error}</p>}

      {/* Summary and progress */}
      <section className={card}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[24px] font-semibold tracking-tight text-[#202124]">{r.number}</h2>
          <span className={cn('rounded-full px-3 py-1 text-[13px] font-medium', STATUS_STYLE[r.status])}>{STATUS_LABEL[r.status]}</span>
        </div>
        <p className="mt-1 text-[14px] text-[#5f6368]">Sent {date(r.createdAt)} · {r.location}</p>

        {!stopped && (
          <ol className="mt-7 grid grid-cols-3 gap-y-5 sm:grid-cols-6">
            {STEPS.map((s, i) => {
              const done = s.reached.includes(r.status);
              return (
                <li key={s.key} className="flex flex-col items-center text-center">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold', done ? 'bg-[#1a73e8] text-white' : 'bg-[#f1f3f4] text-[#5f6368]')}>
                    {done ? <Check size={15} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn('mt-2 text-[12.5px]', done ? 'font-medium text-[#202124]' : 'text-[#5f6368]')}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        )}
        {r.statusNote && <p className="mt-6 rounded-2xl bg-[#f8f9fa] px-4 py-3 text-[14px] text-[#3c4043]">{r.statusNote}</p>}
      </section>

      {/* Waiting for a quote */}
      {(r.status === 'SUBMITTED' || r.status === 'CHANGES_REQUESTED') && (
        <section className={cn(card, 'bg-[#fef7e0]')}>
          <p className="text-[17px] font-semibold text-[#202124]">
            {r.status === 'SUBMITTED' ? 'We’re preparing your quote' : 'We’re revising your quote'}
          </p>
          <p className="mt-1.5 text-[15px] text-[#3c4043]">
            {r.status === 'SUBMITTED'
              ? `Expect it by about ${time(r.quoteDueBy)}, here and in your email.`
              : 'We’ll send the updated quote here and to your email.'}
          </p>
        </section>
      )}

      {/* The quote */}
      {r.quoteLines && r.quoteTotal != null && r.quoteCurrency && (
        <section ref={quoteRef} className={cn(card, 'scroll-mt-24')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f6368]">Quotation</p>
              <h3 className="mt-1 text-[20px] font-semibold text-[#202124]">{r.quoteNumber}</h3>
              <p className="mt-1 text-[14px] text-[#5f6368]">
                {r.quotedAt && `Sent ${date(r.quotedAt)}`}{r.quoteValidUntil && ` · ${quoteExpired ? 'expired' : 'valid until'} ${date(r.quoteValidUntil)}`}
              </p>
            </div>
            <button type="button" onClick={() => serviceRequestsApi.downloadQuote(r).catch(() => setError('Could not download the quote.'))}
              className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">
              <Download size={16} /> Download PDF
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[420px] text-[14px]">
              <thead>
                <tr className="border-b border-[#dadce0] text-left text-[#5f6368]">
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Price</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {r.quoteLines.map((l, i) => (
                  <tr key={i} className="border-b border-[#f1f3f4] text-[#202124]">
                    <td className="py-3 pr-3">{l.description}</td>
                    <td className="py-3 text-right tabular-nums">{l.quantity}</td>
                    <td className="py-3 text-right tabular-nums">{money(l.unitAmount, r.quoteCurrency!)}</td>
                    <td className="py-3 text-right tabular-nums">{money(l.amount, r.quoteCurrency!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="ml-auto mt-4 max-w-xs space-y-1.5 text-[14px]">
            <div className="flex justify-between text-[#5f6368]"><dt>Subtotal</dt><dd className="tabular-nums">{money(r.quoteSubtotal ?? 0, r.quoteCurrency)}</dd></div>
            {(r.quoteTaxAmount ?? 0) > 0 && (
              <div className="flex justify-between text-[#5f6368]"><dt>VAT ({r.quoteTaxPercent}%)</dt><dd className="tabular-nums">{money(r.quoteTaxAmount ?? 0, r.quoteCurrency)}</dd></div>
            )}
            <div className="flex justify-between border-t border-[#dadce0] pt-2 text-[17px] font-semibold text-[#202124]"><dt>Total</dt><dd className="tabular-nums">{money(r.quoteTotal, r.quoteCurrency)}</dd></div>
          </dl>
          {r.quoteNotes && <p className="mt-5 rounded-2xl bg-[#e8f0fe] px-4 py-3 text-[14px] text-[#174ea6]">{r.quoteNotes}</p>}

          {r.status === 'QUOTED' && (
            <div className="mt-7 border-t border-[#f1f3f4] pt-6">
              {quoteExpired ? (
                <p className="mb-4 text-[14px] text-[#b06000]">This quote has expired. Ask for changes and we’ll send you a fresh one.</p>
              ) : (
                <p className="mb-4 text-[14px] text-[#5f6368]">Accepting issues your invoice straight away, payable by M-Pesa or card.</p>
              )}
              <div className="flex flex-wrap gap-3">
                {!quoteExpired && (
                  <button type="button" disabled={accept.isPending} onClick={() => { setError(''); accept.mutate(); }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#1765cc] disabled:opacity-60">
                    {accept.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Accept quote
                  </button>
                )}
                <button type="button" onClick={() => setChangesOpen((v) => !v)}
                  className="rounded-full border border-[#dadce0] px-6 py-3 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">
                  Request changes
                </button>
              </div>
              {changesOpen && (
                <div className="mt-5">
                  <label htmlFor="sr-changes" className="mb-1.5 block text-[14px] font-medium text-[#202124]">What should we change?</label>
                  <textarea id="sr-changes" rows={4} maxLength={2000} value={changes} onChange={(e) => setChanges(e.target.value)}
                    placeholder="e.g. drop the drone video, add twilight photos, shoot on a weekend"
                    className="w-full rounded-xl border border-[#dadce0] px-4 py-3 text-[15px] outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20" />
                  <button type="button" disabled={changes.trim().length < 3 || askChanges.isPending} onClick={() => { setError(''); askChanges.mutate(); }}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50">
                    {askChanges.isPending && <Loader2 size={15} className="animate-spin" />} Send to the team
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Invoice and payment */}
      {r.invoice && (
        <section className={card}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f6368]">Invoice</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-[20px] font-semibold text-[#202124]">{r.invoice.number}</h3>
              <p className="mt-1 text-[14px] text-[#5f6368]">
                {r.invoice.status === 'PAID'
                  ? `Paid${r.invoice.paidAt ? ` ${date(r.invoice.paidAt)}` : ''}${r.invoice.receipt ? ` · receipt ${r.invoice.receipt.number}` : ''}`
                  : `Due ${date(r.invoice.dueAt)}${r.invoice.status === 'OVERDUE' ? ' · overdue' : ''}`}
              </p>
            </div>
            <p className="text-[26px] font-semibold tabular-nums text-[#202124]">{money(r.invoice.total, r.invoice.currency)}</p>
          </div>

          {invoiceOpen && (
            <div className="mt-6">
              {waitingMpesa ? (
                <p className="flex items-center gap-2 rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#137333]">
                  <Loader2 size={16} className="animate-spin" /> Waiting for your M-Pesa payment to clear…
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => { setError(''); setMpesaOpen((v) => !v); }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#188038] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#137333]">
                    <Smartphone size={16} /> Pay with M-Pesa
                  </button>
                  <button type="button" disabled={payCard.isPending} onClick={() => { setError(''); payCard.mutate(r.invoice!.id); }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-6 py-3 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa] disabled:opacity-60">
                    {payCard.isPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} Pay by card
                  </button>
                </div>
              )}
              {mpesaOpen && !waitingMpesa && (
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div className="w-full sm:w-64">
                    <label htmlFor="sr-mpesa" className="mb-1.5 block text-[14px] font-medium text-[#202124]">M-Pesa phone number</label>
                    <input id="sr-mpesa" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07… or 2547…"
                      className="w-full rounded-xl border border-[#dadce0] px-4 py-3 text-[15px] outline-none focus:border-[#188038] focus:ring-2 focus:ring-[#188038]/20" />
                  </div>
                  <button type="button" disabled={phone.trim().length < 9 || payMpesa.isPending} onClick={() => payMpesa.mutate(r.invoice!.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#188038] px-5 py-3 text-[14px] font-semibold text-white disabled:opacity-50">
                    {payMpesa.isPending && <Loader2 size={15} className="animate-spin" />} Send payment request
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* What was asked for */}
      <section className={card}>
        <h3 className="text-[18px] font-semibold text-[#202124]">Your request</h3>
        <dl className="mt-4 grid gap-x-8 gap-y-4 text-[14px] sm:grid-cols-2">
          <div className="sm:col-span-2"><dt className="text-[#5f6368]">Services</dt><dd className="mt-0.5 text-[#202124]">{[...r.serviceLabels, ...(r.otherService ? [r.otherService] : [])].join(', ')}</dd></div>
          <div><dt className="text-[#5f6368]">Location</dt><dd className="mt-0.5 text-[#202124]">{r.location}{r.address ? ` — ${r.address}` : ''}</dd></div>
          {(r.preferredDate || r.timing) && <div><dt className="text-[#5f6368]">When</dt><dd className="mt-0.5 text-[#202124]">{[r.preferredDate && date(r.preferredDate), r.timing].filter(Boolean).join(' · ')}</dd></div>}
          {r.scope && <div><dt className="text-[#5f6368]">Size or scope</dt><dd className="mt-0.5 text-[#202124]">{r.scope}</dd></div>}
          {r.budget && <div><dt className="text-[#5f6368]">Budget</dt><dd className="mt-0.5 text-[#202124]">{r.budget}</dd></div>}
          <div className="sm:col-span-2"><dt className="text-[#5f6368]">Details</dt><dd className="mt-0.5 whitespace-pre-line text-[#202124]">{r.details}</dd></div>
        </dl>
        {canCancel && (
          <button type="button" disabled={cancel.isPending} onClick={() => { if (window.confirm('Cancel this request?')) cancel.mutate(); }}
            className="mt-6 text-[14px] font-medium text-[#c5221f] hover:underline disabled:opacity-50">
            Cancel request
          </button>
        )}
      </section>

      {/* Timeline */}
      <section className={card}>
        <h3 className="text-[18px] font-semibold text-[#202124]">Timeline</h3>
        <ol className="mt-5 space-y-4">
          {[...r.events].reverse().map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', e.actor === 'TEAM' ? 'bg-[#1a73e8]' : 'bg-[#9aa0a6]')} />
              <div>
                <p className="text-[14px] text-[#202124]">{e.message}</p>
                <p className="text-[12.5px] text-[#5f6368]">{e.actor === 'TEAM' ? 'e-resi team' : 'You'} · {dateTime(e.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
