'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { twinsApi, uploadMesh, type GlbSummary, type TwinKind } from '../../lib/api/twins';
import { ApiError } from '../../lib/api/client';
import { cn } from '../../lib/utils';

/**
 * Publishes the building model a 3D tour is built on.
 *
 * The model is the tour — everything else here (stops, tags, floors) is
 * positioned against it, so this screen leads with the upload and only offers
 * the rest once something exists to place them in.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const field =
  'h-10 w-full rounded-xl border border-[#dadce0] px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]';

/** Material icon per kind, so the strip reads at a glance. */
const KIND_ICON: Record<string, string> = {
  BUILDING: 'apartment',
  UNIT: 'door_front',
  AMENITY: 'pool',
  ROOM: 'chair',
};

const mb = (bytes?: number | null) =>
  bytes ? `${(bytes / 1048576).toFixed(1)} MB` : '—';

export function DigitalTwinManager({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [summary, setSummary] = useState<GlbSummary | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busyKind, setBusyKind] = useState<'mesh' | 'proxy' | null>(null);

  const meshRef = useRef<HTMLInputElement>(null);
  const proxyRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** Set just before opening the picker, so one input serves both actions. */
  const replaceRef = useRef(false);

  const { data: twins = [], isLoading } = useQuery({
    queryKey: ['admin-twin', slug],
    queryFn: () => twinsApi.list(slug),
  });

  /**
   * Which model is being edited.
   *
   * A property is captured in pieces — the building, a show unit, the amenity
   * deck — so this screen edits one at a time and the strip above chooses it.
   */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const twin = twins.find((t) => t.id === selectedId) ?? twins[0] ?? null;

  /** What the next upload creates, when it is not replacing an existing model. */
  const [newLabel, setNewLabel] = useState('');
  const [newKind, setNewKind] = useState<TwinKind>('BUILDING');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-twin', slug] });
    queryClient.invalidateQueries({ queryKey: ['admin-property', slug] });
  };

  const onError = (e: unknown) =>
    setError(e instanceof ApiError || e instanceof Error ? e.message : 'Something went wrong.');

  async function upload(file: File, kind: 'mesh' | 'proxy', replacing = false) {
    setError('');
    setWarnings([]);
    setBusyKind(kind);
    setProgress(0);
    abortRef.current = new AbortController();

    try {
      const result = await uploadMesh(slug, file, {
        kind,
        // A proxy always belongs to the model being viewed; a mesh replaces
        // that model only when one is selected, otherwise it adds another.
        ...(kind === 'proxy' || replacing
          ? { twinId: twin?.id }
          : { label: newLabel.trim() || undefined, twinKind: newKind }),
        onProgress: setProgress,
        signal: abortRef.current.signal,
      });
      setSelectedId(result.twin.id);
      setNewLabel('');
      setSummary(result.summary);
      setWarnings(result.warnings);
      refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed.';
      // Cancelling is a decision, not a failure to report back.
      if (message !== 'Upload cancelled') setError(message);
    } finally {
      setBusyKind(null);
      setProgress(null);
      abortRef.current = null;
      if (meshRef.current) meshRef.current.value = '';
      if (proxyRef.current) proxyRef.current.value = '';
    }
  }

  const save = useMutation({
    mutationFn: (body: Parameters<typeof twinsApi.update>[2]) =>
      twinsApi.update(twin!.id, slug, body),
    onSuccess: () => { setError(''); refresh(); },
    onError,
  });

  const remove = useMutation({
    mutationFn: () => twinsApi.remove(twin!.id, slug),
    onSuccess: () => { setError(''); setSummary(null); setWarnings([]); setSelectedId(null); refresh(); },
    onError,
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Model switcher ──
          One row per capture. A development is scanned in pieces, and this is
          how staff move between them — the same choice a buyer gets in the
          viewer. */}
      {twins.length > 0 && (
        <div className={cn(card, 'p-3')}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {twins.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedId(t.id); setSummary(null); setWarnings([]); }}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left transition-colors',
                  t.id === twin?.id
                    ? 'border-[#1a73e8] bg-[#e8f0fe]'
                    : 'border-[#dadce0] bg-white hover:bg-[#f8f9fa]',
                )}
              >
                <MaterialIcon
                  name={KIND_ICON[t.kind] ?? 'view_in_ar'}
                  size={18}
                  className={t.id === twin?.id ? 'text-[#1967d2]' : 'text-[#5f6368]'}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-[#202124]">
                    {t.label}
                  </span>
                  <span className="block text-[11px] uppercase tracking-wide text-[#80868b]">
                    {t.kind.toLowerCase()}
                    {t.isPrimary ? ' · opens first' : ''}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Model ── */}
      <div className={cn(card, 'p-5')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-medium text-[#202124]">Building model</h2>
            <p className="mt-1 max-w-xl text-[13px] text-[#5f6368]">
              A glTF binary — <code className="rounded bg-[#f1f3f4] px-1 py-0.5 text-[12px]">.glb</code> —
              exported from the architectural model or the scan. This is what a buyer
              walks through; everything else on this page is positioned inside it.
            </p>
          </div>
          {twin && (
            <button
              onClick={() => {
                if (window.confirm('Remove the model? Its stops and tags go with it.')) {
                  remove.mutate();
                }
              }}
              className="cursor-pointer rounded-full border border-[#f5c6c4] px-3.5 py-1.5 text-[13px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6]"
            >
              Remove model
            </button>
          )}
        </div>

        {twin ? (
          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-4">
            <Stat label="Triangles" value={twin.triangles?.toLocaleString() ?? '—'} />
            <Stat label="File size" value={mb(twin.fileSizeBytes)} />
            <Stat label="Stops" value={String(twin.waypoints.length)} />
            <Stat label="Tags" value={String(twin.tags.length)} />
          </dl>
        ) : (
          <p className="mt-4 rounded-2xl bg-[#f8f9fa] px-4 py-3 text-[13px] text-[#5f6368]">
            No model yet. Until one is uploaded, this property has no 3D tour.
          </p>
        )}

        {/* Adding another capture rather than replacing this one. */}
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Name the next model — e.g. 2 Bed Show Unit, Amenities"
            maxLength={80}
            className={field}
          />
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as TwinKind)}
            className={cn(field, 'cursor-pointer sm:w-44')}
            aria-label="What this model is of"
          >
            <option value="BUILDING">Whole building</option>
            <option value="UNIT">Unit type</option>
            <option value="AMENITY">Amenity</option>
            <option value="ROOM">Single room</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => meshRef.current?.click()}
            disabled={busyKind !== null}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40"
          >
            <MaterialIcon name="upload" size={16} />
            {twins.length ? 'Add model' : 'Upload model'}
          </button>

          {twin && (
            <button
              onClick={() => { replaceRef.current = true; meshRef.current?.click(); }}
              disabled={busyKind !== null}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#dadce0] bg-white px-4 text-[14px] font-medium text-[#5f6368] transition-colors hover:bg-[#f8f9fa] disabled:opacity-40"
            >
              Replace “{twin.label}”
            </button>
          )}

          {twin && (
            <button
              onClick={() => proxyRef.current?.click()}
              disabled={busyKind !== null}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#dadce0] bg-white px-4 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] disabled:opacity-40"
            >
              {twin.proxyUrl ? 'Replace preview mesh' : 'Add preview mesh'}
            </button>
          )}

          {progress !== null && (
            <span className="flex items-center gap-2 text-[13px] text-[#5f6368]">
              <span className="h-1.5 w-32 overflow-hidden rounded-full bg-[#dadce0]">
                <span
                  className="block h-full rounded-full bg-[#1a73e8] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </span>
              {progress}%
              <button
                onClick={() => abortRef.current?.abort()}
                className="cursor-pointer text-[#1a73e8] underline"
              >
                Cancel
              </button>
            </span>
          )}
        </div>

        <p className="mt-2 text-[12px] text-[#80868b]">
          A preview mesh is a heavily decimated shell. It loads first so the dollhouse
          appears while the full model is still arriving — worth adding on anything large.
        </p>

        <input ref={meshRef} type="file" accept=".glb,model/gltf-binary" hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f, 'mesh', replaceRef.current);
            replaceRef.current = false;
          }} />
        <input ref={proxyRef} type="file" accept=".glb,model/gltf-binary" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, 'proxy'); }} />

        {error && (
          <p className="mt-3 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-[13px] text-[#c5221f]">{error}</p>
        )}

        {/* What the file actually contains, read from the file itself. */}
        {summary && (
          <div className="mt-3 rounded-2xl border border-[#dadce0] bg-[#f8f9fa] p-4">
            <p className="text-[13px] font-medium text-[#202124]">Uploaded</p>
            <dl className="mt-2.5 grid gap-x-6 gap-y-2 sm:grid-cols-3">
              <Stat label="Triangles" value={summary.triangles.toLocaleString()} />
              <Stat label="Size" value={mb(summary.bytes)} />
              <Stat label="Meshes" value={String(summary.meshes)} />
              <Stat label="Materials" value={String(summary.materials)} />
              <Stat label="Geometry" value={summary.compression === 'none' ? 'Uncompressed' : summary.compression} />
              <Stat label="Textures" value={summary.ktx2 ? 'KTX2' : `${summary.textures} uncompressed`} />
            </dl>

            {warnings.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-[#dadce0] pt-3">
                {warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-[12.5px] text-[#b06000]">
                    <MaterialIcon name="warning" size={15} className="mt-0.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Everything below is meaningless without a model to place it in. */}
      {twin && (
        <>
          <ModelSettings
            twin={twin}
            saving={save.isPending}
            onSave={(body) => save.mutate(body)}
          />
          <Waypoints slug={slug} twin={twin} onDone={refresh} onError={onError} />
          <Tags slug={slug} twin={twin} onDone={refresh} onError={onError} />

          <div className={cn(card, 'flex flex-wrap items-center justify-between gap-3 p-5')}>
            <p className="text-[13px] text-[#5f6368]">
              See it the way a buyer will.
            </p>
            <Link
              href={`/${slug}/tour/3d`}
              target="_blank"
              className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
            >
              Open the tour
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] uppercase tracking-wide text-[#80868b]">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-medium capitalize text-[#202124]">{value}</dd>
    </div>
  );
}

function ModelSettings({
  twin,
  saving,
  onSave,
}: {
  twin: Awaited<ReturnType<typeof twinsApi.list>>[number];
  saving: boolean;
  onSave: (body: Parameters<typeof twinsApi.update>[2]) => void;
}) {
  const [floors, setFloors] = useState(twin.floors.join(', '));
  const [scale, setScale] = useState(String(twin.scale));
  const [verified, setVerified] = useState(twin.scaleVerified);

  return (
    <div className={cn(card, 'p-5')}>
      <h2 className="text-[16px] font-medium text-[#202124]">Model settings</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-[#5f6368]">
            Storeys, bottom first — drives the floor selector
          </span>
          <input
            value={floors}
            onChange={(e) => setFloors(e.target.value)}
            placeholder="Ground, First, Rooftop"
            className={field}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] text-[#5f6368]">
            Metres per model unit
          </span>
          <input
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            inputMode="decimal"
            className={field}
          />
        </label>
      </div>

      {/* Measurement stays hidden until someone confirms the model is to
          scale — publishing distances from an unverified export would hand a
          buyer confident wrong numbers. */}
      <label className="mt-3 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={verified}
          onChange={(e) => setVerified(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[#1a73e8]"
        />
        <span>
          <span className="block text-[14px] text-[#202124]">Scale checked on site</span>
          <span className="block text-[12.5px] text-[#5f6368]">
            Measurement in the viewer stays off until this is ticked.
          </span>
        </span>
      </label>

      <button
        onClick={() =>
          onSave({
            floors: floors.split(',').map((f) => f.trim()).filter(Boolean),
            scale: Number.parseFloat(scale) || 1,
            scaleVerified: verified,
          })
        }
        disabled={saving}
        className="mt-4 h-10 cursor-pointer rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  );
}

function Waypoints({
  slug,
  twin,
  onDone,
  onError,
}: {
  slug: string;
  twin: Awaited<ReturnType<typeof twinsApi.list>>[number];
  onDone: () => void;
  onError: (e: unknown) => void;
}) {
  const [form, setForm] = useState({
    label: '', caption: '', route: '', posX: '', posY: '1.6', posZ: '', floor: '0',
  });
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    try {
      await twinsApi.addWaypoint(twin.id, slug, {
        label: form.label.trim(),
        caption: form.caption.trim() || undefined,
        route: form.route.trim() || undefined,
        posX: Number.parseFloat(form.posX) || 0,
        posY: Number.parseFloat(form.posY) || 0,
        posZ: Number.parseFloat(form.posZ) || 0,
        floor: Number.parseInt(form.floor, 10) || 0,
      });
      setForm({ label: '', caption: '', route: '', posX: '', posY: '1.6', posZ: '', floor: '0' });
      onDone();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn(card, 'p-5')}>
      <div className="flex items-center gap-2.5">
        <h2 className="text-[16px] font-medium text-[#202124]">Tour stops</h2>
        <span className="rounded-full bg-[#f1f3f4] px-2.5 py-0.5 text-[12px] text-[#5f6368]">
          {twin.waypoints.length}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-[#5f6368]">
        Where the camera goes and what it says there. A route groups stops so a
        visitor can choose one — leave it blank to include a stop in every route.
      </p>

      {twin.waypoints.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {twin.waypoints.map((w, i) => (
            <li key={w.id} className="flex items-center gap-3 rounded-xl border border-[#dadce0] p-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[12px] font-medium tabular-nums text-[#5f6368]">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] text-[#202124]">
                  {w.label}
                  {w.route && (
                    <span className="ml-2 rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] text-[#1967d2]">
                      {w.route}
                    </span>
                  )}
                </span>
                <span className="block truncate font-mono text-[11.5px] text-[#80868b]">
                  {w.posX.toFixed(1)}, {w.posY.toFixed(1)}, {w.posZ.toFixed(1)}
                  {w.caption ? ` · ${w.caption}` : ''}
                </span>
              </span>
              <button
                onClick={async () => {
                  try { await twinsApi.removeWaypoint(slug, w.id); onDone(); }
                  catch (e) { onError(e); }
                }}
                aria-label={`Remove ${w.label}`}
                className="shrink-0 cursor-pointer rounded-full p-1.5 text-[#5f6368] transition-colors hover:bg-[#fce8e6] hover:text-[#c5221f]"
              >
                <MaterialIcon name="close" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-3.5">
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Stop name" maxLength={80} className={field} />
          <input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })}
            placeholder="Route (e.g. Kitchen)" maxLength={60} className={field} />
          <input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })}
            placeholder="Floor" inputMode="numeric" className={field} />
        </div>

        <input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })}
          placeholder="Caption shown at this stop (optional)" maxLength={300} className={cn(field, 'mt-2')} />

        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <input value={form.posX} onChange={(e) => setForm({ ...form, posX: e.target.value })}
            placeholder="X" inputMode="decimal" className={field} />
          <input value={form.posY} onChange={(e) => setForm({ ...form, posY: e.target.value })}
            placeholder="Y (eye height)" inputMode="decimal" className={field} />
          <input value={form.posZ} onChange={(e) => setForm({ ...form, posZ: e.target.value })}
            placeholder="Z" inputMode="decimal" className={field} />
          <button
            onClick={add}
            disabled={busy || !form.label.trim()}
            className="h-10 cursor-pointer rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40"
          >
            Add stop
          </button>
        </div>
      </div>
    </div>
  );
}

function Tags({
  slug,
  twin,
  onDone,
  onError,
}: {
  slug: string;
  twin: Awaited<ReturnType<typeof twinsApi.list>>[number];
  onDone: () => void;
  onError: (e: unknown) => void;
}) {
  const [form, setForm] = useState({ title: '', body: '', posX: '', posY: '1.5', posZ: '' });
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    try {
      await twinsApi.addTag(twin.id, slug, {
        title: form.title.trim(),
        body: form.body.trim() || undefined,
        posX: Number.parseFloat(form.posX) || 0,
        posY: Number.parseFloat(form.posY) || 0,
        posZ: Number.parseFloat(form.posZ) || 0,
      });
      setForm({ title: '', body: '', posX: '', posY: '1.5', posZ: '' });
      onDone();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn(card, 'p-5')}>
      <div className="flex items-center gap-2.5">
        <h2 className="text-[16px] font-medium text-[#202124]">Tags</h2>
        <span className="rounded-full bg-[#f1f3f4] px-2.5 py-0.5 text-[12px] text-[#5f6368]">
          {twin.tags.length}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-[#5f6368]">
        Pins on a specific point of the building — a fitting, a view, a finish worth
        naming. They stay on that point as the camera moves.
      </p>

      {twin.tags.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {twin.tags.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-xl border border-[#dadce0] p-2.5">
              <MaterialIcon name="place" size={17} className="shrink-0 text-[#1a73e8]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] text-[#202124]">{t.title}</span>
                <span className="block truncate font-mono text-[11.5px] text-[#80868b]">
                  {t.posX.toFixed(1)}, {t.posY.toFixed(1)}, {t.posZ.toFixed(1)}
                  {t.body ? ` · ${t.body}` : ''}
                </span>
              </span>
              <button
                onClick={async () => {
                  try { await twinsApi.removeTag(slug, t.id); onDone(); }
                  catch (e) { onError(e); }
                }}
                aria-label={`Remove ${t.title}`}
                className="shrink-0 cursor-pointer rounded-full p-1.5 text-[#5f6368] transition-colors hover:bg-[#fce8e6] hover:text-[#c5221f]"
              >
                <MaterialIcon name="close" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-3.5">
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Tag title" maxLength={80} className={field} />
          <input value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="What it says (optional)" maxLength={300} className={field} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <input value={form.posX} onChange={(e) => setForm({ ...form, posX: e.target.value })}
            placeholder="X" inputMode="decimal" className={field} />
          <input value={form.posY} onChange={(e) => setForm({ ...form, posY: e.target.value })}
            placeholder="Y" inputMode="decimal" className={field} />
          <input value={form.posZ} onChange={(e) => setForm({ ...form, posZ: e.target.value })}
            placeholder="Z" inputMode="decimal" className={field} />
          <button
            onClick={add}
            disabled={busy || !form.title.trim()}
            className="h-10 cursor-pointer rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40"
          >
            Add tag
          </button>
        </div>
      </div>
    </div>
  );
}
