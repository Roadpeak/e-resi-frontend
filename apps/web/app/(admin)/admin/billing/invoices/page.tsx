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
  { key: 'DRAFT', label: 'Not issued' },
];

const KINDS = [
  { key: '', label: 'Every kind' },
  { key: 'SUBSCRIPTION', label: 'Listing fees' },
  { key: 'PRODUCTION', label: 'Production' },
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

  const rows = invoices ?? [];
  const outstanding = rows.filter((i) => i.status === 'ISSUED' || i.status === 'OVERDUE');
  const currency = rows[0]?.currency ?? 'KES';

  const stats = [
    { label: 'Outstanding', value: money(outstanding.reduce((n, i) => n + i.total, 0), currency) },
    { label: 'Overdue', value: String(rows.filter((i) => i.status === 'OVERDUE').length), tone: 'text-[#c5221f]' },
    { label: 'Paid', value: String(rows.filter((i) => i.status === 'PAID').length), tone: 'text-[#188038]' },
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
          />
        )}
      </div>
    </div>
  );
}
