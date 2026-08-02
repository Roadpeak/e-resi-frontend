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

  const all = (orders ?? []).filter((o) => o.orderStatus !== 'CANCELLED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Production</h1>
        <p className="text-[14px] text-[#5f6368]">
          Paid production work, from order to delivery.
        </p>
      </div>

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
            const items = all.filter((o) => o.orderStatus === stage.key);
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
                          const next = NEXT_STAGE[o.orderStatus];
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
  const next = NEXT_STAGE[order.orderStatus];

  return (
    <div className="rounded-2xl border border-[#dadce0] p-3">
      <p className="truncate text-[14px] font-medium text-[#202124]">
        {order.property?.name ?? 'Unknown property'}
      </p>
      <p className="truncate text-[12px] text-[#5f6368]">
        {order.property?.developer?.companyName ?? '—'}
      </p>
      <p className="mt-1 text-[12px] text-[#80868b]">
        {order.tier.replace(/_/g, ' ').toLowerCase()}
        {order.paidAmount ? ` · ${order.paidAmount.toLocaleString()}` : ''}
      </p>
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
