'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Heart, Loader2, MessageCircle, Search, X } from 'lucide-react';
import { compactCount, reelPoster, reelsApi, type Reel } from '../../../../lib/api/reels';
import { pricingApi } from '../../../../lib/api/admin';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';
import { ReelComments } from '../../../../components/reels/ReelComments';

const TABS = [
  { key: '', label: 'All' },
  { key: 'PUBLISHED', label: 'Live' },
  { key: 'HIDDEN', label: 'Hidden by owner' },
  { key: 'REMOVED', label: 'Removed' },
] as const;

/** Moderate property reels and set the unlock price. */
export default function AdminReelsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [playing, setPlaying] = useState<Reel | null>(null);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 4000); };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reels', status, query, page],
    queryFn: () => reelsApi.adminList({ status, q: query, page }),
  });

  const [price, setPrice] = useState('');
  useEffect(() => { if (data && price === '') setPrice(String(data.price)); }, [data, price]);
  const savePrice = useMutation({
    mutationFn: () => pricingApi.updateSetting('reels_unlock_fee', String(Math.max(0, Number(price) || 0))),
    onSuccess: () => { flash('Unlock price saved'); qc.invalidateQueries({ queryKey: ['admin-reels'] }); },
    onError: (e) => flash(e instanceof ApiError ? e.message : 'Could not save'),
  });

  const counts = data?.counts ?? {};
  const total = Object.values(counts).reduce((a, n) => a + n, 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-medium text-[#202124]">Property reels</h1>
          <p className="mt-1 text-[14px] text-[#5f6368]">Every reel agents and developers have posted. Remove anything that breaks the guidelines; the owner is notified.</p>
        </div>
        <div className="rounded-3xl border border-[#dadce0] bg-white p-4">
          <p className="text-[13px] font-medium text-[#202124]">Unlock price (one-time)</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center rounded-xl border border-[#dadce0] focus-within:border-[#1a73e8]">
              <span className="pl-3 text-[13px] text-[#5f6368]">{data?.currency ?? ''}</span>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="w-28 rounded-xl bg-transparent px-2 py-2 text-[14px] tabular-nums outline-none" />
            </span>
            <button type="button" onClick={() => savePrice.mutate()} disabled={savePrice.isPending || Number(price) === data?.price}
              className="rounded-full bg-[#1a73e8] px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40">Save</button>
          </div>
          <p className="mt-1.5 text-[12px] text-[#80868b]">0 makes reels free for every agent and developer.</p>
        </div>
      </header>

      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const n = t.key ? counts[t.key] ?? 0 : total;
            return (
              <button key={t.key} type="button" onClick={() => { setStatus(t.key); setPage(1); }}
                className={cn('rounded-full px-3.5 py-1.5 text-[13.5px] font-medium', status === t.key ? 'bg-[#e8f0fe] text-[#1967d2]' : 'text-[#5f6368] hover:bg-[#f1f3f4]')}>
                {t.label} <span className="tabular-nums opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); setPage(1); }} className="flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-3.5 py-1.5">
          <Search size={15} className="text-[#80868b]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caption, owner or area" className="w-52 bg-transparent text-[14px] outline-none" />
        </form>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 size={22} className="animate-spin text-[#9aa0a6]" /></div>
      ) : !data?.items.length ? (
        <p className="rounded-3xl border border-dashed border-[#dadce0] bg-white p-10 text-center text-[14px] text-[#5f6368]">No reels here.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {data.items.map((r) => (
            <AdminReelCard key={r.id} reel={r} onPlay={() => setPlaying(r)} onComments={() => setCommentsFor(r.id)}
              onDone={(m) => { flash(m); qc.invalidateQueries({ queryKey: ['admin-reels'] }); }} />
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-[#dadce0] px-4 py-1.5 text-[13.5px] disabled:opacity-40">Previous</button>
          <span className="text-[13.5px] text-[#5f6368]">Page {page} of {data.totalPages}</span>
          <button type="button" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-[#dadce0] px-4 py-1.5 text-[13.5px] disabled:opacity-40">Next</button>
        </div>
      )}

      {playing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPlaying(null)}>
          <div className="relative h-[85vh] aspect-[9/16] overflow-hidden rounded-2xl bg-black" onClick={(e) => e.stopPropagation()}>
            <video src={playing.videoUrl} className="h-full w-full object-contain" controls autoPlay playsInline />
            <button type="button" onClick={() => setPlaying(null)} aria-label="Close" className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white"><X size={18} /></button>
          </div>
        </div>
      )}

      {commentsFor && <ReelComments reelId={commentsFor} admin onClose={() => setCommentsFor(null)} onCountChange={() => qc.invalidateQueries({ queryKey: ['admin-reels'] })} />}
    </div>
  );
}

function AdminReelCard({ reel: r, onPlay, onComments, onDone }: { reel: Reel; onPlay: () => void; onComments: () => void; onDone: (m: string) => void }) {
  const [removing, setRemoving] = useState(false);
  const [reason, setReason] = useState('');
  const set = useMutation({
    mutationFn: (s: 'PUBLISHED' | 'REMOVED') => reelsApi.adminSetStatus(r.id, s, s === 'REMOVED' ? reason.trim() || undefined : undefined),
    onSuccess: (_x, s) => { setRemoving(false); setReason(''); onDone(s === 'REMOVED' ? 'Reel removed and owner notified' : 'Reel restored'); },
  });
  const poster = reelPoster(r);
  const pill = r.status === 'PUBLISHED' ? 'bg-[#e6f4ea] text-[#188038]' : r.status === 'HIDDEN' ? 'bg-[#f1f3f4] text-[#5f6368]' : 'bg-[#fce8e6] text-[#c5221f]';

  return (
    <li className="flex gap-3 rounded-3xl border border-[#dadce0] bg-white p-3">
      <button type="button" onClick={onPlay} className="relative aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-xl bg-black" aria-label="Play reel">
        {poster
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={poster} alt="" className="h-full w-full object-cover" />
          : <video src={`${r.videoUrl}#t=0.5`} muted playsInline preload="metadata" className="h-full w-full object-cover" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-[11.5px] font-medium', pill)}>{r.status === 'PUBLISHED' ? 'Live' : r.status === 'HIDDEN' ? 'Hidden' : 'Removed'}</span>
          <span className="text-[12px] text-[#80868b]">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
        {r.owner && <a href={r.owner.href} target="_blank" rel="noreferrer" className="mt-1.5 truncate text-[13.5px] font-medium text-[#1a73e8] hover:underline">{r.owner.name} <span className="font-normal text-[#80868b]">· {r.owner.kind === 'AGENT' ? 'Agent' : 'Developer'}</span></a>}
        <p className="mt-1 line-clamp-2 text-[13.5px] text-[#202124]">{r.caption || <span className="text-[#80868b]">No caption</span>}</p>
        {r.link && <p className="mt-0.5 truncate text-[12.5px] text-[#5f6368]">{r.link.deal === 'RENT' ? 'Rent' : 'Sale'} · {r.link.name}</p>}
        {r.status === 'REMOVED' && r.removedReason && <p className="mt-0.5 text-[12.5px] text-[#c5221f]">{r.removedReason}</p>}
        <p className="mt-auto flex items-center gap-3 pt-2 text-[12.5px] text-[#5f6368]">
          <span className="inline-flex items-center gap-1"><Eye size={12} /> {compactCount(r.viewCount)}</span>
          <span className="inline-flex items-center gap-1"><Heart size={12} /> {compactCount(r.likeCount)}</span>
          <button type="button" onClick={onComments} className="inline-flex items-center gap-1 font-medium text-[#1a73e8] hover:underline"><MessageCircle size={12} /> {r.commentCount}</button>
        </p>
        {removing ? (
          <div className="mt-2 space-y-1.5">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason shown to the owner" className="w-full rounded-lg border border-[#dadce0] px-2.5 py-1.5 text-[13px] outline-none focus:border-[#1a73e8]" />
            <div className="flex gap-1.5">
              <button type="button" onClick={() => set.mutate('REMOVED')} disabled={set.isPending} className="rounded-full bg-[#c5221f] px-3 py-1 text-[12px] font-medium text-white">Remove</button>
              <button type="button" onClick={() => setRemoving(false)} className="rounded-full px-3 py-1 text-[12px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Cancel</button>
            </div>
          </div>
        ) : r.status === 'REMOVED' ? (
          <button type="button" onClick={() => set.mutate('PUBLISHED')} disabled={set.isPending} className="mt-2 self-start rounded-full border border-[#dadce0] px-3 py-1 text-[12px] font-medium text-[#202124] hover:bg-[#f8f9fa]">Restore</button>
        ) : (
          <button type="button" onClick={() => setRemoving(true)} className="mt-2 self-start rounded-full px-3 py-1 text-[12px] font-medium text-[#c5221f] hover:bg-[#fce8e6]">Remove</button>
        )}
      </div>
    </li>
  );
}
