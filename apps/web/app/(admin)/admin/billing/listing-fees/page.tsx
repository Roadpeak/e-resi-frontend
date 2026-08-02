'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../../components/dashboard/MaterialIcon';
import { billingApi, type ListingFeeRun } from '../../../../../lib/api/billing';
import { ApiError } from '../../../../../lib/api/client';
import { cn } from '../../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const STATUS_STYLES: Record<ListingFeeRun['status'], string> = {
  PAID: 'bg-[#e6f4ea] text-[#188038]',
  PENDING: 'bg-[#fef7e0] text-[#b06000]',
  FAILED: 'bg-[#fce8e6] text-[#c5221f]',
  SKIPPED: 'bg-[#f1f3f4] text-[#5f6368]',
};

const money = (n: number, c: string) => `${c} ${n.toLocaleString()}`;

/** The month just ended — fees are billed in arrears, so this is the usual target. */
function defaultPeriod(): string {
  const d = new Date();
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminListingFees() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(defaultPeriod);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['listing-fees', period],
    queryFn: () => billingApi.listingFeeReport(period),
    // A period that has never run 404s — that is a normal state, not an error.
    retry: false,
  });

  const run = useMutation({
    mutationFn: () => billingApi.runListingFees(period),
    onSuccess: (r) => {
      setError('');
      setToast(
        `${r.charged} charged, ${r.failed} failed, ${r.skipped} skipped, `
        + `${r.alreadyDone} already settled — ${money(r.totalCollected, r.currency)} collected`,
      );
      queryClient.invalidateQueries({ queryKey: ['listing-fees', period] });
      setTimeout(() => setToast(''), 8000);
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : 'The billing run could not be started'),
  });

  const totals = report?.totals;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-medium text-[#202124]">Listing fees</h1>
          <p className="mt-1 text-[14px] text-[#5f6368]">
            Charged monthly in arrears against each developer&apos;s card. Runs
            automatically on the 1st; a manual run never double-charges.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-[#5f6368]">Period</span>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] text-[#202124]"
            />
          </label>
          <button
            type="button"
            onClick={() => run.mutate()}
            disabled={run.isPending}
            className="rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60"
          >
            {run.isPending ? 'Collecting…' : 'Run collection'}
          </button>
        </div>
      </header>

      {toast && (
        <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>
      )}
      {error && (
        <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>
      )}

      {totals && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Collected', value: money(totals.collected, totals.currency), tone: 'text-[#188038]' },
            { label: 'Paid', value: String(totals.paid) },
            { label: 'Failed', value: String(totals.failed), tone: totals.failed ? 'text-[#c5221f]' : undefined },
            { label: 'Skipped', value: String(totals.skipped) },
          ].map((s) => (
            <div key={s.label} className={cardCls}>
              <p className="text-[13px] text-[#5f6368]">{s.label}</p>
              <p className={cn('mt-1 text-[24px] font-medium text-[#202124]', s.tone)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className={cardCls}>
        {isLoading ? (
          <p className="py-8 text-center text-[14px] text-[#5f6368]">Loading…</p>
        ) : !report?.runs?.length ? (
          <div className="py-10 text-center">
            <MaterialIcon name="receipt_long" className="text-[32px] text-[#dadce0]" />
            <p className="mt-2 text-[14px] text-[#5f6368]">
              No collection has run for {period} yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-[#f1f3f4] text-[12px] uppercase tracking-wide text-[#5f6368]">
                  <th className="py-2 pr-4 font-medium">Developer</th>
                  <th className="py-2 pr-4 font-medium">Listings</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {report.runs.map((r) => (
                  <tr key={r.id} className="border-b border-[#f8f9fa] last:border-0">
                    <td className="py-3 pr-4 text-[#202124]">{r.developer.companyName}</td>
                    <td className="py-3 pr-4 text-[#5f6368]">{r.listingCount}</td>
                    <td className="py-3 pr-4 text-[#202124]">{money(r.amount, r.currency)}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('rounded-full px-2.5 py-1 text-[12px]', STATUS_STYLES[r.status])}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-[13px] text-[#5f6368]">
                      {r.failureText
                        ? `${r.failureText}${r.attempts > 1 ? ` · ${r.attempts} attempts` : ''}`
                        : r.reference ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
