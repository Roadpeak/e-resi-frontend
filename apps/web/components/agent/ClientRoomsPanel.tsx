'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { clientRoomsApi, type ClientRoom } from '../../lib/api/client-rooms';
import { propertiesApi } from '../../lib/api/properties';

/**
 * Client rooms — where the diaspora sales motion lives.
 *
 * The panel is built around the sequence an agent actually performs: pick a
 * handful of live developments, write one note, copy one link into the
 * WhatsApp thread. Afterwards the room's numbers answer the question that
 * matters before the follow-up call: did they open it, and which property
 * did they keep going back to.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const field =
  'h-10 w-full rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]';

function roomUrl(token: string): string {
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${token}`;
}

function ShareRow({ room }: { room: ClientRoom }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = roomUrl(room.token);
    try {
      if (navigator.share) { await navigator.share({ url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* dismissed share sheet */ }
  }
  return (
    <button
      onClick={share}
      className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc]"
      title="Share the room with your client"
    >
      <MaterialIcon name={copied ? 'check' : 'share'} size={15} />
      {copied ? 'Copied' : 'Share'}
    </button>
  );
}

/** Pick live listings for a room, strongest first. */
function PropertyPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState('');
  const { data } = useQuery({
    queryKey: ['room-property-pick', q],
    queryFn: () => propertiesApi.list({ limit: 20, search: q || undefined }),
  });
  const options = data?.data ?? [];

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search live developments…" className={field} />
      <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
        {options.map((p) => {
          const on = selected.includes(p.id);
          return (
            <li key={p.id}>
              <button
                onClick={() => onChange(on ? selected.filter((i) => i !== p.id) : [...selected, p.id])}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13.5px] transition-colors',
                  on ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1967d2]' : 'border-[#dadce0] text-[#202124] hover:bg-[#f8f9fa]',
                )}
              >
                <MaterialIcon name={on ? 'check_circle' : 'radio_button_unchecked'} size={16} />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="text-[12px] text-[#80868b]">{p.address?.city ?? ''}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {selected.length > 0 && (
        <p className="mt-1.5 text-[12.5px] text-[#5f6368]">
          {selected.length} selected — order of selection is the order your client sees.
        </p>
      )}
    </div>
  );
}

function NewRoomForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ title: '', clientName: '', note: '' });
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: () =>
      clientRoomsApi.create({
        title: form.title.trim(),
        clientName: form.clientName.trim() || undefined,
        note: form.note.trim() || undefined,
        propertyIds,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client-rooms'] }); onDone(); },
  });

  return (
    <div className={cn(card, 'p-5')}>
      <h2 className="text-[16px] font-medium text-[#202124]">New room</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder='Room name, e.g. "Homes for James"' maxLength={120} className={field} />
        <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          placeholder="Client's first name (they see this)" maxLength={120} className={field} />
      </div>
      <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
        placeholder="Your note to them — shown at the top of the room" maxLength={1000} className={cn(field, 'mt-2')} />
      <div className="mt-3">
        <PropertyPicker selected={propertyIds} onChange={setPropertyIds} />
      </div>
      {create.isError && <p className="mt-2 text-[13px] text-[#c5221f]">{(create.error as Error).message}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending || !form.title.trim() || propertyIds.length === 0}
          className="h-10 cursor-pointer rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40"
        >
          {create.isPending ? 'Creating…' : 'Create room'}
        </button>
        <button onClick={onDone} className="h-10 cursor-pointer rounded-xl border border-[#dadce0] px-4 text-[14px] text-[#202124] hover:bg-[#f8f9fa]">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ClientRoomsPanel() {
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { data: rooms, isLoading } = useQuery({ queryKey: ['client-rooms'], queryFn: clientRoomsApi.list });

  const detail = useQuery({
    queryKey: ['client-room', openId],
    queryFn: () => clientRoomsApi.getOne(openId as string),
    enabled: !!openId,
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      clientRoomsApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-rooms'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => clientRoomsApi.remove(id),
    onSuccess: () => { setOpenId(null); qc.invalidateQueries({ queryKey: ['client-rooms'] }); },
  });

  const open = useMemo(() => rooms?.find((r) => r.id === openId) ?? null, [rooms, openId]);

  return (
    <div className="space-y-4">
      {!creating && (
        <div className="flex justify-end">
          <button onClick={() => setCreating(true)}
            className="cursor-pointer rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc]">
            New room
          </button>
        </div>
      )}
      {creating && <NewRoomForm onDone={() => setCreating(false)} />}

      {isLoading ? (
        <div className={cn(card, 'p-8 text-center text-[14px] text-[#5f6368]')}>Loading…</div>
      ) : !rooms?.length ? (
        <div className={cn(card, 'p-8 text-center')}>
          <MaterialIcon name="collections_bookmark" size={32} className="text-[#dadce0]" />
          <p className="mt-2 text-[15px] text-[#202124]">No rooms yet</p>
          <p className="mx-auto mt-1 max-w-md text-[13.5px] text-[#5f6368]">
            A room is a private shortlist for one client — a few developments
            with your note, sent as one link. They browse full tours with your
            name and WhatsApp on every page, and you see which property they
            kept coming back to.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rooms.map((r) => (
            <li key={r.id} className={cn(card, 'p-4', !r.isActive && 'opacity-60')}>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setOpenId(openId === r.id ? null : r.id)} className="min-w-0 flex-1 cursor-pointer text-left">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium text-[#202124]">{r.title}</span>
                    {!r.isActive && (
                      <span className="rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[11.5px] text-[#5f6368]">Off</span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-[#5f6368]">
                    {r.items.length} propert{r.items.length === 1 ? 'y' : 'ies'}
                    {' · '}{r._count?.views ?? 0} view{(r._count?.views ?? 0) === 1 ? '' : 's'}
                    {r.lastViewedAt
                      ? ` · last opened ${new Date(r.lastViewedAt).toLocaleDateString()}`
                      : ' · not opened yet'}
                  </span>
                </button>
                <ShareRow room={r} />
                <button
                  onClick={() => toggle.mutate({ id: r.id, isActive: !r.isActive })}
                  title={r.isActive ? 'Switch off — the link stops working' : 'Switch back on'}
                  className="cursor-pointer rounded-full border border-[#dadce0] p-2 text-[#5f6368] hover:bg-[#f1f3f4]"
                >
                  <MaterialIcon name={r.isActive ? 'toggle_on' : 'toggle_off'} size={18} />
                </button>
                <button
                  onClick={() => remove.mutate(r.id)}
                  title="Delete room"
                  className="cursor-pointer rounded-full border border-[#dadce0] p-2 text-[#5f6368] hover:bg-[#fce8e6] hover:text-[#c5221f]"
                >
                  <MaterialIcon name="delete" size={18} />
                </button>
              </div>

              {openId === r.id && open && (
                <div className="mt-3 rounded-2xl bg-[#f8f9fa] p-3.5">
                  <p className="text-[12.5px] font-medium uppercase tracking-wide text-[#5f6368]">
                    Engagement — opens: {detail.data?.opens ?? '…'}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {r.items.map((it) => {
                      const clicks = detail.data?.perProperty?.[it.propertyId] ?? 0;
                      return (
                        <li key={it.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[13.5px]">
                          <span className="truncate text-[#202124]">{it.property.name}</span>
                          <span className={cn('shrink-0 font-medium', clicks > 0 ? 'text-[#137333]' : 'text-[#80868b]')}>
                            {clicks} click{clicks === 1 ? '' : 's'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {(detail.data?.opens ?? 0) > 0 && r.items.length > 1 && (
                    <p className="mt-2 text-[12.5px] text-[#5f6368]">
                      The property with the most clicks is the one to lead your next call with.
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
