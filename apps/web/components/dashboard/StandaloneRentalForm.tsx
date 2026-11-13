'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, EyeOff, ImagePlus, Loader2, X } from 'lucide-react';
import { apiClient, ApiError } from '../../lib/api/client';
import { uploadFile } from '../../lib/api/media';
import { AreaSearchInput } from './AreaSearchInput';
import { cn } from '../../lib/utils';

/**
 * List one home for rent on its own — no development behind it. The agent
 * describes the home, adds their own photos and chooses whether the exact
 * location is public or shared only once a tenant gets in touch.
 */

const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';
const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

const KINDS = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'VILLA', label: 'House / villa' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'COMMERCIAL', label: 'Commercial' },
] as const;

const FURNISHING = [
  { value: 'UNFURNISHED', label: 'Unfurnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-furnished' },
  { value: 'FURNISHED', label: 'Furnished' },
] as const;

const FEATURES = [
  'Parking', 'Borehole', 'Backup generator', 'Lift', 'Gym', 'Swimming pool', 'CCTV', '24h security',
  'Balcony', 'DSQ', 'Garden', 'Pet friendly', 'Fibre internet', 'Solar water heating', 'Kids play area',
];

export function StandaloneRentalForm({ base }: { base: '/agent' | '/dashboard' }) {
  const [form, setForm] = useState({
    name: '', category: 'APARTMENT', bedrooms: '2', bathrooms: '1', sqm: '',
    furnishing: 'UNFURNISHED', rent: '', neighborhood: '', city: '', county: '',
    description: '', minLease: '12', availableFrom: '', units: '1',
  });
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hideLocation, setHideLocation] = useState(true);
  const [features, setFeatures] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...next].slice(0, 20));
  }

  async function submit() {
    setError('');
    const rent = Number.parseFloat(form.rent);
    if (!form.name.trim()) return setError('Give the listing a title, e.g. "2 bedroom apartment in Kilimani".');
    if (!form.city.trim()) return setError('Which city or town is the home in?');
    if (!Number.isFinite(rent) || rent <= 0) return setError('Set the monthly rent.');
    if (files.length === 0) return setError('Add at least one photo — listings without photos get no enquiries.');
    const unitsAvailable = Number.parseInt(form.units, 10);
    if (!Number.isFinite(unitsAvailable) || unitsAvailable < 1) return setError('How many units are available? At least 1.');

    setSubmitting(true);
    try {
      setProgress('Creating listing…');
      const listing = await apiClient.post<{ id: string; slug: string }>('/rent-listings', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        furnishing: form.furnishing,
        neighborhood: form.neighborhood.trim() || undefined,
        city: form.city.trim(),
        county: form.county.trim() || undefined,
        ...(coords ?? {}),
        hideExactLocation: hideLocation,
        features,
        priceFrom: rent,
        priceTo: rent,
        minLeaseTerm: Number.parseInt(form.minLease, 10) || 12,
        availableFrom: form.availableFrom ? new Date(form.availableFrom).toISOString() : undefined,
      });

      const beds = Number.parseInt(form.bedrooms, 10);
      await apiClient.post(`/rent-listings/${listing.id}/units`, {
        label: KINDS.find((k) => k.value === form.category)?.label ?? 'Home',
        unitType: beds === 0 ? 'Studio' : `${beds} Bedroom`,
        bedrooms: Number.isFinite(beds) ? beds : 1,
        bathrooms: Number.parseInt(form.bathrooms, 10) || 1,
        sqm: form.sqm ? Number.parseFloat(form.sqm) : undefined,
        pricePerMonth: rent,
        available: unitsAvailable,
        total: unitsAvailable,
        furnishing: form.furnishing,
      });

      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading photo ${i + 1} of ${files.length}…`);
        const uploaded = await uploadFile(files[i], 'rentals');
        await apiClient.post(`/media/rent-listings/${listing.id}`, {
          type: 'PHOTO', url: uploaded.url, order: i, isFeatured: i === 0,
          sizeBytes: uploaded.sizeBytes, mimeType: files[i].type,
        });
        if (i === 0) await apiClient.patch(`/rent-listings/${listing.id}`, { heroImageUrl: uploaded.url });
      }
      setCreatedSlug(listing.slug);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not publish the listing.');
    } finally {
      setSubmitting(false);
      setProgress('');
    }
  }

  if (createdSlug) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f4ea]">
          <CheckCircle2 size={32} className="text-[#188038]" />
        </div>
        <h1 className="text-[26px] font-normal text-[#202124] sm:text-[28px]">Your rental is live</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-[#5f6368]">
          Tenants can now enquire, message you on WhatsApp and book viewings.
          {hideLocation && ' The exact location stays private until you share it.'}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/rent/${createdSlug}`} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc]">
            View live listing <ArrowRight size={15} />
          </Link>
          <Link href={`${base}/rentals/${createdSlug}`} className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff]">
            Manage listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      <section className={cardCls}>
        <h2 className="mb-4 text-[16px] font-medium text-[#202124]">The home</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Listing title</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Spacious 2 bedroom apartment in Kilimani" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={form.category} onChange={set('category')} className={inputCls}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Furnishing</label>
            <select value={form.furnishing} onChange={set('furnishing')} className={inputCls}>
              {FURNISHING.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <div>
              <label className={labelCls}>Bedrooms</label>
              <select value={form.bedrooms} onChange={set('bedrooms')} className={inputCls}>
                {['0', '1', '2', '3', '4', '5', '6'].map((b) => <option key={b} value={b}>{b === '0' ? 'Studio' : b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Bathrooms</label>
              <input value={form.bathrooms} onChange={set('bathrooms')} inputMode="numeric" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Size (m²)</label>
              <input value={form.sqm} onChange={set('sqm')} inputMode="decimal" placeholder="Optional" className={inputCls} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={4} placeholder="What makes this home worth seeing? Layout, light, finishes, what's nearby." className={inputCls} />
          </div>
        </div>
      </section>

      <section className={cardCls}>
        <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Rent & availability</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelCls}>Monthly rent (KES)</label>
            <input value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="numeric" placeholder="85000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Units available</label>
            <input value={form.units} onChange={(e) => setForm((f) => ({ ...f, units: e.target.value.replace(/\D/g, '') }))} inputMode="numeric" placeholder="1" className={inputCls} />
            <p className="mt-1 text-[12px] text-[#80868b]">Same home type in one block? Enter how many are vacant.</p>
          </div>
          <div>
            <label className={labelCls}>Minimum lease</label>
            <select value={form.minLease} onChange={set('minLease')} className={inputCls}>
              {['1', '3', '6', '12', '24'].map((m) => <option key={m} value={m}>{m} month{m === '1' ? '' : 's'}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Available from</label>
            <input type="date" value={form.availableFrom} onChange={set('availableFrom')} className={inputCls} />
          </div>
        </div>
      </section>

      <section className={cardCls}>
        <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Location</h2>
        <p className="mb-4 text-[13px] text-[#5f6368]">Tenants search by area. You decide whether they see the exact spot.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Area / neighbourhood</label>
            <AreaSearchInput
              value={form.neighborhood}
              onChange={(neighborhood) => setForm((f) => ({ ...f, neighborhood }))}
              placeholder="Search e.g. Kilimani, Nyali, Milimani"
              inputClassName={inputCls}
              onPick={(a) => {
                setForm((f) => ({ ...f, neighborhood: a.name, city: a.city ?? f.city, county: a.county ?? f.county }));
                setCoords({ latitude: a.latitude, longitude: a.longitude });
              }}
            />
          </div>
          <div>
            <label className={labelCls}>City / town</label>
            <input value={form.city} onChange={set('city')} placeholder="Nairobi" className={inputCls} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setHideLocation((v) => !v)}
          className={cn(
            'mt-4 flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
            hideLocation ? 'border-[#1a73e8] bg-[#e8f0fe]/40' : 'border-[#dadce0] hover:bg-[#f8f9fa]',
          )}
        >
          <span className={cn('mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors', hideLocation ? 'bg-[#1a73e8]' : 'bg-[#dadce0]')}>
            <span className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', hideLocation && 'translate-x-4')} />
          </span>
          <span>
            <span className="flex items-center gap-1.5 text-[14px] font-medium text-[#202124]"><EyeOff size={14} /> Keep the exact location private</span>
            <span className="mt-0.5 block text-[13px] text-[#5f6368]">
              Only the area shows on the listing. Tenants contact you to find out exactly where the home is.
            </span>
          </span>
        </button>
      </section>

      <section className={cardCls}>
        <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Features</h2>
        <div className="flex flex-wrap gap-2">
          {FEATURES.map((f) => {
            const on = features.includes(f);
            return (
              <button key={f} type="button" onClick={() => setFeatures((prev) => (on ? prev.filter((x) => x !== f) : [...prev, f]))}
                className={cn('rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors', on ? 'bg-[#1a73e8] text-white' : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]')}>
                {f}
              </button>
            );
          })}
        </div>
      </section>

      <section className={cardCls}>
        <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Photos</h2>
        <p className="mb-4 text-[13px] text-[#5f6368]">The first photo is the cover. Up to 20.</p>
        <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="relative aspect-square overflow-hidden rounded-2xl bg-[#f1f3f4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-[#202124]">Cover</span>}
              <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                <X size={12} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => fileInput.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa]">
            <ImagePlus size={20} />
            <span className="text-[12.5px] font-medium">Add photos</span>
          </button>
        </div>
      </section>

      {error && <p className="rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#5f6368]">{progress || `${files.length} photo${files.length === 1 ? '' : 's'}`}</p>
        <button onClick={submit} disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] disabled:pointer-events-none disabled:opacity-40">
          {submitting ? <>Publishing <Loader2 size={15} className="animate-spin" /></> : <>Publish rental <ArrowRight size={15} /></>}
        </button>
      </div>
    </div>
  );
}
