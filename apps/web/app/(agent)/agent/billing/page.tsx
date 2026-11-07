'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, CreditCard, HelpCircle, Loader2, Receipt, Smartphone } from 'lucide-react';
import { agentsApi, type AgentFeeRun } from '../../../../lib/api/agents';
import { AgentStatusBanner } from '../../../../components/agent/AgentStatusBanner';
import { PaymentMethodsCard } from '../../../../components/dashboard/PaymentMethods';
import { cn } from '../../../../lib/utils';

/**
 * Agent billing: what the plan costs and whether anything is owed, side by
 * side at the top with the way to pay right there; the monthly history
 * below; payment method and help in a side column.
 */

/** YYYY-MM → "August 2026". */
function periodLabel(period: string) {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
}
const day = (v: string) => new Date(v).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

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
  // Charging nothing is not a failure — usually the free month, or a waiver.
  SKIPPED: 'No charge',
};

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const isOwed = (r: AgentFeeRun) => (r.status === 'PENDING' || r.status === 'FAILED') && r.amount > 0;

export default function AgentBilling() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['agent', 'billing'], queryFn: () => agentsApi.billing() });

  const runs = data?.runs ?? [];
  const next = data?.nextCharge;
  const owed = runs.filter(isOwed);
  const owedCurrency = owed[0]?.currency ?? next?.currency ?? 'KES';
  const owedTotal = owed.reduce((n, r) => n + r.amount, 0);
  const oldest = [...owed].sort((a, b) => a.period.localeCompare(b.period))[0];
  const grace = owed.map((r) => r.graceEndsAt).filter(Boolean).sort()[0];
  const lastPaid = runs.find((r) => r.status === 'PAID' && r.chargedAt);

  // M-Pesa: one open prompt at a time, keyed by the run being paid.
  const [mpesaPeriod, setMpesaPeriod] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [notice, setNotice] = useState('');

  const payMpesa = useMutation({
    mutationFn: ({ period, msisdn }: { period: string; msisdn: string }) => agentsApi.payFeeMpesa(period, msisdn),
    onSuccess: (res) => {
      setMpesaPeriod(null);
      setNotice(res.status === 'COMPLETED'
        ? `Payment received — ${periodLabel(res.period)} is settled and your listing is active.`
        : 'Check your phone — an M-Pesa prompt is on its way. This page updates once you approve it.');
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
    onError: (e: Error) => { setNotice(''); setMpesaPeriod(null); setPhoneError(e.message); },
  });

  const submitMpesa = (period: string) => {
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '254');
    if (!/^254(7|1)\d{8}$/.test(normalized)) { setPhoneError('Enter a valid Safaricom number, e.g. 0712 345 678.'); return; }
    setPhoneError('');
    payMpesa.mutate({ period, msisdn: normalized });
  };

  /** Card retry + M-Pesa for one month, with its inline phone prompt. */
  // Plain render functions, not components: a component defined inside the
  // page remounts each render and the phone field would lose focus per key.
  const payActions = (r: AgentFeeRun, compact = false) => (
    <div className={cn('flex flex-wrap items-center gap-2', compact && 'justify-end')}>
      <button onClick={() => retryCard.mutate(r.period)} disabled={retryCard.isPending}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60">
        {retryCard.isPending && retryCard.variables === r.period ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />} Pay by card
      </button>
      <button onClick={() => { setMpesaPeriod(mpesaPeriod === r.period ? null : r.period); setPhoneError(''); }}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#188038] bg-white px-4 py-2 text-[13px] font-medium text-[#188038] transition-colors hover:bg-[#f6fef9]">
        <Smartphone size={13} /> M-Pesa
      </button>
    </div>
  );

  const mpesaPrompt = (r: AgentFeeRun) => mpesaPeriod === r.period ? (
    <div className="mt-3 w-full rounded-2xl bg-[#f8f9fa] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xx xxx xxx" inputMode="tel" autoFocus
          className="h-10 w-44 rounded-xl border border-[#dadce0] bg-white px-3.5 text-[14px] text-[#202124] outline-none focus:border-[#188038]" />
        <button onClick={() => submitMpesa(r.period)} disabled={payMpesa.isPending}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[#188038] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#136c2e] disabled:opacity-60">
          {payMpesa.isPending && <Loader2 size={14} className="animate-spin" />} Send prompt — {r.currency} {r.amount.toLocaleString()}
        </button>
      </div>
      <p className="mt-1.5 text-[12.5px] text-[#80868b]">Approve the prompt with your M-Pesa PIN.</p>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Billing</h1>
          <p className="text-[14px] text-[#5f6368]">Your monthly listing fee keeps your profile visible in the agent directory.</p>
        </div>
        <Link href="/contact" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1a73e8] hover:underline">
          <HelpCircle size={15} /> Question about a charge?
        </Link>
      </div>

      <AgentStatusBanner />
      {notice && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{notice}</p>}
      {phoneError && !mpesaPeriod && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{phoneError}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* ── Plan + what you owe ── */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className={cn(card, 'p-6')}>
              <p className="text-[13px] font-medium text-[#5f6368]">Your plan</p>
              {isLoading ? (
                <Loader2 size={20} className="mt-4 animate-spin text-[#80868b]" />
              ) : !next ? (
                <p className="mt-2 text-[14px] text-[#5f6368]">No billing set up yet.</p>
              ) : (
                <>
                  <p className="mt-2 text-[30px] font-normal leading-none text-[#202124] tabular-nums">
                    {next.currency} {next.amount.toLocaleString()}<span className="ml-1 text-[14px] text-[#5f6368]">/month</span>
                  </p>
                  <p className="mt-2 text-[13px] text-[#5f6368]">{data?.agent?.kind === 'COMPANY' ? 'Agency rate' : 'Individual agent rate'}, VAT included.</p>
                  {next.inFreeWindow && (
                    <p className="mt-3 rounded-xl bg-[#e6f4ea] px-3 py-2 text-[13px] text-[#188038]">
                      {next.freeMonths === 1 ? 'Your first month is free.' : `Your first ${next.freeMonths} months are free.`} Nothing is charged yet.
                    </p>
                  )}
                </>
              )}
            </section>

            {owed.length ? (
              <section className="rounded-3xl bg-[#fce8e6] p-6">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#c5221f]"><AlertTriangle size={15} /> Payment needed</p>
                <p className="mt-2 text-[30px] font-normal leading-none text-[#202124] tabular-nums">{owedCurrency} {owedTotal.toLocaleString()}</p>
                <p className="mt-2 text-[13px] text-[#3c4043]">
                  {owed.length === 1 ? periodLabel(owed[0].period) : `${owed.length} months unpaid`}
                  {grace && ` · listed until ${day(grace)}`}
                </p>
                {oldest && <div className="mt-4">{payActions(oldest)}</div>}
                {oldest && mpesaPrompt(oldest)}
                {phoneError && mpesaPeriod === oldest?.period && <p className="mt-2 text-[13px] text-[#c5221f]">{phoneError}</p>}
              </section>
            ) : (
              <section className="rounded-3xl bg-[#e6f4ea] p-6">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#188038]"><CheckCircle2 size={15} /> All paid up</p>
                <p className="mt-2 text-[20px] font-normal text-[#202124]">Nothing is due.</p>
                <p className="mt-1 text-[13px] text-[#3c4043]">
                  {lastPaid?.chargedAt ? `Last paid ${day(lastPaid.chargedAt)}. ` : ''}Your saved card is charged automatically each month.
                </p>
              </section>
            )}
          </div>

          {/* ── History ── */}
          <section className={cn(card, 'p-6')}>
            <h2 className="text-[17px] font-medium text-[#202124]">History</h2>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#80868b]" /></div>
            ) : runs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Receipt size={24} className="text-[#bdc1c6]" />
                <p className="max-w-sm text-[14px] text-[#5f6368]">Nothing billed yet. Your charges will appear here each month.</p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-[#f1f3f4]">
                {runs.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-[#202124]">{periodLabel(r.period)}</p>
                      <p className="text-[12.5px] text-[#5f6368]">
                        {r.status === 'PAID' && r.chargedAt ? `Charged ${day(r.chargedAt)}` : null}
                        {r.status === 'FAILED' && r.failureText ? <span className="text-[#c5221f]">{r.failureText}</span> : null}
                        {r.status === 'SKIPPED' && r.failureText?.startsWith('Waived') ? 'Waived' : null}
                        {r.invoice?.number ? `${r.status === 'PAID' || r.status === 'FAILED' ? ' · ' : ''}${r.invoice.number}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-[15px] tabular-nums text-[#202124]">{r.amount > 0 ? `${r.currency} ${r.amount.toLocaleString()}` : '—'}</span>
                      <span className={cn('rounded-full px-3 py-1 text-[12.5px] font-medium', STATUS_STYLES[r.status])}>{STATUS_LABELS[r.status]}</span>
                    </div>
                    {isOwed(r) && r.id !== oldest?.id && (
                      <div className="w-full">{payActions(r, true)}{mpesaPrompt(r)}</div>
                    )}
                    {phoneError && mpesaPeriod === r.period && r.id !== oldest?.id && <p className="w-full text-[13px] text-[#c5221f]">{phoneError}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Side column ── */}
        <aside className="space-y-6">
          {/* Billing charges the saved card automatically — the one thing an
              agent must keep current to stay listed. */}
          <PaymentMethodsCard />
          <div className={cn(card, 'p-5')}>
            <h3 className="text-[15px] font-medium text-[#202124]">How billing works</h3>
            <ul className="mt-3 space-y-2.5 text-[13.5px] leading-relaxed text-[#5f6368]">
              <li>• Your saved card is charged at the start of each month.</li>
              <li>• If a charge fails you stay listed during a short grace period — pay by card or M-Pesa to keep your profile visible.</li>
              <li>• Each charge is invoiced and receipted by email.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
