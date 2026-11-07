'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi, type Invoice } from '../../../../../lib/api/billing';
import { ApiError } from '../../../../../lib/api/client';
import { InvoiceTable, money } from '../../../../../components/billing/InvoiceTable';
import { cn } from '../../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'ISSUED', label: 'Awaiting payment' },
  { key: 'PAID', label: 'Paid' },
  { key: 'WAIVED', label: 'Waived' },
  { key: 'DRAFT', label: 'Not issued' },
];

const KINDS = [
  { key: '', label: 'Every kind' },
  { key: 'SUBSCRIPTION', label: 'Listing fees' },
  { key: 'PRODUCTION', label: 'Production' },
  { key: 'DOMAIN', label: 'Domains' },
];

export default function AdminInvoices() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['admin-invoices', status, kind, q],
    queryFn: () => billingApi.allInvoices({ status, kind, q }),
  });

  const flash = (m: string) => {
    setToast(m);
    setError('');
    setTimeout(() => setToast(''), 6000);
  };

  const remind = useMutation({
    mutationFn: (invoice: Invoice) => billingApi.remindInvoice(invoice.id),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      flash(
        `Reminder sent for ${inv.number}. The customer has been warned that access ends `
        + `${inv.terminatesAt ? new Date(inv.terminatesAt).toLocaleDateString() : 'in five days'}.`,
      );
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not send the reminder'),
  });

  const dispatch = useMutation({
    mutationFn: () => billingApi.dispatchInvoices(),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      flash(`${r.issued} invoice${r.issued === 1 ? '' : 's'} issued, ${r.markedOverdue} marked overdue.`);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Dispatch failed'),
  });

  const [waiving, setWaiving] = useState<Invoice | null>(null);

  const rows = invoices ?? [];
  const outstanding = rows.filter((i) => i.status === 'ISSUED' || i.status === 'OVERDUE');
  const currency = rows[0]?.currency ?? 'KES';

  const stats = [
    { label: 'Outstanding', value: money(outstanding.reduce((n, i) => n + i.total, 0), currency) },
    { label: 'Overdue', value: String(rows.filter((i) => i.status === 'OVERDUE').length), tone: 'text-[#c5221f]' },
    { label: 'Paid', value: String(rows.filter((i) => i.status === 'PAID').length), tone: 'text-[#188038]' },
    { label: 'Waived', value: String(rows.filter((i) => i.status === 'WAIVED').length), tone: 'text-[#8430ce]' },
    { label: 'Not issued', value: String(rows.filter((i) => i.status === 'DRAFT').length) },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-medium text-[#202124]">Invoices</h1>
          <p className="mt-1 text-[14px] text-[#5f6368]">
            Listing fees are invoiced three days before they fall due; production is
            invoiced as soon as it&apos;s ordered. Receipts follow payment automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch.mutate()}
          disabled={dispatch.isPending}
          className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f0f4f9] disabled:opacity-60"
        >
          {dispatch.isPending ? 'Running…' : 'Run dispatch now'}
        </button>
      </header>

      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}
      {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cardCls}>
            <p className="text-[13px] text-[#5f6368]">{s.label}</p>
            <p className={cn('mt-1 text-[22px] font-medium text-[#202124]', s.tone)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              'rounded-full border px-4 py-2 text-[13px] font-medium transition-colors',
              status === f.key
                ? 'border-[#202124] bg-[#202124] text-white'
                : 'border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4]',
            )}
          >
            {f.label}
          </button>
        ))}
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded-full border border-[#dadce0] px-4 py-2 text-[13px] text-[#5f6368]"
        >
          {KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search number or customer"
          className="min-w-[220px] flex-1 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] text-[#202124]"
        />
      </div>

      <div className={cardCls}>
        {isLoading ? (
          <p className="py-8 text-center text-[14px] text-[#5f6368]">Loading…</p>
        ) : (
          <InvoiceTable
            invoices={rows}
            showCustomer
            onRemind={(inv) => { setError(''); remind.mutate(inv); }}
            remindingId={remind.isPending ? remind.variables?.id : null}
            onWaive={(inv) => { setError(''); setWaiving(inv); }}
          />
        )}
      </div>
      {waiving && (
        <WaiveDialog
          invoice={waiving}
          onClose={() => setWaiving(null)}
          onDone={(inv) => {
            setWaiving(null);
            queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
            flash(`${inv.number} waived for ${inv.billedToName}. Recorded in the audit log.`);
          }}
        />
      )}
    </div>
  );
}

/**
 * Waive a monthly listing-fee invoice: the reason is kept on the invoice and
 * in the audit log; the passcode is checked by the server (never stored in
 * the page), and a wrong one is logged too.
 */
function WaiveDialog({ invoice, onClose, onDone }: { invoice: Invoice; onClose: () => void; onDone: (inv: Invoice) => void }) {
  const [reason, setReason] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const waive = useMutation({
    mutationFn: () => billingApi.waiveInvoice(invoice.id, { passcode, reason: reason.trim() }),
    onSuccess: onDone,
    onError: (e) => { setError(e instanceof ApiError ? e.message : 'Could not waive this invoice'); setPasscode(''); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="waive-title">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/40" />
      <form
        onSubmit={(e) => { e.preventDefault(); setError(''); waive.mutate(); }}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <h2 id="waive-title" className="text-[20px] font-normal text-[#202124]">Waive listing fee</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#5f6368]">
          <span className="font-medium text-[#202124]">{invoice.number}</span> for {invoice.billedToName} ·{' '}
          <span className="font-medium text-[#202124]">{money(invoice.total, invoice.currency)}</span>. The invoice is marked
          cleared on waiver, any suspension for non-payment is lifted, and the waiver is recorded in the audit log.
        </p>
        <label htmlFor="waive-reason" className="mt-5 block text-[13px] font-medium text-[#5f6368]">Reason</label>
        <textarea
          id="waive-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="e.g. Launch promotion — first month free"
          className="mt-1.5 w-full resize-none rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]"
          autoFocus
        />
        <label htmlFor="waive-passcode" className="mt-4 block text-[13px] font-medium text-[#5f6368]">Waiver passcode</label>
        <input
          id="waive-passcode"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value.replace(/\s/g, ''))}
          maxLength={32}
          className="mt-1.5 w-40 rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[16px] tracking-[0.3em] text-[#202124] outline-none focus:border-[#1a73e8]"
        />
        {error && <p className="mt-3 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-[13.5px] text-[#c5221f]">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-[14px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Cancel</button>
          <button
            type="submit"
            disabled={waive.isPending || reason.trim().length < 3 || !passcode}
            className="rounded-full bg-[#8430ce] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#7627bb] disabled:opacity-50"
          >
            {waive.isPending ? 'Waiving…' : 'Waive invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
