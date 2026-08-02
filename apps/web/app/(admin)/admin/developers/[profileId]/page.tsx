'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../../components/dashboard/MaterialIcon';
import { ConfirmDelete } from '../../../../../components/admin/ConfirmDelete';
import { peopleApi } from '../../../../../lib/api/admin';
import { ApiError } from '../../../../../lib/api/client';
import { cn } from '../../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const KYB_STYLES: Record<string, string> = {
  APPROVED: 'bg-[#e6f4ea] text-[#188038]',
  PENDING: 'bg-[#fef7e0] text-[#b06000]',
  REJECTED: 'bg-[#fce8e6] text-[#c5221f]',
  NOT_SUBMITTED: 'bg-[#f1f3f4] text-[#5f6368]',
};

const DOC_LABELS: Record<string, string> = {
  registrationCert: 'Certificate of registration',
  taxCert: 'Tax certificate (KRA PIN)',
  directorId: 'Director ID',
  proofOfAddress: 'Proof of address',
  companyLogo: 'Company logo',
  brandAssets: 'Brand assets',
};

const date = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Present a single onboarding answer without assuming its shape. */
function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.map(renderValue).join(', ') : '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    // Flatten one level rather than dumping JSON at the reviewer.
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${humanise(k)}: ${renderValue(v)}`)
      .join(' · ') || '—';
  }
  return String(value);
}

/**
 * Onboarding is stored as nested groups (company, preferences, media…). Flatten
 * it into individual labelled answers so a reviewer reads fields, not JSON.
 */
function flattenOnboarding(
  input: Record<string, unknown>,
  prefix = '',
): { label: string; value: string }[] {
  return Object.entries(input).flatMap(([key, value]) => {
    const label = prefix ? `${prefix} · ${humanise(key)}` : humanise(key);
    const isPlainObject = value !== null
      && typeof value === 'object'
      && !Array.isArray(value);

    if (isPlainObject) {
      return flattenOnboarding(value as Record<string, unknown>, label);
    }
    return [{ label, value: renderValue(value) }];
  });
}

/** "companyName" → "Company name" */
const humanise = (k: string) =>
  k.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (c) => c.toUpperCase()).trim();

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] uppercase tracking-wide text-[#5f6368]">{label}</dt>
      <dd className="mt-0.5 break-words text-[14px] text-[#202124]">{value}</dd>
    </div>
  );
}

export default function AdminDeveloperDetail() {
  const { profileId } = useParams<{ profileId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const { data: dev, isLoading } = useQuery({
    queryKey: ['admin-developer', profileId],
    queryFn: () => peopleApi.developer(profileId),
  });

  const review = useMutation({
    mutationFn: (status: string) => peopleApi.reviewKyb(profileId, status, notes || undefined),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ['admin-developer', profileId] });
      queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setError('');
      setToast(`KYB ${d.kybStatus.toLowerCase()}`);
      setTimeout(() => setToast(''), 4000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Review failed'),
  });

  const remove = useMutation({
    mutationFn: () => peopleApi.remove(dev!.user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
      router.push('/admin/developers');
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Delete failed'),
  });

  if (isLoading) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Loading…</p>;
  }
  if (!dev) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Developer not found.</p>;
  }

  const owner = dev.user;
  const onboarding = (dev.onboarding ?? {}) as Record<string, unknown>;
  const onboardingFields = flattenOnboarding(onboarding);
  // Empty strings mean "not uploaded" — the field exists but no file was given.
  const documents = Object.entries(dev.kybDocuments ?? {}).filter(([, v]) => v);
  const missingDocs = Object.entries(dev.kybDocuments ?? {}).filter(([, v]) => !v);

  return (
    <div className="space-y-5">
      <Link
        href="/admin/developers"
        className="inline-flex items-center gap-1 text-[13px] text-[#5f6368] transition-colors hover:text-[#202124]"
      >
        <MaterialIcon name="arrow_back" className="text-[16px]" />
        All developers
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {dev.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded host
            <img src={dev.logoUrl} alt="" className="h-14 w-14 rounded-2xl object-contain" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f3f4]">
              <MaterialIcon name="apartment" className="text-[24px] text-[#5f6368]" />
            </div>
          )}
          <div>
            <h1 className="text-[26px] font-normal text-[#202124]">{dev.companyName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#5f6368]">
              <span className={cn('rounded-full px-2.5 py-1 text-[12px]', KYB_STYLES[dev.kybStatus])}>
                KYB {dev.kybStatus.replace('_', ' ').toLowerCase()}
              </span>
              <span>·</span>
              <span>{dev._count?.properties ?? 0} developments</span>
              <span>·</span>
              <span>{dev._count?.rentListings ?? 0} rentals</span>
              <span>·</span>
              <span>Joined {date(dev.createdAt)}</span>
            </div>
          </div>
        </div>

        {owner && (
          <button
            type="button"
            onClick={() => { setError(''); setConfirming(true); }}
            className="rounded-full border border-[#f5c6c4] px-4 py-2 text-[14px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6]"
          >
            Delete account
          </button>
        )}
      </header>

      {toast && (
        <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>
      )}
      {error && (
        <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* ── Company ── */}
          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Company</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Trading name" value={dev.companyName} />
              <Field
                label="Website"
                value={dev.website
                  ? <a href={dev.website} target="_blank" rel="noreferrer noopener" className="text-[#1a73e8] hover:underline">{dev.website}</a>
                  : '—'}
              />
              <Field label="Established" value={dev.establishedYear ?? '—'} />
              <Field label="Completed projects" value={dev.completedProjects ?? 0} />
            </dl>
            {dev.description && (
              <p className="mt-4 border-t border-[#f1f3f4] pt-4 text-[14px] leading-relaxed text-[#5f6368]">
                {dev.description}
              </p>
            )}
          </section>

          {/* ── Onboarding submission ── */}
          <section className={cardCls}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-[16px] font-medium text-[#202124]">Onboarding submission</h2>
              <span className="text-[13px] text-[#5f6368]">
                {dev.onboardingSubmittedAt ? `Submitted ${date(dev.onboardingSubmittedAt)}` : 'Not submitted'}
              </span>
            </div>
            {onboardingFields.length === 0 ? (
              <p className="text-[14px] text-[#5f6368]">
                This developer hasn&apos;t completed onboarding.
              </p>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                {onboardingFields.map((f) => (
                  <Field key={f.label} label={f.label} value={f.value} />
                ))}
              </dl>
            )}
          </section>

          {/* ── Listings ── */}
          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Listings</h2>
            {!dev.properties?.length && !dev.rentListings?.length ? (
              <p className="text-[14px] text-[#5f6368]">Nothing listed yet.</p>
            ) : (
              <ul className="divide-y divide-[#f1f3f4]">
                {dev.properties?.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/${p.slug}`} target="_blank" className="text-[14px] text-[#1a73e8] hover:underline">
                      {p.name}
                    </Link>
                    <span className="text-[12px] text-[#5f6368]">{p.city} · {p.status}</span>
                  </li>
                ))}
                {dev.rentListings?.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/rent/${r.slug}`} target="_blank" className="text-[14px] text-[#1a73e8] hover:underline">
                      {r.name}
                    </Link>
                    <span className="text-[12px] text-[#5f6368]">Rental · {r.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Owner */}
          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Account owner</h2>
            {owner ? (
              <dl className="space-y-3">
                <Field label="Name" value={`${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim() || '—'} />
                <Field label="Email" value={
                  <span className="flex items-center gap-1.5">
                    {owner.email}
                    {owner.emailVerified
                      ? <MaterialIcon name="verified" className="text-[15px] text-[#188038]" />
                      : <span className="text-[12px] text-[#b06000]">unverified</span>}
                  </span>
                } />
                <Field label="Phone" value={owner.phone || '—'} />
                <Field label="Status" value={owner.isActive
                  ? 'Active'
                  : `Suspended${owner.suspendedReason ? ` — ${owner.suspendedReason}` : ''}`} />
                <Field label="Last sign-in" value={date(owner.lastLoginAt)} />
                <Link
                  href={`/admin/users?q=${encodeURIComponent(owner.email)}`}
                  className="inline-block pt-1 text-[13px] font-medium text-[#1a73e8] hover:underline"
                >
                  Manage this user
                </Link>
              </dl>
            ) : (
              <p className="text-[14px] text-[#5f6368]">No linked account.</p>
            )}
          </section>

          {/* Documents */}
          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">KYB documents</h2>
            {documents.length === 0 ? (
              <p className="text-[14px] text-[#5f6368]">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map(([key, value]) => (
                  <li key={key} className="flex items-start gap-2">
                    <MaterialIcon name="description" className="mt-0.5 text-[18px] text-[#5f6368]" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-[#202124]">{DOC_LABELS[key] ?? humanise(key)}</p>
                      <p className="truncate text-[12px] text-[#5f6368]" title={value}>{value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {missingDocs.length > 0 && (
              <p className="mt-3 border-t border-[#f1f3f4] pt-3 text-[12px] text-[#b06000]">
                Missing: {missingDocs.map(([k]) => (DOC_LABELS[k] ?? humanise(k)).toLowerCase()).join(', ')}
              </p>
            )}
          </section>

          {/* Review */}
          <section className={cardCls}>
            <h2 className="text-[16px] font-medium text-[#202124]">KYB decision</h2>
            {dev.kybReviewedAt && (
              <p className="mt-1 text-[13px] text-[#5f6368]">Last reviewed {date(dev.kybReviewedAt)}</p>
            )}
            {dev.reviewNotes && (
              <p className="mt-3 rounded-xl bg-[#f8f9fa] px-3 py-2 text-[13px] text-[#5f6368]">
                “{dev.reviewNotes}”
              </p>
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes for the developer (required when rejecting)"
              className="mt-3 w-full resize-none rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] text-[#202124] focus:border-[#1a73e8] focus:outline-none"
            />

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => review.mutate('APPROVED')}
                disabled={review.isPending || dev.kybStatus === 'APPROVED'}
                className="flex-1 rounded-full bg-[#188038] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0d652d] disabled:opacity-40"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!notes.trim()) {
                    setError('Add a note explaining what the developer needs to fix.');
                    return;
                  }
                  review.mutate('REJECTED');
                }}
                disabled={review.isPending}
                className="flex-1 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6]"
              >
                Reject
              </button>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDelete
        open={confirming}
        name={dev.companyName}
        description={
          `This permanently deletes the account for ${owner?.email ?? 'this developer'}. `
          + 'Accounts with listings cannot be deleted — reassign or remove those first, '
          + 'or suspend the account instead.'
        }
        busy={remove.isPending}
        error={remove.isError ? (remove.error as Error).message : undefined}
        onCancel={() => setConfirming(false)}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
