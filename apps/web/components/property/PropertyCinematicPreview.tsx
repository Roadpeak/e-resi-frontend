'use client';

import Link from 'next/link';
import { Film, Play } from 'lucide-react';
import type { Property } from '../../lib/types';

interface Props { property: Property; }

export function PropertyCinematicPreview({ property }: Props) {
  const previewVideo = property.cinematicScenes?.[0]?.videoUrl;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-400">
            <Film size={13} className="text-warm-500" /> Cinematic Tour
          </p>
          <h2 className="text-3xl font-semibold text-gray-900">
            Scroll-driven flythrough
          </h2>
        </div>
        <Link
          href={`/${property.slug}/tour/cinematic`}
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-warm-500/25 bg-warm-500/10 hover:bg-warm-500/20 text-warm-700 text-xs font-medium px-5 py-2.5 transition-all duration-300"
        >
          <Play size={11} className="fill-warm-700" />
          Enter Tour
        </Link>
      </div>

      {/* Preview card */}
      <Link href={`/${property.slug}/tour/cinematic`} className="group block relative rounded-2xl overflow-hidden cursor-pointer">
        <video
          src={previewVideo}
          muted
          playsInline
          preload="metadata"
          className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110">
            <Play size={20} className="text-white fill-white ml-1" />
          </div>
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-5">
          <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-1">{property.cinematicScenes?.length ?? 0} scenes · Scroll-driven</p>
          <p className="text-white font-medium text-sm">
            Explore {property.name} at your own pace
          </p>
        </div>

        {/* Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-warm-500/30 bg-warm-500/15 backdrop-blur-sm px-3 py-1">
          <Film size={10} className="text-warm-400" />
          <span className="text-warm-300 text-[10px] tracking-[0.15em] uppercase">Cinematic</span>
        </div>
      </Link>

      {/* Mobile CTA */}
      <div className="mt-4 sm:hidden">
        <Link
          href={`/${property.slug}/tour/cinematic`}
          className="flex items-center justify-center gap-2 w-full rounded-full border border-warm-500/25 bg-warm-500/10 text-warm-700 text-xs font-medium py-3 transition-all duration-300"
        >
          <Play size={11} className="fill-warm-700" />
          Enter Cinematic Tour
        </Link>
      </div>
    </div>
  );
}
