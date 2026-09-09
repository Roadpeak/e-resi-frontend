'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2, Receipt, Smartphone } from 'lucide-react';
import { agentsApi, type AgentFeeRun } from '../../../../lib/api/agents';
import { AgentStatusBanner } from '../../../../components/agent/AgentStatusBanner';
import { PaymentMethodsCard } from '../../../../components/dashboard/PaymentMethods';
import { cn } from '../../../../lib/utils';

/** YYYY-MM → "August 2026". */
function periodLabel(period: string) {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
}

const STATUS_STYLES: Record<AgentFeeRun['status'], string> = {
  PAID: 'bg-[#e6f4ea] text-[#188038]',
  PENDING: 'bg-[#e8f0fe] text-[#1967d2]',
  FAILED: 'bg-[#fce8e6] text-[#c5221f]',
  SKIPPED: 'bg-[#f1f3f4] text-[#5f6368]',
};

const STATUS_LABELS: Record<AgentFeeRun['status'], string> = {
  PAID: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  // Charging nothing is not the same as a failure — it is usually the free month.
  SKIPPED: 'No charge',
};

export default function AgentBilling() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['agent', 'billing'],
    queryFn: () => agentsApi.billing(),
  });

  const runs = data?.runs ?? [];
  const next = data?.nextCharge;

  // M-Pesa: one open prompt at a time, keyed by the run being paid.
  const [mpesaPeriod, setMpesaPeriod] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [notice, setNotice] = useState('');

  const payMpesa = useMutation({
    mutationFn: ({ period, msisdn }: { period: string; msisdn: string }) =>
      agentsApi.payFeeMpesa(period, msisdn),
    onSuccess: (res) => {
      setMpesaPeriod(null);
      setNotice(
        res.status === 'COMPLETED'
          ? `Payment received — ${periodLabel(res.period)} is settled and your listing is active.`
          : 'Check your phone — an M-Pesa prompt is on its way. This page updates once you approve it.',
      );
      qc.invalidateQueries({ queryKey: ['agent', 'billing'] });
    },
    onError: (e: Error) => setPhoneError(e.message),
  });

  const retryCard = useMutation({
    mutationFn: (period: string) => agentsApi.retryFee(period),
    onSuccess: (res) => {
      setNotice(`Payment received — ${periodLabel(res.period)} is settled and your listing is active.`);
      qc.invalidateQueries({ queryKey: ['agent', 'billing'] });
    },
    // The API answers with the concrete decline reason (no card, declined…).
    onError: (e: Error) => {
      setNotice('');
      setMpesaPeriod(null);
      setPhoneError(e.message);
    },
  });

  const submitMpesa = (period: string) => {
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '254');
    if (!/^254(7|1)\d{8}$/.test(normalized)) {
      setPhoneError('Enter a valid Safaricom number, e.g. 0712 345 678.');
      return;
    }
    setPhoneError('');
    payMpesa.mutate({ period, msisdn: normalized });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Billing</h1>
        <p className="text-[14px] text-[#5f6368]">
          Your monthly listing fee keeps your profile visible in the agent directory.
        </p>
      </div>

      <AgentStatusBanner />

      <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <h2 className="text-[18px] font-normal text-[#202124]">Your plan</h2>
        {isLoading ? (
          <div className="flex py-6"><Loader2 size={20} className="animate-spin text-[#80868b]" /></div>
        ) : !next ? (
          <p className="mt-2 text-[14px] text-[#5f6368]">No billing set up yet.</p>
        ) : (
          <>
            <p className="mt-2 text-[28px] font-normal text-[#202124]">
              {next.currency} {next.amount.toLocaleString()}
              <span className="ml-1 text-[15px] text-[#5f6368]">/month</span>
            </p>
            <p className="text-[13px] text-[#5f6368]">
              {data?.agent?.kind === 'COMPANY' ? 'Agency rate' : 'Individual agent rate'}, VAT included.
            </p>
            {next.inFreeWindow && (
              <p className="mt-3 rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">
                {next.freeMonths === 1
                  ? 'Your first month is free — nothing will be charged yet.'
                  : `Your first ${next.freeMonths} months are free — nothing will be charged yet.`}
              </p>
            )}
          </>
        )}
      </div>

      {/* Billing charges the saved card automatically, so this is the one
          thing an agent must keep current to stay listed. */}
      <PaymentMethodsCard />

      <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <h2 className="mb-3 text-[18px] font-normal text-[#202124]">History</h2>
        {notice && (
          <p className="mb-3 rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{notice}</p>
        )}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[#80868b]" />
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Receipt size={24} className="text-[#dadce0]" />
            <p className="max-w-sm text-[14px] text-[#5f6368]">
              Nothing billed yet. Your charges will appear here each month.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#f1f3f4]">
            {runs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-[#202124]">{periodLabel(r.period)}</p>
                  {r.status === 'FAILED' && r.failureText && (
                    <p className="text-[13px] text-[#c5221f]">
                      {r.failureText}
                      {r.graceEndsAt && ` · listed until ${new Date(r.graceEndsAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`}
                    </p>
                  )}
                  {r.status === 'PAID' && r.chargedAt && (
                    <p className="text-[13px] text-[#5f6368]">
                      Charged {new Date(r.chargedAt).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-[15px] tabular-nums text-[#202124]">
                    {r.amount > 0 ? `${r.currency} ${r.amount.toLocaleString()}` : '—'}
                  </span>
                  <span className={cn(
                    'rounded-full px-3 py-1 text-[13px] font-medium',
                    STATUS_STYLES[r.status],
                  )}>
                    {STATUS_LABELS[r.status]}
                  </span>
                  {(r.status === 'PENDING' || r.status === 'FAILED') && r.amount > 0 && (
                    <>
                      <button
                        onClick={() => retryCard.mutate(r.period)}
                        disabled={retryCard.isPending}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] px-3.5 py-1.5 text-[13px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] disabled:opacity-60"
                      >
                        {retryCard.isPending && retryCard.variables === r.period
                          ? <Loader2 size={13} className="animate-spin" />
                          : <CreditCard size={13} />} Retry card
                      </button>
                      <button
                        onClick={() => {
                          setMpesaPeriod(mpesaPeriod === r.period ? null : r.period);
                          setPhoneError('');
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] px-3.5 py-1.5 text-[13px] font-medium text-[#188038] transition-colors hover:bg-[#f6fef9]"
                      >
                        <Smartphone size={13} /> Pay via M-Pesa
                      </button>
                    </>
                  )}
                </div>
                {phoneError && mpesaPeriod !== r.period && (
                  <p className="w-full text-[13px] text-[#c5221f]">{phoneError}</p>
                )}
                {mpesaPeriod === r.period && (
                  <div className="w-full">
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07xx xxx xxx"
                        inputMode="tel"
                        autoFocus
                        className="h-10 w-44 rounded-xl border border-[#dadce0] px-3.5 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]"
                      />
                      <button
                        onClick={() => submitMpesa(r.period)}
                        disabled={payMpesa.isPending}
                        className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[#188038] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#136c2e] disabled:opacity-60"
                      >
                        {payMpesa.isPending && <Loader2 size={14} className="animate-spin" />}
                        Send prompt — {r.currency} {r.amount.toLocaleString()}
                      </button>
                    </div>
                    {phoneError && <p className="mt-1.5 text-[13px] text-[#c5221f]">{phoneError}</p>}
                    <p className="mt-1.5 text-[12.5px] text-[#80868b]">
                      An STK prompt goes to this number — approve it with your M-Pesa PIN.
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[13px] text-[#5f6368]">
        Questions about a charge?{' '}
        <Link href="/contact" className="font-medium text-[#1a73e8] hover:text-[#1765cc]">
          Contact support
        </Link>
        .
      </p>
    </div>
  );
}
