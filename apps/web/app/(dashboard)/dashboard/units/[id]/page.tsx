'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn, formatPrice } from '../../../../../lib/utils';
import { MaterialIcon } from '../../../../../components/dashboard/MaterialIcon';
import { unitsApi, type UnitStatus } from '../../../../../lib/api/units';
import { ownershipsApi } from '../../../../../lib/api/ownerships';
import { uploadFile } from '../../../../../lib/api/media';

/**
 * One unit, fully managed.
 *
 * The allocation board answers "who holds what" across the portfolio; this
 * page answers everything about one unit: its sale state, its owner, its
 * rental life, the deals working it, and its own photos and videos — the
 * interiors of THIS unit, distinct from the building's shared gallery.
 * It is the page a developer opens when a buyer asks "what is the state of
 * A-101" and the answer has to be complete.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white p-5';
const field =
  'h-10 w-full rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]';

const STATUS_TONES: Record<UnitStatus, string> = {
  AVAILABLE: 'bg-[#e6f4ea] text-[#188038]',
  RESERVED: 'bg-[#fef7e0] text-[#b06000]',
  SOLD: 'bg-[#fce8e6] text-[#c5221f]',
};

export default function UnitManagePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['unit-manage', id] });

  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit-manage', id],
    queryFn: () => unitsApi.manage(id),
  });

  const [ownerEmail, setOwnerEmail] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const setStatus = useMutation({
    mutationFn: (status: UnitStatus) => unitsApi.updateStatus(unit!.property.slug, id, status),
    onSuccess: refresh,
  });
  const recordOwner = useMutation({
    mutationFn: () => ownershipsApi.record(id, ownerEmail.trim()),
    onSuccess: () => { setOwnerEmail(''); refresh(); },
  });
  const removeMedia = useMutation({
    mutationFn: (mediaId: string) => unitsApi.removeMedia(id, mediaId),
    onSuccess: refresh,
  });

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError('');
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadFile(file, 'properties');
        await unitsApi.addMedia(id, {
          type: file.type.startsWith('video') ? 'VIDEO' : 'PHOTO',
          url: uploaded.url,
          sizeBytes: uploaded.sizeBytes,
          mimeType: file.type,
        });
      }
      refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  if (isLoading || !unit) {
    return <div className={cn(card, 'text-center text-[14px] text-[#5f6368]')}>Loading…</div>;
  }

  // The pipeline owns the status while a live deal or reservation holds the
  // unit — or once a completed sale made someone its owner. The dropdown
  // would silently disagree with those records (the API refuses it too), so
  // it yields to a chip.
  const heldByDeal = unit.deals.some((d) => ['RESERVED', 'SPA_SIGNED', 'COMPLETED'].includes(d.stage));
  const heldByPipeline = heldByDeal || unit.reservations.length > 0 || !!unit.ownership;

  return (
    <div className="max-w-7xl space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard/units" className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]">
          <MaterialIcon name="arrow_back" size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-normal text-[#202124]">
            {unit.name}
            <span className="ml-2 text-[15px] text-[#5f6368]">{unit.property.name}</span>
          </h1>
          <p className="text-[13.5px] text-[#5f6368]">
            {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`} · {unit.bathrooms} bath
            {unit.sqm ? ` · ${unit.sqm}sqm` : ''}{unit.floor != null ? ` · floor ${unit.floor}` : ''}
            {' · '}{formatPrice(unit.price, unit.currency)}
          </p>
        </div>
        {heldByPipeline ? (
          <span className={cn('rounded-full px-3.5 py-1.5 text-[13.5px] font-medium', STATUS_TONES[unit.status])}
            title={heldByDeal
              ? 'Managed by its deal — move the deal to change it'
              : unit.reservations.length > 0
                ? 'Managed by its reservation — advance or cancel it from Reservations'
                : 'This unit has a recorded owner — its status follows the completed sale'}>
            {unit.status.toLowerCase()}
          </span>
        ) : (
          <select
            value={unit.status}
            disabled={setStatus.isPending}
            onChange={(e) => setStatus.mutate(e.target.value as UnitStatus)}
            className={cn('cursor-pointer rounded-full border-0 px-3.5 py-1.5 text-[13.5px] font-medium outline-none', STATUS_TONES[unit.status])}
          >
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
          </select>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Sales pipeline ── */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#202124]">Sale</h2>
          {unit.deals.length === 0 && unit.reservations.length === 0 ? (
            <p className="mt-2 text-[13.5px] text-[#5f6368]">
              No live deal or reservation on this unit. Deals opened by your
              partner agents appear here the moment they pick this unit.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {unit.deals.map((d) => (
                <li key={d.id}>
                  <Link href={`/dashboard/deals/${d.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-[#e8eaed] px-4 py-3 transition-colors hover:bg-[#f8f9fa]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-[#202124]">{d.clientName}</span>
                      <span className="block text-[12.5px] text-[#5f6368]">via {d.agent.displayName}</span>
                    </span>
                    <span className="rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[12px] font-medium text-[#1967d2]">
                      {d.stage.toLowerCase().replace('_', ' ')}
                    </span>
                  </Link>
                </li>
              ))}
              {unit.reservations.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-[#e8eaed] px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-[#202124]">
                      {r.user.firstName} {r.user.lastName}
                    </span>
                    <span className="block text-[12.5px] text-[#5f6368]">platform reservation · {r.user.email}</span>
                  </span>
                  <span className="rounded-full bg-[#fef7e0] px-2.5 py-0.5 text-[12px] font-medium text-[#b06000]">
                    {r.stage.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Ownership ── */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#202124]">Ownership</h2>
          {unit.ownership ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-2xl bg-[#f8f9fa] px-4 py-3">
                <p className="text-[14px] font-medium text-[#202124]">
                  {unit.ownership.owner.firstName} {unit.ownership.owner.lastName}
                </p>
                <p className="text-[12.5px] text-[#5f6368]">
                  {unit.ownership.owner.email}
                  {unit.ownership.owner.phone ? ` · ${unit.ownership.owner.phone}` : ''}
                  {' · owner since '}{new Date(unit.ownership.createdAt).toLocaleDateString()}
                </p>
              </div>
              {unit.ownership.rentListing ? (
                <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
                  <Link href={`/rent/${unit.ownership.rentListing.slug}`} target="_blank"
                    className="font-medium text-[#1a73e8] hover:underline">
                    {unit.ownership.rentListing.name} →
                  </Link>
                  <span className="rounded-full bg-[#f1f3f4] px-2.5 py-0.5 text-[12px] text-[#5f6368]">
                    {unit.ownership.rentListing.managerKind === 'AGENT' && unit.ownership.rentListing.managingAgent
                      ? `let by ${unit.ownership.rentListing.managingAgent.displayName}`
                      : unit.ownership.rentListing.managerKind === 'DEVELOPER'
                        ? 'you manage the letting'
                        : 'owner manages the letting'}
                  </span>
                </div>
              ) : (
                <p className="text-[13px] text-[#5f6368]">
                  Not listed for rent — that is the owner&rsquo;s call, from their account.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-[13.5px] text-[#5f6368]">
                No recorded owner. When a purchase completes on-platform this
                fills itself; for a sale that happened outside, record the
                buyer here — they need an e-resi account first.
              </p>
              <div className="mt-3 flex gap-2">
                <input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="Buyer's account email" type="email" className={field} />
                <button
                  onClick={() => recordOwner.mutate()}
                  disabled={recordOwner.isPending || !ownerEmail.includes('@')}
                  className="h-10 shrink-0 cursor-pointer rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40"
                >
                  {recordOwner.isPending ? 'Recording…' : 'Record owner'}
                </button>
              </div>
              {recordOwner.isError && (
                <p className="mt-2 text-[13px] text-[#c5221f]">{(recordOwner.error as Error).message}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Rentals this unit appears in ── */}
      {unit.rentUnits.length > 0 && (
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#202124]">Rental listings</h2>
          <ul className="mt-3 space-y-2">
            {unit.rentUnits.map((ru) => (
              <li key={ru.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e8eaed] px-4 py-3 text-[13.5px]">
                <Link href={`/rent/${ru.rentListing.slug}`} target="_blank"
                  className="min-w-0 flex-1 truncate font-medium text-[#1a73e8] hover:underline">
                  {ru.rentListing.name}
                </Link>
                <span className="rounded-full bg-[#f1f3f4] px-2.5 py-0.5 text-[12px] text-[#5f6368]">
                  {ru.rentListing.status.toLowerCase()}
                </span>
                <span className="rounded-full bg-[#f1f3f4] px-2.5 py-0.5 text-[12px] text-[#5f6368]">
                  {ru.rentListing.managerKind === 'AGENT' && ru.rentListing.managingAgent
                    ? `managed by ${ru.rentListing.managingAgent.displayName}`
                    : ru.rentListing.managerKind === 'OWNER'
                      ? 'owner-managed'
                      : 'developer-managed'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Unit media ── */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-medium text-[#202124]">Unit photos & videos</h2>
            <p className="text-[13px] text-[#5f6368]">
              This unit&rsquo;s own interiors and walkthroughs — distinct from
              the building&rsquo;s shared gallery.
            </p>
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden
            onChange={(e) => onUpload(e.target.files)} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="cursor-pointer rounded-full bg-[#1a73e8] px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50">
            {uploading ? 'Uploading…' : 'Add media'}
          </button>
        </div>
        {uploadError && <p className="mt-2 text-[13px] text-[#c5221f]">{uploadError}</p>}

        {unit.media.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-[#f8f9fa] p-5 text-center text-[13.5px] text-[#5f6368]">
            Nothing yet. Photos and videos of this specific unit help buyers
            and renters see exactly what they are getting.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {unit.media.map((m) => (
              <div key={m.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#e8eaed]">
                {m.type === 'VIDEO' ? (
                  <video src={m.url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <Image src={m.url} alt={m.title ?? ''} fill className="object-cover" sizes="20vw" />
                )}
                {m.type === 'VIDEO' && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
                    video
                  </span>
                )}
                <button
                  onClick={() => removeMedia.mutate(m.id)}
                  aria-label="Remove"
                  className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100"
                >
                  <MaterialIcon name="close" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
