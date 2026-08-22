'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Film, Headset, ImagePlus, Loader2, Trash2, Video,
} from 'lucide-react';
import { apiClient, ApiError } from '../../lib/api/client';
import { uploadFile, type UploadProgress } from '../../lib/api/media';
import { UploadProgressBar } from './UploadProgressBar';
import { cn } from '../../lib/utils';

/* ── Shared types ───────────────────────────────────────────────── */

interface MediaAsset {
  id: string;
  url: string;
  type: string;
  title?: string | null;
}

interface CinematicScene {
  id: string;
  label: string;
  sublabel?: string | null;
  category: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
}

interface TourScene {
  id: string;
  label: string;
  description?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
}


/**
 * Video kinds a developer can attach.
 *
 * "3D tour" is deliberately absent. A 3D tour is now a building model — a .glb
 * uploaded under the 3D tour tab — and the viewer renders that geometry rather
 * than playing clips. Leaving the option here would let someone fill a tour
 * with videos that nothing displays, and believe it was done.
 */
type VideoKind = 'cinematic' | 'vr';

const VIDEO_KINDS: { key: VideoKind; label: string; icon: React.ReactNode; hint: string }[] = [
  { key: 'cinematic', label: 'Cinematic', icon: <Film size={14} />, hint: 'Scroll-driven cinematic films' },
  { key: 'vr', label: 'VR / 360°', icon: <Headset size={14} />, hint: 'Immersive headset-ready scenes' },
];

/**
 * Unit types a development can offer. A unit type is the layout being sold or
 * let (Studio, 2 Bedroom…), not a room.
 */
const UNIT_TYPES = [
  'Studio',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
  '4 Bedroom',
  '5 Bedroom',
  'Penthouse',
  'Maisonette',
  'Duplex',
  'Townhouse',
] as const;

/** Rooms filmed within a unit type — each gets its own video slot. */
const UNIT_SPACES = [
  { key: 'FULL_TOUR', label: 'Full house' },
  { key: 'LIVING_ROOM', label: 'Living room' },
  { key: 'BEDROOM', label: 'Bedroom' },
  { key: 'BATHROOM', label: 'Bathroom' },
  { key: 'KITCHEN', label: 'Kitchen' },
] as const;

const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';

/* ── Root ───────────────────────────────────────────────────────── */

export function PropertyMediaManager({
  slug,
  heroImageUrl,
}: {
  slug: string;
  heroImageUrl?: string | null;
}) {
  return (
    <div className="space-y-6">
      <GalleryCard slug={slug} />
      <LogoCard slug={slug} heroImageUrl={heroImageUrl} />
      <ToursCard slug={slug} />
    </div>
  );
}

/* ── Gallery photos ─────────────────────────────────────────────── */

function GalleryCard({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [currentFile, setCurrentFile] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const { data: media, isLoading } = useQuery({
    queryKey: ['property-media', slug],
    queryFn: () => apiClient.get<MediaAsset[]>(`/media/properties/${slug}`),
  });
  const photos = (media ?? []).filter((m) => ['PHOTO', 'DRONE_PHOTO'].includes(m.type) && m.title !== '__logo__');

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError('');
    setBusy(true);
    const images = files.filter((f) => f.type.startsWith('image/'));
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      for (const [i, file] of images.entries()) {
        // Named per file rather than as one total: a batch of thirty photos
        // reads as "3 of 30" progress, which is what the person is watching.
        setCurrentFile(`${file.name} (${i + 1} of ${images.length})`);
        const uploaded = await uploadFile(file, 'properties', {
          onProgress: setProgress,
          signal: controller.signal,
        });
        await apiClient.post(`/media/properties/${slug}`, {
          type: 'PHOTO',
          url: uploaded.url,
          title: file.name,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['property-media', slug] });
      queryClient.invalidateQueries({ queryKey: ['dash-property', slug] });
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error
        ? err.message
        : 'Upload failed.';
      // Photos already uploaded before a cancel are kept — they are on the
      // server and listed, so discarding them would lose real work.
      setError(message === 'Upload cancelled' ? '' : message);
      queryClient.invalidateQueries({ queryKey: ['property-media', slug] });
    } finally {
      setProgress(null);
      setCurrentFile('');
      abortRef.current = null;
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove(id: string) {
    await apiClient.delete(`/media/${id}`).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['property-media', slug] });
  }

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-normal text-[#202124]">Gallery photos</h3>
          <p className="text-sm text-[#5f6368]">Shown on the property page, search results and unit views.</p>
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} Add photos
        </button>
      </div>

      {progress && (
        <div className="mt-3">
          <UploadProgressBar
            progress={progress}
            fileName={currentFile}
            label="Uploading"
            onCancel={() => abortRef.current?.abort()}
          />
        </div>
      )}

      {error && <p className="mt-3 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

      <div className="mt-4">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center"><Loader2 size={18} className="animate-spin text-[#80868b]" /></div>
        ) : photos.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#dadce0] bg-[#f8f9fa] text-[#5f6368] hover:border-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer"
          >
            <ImagePlus size={20} />
            <span className="text-[15px] font-medium text-[#1a73e8]">Upload gallery photos</span>
            <span className="text-[13px] text-[#80868b]">Select several at once</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f1f3f4]">
                <Image src={p.url} alt={p.title ?? ''} fill className="object-cover" sizes="200px" />
                <button
                  onClick={() => remove(p.id)}
                  aria-label="Remove photo"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#c5221f] opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Property logo ──────────────────────────────────────────────── */

function LogoCard({ slug }: { slug: string; heroImageUrl?: string | null }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const { data: media } = useQuery({
    queryKey: ['property-media', slug],
    queryFn: () => apiClient.get<MediaAsset[]>(`/media/properties/${slug}`),
  });
  const logo = (media ?? []).find((m) => m.title === '__logo__');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      if (logo) await apiClient.delete(`/media/${logo.id}`).catch(() => {});
      const uploaded = await uploadFile(file, 'logos');
      await apiClient.post(`/media/properties/${slug}`, {
        type: 'PHOTO',
        url: uploaded.url,
        title: '__logo__',
      });
      queryClient.invalidateQueries({ queryKey: ['property-media', slug] });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <h3 className="text-[18px] font-normal text-[#202124]">Property logo</h3>
      <p className="text-sm text-[#5f6368]">Branding mark for this development — shown on its dedicated page.</p>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-24 w-40 items-center justify-center overflow-hidden rounded-2xl border border-[#dadce0] bg-[#f8f9fa]">
          {busy ? (
            <Loader2 size={20} className="animate-spin text-[#1a73e8]" />
          ) : logo ? (
            <Image src={logo.url} alt="Property logo" width={160} height={96} className="h-full w-full object-contain p-3" />
          ) : (
            <Building2 size={22} className="text-[#80868b]" />
          )}
        </div>
        <div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer disabled:opacity-50"
          >
            <ImagePlus size={14} /> {logo ? 'Replace logo' : 'Upload logo'}
          </button>
          <p className="mt-2 text-[13px] text-[#80868b]">PNG or SVG with transparency works best.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Tours: cinematic / 3D / VR across categories ───────────────── */

function ToursCard({ slug }: { slug: string }) {
  const [kind, setKind] = useState<VideoKind>('cinematic');

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <div>
        <h3 className="text-[18px] font-normal text-[#202124]">Immersive videos</h3>
        <p className="text-sm text-[#5f6368]">
          Cinematic films and VR scenes for the property, its unit types and amenities.
        </p>
        {/* Said plainly, because the missing "3D tour" tab would otherwise
            read as something broken. Worded for both audiences: this component
            is shared with the developer dashboard, where there is no 3D tour
            tab to point at — e-resi produces the models. */}
        <p className="mt-1.5 text-[13px] text-[#80868b]">
          A 3D tour is a building model rather than a video, and is produced and
          published by e-resi.
        </p>
      </div>

      {/* kind switcher */}
      <div className="mt-4 flex flex-wrap gap-2">
        {VIDEO_KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium transition-colors cursor-pointer',
              kind === k.key ? 'bg-[#e8f0fe] text-[#1967d2]' : 'text-[#5f6368] hover:bg-[#f1f3f4]',
            )}
          >
            {k.icon} {k.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-[#80868b]">{VIDEO_KINDS.find((k) => k.key === kind)?.hint}</p>

      <div className="mt-6 space-y-6">
        <SceneGroup slug={slug} kind={kind} scope="property" title="Property overview" />
        <SceneGroup slug={slug} kind={kind} scope="units" title="Unit types" />
        <SceneGroup slug={slug} kind={kind} scope="amenities" title="Amenities" />
      </div>
    </div>
  );
}

/**
 * One group of scenes (property / unit types / amenities) for the selected
 * video kind. Unit types offer the room breakdown; amenities are free-form
 * so a developer can add a video space for any amenity they like.
 */
function SceneGroup({
  slug, kind, scope, title,
}: {
  slug: string;
  kind: VideoKind;
  scope: 'property' | 'units' | 'amenities';
  title: string;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [space, setSpace] = useState<string>(scope === 'units' ? 'FULL_TOUR' : '');
  const [unitType, setUnitType] = useState<string>(UNIT_TYPES[1]);
  const [customLabel, setCustomLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Tour videos are the largest thing anyone uploads here, so progress is
  // tracked rather than showing an unqualified spinner.
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── read existing scenes for this kind
  const { data: scenes, isLoading } = useQuery({
    queryKey: ['tours', slug, kind],
    queryFn: async () => {
      if (kind === 'cinematic') {
        return apiClient.get<CinematicScene[]>(`/properties/${slug}/tours/cinematic`);
      }
      return apiClient.get<TourScene[]>(`/properties/${slug}/tours/vr`);
    },
  });

  // scenes belonging to this group, matched by category (cinematic) or label prefix
  const prefix = scope === 'property' ? 'Property' : scope === 'units' ? 'Unit' : 'Amenity';
  const mine = ((scenes ?? []) as (CinematicScene & TourScene & { sectionLabel?: string })[]).filter((s) => {
    if (kind === 'cinematic') {
      if (scope === 'units') return UNIT_SPACES.some((u) => u.key === s.category) && s.category !== 'FULL_TOUR'
        ? true
        : s.sublabel?.startsWith('Unit');
      if (scope === 'amenities') return s.category === 'AMENITIES';
      return ['FULL_TOUR', 'AERIAL', 'EXTERIOR'].includes(s.category) && !s.sublabel?.startsWith('Unit');
    }
    return (s.description ?? s.sectionLabel ?? '').startsWith(prefix);
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const room = UNIT_SPACES.find((u) => u.key === space)?.label ?? 'Full house';
    const label = scope === 'units'
      ? `${unitType} · ${room}`
      : scope === 'amenities'
        ? customLabel.trim()
        : 'Property overview';

    if (scope === 'amenities' && !label) {
      setError('Name the amenity first (e.g. Rooftop pool).');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setBusy(true);
    setProgress({ loaded: 0, total: file.size, percent: 0 });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const uploaded = await uploadFile(file, 'tours', {
        onProgress: setProgress,
        signal: controller.signal,
      });

      if (kind === 'cinematic') {
        const category = scope === 'units'
          ? space
          : scope === 'amenities' ? 'AMENITIES' : 'FULL_TOUR';
        await apiClient.post(`/properties/${slug}/tours/cinematic`, {
          label,
          sublabel: `${prefix}${scope === 'units' ? ' · ' + unitType : ''}`,
          category,
          videoUrl: uploaded.url,
        });
      } else {
        await apiClient.post(`/properties/${slug}/tours/vr`, {
          label,
          description: scope === 'units' ? `${prefix} · ${unitType}` : `${prefix} · ${label}`,
          videoUrl: uploaded.url,
        });
      }

      setCustomLabel('');
      queryClient.invalidateQueries({ queryKey: ['tours', slug, kind] });
      queryClient.invalidateQueries({ queryKey: ['dash-property', slug] });
    } catch (err) {
      // Cancelling is a deliberate action, not a failure to report back.
      const message = err instanceof ApiError || err instanceof Error
        ? err.message
        : 'Upload failed.';
      setError(message === 'Upload cancelled' ? '' : message);
    } finally {
      setBusy(false);
      setProgress(null);
      abortRef.current = null;
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function remove(id: string) {
    const path = kind === 'cinematic'
      ? `/properties/${slug}/tours/cinematic/${id}`
      : `/properties/${slug}/tours/vr/${id}`;
    await apiClient.delete(path).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['tours', slug, kind] });
  }

  return (
    <div className="rounded-2xl border border-[#f1f3f4] bg-[#f8f9fa] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-medium text-[#202124]">{title}</p>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />} Upload video
        </button>
      </div>

      {progress && (
        <div className="mt-3">
          <UploadProgressBar
            progress={progress}
            label="Uploading video"
            onCancel={() => abortRef.current?.abort()}
          />
        </div>
      )}

      {/* group-specific controls */}
      {scope === 'units' && (
        <div className="mt-3">
          <label className={labelCls}>Unit type</label>
          <div className="mb-3 flex flex-wrap gap-2">
            {UNIT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setUnitType(t)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer',
                  unitType === t ? 'bg-[#202124] text-white' : 'bg-white text-[#5f6368] hover:bg-[#f1f3f4]',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <label className={labelCls}>Space in {unitType}</label>
          <div className="flex flex-wrap gap-2">
            {UNIT_SPACES.map((u) => (
              <button
                key={u.key}
                onClick={() => setSpace(u.key)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer',
                  space === u.key ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#5f6368] hover:bg-[#f1f3f4]',
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {scope === 'amenities' && (
        <div className="mt-3">
          <label className={labelCls}>Amenity name</label>
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Rooftop pool, gym, clubhouse…"
            className={inputCls}
          />
          <p className="mt-1.5 text-[13px] text-[#80868b]">
            Name it, then upload — each amenity gets its own {VIDEO_KINDS.find((k) => k.key === kind)?.label.toLowerCase()} space.
          </p>
        </div>
      )}

      {error && <p className="mt-3 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

      {/* existing scenes */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex h-16 items-center justify-center"><Loader2 size={16} className="animate-spin text-[#80868b]" /></div>
        ) : mine.length === 0 ? (
          <p className="text-[13px] text-[#80868b]">No videos yet.</p>
        ) : scope === 'units' ? (
          // Group by unit type so each layout's videos sit together.
          <div className="space-y-4">
            {Object.entries(
              mine.reduce<Record<string, typeof mine>>((acc, s) => {
                const type = (s.sublabel ?? s.description ?? '').replace(/^Unit\s*·\s*/, '') || 'Unit';
                (acc[type] ||= []).push(s);
                return acc;
              }, {}),
            ).map(([type, list]) => (
              <div key={type}>
                <p className="mb-1.5 text-[13px] font-medium text-[#202124]">{type}</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {list.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1967d2]">
                        <Video size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-[#202124]">
                          {s.label.replace(/^.*?·\s*/, '')}
                        </span>
                        <span className="block truncate text-[12px] text-[#80868b]">{type}</span>
                      </span>
                      <button
                        onClick={() => remove(s.id)}
                        aria-label={`Remove ${s.label}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#80868b] hover:bg-[#fce8e6] hover:text-[#c5221f] transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {mine.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1967d2]">
                  <Video size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-[#202124]">{s.label}</span>
                  <span className="block truncate text-[12px] text-[#80868b]">{s.sublabel ?? s.description ?? ''}</span>
                </span>
                <button
                  onClick={() => remove(s.id)}
                  aria-label={`Remove ${s.label}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#80868b] hover:bg-[#fce8e6] hover:text-[#c5221f] transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
