'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { mandatesApi, type Mandate } from '../../lib/api/mandates';
import { propertiesApi } from '../../lib/api/properties';

/**
 * The mandate pool, from both chairs.
 *
 * For the agent this is the launch feed — the reason to open the app in the
 * morning: which developments are open, at what commission, stated up front.
 * For the developer it is distribution: publish once, review the hands that
 * go up, and accepting one does the partnership and the assignment in a
 * single step.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const field =
  'h-10 w-full rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]';

function money(amount: number | null, currency: string): string {
  if (amount == null) return '';
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

function MandateCard({ m, children }: { m: Mandate; children?: React.ReactNode }) {
  const p = m.property;
  return (
    <div className={cn(card, 'overflow-hidden')}>
      <div className="flex gap-4 p-4">
        {p.heroImageUrl && (
          <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded-2xl sm:block">
            <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-medium text-[#202124]">{p.name}</h3>
            <span className="rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-[13px] font-semibold text-[#137333]">
              {m.commissionPercent}% commission
            </span>
            {m.status === 'CLOSED' && (
              <span className="rounded-full bg-[#f1f3f4] px-2.5 py-0.5 text-[12px] text-[#5f6368]">Closed</span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-[#5f6368]">
            {[p.neighborhood, p.city].filter(Boolean).join(', ')}
            {p.priceFrom != null && ` · from ${money(p.priceFrom, p.currency)}`}
            {m.developer && ` · ${m.developer.companyName}`}
          </p>
          {m.notes && <p className="mt-1.5 text-[13.5px] text-[#5f6368]">{m.notes}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Agent: the pool ─────────────────────────────────────────────────────────

export function AgentMandatesPanel() {
  const qc = useQueryClient();
  const [pitchFor, setPitchFor] = useState<string | null>(null);
  const [pitch, setPitch] = useState('');

  const { data: mandates, isLoading } = useQuery({ queryKey: ['mandates-open'], queryFn: mandatesApi.listOpen });

  const request = useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) => mandatesApi.request(id, message),
    onSuccess: () => { setPitchFor(null); setPitch(''); qc.invalidateQueries({ queryKey: ['mandates-open'] }); },
  });
  const withdraw = useMutation({
    mutationFn: (id: string) => mandatesApi.withdraw(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandates-open'] }),
  });

  if (isLoading) return <div className={cn(card, 'p-8 text-center text-[14px] text-[#5f6368]')}>Loading…</div>;
  if (!mandates?.length) {
    return (
      <div className={cn(card, 'p-8 text-center')}>
        <MaterialIcon name="storefront" size={32} className="text-[#dadce0]" />
        <p className="mt-2 text-[15px] text-[#202124]">Nothing open right now</p>
        <p className="mx-auto mt-1 max-w-md text-[13.5px] text-[#5f6368]">
          When a developer opens a development to agents, it appears here with
          the commission stated up front — and you get an alert the moment it
          does.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mandates.map((m) => (
        <MandateCard key={m.id} m={m}>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {m.myRequest?.status === 'ACCEPTED' ? (
              <span className="flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-1.5 text-[13px] font-medium text-[#137333]">
                <MaterialIcon name="check_circle" size={15} /> You hold this mandate
              </span>
            ) : m.myRequest?.status === 'PENDING' ? (
              <>
                <span className="rounded-full bg-[#fef7e0] px-3 py-1.5 text-[13px] font-medium text-[#b06000]">
                  Request pending
                </span>
                <button onClick={() => withdraw.mutate(m.id)} disabled={withdraw.isPending}
                  className="cursor-pointer rounded-full border border-[#dadce0] px-3 py-1.5 text-[13px] text-[#5f6368] hover:bg-[#f1f3f4]">
                  Withdraw
                </button>
              </>
            ) : pitchFor === m.id ? (
              <span className="flex w-full flex-wrap items-center gap-2">
                <input value={pitch} onChange={(e) => setPitch(e.target.value)}
                  placeholder="Your pitch — why you? (optional)" maxLength={1000}
                  className="h-9 min-w-0 flex-1 rounded-xl border border-[#dadce0] px-3 text-[13px] outline-none focus:border-[#1a73e8]" />
                <button onClick={() => request.mutate({ id: m.id, message: pitch.trim() || undefined })}
                  disabled={request.isPending}
                  className="cursor-pointer rounded-full bg-[#1a73e8] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-[#1765cc]">
                  {request.isPending ? 'Sending…' : 'Send request'}
                </button>
                <button onClick={() => setPitchFor(null)}
                  className="cursor-pointer rounded-full border border-[#dadce0] px-3 py-1.5 text-[13px] text-[#5f6368]">
                  Cancel
                </button>
              </span>
            ) : (
              <button onClick={() => setPitchFor(m.id)}
                className="cursor-pointer rounded-full bg-[#1a73e8] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-[#1765cc]">
                Request mandate
              </button>
            )}
            {m.myRequest?.status === 'DECLINED' && pitchFor !== m.id && (
              <span className="text-[12.5px] text-[#5f6368]">Previously declined — you can request again.</span>
            )}
          </div>
          {request.isError && pitchFor === m.id && (
            <p className="mt-1.5 text-[13px] text-[#c5221f]">{(request.error as Error).message}</p>
          )}
        </MandateCard>
      ))}
    </div>
  );
}

// ─── Developer: publish & review ─────────────────────────────────────────────

function PublishForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ propertyId: '', percent: '', notes: '', maxAgents: '' });
  const { data: mine } = useQuery({
    queryKey: ['my-properties-for-mandate'],
    queryFn: () => propertiesApi.myListings({ limit: 50, status: 'ACTIVE' }),
  });

  const publish = useMutation({
    mutationFn: () =>
      mandatesApi.publish({
        propertyId: form.propertyId,
        commissionPercent: Number(form.percent),
        notes: form.notes.trim() || undefined,
        maxAgents: form.maxAgents ? Number(form.maxAgents) : undefined,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mandates-mine'] }); onDone(); },
  });

  return (
    <div className={cn(card, 'p-5')}>
      <h2 className="text-[16px] font-medium text-[#202124]">Open a development to agents</h2>
      <p className="mt-0.5 text-[13px] text-[#5f6368]">
        Every verified agent is alerted, with your commission stated up front —
        it becomes the assignment&rsquo;s rate when you accept a request, so
        say what you mean.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <select value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
          className={cn(field, 'sm:col-span-2')}>
          <option value="">Choose a live development…</option>
          {(mine?.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })}
          placeholder="Commission %" inputMode="decimal" className={field} />
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Terms — payment timing, marketing support… (optional)" maxLength={2000}
          className={cn(field, 'sm:col-span-2')} />
        <input value={form.maxAgents} onChange={(e) => setForm({ ...form, maxAgents: e.target.value })}
          placeholder="Max agents (optional)" inputMode="numeric" className={field} />
      </div>
      {publish.isError && <p className="mt-2 text-[13px] text-[#c5221f]">{(publish.error as Error).message}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={() => publish.mutate()}
          disabled={publish.isPending || !form.propertyId || !form.percent}
          className="h-10 cursor-pointer rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40">
          {publish.isPending ? 'Publishing…' : 'Publish to agent network'}
        </button>
        <button onClick={onDone} className="h-10 cursor-pointer rounded-xl border border-[#dadce0] px-4 text-[14px] text-[#202124] hover:bg-[#f8f9fa]">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function DeveloperMandatesPanel() {
  const qc = useQueryClient();
  const [publishing, setPublishing] = useState(false);
  const { data: mandates, isLoading } = useQuery({ queryKey: ['mandates-mine'], queryFn: mandatesApi.listMine });

  const respond = useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      mandatesApi.respond(requestId, accept),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandates-mine'] }),
  });
  const close = useMutation({
    mutationFn: (id: string) => mandatesApi.close(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandates-mine'] }),
  });

  return (
    <div className="space-y-4">
      {!publishing && (
        <div className="flex justify-end">
          <button onClick={() => setPublishing(true)}
            className="cursor-pointer rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc]">
            Open a development
          </button>
        </div>
      )}
      {publishing && <PublishForm onDone={() => setPublishing(false)} />}

      {isLoading ? (
        <div className={cn(card, 'p-8 text-center text-[14px] text-[#5f6368]')}>Loading…</div>
      ) : !mandates?.length ? (
        <div className={cn(card, 'p-8 text-center')}>
          <MaterialIcon name="campaign" size={32} className="text-[#dadce0]" />
          <p className="mt-2 text-[15px] text-[#202124]">Nothing published yet</p>
          <p className="mx-auto mt-1 max-w-md text-[13.5px] text-[#5f6368]">
            Opening a development puts it in front of every verified agent at
            once — the ones with buyers come to you, and accepting a request
            creates the partnership and assignment in one step.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mandates.map((m) => (
            <MandateCard key={m.id} m={m}>
              <div className="mt-3 space-y-2">
                {(m.requests ?? []).length === 0 && (
                  <p className="text-[13px] text-[#80868b]">No requests yet — agents have been alerted.</p>
                )}
                {(m.requests ?? []).map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f8f9fa] px-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-[#202124]">
                        {r.agent?.displayName}
                        <span className="ml-2 font-normal text-[#5f6368]">
                          {r.agent?.dealsCompleted ?? 0} closing{(r.agent?.dealsCompleted ?? 0) === 1 ? '' : 's'}
                          {r.agent && r.agent.ratingCount > 0 && ` · ★ ${r.agent.ratingAverage.toFixed(1)}`}
                        </span>
                      </span>
                      {r.message && <span className="block truncate text-[12.5px] text-[#5f6368]">&ldquo;{r.message}&rdquo;</span>}
                    </span>
                    {r.status === 'PENDING' ? (
                      <span className="flex gap-1.5">
                        <button onClick={() => respond.mutate({ requestId: r.id, accept: true })} disabled={respond.isPending}
                          className="cursor-pointer rounded-full bg-[#1a73e8] px-3 py-1 text-[12.5px] font-medium text-white hover:bg-[#1765cc]">
                          Accept
                        </button>
                        <button onClick={() => respond.mutate({ requestId: r.id, accept: false })} disabled={respond.isPending}
                          className="cursor-pointer rounded-full border border-[#dadce0] px-3 py-1 text-[12.5px] text-[#5f6368] hover:bg-[#f1f3f4]">
                          Decline
                        </button>
                      </span>
                    ) : (
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-[12px] font-medium',
                        r.status === 'ACCEPTED' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#f1f3f4] text-[#5f6368]',
                      )}>
                        {r.status.toLowerCase()}
                      </span>
                    )}
                  </div>
                ))}
                {m.status === 'OPEN' && (
                  <button onClick={() => close.mutate(m.id)} disabled={close.isPending}
                    className="cursor-pointer text-[13px] text-[#5f6368] underline-offset-2 hover:underline">
                    Close to new requests
                  </button>
                )}
              </div>
            </MandateCard>
          ))}
        </div>
      )}
    </div>
  );
}
