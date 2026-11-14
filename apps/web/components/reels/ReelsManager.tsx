'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check, Clapperboard, Eye, EyeOff, Heart, Link2, Loader2, Lock, MessageCircle, Plus, Trash2, Upload, X,
} from 'lucide-react';
import { compactCount, reelPoster, reelsApi, type LinkableListing, type Reel, type ReelsState } from '../../lib/api/reels';
import { billingApi } from '../../lib/api/billing';
import { uploadFile } from '../../lib/api/media';
import { ApiError } from '../../lib/api/client';
import { cn } from '../../lib/utils';
import { ReelComments } from './ReelComments';

const card = 'rounded-3xl border border-[#dadce0] bg-white p-5 sm:p-6';
const input = 'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[15px] text-[#202124] outline-none focus:border-[#1a73e8]';
const btn = 'inline-flex items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50';
const ghost = 'inline-flex items-center justify-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] disabled:opacity-50';

/**
 * An agent's or developer's reels: unlock (one-time, priced by e-resi),
 * post a reel linked to one of their listings, see how each performs,
 * hide or delete it, and answer comments.
 */
export function ReelsManager() {
  const base = usePathname().startsWith('/agent') ? '/agent' : '/dashboard';
  const wantsNew = useSearchParams().get('new') === '1';
  const qc = useQueryClient();
  const { data: st, isLoading } = useQuery({ queryKey: ['reels-state'], queryFn: reelsApi.state });
  const { data: reels = [] } = useQuery({ queryKey: ['reels-mine'], queryFn: reelsApi.mine, enabled: !!st?.unlocked });
  const [creating, setCreating] = useState(false);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  useEffect(() => { if (wantsNew && st?.unlocked) setCreating(true); }, [wantsNew, st?.unlocked]);

  if (isLoading || !st) return <div className="flex h-64 items-center justify-center"><Loader2 size={24} className="animate-spin text-[#9aa0a6]" /></div>;

  const totals = reels.reduce(
    (a, r) => ({ views: a.views + r.viewCount, likes: a.likes + r.likeCount, comments: a.comments + r.commentCount }),
    { views: 0, likes: 0, comments: 0 },
  );
  const stats = [
    { label: 'Views', n: totals.views, Icon: Eye },
    { label: 'Likes', n: totals.likes, Icon: Heart },
    { label: 'Comments', n: totals.comments, Icon: MessageCircle },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Property reels</h1>
          <p className="text-[14px] text-[#5f6368]">Short vertical videos of your homes, shown to buyers and tenants browsing e-resi.</p>
        </div>
        {st.unlocked && !creating && (
          <button type="button" onClick={() => setCreating(true)} className={btn}><Plus size={16} /> Create reel</button>
        )}
      </div>

      {!st.unlocked ? (
        <UnlockCard state={st} base={base} onDone={() => qc.invalidateQueries({ queryKey: ['reels-state'] })} />
      ) : (
        <>
          {creating && (
            <CreateReel
              onClose={() => setCreating(false)}
              onCreated={() => { setCreating(false); qc.invalidateQueries({ queryKey: ['reels-mine'] }); }}
            />
          )}

          <div className="grid grid-cols-3 gap-3">
            {stats.map(({ label, n, Icon }) => (
              <div key={label} className="rounded-2xl border border-[#dadce0] bg-white p-4">
                <p className="flex items-center gap-1.5 text-[13px] text-[#5f6368]"><Icon size={14} /> {label}</p>
                <p className="mt-1 text-[22px] tabular-nums text-[#202124]">{compactCount(n)}</p>
              </div>
            ))}
          </div>

          {reels.length === 0 && !creating ? (
            <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white p-10 text-center">
              <Clapperboard size={30} className="mx-auto text-[#dadce0]" />
              <p className="mt-3 text-[16px] font-medium text-[#202124]">No reels yet</p>
              <p className="mt-1 text-[14px] text-[#5f6368]">Film a 15 to 60 second walkthrough on your phone, held upright, and link it to the listing.</p>
              <button type="button" onClick={() => setCreating(true)} className={cn(btn, 'mt-5')}><Plus size={16} /> Create your first reel</button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {reels.map((r) => <ReelRow key={r.id} reel={r} onComments={() => setCommentsFor(r.id)} />)}
            </ul>
          )}
        </>
      )}

      {commentsFor && (
        <ReelComments
          reelId={commentsFor}
          onClose={() => setCommentsFor(null)}
          onCountChange={() => qc.invalidateQueries({ queryKey: ['reels-mine'] })}
        />
      )}
    </div>
  );
}

function UnlockCard({ state, base, onDone }: { state: ReelsState; base: string; onDone: () => void }) {
  const [err, setErr] = useState('');
  const [paying, setPaying] = useState(false);
  const unlock = useMutation({
    mutationFn: reelsApi.unlock,
    onSuccess: onDone,
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Could not start the unlock'),
  });

  async function pay(id: string) {
    setPaying(true);
    setErr('');
    try {
      const r = await billingApi.payInvoice(id);
      if (r.paid) onDone();
      else window.location.href = r.authorizationUrl;
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Payment could not be started');
    } finally {
      setPaying(false);
    }
  }

  return (
    <section className={card}>
      <div className="grid gap-6 md:grid-cols-[1fr_200px] md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef7e0] px-3 py-1 text-[12.5px] font-medium text-[#b06000]"><Lock size={12} /> Premium feature</span>
          <h2 className="mt-3 text-[22px] font-normal text-[#202124]">Unlock property reels</h2>
          <ul className="mt-3 space-y-2 text-[14.5px] text-[#3c4043]">
            {[
              'Post vertical video walkthroughs of your homes',
              'Each reel links straight to the listing, for sale or to rent',
              'Shown in the reels feed and on the sale and rent pages, to people interested in that area',
              'See views, likes and comments, and reply to buyers and tenants',
            ].map((t) => <li key={t} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#188038]" /> {t}</li>)}
          </ul>
          {err && <p className="mt-3 text-[13px] text-[#c5221f]">{err}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {state.invoice ? (
              <>
                <span className="text-[14px] text-[#b06000]">Invoice {state.invoice.number} · {state.invoice.currency} {state.invoice.total.toLocaleString()} due</span>
                <button type="button" onClick={() => pay(state.invoice!.id)} disabled={paying} className={btn}>{paying ? 'Starting…' : 'Pay by card'}</button>
                <Link href={`${base}/billing`} className={ghost}>M-Pesa / invoice</Link>
              </>
            ) : (
              <button type="button" onClick={() => unlock.mutate()} disabled={unlock.isPending} className={btn}>
                {unlock.isPending ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                {state.price > 0 ? `Unlock for ${state.currency} ${state.price.toLocaleString()}` : 'Unlock free'}
              </button>
            )}
          </div>
          {state.price > 0 && <p className="mt-2 text-[12.5px] text-[#80868b]">One-time payment. No monthly charge.</p>}
        </div>
        <div className="mx-auto hidden aspect-[9/16] w-36 items-center justify-center rounded-2xl bg-[#18181b] md:flex">
          <Clapperboard size={34} className="text-[#f9ab00]" />
        </div>
      </div>
    </section>
  );
}

function CreateReel({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { data: listings = [] } = useQuery({ queryKey: ['reels-linkable'], queryFn: reelsApi.linkable });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [duration, setDuration] = useState<number | undefined>();
  const [caption, setCaption] = useState('');
  const [link, setLink] = useState('');
  const [area, setArea] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(f?: File | null) {
    if (!f) return;
    if (!f.type.startsWith('video/')) { setErr('Choose a video file.'); return; }
    if (f.size > 1024 * 1024 * 1024) { setErr('That video is over 1 GB. Export it at 1080p and try again.'); return; }
    setErr('');
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  async function publish() {
    if (!file) { setErr('Choose a video first.'); return; }
    setErr('');
    setProgress(0);
    abort.current = new AbortController();
    try {
      const up = await uploadFile(file, 'tours', { onProgress: (p) => setProgress(p.percent), signal: abort.current.signal });
      const chosen: LinkableListing | undefined = listings.find((l) => `${l.deal}:${l.id}` === link);
      await reelsApi.create({
        videoUrl: up.url,
        caption: caption.trim() || undefined,
        durationSec: duration !== undefined ? Math.min(duration, 45) : undefined,
        ...(chosen?.deal === 'SALE' && { propertyId: chosen.id }),
        ...(chosen?.deal === 'RENT' && { rentListingId: chosen.id }),
        ...(!chosen && area.trim() && { neighborhood: area.trim() }),
      });
      onCreated();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Upload failed');
      setProgress(null);
    }
  }

  const sale = listings.filter((l) => l.deal === 'SALE');
  const rent = listings.filter((l) => l.deal === 'RENT');
  const busy = progress !== null;
  const where = (l: LinkableListing) => (l.neighborhood || l.city ? ` · ${l.neighborhood ?? l.city}` : '');

  return (
    <section className={card}>
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-normal text-[#202124]">New reel</h2>
        <button type="button" onClick={() => { abort.current?.abort(); onClose(); }} aria-label="Close" className="rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"><X size={18} /></button>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-[200px_1fr]">
        <div className="mx-auto w-44 md:w-auto">
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          {preview ? (
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black">
              <video
                src={preview}
                className="h-full w-full object-cover"
                muted
                playsInline
                controls
                onLoadedMetadata={(e) => setDuration(Math.round(e.currentTarget.duration * 10) / 10)}
              />
              {!busy && (
                <button type="button" onClick={() => fileRef.current?.click()} className="absolute left-2 top-2 rounded-full bg-white/90 px-3 py-1 text-[12px] font-medium text-[#202124]">Change</button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa]"
            >
              <Upload size={22} />
              <span className="text-[13.5px] font-medium">Choose video</span>
              <span className="px-4 text-center text-[12px] text-[#80868b]">Up to 45 seconds. Landscape videos are cropped to upright 9:16.</span>
            </button>
          )}
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">Caption</span>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={600}
              rows={3}
              placeholder="3 bed duplex in Kilimani with a rooftop terrace. Viewings this weekend."
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#5f6368]"><Link2 size={13} /> Link a listing</span>
            <select value={link} onChange={(e) => setLink(e.target.value)} className={input}>
              <option value="">No listing, just the video</option>
              {sale.length > 0 && (
                <optgroup label="For sale">{sale.map((l) => <option key={l.id} value={`SALE:${l.id}`}>{l.name}{where(l)}</option>)}</optgroup>
              )}
              {rent.length > 0 && (
                <optgroup label="For rent">{rent.map((l) => <option key={l.id} value={`RENT:${l.id}`}>{l.name}{where(l)}</option>)}</optgroup>
              )}
            </select>
            <span className="mt-1 block text-[12px] text-[#80868b]">Viewers get a button that opens the listing straight from the reel.</span>
          </label>
          {duration !== undefined && duration > 45 && (
            <p className="rounded-xl bg-[#fef7e0] px-3 py-2 text-[13px] text-[#b06000]">
              This video is {Math.round(duration)} seconds. Reels are up to 45 seconds, so only the first 45 seconds will be shown.
            </p>
          )}
          {!link && (
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">Area</span>
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Kilimani" className={input} />
            </label>
          )}
          {err && <p className="text-[13px] text-[#c5221f]">{err}</p>}
          {busy && (
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#f1f3f4]">
                <div className="h-full rounded-full bg-[#1a73e8] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-[12.5px] text-[#5f6368]">{(progress ?? 0) < 100 ? `Uploading ${progress}%` : 'Publishing…'}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={publish} disabled={busy || !file} className={btn}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Clapperboard size={15} />} Publish reel
            </button>
            <button type="button" onClick={() => { abort.current?.abort(); onClose(); }} className={ghost}>Cancel</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReelRow({ reel: r, onComments }: { reel: Reel; onComments: () => void }) {
  const qc = useQueryClient();
  const [confirmDel, setConfirmDel] = useState(false);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(r.caption ?? '');
  const refresh = () => qc.invalidateQueries({ queryKey: ['reels-mine'] });
  const update = useMutation({
    mutationFn: (b: Parameters<typeof reelsApi.update>[1]) => reelsApi.update(r.id, b),
    onSuccess: () => { setEditing(false); refresh(); },
  });
  const remove = useMutation({ mutationFn: () => reelsApi.remove(r.id), onSuccess: refresh });
  const poster = reelPoster(r);
  const pill = r.status === 'PUBLISHED'
    ? 'bg-[#e6f4ea] text-[#188038]'
    : r.status === 'HIDDEN' ? 'bg-[#f1f3f4] text-[#5f6368]' : 'bg-[#fce8e6] text-[#c5221f]';

  return (
    <li className="flex gap-3 rounded-3xl border border-[#dadce0] bg-white p-3">
      <a href={`/reels?start=${r.id}`} target="_blank" rel="noreferrer" className="relative aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-xl bg-black">
        {poster
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={poster} alt="" className="h-full w-full object-cover" />
          : <video src={`${r.videoUrl}#t=0.5`} muted playsInline preload="metadata" className="h-full w-full object-cover" />}
      </a>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-[11.5px] font-medium', pill)}>
            {r.status === 'PUBLISHED' ? 'Live' : r.status === 'HIDDEN' ? 'Hidden' : 'Removed by e-resi'}
          </span>
          <span className="text-[12px] text-[#80868b]">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} maxLength={600} className={cn(input, 'text-[14px]')} />
            <div className="flex gap-2">
              <button type="button" onClick={() => update.mutate({ caption })} className="rounded-full bg-[#1a73e8] px-3 py-1 text-[12.5px] font-medium text-white">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-full px-3 py-1 text-[12.5px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="mt-2 line-clamp-3 text-left text-[14px] text-[#202124] hover:text-[#1a73e8]">
            {r.caption || <span className="text-[#80868b]">Add a caption</span>}
          </button>
        )}
        {r.link && <p className="mt-1 truncate text-[12.5px] text-[#5f6368]">{r.link.deal === 'RENT' ? 'Rent' : 'Sale'} · {r.link.name}</p>}
        {r.status === 'REMOVED' && r.removedReason && <p className="mt-1 text-[12.5px] text-[#c5221f]">{r.removedReason}</p>}
        <p className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-[12.5px] text-[#5f6368]">
          <span className="inline-flex items-center gap-1"><Eye size={12} /> {compactCount(r.viewCount)}</span>
          <span className="inline-flex items-center gap-1"><Heart size={12} /> {compactCount(r.likeCount)}</span>
          <button type="button" onClick={onComments} className="inline-flex items-center gap-1 font-medium text-[#1a73e8] hover:underline">
            <MessageCircle size={12} /> {r.commentCount} · Reply
          </button>
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.status !== 'REMOVED' && (
            <button
              type="button"
              onClick={() => update.mutate({ status: r.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED' })}
              disabled={update.isPending}
              className="inline-flex items-center gap-1 rounded-full border border-[#dadce0] px-2.5 py-1 text-[12px] font-medium text-[#202124] hover:bg-[#f8f9fa]"
            >
              {r.status === 'PUBLISHED' ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Publish</>}
            </button>
          )}
          {confirmDel ? (
            <>
              <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending} className="rounded-full bg-[#c5221f] px-2.5 py-1 text-[12px] font-medium text-white">Delete for good</button>
              <button type="button" onClick={() => setConfirmDel(false)} className="rounded-full px-2.5 py-1 text-[12px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Keep</button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-[#c5221f] hover:bg-[#fce8e6]">
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
