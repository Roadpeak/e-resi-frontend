'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CreditCard, Loader2, Receipt } from 'lucide-react';
import { ApiError } from '../../lib/api/client';
import { billingApi, type Invoice } from '../../lib/api/billing';
import { InvoiceTable, money, shortDate } from './InvoiceTable';
import { cn } from '../../lib/utils';

type Filter = 'unpaid' | 'paid' | 'all';
const isUnpaid = (i: Invoice) => i.status === 'ISSUED' || i.status === 'OVERDUE';
const isSettled = (i: Invoice) => i.status === 'PAID' || i.status === 'WAIVED';

/**
 * Every invoice on the signed-in account — listing fees, domains, websites —
 * with card and M-Pesa payment and the Paystack return leg. Used on the agent
 * billing page, which otherwise only knows about the monthly membership fee.
 *
 * `exclude` hides invoices another part of the page already shows (the
 * membership fee runs), so nothing is listed twice.
 */
export function InvoicesSection({ exclude }: { exclude?: (i: Invoice) => boolean }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('unpaid');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['my-invoices'], queryFn: () => billingApi.invoices() });
  const all = useMemo(() => (data ?? []).filter((i) => !exclude?.(i)), [data, exclude]);
  const unpaid = all.filter(isUnpaid);
  const overdue = unpaid.some((i) => i.status === 'OVERDUE');
  const currency = unpaid[0]?.currency ?? 'KES';
  const dueTotal = unpaid.filter((i) => i.currency === currency).reduce((n, i) => n + i.total, 0);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 6000); };
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['my-invoices'] });
    qc.invalidateQueries({ queryKey: ['agent'] });
  };

  const pay = useMutation({
    mutationFn: (invoice: Invoice) => billingApi.payInvoice(invoice.id),
    onSuccess: (r, invoice) => {
      if (r.paid) {
        refresh();
        const c = [r.chargedCard?.brand, r.chargedCard?.last4 && `•••• ${r.chargedCard.last4}`].filter(Boolean).join(' ');
        flash(c ? `Paid with ${c}.` : 'Payment complete.');
        return;
      }
      sessionStorage.setItem('eresi:payingInvoice', invoice.id);
      window.location.href = r.authorizationUrl;
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not start the payment'),
  });

  const payMpesa = useMutation({
    mutationFn: ({ invoice, phone }: { invoice: Invoice; phone: string }) => billingApi.payInvoiceMpesa(invoice.id, phone),
    onSuccess: (r) => {
      setError('');
      flash(`Sent to your phone for ${r.invoiceNumber} — enter your M-Pesa PIN. This page updates once it clears.`);
      const poll = setInterval(refresh, 4000);
      setTimeout(() => clearInterval(poll), 60_000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not start the M-Pesa payment'),
  });

  // Return leg from Paystack (the webhook settles it too; both are idempotent).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('paystack');
    if (mode !== 'invoice' && mode !== 'simulated') return;
    const reference = params.get('reference') ?? params.get('trxref');
    const invoiceId = sessionStorage.getItem('eresi:payingInvoice');
    if (reference?.startsWith('link_')) return;
    sessionStorage.removeItem('eresi:payingInvoice');
    window.history.replaceState({}, '', window.location.pathname);
    // Card-link returns (link_ references) belong to the payment-methods card.
    if (!reference || !invoiceId || reference.startsWith('link_')) return;
    billingApi.confirmInvoice(invoiceId, reference)
      .then((r) => { flash(`Payment received — receipt ${r.number} is on its way to your inbox.`); refresh(); })
      .catch(() => { flash('Payment received. Your receipt will arrive shortly.'); refresh(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = filter === 'unpaid' ? unpaid : filter === 'paid' ? all.filter(isSettled) : all;

  return (
    <section id="invoices" className="scroll-mt-24 space-y-4">
      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}
      {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

      {unpaid.length > 0 && (
        <div className={cn('flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6', overdue ? 'bg-[#fce8e6]' : 'bg-[#e8f0fe]')}>
          <div>
            <p className={cn('flex items-center gap-1.5 text-[13px] font-medium', overdue ? 'text-[#c5221f]' : 'text-[#1967d2]')}>
              {overdue ? <AlertTriangle size={15} /> : <Receipt size={15} />} {overdue ? 'Overdue invoices' : 'Invoices to pay'}
            </p>
            <p className="mt-2 text-[30px] font-normal leading-none text-[#202124] tabular-nums">{money(dueTotal, currency)}</p>
            <p className="mt-2 text-[13px] text-[#3c4043]">
              {unpaid.length} unpaid invoice{unpaid.length === 1 ? '' : 's'}
              {` · due ${shortDate([...unpaid].sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))[0].dueAt)}`}
            </p>
          </div>
          {unpaid.length === 1 && (
            <button type="button" onClick={() => { setError(''); pay.mutate(unpaid[0]); }} disabled={pay.isPending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50">
              {pay.isPending ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
              Pay {money(unpaid[0].total, unpaid[0].currency)}
            </button>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[17px] font-medium text-[#202124]">Invoices</h2>
          <div className="flex gap-1.5">
            {(['unpaid', 'paid', 'all'] as const).map((f) => {
              const n = f === 'unpaid' ? unpaid.length : f === 'paid' ? all.filter(isSettled).length : all.length;
              return (
                <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
                  className={cn('cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                    filter === f ? 'border-[#202124] bg-[#202124] text-white' : 'border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]')}>
                  {f === 'unpaid' ? 'Unpaid' : f === 'paid' ? 'Paid' : 'All'}
                  <span className="ml-1.5 tabular-nums opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#80868b]" /></div>
        ) : shown.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-[#5f6368]">
            {filter === 'unpaid' ? 'No unpaid invoices.' : 'No invoices yet. Listing, domain and website fees appear here.'}
          </p>
        ) : (
          <InvoiceTable
            invoices={shown}
            onPay={(inv) => { setError(''); pay.mutate(inv); }}
            payingId={pay.isPending ? pay.variables?.id : null}
            onPayMpesa={(inv, phone) => { setError(''); payMpesa.mutate({ invoice: inv, phone }); }}
            mpesaPayingId={payMpesa.isPending ? payMpesa.variables?.invoice.id : null}
          />
        )}
      </div>
    </section>
  );
}
