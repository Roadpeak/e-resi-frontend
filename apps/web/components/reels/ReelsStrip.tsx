'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Clapperboard, Eye, Play } from 'lucide-react';
import { compactCount, reelPoster, reelsApi } from '../../lib/api/reels';
import { cn } from '../../lib/utils';

/**
 * A row of reels to swipe through sideways, like the Reels shelf in an
 * Instagram or Facebook feed. Tapping one opens the full-screen viewer at
 * that reel. Renders nothing when there are no reels to show.
 */
export function ReelsStrip({
  deal, agentId, title = 'Property reels', className, tone = 'light',
}: {
  deal?: 'SALE' | 'RENT';
  agentId?: string;
  title?: string;
  className?: string;
  tone?: 'light' | 'plain';
}) {
  const { data } = useQuery({
    queryKey: ['reels-strip', deal ?? '', agentId ?? ''],
    queryFn: () => reelsApi.feed({ deal, agentId, limit: 12 }),
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  const qs = (start?: string) => {
    const p = new URLSearchParams();
    if (start) p.set('start', start);
    if (deal) p.set('deal', deal);
    if (agentId) p.set('agent', agentId);
    const s = p.toString();
    return `/reels${s ? `?${s}` : ''}`;
  };

  return (
    <section className={cn(tone === 'light' && 'rounded-3xl border border-black/[0.06] bg-white p-4 sm:p-5', className)} aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold text-[#18181b]">
          <Clapperboard size={18} className="text-[#f9ab00]" /> {title}
        </h2>
        <Link href={qs()} className="inline-flex shrink-0 items-center gap-0.5 text-[13.5px] font-medium text-[#1a73e8] hover:text-[#1765cc]">
          Watch all <ChevronRight size={15} />
        </Link>
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((r) => {
          const poster = reelPoster(r);
          return (
            <Link key={r.id} href={qs(r.id)}
              className="group relative aspect-[9/16] w-32 shrink-0 snap-start overflow-hidden rounded-2xl bg-[#18181b] sm:w-40">
              {poster
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={poster} alt={r.caption ?? 'Property reel'} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                : <video src={`${r.videoUrl}#t=0.5`} muted playsInline preload="metadata" className="h-full w-full object-cover" />}
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
              <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"><Play size={13} className="fill-white" /></span>
              {r.link && (
                <span className="absolute right-2 top-2 rounded-full bg-[#f9ab00] px-2 py-0.5 text-[10.5px] font-semibold text-[#18181b]">
                  {r.link.deal === 'RENT' ? 'Rent' : 'Sale'}
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                {r.owner && <span className="block truncate text-[12.5px] font-semibold">{r.owner.name}</span>}
                <span className="mt-0.5 flex items-center gap-1 text-[11.5px] text-white/80"><Eye size={11} /> {compactCount(r.viewCount)}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** A compact call to action that opens the reels viewer. */
export function WatchReelsButton({ deal, className }: { deal?: 'SALE' | 'RENT'; className?: string }) {
  return (
    <Link href={deal ? `/reels?deal=${deal}` : '/reels'}
      className={cn('flex items-center justify-between gap-3 rounded-2xl bg-[#18181b] px-4 py-3 text-white hover:bg-black', className)}>
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f9ab00] text-[#18181b]"><Clapperboard size={17} /></span>
        <span>
          <span className="block text-[14.5px] font-semibold">Watch property reels</span>
          <span className="block text-[12.5px] text-white/70">Short videos of homes, straight from agents</span>
        </span>
      </span>
      <ChevronRight size={18} className="text-white/70" />
    </Link>
  );
}
