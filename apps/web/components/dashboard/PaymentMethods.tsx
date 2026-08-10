'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, CreditCard, Loader2, Lock, Plus, ShieldCheck, Smartphone, Trash2,
} from 'lucide-react';
import {
  billingApi, type LinkedMethod,
} from '../../lib/api/billing';
import { ApiError } from '../../lib/api/client';
import { cn } from '../../lib/utils';



export function PaymentMethodsCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: methods, isLoading } = useQuery({
    queryKey: ['billing', 'methods'],
    queryFn: () => billingApi.listMethods(),
  });

  const [adding, setAdding] = useState<'card' | 'paypal' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['billing'] });
  };

  // ── Paystack return leg: /dashboard/billing?paystack=callback&reference=... ──
  useEffect(() => {
    const state = searchParams.get('paystack');
    const reference = searchParams.get('reference') ?? searchParams.get('trxref');
    if (!state || !reference) return;

    setBusy(true);
    billingApi
      .paystackConfirm(reference)
      .then((m) => {
        setNotice(`Card ending ${m.last4 ?? '••••'} linked. The verification charge has been refunded.`);
        refresh();
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'That card could not be verified.'),
      )
      .finally(() => {
        setBusy(false);
        router.replace('/dashboard/billing');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            Cards and PayPal are charged automatically for monthly invoices. You can also pay any pending bill instantly with M-Pesa below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            ['card', 'Add card'],
            ['paypal', 'Link PayPal'],
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

  /**
   * Card details are collected by Paystack, not by us. We send the developer to
   * their hosted checkout and they come back with a reusable authorization —
   * so no card number or CVC ever reaches e-resi.
   */
  async function startLink() {
    onError('');
    setBusy(true);
    try {
      const { authorizationUrl } = await billingApi.paystackStart();
      window.location.href = authorizationUrl;
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Could not start card linking.');
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-5">
      <div className="flex items-start gap-3">
        <Lock size={18} className="mt-0.5 shrink-0 text-[#188038]" />
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[#202124]">
            You&apos;ll add your card on Paystack
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#5f6368]">
            We never see or store your card number. Paystack verifies the card with a
            small charge that is refunded straight away, and sends us back only the
            card type and last four digits.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startLink}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] cursor-pointer disabled:opacity-50"
        >
          {busy ? 'Opening Paystack…' : 'Continue to Paystack'}
          {!busy && <ArrowRight size={15} />}
        </button>
        <button
          type="button"
          onClick={() => onDone(false)}
          disabled={busy}
          className="rounded-full px-5 py-2.5 text-[14px] font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4] cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
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
        // Set when a stored authorization is rejected — most often a card
        // linked before the platform moved to live keys, which can never be
        // charged again. Says so, rather than leaving a bare "Failed".
        <span
          title="This card can no longer be charged. Remove it and link it again."
          className="hidden sm:inline-flex rounded-full bg-[#fce8e6] px-3 py-1 text-[13px] font-medium text-[#c5221f]"
        >
          Re-link needed
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
