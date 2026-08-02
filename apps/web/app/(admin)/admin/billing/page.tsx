'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { adminBillingApi, type AdminPayment } from '../../../../lib/api/admin';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-[#e6f4ea] text-[#188038]',
  PENDING: 'bg-[#fef7e0] text-[#b06000]',
  FAILED: 'bg-[#fce8e6] text-[#c5221f]',
  REFUNDED: 'bg-[#f1f3f4] text-[#5f6368]',
};

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'FAILED', label: 'Failed' },
  { key: 'REFUNDED', label: 'Refunded' },
];

const money = (n: number, c: string) => `${c} ${n.toLocaleString()}`;

export default function AdminBilling() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['admin-billing-summary'],
    queryFn: adminBillingApi.summary,
  });
  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments', status],
    queryFn: () => adminBillingApi.payments({ status, limit: 50 }),
  });

  const flash = (m: string) => {
    setToast(m);
    setError('');
    setTimeout(() => setToast(''), 3000);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    queryClient.invalidateQueries({ queryKey: ['admin-billing-summary'] });
  };
  const onError = (e: unknown) => setError(e instanceof ApiError ? e.message : 'Action failed');

  const refund = useMutation({
    mutationFn: (id: string) => adminBillingApi.refund(id),
    onSuccess: () => {
      refresh();
      flash('Payment marked refunded');
    },
    onError,
  });
  const retry = useMutation({
    mutationFn: (id: string) => adminBillingApi.retry(id),
    onSuccess: () => {
      refresh();
      flash('Payment re-queued');
    },
    onError,
  });

  const rows = payments?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Billing</h1>
        <p className="text-[14px] text-[#5f6368]">Platform revenue and every payment taken.</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">
          <MaterialIcon name="check_circle" size={18} fill /> {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</div>
      )}

      {/* Revenue */}
      {summary && (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className={cardCls}>
            <MaterialIcon name="payments" size={22} className="text-[#188038]" fill />
            <p className="mt-3 text-[28px] font-normal leading-none text-[#202124]">
              {summary.collected.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[13px] text-[#5f6368]">
              Collected · {summary.collectedCount} payment{summary.collectedCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className={cardCls}>
            <MaterialIcon name="autorenew" size={22} className="text-[#1a73e8]" fill />
            <p className="mt-3 text-[28px] font-normal leading-none text-[#202124]">
              {summary.recurring.monthly.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[13px] text-[#5f6368]">
              Monthly recurring · {summary.recurring.liveProperties} live ×{' '}
              {summary.recurring.feePerProperty} {summary.recurring.currency}
            </p>
          </div>
          <div className={cardCls}>
            <MaterialIcon name="schedule" size={22} className="text-[#b06000]" fill />
            <p className="mt-3 text-[28px] font-normal leading-none text-[#202124]">
              {summary.pending.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[13px] text-[#5f6368]">
              Pending · {summary.pendingCount} awaiting
            </p>
          </div>
          <div className={cn(cardCls, summary.failedCount > 0 && 'border-[#f9ab00] bg-[#fffbf0]')}>
            <MaterialIcon
              name="credit_card_off"
              size={22}
              className={summary.failedCount > 0 ? 'text-[#c5221f]' : 'text-[#80868b]'}
              fill
            />
            <p className="mt-3 text-[28px] font-normal leading-none text-[#202124]">
              {summary.failedCount}
            </p>
            <p className="mt-1.5 text-[13px] text-[#5f6368]">Failed payments</p>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer',
              status === f.key
                ? 'bg-[#202124] text-white'
                : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-6 py-16 text-center text-[15px] text-[#5f6368]">No payments match.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-[#dadce0] bg-[#f8f9fa]">
              <tr className="text-[12px] uppercase tracking-wide text-[#5f6368]">
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Payer</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {rows.map((p: AdminPayment) => (
                <tr key={p.id} className="text-[14px] text-[#202124]">
                  <td className="whitespace-nowrap px-5 py-3 text-[#5f6368]">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">{p.user?.email ?? '—'}</td>
                  <td className="px-5 py-3 font-medium">{money(p.amount, p.currency)}</td>
                  <td className="px-5 py-3 text-[#5f6368]">{p.method}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[12px] font-medium',
                        STATUS_STYLES[p.status] ?? STATUS_STYLES.PENDING,
                      )}
                    >
                      {p.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {p.status === 'FAILED' && (
                      <button
                        onClick={() => retry.mutate(p.id)}
                        className="rounded-full border border-[#dadce0] px-3 py-1.5 text-[12px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] cursor-pointer"
                      >
                        Retry
                      </button>
                    )}
                    {p.status === 'COMPLETED' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Mark ${money(p.amount, p.currency)} as refunded?`)) {
                            refund.mutate(p.id);
                          }
                        }}
                        className="rounded-full border border-[#dadce0] px-3 py-1.5 text-[12px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] cursor-pointer"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
