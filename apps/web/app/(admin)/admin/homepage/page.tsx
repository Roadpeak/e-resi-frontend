'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Loader2, Trash2, Upload } from 'lucide-react';
import { pricingApi } from '../../../../lib/api/admin';
import { siteApi, type Home3D } from '../../../../lib/api/site';
import { uploadFile } from '../../../../lib/api/media';
import { ApiError } from '../../../../lib/api/client';
import { ModelShowcase } from '../../../../components/showcase/ModelShowcase';

const KEYS = {
  exterior: 'home_3d_exterior_url',
  interior: 'home_3d_interior_url',
  caption: 'home_3d_caption',
  link: 'home_3d_link',
} as const;

/** 12 bytes: the glTF binary header starts with ASCII "glTF". */
async function isGlb(file: File) {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return String.fromCharCode(...head) === 'glTF';
}

function Slot({ label, hint, url, onUploaded, onRemove }: {
  label: string; hint: string; url: string | null;
  onUploaded: (url: string) => Promise<void>; onRemove: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function pick(file: File) {
    setError('');
    if (!(await isGlb(file))) { setError('That is not a .glb file. Export the model as glTF Binary (.glb).'); return; }
    setPct(0);
    try {
      const up = await uploadFile(new File([file], file.name, { type: 'model/gltf-binary' }), 'tours', {
        onProgress: (p) => setPct(Math.round(((p as { percent?: number }).percent ?? 0))),
      });
      await onUploaded(up.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setPct(null);
    }
  }

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]"><Box size={19} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-[#202124]">{label}</p>
          <p className="text-[13px] text-[#5f6368]">{hint}</p>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-[12.5px] text-[#1a73e8]">{url.split('/').pop()}</a>
          ) : (
            <p className="mt-1 text-[12.5px] text-[#80868b]">No model yet</p>
          )}
        </div>
      </div>
      {error && <p className="mt-3 rounded-xl bg-[#fce8e6] px-3 py-2 text-[13px] text-[#c5221f]">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={pct !== null} onClick={() => input.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-60">
          {pct !== null ? <><Loader2 size={15} className="animate-spin" /> Uploading {pct}%</> : <><Upload size={15} /> {url ? 'Replace' : 'Upload'} .glb</>}
        </button>
        {url && (
          <button type="button" onClick={() => void onRemove()} className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[13.5px] font-medium text-[#c5221f] hover:bg-[#fce8e6]">
            <Trash2 size={15} /> Remove
          </button>
        )}
      </div>
      <input ref={input} type="file" accept=".glb,model/gltf-binary" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void pick(f); }} />
    </div>
  );
}

/** The homepage 3D showcase beside "Our Vision": outside and inside models. */
export default function AdminHomepagePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['home-3d'], queryFn: () => siteApi.home3d() });
  const [caption, setCaption] = useState('');
  const [link, setLink] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (data) { setCaption(data.caption ?? ''); setLink(data.link ?? ''); } }, [data]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 5000); };
  async function save(key: string, value: string, message: string) {
    setError('');
    try {
      await pricingApi.updateSetting(key, value);
      await qc.invalidateQueries({ queryKey: ['home-3d'] });
      flash(`${message} The homepage updates within 5 minutes.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save');
    }
  }

  if (isLoading || !data) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5f6368]" /></div>;
  const preview: Home3D = data;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[26px] font-medium text-[#202124]">Homepage 3D showcase</h1>
        <p className="mt-1 max-w-3xl text-[14px] text-[#5f6368]">
          Shown beside “Our Vision” on the homepage. Visitors drag to turn the model, scroll or pinch to zoom, and switch between
          Outside and Inside. Upload glTF Binary (.glb) files; keep each under about 20 MB, ideally Draco-compressed, so it loads quickly on phones.
          With one model the switch is hidden; with none the section shows text only.
        </p>
      </header>
      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}
      {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <Slot label="Outside" hint="The building from outside, shown first." url={data.exterior}
            onUploaded={(u) => save(KEYS.exterior, u, 'Outside model saved.')} onRemove={() => save(KEYS.exterior, '', 'Outside model removed.')} />
          <Slot label="Inside" hint="An interior: a unit, a show home or a lobby." url={data.interior}
            onUploaded={(u) => save(KEYS.interior, u, 'Inside model saved.')} onRemove={() => save(KEYS.interior, '', 'Inside model removed.')} />
          <div className="rounded-3xl border border-[#dadce0] bg-white p-5">
            <label className="block text-[13px] font-medium text-[#202124]">Caption (optional)</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder="e.g. W Residences, Kilimani — explore in 3D"
              className="mt-1 w-full rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] outline-none focus:border-[#1a73e8]" />
            <label className="mt-3 block text-[13px] font-medium text-[#202124]">Caption links to (optional)</label>
            <input value={link} onChange={(e) => setLink(e.target.value)} maxLength={200} placeholder="/w-residences-nairobi"
              className="mt-1 w-full rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] outline-none focus:border-[#1a73e8]" />
            <button type="button" onClick={async () => {
              await save(KEYS.caption, caption.trim(), 'Caption saved.');
              const l = link.trim();
              if (l && !l.startsWith('/')) { setError('The link must be a page on e-resi, starting with /'); return; }
              await save(KEYS.link, l, 'Caption saved.');
            }}
              className="mt-3 rounded-full bg-[#1a73e8] px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[#1765cc]">Save caption</button>
          </div>
        </div>
        <div className="rounded-3xl bg-[#080808] p-5">
          <p className="mb-3 text-[13px] font-medium text-white/70">Preview</p>
          {preview.exterior || preview.interior
            ? <ModelShowcase config={preview} />
            : <div className="flex h-[420px] items-center justify-center rounded-[28px] border border-dashed border-white/15 text-[14px] text-white/50">Upload a model to preview it here</div>}
        </div>
      </div>
    </div>
  );
}
