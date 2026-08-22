'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { apiClient, ApiError } from '../../lib/api/client';
import { uploadFile } from '../../lib/api/media';
import { cn } from '../../lib/utils';

/**
 * Builds the 3D tour a buyer actually walks through.
 *
 * The general media uploader can already push a file into a 3D section, but it
 * leaves two fields empty that the viewer depends on: `cameraPreset`, which is
 * what moves the camera to a stop — without it every stop resolves to the same
 * interior anchor and the tour never goes anywhere — and `thumbnailUrl`, which
 * is what the stop list shows. This is the screen where those get set.
 *
 * Sections are the routes a visitor picks between ("Common Areas", "Unit
 * Showcase"); scenes are the ordered stops within one.
 */

const PRESETS = [
  { value: 'AERIAL', label: 'Aerial', hint: 'Above the development' },
  { value: 'STREET', label: 'Street', hint: 'Approach from outside' },
  { value: 'ROOFTOP', label: 'Rooftop', hint: 'Roof level' },
  { value: 'INTERIOR', label: 'Interior', hint: 'Inside a unit' },
  { value: 'LOBBY', label: 'Lobby', hint: 'Entrance and reception' },
  { value: 'POOL', label: 'Pool', hint: 'Pool deck' },
  { value: 'GYM', label: 'Gym', hint: 'Fitness room' },
] as const;

type Preset = (typeof PRESETS)[number]['value'];

interface Scene {
  id: string;
  label: string;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  cameraPreset?: string | null;
  order: number;
}

interface Section {
  id: string;
  label: string;
  order: number;
  scenes: Scene[];
}

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const field =
  'h-10 w-full rounded-xl border border-[#dadce0] px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]';

export function Tour3DManager({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [newSection, setNewSection] = useState('');

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['admin-tour-3d', slug],
    queryFn: () => apiClient.get<Section[]>(`/properties/${slug}/tours/3d`),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-tour-3d', slug] });
    queryClient.invalidateQueries({ queryKey: ['admin-property', slug] });
  };

  const onError = (e: unknown) =>
    setError(e instanceof ApiError || e instanceof Error ? e.message : 'Something went wrong.');

  const addSection = useMutation({
    mutationFn: (label: string) =>
      apiClient.post<Section>(`/properties/${slug}/tours/3d/sections`, {
        label,
        order: sections.length,
      }),
    onSuccess: () => { setNewSection(''); setError(''); refresh(); },
    onError,
  });

  const removeSection = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/properties/${slug}/tours/3d/sections/${id}`),
    onSuccess: () => { setError(''); refresh(); },
    onError,
  });

  const removeScene = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/properties/${slug}/tours/3d/scenes/${id}`),
    onSuccess: () => { setError(''); refresh(); },
    onError,
  });

  const totalStops = sections.reduce((n, s) => n + s.scenes.length, 0);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn(card, 'p-5')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-medium text-[#202124]">3D tour</h2>
            <p className="mt-1 max-w-xl text-[13px] text-[#5f6368]">
              Sections are the routes a buyer chooses between — the full tour, common
              areas, a single unit. Scenes are the ordered stops inside one.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#5f6368]">
            <span className="rounded-full bg-[#f1f3f4] px-3 py-1">
              {sections.length} {sections.length === 1 ? 'section' : 'sections'}
            </span>
            <span className="rounded-full bg-[#f1f3f4] px-3 py-1">
              {totalStops} {totalStops === 1 ? 'stop' : 'stops'}
            </span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const label = newSection.trim();
            if (label) addSection.mutate(label);
          }}
          className="mt-4 flex flex-wrap gap-2"
        >
          <input
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            placeholder="Section name — e.g. Common Areas"
            maxLength={80}
            className={cn(field, 'max-w-xs flex-1')}
          />
          <button
            type="submit"
            disabled={!newSection.trim() || addSection.isPending}
            className="h-10 cursor-pointer rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40"
          >
            Add section
          </button>
        </form>

        {error && (
          <p className="mt-3 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-[13px] text-[#c5221f]">{error}</p>
        )}
      </div>

      {sections.length === 0 ? (
        <div className={cn(card, 'px-6 py-14 text-center')}>
          <MaterialIcon name="view_in_ar" size={28} className="text-[#80868b]" />
          <p className="mt-2 text-[15px] text-[#5f6368]">No 3D tour yet.</p>
          <p className="mt-1 text-[13px] text-[#80868b]">
            Add a section above to start building one.
          </p>
        </div>
      ) : (
        sections
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <SectionCard
              key={section.id}
              slug={slug}
              section={section}
              onDeleteSection={() => {
                if (window.confirm(`Delete "${section.label}" and its ${section.scenes.length} stops?`)) {
                  removeSection.mutate(section.id);
                }
              }}
              onDeleteScene={(id, label) => {
                if (window.confirm(`Remove the stop "${label}"?`)) removeScene.mutate(id);
              }}
              onDone={refresh}
              onError={onError}
            />
          ))
      )}
    </div>
  );
}

function SectionCard({
  slug,
  section,
  onDeleteSection,
  onDeleteScene,
  onDone,
  onError,
}: {
  slug: string;
  section: Section;
  onDeleteSection: () => void;
  onDeleteScene: (id: string, label: string) => void;
  onDone: () => void;
  onError: (e: unknown) => void;
}) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [preset, setPreset] = useState<Preset>('INTERIOR');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scenes = section.scenes.slice().sort((a, b) => a.order - b.order);

  async function addScene(file: File) {
    const name = label.trim() || file.name.replace(/\.[^.]+$/, '');
    setBusy(true);
    setProgress(0);
    try {
      const uploaded = await uploadFile(file, 'properties', {
        onProgress: (p) => setProgress(p.percent),
      });

      const isVideo = file.type.startsWith('video/');
      await apiClient.post(`/properties/${slug}/tours/3d/sections/${section.id}/scenes`, {
        label: name,
        description: description.trim() || undefined,
        // A still is both the scene image and its thumbnail; a clip has no
        // frame to use, so the stop list falls back to its label.
        ...(isVideo
          ? { videoUrl: uploaded.url }
          : { imageUrl: uploaded.url, thumbnailUrl: uploaded.url }),
        // The field the general uploader never set — this is what tells the
        // viewer where to put the camera for this stop.
        cameraPreset: preset,
        order: scenes.length,
      });

      setLabel('');
      setDescription('');
      onDone();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className={cn(card, 'p-5')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[15px] font-medium text-[#202124]">{section.label}</h3>
          <span className="rounded-full bg-[#f1f3f4] px-2.5 py-0.5 text-[12px] text-[#5f6368]">
            {scenes.length} {scenes.length === 1 ? 'stop' : 'stops'}
          </span>
        </div>
        <button
          onClick={onDeleteSection}
          className="cursor-pointer rounded-full p-1.5 text-[#5f6368] transition-colors hover:bg-[#fce8e6] hover:text-[#c5221f]"
          aria-label={`Delete ${section.label}`}
        >
          <MaterialIcon name="delete" size={18} />
        </button>
      </div>

      {/* Existing stops, in the order the tour plays them */}
      {scenes.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {scenes.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-[#dadce0] p-2.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[12px] font-medium tabular-nums text-[#5f6368]">
                {i + 1}
              </span>

              <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f1f3f4]">
                {s.thumbnailUrl || s.imageUrl ? (
                  <Image
                    src={(s.thumbnailUrl || s.imageUrl) as string}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center">
                    <MaterialIcon name="movie" size={16} className="text-[#80868b]" />
                  </span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] text-[#202124]">{s.label}</span>
                <span className="block truncate text-[12px] text-[#5f6368]">
                  {(s.cameraPreset ?? 'INTERIOR').toLowerCase()}
                  {s.description ? ` · ${s.description}` : ''}
                </span>
              </span>

              {!s.cameraPreset && (
                <span
                  title="No camera position — the viewer will default this stop to the unit interior."
                  className="shrink-0 rounded-full bg-[#fef7e0] px-2 py-0.5 text-[11px] font-medium text-[#b06000]"
                >
                  No position
                </span>
              )}

              <button
                onClick={() => onDeleteScene(s.id, s.label)}
                className="shrink-0 cursor-pointer rounded-full p-1.5 text-[#5f6368] transition-colors hover:bg-[#fce8e6] hover:text-[#c5221f]"
                aria-label={`Remove ${s.label}`}
              >
                <MaterialIcon name="close" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add a stop */}
      <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-3.5">
        <p className="mb-2.5 text-[13px] font-medium text-[#202124]">Add a stop</p>

        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Stop name — e.g. Rooftop Pool"
            maxLength={80}
            className={field}
          />
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as Preset)}
            className={cn(field, 'cursor-pointer')}
            aria-label="Camera position"
          >
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} — {p.hint}
              </option>
            ))}
          </select>
        </div>

        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Caption shown on the stop (optional)"
          maxLength={300}
          className={cn(field, 'mt-2')}
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#dadce0] bg-white px-4 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] disabled:opacity-40"
          >
            <MaterialIcon name="upload" size={16} />
            {busy ? 'Uploading…' : 'Choose image or video'}
          </button>

          {progress !== null && (
            <span className="flex items-center gap-2 text-[13px] text-[#5f6368]">
              <span className="h-1.5 w-28 overflow-hidden rounded-full bg-[#dadce0]">
                <span
                  className="block h-full rounded-full bg-[#1a73e8] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </span>
              {progress}%
            </span>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addScene(f);
          }}
        />
      </div>
    </div>
  );
}
