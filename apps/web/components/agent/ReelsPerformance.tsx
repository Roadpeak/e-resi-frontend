'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Clapperboard, Eye, Heart, MessageCircle, Play } from 'lucide-react';
import { compactCount, reelPoster, reelsApi } from '../../lib/api/reels';
import { cdnImage } from '../../lib/media/cdn';

/**
 * How the agent's property reels are doing: totals across live reels and the
 * best performers by views. Locked accounts get the way to start instead.
 */
export function ReelsPerformance({ className }: { className?: string }) {
  const { data: state } = useQuery({ queryKey: ['reels', 'state'], queryFn: () => reelsApi.state() });
  const { data: reels, isLoading } = useQuery({
    queryKey: ['reels', 'mine'],
    queryFn: () => reelsApi.mine(),
    enabled: !!state?.unlocked,
  });

  const live = (reels ?? []).filter((r) => r.status === 'PUBLISHED');
  const sum = (k: 'viewCount' | 'likeCount' | 'commentCount') => live.reduce((n, r) => n + (r[k] ?? 0), 0);
  const views = sum('viewCount');
  const likes = sum('likeCount');
  const comments = sum('commentCount');
  const engagement = views ? ((likes + comments) / views) * 100 : 0;
  const top = [...live].sort((a, b) => b.viewCount - a.viewCount).slice(0, 3);

  return (
    <section className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[18px] font-normal text-[#202124]">
          <Clapperboard size={18} className="text-[#5f6368]" /> Your reels
        </h2>
        <div className="flex gap-2">
          <Link href="/agent/reels" className="text-[14px] font-medium text-[#1a73e8] hover:underline">Manage reels</Link>
        </div>
      </div>

      {state && !state.unlocked ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#f8f9fa] px-5 py-4">
          <p className="max-w-[60ch] text-[14px] text-[#3c4043]">
            Short vertical videos of your homes, shown in the reels feed and on your listings. Unlock reels to start posting and see how they perform here.
          </p>
          <Link href="/agent/reels" className="rounded-full bg-[#202124] px-5 py-2 text-[14px] font-medium text-white hover:bg-black">Create a reel</Link>
        </div>
      ) : isLoading || !state ? (
        <p className="py-6 text-center text-[14px] text-[#5f6368]">Loading…</p>
      ) : live.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#f8f9fa] px-5 py-4">
          <p className="text-[14px] text-[#3c4043]">No live reels yet. Post one and its views, likes and comments show up here.</p>
          <Link href="/agent/reels" className="rounded-full bg-[#202124] px-5 py-2 text-[14px] font-medium text-white hover:bg-black">Create a reel</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Live reels', value: String(live.length), Icon: Clapperboard },
              { label: 'Views', value: compactCount(views), Icon: Eye },
              { label: 'Likes', value: compactCount(likes), Icon: Heart },
              { label: 'Comments', value: compactCount(comments), Icon: MessageCircle },
              { label: 'Engagement', value: `${engagement.toFixed(engagement >= 10 ? 0 : 1)}%`, Icon: Play },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="rounded-2xl border border-[#dadce0] px-4 py-3">
                <p className="flex items-center gap-1.5 text-[12.5px] text-[#5f6368]"><Icon size={14} />{label}</p>
                <p className="mt-1.5 text-[22px] font-normal leading-none tabular-nums text-[#202124]">{value}</p>
              </div>
            ))}
          </div>

          <p className="mb-2 mt-5 text-[13px] font-medium text-[#5f6368]">Top reels by views</p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {top.map((r) => {
              const poster = reelPoster(r);
              return (
                <li key={r.id}>
                  <Link href={`/reels?start=${r.id}`} target="_blank" rel="noreferrer" className="flex gap-3 rounded-2xl border border-[#dadce0] p-2.5 transition-colors hover:bg-[#f8f9fa]">
                    <span className="relative h-[84px] w-[56px] shrink-0 overflow-hidden rounded-xl bg-[#202124]">
                      {poster && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cdnImage(poster, 112, 168)} alt="" className="h-full w-full object-cover" loading="lazy" />
                      )}
                      <Play size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-white text-white" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[13.5px] text-[#202124]">{r.caption || 'Untitled reel'}</span>
                      <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] tabular-nums text-[#5f6368]">
                        <span className="inline-flex items-center gap-1"><Eye size={13} />{compactCount(r.viewCount)}</span>
                        <span className="inline-flex items-center gap-1"><Heart size={13} />{compactCount(r.likeCount)}</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle size={13} />{compactCount(r.commentCount)}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
