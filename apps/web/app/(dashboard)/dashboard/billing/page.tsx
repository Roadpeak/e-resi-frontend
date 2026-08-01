'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, CalendarClock, Check, CreditCard, Info, Loader2, Plus, Receipt, Trash2, Wallet,
} from 'lucide-react';
import { propertiesApi } from '../../../../lib/api/properties';
import { billingApi, detectBrand, type LinkedMethod } from '../../../../lib/api/billing';
import { ApiError } from '../../../../lib/api/client';
import { LISTING_FEE_MONTHLY, fmtUsd, serviceById } from '../../../../lib/onboarding/catalog';

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

      {/* ── Payment methods ── */}
      <PaymentMethodsCard />

      {/* ── Payment history + how you pay ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PaymentHistoryCard />
        <div className="rounded-3xl border border-transparent bg-[#f8f9fa] p-6">
          <h3 className="text-[18px] font-normal text-[#202124]">How you pay</h3>
          <div className="mt-4 flex items-start gap-3">
            <Info size={16} className="mt-0.5 shrink-0 text-[#1a73e8]" />
            <p className="text-[15px] leading-relaxed text-[#5f6368]">
              Listing fees are invoiced monthly per live development. Production services are invoiced
              directly by the e-resi team — 50% to confirm your shoot dates, 50% on delivery.
              M-Pesa and card payments are coming to the dashboard; for now our billing team reaches
              out with each invoice.
            </p>
          </div>
          <a
            href="mailto:billing@e-resi.co.ke"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors"
          >
            Contact billing <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}


/* ── Payment methods ─────────────────────────────────────────────── */

function PaymentMethodsCard() {
  const queryClient = useQueryClient();
  const { data: methods, isLoading } = useQuery({
    queryKey: ['billing', 'methods'],
    queryFn: () => billingApi.listMethods(),
  });
  const [adding, setAdding] = useState<'card' | 'paypal' | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [card, setCard] = useState({ number: '', expiry: '' });
  const [paypalEmail, setPaypalEmail] = useState('');

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['billing', 'methods'] });

  async function submitCard(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const digits = card.number.replace(/\D/g, '');
    const [mm, yy] = card.expiry.split('/').map((v) => Number.parseInt(v?.trim(), 10));
    if (digits.length < 12) { setError('Enter a valid card number.'); return; }
    if (!mm || mm < 1 || mm > 12 || !yy) { setError('Expiry must be MM/YY.'); return; }
    setBusy(true);
    try {
      // Only display metadata leaves the browser — never the full number.
      await billingApi.linkCard({
        brand: detectBrand(digits),
        last4: digits.slice(-4),
        expMonth: mm,
        expYear: 2000 + yy,
      });
      setCard({ number: '', expiry: '' });
      setAdding(null);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not link card.');
    } finally {
      setBusy(false);
    }
  }

  async function submitPaypal(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await billingApi.linkPaypal(paypalEmail.trim());
      setPaypalEmail('');
      setAdding(null);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not link PayPal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-normal text-[#202124]">Payment methods</h3>
          <p className="text-sm text-[#5f6368]">Used for listing fees and production invoices once payments go live.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setAdding(adding === 'card' ? null : 'card'); setError(''); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer"
          >
            <Plus size={14} /> Link card
          </button>
          <button
            onClick={() => { setAdding(adding === 'paypal' ? null : 'paypal'); setError(''); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer"
          >
            <Plus size={14} /> Link PayPal
          </button>
        </div>
      </div>

      {/* Add forms */}
      {adding === 'card' && (
        <form onSubmit={submitCard} className="mt-4 grid gap-3 rounded-2xl bg-[#f8f9fa] p-4 sm:grid-cols-[1fr_130px_auto]">
          <input
            value={card.number}
            onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/[^\d ]/g, '') }))}
            placeholder="Card number"
            inputMode="numeric"
            autoComplete="cc-number"
            className="rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
          />
          <input
            value={card.expiry}
            onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
            placeholder="MM/YY"
            autoComplete="cc-exp"
            className="rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Link
          </button>
          <p className="sm:col-span-3 text-[13px] text-[#5f6368]">
            Your full card number never leaves this device — we keep only the brand, last 4 digits and expiry for reference.
          </p>
        </form>
      )}
      {adding === 'paypal' && (
        <form onSubmit={submitPaypal} className="mt-4 grid gap-3 rounded-2xl bg-[#f8f9fa] p-4 sm:grid-cols-[1fr_auto]">
          <input
            type="email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            placeholder="PayPal email address"
            required
            className="rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Link
          </button>
        </form>
      )}
      {error && <p className="mt-3 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

      {/* Methods list */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex h-16 items-center justify-center">
            <Loader2 size={18} className="animate-spin text-[#80868b]" />
          </div>
        ) : (methods ?? []).length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[#f8f9fa] px-4 py-4">
            <CreditCard size={18} className="text-[#80868b]" />
            <p className="text-[15px] text-[#5f6368]">No payment methods linked yet — add a card or PayPal above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#f1f3f4]">
            {(methods ?? []).map((m) => (
              <MethodRow key={m.id} method={m} onChanged={refresh} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MethodRow({ method, onChanged }: { method: LinkedMethod; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  return (
    <li className="flex items-center gap-4 py-3.5">
      <span className={`flex h-10 w-14 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
        method.type === 'PAYPAL' ? 'bg-[#e8f0fe] text-[#1967d2]' : 'bg-[#202124] text-white'
      }`}>
        {method.type === 'PAYPAL' ? 'PayPal' : (method.brand ?? 'Card')}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-[#202124]">
          {method.type === 'PAYPAL' ? method.paypalEmail : `${method.brand} •••• ${method.last4}`}
        </p>
        <p className="text-[13px] text-[#5f6368]">
          {method.type === 'PAYPAL'
            ? 'PayPal account'
            : `Expires ${String(method.expMonth).padStart(2, '0')}/${String(method.expYear).slice(-2)}`}
        </p>
      </div>
      {method.isDefault ? (
        <span className="rounded-full bg-[#e6f4ea] px-3 py-1 text-[13px] font-medium text-[#188038]">Default</span>
      ) : (
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await billingApi.setDefault(method.id).catch(() => {});
            onChanged();
            setBusy(false);
          }}
          className="text-[14px] font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
        >
          Set default
        </button>
      )}
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await billingApi.remove(method.id).catch(() => {});
          onChanged();
          setBusy(false);
        }}
        aria-label="Remove payment method"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#80868b] hover:bg-[#fce8e6] hover:text-[#c5221f] transition-colors cursor-pointer disabled:opacity-50"
      >
        <Trash2 size={15} />
      </button>
    </li>
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
                  {p.reference ?? p.method.replace('_', ' ').toLowerCase()}
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
                  p.status === 'COMPLETED' ? 'text-[#188038]' : p.status === 'FAILED' ? 'text-[#c5221f]' : 'text-[#b06000]'
                }`}>
                  {p.status.toLowerCase()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
