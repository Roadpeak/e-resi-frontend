'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from './MaterialIcon';
import { productionApi, type ProductionOrderRow } from '../../lib/api/production';
import { ApiError } from '../../lib/api/client';
import { useCatalog } from '../../lib/onboarding/useCatalog';
import { SERVICE_CATEGORIES, type ServiceCategory } from '../../lib/onboarding/catalog';
import { formatMoney } from '../../lib/utils';
import { cn } from '../../lib/utils';

const STATUS_LOOK: Record<ProductionOrderRow['status'], { label: string; cls: string }> = {
  ORDERED: { label: 'Awaiting scheduling', cls: 'bg-[#fef7e0] text-[#b06000]' },
  SCHEDULED: { label: 'Crew booked', cls: 'bg-[#e8f0fe] text-[#174ea6]' },
  IN_PRODUCTION: { label: 'In production', cls: 'bg-[#e8f0fe] text-[#174ea6]' },
  DELIVERED: { label: 'Delivered', cls: 'bg-[#e6f4ea] text-[#188038]' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-[#f1f3f4] text-[#5f6368]' },
};

const shortDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null;

/**
 * Production services on an existing development.
 *
 * Reads live order rows rather than the submission JSON: an order's status,
 * crew date and price change after submission, and the submission is only ever
 * a snapshot of what was asked for on day one.
 */
export function ProductionServicesPanel({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const { services: catalog } = useCatalog();

  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preferredDate, setPreferredDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [accessInfo, setAccessInfo] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['production-orders', slug],
    queryFn: () => productionApi.forProperty(slug),
  });

  const placed = orders ?? [];
  // A cancelled order may be raised again; anything else is already committed.
  const committed = new Set(
    placed.filter((o) => o.status !== 'CANCELLED').map((o) => o.serviceKey),
  );
  const available = catalog.filter((s) => !committed.has(s.id));

  const reset = () => {
    setSelected(new Set());
    setPreferredDate('');
    setInstructions('');
    setAccessInfo('');
    setPicking(false);
  };

  const order = useMutation({
    mutationFn: () => productionApi.order(
      slug,
      [...selected].map((serviceKey) => ({
        serviceKey,
        preferredDate: preferredDate || undefined,
        instructions: instructions || undefined,
        accessInfo: accessInfo || undefined,
      })),
    ),
    onSuccess: (rows) => {
      queryClient.invalidateQueries({ queryKey: ['production-orders', slug] });
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      setError('');
      setToast(
        `${rows.length} service${rows.length === 1 ? '' : 's'} ordered. `
        + 'You will be invoiced once a crew date is booked.',
      );
      setTimeout(() => setToast(''), 8000);
      reset();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not place the order'),
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const total = catalog
    .filter((s) => selected.has(s.id))
    .reduce((n, s) => n + s.price, 0);

  const byCategory = available.reduce<Record<string, typeof available>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-medium text-[#202124]">Production services</h3>
          <p className="mt-1 text-[14px] text-[#5f6368]">
            Order photography, film or an immersive tour at any time — not only when
            you first list.
          </p>
        </div>
        {!picking && available.length > 0 && (
          <button
            type="button"
            onClick={() => { setError(''); setPicking(true); }}
            className="rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]"
          >
            Order services
          </button>
        )}
      </div>

      {toast && (
        <p className="mt-4 rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>
      )}
      {error && (
        <p className="mt-4 rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>
      )}

      {/* ── Already ordered ── */}
      <div className="mt-5">
        {isLoading ? (
          <p className="py-6 text-center text-[14px] text-[#5f6368]">Loading…</p>
        ) : placed.length === 0 ? (
          <p className="rounded-2xl bg-[#f8f9fa] px-4 py-6 text-center text-[14px] text-[#5f6368]">
            Nothing ordered yet for this development.
          </p>
        ) : (
          <ul className="divide-y divide-[#f1f3f4]">
            {placed.map((o) => {
              const look = STATUS_LOOK[o.status];
              const when = shortDate(o.scheduledAt) ?? shortDate(o.preferredDate);
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] text-[#202124]">{o.label}</p>
                    {when && (
                      <p className="text-[13px] text-[#5f6368]">
                        {o.scheduledAt ? 'Crew booked for' : 'Requested for'} {when}
                      </p>
                    )}
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-[12px]', look.cls)}>
                    {look.label}
                  </span>
                  <span className="whitespace-nowrap text-[15px] tabular-nums text-[#202124]">
                    {formatMoney(o.amount, o.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Ordering ── */}
      {picking && (
        <div className="mt-5 border-t border-[#dadce0]/60 pt-5">
          {available.length === 0 ? (
            <p className="text-[14px] text-[#5f6368]">
              Everything in the catalogue is already ordered for this development.
            </p>
          ) : (
            <>
              {Object.entries(byCategory).map(([category, items]) => (
                <div key={category} className="mb-5">
                  <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[#5f6368]">
                    {SERVICE_CATEGORIES[category as ServiceCategory] ?? category}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((s) => (
                      <label
                        key={s.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors',
                          selected.has(s.id)
                            ? 'border-[#1a73e8] bg-[#f8fbff]'
                            : 'border-[#dadce0] hover:bg-[#f8f9fa]',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggle(s.id)}
                          className="mt-0.5 h-4 w-4 accent-[#1a73e8]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] text-[#202124]">{s.label}</span>
                          {s.description && (
                            <span className="block text-[13px] leading-relaxed text-[#5f6368]">
                              {s.description}
                            </span>
                          )}
                        </span>
                        <span className="whitespace-nowrap text-[15px] tabular-nums text-[#202124]">
                          {formatMoney(s.price, 'KES')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {selected.size > 0 && (
                <div className="space-y-3 rounded-2xl bg-[#f8f9fa] p-4">
                  <p className="text-[13px] font-medium text-[#202124]">
                    Brief for the crew <span className="font-normal text-[#5f6368]">(optional)</span>
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[12px] text-[#5f6368]">Preferred date</span>
                      <input
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="rounded-xl border border-[#dadce0] bg-white px-3 py-2 text-[14px] text-[#202124]"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[12px] text-[#5f6368]">Site access</span>
                      <input
                        value={accessInfo}
                        onChange={(e) => setAccessInfo(e.target.value)}
                        placeholder="Gate 3, ask for the foreman"
                        className="rounded-xl border border-[#dadce0] bg-white px-3 py-2 text-[14px] text-[#202124]"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-[12px] text-[#5f6368]">Anything the crew should know</span>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={2}
                      placeholder="Shoot the rooftop first — best light before 9am."
                      className="resize-none rounded-xl border border-[#dadce0] bg-white px-3 py-2 text-[14px] text-[#202124]"
                    />
                  </label>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[14px] text-[#5f6368]">
                  {selected.size > 0 ? (
                    <>
                      {selected.size} selected ·{' '}
                      <span className="text-[16px] font-medium text-[#202124]">
                        {formatMoney(total, 'KES')}
                      </span>
                      <span className="block text-[13px]">
                        Invoiced once a crew date is booked, not now.
                      </span>
                    </>
                  ) : (
                    'Select the services you need.'
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full px-4 py-2 text-[14px] font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => order.mutate()}
                    disabled={selected.size === 0 || order.isPending}
                    className="rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50"
                  >
                    {order.isPending ? 'Ordering…' : 'Place order'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!picking && available.length === 0 && placed.length > 0 && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-[#5f6368]">
          <MaterialIcon name="check_circle" className="text-[16px] text-[#188038]" />
          Every service in the catalogue has been ordered for this development.
        </p>
      )}
    </div>
  );
}
