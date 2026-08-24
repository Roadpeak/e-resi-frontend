'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, X, Ruler } from 'lucide-react';
import { floorPlansApi } from '../../lib/api/floor-plans';
import { uploadFile, type UploadProgress } from '../../lib/api/media';
import { ApiError } from '../../lib/api/client';
import { UploadProgressBar } from './UploadProgressBar';
import { cn } from '../../lib/utils';

/**
 * Floor plans for a development.
 *
 * A plan belongs to the property rather than to a unit: a tower has four
 * layouts and two hundred units, and every 2-bed shares one drawing. So plans
 * are published once here, and units point at them — the unit page falls back
 * to matching on bedroom count, which is why naming the bedrooms below is
 * worth doing even though the API treats it as optional.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';

const EMPTY = { name: '', bedrooms: '', bathrooms: '', sqm: '' };

export function FloorPlansManager({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [imageUrl, setImageUrl] = useState('');
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['floor-plans', slug],
    queryFn: () => floorPlansApi.list(slug),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['floor-plans', slug] });
    // The property page and its templates render these too.
    queryClient.invalidateQueries({ queryKey: ['dash-property', slug] });
  };

  const onError = (e: unknown) =>
    setError(e instanceof ApiError || e instanceof Error ? e.message : 'Something went wrong.');

  const reset = () => {
    setForm(EMPTY);
    setImageUrl('');
    setAdding(false);
    setError('');
  };

  const create = useMutation({
    mutationFn: () =>
      floorPlansApi.create(slug, {
        name: form.name.trim(),
        imageUrl,
        // Blank means unknown, which the API stores as null — sending 0 would
        // publish "0 bedrooms" as though it were a studio.
        bedrooms: form.bedrooms === '' ? undefined : Number(form.bedrooms),
        bathrooms: form.bathrooms === '' ? undefined : Number(form.bathrooms),
        sqm: form.sqm === '' ? undefined : Number(form.sqm),
        order: plans.length,
      }),
    onSuccess: () => { reset(); refresh(); },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => floorPlansApi.remove(slug, id),
    onSuccess: () => { setError(''); refresh(); },
    onError,
  });

  /**
   * Upload the drawing, then hold its URL until the plan is saved.
   *
   * The API takes a URL rather than a file, so the image goes up first and the
   * record is created with everything filled in. A plan saved without its
   * measurements is the common mistake, and this keeps both halves in one act.
   */
  async function pickImage(file: File) {
    setError('');
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Floor plans upload as an image or a PDF.');
      return;
    }
    setBusy(true);
    setProgress({ loaded: 0, total: file.size, percent: 0 });
    abortRef.current = new AbortController();
    try {
      const uploaded = await uploadFile(file, 'properties', {
        onProgress: setProgress,
        signal: abortRef.current.signal,
      });
      setImageUrl(uploaded.url);
      // Name the plan after the file when nothing is typed yet — most exports
      // are already called "Type B 2 Bed", which is the name anyway.
      setForm((f) => f.name ? f : { ...f, name: file.name.replace(/\.[^.]+$/, '') });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed.';
      if (message !== 'Upload cancelled') setError(message);
    } finally {
      setBusy(false);
      setProgress(null);
      abortRef.current = null;
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = k === 'name' ? e.target.value : e.target.value.replace(/[^\d.]/g, '');
    setForm((f) => ({ ...f, [k]: digits }));
  };

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f3f4] px-6 py-5">
        <div>
          <h2 className="text-[18px] font-normal text-[#202124]">Floor plans</h2>
          <p className="mt-0.5 text-[13px] text-[#5f6368]">
            One drawing per layout. Units show the plan matching their bedroom count, and every
            plan appears on the property page.
          </p>
        </div>
        <button
          onClick={() => (adding ? reset() : setAdding(true))}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] cursor-pointer"
        >
          {adding ? <X size={14} /> : <Plus size={14} />} {adding ? 'Cancel' : 'Add floor plan'}
        </button>
      </div>

      {adding && (
        <div className="border-b border-[#f1f3f4] bg-[#f8f9fa] px-6 py-5">
          <div className="flex flex-wrap items-start gap-5">
            {/* Drawing */}
            <div className="shrink-0">
              <div className="relative h-[120px] w-[160px] overflow-hidden rounded-2xl border border-[#dadce0] bg-white">
                {imageUrl ? (
                  <Image src={imageUrl} alt="" fill className="object-contain p-2" sizes="160px" unoptimized />
                ) : (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[#9aa0a6]">
                    <Ruler size={20} />
                    <span className="text-[11px]">No drawing yet</span>
                  </span>
                )}
                {busy && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 size={20} className="animate-spin text-[#1a73e8]" />
                  </span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f); }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="mt-2 w-[160px] rounded-xl border border-[#dadce0] bg-white py-2 text-[13px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] disabled:opacity-40 cursor-pointer"
              >
                {imageUrl ? 'Replace drawing' : 'Upload drawing'}
              </button>
            </div>

            {/* Details */}
            <div className="min-w-[260px] flex-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Name</label>
                  <input
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Type B — 2 Bedroom"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Bedrooms</label>
                  <input value={form.bedrooms} onChange={set('bedrooms')} inputMode="numeric" placeholder="2" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Bathrooms</label>
                  <input value={form.bathrooms} onChange={set('bathrooms')} inputMode="numeric" placeholder="2" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Size (m²)</label>
                  <input value={form.sqm} onChange={set('sqm')} inputMode="numeric" placeholder="95" className={inputCls} />
                </div>
              </div>

              <p className="mt-2 text-[12px] text-[#80868b]">
                Bedrooms is what links this plan to its units — a unit with no plan of its own shows
                the one matching its bedroom count.
              </p>

              <button
                onClick={() => create.mutate()}
                disabled={create.isPending || busy || !imageUrl || !form.name.trim()}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40 cursor-pointer"
              >
                {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add floor plan
              </button>
              {!imageUrl && (
                <span className="ml-3 text-[12.5px] text-[#80868b]">Upload a drawing first.</span>
              )}
            </div>
          </div>

          {progress && (
            <div className="mt-4">
              <UploadProgressBar
                progress={progress}
                label="Uploading drawing"
                onCancel={() => abortRef.current?.abort()}
              />
            </div>
          )}
        </div>
      )}

      {error && <p className="mx-6 mt-4 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

      {isLoading ? (
        <div className="flex h-28 items-center justify-center">
          <Loader2 size={22} className="animate-spin text-[#80868b]" />
        </div>
      ) : plans.length === 0 && !adding ? (
        <div className="px-6 py-10 text-center">
          <Ruler size={22} className="mx-auto text-[#9aa0a6]" />
          <p className="mt-2 text-[15px] text-[#5f6368]">No floor plans yet.</p>
          <p className="text-[13px] text-[#80868b]">
            Buyers ask for these first — one drawing per layout is usually enough.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="overflow-hidden rounded-2xl border border-[#dadce0]">
              <div className="relative h-40 bg-[#f8f9fa]">
                <Image src={plan.imageUrl} alt={plan.name} fill className="object-contain p-3" sizes="320px" unoptimized />
              </div>
              <div className="flex items-start justify-between gap-2 border-t border-[#f1f3f4] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[#202124]">{plan.name}</p>
                  <p className="mt-0.5 text-[12.5px] text-[#5f6368]">
                    {[
                      plan.bedrooms == null
                        ? null
                        : plan.bedrooms === 0 ? 'Studio' : `${plan.bedrooms} bed`,
                      plan.bathrooms == null ? null : `${plan.bathrooms} bath`,
                      plan.sqm == null ? null : `${plan.sqm} m²`,
                    ].filter(Boolean).join(' · ') || 'No measurements'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Remove “${plan.name}”? Units using it fall back to matching by bedroom count.`)) {
                      remove.mutate(plan.id);
                    }
                  }}
                  aria-label={`Remove ${plan.name}`}
                  className={cn(
                    'shrink-0 rounded-lg p-1.5 text-[#80868b] transition-colors hover:bg-[#fce8e6] hover:text-[#c5221f] cursor-pointer',
                    remove.isPending && 'opacity-40',
                  )}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
