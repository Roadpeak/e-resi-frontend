'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmDelete } from '../../../../components/admin/ConfirmDelete';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { adminPropertiesApi, type AdminProperty } from '../../../../lib/api/admin';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-[#e6f4ea] text-[#188038]',
  DRAFT: 'bg-[#fef7e0] text-[#b06000]',
  OFF_PLAN: 'bg-[#e8f0fe] text-[#1967d2]',
  SOLD_OUT: 'bg-[#f1f3f4] text-[#5f6368]',
  ARCHIVED: 'bg-[#f1f3f4] text-[#5f6368]',
};

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'DRAFT', label: 'Awaiting review' },
  { key: 'ACTIVE', label: 'Live' },
  { key: 'OFF_PLAN', label: 'Off plan' },
  { key: 'ARCHIVED', label: 'Archived' },
];

export default function AdminProperties() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  /** The property awaiting delete confirmation, if any. */
  const [deleting, setDeleting] = useState<AdminProperty | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-properties', status, q],
    queryFn: () => adminPropertiesApi.list({ status, q, limit: 50 }),
  });

  const flash = (m: string) => {
    setToast(m);
    setError('');
    setTimeout(() => setToast(''), 3000);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
  };
  const onError = (e: unknown) => setError(e instanceof ApiError ? e.message : 'Action failed');

  const review = useMutation({
    mutationFn: ({ slug, decision, notes }: { slug: string; decision: 'APPROVE' | 'REJECT'; notes?: string }) =>
      adminPropertiesApi.review(slug, decision, notes),
    onSuccess: (p) => {
      refresh();
      flash(`${p.name} ${p.status === 'ACTIVE' ? 'approved and live' : 'returned to draft'}`);
    },
    onError,
  });

  const feature = useMutation({
    mutationFn: ({ slug, on }: { slug: string; on: boolean }) => adminPropertiesApi.feature(slug, on),
    onSuccess: (p) => {
      refresh();
      flash(`${p.name} ${p.isFeatured ? 'featured' : 'unfeatured'}`);
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (slug: string) => adminPropertiesApi.remove(slug),
    onSuccess: (r) => {
      refresh();
      setDeleting(null);
      flash(r.message);
    },
    onError,
  });

  const properties = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Properties</h1>
        <p className="text-[14px] text-[#5f6368]">
          {data?.meta.total ?? 0} listings across all developers.
        </p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">
          <MaterialIcon name="check_circle" size={18} fill /> {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
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
        <div className="relative ml-auto min-w-[220px]">
          <MaterialIcon
            name="search"
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#80868b]"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or city…"
            className="h-10 w-full rounded-full border border-[#dadce0] bg-white pl-10 pr-4 text-[15px] outline-none focus:border-[#1a73e8]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center">
          <MaterialIcon name="domain" size={28} className="text-[#80868b]" />
          <p className="mt-2 text-[15px] text-[#5f6368]">No properties match.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <PropertyRow
              key={p.id}
              property={p}
              busy={review.isPending || feature.isPending}
              onReview={(decision, notes) => review.mutate({ slug: p.slug, decision, notes })}
              onFeature={(on) => feature.mutate({ slug: p.slug, on })}
              onDelete={() => { setError(''); setDeleting(p); }}
            />
          ))}
        </div>
      )}

      <ConfirmDelete
        open={deleting !== null}
        name={deleting?.name ?? ''}
        description={
          'This permanently deletes the listing along with its media, units, floor '
          + 'plans and tours. Listings with bookings, rentals or inquiries cannot be '
          + 'deleted — archive those instead.'
        }
        busy={remove.isPending}
        error={remove.isError ? (remove.error as Error).message : undefined}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.slug)}
      />
    </div>
  );
}

function PropertyRow({
  property,
  busy,
  onReview,
  onFeature,
  onDelete,
}: {
  property: AdminProperty;
  busy: boolean;
  onReview: (decision: 'APPROVE' | 'REJECT', notes?: string) => void;
  onFeature: (on: boolean) => void;
  onDelete: () => void;
}) {
  const isDraft = property.status === 'DRAFT';

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#f1f3f4]">
          {property.heroImageUrl ? (
            <Image src={property.heroImageUrl} alt="" fill className="object-cover" sizes="96px" />
          ) : (
            <div className="flex h-full items-center justify-center text-[#80868b]">
              <MaterialIcon name="domain" size={20} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[16px] font-medium text-[#202124]">
            {property.name}
            {property.isFeatured && (
              <MaterialIcon name="star" size={15} className="text-[#f9ab00]" fill />
            )}
          </p>
          <p className="text-[13px] text-[#5f6368]">
            {property.developer?.companyName ?? 'Unknown developer'}
            {property.city && ` · ${[property.neighborhood, property.city].filter(Boolean).join(', ')}`}
          </p>
          <p className="mt-0.5 text-[12px] text-[#80868b]">
            {property._count?.units ?? 0} units · {property._count?.media ?? 0} media ·{' '}
            {property._count?.inquiries ?? 0} inquiries
            {property.latitude == null && ' · no map location'}
          </p>
          {property.reviewNotes && (
            <p className="mt-1 text-[12px] text-[#b06000]">Note: {property.reviewNotes}</p>
          )}
        </div>

        <span
          className={cn(
            'rounded-full px-3 py-1 text-[12px] font-medium',
            STATUS_STYLES[property.status] ?? STATUS_STYLES.DRAFT,
          )}
        >
          {property.status.replace(/_/g, ' ').toLowerCase()}
        </span>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/properties/${property.slug}/media`}
            className="rounded-full border border-[#dadce0] px-3.5 py-2 text-[13px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
          >
            Media
          </Link>
          {isDraft ? (
            <>
              <button
                onClick={() => onReview('APPROVE')}
                disabled={busy}
                className="rounded-full bg-[#188038] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#137333] cursor-pointer disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  const notes = window.prompt('Why is this being rejected? (shown to the developer)');
                  if (notes !== null) onReview('REJECT', notes || undefined);
                }}
                disabled={busy}
                className="rounded-full border border-[#dadce0] px-3.5 py-2 text-[13px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] cursor-pointer disabled:opacity-50"
              >
                Reject
              </button>
            </>
          ) : (
            <button
              onClick={() => onFeature(!property.isFeatured)}
              disabled={busy}
              className="rounded-full border border-[#dadce0] px-3.5 py-2 text-[13px] font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4] cursor-pointer disabled:opacity-50"
            >
              {property.isFeatured ? 'Unfeature' : 'Feature'}
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={busy}
            aria-label={`Delete ${property.name}`}
            title="Delete permanently"
            className="rounded-full border border-[#dadce0] p-2 text-[#5f6368] transition-colors hover:border-[#f5c6c4] hover:bg-[#fce8e6] hover:text-[#c5221f] disabled:opacity-50"
          >
            <MaterialIcon name="delete" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
