'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { agentsApi, type AdminAgent, type AgentKind, type KybStatus } from '../../../../lib/api/agents';
import { cn } from '../../../../lib/utils';

const KYB_STYLES: Record<string, string> = {
  APPROVED: 'bg-[#e6f4ea] text-[#188038]',
  PENDING: 'bg-[#fef7e0] text-[#b06000]',
  REJECTED: 'bg-[#fce8e6] text-[#c5221f]',
  NOT_SUBMITTED: 'bg-[#f1f3f4] text-[#5f6368]',
};

// Awaiting review leads: it is the only filter with work attached to it.
const STATUS_FILTERS: { key: KybStatus | ''; label: string }[] = [
  { key: 'PENDING', label: 'Awaiting review' },
  { key: '', label: 'All' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'NOT_SUBMITTED', label: 'Not submitted' },
];

const KIND_FILTERS: { key: AgentKind | ''; label: string }[] = [
  { key: '', label: 'Companies & individuals' },
  { key: 'COMPANY', label: 'Companies' },
  { key: 'INDIVIDUAL', label: 'Individuals' },
];

export default function AdminAgents() {
  const [kybStatus, setKybStatus] = useState<KybStatus | ''>('PENDING');
  const [kind, setKind] = useState<AgentKind | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-agents', kybStatus, kind],
    queryFn: () => agentsApi.adminQueue({ kybStatus, kind, limit: 50 }),
  });

  const agents = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Agents</h1>
        <p className="text-[14px] text-[#5f6368]">
          {data?.meta.total ?? 0} agent {(data?.meta.total ?? 0) === 1 ? 'account' : 'accounts'}.
          Review the submitted documents before approving — approval is what lets an agent be
          listed publicly and take on clients.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key || 'all'}
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

      <div className="flex flex-wrap gap-2">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.key || 'both'}
            onClick={() => setKind(f.key)}
            className={cn(
              'rounded-full px-3.5 py-1 text-[12px] font-medium transition-colors cursor-pointer',
              kind === f.key
                ? 'border border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]'
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
      ) : agents.length === 0 ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center">
          <MaterialIcon name="support_agent" size={28} className="text-[#80868b]" />
          <p className="mt-2 text-[15px] text-[#5f6368]">
            {kybStatus === 'PENDING'
              ? 'Nothing awaiting review — the queue is clear.'
              : 'No agents match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((a) => (
            <AgentRow key={a.id} agent={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentRow({ agent }: { agent: AdminAgent }) {
  const pending = agent.kybStatus === 'PENDING';
  const docCount = agent.kybDocuments?.length ?? 0;
  const avatar = agent.kind === 'COMPANY' ? agent.logoUrl : agent.photoUrl;

  return (
    <div className={cn('rounded-3xl border bg-white p-5', pending ? 'border-[#fdd663]' : 'border-[#dadce0]')}>
      <div className="flex flex-wrap items-center gap-4">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded host
          <img src={avatar} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f1f3f4]">
            <MaterialIcon
              name={agent.kind === 'COMPANY' ? 'business' : 'person'}
              className="text-[22px] text-[#5f6368]"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-medium text-[#202124]">{agent.displayName}</p>
          <p className="text-[13px] text-[#5f6368]">
            {agent.user?.email ?? '—'} · {agent.kind === 'COMPANY' ? 'Company' : 'Individual'}
          </p>
          <p className="mt-1 text-[12px] text-[#80868b]">
            {docCount} document{docCount === 1 ? '' : 's'} ·{' '}
            {agent.specialties.length} specialt{agent.specialties.length === 1 ? 'y' : 'ies'} ·{' '}
            joined {new Date(agent.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-[12px] font-medium',
              KYB_STYLES[agent.kybStatus] ?? KYB_STYLES.NOT_SUBMITTED,
            )}
          >
            {agent.kybStatus.replace(/_/g, ' ').toLowerCase()}
          </span>
          {/* Verified but hidden is a real state — non-payment delists without
              un-verifying — so it needs to be visible at a glance. */}
          {agent.kybStatus === 'APPROVED' && !agent.isListed && (
            <span className="text-[11px] text-[#b06000]">not listed publicly</span>
          )}
        </div>

        <Link
          href={`/admin/agents/${agent.id}`}
          className="rounded-full bg-[#1a73e8] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc]"
        >
          {pending ? 'Review submission' : 'View details'}
        </Link>
      </div>
    </div>
  );
}
