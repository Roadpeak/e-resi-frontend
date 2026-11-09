'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Check, ChevronDown, Film, ImagePlus, Layers, Loader2, Minus, Pencil, Plus, Trash2, View, X,
} from 'lucide-react';
import { cn, formatPrice } from '../../lib/utils';
import { apiClient, ApiError } from '../../lib/api/client';
import { uploadFile } from '../../lib/api/media';
import {
  unitTypesApi, leftLabel, typeSize,
  type InventoryState, type ManagedUnitType, type TourScene, type UnitTypeInput,
} from '../../lib/api/unit-types';

/**
 * Unit types — describe a layout once, then say how many are left.
 *
 * A tower with 300 apartments usually sells five or six layouts. Typing every
 * apartment in is busywork and the buyer never asked for it: they shop for
 * "a 3 bedroom, 200 sqft" and want to know how many remain. Each type carries
 * its own photos and video, picks which of the development's tours show on
 * its page, and keeps an available / reserved / sold count the sales team
 * updates in one tap.
 */

interface PropertyUnit { id: string; name: string; status: string; floor?: number | null; bedrooms?: number }

interface ToursPayload {
  cinematicScenes?: TourScene[];
  tourSections3D?: { id: string; label: string; scenes: TourScene[] }[];
  tourScenesVR?: TourScene[];
}

const input =
  'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[14.5px] text-[#202124] placeholder-[#9aa0a6] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const label = 'mb-1 block text-[12.5px] font-medium text-[#5f6368]';

const STATE_LABEL: Record<InventoryState, string> = { available: 'Available', reserved: 'Reserved', sold: 'Sold' };
const STATE_COLOR: Record<InventoryState, string> = { available: '#188038', reserved: '#e37400', sold: '#5f6368' };

type Draft = {
  name: string; description: string; bedrooms: string; bathrooms: string; sqm: string; sqft: string;
  priceFrom: string; priceTo: string; features: string; floorPlanUrl: string; coverImageUrl: string;
  availableCount: string; reservedCount: string; soldCount: string;
  cinematicSceneIds: string[]; tourSection3DIds: string[]; vrSceneIds: string[]; unitIds: string[];
};

const EMPTY: Draft = {
  name: '', description: '', bedrooms: '2', bathrooms: '2', sqm: '', sqft: '', priceFrom: '', priceTo: '',
  features: '', floorPlanUrl: '', coverImageUrl: '', availableCount: '', reservedCount: '0', soldCount: '0',
  cinematicSceneIds: [], tourSection3DIds: [], vrSceneIds: [], unitIds: [],
};

function toDraft(t: ManagedUnitType): Draft {
  const s = (v: number | null | undefined) => (v == null ? '' : String(v));
  return {
    name: t.name, description: t.description ?? '', bedrooms: s(t.bedrooms), bathrooms: s(t.bathrooms),
    sqm: s(t.sqm), sqft: s(t.sqft), priceFrom: s(t.priceFrom), priceTo: s(t.priceTo),
    features: t.features.join(', '), floorPlanUrl: t.floorPlanUrl ?? '', coverImageUrl: t.coverImageUrl ?? '',
    availableCount: s(t.availableCount), reservedCount: s(t.reservedCount), soldCount: s(t.soldCount),
    cinematicSceneIds: t.cinematicSceneIds, tourSection3DIds: t.tourSection3DIds, vrSceneIds: t.vrSceneIds,
    unitIds: t.units.map((u) => u.id),
  };
}

function toInput(d: Draft): UnitTypeInput {
  const n = (v: string) => (v.trim() === '' ? undefined : Number(v));
  return {
    name: d.name.trim(),
    description: d.description.trim(),
    bedrooms: n(d.bedrooms), bathrooms: n(d.bathrooms), sqm: n(d.sqm), sqft: n(d.sqft),
    priceFrom: n(d.priceFrom), priceTo: n(d.priceTo),
    features: d.features.split(',').map((f) => f.trim()).filter(Boolean),
    floorPlanUrl: d.floorPlanUrl, coverImageUrl: d.coverImageUrl,
    availableCount: n(d.availableCount) ?? 0, reservedCount: n(d.reservedCount) ?? 0, soldCount: n(d.soldCount) ?? 0,
    cinematicSceneIds: d.cinematicSceneIds, tourSection3DIds: d.tourSection3DIds, vrSceneIds: d.vrSceneIds,
    unitIds: d.unitIds,
  };
}

export function UnitTypesManager({ slug, currency, units }: { slug: string; currency: string; units: PropertyUnit[] }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['unit-types', slug],
    queryFn: () => unitTypesApi.manage(slug),
  });
  const { data: tours } = useQuery({
    queryKey: ['unit-type-tours', slug],
    queryFn: () => apiClient.get<ToursPayload>(`/properties/${slug}`),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['unit-types', slug] });
    qc.invalidateQueries({ queryKey: ['dash-property', slug] });
  };

  const totals = types.reduce(
    (a, t) => ({ total: a.total + t.counts.total, available: a.available + t.counts.available, reserved: a.reserved + t.counts.reserved, sold: a.sold + t.counts.sold }),
    { total: 0, available: 0, reserved: 0, sold: 0 },
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f3f4] px-6 py-4">
        <div>
          <h3 className="text-[18px] font-normal text-[#202124]">Unit types ({types.length})</h3>
          <p className="text-sm text-[#5f6368]">
            Describe each layout once, then say how many are left. No need to add identical units one by one.
          </p>
        </div>
        <button
          onClick={() => setEditing(editing === 'new' ? null : 'new')}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc]"
        >
          <Plus size={15} /> Add a unit type
        </button>
      </div>

      {types.length > 0 && (
        <div className="grid grid-cols-2 gap-px border-b border-[#f1f3f4] bg-[#f1f3f4] sm:grid-cols-4">
          {[
            ['Total units', totals.total, '#202124'],
            ['Available', totals.available, STATE_COLOR.available],
            ['Reserved', totals.reserved, STATE_COLOR.reserved],
            ['Sold', totals.sold, STATE_COLOR.sold],
          ].map(([l, v, c]) => (
            <div key={l as string} className="bg-white px-6 py-3">
              <p className="text-[12.5px] text-[#5f6368]">{l}</p>
              <p className="text-[22px] font-normal" style={{ color: c as string }}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {editing === 'new' && (
        <div className="border-b border-[#f1f3f4] bg-[#f8f9fa] px-6 py-5">
          <TypeForm
            slug={slug} currency={currency} units={units} tours={tours} initial={EMPTY}
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); refresh(); }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex h-28 items-center justify-center"><Loader2 size={20} className="animate-spin text-[#80868b]" /></div>
      ) : types.length === 0 && editing !== 'new' ? (
        <div className="px-6 py-10 text-center">
          <Layers size={22} className="mx-auto text-[#80868b]" />
          <p className="mx-auto mt-2 max-w-md text-[14.5px] text-[#5f6368]">
            Add your layouts, e.g. &ldquo;1 Bedroom · 65 m²&rdquo; with 40 units, or &ldquo;3 Bedroom · 200 sqft&rdquo; with 20.
            Buyers see each type with how many are left, reserved and sold.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#f1f3f4]">
          {types.map((t) => (
            <TypeRow
              key={t.id} slug={slug} currency={currency} type={t} units={units} tours={tours}
              open={editing === t.id}
              onToggle={() => setEditing(editing === t.id ? null : t.id)}
              onChanged={refresh}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function InventoryBar({ c }: { c: ManagedUnitType['counts'] }) {
  if (!c.total) return <div className="h-1.5 rounded-full bg-[#f1f3f4]" />;
  return (
    <div className="flex h-1.5 overflow-hidden rounded-full bg-[#f1f3f4]">
      {(['available', 'reserved', 'sold'] as InventoryState[]).map((s) => (
        <span key={s} style={{ width: `${(c[s] / c.total) * 100}%`, background: STATE_COLOR[s] }} />
      ))}
    </div>
  );
}

function TypeRow({
  slug, currency, type: t, units, tours, open, onToggle, onChanged,
}: {
  slug: string; currency: string; type: ManagedUnitType; units: PropertyUnit[]; tours?: ToursPayload;
  open: boolean; onToggle: () => void; onChanged: () => void;
}) {
  const [error, setError] = useState('');
  const move = useMutation({
    mutationFn: ({ from, to }: { from: InventoryState; to: InventoryState }) => unitTypesApi.move(slug, t.id, from, to),
    onSuccess: onChanged,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not update.'),
  });
  const remove = useMutation({
    mutationFn: () => unitTypesApi.remove(slug, t.id),
    onSuccess: onChanged,
  });
  const cover = t.coverImageUrl || t.media.find((m) => m.type === 'PHOTO')?.url;
  const manual = t.counts.source === 'manual';
  const tourCount = t.cinematicSceneIds.length + t.tourSection3DIds.length + t.vrSceneIds.length;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const quick: { from: InventoryState; to: InventoryState; text: string }[] = [
    { from: 'available', to: 'reserved', text: 'Reserve one' },
    { from: 'available', to: 'sold', text: 'Sell one' },
    { from: 'reserved', to: 'sold', text: 'Reserved → sold' },
    { from: 'reserved', to: 'available', text: 'Release one' },
  ];

  return (
    <li>
      <div className="flex flex-wrap items-center gap-4 px-6 py-4">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f1f3f4]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[#9aa0a6]"><Layers size={18} /></div>
          )}
        </div>
        <div className="min-w-[200px] flex-1">
          <p className="text-[15.5px] font-medium text-[#202124]">{t.name}</p>
          <p className="text-[13px] text-[#5f6368]">
            {[
              t.bedrooms === 0 ? 'Studio' : `${t.bedrooms} bed`,
              `${t.bathrooms} bath`,
              typeSize(t),
              t.priceFrom ? (t.priceTo && t.priceTo !== t.priceFrom
                ? `${formatPrice(t.priceFrom, currency)} – ${formatPrice(t.priceTo, currency)}`
                : formatPrice(t.priceFrom, currency)) : null,
            ].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-[12.5px] text-[#80868b]">
            <span>{t.media.length} photo{t.media.length === 1 ? '' : 's'}/video{t.media.length === 1 ? '' : 's'}</span>
            <span>{tourCount} tour{tourCount === 1 ? '' : 's'} linked</span>
            {!manual && <span>{t.units.length} linked unit{t.units.length === 1 ? '' : 's'}</span>}
          </p>
        </div>
        <div className="w-full sm:w-64">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[14px] font-medium text-[#202124]">{leftLabel(t.counts)}</span>
            <span className="text-[12.5px] text-[#5f6368]">{t.counts.sold} sold · {t.counts.reserved} reserved</span>
          </div>
          <InventoryBar c={t.counts} />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="inline-flex items-center gap-1 rounded-full border border-[#dadce0] px-3 py-1.5 text-[13px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">
            <Pencil size={13} /> {open ? 'Close' : 'Edit'}
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button onClick={() => remove.mutate()} className="rounded-full bg-[#d93025] px-3 py-1.5 text-[13px] font-medium text-white">Delete</button>
              <button onClick={() => setConfirmDelete(false)} className="rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"><X size={15} /></button>
            </span>
          ) : (
            <button onClick={() => setConfirmDelete(true)} aria-label="Delete type" className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4]"><Trash2 size={15} /></button>
          )}
        </div>
      </div>

      {manual && t.counts.total > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-6 pb-4 sm:pl-[120px]">
          {quick.map((q) => (
            <button
              key={q.text}
              disabled={move.isPending || t.counts[q.from] === 0}
              onClick={() => { setError(''); move.mutate({ from: q.from, to: q.to }); }}
              className="rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[12.5px] font-medium text-[#3c4043] hover:bg-[#f8f9fa] disabled:opacity-40"
            >
              {q.text}
            </button>
          ))}
          {move.isPending && <Loader2 size={14} className="animate-spin text-[#80868b]" />}
          {error && <span className="text-[12.5px] text-[#c5221f]">{error}</span>}
        </div>
      )}

      {open && (
        <div className="border-t border-[#f1f3f4] bg-[#f8f9fa] px-6 py-5">
          <TypeForm
            slug={slug} currency={currency} units={units} tours={tours} initial={toDraft(t)} type={t}
            onCancel={onToggle}
            onSaved={() => { onToggle(); onChanged(); }}
            onMediaChanged={onChanged}
          />
        </div>
      )}
    </li>
  );
}

function Stepper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const n = Number(value) || 0;
  return (
    <div className="flex items-center rounded-xl border border-[#dadce0] bg-white">
      <button type="button" onClick={() => onChange(String(Math.max(0, n - 1)))} className="px-2.5 py-2.5 text-[#5f6368] hover:text-[#202124]"><Minus size={14} /></button>
      <input value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))} inputMode="numeric"
        className="w-full min-w-0 bg-transparent text-center text-[14.5px] focus:outline-none" />
      <button type="button" onClick={() => onChange(String(n + 1))} className="px-2.5 py-2.5 text-[#5f6368] hover:text-[#202124]"><Plus size={14} /></button>
    </div>
  );
}

function TourPicker({
  icon, title, items, selected, onChange,
}: {
  icon: React.ReactNode; title: string; items: { id: string; label: string; thumb?: string | null }[];
  selected: string[]; onChange: (ids: string[]) => void;
}) {
  if (!items.length) return null;
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#5f6368]">{icon} {title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => {
          const on = selected.includes(i.id);
          return (
            <button key={i.id} type="button" onClick={() => toggle(i.id)}
              className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors',
                on ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1967d2]' : 'border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f1f3f4]')}>
              {on && <Check size={12} strokeWidth={3} />} {i.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TypeForm({
  slug, currency, units, tours, initial, type, onCancel, onSaved, onMediaChanged,
}: {
  slug: string; currency: string; units: PropertyUnit[]; tours?: ToursPayload; initial: Draft;
  type?: ManagedUnitType; onCancel: () => void; onSaved: () => void; onMediaChanged?: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [error, setError] = useState('');
  const [showUnits, setShowUnits] = useState(initial.unitIds.length > 0);
  const [uploading, setUploading] = useState<'media' | 'plan' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const planRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setD((x) => ({ ...x, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: () => (type ? unitTypesApi.update(slug, type.id, toInput(d)) : unitTypesApi.create(slug, toInput(d))),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not save the unit type.'),
  });

  const removeMedia = useMutation({
    mutationFn: (mediaId: string) => unitTypesApi.removeMedia(slug, type!.id, mediaId),
    onSuccess: () => onMediaChanged?.(),
  });

  async function addMedia(files: FileList | null) {
    if (!files?.length || !type) return;
    setUploading('media');
    setError('');
    try {
      for (const file of Array.from(files)) {
        const up = await uploadFile(file, 'properties');
        await unitTypesApi.addMedia(slug, type.id, {
          type: file.type.startsWith('video') ? 'VIDEO' : 'PHOTO', url: up.url, sizeBytes: up.sizeBytes, mimeType: file.type,
        });
      }
      onMediaChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(null);
    }
  }

  async function addPlan(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading('plan');
    try {
      const up = await uploadFile(file, 'properties');
      setD((x) => ({ ...x, floorPlanUrl: up.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(null);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!d.name.trim()) return setError('Name the layout, e.g. "3 Bedroom · 200 sqft".');
    save.mutate();
  }

  const linked = d.unitIds.length > 0;
  const total = (Number(d.availableCount) || 0) + (Number(d.reservedCount) || 0) + (Number(d.soldCount) || 0);
  const cinematic = (tours?.cinematicScenes ?? []).map((s) => ({ id: s.id, label: s.label }));
  const sections3D = (tours?.tourSections3D ?? []).map((s) => ({ id: s.id, label: `${s.label} (${s.scenes.length})` }));
  const vr = (tours?.tourScenesVR ?? []).map((s) => ({ id: s.id, label: s.label }));

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label className={label}>Layout name</label>
          <input value={d.name} onChange={set('name')} placeholder="3 Bedroom · 200 sqft" className={input} />
        </div>
        <div>
          <label className={label}>Bedrooms</label>
          <input value={d.bedrooms} onChange={set('bedrooms')} inputMode="numeric" className={input} />
        </div>
        <div>
          <label className={label}>Bathrooms</label>
          <input value={d.bathrooms} onChange={set('bathrooms')} inputMode="numeric" className={input} />
        </div>
        <div>
          <label className={label}>Size (m²)</label>
          <input value={d.sqm} onChange={set('sqm')} inputMode="decimal" className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Size (sqft)</label>
          <input value={d.sqft} onChange={set('sqft')} inputMode="decimal" className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Price from ({currency})</label>
          <input value={d.priceFrom} onChange={set('priceFrom')} inputMode="numeric" className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Price to (optional)</label>
          <input value={d.priceTo} onChange={set('priceTo')} inputMode="numeric" className={input} />
        </div>
        <div className="sm:col-span-6">
          <label className={label}>Description</label>
          <textarea value={d.description} onChange={set('description')} rows={3}
            placeholder="Corner layout with a wraparound balcony, ensuite master and a DSQ."
            className={input} />
        </div>
        <div className="sm:col-span-6">
          <label className={label}>Features (comma separated)</label>
          <input value={d.features} onChange={set('features')} placeholder="Ensuite master, Balcony, Fitted kitchen, DSQ" className={input} />
        </div>
      </div>

      {/* ── Inventory ── */}
      <div className="rounded-2xl border border-[#dadce0] bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[14.5px] font-medium text-[#202124]">How many of this layout</p>
          <p className="text-[13px] text-[#5f6368]">
            {linked ? `Counted from ${d.unitIds.length} linked unit${d.unitIds.length === 1 ? '' : 's'}` : `${total} in total`}
          </p>
        </div>
        {linked ? (
          <p className="mt-2 text-[13px] text-[#5f6368]">
            Counts follow the linked units&rsquo; own status. Change a unit&rsquo;s status in the units list below, or unlink them to keep counts by hand.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(['availableCount', 'reservedCount', 'soldCount'] as const).map((k, i) => (
              <div key={k}>
                <label className={label} style={{ color: STATE_COLOR[(['available', 'reserved', 'sold'] as InventoryState[])[i]] }}>
                  {STATE_LABEL[(['available', 'reserved', 'sold'] as InventoryState[])[i]]}
                </label>
                <Stepper value={d[k]} onChange={(v) => setD((x) => ({ ...x, [k]: v }))} />
              </div>
            ))}
          </div>
        )}
        {units.length > 0 && (
          <div className="mt-3">
            <button type="button" onClick={() => setShowUnits((v) => !v)} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1a73e8]">
              <ChevronDown size={14} className={cn('transition-transform', showUnits && 'rotate-180')} />
              Link individual units (optional)
            </button>
            {showUnits && (
              <div className="mt-2 flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
                {units.map((u) => {
                  const on = d.unitIds.includes(u.id);
                  return (
                    <button key={u.id} type="button"
                      onClick={() => setD((x) => ({ ...x, unitIds: on ? x.unitIds.filter((i) => i !== u.id) : [...x.unitIds, u.id] }))}
                      className={cn('rounded-full border px-2.5 py-1 text-[12.5px]',
                        on ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1967d2]' : 'border-[#dadce0] bg-white text-[#3c4043]')}>
                      {u.name} <span className="text-[#80868b]">· {u.status.toLowerCase()}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Tours ── */}
      <div className="rounded-2xl border border-[#dadce0] bg-white p-4">
        <p className="text-[14.5px] font-medium text-[#202124]">Tours for this layout</p>
        <p className="mt-0.5 text-[13px] text-[#5f6368]">Pick which of the development&rsquo;s tours buyers see on this type&rsquo;s page.</p>
        {cinematic.length + sections3D.length + vr.length === 0 ? (
          <p className="mt-3 text-[13px] text-[#80868b]">No tours uploaded yet. Add cinematic, 3D or VR tours in Media, then link them here.</p>
        ) : (
          <div className="mt-3 space-y-3">
            <TourPicker icon={<Film size={13} />} title="Cinematic" items={cinematic} selected={d.cinematicSceneIds}
              onChange={(v) => setD((x) => ({ ...x, cinematicSceneIds: v }))} />
            <TourPicker icon={<Box size={13} />} title="3D tour sections" items={sections3D} selected={d.tourSection3DIds}
              onChange={(v) => setD((x) => ({ ...x, tourSection3DIds: v }))} />
            <TourPicker icon={<View size={13} />} title="VR / 360° scenes" items={vr} selected={d.vrSceneIds}
              onChange={(v) => setD((x) => ({ ...x, vrSceneIds: v }))} />
          </div>
        )}
      </div>

      {/* ── Media ── */}
      <div className="rounded-2xl border border-[#dadce0] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[14.5px] font-medium text-[#202124]">Photos, videos and floor plan</p>
            <p className="text-[13px] text-[#5f6368]">{type ? 'Click a photo to make it the cover.' : 'Save the type first, then add its photos and videos.'}</p>
          </div>
          <div className="flex gap-2">
            <input ref={planRef} type="file" accept="image/*" hidden onChange={(e) => addPlan(e.target.files)} />
            <button type="button" onClick={() => planRef.current?.click()} disabled={uploading !== null}
              className="rounded-full border border-[#dadce0] bg-white px-3 py-1.5 text-[13px] font-medium text-[#3c4043] hover:bg-[#f8f9fa] disabled:opacity-50">
              {uploading === 'plan' ? 'Uploading…' : d.floorPlanUrl ? 'Replace floor plan' : 'Floor plan'}
            </button>
            {type && (
              <>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => addMedia(e.target.files)} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading !== null}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1.5 text-[13px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa] disabled:opacity-50">
                  <ImagePlus size={14} /> {uploading === 'media' ? 'Uploading…' : 'Add photos / video'}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {d.floorPlanUrl && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#dadce0] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.floorPlanUrl} alt="Floor plan" className="h-full w-full object-contain p-1" />
              <span className="absolute left-1 top-1 rounded bg-white/90 px-1.5 text-[11px] text-[#3c4043]">Plan</span>
              <button type="button" onClick={() => setD((x) => ({ ...x, floorPlanUrl: '' }))}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-[#5f6368]"><X size={12} /></button>
            </div>
          )}
          {type?.media.map((m) => {
            const isCover = d.coverImageUrl === m.url;
            return (
              <div key={m.id} className={cn('group relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f1f3f4]', isCover && 'ring-2 ring-[#1a73e8]')}>
                {m.type === 'VIDEO' ? (
                  <video src={m.url} className="h-full w-full object-cover" muted />
                ) : (
                  <button type="button" onClick={() => setD((x) => ({ ...x, coverImageUrl: m.url }))} className="h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  </button>
                )}
                {isCover && <span className="absolute left-1 top-1 rounded bg-[#1a73e8] px-1.5 text-[11px] text-white">Cover</span>}
                {m.type === 'VIDEO' && <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[11px] text-white">Video</span>}
                <button type="button" onClick={() => removeMedia.mutate(m.id)} aria-label="Remove"
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-[#5f6368] opacity-0 group-hover:opacity-100"><X size={12} /></button>
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="rounded-xl bg-[#fce8e6] px-4 py-2.5 text-[13.5px] text-[#c5221f]">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-[14px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Cancel</button>
        <button type="submit" disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50">
          {save.isPending && <Loader2 size={14} className="animate-spin" />} {type ? 'Save changes' : 'Add unit type'}
        </button>
      </div>
    </form>
  );
}
