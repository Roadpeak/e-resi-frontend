'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, CalendarClock, CreditCard, Loader2, Receipt, Smartphone, Wallet,
} from 'lucide-react';
import { propertiesApi } from '../../../../lib/api/properties';
import { ApiError } from '../../../../lib/api/client';
import { billingApi, type Invoice } from '../../../../lib/api/billing';
import { PaymentMethodsCard } from '../../../../components/dashboard/PaymentMethods';
import { InvoiceTable } from '../../../../components/billing/InvoiceTable';
import { LISTING_FEE_MONTHLY, fmtUsd, serviceById } from '../../../../lib/onboarding/catalog';
import { useCatalog } from '../../../../lib/onboarding/useCatalog';

interface RawListing {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  submissionData?: {
    media?: { services?: Record<string, unknown> };
    servicesOneTimeTotal?: number;
  } | null;
}

const STATUS_CHIPS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Live', className: 'bg-[#e6f4ea] text-[#188038]' },
  DRAFT: { label: 'In review', className: 'bg-[#fef7e0] text-[#b06000]' },
  SOLD_OUT: { label: 'Sold out', className: 'bg-[#f1f3f4] text-[#5f6368]' },
  ARCHIVED: { label: 'Archived', className: 'bg-[#f1f3f4] text-[#5f6368]' },
};

export default function BillingPage() {
  // Hydrates the catalogue with admin-managed pricing.
  useCatalog();
  const { data, isLoading } = useQuery({
    queryKey: ['my-listings-raw'],
    queryFn: () => propertiesApi.myListings({ limit: 50 }),
  });

  const listings = ((data?.data ?? []) as unknown as RawListing[]);
  const liveListings = listings.filter((p) => p.status === 'ACTIVE');
  const monthlyTotal = liveListings.length * LISTING_FEE_MONTHLY;

  const productionOrders = listings
    .map((p) => {
      const serviceIds = Object.keys(p.submissionData?.media?.services ?? {});
      const services = serviceIds
        .map((id) => serviceById(id))
        .filter((s): s is NonNullable<ReturnType<typeof serviceById>> => Boolean(s));
      const total = p.submissionData?.servicesOneTimeTotal
        ?? services.reduce((n, s) => n + s.price, 0);
      return { property: p, services, total };
    })
    .filter((o) => o.services.length > 0);
  const productionTotal = productionOrders.reduce((n, o) => n + o.total, 0);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#80868b]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Billing</h2>
        <p className="text-base text-[#5f6368]">
          Simple, per-development pricing — a flat listing fee per live development plus any one-time production services.
        </p>
      </div>

      {/* ── Summary tiles ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-transparent bg-[#e8f0fe] p-6">
          <div className="flex items-center gap-2 text-[#1967d2]">
            <Receipt size={15} />
            <span className="text-xs font-medium uppercase tracking-[0.1em]">Monthly fees</span>
          </div>
          <p className="mt-3 text-[32px] font-normal text-[#1967d2]">{fmtUsd(monthlyTotal)}</p>
          <p className="text-[13px] text-[#1967d2]/80">
            {liveListings.length} live listing{liveListings.length === 1 ? '' : 's'} × {fmtUsd(LISTING_FEE_MONTHLY)}
          </p>
        </div>
        <div className="rounded-3xl border border-transparent bg-[#fef7e0] p-6">
          <div className="flex items-center gap-2 text-[#b06000]">
            <CalendarClock size={15} />
            <span className="text-xs font-medium uppercase tracking-[0.1em]">Production pending</span>
          </div>
          <p className="mt-3 text-[32px] font-normal text-[#b06000]">{fmtUsd(productionTotal)}</p>
          <p className="text-[13px] text-[#b06000]/80">one-time · 50% before shoot, 50% on delivery</p>
        </div>
        <div className="rounded-3xl border border-transparent bg-[#f8f9fa] p-6">
          <div className="flex items-center gap-2 text-[#5f6368]">
            <Wallet size={15} />
            <span className="text-xs font-medium uppercase tracking-[0.1em]">Developments</span>
          </div>
          <p className="mt-3 text-[32px] font-normal text-[#202124]">{listings.length}</p>
          <p className="text-[13px] text-[#5f6368]">{listings.length - liveListings.length} not yet billed</p>
        </div>
      </div>

      {/* ── Listing fees per development ── */}
      <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
        <div className="border-b border-[#f1f3f4] px-6 py-4">
          <h3 className="text-[18px] font-normal text-[#202124]">Monthly listing fees</h3>
          <p className="text-sm text-[#5f6368]">The {fmtUsd(LISTING_FEE_MONTHLY)}/month fee starts only when a development goes live.</p>
        </div>
        {listings.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-base text-[#5f6368]">No developments yet — nothing is being billed.</p>
            <Link
              href="/dashboard/developments/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors"
            >
              Add your first development <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f1f3f4]">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Development</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Monthly fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {listings.map((p) => {
                const chip = STATUS_CHIPS[p.status] ?? STATUS_CHIPS.DRAFT;
                const billed = p.status === 'ACTIVE';
                return (
                  <tr key={p.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-4 text-[15px] font-medium text-[#202124]">{p.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[13px] font-medium ${chip.className}`}>
                        {chip.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[15px] tabular-nums">
                      {billed ? (
                        <span className="font-medium text-[#202124]">{fmtUsd(LISTING_FEE_MONTHLY)}</span>
                      ) : (
                        <span className="text-[#80868b]">{fmtUsd(0)} · starts when live</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-[#f8f9fa]">
                <td className="px-6 py-4 text-[15px] font-medium text-[#202124]" colSpan={2}>Total per month</td>
                <td className="px-6 py-4 text-right text-[18px] font-medium tabular-nums text-[#202124]">{fmtUsd(monthlyTotal)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* ── Production services ── */}
      <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
        <div className="border-b border-[#f1f3f4] px-6 py-4">
          <h3 className="text-[18px] font-normal text-[#202124]">Production services</h3>
          <p className="text-sm text-[#5f6368]">One-time media production selected per development — payable 50% before the shoot, 50% on delivery.</p>
        </div>
        {productionOrders.length === 0 ? (
          <p className="px-6 py-10 text-center text-base text-[#5f6368]">
            No production services ordered — you can add photography, cinematic video, 3D and VR when creating a development.
          </p>
        ) : (
          <div className="divide-y divide-[#f1f3f4]">
            {productionOrders.map(({ property, services, total }) => (
              <div key={property.id} className="px-6 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[15px] font-medium text-[#202124]">{property.name}</p>
                  <span className="rounded-full bg-[#fef7e0] px-3 py-1 text-[13px] font-medium text-[#b06000]">
                    awaiting scheduling
                  </span>
                </div>
                <div className="space-y-2">
                  {services.map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className="text-[15px] text-[#5f6368]">{s.label}</span>
                      <span className="text-[15px] tabular-nums text-[#202124]">{fmtUsd(s.price)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-[#f1f3f4] pt-2">
                    <span className="text-[15px] font-medium text-[#202124]">Subtotal</span>
                    <span className="text-[15px] font-medium tabular-nums text-[#202124]">{fmtUsd(total)}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between bg-[#f8f9fa] px-6 py-4">
              <span className="text-[15px] font-medium text-[#202124]">Total one-time</span>
              <span className="text-[18px] font-medium tabular-nums text-[#202124]">{fmtUsd(productionTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Invoices & receipts ── */}
      <InvoicesCard />

      {/* ── Payment methods ── */}
      <PaymentMethodsCard />

      {/* ── Payment history + how you pay ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PaymentHistoryCard />
        <PayWithMpesaCard />
      </div>
    </div>
  );
}


/* ── Payment history (live from the billing API) ─────────────────── */

function PaymentHistoryCard() {
  const { data: summary } = useQuery({
    queryKey: ['billing', 'summary'],
    queryFn: () => billingApi.summary(),
  });
  const payments = summary?.payments ?? [];

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <h3 className="text-[18px] font-normal text-[#202124]">Payment history</h3>
      {payments.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <CreditCard size={20} className="text-[#dadce0]" />
          <p className="max-w-xs text-[15px] leading-relaxed text-[#5f6368]">
            No payments recorded yet. Invoices and receipts will appear here once your first development goes live.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-[#f1f3f4]">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-[15px] font-medium text-[#202124]">
                  {p.metadata?.purpose === 'card_verification' ? 'Card verification hold'
                    : p.metadata?.purpose === 'mpesa_verification' ? 'M-Pesa verification'
                    : p.reference ?? p.method.replace('_', ' ').toLowerCase()}
                </p>
                <p className="text-[13px] text-[#5f6368]">
                  {new Date(p.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-medium tabular-nums text-[#202124]">
                  {p.currency} {p.amount.toLocaleString()}
                </p>
                <span className={`text-[13px] font-medium ${
                  p.status === 'COMPLETED' ? 'text-[#188038]'
                    : p.status === 'FAILED' ? 'text-[#c5221f]'
                    : p.status === 'REFUNDED' ? 'text-[#5f6368]'
                    : 'text-[#b06000]'
                }`}>
                  {p.status === 'REFUNDED' ? 'reversed' : p.status.toLowerCase()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


/* ── Pay pending bills with M-Pesa (STK push — no linking) ───────── */

function PayWithMpesaCard() {
  const queryClient = useQueryClient();
  const { data: summary } = useQuery({
    queryKey: ['billing', 'summary'],
    queryFn: () => billingApi.summary(),
  });
  const due = (summary?.production.pendingTotal ?? 0) + (summary?.monthly.total ?? 0);

  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice('');
    setError('');
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '254');
    if (!/^254(7|1)\d{8}$/.test(normalized)) {
      return setError('Enter a valid Safaricom number, e.g. 0712 345 678.');
    }
    const usd = Number.parseInt(amount || String(due), 10);
    if (!Number.isFinite(usd) || usd < 1) return setError('Enter an amount of at least $1.');

    setBusy(true);
    try {
      const res = await billingApi.payMpesa({
        phone: normalized,
        amountUsd: usd,
        purpose: 'e-resi pending bills',
      });
      setNotice(
        res.status === 'COMPLETED'
          ? `Payment of KES ${res.amountKes.toLocaleString()} received${res.sandbox ? ' (sandbox)' : ''} — thank you!`
          : `STK push sent for KES ${res.amountKes.toLocaleString()} — enter your M-Pesa PIN on your phone to complete.`,
      );
      setPhone('');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the M-Pesa payment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-transparent bg-[#e6f4ea] p-6">
      <div className="flex items-center gap-2">
        <Smartphone size={16} className="text-[#188038]" />
        <h3 className="text-[18px] font-normal text-[#202124]">Pay with M-Pesa</h3>
      </div>
      <p className="mt-1 text-sm text-[#3c4043]">
        Settle pending bills instantly — we send an STK push to your phone, you confirm with your PIN.
      </p>

      <div className="mt-4 rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-[#5f6368]">Pending balance</span>
          <span className="text-[18px] font-medium tabular-nums text-[#202124]">{fmtUsd(due)}</span>
        </div>
        {due > 0 && (
          <div className="mt-1 flex items-center justify-between text-[13px] text-[#80868b]">
            <span>listing fees {fmtUsd(summary?.monthly.total ?? 0)} · production {fmtUsd(summary?.production.pendingTotal ?? 0)}</span>
          </div>
        )}
      </div>

      {due <= 0 ? (
        <p className="mt-4 text-[15px] text-[#3c4043]">
          Nothing due right now — bills appear here when a development goes live or production is scheduled.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Safaricom number · 0712 345 678"
            required
            inputMode="tel"
            className="w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#188038] focus:outline-none focus:ring-2 focus:ring-[#188038]/20"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            placeholder={`Amount in USD (default ${fmtUsd(due)})`}
            inputMode="numeric"
            className="w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#188038] focus:outline-none focus:ring-2 focus:ring-[#188038]/20"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#188038] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#0d652d] transition-colors cursor-pointer disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Smartphone size={15} />}
            {busy ? 'Sending STK push…' : 'Send M-Pesa prompt'}
          </button>
        </form>
      )}

      {notice && <p className="mt-3 rounded-xl bg-white px-4 py-2.5 text-sm text-[#188038]">{notice}</p>}
      {error && <p className="mt-3 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}
    </div>
  );
}

/**
 * A developer's own invoices and receipts. Read-only — reminders and dispatch
 * are admin actions, so no controls appear here.
 */
function InvoicesCard() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-invoices'],
    queryFn: () => billingApi.invoices(),
  });

  const pay = useMutation({
    mutationFn: (invoice: Invoice) => billingApi.payInvoice(invoice.id),
    onSuccess: (r, invoice) => {
      // A saved card is charged server-side, so there is nothing to redirect
      // to — the invoice is already settled by the time this resolves.
      if (r.paid) {
        queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
        queryClient.invalidateQueries({ queryKey: ['billing', 'summary'] });
        const card = [r.chargedCard?.brand, r.chargedCard?.last4 && `•••• ${r.chargedCard.last4}`]
          .filter(Boolean).join(' ');
        setToast(card ? `Paid with ${card}.` : 'Payment complete.');
        setTimeout(() => setToast(''), 6000);
        return;
      }
      // Remember which invoice this was: Paystack returns with a reference but
      // no invoice id, and sessionStorage survives the redirect.
      sessionStorage.setItem('eresi:payingInvoice', invoice.id);
      window.location.href = r.authorizationUrl;
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not start the payment'),
  });

  /**
   * M-Pesa has no redirect to return through — Safaricom pushes the result
   * straight to the API once the PIN is entered. So instead of a return leg,
   * this polls the invoice list for a few seconds after sending the prompt,
   * which is enough for the row to flip to Paid without the developer having
   * to refresh manually.
   */
  const payMpesa = useMutation({
    mutationFn: ({ invoice, phone }: { invoice: Invoice; phone: string }) =>
      billingApi.payInvoiceMpesa(invoice.id, phone),
    onSuccess: (r) => {
      setError('');
      setToast(
        `Sent to your phone for ${r.invoiceNumber} — enter your M-Pesa PIN to complete. `
        + 'This page will update once it clears.',
      );
      const poll = setInterval(
        () => queryClient.invalidateQueries({ queryKey: ['my-invoices'] }),
        4000,
      );
      setTimeout(() => clearInterval(poll), 60_000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not start the M-Pesa payment'),
  });

  /**
   * Return leg from Paystack. The webhook settles this too, so this only
   * shortens the wait — both paths are idempotent.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paystack') !== 'invoice') return;
    const reference = params.get('reference') ?? params.get('trxref');
    const invoiceId = sessionStorage.getItem('eresi:payingInvoice');
    sessionStorage.removeItem('eresi:payingInvoice');
    window.history.replaceState({}, '', window.location.pathname);
    if (!reference || !invoiceId) return;

    billingApi.confirmInvoice(invoiceId, reference)
      .then((r) => {
        setToast(`Payment received — receipt ${r.number} is on its way to your inbox.`);
        queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      })
      .catch(() => {
        // The webhook will still settle it; do not alarm the customer.
        setToast('Payment received. Your receipt will arrive shortly.');
        queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      });
  }, [queryClient]);

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <h2 className="text-[18px] font-medium text-[#202124]">Invoices &amp; receipts</h2>
      <p className="mt-1 text-[14px] text-[#5f6368]">
        Listing fees are invoiced three days before they are charged. Receipts are
        issued automatically once payment clears.
      </p>
      {toast && (
        <p className="mt-3 rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>
      )}
      {error && (
        <p className="mt-3 rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>
      )}

      <div className="mt-4">
        {isLoading
          ? <p className="py-8 text-center text-[14px] text-[#5f6368]">Loading…</p>
          : (
            <InvoiceTable
              invoices={data ?? []}
              onPay={(inv) => { setError(''); pay.mutate(inv); }}
              payingId={pay.isPending ? pay.variables?.id : null}
              onPayMpesa={(inv, phone) => { setError(''); payMpesa.mutate({ invoice: inv, phone }); }}
              mpesaPayingId={payMpesa.isPending ? payMpesa.variables?.invoice.id : null}
            />
          )}
      </div>
    </div>
  );
}
