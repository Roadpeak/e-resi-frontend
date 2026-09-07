'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPinned, Pencil, Plus, Upload, X } from 'lucide-react';
import {
  neighborhoodsApi,
  type Neighborhood,
  type NeighborhoodInput,
} from '../../../../lib/api/neighborhoods';
import { uploadFile } from '../../../../lib/api/media';
import { cn } from '../../../../lib/utils';

const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[14px] text-[#202124] outline-none transition-colors focus:border-[#1a73e8]';
const labelCls = 'mb-1 block text-[13px] font-medium text-[#5f6368]';

const EMPTY: NeighborhoodInput = { name: '', city: 'Nairobi' };

/**
 * Curate the area guides shown on the browse rail and their public pages:
 * name, city, the story, coordinates for map + street view, and the photo
 * gallery. Property counts are live matches on the neighbourhood name, so
 * the name here should match what developers type on their listings.
 */
export default function AdminNeighbourhoods() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => neighborhoodsApi.list(),
  });

  const [editing, setEditing] = useState<Neighborhood | null>(null);
  const [creating, setCreating] = useState(false);
  const rows = data ?? [];

  const refresh = () => qc.invalidateQueries({ queryKey: ['neighborhoods'] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Neighbourhoods</h1>
          <p className="text-[14px] text-[#5f6368]">
            Area guides for the marketplace. The name must match what listings use —
            that match is what powers the live property counts.
          </p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null); }}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]"
        >
          <Plus size={15} /> New neighbourhood
        </button>
      </div>

      {(creating || editing) && (
        <NeighbourhoodForm
          initial={editing ?? undefined}
          onDone={() => { setCreating(false); setEditing(null); refresh(); }}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={22} className="animate-spin text-[#1a73e8]" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white px-6 py-16 text-center">
          <MapPinned size={28} className="mx-auto mb-3 text-[#dadce0]" />
          <p className="text-[15px] font-medium text-[#202124]">No neighbourhoods yet</p>
          <p className="mt-1 text-[13px] text-[#5f6368]">Create the first area guide above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((n) => (
            <div key={n.id} className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
              <div className="relative h-36 bg-[#f1f3f4]">
                {n.heroImageUrl && (
                  <Image src={n.heroImageUrl} alt={n.name} fill className="object-cover" sizes="400px" />
                )}
                <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-sm">
                  {n.propertyCount} listed
                </span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-[#202124]">{n.name}</p>
                  <p className="text-[13px] text-[#5f6368]">
                    {n.city} · {n.photos.length + (n.heroImageUrl ? 1 : 0)} photo{n.photos.length + (n.heroImageUrl ? 1 : 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <Link
                  href={`/neighbourhoods/${n.slug}`}
                  target="_blank"
                  className="text-[13px] font-medium text-[#1a73e8] hover:underline"
                >
                  View
                </Link>
                <button
                  onClick={() => { setEditing(n); setCreating(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  aria-label={`Edit ${n.name}`}
                  className="cursor-pointer rounded-full p-2 text-[#5f6368] transition-colors hover:bg-[#f1f3f4]"
                >
                  <Pencil size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NeighbourhoodForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: Neighborhood;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<NeighborhoodInput>(
    initial
      ? {
          name: initial.name,
          city: initial.city,
          description: initial.description ?? undefined,
          heroImageUrl: initial.heroImageUrl ?? undefined,
          photos: initial.photos,
          latitude: initial.latitude ?? undefined,
          longitude: initial.longitude ?? undefined,
        }
      : EMPTY,
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heroRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: () =>
      initial
        ? neighborhoodsApi.update(initial.id, form)
        : neighborhoodsApi.create(form),
    onSuccess: onDone,
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: () => neighborhoodsApi.remove(initial!.id),
    onSuccess: onDone,
    onError: (e: Error) => setError(e.message),
  });

  async function upload(files: FileList, asHero: boolean) {
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await uploadFile(file, 'properties');
        urls.push(url);
      }
      if (asHero) setForm((f) => ({ ...f, heroImageUrl: urls[0] }));
      else setForm((f) => ({ ...f, photos: [...(f.photos ?? []), ...urls] }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const set = (k: keyof NeighborhoodInput, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <h2 className="text-[18px] font-medium text-[#202124]">
        {initial ? `Edit ${initial.name}` : 'New neighbourhood'}
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Name</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Westlands" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>City</label>
          <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Nairobi" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>About the area</label>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || undefined)}
            rows={4}
            placeholder="What should a buyer know about living here?"
            className={cn(inputCls, 'resize-y')}
          />
        </div>
        <div>
          <label className={labelCls}>Latitude</label>
          <input
            value={form.latitude ?? ''}
            onChange={(e) => set('latitude', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="-1.2673" className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Longitude</label>
          <input
            value={form.longitude ?? ''}
            onChange={(e) => set('longitude', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="36.8111" className={inputCls}
          />
        </div>
      </div>

      {/* Photos */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => heroRef.current?.click()}
          disabled={uploading}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[13.5px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] disabled:opacity-60"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {form.heroImageUrl ? 'Replace cover photo' : 'Upload cover photo'}
        </button>
        <button
          onClick={() => photosRef.current?.click()}
          disabled={uploading}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[13.5px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] disabled:opacity-60"
        >
          <Upload size={14} /> Add gallery photos
        </button>
        <input ref={heroRef} type="file" hidden accept="image/*"
          onChange={(e) => { if (e.target.files?.length) void upload(e.target.files, true); e.target.value = ''; }} />
        <input ref={photosRef} type="file" hidden accept="image/*" multiple
          onChange={(e) => { if (e.target.files?.length) void upload(e.target.files, false); e.target.value = ''; }} />
      </div>

      {(form.heroImageUrl || (form.photos ?? []).length > 0) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {form.heroImageUrl && (
            <div className="relative h-24 w-36 overflow-hidden rounded-xl border-2 border-[#1a73e8]">
              <Image src={form.heroImageUrl} alt="Cover" fill className="object-cover" sizes="144px" />
              <span className="absolute bottom-1 left-1 rounded bg-[#1a73e8] px-1.5 py-0.5 text-[10px] font-bold text-white">COVER</span>
            </div>
          )}
          {(form.photos ?? []).map((url) => (
            <div key={url} className="group relative h-24 w-36 overflow-hidden rounded-xl border border-[#dadce0]">
              <Image src={url} alt="" fill className="object-cover" sizes="144px" />
              <button
                onClick={() => set('photos', (form.photos ?? []).filter((u) => u !== url))}
                aria-label="Remove photo"
                className="absolute right-1 top-1 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-[#d93025]">{error}</p>}

      <div className="mt-5 flex items-center gap-2 border-t border-[#f1f3f4] pt-4">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !form.name.trim() || !form.city.trim()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60"
        >
          {save.isPending && <Loader2 size={14} className="animate-spin" />}
          {initial ? 'Save changes' : 'Create neighbourhood'}
        </button>
        <button onClick={onCancel} className="cursor-pointer rounded-full px-5 py-2.5 text-[14px] font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4]">
          Cancel
        </button>
        {initial && (
          <button
            onClick={() => { if (confirm(`Remove ${initial.name}? Its public page disappears immediately.`)) remove.mutate(); }}
            disabled={remove.isPending}
            className="ml-auto cursor-pointer text-[13px] font-medium text-[#d93025] transition-colors hover:underline disabled:opacity-50"
          >
            Delete neighbourhood
          </button>
        )}
      </div>
    </div>
  );
}
