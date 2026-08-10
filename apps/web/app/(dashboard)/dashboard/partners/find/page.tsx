'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, Search, User, Users } from 'lucide-react';
import {
  ALL_SPECIALTIES, SPECIALTY_LABELS, agentsApi,
  type AgentKind, type AgentSpecialty,
} from '../../../../../lib/api/agents';
import { partnershipsApi } from '../../../../../lib/api/partnerships';
import { ApiError } from '../../../../../lib/api/client';
import { StarRating } from '../../../../../components/directory/StarRating';
import { cn } from '../../../../../lib/utils';

const inputCls =
  'rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[15px] text-[#202124] focus:border-[#1a73e8] focus:outline-none';

/** Search verified agents and propose a partnership with terms. */
export default function FindAgents() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<AgentKind | ''>('');
  const [specialty, setSpecialty] = useState<AgentSpecialty | ''>('');
  const [requesting, setRequesting] = useState<string | null>(null);
  const [commission, setCommission] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['find-agents', search, kind, specialty],
    queryFn: () => agentsApi.list({
      q: search || undefined,
      kind: kind || undefined,
      specialty: specialty || undefined,
      limit: 24,
    }),
  });

  const request = useMutation({
    mutationFn: (agentId: string) => {
      const pct = Number.parseFloat(commission);
      return partnershipsApi.request({
        agentId,
        message: message.trim() || undefined,
        commissionPercent: Number.isFinite(pct) ? pct : undefined,
      });
    },
    onSuccess: (_r, agentId) => {
      setSentTo((prev) => new Set(prev).add(agentId));
      setRequesting(null);
      setCommission('');
      setMessage('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['partnerships'] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not send that request'),
  });

  const agents = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Find agents</h1>
        <p className="text-[14px] text-[#5f6368]">
          Verified agents you can partner with to sell or let your developments.
        </p>
        <Link href="/dashboard/partners" className="text-[14px] font-medium text-[#1a73e8]">
          ← Back to my partners
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex min-w-0 max-w-xs flex-1 items-center">
          <Search size={16} className="pointer-events-none absolute left-3.5 text-[#80868b]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or area…"
            className={cn(inputCls, 'w-full pl-10')}
          />
        </div>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as AgentKind | '')}
          className={cn(inputCls, 'cursor-pointer')}
        >
          <option value="">All types</option>
          <option value="COMPANY">Companies</option>
          <option value="INDIVIDUAL">Individual agents</option>
        </select>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value as AgentSpecialty | '')}
          className={cn(inputCls, 'cursor-pointer')}
        >
          <option value="">All specialties</option>
          {ALL_SPECIALTIES.map((s) => (
            <option key={s} value={s}>{SPECIALTY_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#80868b]" />
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-[#dadce0] bg-white py-16 text-center">
          <Users size={26} className="text-[#dadce0]" />
          <p className="text-[15px] text-[#5f6368]">No agents match those filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => {
            const isCompany = a.kind === 'COMPANY';
            const avatar = isCompany ? a.logoUrl : a.photoUrl;
            const sent = sentTo.has(a.id);
            return (
              <div key={a.id} className="rounded-3xl border border-[#dadce0] bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-[#f1f3f4] text-[#80868b]',
                    isCompany ? 'rounded-2xl' : 'rounded-full',
                  )}>
                    {avatar
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={avatar} alt="" className="h-full w-full object-cover" />
                      : isCompany ? <Building2 size={20} /> : <User size={20} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/agents/${a.id}`}
                      className="block truncate text-[15px] font-medium text-[#202124] hover:text-[#1a73e8]"
                    >
                      {a.displayName}
                    </Link>
                    <p className="truncate text-[13px] text-[#5f6368]">
                      {isCompany ? 'Agency' : 'Individual'}{a.location ? ` · ${a.location}` : ''}
                    </p>
                    <StarRating value={a.ratingAverage} count={a.ratingCount} size={12} />
                  </div>
                </div>

                {a.specialties.length > 0 && (
                  <p className="mt-3 line-clamp-2 text-[13px] text-[#5f6368]">
                    {a.specialties.map((s) => SPECIALTY_LABELS[s]).join(' · ')}
                  </p>
                )}

                {sent ? (
                  <p className="mt-4 rounded-xl bg-[#e6f4ea] px-3 py-2 text-[13px] font-medium text-[#188038]">
                    Request sent
                  </p>
                ) : requesting === a.id ? (
                  <div className="mt-4 space-y-2 rounded-2xl bg-[#f8f9fa] p-3">
                    <input
                      value={commission}
                      onChange={(e) => setCommission(e.target.value.replace(/[^\d.]/g, ''))}
                      placeholder="Commission %"
                      inputMode="decimal"
                      className={cn(inputCls, 'w-full py-2 text-[14px]')}
                    />
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={2}
                      placeholder="Optional message"
                      className={cn(inputCls, 'w-full py-2 text-[14px]')}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => request.mutate(a.id)}
                        disabled={request.isPending}
                        className="rounded-full bg-[#1a73e8] px-3.5 py-1.5 text-[13px] font-medium text-white cursor-pointer disabled:opacity-50"
                      >
                        Send request
                      </button>
                      <button
                        onClick={() => { setRequesting(null); setError(''); }}
                        className="rounded-full border border-[#dadce0] px-3.5 py-1.5 text-[13px] font-medium text-[#5f6368] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setRequesting(a.id); setError(''); }}
                    className="mt-4 w-full rounded-full border border-[#dadce0] py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] cursor-pointer"
                  >
                    Request partnership
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
