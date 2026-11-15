'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowUpRight, ChevronDown, ChevronUp, Heart, Loader2, MapPin, MessageCircle, Share2, Volume2, VolumeX, Clapperboard,
} from 'lucide-react';
import { compactCount, reelPoster, reelsApi, type FeedParams, type Reel } from '../../lib/api/reels';
import { useAuthStore } from '../../lib/stores/auth.store';
import { cn, formatPrice } from '../../lib/utils';
import { ReelComments } from './ReelComments';
import { cdnImage } from '../../lib/media/cdn';

/**
 * The full-screen reels feed: one vertical video per screen, swipe or
 * scroll to the next, like Instagram Reels. The visible reel plays, the
 * rest pause; watch time is reported when a reel leaves the screen, which
 * is what the feed's recommender learns from.
 */
export function ReelsViewer({ params, backHref = '/properties' }: { params: Omit<FeedParams, 'offset' | 'limit'>; backHref?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();
  // Sound on by default. Browsers only allow that after the visitor has
  // interacted with the site (tapping a reel to get here counts); on a cold
  // open we fall back to muted and show a tap-for-sound prompt.
  const [muted, setMuted] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [landscape, setLandscape] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState(0);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [overrides, setOverrides] = useState<Record<string, Partial<Reel>>>({});
  const videos = useRef<Map<number, HTMLVideoElement>>(new Map());
  const slides = useRef<Map<number, HTMLElement>>(new Map());
  /** Snap to a reel by index — the desktop arrows and keyboard use this. */
  const goTo = (idx: number) => slides.current.get(idx)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const activeRef = useRef(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') { e.preventDefault(); goTo(activeRef.current + 1); }
      if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') { e.preventDefault(); goTo(activeRef.current - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const startedAt = useRef<{ idx: number; at: number } | null>(null);
  // Adaptive streaming: hls.js where the browser has no native HLS (Chrome,
  // Android, Firefox); Safari and iOS play the stream natively. One instance
  // per nearby reel, destroyed as it scrolls away.
  type HlsLike = { loadSource(u: string): void; attachMedia(v: HTMLVideoElement): void; destroy(): void };
  type HlsCtor = { new (cfg: Record<string, unknown>): HlsLike; isSupported(): boolean };
  const HlsRef = useRef<HlsCtor | null>(null);
  const hlsByIdx = useRef<Map<number, HlsLike>>(new Map());
  const [hlsReady, setHlsReady] = useState(false);
  useEffect(() => {
    let live = true;
    import('hls.js').then((m) => { if (live) { HlsRef.current = m.default as unknown as HlsCtor; setHlsReady(true); } }).catch(() => { if (live) setHlsReady(true); });
    const map = hlsByIdx.current;
    return () => { live = false; map.forEach((h) => h.destroy()); map.clear(); };
  }, []);

  /** Start the on-screen reel, with sound unless the browser refuses it. */
  const playActive = useCallback((v: HTMLVideoElement, start: number) => {
    if (Math.abs(v.currentTime - start) > 0.5) v.currentTime = start;
    v.muted = muted;
    v.play().catch((err: unknown) => {
      // Only an autoplay refusal means "no sound allowed"; a source still loading is not.
      if ((err as { name?: string })?.name !== 'NotAllowedError') return;
      v.muted = true;
      setMuted(true);
      setSoundBlocked(true);
      void v.play().catch(() => undefined);
    });
  }, [muted]);

  const feedKey = ['reels-feed', params];
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: feedKey,
    queryFn: ({ pageParam }) => reelsApi.feed({ ...params, offset: pageParam, limit: 8 }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const seen = new Set<string>();
  const reels = (data?.pages.flatMap((p) => p.items) ?? [])
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .map((r) => ({ ...r, ...overrides[r.id] }));

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2200); };

  // Report watch time for the reel that just left the screen.
  const report = useCallback(() => {
    const s = startedAt.current;
    if (!s) return;
    const r = reels[s.idx];
    if (r) void reelsApi.view(r.id, Date.now() - s.at).catch(() => undefined);
    startedAt.current = null;
  }, [reels]);

  // Which slide is on screen.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          const idx = Number((e.target as HTMLElement).dataset.idx);
          setActive(idx);
          activeRef.current = idx;
        }
      }
    }, { threshold: [0.6] });
    slides.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reels.length]);

  // Play the active one, pause the rest; start its watch clock.
  useEffect(() => {
    report();
    videos.current.forEach((v, idx) => {
      if (idx === active) {
        v.currentTime = reels[idx]?.trimStartSec ?? 0;
        playActive(v, reels[idx]?.trimStartSec ?? 0);
      } else v.pause();
    });
    if (reels[active]) startedAt.current = { idx: active, at: Date.now() };
    if (hasNextPage && !isFetchingNextPage && active >= reels.length - 3) void fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reels.length]);

  // Attach adaptive streams to the on-screen reel and the next one (so a
  // swipe starts instantly), and release the rest.
  useEffect(() => {
    if (!hlsReady) return;
    const Hls = HlsRef.current;
    videos.current.forEach((v, idx) => {
      const r = reels[idx];
      if (!r?.hlsUrl) return;
      const near = idx === active || idx === active + 1;
      const native = v.canPlayType('application/vnd.apple.mpegurl') !== '';
      const existing = hlsByIdx.current.get(idx);
      if (native) {
        if (near && !v.getAttribute('src')) { v.src = r.hlsUrl; if (idx === active) playActive(v, r.trimStartSec ?? 0); }
        return;
      }
      if (near && !existing) {
        if (Hls?.isSupported()) {
          const h = new Hls({ capLevelToPlayerSize: true, startLevel: -1, maxBufferLength: idx === active ? 30 : 8 });
          h.loadSource(r.hlsUrl);
          h.attachMedia(v);
          hlsByIdx.current.set(idx, h);
        } else if (!v.getAttribute('src')) {
          v.src = r.videoUrl; // no HLS support at all: the single MP4
        }
        if (idx === active) playActive(v, r.trimStartSec ?? 0);
      } else if (!near && existing && Math.abs(idx - active) > 2) {
        existing.destroy();
        hlsByIdx.current.delete(idx);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reels.length, hlsReady]);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') report(); };
    document.addEventListener('visibilitychange', onHide);
    return () => { document.removeEventListener('visibilitychange', onHide); report(); };
  }, [report]);

  useEffect(() => { videos.current.forEach((v) => { v.muted = muted; }); }, [muted]);

  async function toggleLike(r: Reel) {
    if (!isAuthenticated) { flash('Sign in to like reels'); return; }
    const on = !r.likedByMe;
    setOverrides((o) => ({ ...o, [r.id]: { ...o[r.id], likedByMe: on, likeCount: r.likeCount + (on ? 1 : -1) } }));
    try {
      const res = await reelsApi.like(r.id, on);
      setOverrides((o) => ({ ...o, [r.id]: { ...o[r.id], likedByMe: res.liked, likeCount: res.likeCount } }));
    } catch {
      setOverrides((o) => ({ ...o, [r.id]: { ...o[r.id], likedByMe: r.likedByMe, likeCount: r.likeCount } }));
    }
  }

  async function share(r: Reel) {
    const url = `${window.location.origin}/reels?start=${r.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: r.caption ?? 'Property reel on e-resi', url }); return; }
      await navigator.clipboard.writeText(url);
      flash('Link copied');
    } catch { /* dismissed */ }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black font-google text-white">
      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-3 pb-6 pt-[max(env(safe-area-inset-top),12px)] sm:px-6">
        <button type="button" onClick={() => (history.length > 1 ? router.back() : router.push(backHref))} aria-label="Back"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20">
          <ArrowLeft size={19} />
        </button>
        <p className="text-[16px] font-medium">Property reels</p>
        <button type="button" onClick={() => { setSoundBlocked(false); setMuted((m) => !m); }} aria-label={muted ? 'Unmute' : 'Mute'}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20">
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-full items-center justify-center"><Loader2 size={26} className="animate-spin text-white/60" /></div>
      ) : reels.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
          <Clapperboard size={34} className="text-white/40" />
          <p className="text-[17px] font-medium">No reels yet</p>
          <p className="max-w-xs text-[14px] text-white/60">Agents and developers are filming their homes. Check back soon.</p>
          <Link href={backHref} className="mt-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black">Browse properties</Link>
        </div>
      ) : (
        // data-lenis-prevent: the site-wide smooth scroller swallows wheel and trackpad
        // events, so without it this feed could not be scrolled on a computer at all.
        <div data-lenis-prevent className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {reels.map((r, idx) => (
            <section key={r.id} data-idx={idx} ref={(el) => { if (el) slides.current.set(idx, el); else slides.current.delete(idx); }}
              className="relative flex h-[100dvh] w-full snap-start snap-always items-center justify-center">
              <div className="relative h-full w-full sm:h-[calc(100dvh-32px)] sm:w-auto sm:aspect-[9/16] sm:overflow-hidden sm:rounded-2xl">
                <video
                  ref={(el) => { if (el) videos.current.set(idx, el); else videos.current.delete(idx); }}
                  // Streams are attached in an effect; plain MP4s load for nearby reels.
                  src={!r.hlsUrl && Math.abs(idx - active) <= 2 ? r.videoUrl : undefined}
                  poster={reelPoster(r) ?? undefined}
                  className={cn('h-full w-full bg-black', landscape[r.id] ? 'object-contain' : 'object-cover')}
                  // Never more than 45 seconds: an untrimmed upload plays its chosen window, then loops it.
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    const start = r.trimStartSec ?? 0;
                    if (v.currentTime >= start + 45 || v.currentTime < start - 0.5) v.currentTime = start;
                  }}
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (r.trimStartSec) v.currentTime = r.trimStartSec;
                    if (v.videoWidth > v.videoHeight && !landscape[r.id]) setLandscape((l) => ({ ...l, [r.id]: true }));
                  }}
                  playsInline loop preload={idx === active || idx === active + 1 ? 'auto' : 'metadata'}
                  onClick={(e) => { const v = e.currentTarget; if (v.paused) void v.play(); else v.pause(); }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Right rail */}
                <div className="absolute bottom-28 right-3 flex flex-col items-center gap-5 sm:bottom-24">
                  <button type="button" onClick={() => toggleLike(r)} aria-pressed={r.likedByMe} aria-label="Like" className="flex flex-col items-center gap-1">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm">
                      <Heart size={24} className={cn(r.likedByMe ? 'fill-[#ff3040] text-[#ff3040]' : 'text-white')} />
                    </span>
                    <span className="text-[12.5px] font-medium">{compactCount(r.likeCount)}</span>
                  </button>
                  <button type="button" onClick={() => setCommentsFor(r.id)} aria-label="Comments" className="flex flex-col items-center gap-1">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm"><MessageCircle size={23} /></span>
                    <span className="text-[12.5px] font-medium">{compactCount(r.commentCount)}</span>
                  </button>
                  <button type="button" onClick={() => share(r)} aria-label="Share" className="flex flex-col items-center gap-1">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm"><Share2 size={21} /></span>
                    <span className="text-[12.5px] font-medium">Share</span>
                  </button>
                </div>

                {/* Bottom: who, what, where, and the way to the listing */}
                <div className="absolute inset-x-0 bottom-0 px-4 pb-[max(env(safe-area-inset-bottom),18px)] pr-20">
                  {r.owner && (
                    <Link href={r.owner.href} className="mb-2 inline-flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white text-[13px] font-medium text-black">
                        {r.owner.imageUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={cdnImage(r.owner.imageUrl, 32)} alt="" className="h-full w-full object-cover" />
                          : r.owner.name.slice(0, 1)}
                      </span>
                      <span className="text-[14.5px] font-semibold">{r.owner.name}</span>
                    </Link>
                  )}
                  {r.caption && <p className="line-clamp-3 whitespace-pre-line text-[14px] leading-snug text-white/95">{r.caption}</p>}
                  {(r.neighborhood || r.city) && (
                    <p className="mt-1.5 flex items-center gap-1 text-[13px] text-white/80"><MapPin size={13} className="text-[#f9ab00]" /> {[r.neighborhood, r.city].filter(Boolean).join(', ')}</p>
                  )}
                  {r.link && (
                    <Link href={r.link.href}
                      className="mt-3 flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-2.5 text-[#18181b] hover:bg-white">
                      <span className="min-w-0">
                        <span className="block text-[11.5px] font-medium uppercase tracking-wide text-[#5f6368]">{r.link.deal === 'RENT' ? 'For rent' : 'For sale'}</span>
                        <span className="block truncate text-[14.5px] font-semibold">{r.link.name}</span>
                        {!!r.link.priceFrom && (
                          <span className="block text-[13px] text-[#3c4043]">
                            {r.link.deal === 'RENT' ? '' : 'From '}{formatPrice(r.link.priceFrom, r.link.currency)}{r.link.deal === 'RENT' ? ' / month' : ''}
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#f9ab00] px-3 py-1.5 text-[13px] font-semibold">
                        View <ArrowUpRight size={14} />
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </section>
          ))}
          {isFetchingNextPage && <div className="flex h-24 items-center justify-center"><Loader2 size={20} className="animate-spin text-white/60" /></div>}
        </div>
      )}

      {/* Desktop: previous / next buttons beside the reel (keyboard arrows do the same). */}
      {reels.length > 1 && (
        <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:flex">
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous reel"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-30">
            <ChevronUp size={22} />
          </button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active >= reels.length - 1} aria-label="Next reel"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-30">
            <ChevronDown size={22} />
          </button>
        </div>
      )}

      {soundBlocked && muted && reels.length > 0 && (
        <button type="button" onClick={() => { setSoundBlocked(false); setMuted(false); const v = videos.current.get(active); if (v) { v.muted = false; void v.play(); } }}
          className="absolute left-1/2 top-20 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-[13.5px] font-medium text-black shadow-lg">
          <VolumeX size={15} /> Tap for sound
        </button>
      )}

      {toast && (
        <div className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-[13.5px] font-medium text-black shadow-lg">
          {toast === 'Sign in to like reels'
            ? <Link href={`/login?redirect=${encodeURIComponent(`${pathname}${typeof window !== 'undefined' ? window.location.search : ''}`)}`}>Sign in to like reels</Link>
            : toast}
        </div>
      )}

      {commentsFor && (
        <ReelComments
          reelId={commentsFor}
          onClose={() => setCommentsFor(null)}
          onCountChange={(d) => {
            const r = reels.find((x) => x.id === commentsFor);
            if (r) setOverrides((o) => ({ ...o, [r.id]: { ...o[r.id], commentCount: Math.max(0, r.commentCount + d) } }));
            void qc;
          }}
        />
      )}
    </div>
  );
}
