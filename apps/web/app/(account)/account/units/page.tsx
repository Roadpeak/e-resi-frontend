'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../lib/utils';
import { ownershipsApi, type OwnedUnit } from '../../../../lib/api/ownerships';
import { agentsApi } from '../../../../lib/api/agents';
import { parseHumanNumber } from '../../../../lib/parse-number';

/**
 * The investor's units — ownership turned into rent.
 *
 * A unit appears here once its purchase completes (or the developer records
 * the sale). From here the owner lists it: set the rent, choose who manages
 * it — themselves, the building's developer, or a letting agent they invite
 * from the directory — and photograph the inside. The building's hero photo
 * carries over automatically; the interior shots are the owner's job,
 * because a tenant rents the inside of a unit, not the outside of a tower.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const field =
  'h-10 w-full rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]';

function money(v: number | null | undefined, c = 'KES') {
  return v == null ? '—' : `${c} ${Math.round(v).toLocaleString()}`;
}

/** List the unit for rent. */
function ListForm({ ownership, onDone }: { ownership: OwnedUnit; onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    rent: '',
    furnishing: 'UNFURNISHED' as 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED',
    manage: 'OWNER' as 'OWNER' | 'DEVELOPER',
    description: '',
  });
  const rent = parseHumanNumber(form.rent);

  const create = useMutation({
    mutationFn: () =>
      ownershipsApi.createListing(ownership.id, {
        pricePerMonth: rent as number,
        furnishing: form.furnishing,
        manage: form.manage,
        description: form.description.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-ownerships'] });
      onDone();
    },
  });

  return (
    <div className="mt-3 rounded-2xl bg-[#f8f9fa] p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={form.rent}
          onChange={(e) => setForm({ ...form, rent: e.target.value })}
          placeholder={`Monthly rent (${ownership.unit.currency})`}
          inputMode="numeric"
          className={field}
        />
        <select
          value={form.furnishing}
          onChange={(e) => setForm({ ...form, furnishing: e.target.value as typeof form.furnishing })}
          className={field}
        >
          <option value="UNFURNISHED">Unfurnished</option>
          <option value="SEMI_FURNISHED">Semi-furnished</option>
          <option value="FURNISHED">Furnished</option>
        </select>
      </div>
      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Describe your unit — what a tenant should know (optional)"
        maxLength={4000}
        className={cn(field, 'mt-2')}
      />

      {/* Who runs it. Agents come after, by invitation from the listing. */}
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ['OWNER', 'I manage it myself', 'Inquiries and chat come to you'],
            ['DEVELOPER', 'The developer manages it', 'Left with the building developer to run'],
          ] as const
        ).map(([value, label, sub]) => (
          <button
            key={value}
            onClick={() => setForm({ ...form, manage: value })}
            className={cn(
              'flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-colors',
              form.manage === value
                ? 'border-[#1a73e8] bg-[#e8f0fe]'
                : 'border-[#dadce0] bg-white hover:bg-[#f1f3f4]',
            )}
          >
            <span className="block text-[13.5px] font-medium text-[#202124]">{label}</span>
            <span className="block text-[12px] text-[#5f6368]">{sub}</span>
          </button>
        ))}
      </div>

      {create.isError && (
        <p className="mt-2 text-[13px] text-[#c5221f]">{(create.error as Error).message}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending || !rent || rent <= 0}
          className="h-10 cursor-pointer rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40"
        >
          {create.isPending ? 'Listing…' : 'List for rent'}
        </button>
        <button onClick={onDone} className="h-10 cursor-pointer rounded-xl border border-[#dadce0] px-4 text-[14px] text-[#202124] hover:bg-[#f8f9fa]">
          Cancel
        </button>
      </div>
      <p className="mt-2 text-[12.5px] text-[#5f6368]">
        Your listing starts with the building&rsquo;s photo — add your own
        interior photos right after, furnished or not: that is what tenants
        decide on.
      </p>
    </div>
  );
}

/** Find and invite a letting agent. */
function InviteAgent({ listingId, onDone }: { listingId: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [message, setMessage] = useState('');
  const { data } = useQuery({
    queryKey: ['agent-pick', q],
    queryFn: () => agentsApi.list({ limit: 6, q: q || undefined }),
  });

  const invite = useMutation({
    mutationFn: (agentId: string) => ownershipsApi.inviteAgent(listingId, agentId, message.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-ownerships'] });
      onDone();
    },
  });

  return (
    <div className="mt-3 rounded-2xl bg-[#f8f9fa] p-4">
      <p className="text-[13px] text-[#5f6368]">
        Invite a verified agent to find your tenant — they manage the listing
        and its inquiries once they accept.
      </p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents…" className={cn(field, 'mt-2')} />
      <input value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder="A note to the agent (optional)" maxLength={1000} className={cn(field, 'mt-2')} />
      <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto">
        {(data?.data ?? []).map((a) => (
          <li key={a.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium text-[#202124]">{a.displayName}</span>
              <span className="block text-[12px] text-[#5f6368]">
                {a.dealsCompleted > 0 && `${a.dealsCompleted} closings · `}
                {a.ratingCount > 0 ? `★ ${a.ratingAverage.toFixed(1)}` : 'new'}
              </span>
            </span>
            <button
              onClick={() => invite.mutate(a.id)}
              disabled={invite.isPending}
              className="cursor-pointer rounded-full bg-[#1a73e8] px-3 py-1 text-[12.5px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40"
            >
              Invite
            </button>
          </li>
        ))}
      </ul>
      {invite.isError && <p className="mt-2 text-[13px] text-[#c5221f]">{(invite.error as Error).message}</p>}
      <button onClick={onDone} className="mt-2 cursor-pointer text-[13px] text-[#5f6368] underline-offset-2 hover:underline">
        Cancel
      </button>
    </div>
  );
}

function PhotoUpload({ listingId, hasOwnHero }: { listingId: string; hasOwnHero: boolean }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState('');

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    try {
      for (let i = 0; i < files.length; i++) {
        // The first photo the owner ever uploads becomes the hero — their
        // unit's own face replacing the borrowed building shot.
        await ownershipsApi.addPhoto(listingId, files[i], !hasOwnHero && i === 0 && done === 0);
        setDone((d) => d + 1);
      }
      qc.invalidateQueries({ queryKey: ['my-ownerships'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => onPick(e.target.files)} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="cursor-pointer rounded-full border border-[#dadce0] px-3 py-1.5 text-[13px] text-[#202124] hover:bg-[#f8f9fa] disabled:opacity-50"
      >
        {busy ? 'Uploading…' : done > 0 ? `Add more photos (${done} added)` : 'Add unit photos'}
      </button>
      {error && <span className="text-[12.5px] text-[#c5221f]">{error}</span>}
    </span>
  );
}

function OwnedUnitCard({ o }: { o: OwnedUnit }) {
  const [listing, setListing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const l = o.rentListing;
  const pendingInvite = l?.lettingEngagements.find((e) => e.status === 'PENDING');

  return (
    <div className={cn(card, 'overflow-hidden')}>
      <div className="flex gap-4 p-4">
        {o.unit.property.heroImageUrl && (
          <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded-2xl sm:block">
            <Image src={o.unit.property.heroImageUrl} alt="" fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-medium text-[#202124]">
            {o.unit.name}
            <span className="ml-2 text-[13.5px] font-normal text-[#5f6368]">{o.unit.property.name}</span>
          </h3>
          <p className="mt-0.5 text-[13px] text-[#5f6368]">
            {o.unit.bedrooms === 0 ? 'Studio' : `${o.unit.bedrooms} bed`} · {o.unit.bathrooms} bath
            {o.unit.sqm ? ` · ${o.unit.sqm}sqm` : ''} · {o.unit.property.city}
          </p>

          {!l ? (
            listing ? (
              <ListForm ownership={o} onDone={() => setListing(false)} />
            ) : (
              <button
                onClick={() => setListing(true)}
                className="mt-3 cursor-pointer rounded-full bg-[#1a73e8] px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[#1765cc]"
              >
                List for rent
              </button>
            )
          ) : (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/rent/${l.slug}`} target="_blank"
                  className="text-[13.5px] font-medium text-[#1a73e8] hover:underline">
                  {l.name} →
                </Link>
                <span className="rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-[12px] font-medium text-[#137333]">
                  {money(l.priceFrom, l.currency)}/mo
                </span>
                <span className="rounded-full bg-[#f1f3f4] px-2.5 py-0.5 text-[12px] text-[#5f6368]">
                  {l.managerKind === 'AGENT' && l.managingAgent
                    ? `Managed by ${l.managingAgent.displayName}`
                    : l.managerKind === 'DEVELOPER'
                      ? 'Managed by the developer'
                      : 'You manage it'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <PhotoUpload
                  listingId={l.id}
                  hasOwnHero={l.heroImageUrl !== o.unit.property.heroImageUrl}
                />
                {l.managerKind === 'OWNER' && !pendingInvite && (
                  inviting ? null : (
                    <button
                      onClick={() => setInviting(true)}
                      className="cursor-pointer rounded-full border border-[#dadce0] px-3 py-1.5 text-[13px] text-[#202124] hover:bg-[#f8f9fa]"
                    >
                      Invite an agent to let it
                    </button>
                  )
                )}
                {pendingInvite && (
                  <span className="rounded-full bg-[#fef7e0] px-3 py-1.5 text-[12.5px] font-medium text-[#b06000]">
                    Awaiting {pendingInvite.agent.displayName}
                  </span>
                )}
              </div>
              {inviting && <InviteAgent listingId={l.id} onDone={() => setInviting(false)} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyUnits() {
  const { data: ownerships, isLoading } = useQuery({
    queryKey: ['my-ownerships'],
    queryFn: ownershipsApi.mine,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-normal text-[#202124]">My units</h1>
        <p className="text-[14px] text-[#5f6368]">
          Units you own. List one for rent, photograph the inside, and manage
          it yourself — or hand it to the developer or a letting agent.
        </p>
      </div>

      {isLoading ? (
        <div className={cn(card, 'p-8 text-center text-[14px] text-[#5f6368]')}>Loading…</div>
      ) : !ownerships?.length ? (
        <div className={cn(card, 'p-8 text-center')}>
          <p className="text-[15px] text-[#202124]">No units yet</p>
          <p className="mx-auto mt-1 max-w-md text-[13.5px] text-[#5f6368]">
            When a purchase completes — or your developer records you as a
            unit&rsquo;s owner — it appears here, ready to list for rent.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ownerships.map((o) => <OwnedUnitCard key={o.id} o={o} />)}
        </div>
      )}
    </div>
  );
}
