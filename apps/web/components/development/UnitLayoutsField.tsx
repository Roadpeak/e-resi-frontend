'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Minus, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { uploadFile } from '../../lib/api/media';
import type { UnitLayoutDraft } from '../../lib/stores/development.store';

/**
 * Unit types, entered while the development is created.
 *
 * Instead of a count plus a list of tags, the developer writes each layout
 * once — "3 Bedroom · 200 sqft, KES 21M, 20 units: 5 left, 5 reserved,
 * 10 sold" — with a few photos. Each row becomes a unit type on submit, so
 * the development goes live with its typology and stock already shown.
 * The quick-add chips are the layouts this development type usually has.
 */

const input =
  'w-full rounded-xl border border-[#dadce0] bg-white px-3 py-2 text-[14.5px] text-[#202124] placeholder-[#9aa0a6] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const lbl = 'mb-1 block text-[12px] font-medium text-[#5f6368]';

const num = (v: string) => Number(v.replace(/[^\d.]/g, '')) || 0;

function bedroomsFrom(name: string): string {
  if (/studio|bedsitter/i.test(name)) return '0';
  const m = name.match(/(\d+)/);
  return m ? m[1] : '';
}

export function layoutTotal(l: UnitLayoutDraft): number {
  return num(l.available) + num(l.reserved) + num(l.sold);
}

function blank(name = ''): UnitLayoutDraft {
  const beds = bedroomsFrom(name);
  return {
    key: Math.random().toString(36).slice(2),
    name, bedrooms: beds, bathrooms: beds && beds !== '0' ? beds : '1', sqm: '', sqft: '',
    priceFrom: '', priceTo: '', available: '', reserved: '0', sold: '0', photos: [],
  };
}

function Stepper({ value, onChange, color }: { value: string; onChange: (v: string) => void; color: string }) {
  const n = num(value);
  return (
    <div className="flex items-center rounded-xl border border-[#dadce0] bg-white" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
      <button type="button" onClick={() => onChange(String(Math.max(0, n - 1)))} className="px-2 py-2 text-[#5f6368] hover:text-[#202124]" aria-label="Decrease"><Minus size={13} /></button>
      <input value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="0"
        className="w-full min-w-0 bg-transparent text-center text-[14.5px] focus:outline-none" />
      <button type="button" onClick={() => onChange(String(n + 1))} className="px-2 py-2 text-[#5f6368] hover:text-[#202124]" aria-label="Increase"><Plus size={13} /></button>
    </div>
  );
}

export function UnitLayoutsField({
  layouts, onChange, presets, currency, plots = false,
}: {
  layouts: UnitLayoutDraft[];
  onChange: (next: UnitLayoutDraft[]) => void;
  presets: string[];
  currency: string;
  /** Land: sizes and plots rather than bedrooms. */
  plots?: boolean;
}) {
  const patch = (key: string, p: Partial<UnitLayoutDraft>) =>
    onChange(layouts.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const total = layouts.reduce((n, l) => n + layoutTotal(l), 0);
  const left = layouts.reduce((n, l) => n + num(l.available), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-[#5f6368]">Quick add:</span>
        {presets.map((p) => (
          <button key={p} type="button" onClick={() => onChange([...layouts, blank(p)])}
            className="inline-flex items-center gap-1 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[13px] text-[#3c4043] hover:bg-[#f1f3f4]">
            <Plus size={12} /> {p}
          </button>
        ))}
        <button type="button" onClick={() => onChange([...layouts, blank()])}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#1a73e8] px-3 py-1 text-[13px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe]">
          <Plus size={12} /> Custom {plots ? 'plot size' : 'layout'}
        </button>
      </div>

      {layouts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#dadce0] px-4 py-5 text-center text-[14px] text-[#5f6368]">
          Add each {plots ? 'plot size' : 'layout'} once with how many there are. No need to add identical units one by one.
          {!plots && ' Two sizes of 3 bedroom? Add them as two layouts.'}
        </p>
      ) : (
        <>
          {layouts.map((l, i) => (
            <LayoutRow key={l.key} index={i} layout={l} currency={currency} plots={plots}
              onPatch={(p) => patch(l.key, p)} onRemove={() => onChange(layouts.filter((x) => x.key !== l.key))} />
          ))}
          <p className="text-right text-[13.5px] text-[#5f6368]">
            {layouts.length} {plots ? 'plot size' : 'layout'}{layouts.length === 1 ? '' : 's'} · <span className="font-medium text-[#202124]">{total} units</span> · {left} available
          </p>
        </>
      )}
    </div>
  );
}

function LayoutRow({
  index, layout: l, currency, plots, onPatch, onRemove,
}: {
  index: number; layout: UnitLayoutDraft; currency: string; plots: boolean;
  onPatch: (p: Partial<UnitLayoutDraft>) => void; onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof UnitLayoutDraft) => (e: React.ChangeEvent<HTMLInputElement>) => onPatch({ [k]: e.target.value });

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setErr('');
    try {
      const added = [];
      for (const f of Array.from(files).slice(0, 8)) {
        const up = await uploadFile(f, 'properties');
        added.push({ name: f.name, url: up.url });
      }
      onPatch({ photos: [...l.photos, ...added] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#dadce0] bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-6 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[13px] font-medium text-[#1967d2]">{index + 1}</span>
        <div className="grid flex-1 gap-3 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className={lbl}>{plots ? 'Plot size name' : 'Layout name'}</label>
            <input value={l.name} onChange={(e) => onPatch({ name: e.target.value, ...(l.bedrooms ? {} : { bedrooms: bedroomsFrom(e.target.value) }) })}
              placeholder={plots ? '50 × 100 ft' : '3 Bedroom · 200 sqft'} className={input} />
          </div>
          {!plots && (
            <>
              <div>
                <label className={lbl}>Beds</label>
                <input value={l.bedrooms} onChange={set('bedrooms')} inputMode="numeric" placeholder="3" className={input} />
              </div>
              <div>
                <label className={lbl}>Baths</label>
                <input value={l.bathrooms} onChange={set('bathrooms')} inputMode="numeric" placeholder="2" className={input} />
              </div>
            </>
          )}
          <div className={plots ? 'sm:col-span-3' : ''}>
            <label className={lbl}>Size (m²)</label>
            <input value={l.sqm} onChange={set('sqm')} inputMode="decimal" placeholder="145" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Size (sqft)</label>
            <input value={l.sqft} onChange={set('sqft')} inputMode="decimal" placeholder="1,560" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Price from ({currency})</label>
            <input value={l.priceFrom} onChange={set('priceFrom')} inputMode="numeric" placeholder="21,000,000" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Price to (optional)</label>
            <input value={l.priceTo} onChange={set('priceTo')} inputMode="numeric" placeholder="23,500,000" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Available</label>
            <Stepper value={l.available} onChange={(v) => onPatch({ available: v })} color="#188038" />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Reserved</label>
            <Stepper value={l.reserved} onChange={(v) => onPatch({ reserved: v })} color="#e37400" />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Sold</label>
            <Stepper value={l.sold} onChange={(v) => onPatch({ sold: v })} color="#9aa0a6" />
          </div>
          <div className="sm:col-span-6">
            <div className="flex flex-wrap items-center gap-2">
              {l.photos.map((ph) => (
                <span key={ph.url} className="group relative h-14 w-20 overflow-hidden rounded-lg bg-[#f1f3f4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => onPatch({ photos: l.photos.filter((x) => x.url !== ph.url) })}
                    aria-label="Remove photo" className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5 text-[#5f6368]"><X size={11} /></button>
                </span>
              ))}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className={cn('inline-flex h-14 items-center gap-1.5 rounded-lg border border-dashed border-[#dadce0] px-3 text-[13px] text-[#5f6368] hover:bg-[#f8f9fa]', uploading && 'opacity-60')}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                {uploading ? 'Uploading…' : 'Photos of this layout'}
              </button>
              <span className="ml-auto text-[13px] text-[#5f6368]">{layoutTotal(l)} unit{layoutTotal(l) === 1 ? '' : 's'}</span>
            </div>
            {err && <p className="mt-1 text-[12.5px] text-[#c5221f]">{err}</p>}
          </div>
        </div>
        <button type="button" onClick={onRemove} aria-label="Remove layout" className="mt-6 rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"><Trash2 size={15} /></button>
      </div>
    </div>
  );
}
