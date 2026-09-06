'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { useState as useStateReact } from 'react';
import { propertiesApi } from '../../lib/api/properties';
import { parseHumanNumber } from '../../lib/parse-number';
import { partnershipsApi } from '../../lib/api/partnerships';
import { ApiError } from '../../lib/api/client';
import { formatPrice, cn } from '../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const date = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

interface Props {
  partnershipId: string;
  /** Which side is looking — decides whose details are shown as "the partner". */
  side: 'developer' | 'agent';
}

/**
 * One partnership, seen from either side.
 *
 * The Manage button on both dashboards pointed at a route that did not exist,
 * so an active partnership could be created and then never opened. This is
 * that page: who it is with, what it has produced, which properties are
 * assigned, and the agreement documents.
 *
 * Commission is deliberately absent. Neither side knows yet how these deals
 * will be termed, so rather than encode a guess the agreement itself is
 * uploaded as a document — a record of what was agreed without the platform
 * pretending to model it.
 */
export function PartnershipDetail({ partnershipId, side }: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const { data: p, isLoading, isError } = useQuery({
    queryKey: ['partnership', partnershipId],
    queryFn: () => partnershipsApi.get(partnershipId),
    retry: false,
  });

  const { data: leads } = useQuery({
    queryKey: ['partnership-leads', partnershipId],
    queryFn: () => partnershipsApi.leads(partnershipId, 90),
    enabled: !!p,
  });

  const backHref = side === 'agent' ? '/agent/partners' : '/dashboard/partners';

  const end = useMutation({
    mutationFn: () => partnershipsApi.end(partnershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership', partnershipId] });
      queryClient.invalidateQueries({ queryKey: ['partnerships'] });
      setError('');
      setToast('Partnership ended');
      setTimeout(() => setToast(''), 4000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not end the partnership'),
  });

  const [assignPropertyId, setAssignPropertyId] = useStateReact('');
  const [assignPercent, setAssignPercent] = useStateReact('');
  const myProperties = useQuery({
    queryKey: ['my-properties-for-assign'],
    queryFn: () => propertiesApi.myListings({ limit: 100 }),
    enabled: side === 'developer',
  });
  const assign = useMutation({
    mutationFn: () =>
      partnershipsApi.assignProperty(partnershipId, {
        propertyId: assignPropertyId,
        commissionPercent: assignPercent ? parseHumanNumber(assignPercent) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership', partnershipId] });
      setAssignPropertyId('');
      setAssignPercent('');
      setError('');
      setToast('Property assigned — the agent can now work it');
      setTimeout(() => setToast(''), 4000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not assign that property'),
  });

  const unassign = useMutation({
    mutationFn: (propertyId: string) => partnershipsApi.unassignProperty(partnershipId, propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership', partnershipId] });
      setError('');
      setToast('Property removed from this partnership');
      setTimeout(() => setToast(''), 4000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not remove that property'),
  });

  if (isLoading) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Loading…</p>;
  }
  if (isError || !p) {
    return (
      <div className="py-16 text-center">
        <p className="text-[15px] text-[#5f6368]">This partnership could not be found.</p>
        <Link
          href={backHref}
          className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc]"
        >
          <MaterialIcon name="arrow_back" className="text-[16px]" /> All partners
        </Link>
      </div>
    );
  }

  // Each side sees the other as "the partner".
  const partnerName = side === 'agent' ? p.developer?.companyName : p.agent?.displayName;
  const partnerLogo = side === 'agent' ? p.developer?.logoUrl : (p.agent?.logoUrl ?? p.agent?.photoUrl);
  const partnerHref = side === 'agent'
    ? (p.developer?.id ? `/developers/${p.developer.id}` : null)
    : (p.agent?.id ? `/agents/${p.agent.id}` : null);

  const assignments = p.assignments ?? [];
  const documents = p.documents ?? [];
  const t = leads?.totals;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-[13px] text-[#5f6368] transition-colors hover:text-[#202124]"
          >
            <MaterialIcon name="arrow_back" className="text-[16px]" /> All partners
          </Link>

          <div className="mt-3 flex items-center gap-3">
            {partnerLogo ? (
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
                <Image src={partnerLogo} alt="" fill className="object-cover" sizes="48px" />
              </span>
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f1f3f4]">
                <MaterialIcon
                  name={side === 'agent' ? 'apartment' : 'support_agent'}
                  className="text-[22px] text-[#5f6368]"
                />
              </span>
            )}
            <div>
              <h1 className="text-[24px] font-normal text-[#202124]">{partnerName ?? 'Partner'}</h1>
              <p className="text-[13px] text-[#5f6368]">
                {p.status === 'ACTIVE' ? 'Active partnership' : p.status.toLowerCase()}
                {' · since '}{date(p.respondedAt ?? p.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {partnerHref && (
            <a
              href={partnerHref}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
            >
              View public profile
            </a>
          )}
          {p.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => { setError(''); end.mutate(); }}
              disabled={end.isPending}
              className="rounded-full border border-[#f5c6c4] px-4 py-2 text-[14px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] disabled:opacity-40 cursor-pointer"
            >
              End partnership
            </button>
          )}
        </div>
      </div>

      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}
      {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

      {/* ── What it has produced ── */}
      <section className={cardCls}>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-[16px] font-medium text-[#202124]">
            {side === 'agent' ? 'What you have introduced' : 'What this agent has brought you'}
          </h2>
          <span className="text-[13px] text-[#5f6368]">Last {leads?.period.days ?? 90} days</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Enquiries', value: t?.inquiries ?? 0 },
            { label: 'Viewings booked', value: t?.bookings ?? 0 },
            { label: 'Units reserved', value: t?.reservations ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[#dadce0] p-4">
              <p className="text-[12px] uppercase tracking-wide text-[#5f6368]">{s.label}</p>
              <p className="mt-1 text-[26px] font-normal tabular-nums text-[#202124]">{s.value}</p>
            </div>
          ))}
        </div>

        {leads && leads.recent.length > 0 ? (
          <ul className="mt-4 divide-y divide-[#f1f3f4] border-t border-[#f1f3f4] pt-1">
            {leads.recent.map((r) => (
              <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-center gap-3 py-2.5">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                    r.kind === 'BOOKING'
                      ? 'bg-[#e8f0fe] text-[#1967d2]'
                      : 'bg-[#f1f3f4] text-[#5f6368]',
                  )}
                >
                  {r.kind === 'BOOKING' ? 'Viewing' : 'Enquiry'}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-[#202124]">{r.name}</span>
                <span className="truncate text-[13px] text-[#5f6368]">{r.property}</span>
                <span className="text-[12px] text-[#80868b]">{date(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 border-t border-[#f1f3f4] pt-4 text-[14px] text-[#5f6368]">
            No leads recorded under this partnership yet. Enquiries and viewings are credited
            here when they come through a link this agent shared.
          </p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Assigned properties ── */}
        <section className={cardCls}>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[16px] font-medium text-[#202124]">Properties</h2>
            <span className="text-[13px] text-[#5f6368]">
              {assignments.length} assigned
            </span>
          </div>

          {assignments.length === 0 ? (
            <p className="text-[14px] text-[#5f6368]">
              {side === 'developer'
                ? 'No properties assigned yet. Assign one so this agent can work on it.'
                : 'This developer has not assigned you a property yet.'}
            </p>
          ) : (
            <ul className="divide-y divide-[#f1f3f4]">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${a.property.slug}`}
                      target="_blank"
                      className="block truncate text-[14px] text-[#1a73e8] hover:underline"
                    >
                      {a.property.name}
                    </Link>
                    <p className="text-[12px] text-[#5f6368]">
                      {a.property.city}
                      {a.property.priceFrom
                        ? ` · from ${formatPrice(a.property.priceFrom, a.property.currency)}`
                        : ''}
                    </p>
                  </div>
                  {side === 'developer' && (
                    <button
                      type="button"
                      onClick={() => { setError(''); unassign.mutate(a.property.id); }}
                      disabled={unassign.isPending}
                      title={`Remove ${a.property.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#fce8e6] hover:text-[#c5221f] disabled:opacity-40 cursor-pointer"
                    >
                      <MaterialIcon name="close" className="text-[16px]" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Assigning is what actually hands the agent the property — a
              partnership alone is only the relationship. Deals, referral
              chat routing and lead capture all check this assignment. */}
          {side === 'developer' && p.status === 'ACTIVE' && (
            <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-3.5">
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  value={assignPropertyId}
                  onChange={(e) => setAssignPropertyId(e.target.value)}
                  className="h-10 rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8] sm:col-span-2"
                >
                  <option value="">Assign a property…</option>
                  {(myProperties.data?.data ?? [])
                    .filter((p) => !assignments.some((a) => a.property.id === p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <input
                  value={assignPercent}
                  onChange={(e) => setAssignPercent(e.target.value)}
                  placeholder="Commission % (optional)"
                  inputMode="decimal"
                  className="h-10 rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]"
                />
              </div>
              <button
                onClick={() => assign.mutate()}
                disabled={assign.isPending || !assignPropertyId}
                className="mt-2 h-10 w-full cursor-pointer rounded-xl bg-[#1a73e8] text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40"
              >
                {assign.isPending ? 'Assigning…' : 'Assign to this agent'}
              </button>
            </div>
          )}
        </section>

        {/* ── The agreement ── */}
        <section className={cardCls}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 className="text-[16px] font-medium text-[#202124]">Agreement</h2>
            <span className="text-[13px] text-[#5f6368]">{documents.length} file{documents.length === 1 ? '' : 's'}</span>
          </div>
          <p className="mb-4 text-[13px] text-[#5f6368]">
            Commission and terms are whatever the two of you agreed — upload the signed
            document so both sides have the same copy on file.
          </p>

          {documents.length === 0 ? (
            <p className="text-[14px] text-[#5f6368]">Nothing uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-[#f1f3f4]">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <MaterialIcon name="description" className="text-[18px] text-[#5f6368]" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block truncate text-[14px] text-[#1a73e8] hover:underline"
                    >
                      {d.title}
                    </a>
                    <p className="text-[12px] text-[#5f6368]">
                      {d.uploadedBy
                        ? `${d.uploadedBy.firstName ?? ''} ${d.uploadedBy.lastName ?? ''}`.trim()
                        : 'Uploaded'}
                      {' · '}{date(d.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
