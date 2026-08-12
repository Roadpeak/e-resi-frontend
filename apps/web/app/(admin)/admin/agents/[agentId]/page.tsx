'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../../components/dashboard/MaterialIcon';
import {
  agentsApi,
  COMPANY_DOCUMENT_TYPES,
  INDIVIDUAL_DOCUMENT_TYPES,
  SPECIALTY_LABELS,
  type AgentSpecialty,
} from '../../../../../lib/api/agents';
import { ApiError } from '../../../../../lib/api/client';
import { cn } from '../../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const KYB_STYLES: Record<string, string> = {
  APPROVED: 'bg-[#e6f4ea] text-[#188038]',
  PENDING: 'bg-[#fef7e0] text-[#b06000]',
  REJECTED: 'bg-[#fce8e6] text-[#c5221f]',
  NOT_SUBMITTED: 'bg-[#f1f3f4] text-[#5f6368]',
};

const date = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** "COMPANY_REGISTRATION" → "Company registration", when we have no label. */
const humanise = (k: string) =>
  k.replace(/[_-]/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()).trim();

/** Images preview inline; PDFs and everything else open in a new tab. */
const isImage = (url: string) => /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] uppercase tracking-wide text-[#5f6368]">{label}</dt>
      <dd className="mt-0.5 break-words text-[14px] text-[#202124]">{value}</dd>
    </div>
  );
}

export default function AdminAgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const { data: agent, isLoading } = useQuery({
    queryKey: ['admin-agent', agentId],
    queryFn: () => agentsApi.adminGet(agentId),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-agent', agentId] });
    queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
  }

  const review = useMutation({
    mutationFn: (status: 'APPROVED' | 'REJECTED') =>
      agentsApi.adminReview(agentId, status, reason.trim() || undefined),
    onSuccess: (a) => {
      invalidate();
      setError('');
      setReason('');
      setToast(`Verification ${a.kybStatus.toLowerCase()}`);
      setTimeout(() => setToast(''), 4000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Review failed'),
  });

  const setListed = useMutation({
    mutationFn: (isListed: boolean) => agentsApi.adminSetListed(agentId, isListed),
    onSuccess: (a) => {
      invalidate();
      setError('');
      setToast(a.isListed ? 'Agent is now listed publicly' : 'Agent hidden from the directory');
      setTimeout(() => setToast(''), 4000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not change listing'),
  });

  if (isLoading) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Loading…</p>;
  }
  if (!agent) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Agent not found.</p>;
  }

  const owner = agent.user;
  const isCompany = agent.kind === 'COMPANY';
  const avatar = isCompany ? agent.logoUrl : agent.photoUrl;
  const documents = agent.kybDocuments ?? [];

  // Required documents differ by kind, so "missing" is only meaningful against
  // the right list — an individual is not missing a certificate of incorporation.
  const expected = isCompany ? COMPANY_DOCUMENT_TYPES : INDIVIDUAL_DOCUMENT_TYPES;
  const supplied = new Set(documents.map((d) => d.type));
  const missingRequired = expected.filter(
    (t) => 'required' in t && t.required && !supplied.has(t.value),
  );

  return (
    <div className="space-y-5">
      <Link
        href="/admin/agents"
        className="inline-flex items-center gap-1 text-[13px] text-[#5f6368] transition-colors hover:text-[#202124]"
      >
        <MaterialIcon name="arrow_back" className="text-[16px]" />
        All agents
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded host
            <img src={avatar} alt="" className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f3f4]">
              <MaterialIcon
                name={isCompany ? 'business' : 'person'}
                className="text-[24px] text-[#5f6368]"
              />
            </div>
          )}
          <div>
            <h1 className="text-[26px] font-normal text-[#202124]">{agent.displayName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#5f6368]">
              <span className={cn('rounded-full px-2.5 py-1 text-[12px]', KYB_STYLES[agent.kybStatus])}>
                {agent.kybStatus.replace(/_/g, ' ').toLowerCase()}
              </span>
              <span>·</span>
              <span>{isCompany ? 'Company' : 'Individual'}</span>
              <span>·</span>
              <span>{agent.isListed ? 'Listed publicly' : 'Not listed'}</span>
              <span>·</span>
              <span>Joined {date(agent.createdAt)}</span>
            </div>
          </div>
        </div>
      </header>

      {toast && (
        <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>
      )}
      {error && (
        <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* ── Documents: the reason this page exists ── */}
          <section className={cardCls}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-[16px] font-medium text-[#202124]">Verification documents</h2>
              <span className="text-[13px] text-[#5f6368]">
                {documents.length} uploaded
              </span>
            </div>

            {documents.length === 0 ? (
              <p className="text-[14px] text-[#5f6368]">
                Nothing submitted yet. There is nothing to approve until this agent uploads
                their documents.
              </p>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc, i) => {
                  const label = doc.label
                    || expected.find((t) => t.value === doc.type)?.label
                    || humanise(doc.type);
                  return (
                    <li
                      key={`${doc.type}-${i}`}
                      className="rounded-2xl border border-[#dadce0] p-3"
                    >
                      <div className="flex items-start gap-3">
                        <MaterialIcon
                          name={isImage(doc.url) ? 'image' : 'description'}
                          className="mt-0.5 text-[20px] text-[#5f6368]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-[#202124]">{label}</p>
                          <p className="truncate text-[12px] text-[#5f6368]" title={doc.url}>
                            {doc.url}
                          </p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="shrink-0 rounded-full border border-[#dadce0] px-3 py-1.5 text-[12px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f1f3f4]"
                        >
                          Open
                        </a>
                      </div>

                      {/* Inline preview so ID photos and certificates can be
                          checked without leaving the review screen. */}
                      {isImage(doc.url) && (
                        <a href={doc.url} target="_blank" rel="noreferrer noopener" className="mt-3 block">
                          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded host */}
                          <img
                            src={doc.url}
                            alt={label}
                            className="max-h-72 w-full rounded-xl bg-[#f8f9fa] object-contain"
                          />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {missingRequired.length > 0 && (
              <p className="mt-3 border-t border-[#f1f3f4] pt-3 text-[12px] text-[#b06000]">
                Missing required: {missingRequired.map((t) => t.label.toLowerCase()).join(', ')}
              </p>
            )}
          </section>

          {/* ── Profile the agent submitted ── */}
          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Profile</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Trading name" value={agent.displayName} />
              <Field label="Type" value={isCompany ? 'Company' : 'Individual'} />
              {isCompany && (
                <Field label="Registration number" value={agent.registrationNumber || '—'} />
              )}
              <Field label="Years of experience" value={agent.yearsExperience ?? '—'} />
              <Field
                label="Website"
                value={agent.website
                  ? <a href={agent.website} target="_blank" rel="noreferrer noopener" className="text-[#1a73e8] hover:underline">{agent.website}</a>
                  : '—'}
              />
              <Field label="Office address" value={agent.officeAddress || '—'} />
              <Field label="Location" value={agent.location || '—'} />
              <Field
                label="Service areas"
                value={agent.serviceAreas.length ? agent.serviceAreas.join(', ') : '—'}
              />
            </dl>

            <div className="mt-4 border-t border-[#f1f3f4] pt-4">
              <p className="text-[12px] uppercase tracking-wide text-[#5f6368]">Specialties</p>
              {agent.specialties.length === 0 ? (
                <p className="mt-1 text-[13px] text-[#b06000]">
                  None selected — this agent will not surface in any &ldquo;need agent help?&rdquo;
                  picker even once approved.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {agent.specialties.map((s: AgentSpecialty) => (
                    <span
                      key={s}
                      className="rounded-full bg-[#f1f3f4] px-3 py-1 text-[12px] text-[#202124]"
                    >
                      {SPECIALTY_LABELS[s] ?? humanise(s)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {agent.bio && (
              <p className="mt-4 border-t border-[#f1f3f4] pt-4 text-[14px] leading-relaxed text-[#5f6368]">
                {agent.bio}
              </p>
            )}
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Account owner */}
          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Account owner</h2>
            {owner ? (
              <dl className="space-y-3">
                <Field
                  label="Name"
                  value={`${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim() || '—'}
                />
                <Field label="Login email" value={owner.email} />
                <Field label="Login phone" value={owner.phone || '—'} />
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

          {/* Public contact */}
          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Public contact</h2>
            <dl className="space-y-3">
              <Field label="Phone" value={agent.phone || '—'} />
              <Field label="WhatsApp" value={agent.whatsapp || '—'} />
              <Field label="Email" value={agent.email || '—'} />
            </dl>
          </section>

          {/* Decision */}
          <section className={cardCls}>
            <h2 className="text-[16px] font-medium text-[#202124]">Verification decision</h2>
            {agent.kybReviewedAt && (
              <p className="mt-1 text-[13px] text-[#5f6368]">
                Last reviewed {date(agent.kybReviewedAt)}
              </p>
            )}
            {agent.kybRejectionReason && (
              <p className="mt-3 rounded-xl bg-[#fce8e6] px-3 py-2 text-[13px] text-[#c5221f]">
                “{agent.kybRejectionReason}”
              </p>
            )}

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for the agent (required when rejecting)"
              className="mt-3 w-full resize-none rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] text-[#202124] focus:border-[#1a73e8] focus:outline-none"
            />

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  review.mutate('APPROVED');
                }}
                disabled={review.isPending || agent.kybStatus === 'APPROVED'}
                className="flex-1 rounded-full bg-[#188038] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0d652d] disabled:opacity-40"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  // The API rejects a reasonless rejection anyway; catching it
                  // here explains what to do instead of surfacing a 400.
                  if (!reason.trim()) {
                    setError('Add a reason explaining what the agent needs to fix.');
                    return;
                  }
                  setError('');
                  review.mutate('REJECTED');
                }}
                disabled={review.isPending}
                className="flex-1 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] disabled:opacity-40"
              >
                Reject
              </button>
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-[#5f6368]">
              Approving lists the agent straight away — the first month is free. After that
              the monthly fee governs listing, so a lapsed payment hides the profile without
              undoing this verification.
            </p>
          </section>

          {/* Public listing — deliberately separate from verification */}
          <section className={cardCls}>
            <h2 className="text-[16px] font-medium text-[#202124]">Public listing</h2>
            <p className="mt-1 text-[13px] text-[#5f6368]">
              {agent.isListed
                ? 'Visible in the agent directory.'
                : agent.suspendedAt
                  ? `Hidden since ${date(agent.suspendedAt)} — unpaid listing fee.`
                  : 'Not currently visible in the directory.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setError('');
                setListed.mutate(!agent.isListed);
              }}
              disabled={setListed.isPending || agent.kybStatus !== 'APPROVED'}
              className="mt-3 w-full rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4] disabled:opacity-40"
            >
              {agent.isListed ? 'Hide from directory' : 'List publicly'}
            </button>
            {agent.kybStatus !== 'APPROVED' && (
              <p className="mt-2 text-[12px] text-[#5f6368]">
                Approve the documents first — unverified agents cannot be listed.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
