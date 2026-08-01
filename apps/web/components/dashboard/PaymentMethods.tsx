'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check, CreditCard, Loader2, Lock, Plus, ShieldCheck, Smartphone, Trash2,
} from 'lucide-react';
import {
  billingApi, detectBrand, formatCardNumber, type LinkedMethod,
} from '../../lib/api/billing';
import { ApiError } from '../../lib/api/client';
import { cn } from '../../lib/utils';

const COUNTRIES = [
  { code: 'KE', name: 'Kenya' }, { code: 'UG', name: 'Uganda' }, { code: 'TZ', name: 'Tanzania' },
  { code: 'RW', name: 'Rwanda' }, { code: 'ET', name: 'Ethiopia' }, { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'AE', name: 'United Arab Emirates' },
];

const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';

export function PaymentMethodsCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: methods, isLoading } = useQuery({
    queryKey: ['billing', 'methods'],
    queryFn: () => billingApi.listMethods(),
  });

  const [adding, setAdding] = useState<'card' | 'paypal' | 'mpesa' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['billing'] });
  };

  // ── PayPal return leg: /dashboard/billing?paypal=confirm&token=... ──
  useEffect(() => {
    const state = searchParams.get('paypal');
    const token = searchParams.get('token');
    if (state === 'confirm' && token) {
      setBusy(true);
      billingApi
        .paypalConfirm(token)
        .then(() => {
          setNotice('PayPal linked — automatic monthly billing is enabled.');
          refresh();
        })
        .catch((err) =>
          setError(err instanceof ApiError ? err.message : 'PayPal confirmation failed.'),
        )
        .finally(() => {
          setBusy(false);
          router.replace('/dashboard/billing');
        });
    } else if (state === 'cancelled') {
      setError('PayPal linking was cancelled.');
      router.replace('/dashboard/billing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startPaypal() {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const { approvalUrl } = await billingApi.paypalStart();
      window.location.href = approvalUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start PayPal linking.');
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-normal text-[#202124]">Payment methods</h3>
          <p className="text-sm text-[#5f6368]">
            Your invoices — monthly listing fees and production services — are charged to the default method.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            ['card', 'Add card'],
            ['paypal', 'Link PayPal'],
            ['mpesa', 'Add M-Pesa'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setError('');
                setNotice('');
                if (key === 'paypal') startPaypal();
                else setAdding(adding === key ? null : key);
              }}
              disabled={busy && key === 'paypal'}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer disabled:opacity-50"
            >
              {busy && key === 'paypal' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p className="mt-4 rounded-xl bg-[#e6f4ea] px-4 py-2.5 text-sm text-[#188038]">{notice}</p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>
      )}

      {adding === 'card' && (
        <CardForm
          onDone={(sandbox) => {
            setAdding(null);
            setNotice(
              sandbox
                ? 'Card linked and verified (sandbox — processor keys not configured yet).'
                : 'Card verified — the $1.00 authorization has been reversed.',
            );
            refresh();
          }}
          onError={setError}
        />
      )}
      {adding === 'mpesa' && (
        <MpesaForm
          onDone={(pending) => {
            setAdding(null);
            setNotice(
              pending
                ? 'Check your phone — confirm the KES 1 M-Pesa prompt to finish verification (it is reversed).'
                : 'M-Pesa number linked and verified.',
            );
            refresh();
          }}
          onError={setError}
        />
      )}

      {/* ── Methods list ── */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex h-16 items-center justify-center">
            <Loader2 size={18} className="animate-spin text-[#80868b]" />
          </div>
        ) : (methods ?? []).length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[#f8f9fa] px-4 py-4">
            <CreditCard size={18} className="text-[#80868b]" />
            <p className="text-[15px] text-[#5f6368]">
              No payment methods yet — add a card, PayPal or M-Pesa above so invoices can be charged automatically.
            </p>
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

/* ── Google Payments-style card form ─────────────────────────────── */

function CardForm({
  onDone, onError,
}: {
  onDone: (sandbox: boolean) => void;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    cardholderName: '', number: '', expiry: '', cvc: '',
    addressLine1: '', addressLine2: '', city: '', postalCode: '', country: 'KE',
  });
  const brand = detectBrand(form.number);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    onError('');
    const digits = form.number.replace(/\D/g, '');
    const [mmRaw, yyRaw] = form.expiry.split('/');
    const mm = Number.parseInt(mmRaw?.trim(), 10);
    const yy = Number.parseInt(yyRaw?.trim(), 10);
    if (digits.length < 12) return onError('Enter a valid card number.');
    if (!mm || mm < 1 || mm > 12 || !yy) return onError('Expiry must be MM/YY.');
    if (!/^\d{3,4}$/.test(form.cvc)) return onError('CVC must be 3 or 4 digits.');

    setBusy(true);
    try {
      const res = await billingApi.linkCard({
        cardNumber: digits,
        expMonth: mm,
        expYear: 2000 + yy,
        cvc: form.cvc,
        cardholderName: form.cardholderName.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country,
      });
      onDone(Boolean(res.sandbox));
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Could not verify the card.');
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl bg-[#f8f9fa] p-5">
      <div className="grid gap-4">
        <div>
          <label className={labelCls}>Cardholder name</label>
          <input value={form.cardholderName} onChange={set('cardholderName')} required placeholder="Name on card" className={inputCls} autoComplete="cc-name" />
        </div>

        <div>
          <label className={labelCls}>Card number</label>
          <div className="relative">
            <input
              value={form.number}
              onChange={(e) => setForm((f) => ({ ...f, number: formatCardNumber(e.target.value) }))}
              required
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              className={cn(inputCls, 'pr-24')}
              autoComplete="cc-number"
            />
            {brand && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-[#202124] px-2 py-1 text-[11px] font-bold text-white">
                {brand}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Expiry</label>
            <input value={form.expiry} onChange={set('expiry')} required placeholder="MM/YY" className={inputCls} autoComplete="cc-exp" />
          </div>
          <div>
            <label className={labelCls}>CVC</label>
            <input
              value={form.cvc}
              onChange={(e) => setForm((f) => ({ ...f, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              required
              inputMode="numeric"
              placeholder="123"
              className={inputCls}
              autoComplete="cc-csc"
            />
          </div>
        </div>

        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#5f6368]">Billing address</p>

        <div>
          <label className={labelCls}>Country</label>
          <select value={form.country} onChange={set('country')} className={inputCls}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Address line 1</label>
          <input value={form.addressLine1} onChange={set('addressLine1')} required placeholder="Street address" className={inputCls} autoComplete="address-line1" />
        </div>
        <div>
          <label className={labelCls}>Address line 2 (optional)</label>
          <input value={form.addressLine2} onChange={set('addressLine2')} placeholder="Apartment, suite, floor" className={inputCls} autoComplete="address-line2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>City</label>
            <input value={form.city} onChange={set('city')} required placeholder="Nairobi" className={inputCls} autoComplete="address-level2" />
          </div>
          <div>
            <label className={labelCls}>Postal code</label>
            <input value={form.postalCode} onChange={set('postalCode')} required placeholder="00100" className={inputCls} autoComplete="postal-code" />
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-[#e8f0fe] p-3.5">
          <Lock size={14} className="mt-0.5 shrink-0 text-[#1a73e8]" />
          <p className="text-[13px] leading-relaxed text-[#3c4043]">
            To confirm this card we place a <span className="font-medium">$1.00 verification hold</span> which
            is reversed automatically. Card details are sent securely for verification only — we store just
            the brand, last 4 digits and expiry.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
          {busy ? 'Verifying card…' : 'Verify & save card'}
        </button>
      </div>
    </form>
  );
}

/* ── M-Pesa form ─────────────────────────────────────────────────── */

function MpesaForm({
  onDone, onError,
}: {
  onDone: (pending: boolean) => void;
  onError: (msg: string) => void;
}) {
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    onError('');
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '254').replace(/^\+/, '');
    if (!/^254(7|1)\d{8}$/.test(normalized)) {
      return onError('Enter a valid Safaricom number, e.g. 0712 345 678.');
    }
    setBusy(true);
    try {
      const res = await billingApi.linkMpesa(normalized);
      onDone(res.verification === 'PENDING');
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Could not link the M-Pesa number.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl bg-[#f8f9fa] p-5 sm:grid-cols-[1fr_auto]">
      <div>
        <label className={labelCls}>Safaricom phone number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0712 345 678"
          required
          inputMode="tel"
          className={inputCls}
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-1.5 self-end rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Link
      </button>
      <p className="sm:col-span-2 text-[13px] text-[#5f6368]">
        We send a KES 1 M-Pesa prompt to verify the number — approve it on your phone and the shilling is reversed.
      </p>
    </form>
  );
}

/* ── Method row ──────────────────────────────────────────────────── */

function MethodRow({ method, onChanged }: { method: LinkedMethod; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  const tile = method.type === 'PAYPAL'
    ? { text: 'PayPal', cls: 'bg-[#e8f0fe] text-[#1967d2]' }
    : method.type === 'MPESA'
      ? { text: 'M-PESA', cls: 'bg-[#e6f4ea] text-[#188038]' }
      : { text: method.brand ?? 'Card', cls: 'bg-[#202124] text-white' };

  const title = method.type === 'PAYPAL'
    ? method.paypalEmail
    : method.type === 'MPESA'
      ? `+${method.mpesaPhone}`
      : `${method.brand} •••• ${method.last4}`;

  const subtitle = method.type === 'PAYPAL'
    ? 'Automatic monthly billing enabled'
    : method.type === 'MPESA'
      ? 'M-Pesa'
      : `${method.cardholderName ?? ''} · expires ${String(method.expMonth).padStart(2, '0')}/${String(method.expYear).slice(-2)}`;

  return (
    <li className="flex items-center gap-4 py-3.5">
      <span className={cn('flex h-10 w-14 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold', tile.cls)}>
        {method.type === 'MPESA' ? <Smartphone size={16} /> : tile.text}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-[#202124]">{title}</p>
        <p className="truncate text-[13px] text-[#5f6368]">{subtitle}</p>
      </div>

      {method.verification === 'VERIFIED' ? (
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] px-3 py-1 text-[13px] font-medium text-[#188038]">
          <ShieldCheck size={12} /> Verified
        </span>
      ) : method.verification === 'PENDING' ? (
        <span className="hidden sm:inline-flex rounded-full bg-[#fef7e0] px-3 py-1 text-[13px] font-medium text-[#b06000]">
          Awaiting confirmation
        </span>
      ) : (
        <span className="hidden sm:inline-flex rounded-full bg-[#fce8e6] px-3 py-1 text-[13px] font-medium text-[#c5221f]">
          Failed
        </span>
      )}

      {method.isDefault ? (
        <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-[13px] font-medium text-[#1967d2]">Default</span>
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
