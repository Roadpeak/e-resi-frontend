'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { adminBillingApi, type ProductionOrder } from '../../../../lib/api/admin';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';
import { useState } from 'react';

/** Board columns, in the order work actually moves. */
const STAGES = [
  { key: 'ORDERED', label: 'Ordered', icon: 'receipt_long' },
  { key: 'SCHEDULED', label: 'Scheduled', icon: 'event' },
  { key: 'IN_PRODUCTION', label: 'In production', icon: 'movie_filter' },
  { key: 'DELIVERED', label: 'Delivered', icon: 'check_circle' },
];

const NEXT_STAGE: Record<string, string | undefined> = {
  ORDERED: 'SCHEDULED',
  SCHEDULED: 'IN_PRODUCTION',
  IN_PRODUCTION: 'DELIVERED',
};

export default function AdminProduction() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-production-orders'],
    queryFn: () => adminBillingApi.orders(),
  });

  const move = useMutation({
    mutationFn: ({ id, orderStatus }: { id: string; orderStatus: string }) =>
      adminBillingApi.updateOrder(id, { orderStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-production-orders'] });
      setError('');
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not update the order'),
  });

  const backfill = useMutation({
    mutationFn: () => adminBillingApi.backfillOrders(),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['admin-production-orders'] });
      setError('');
      setToast(
        r.created > 0
          ? `${r.created} order${r.created === 1 ? '' : 's'} imported from ${r.properties} submission${r.properties === 1 ? '' : 's'}.`
          : 'Nothing to import — every selected service already has an order.',
      );
      setTimeout(() => setToast(''), 6000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Import failed'),
  });

  const all = (orders ?? []).filter((o) => o.status !== 'CANCELLED');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Production</h1>
          <p className="text-[14px] text-[#5f6368]">
            One card per ordered service, from order to delivery.
          </p>
        </div>
        <button
          type="button"
          onClick={() => backfill.mutate()}
          disabled={backfill.isPending}
          title="Create orders for services selected before per-service orders existed"
          className="rounded-full border border-[#dadce0] px-4 py-2 text-[13px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] disabled:opacity-60"
        >
          {backfill.isPending ? 'Importing…' : 'Import from submissions'}
        </button>
      </div>

      {toast && (
        <div className="rounded-xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</div>
      )}

      {error && (
        <div className="rounded-xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</div>
      )}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
        </div>
      ) : all.length === 0 ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center">
          <MaterialIcon name="movie" size={28} className="text-[#80868b]" />
          <p className="mt-2 text-[15px] text-[#5f6368]">No production orders yet.</p>
          <p className="text-[13px] text-[#80868b]">
            Orders appear when a developer buys a production tier above Listing only.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {STAGES.map((stage) => {
            const items = all.filter((o) => o.status === stage.key);
            return (
              <section key={stage.key} className="rounded-3xl border border-[#dadce0] bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MaterialIcon
                    name={stage.icon}
                    size={18}
                    className={stage.key === 'DELIVERED' ? 'text-[#188038]' : 'text-[#5f6368]'}
                    fill
                  />
                  <h2 className="text-[15px] font-medium text-[#202124]">{stage.label}</h2>
                  <span className="ml-auto rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[12px] text-[#5f6368]">
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-[#80868b]">Nothing here.</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((o) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        busy={move.isPending}
                        onAdvance={() => {
                          const next = NEXT_STAGE[o.status];
                          if (next) move.mutate({ id: o.id, orderStatus: next });
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  busy,
  onAdvance,
}: {
  order: ProductionOrder;
  busy: boolean;
  onAdvance: () => void;
}) {
  const next = NEXT_STAGE[order.status];

  return (
    <div className="rounded-2xl border border-[#dadce0] p-3">
      <p className="truncate text-[14px] font-medium text-[#202124]">
        {order.property?.name ?? 'Unknown property'}
      </p>
      <p className="truncate text-[12px] text-[#5f6368]">
        {order.property?.developer?.companyName ?? '—'}
      </p>
      <p className="mt-1 text-[13px] text-[#202124]">{order.label}</p>
      <p className="text-[12px] text-[#80868b]">
        {order.amount > 0 ? `${order.currency} ${order.amount.toLocaleString()}` : 'No charge'}
      </p>
      {(order.preferredDate || order.instructions || order.accessInfo) && (
        <div className="mt-2 rounded-xl bg-[#f8f9fa] px-2.5 py-2 text-[12px] leading-relaxed text-[#5f6368]">
          {order.preferredDate && <div>Wants: {order.preferredDate}</div>}
          {order.instructions && <div>“{order.instructions}”</div>}
          {order.accessInfo && <div>Access: {order.accessInfo}</div>}
        </div>
      )}
      {order.scheduledAt && (
        <p className="mt-1 text-[12px] text-[#1a73e8]">
          Booked {new Date(order.scheduledAt).toLocaleDateString()}
        </p>
      )}
      {order.deliveredAt && (
        <p className="mt-1 text-[12px] text-[#188038]">
          Delivered {new Date(order.deliveredAt).toLocaleDateString()}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {order.property?.slug && (
          <Link
            href={`/admin/properties/${order.property.slug}/media`}
            className="rounded-full border border-[#dadce0] px-2.5 py-1 text-[12px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
          >
            Upload media
          </Link>
        )}
        {next && (
          <button
            onClick={onAdvance}
            disabled={busy}
            className={cn(
              'rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50',
              next === 'DELIVERED'
                ? 'bg-[#188038] text-white hover:bg-[#137333]'
                : 'bg-[#1a73e8] text-white hover:bg-[#1765cc]',
            )}
          >
            Mark {next.replace(/_/g, ' ').toLowerCase()}
          </button>
        )}
      </div>
    </div>
  );
}
