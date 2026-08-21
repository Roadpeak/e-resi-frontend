'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import type { Property } from '../../lib/types';
import { playbackVideoUrl, videoPosterUrl } from '../../lib/media/video';
import { TourMark } from './TourMarks';

interface Props { property: Property; }

/**
 * The cinematic film, in place on the page.
 *
 * Distinct from the tours section above it: that one tells a buyer the tours
 * exist, this is the film itself, sitting where a developer chose to put it.
 *
 * Rewritten off the old warm-brown palette, which predates the blue accent and
 * left this the one section on a mini-site still wearing the previous brand.
 * The heading was "Scroll-driven flythrough" — our word for how it is built,
 * not a description a buyer has any use for.
 */
export function PropertyCinematicPreview({ property }: Props) {
  const previewVideo = property.cinematicScenes?.[0]?.videoUrl;
  const sceneCount = property.cinematicScenes?.length ?? 0;

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-400">
            <span className="text-brand-500">
              <TourMark kind="cinematic" size={16} />
            </span>
            Cinematic tour
          </p>
          <h2 className="text-3xl font-semibold text-gray-900">
            The film of {property.name}.
          </h2>
        </div>
        <Link
          href={`/${property.slug}/tour/cinematic`}
          className="hidden shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 sm:inline-flex"
          style={{ background: 'var(--brand, #1a73e8)' }}
        >
          <Play size={11} className="fill-current" />
          Watch it
        </Link>
      </div>

      <Link
        href={`/${property.slug}/tour/cinematic`}
        className="group relative block cursor-pointer overflow-hidden rounded-2xl"
      >
        {/* A development can be flagged as having a cinematic tour before its
            scenes are uploaded. Rendering a <video> with no src showed a black
            box with a play button that led nowhere; the still keeps the
            section intact until the film lands. */}
        {previewVideo ? (
          <video
            src={playbackVideoUrl(previewVideo)}
            // A poster frame where one can be derived. Without it the section
            // is a blank rectangle with a floating play button until the
            // metadata request returns — longest on exactly the connections
            // where it matters most.
            poster={videoPosterUrl(previewVideo)}
            muted
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-neutral-900 object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-video w-full bg-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
            <Play size={20} className="ml-1 fill-white text-white" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-6 py-5">
          {sceneCount > 0 && (
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
              {sceneCount} {sceneCount === 1 ? 'scene' : 'scenes'}
            </p>
          )}
          <p className="text-sm font-medium text-white">
            Shot on site, and it plays as you scroll.
          </p>
        </div>
      </Link>

      <div className="mt-4 sm:hidden">
        <Link
          href={`/${property.slug}/tour/cinematic`}
          className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand, #1a73e8)' }}
        >
          <Play size={11} className="fill-current" />
          Watch the film
        </Link>
      </div>
    </div>
  );
}
