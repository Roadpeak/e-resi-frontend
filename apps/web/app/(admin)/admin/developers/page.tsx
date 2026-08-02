'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { peopleApi, type AdminDeveloper } from '../../../../lib/api/admin';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';

const KYB_STYLES: Record<string, string> = {
  APPROVED: 'bg-[#e6f4ea] text-[#188038]',
  PENDING: 'bg-[#fef7e0] text-[#b06000]',
  REJECTED: 'bg-[#fce8e6] text-[#c5221f]',
  NOT_SUBMITTED: 'bg-[#f1f3f4] text-[#5f6368]',
};

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'PENDING', label: 'Awaiting review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'NOT_SUBMITTED', label: 'Not submitted' },
];

export default function AdminDevelopers() {
  const queryClient = useQueryClient();
  const [kybStatus, setKybStatus] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-developers', kybStatus],
    queryFn: () => peopleApi.developers({ kybStatus, limit: 50 }),
  });

  const review = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      peopleApi.reviewKyb(id, status, notes),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setError('');
      setToast(`${d.companyName} — KYB ${d.kybStatus.toLowerCase()}`);
      setTimeout(() => setToast(''), 3000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Review failed'),
  });

  const developers = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Developers</h1>
        <p className="text-[14px] text-[#5f6368]">
          {data?.meta.total ?? 0} developer accounts. Approve KYB before they can list.
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

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setKybStatus(f.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer',
              kybStatus === f.key
                ? 'bg-[#202124] text-white'
                : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
        </div>
      ) : developers.length === 0 ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center">
          <MaterialIcon name="apartment" size={28} className="text-[#80868b]" />
          <p className="mt-2 text-[15px] text-[#5f6368]">No developers match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {developers.map((d) => (
            <DeveloperRow
              key={d.id}
              developer={d}
              busy={review.isPending}
              onReview={(status, notes) => review.mutate({ id: d.id, status, notes })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeveloperRow({
  developer,
  busy,
  onReview,
}: {
  developer: AdminDeveloper;
  busy: boolean;
  onReview: (status: string, notes?: string) => void;
}) {
  const pending = developer.kybStatus === 'PENDING';

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-medium text-[#202124]">{developer.companyName}</p>
          <p className="text-[13px] text-[#5f6368]">
            {developer.user?.email ?? '—'}
            {developer.user && !developer.user.isActive && (
              <span className="ml-2 text-[#c5221f]">account suspended</span>
            )}
          </p>
          <p className="mt-1 text-[12px] text-[#80868b]">
            {developer._count?.properties ?? 0} propert
            {(developer._count?.properties ?? 0) === 1 ? 'y' : 'ies'} ·{' '}
            {developer._count?.rentListings ?? 0} rent listing
            {(developer._count?.rentListings ?? 0) === 1 ? '' : 's'} · joined{' '}
            {new Date(developer.createdAt).toLocaleDateString()}
          </p>
        </div>

        <span
          className={cn(
            'rounded-full px-3 py-1 text-[12px] font-medium',
            KYB_STYLES[developer.kybStatus] ?? KYB_STYLES.NOT_SUBMITTED,
          )}
        >
          {developer.kybStatus.replace(/_/g, ' ').toLowerCase()}
        </span>

        {pending && (
          <div className="flex gap-2">
            <button
              onClick={() => onReview('APPROVED')}
              disabled={busy}
              className="rounded-full bg-[#188038] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#137333] cursor-pointer disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => {
                const notes = window.prompt('Why is this being rejected? (shown to the developer)');
                if (notes !== null) onReview('REJECTED', notes || undefined);
              }}
              disabled={busy}
              className="rounded-full border border-[#dadce0] px-4 py-2 text-[13px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] cursor-pointer disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
        {!pending && developer.kybStatus !== 'APPROVED' && (
          <button
            onClick={() => onReview('APPROVED')}
            disabled={busy}
            className="rounded-full border border-[#dadce0] px-4 py-2 text-[13px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] cursor-pointer disabled:opacity-50"
          >
            Approve
          </button>
        )}
      </div>
    </div>
  );
}
