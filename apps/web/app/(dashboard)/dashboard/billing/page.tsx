'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, ArrowRight, CheckCircle2, CreditCard, HelpCircle, Loader2, Receipt, Smartphone,
} from 'lucide-react';
import { ApiError } from '../../../../lib/api/client';
import { billingApi, type Invoice } from '../../../../lib/api/billing';
import { PaymentMethodsCard } from '../../../../components/dashboard/PaymentMethods';
import { InvoiceTable, money, shortDate } from '../../../../components/billing/InvoiceTable';
import { serviceById } from '../../../../lib/onboarding/catalog';
import { useCatalog } from '../../../../lib/onboarding/useCatalog';
import { cn } from '../../../../lib/utils';

/**
 * Developer billing, organised around the one question people open it with:
 * "what do I owe, and how do I pay it?" — answered at the top, with the pay
 * button right there. Detail lives in tabs (invoices, listing fees,
 * production, payments) instead of one long scroll; payment method, M-Pesa
 * and help sit in a side column.
 */

type Tab = 'invoices' | 'listing' | 'production' | 'payments';
type InvoiceFilter = 'unpaid' | 'paid' | 'all';

const isUnpaid = (i: Invoice) => i.status === 'ISSUED' || i.status === 'OVERDUE';
const isSettled = (i: Invoice) => i.status === 'PAID' || i.status === 'WAIVED';

const LISTING_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Live', cls: 'bg-[#e6f4ea] text-[#188038]' },
  OFF_PLAN: { label: 'Live', cls: 'bg-[#e6f4ea] text-[#188038]' },
  DRAFT: { label: 'In review', cls: 'bg-[#fef7e0] text-[#b06000]' },
  SOLD_OUT: { label: 'Sold out', cls: 'bg-[#f1f3f4] text-[#5f6368]' },
  ARCHIVED: { label: 'Archived', cls: 'bg-[#f1f3f4] text-[#5f6368]' },
};

const card = 'rounded-3xl border border-[#dadce0] bg-white';

export default function BillingPage() {
  // Hydrates the catalogue with admin-managed service names and prices.
  useCatalog();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('invoices');
  const [filter, setFilter] = useState<InvoiceFilter>('unpaid');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['billing', 'summary'],
    queryFn: () => billingApi.summary(),
  });
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['my-invoices'],
    queryFn: () => billingApi.invoices(),
  });

  const all = useMemo(() => invoices ?? [], [invoices]);
  const unpaid = all.filter(isUnpaid);
  const overdue = unpaid.filter((i) => i.status === 'OVERDUE');
  const dueCurrency = unpaid[0]?.currency ?? summary?.currency ?? 'KES';
  const dueTotal = unpaid.filter((i) => i.currency === dueCurrency).reduce((n, i) => n + i.total, 0);
  const nextDue = [...unpaid].sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))[0];
  const terminates = unpaid.map((i) => i.terminatesAt).filter(Boolean).sort()[0];

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 6000); };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['billing', 'summary'] });
  };

  const pay = useMutation({
    mutationFn: (invoice: Invoice) => billingApi.payInvoice(invoice.id),
    onSuccess: (r, invoice) => {
      // A saved card is charged server-side: the invoice is already settled.
      if (r.paid) {
        refresh();
        const c = [r.chargedCard?.brand, r.chargedCard?.last4 && `•••• ${r.chargedCard.last4}`].filter(Boolean).join(' ');
        flash(c ? `Paid with ${c}.` : 'Payment complete.');
        return;
      }
      // Paystack returns with a reference but no invoice id; sessionStorage survives the redirect.
      sessionStorage.setItem('eresi:payingInvoice', invoice.id);
      window.location.href = r.authorizationUrl;
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not start the payment'),
  });

  // M-Pesa has no return leg: poll for a minute so the row flips to Paid by itself.
  const payMpesa = useMutation({
    mutationFn: ({ invoice, phone }: { invoice: Invoice; phone: string }) => billingApi.payInvoiceMpesa(invoice.id, phone),
    onSuccess: (r) => {
      setError('');
      flash(`Sent to your phone for ${r.invoiceNumber} — enter your M-Pesa PIN. This page updates once it clears.`);
      const poll = setInterval(() => queryClient.invalidateQueries({ queryKey: ['my-invoices'] }), 4000);
      setTimeout(() => clearInterval(poll), 60_000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not start the M-Pesa payment'),
  });

  // Return leg from Paystack (the webhook settles it too; both are idempotent).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paystack') !== 'invoice') return;
    const reference = params.get('reference') ?? params.get('trxref');
    const invoiceId = sessionStorage.getItem('eresi:payingInvoice');
    sessionStorage.removeItem('eresi:payingInvoice');
    window.history.replaceState({}, '', window.location.pathname);
    if (!reference || !invoiceId) return;
    billingApi.confirmInvoice(invoiceId, reference)
      .then((r) => { flash(`Payment received — receipt ${r.number} is on its way to your inbox.`); refresh(); })
      .catch(() => { flash('Payment received. Your receipt will arrive shortly.'); refresh(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = filter === 'unpaid' ? unpaid : filter === 'paid' ? all.filter(isSettled) : all;
  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'invoices', label: 'Invoices', badge: unpaid.length || undefined },
    { key: 'listing', label: 'Listing fees' },
    { key: 'production', label: 'Production' },
    { key: 'payments', label: 'Payments' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Billing</h1>
          <p className="text-[14px] text-[#5f6368]">A monthly listing fee per live development, plus any production you order.</p>
        </div>
        <Link href="/dashboard/support" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1a73e8] hover:underline">
          <HelpCircle size={15} /> Question about a charge?
        </Link>
      </div>

      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}
      {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* ── What you owe ── */}
          {invoicesLoading ? (
            <div className={cn(card, 'flex h-40 items-center justify-center')}><Loader2 size={22} className="animate-spin text-[#80868b]" /></div>
          ) : unpaid.length ? (
            <section className={cn('rounded-3xl p-6', overdue.length ? 'bg-[#fce8e6]' : 'bg-[#e8f0fe]')}>
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className={cn('flex items-center gap-1.5 text-[13px] font-medium', overdue.length ? 'text-[#c5221f]' : 'text-[#1967d2]')}>
                    {overdue.length ? <AlertTriangle size={15} /> : <Receipt size={15} />}
                    {overdue.length ? `${overdue.length} overdue` : 'Amount due'}
                  </p>
                  <p className="mt-2 text-[36px] font-normal leading-none text-[#202124] tabular-nums">{money(dueTotal, dueCurrency)}</p>
                  <p className="mt-2 text-[14px] text-[#3c4043]">
                    {unpaid.length} unpaid invoice{unpaid.length === 1 ? '' : 's'}
                    {nextDue && ` · next due ${shortDate(nextDue.dueAt)}`}
                  </p>
                  {terminates && (
                    <p className="mt-1 text-[13px] font-medium text-[#c5221f]">
                      Pay by {shortDate(terminates)} to keep your developments online.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {unpaid.length === 1 ? (
                    <button type="button" onClick={() => { setError(''); pay.mutate(unpaid[0]); }} disabled={pay.isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50">
                      {pay.isPending ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                      Pay {money(unpaid[0].total, unpaid[0].currency)}
                    </button>
                  ) : (
                    <button type="button" onClick={() => { setTab('invoices'); setFilter('unpaid'); }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]">
                      Review &amp; pay <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#e6f4ea] p-6">
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#188038]"><CheckCircle2 size={15} /> All paid up</p>
                <p className="mt-2 text-[20px] font-normal text-[#202124]">Nothing is due right now.</p>
                {!!summary?.monthly.liveCount && (
                  <p className="mt-1 text-[14px] text-[#3c4043]">
                    Monthly listing fees: {money(summary.monthly.total, summary.currency)} for {summary.monthly.liveCount} live
                    {summary.monthly.liveCount === 1 ? ' development' : ' developments'}. Invoiced 3 days before each charge.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ── Detail ── */}
          <section className={card}>
            <div className="flex gap-1 overflow-x-auto border-b border-[#f1f3f4] px-3 pt-3" role="tablist">
              {tabs.map((t) => (
                <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                  className={cn('relative shrink-0 rounded-t-xl px-4 py-2.5 text-[14px] font-medium transition-colors',
                    tab === t.key ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]')}>
                  {t.label}
                  {t.badge ? <span className="ml-1.5 rounded-full bg-[#c5221f] px-1.5 py-0.5 text-[11px] text-white">{t.badge}</span> : null}
                  {tab === t.key && <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-t-full bg-[#1a73e8]" />}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6">
              {tab === 'invoices' && (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-1.5">
                      {(['unpaid', 'paid', 'all'] as const).map((f) => {
                        const n = f === 'unpaid' ? unpaid.length : f === 'paid' ? all.filter(isSettled).length : all.length;
                        return (
                          <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
                            className={cn('rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                              filter === f ? 'border-[#202124] bg-[#202124] text-white' : 'border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]')}>
                            {f === 'unpaid' ? 'Unpaid' : f === 'paid' ? 'Paid' : 'All'}
                            <span className="ml-1.5 tabular-nums opacity-60">{n}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[12.5px] text-[#80868b]">Receipts are emailed automatically once a payment clears.</p>
                  </div>
                  {invoicesLoading ? (
                    <p className="py-8 text-center text-[14px] text-[#5f6368]">Loading…</p>
                  ) : shown.length === 0 ? (
                    <Empty icon={<Receipt size={22} />} text={filter === 'unpaid' ? 'No unpaid invoices.' : 'No invoices yet. They appear once a development goes live or production is ordered.'} />
                  ) : (
                    <InvoiceTable
                      invoices={shown}
                      onPay={(inv) => { setError(''); pay.mutate(inv); }}
                      payingId={pay.isPending ? pay.variables?.id : null}
                      onPayMpesa={(inv, phone) => { setError(''); payMpesa.mutate({ invoice: inv, phone }); }}
                      mpesaPayingId={payMpesa.isPending ? payMpesa.variables?.invoice.id : null}
                    />
                  )}
                </>
              )}

              {tab === 'listing' && (
                summaryLoading ? <p className="py-8 text-center text-[14px] text-[#5f6368]">Loading…</p>
                : !summary?.listings.length ? (
                  <Empty icon={<Receipt size={22} />} text="No developments yet — nothing is being billed.">
                    <Link href="/dashboard/developments/new" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc]">
                      Add a development <ArrowRight size={14} />
                    </Link>
                  </Empty>
                ) : (
                  <>
                    <p className="mb-4 text-[13.5px] text-[#5f6368]">
                      {money(summary.feePerListing, summary.currency)} a month per development, starting only once it goes live.
                    </p>
                    <ul className="divide-y divide-[#f1f3f4] rounded-2xl border border-[#f1f3f4]">
                      {summary.listings.map((l) => {
                        const st = LISTING_STATUS[l.status] ?? LISTING_STATUS.DRAFT;
                        return (
                          <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <Link href={`/dashboard/properties/${l.slug}`} className="truncate text-[15px] font-medium text-[#202124] hover:underline">{l.name}</Link>
                              <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium', st.cls)}>{st.label}</span>
                            </div>
                            <span className="text-[15px] tabular-nums">
                              {l.monthlyFee > 0
                                ? <span className="font-medium text-[#202124]">{money(l.monthlyFee, summary.currency)}<span className="text-[13px] font-normal text-[#80868b]"> /mo</span></span>
                                : <span className="text-[13px] text-[#80868b]">Starts when live</span>}
                            </span>
                          </li>
                        );
                      })}
                      <li className="flex items-center justify-between bg-[#f8f9fa] px-4 py-3.5">
                        <span className="text-[14px] font-medium text-[#202124]">Total per month</span>
                        <span className="text-[17px] font-medium tabular-nums text-[#202124]">{money(summary.monthly.total, summary.currency)}</span>
                      </li>
                    </ul>
                  </>
                )
              )}

              {tab === 'production' && (
                summaryLoading ? <p className="py-8 text-center text-[14px] text-[#5f6368]">Loading…</p>
                : !summary?.production.orders.length ? (
                  <Empty icon={<Receipt size={22} />} text="No production ordered. Order photography, cinematic video, 3D or VR from a development's Production services page." />
                ) : (
                  <>
                    <p className="mb-4 text-[13.5px] text-[#5f6368]">One-time work, invoiced when ordered: 50% before the shoot, 50% on delivery.</p>
                    <div className="space-y-3">
                      {summary.production.orders.map((o) => (
                        <div key={o.propertyId} className="rounded-2xl border border-[#f1f3f4] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[15px] font-medium text-[#202124]">{o.name}</p>
                            <span className="text-[15px] font-medium tabular-nums text-[#202124]">{money(o.total, summary.currency)}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {o.serviceIds.map((id) => (
                              <span key={id} className="rounded-full bg-[#f1f3f4] px-2.5 py-1 text-[12.5px] text-[#3c4043]">{serviceById(id)?.label ?? id.replace(/_/g, ' ')}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#f8f9fa] px-4 py-3.5">
                      <span className="text-[14px] font-medium text-[#202124]">Pending production total</span>
                      <span className="text-[17px] font-medium tabular-nums text-[#202124]">{money(summary.production.pendingTotal, summary.currency)}</span>
                    </div>
                  </>
                )
              )}

              {tab === 'payments' && <PaymentHistory payments={summary?.payments ?? []} loading={summaryLoading} />}
            </div>
          </section>
        </div>

        {/* ── Side column ── */}
        <aside className="space-y-6">
          <PaymentMethodsCard />
          <PayWithMpesaCard />
          <div className={cn(card, 'p-5')}>
            <h3 className="text-[15px] font-medium text-[#202124]">How billing works</h3>
            <ul className="mt-3 space-y-2.5 text-[13.5px] leading-relaxed text-[#5f6368]">
              <li>• Each live development has a monthly listing fee; drafts and archived ones are free.</li>
              <li>• Listing fees are invoiced 3 days before your saved card is charged.</li>
              <li>• Production is invoiced when ordered: half before the shoot, half on delivery.</li>
              <li>• Pay any invoice by card or M-Pesa; receipts arrive by email.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Empty({ icon, text, children }: { icon: React.ReactNode; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="text-[#bdc1c6]">{icon}</span>
      <p className="max-w-sm text-[14px] leading-relaxed text-[#5f6368]">{text}</p>
      {children}
    </div>
  );
}

/* ── Payment history ─────────────────────────────────────────────── */

function PaymentHistory({ payments, loading }: { payments: { id: string; amount: number; currency: string; method: string; status: string; reference?: string | null; metadata?: { purpose?: string } | null; createdAt: string }[]; loading: boolean }) {
  if (loading) return <p className="py-8 text-center text-[14px] text-[#5f6368]">Loading…</p>;
  if (!payments.length) return <Empty icon={<CreditCard size={22} />} text="No payments yet. Card and M-Pesa payments appear here once made." />;
  return (
    <ul className="divide-y divide-[#f1f3f4]">
      {payments.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-medium text-[#202124]">
              {p.metadata?.purpose === 'card_verification' ? 'Card verification hold'
                : p.metadata?.purpose === 'mpesa_verification' ? 'M-Pesa verification'
                : p.reference ?? p.method.replace('_', ' ').toLowerCase()}
            </p>
            <p className="text-[12.5px] text-[#5f6368]">
              {new Date(p.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} · {p.method.replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[14.5px] font-medium tabular-nums text-[#202124]">{p.currency} {p.amount.toLocaleString()}</p>
            <span className={cn('text-[12.5px] font-medium',
              p.status === 'COMPLETED' ? 'text-[#188038]' : p.status === 'FAILED' ? 'text-[#c5221f]' : p.status === 'REFUNDED' ? 'text-[#5f6368]' : 'text-[#b06000]')}>
              {p.status === 'REFUNDED' ? 'reversed' : p.status.toLowerCase()}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── Pay a balance with M-Pesa (STK push) ────────────────────────── */

function PayWithMpesaCard() {
  const queryClient = useQueryClient();
  const { data: summary } = useQuery({ queryKey: ['billing', 'summary'], queryFn: () => billingApi.summary() });
  const due = (summary?.production.pendingTotal ?? 0) + (summary?.monthly.total ?? 0);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(''); setError('');
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '254');
    if (!/^254(7|1)\d{8}$/.test(normalized)) return setError('Enter a valid Safaricom number, e.g. 0712 345 678.');
    const usd = Number.parseInt(amount || String(due), 10);
    if (!Number.isFinite(usd) || usd < 1) return setError('Enter an amount of at least $1.');
    setBusy(true);
    try {
      const res = await billingApi.payMpesa({ phone: normalized, amountUsd: usd, purpose: 'e-resi pending bills' });
      setNotice(res.status === 'COMPLETED'
        ? `Payment of KES ${res.amountKes.toLocaleString()} received${res.sandbox ? ' (sandbox)' : ''} — thank you!`
        : `Prompt sent for KES ${res.amountKes.toLocaleString()} — enter your M-Pesa PIN to complete.`);
      setPhone(''); setAmount('');
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the M-Pesa payment.');
    } finally {
      setBusy(false);
    }
  }

  if (due <= 0) return null;
  return (
    <div className="rounded-3xl bg-[#e6f4ea] p-5">
      <h3 className="flex items-center gap-2 text-[15px] font-medium text-[#202124]"><Smartphone size={16} className="text-[#188038]" /> Pay a balance with M-Pesa</h3>
      <p className="mt-1 text-[13px] text-[#3c4043]">For bills not yet on an invoice. To pay an invoice, use its M-Pesa button.</p>
      <form onSubmit={submit} className="mt-3 grid gap-2.5">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" required inputMode="tel"
          className="w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[14px] text-[#202124] outline-none focus:border-[#188038]" />
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder={`Amount in USD (default ${due.toLocaleString()})`} inputMode="numeric"
          className="w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[14px] text-[#202124] outline-none focus:border-[#188038]" />
        <button type="submit" disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#188038] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#0d652d] disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Smartphone size={15} />} {busy ? 'Sending…' : 'Send M-Pesa prompt'}
        </button>
      </form>
      {notice && <p className="mt-3 rounded-xl bg-white px-3.5 py-2 text-[13px] text-[#188038]">{notice}</p>}
      {error && <p className="mt-3 rounded-xl bg-[#fce8e6] px-3.5 py-2 text-[13px] text-[#c5221f]">{error}</p>}
    </div>
  );
}
