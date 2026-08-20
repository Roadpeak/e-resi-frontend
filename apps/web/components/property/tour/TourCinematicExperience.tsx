'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowLeft, Box, Headset, Volume2, VolumeX, Maximize2,
  LayoutGrid, X, Play,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Property, CinematicScene, CinematicSceneCategory } from '../../../lib/types';
import { scrubbableVideoUrl, videoPosterUrl } from '../../../lib/media/video';

gsap.registerPlugin(ScrollTrigger);

// ── Category grouping ────────────────────────────────────────────────────────
const CATEGORY_ORDER: CinematicSceneCategory[] = [
  'full_tour', 'aerial', 'exterior', 'living_room',
  'kitchen', 'bedroom', 'bathroom', 'amenities', 'unit_type',
];

const CATEGORY_LABELS: Record<CinematicSceneCategory, string> = {
  full_tour:   'Full Tour',
  aerial:      'Aerial',
  exterior:    'Exterior',
  living_room: 'Living Room',
  kitchen:     'Kitchen',
  bedroom:     'Bedroom',
  bathroom:    'Bathroom',
  amenities:   'Amenities',
  unit_type:   'Unit Types',
};

interface Props { property: Property; }

export function TourCinematicExperience({ property }: Props) {
  const scenes = property.cinematicScenes ?? [];

  const scrollerRef     = useRef<HTMLDivElement>(null);
  const wrapperRef      = useRef<HTMLDivElement>(null);
  const videoRef        = useRef<HTMLVideoElement>(null);
  const phase1Ref       = useRef<HTMLDivElement>(null);
  const phase2Ref       = useRef<HTMLDivElement>(null);
  const progressBarRef  = useRef<HTMLDivElement>(null);
  const sceneLabelRef   = useRef<HTMLDivElement>(null);

  const [muted, setMuted]           = useState(true);
  /**
   * Phones get a smaller, width-capped encode. Seek latency — not fidelity —
   * is what breaks scrubbing on a handset, and a 4K master is slow to seek
   * however densely it is keyframed.
   */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const [progress, setProgress]     = useState(0);
  const [activeScene, setActiveScene] = useState<CinematicScene>(
    scenes.find((s) => s.category === 'full_tour') ?? scenes[0]
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filter, setFilter]         = useState<CinematicSceneCategory | 'all'>('all');

  // Groups for the picker
  const presentCategories = CATEGORY_ORDER.filter((cat) =>
    scenes.some((s) => s.category === cat)
  );

  const filteredScenes = filter === 'all'
    ? scenes
    : scenes.filter((s) => s.category === filter);

  // Animate scene label when scene changes
  const animateSceneLabel = useCallback(() => {
    if (!sceneLabelRef.current) return;
    gsap.fromTo(sceneLabelRef.current,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  // Switch scene: change video src and reset scroll
  const selectScene = useCallback((scene: CinematicScene) => {
    setActiveScene(scene);
    setPickerOpen(false);
    setProgress(0);

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.src = scrubbableVideoUrl(scene.videoUrl, isMobile);
      video.load();
      video.currentTime = 0;
    }

    // Reset ScrollTrigger progress
    ScrollTrigger.getAll().forEach((t) => {
      t.scroll(t.start);
    });

    animateSceneLabel();
    // isMobile is read here, so it belongs in the deps — without it a scene
    // switched after a rotation would keep the previous encode.
  }, [animateSceneLabel, isMobile]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;

    // loadedmetadata and canplay can both fire; without this the timeline and
    // ScrollTrigger get built twice and fight each other.
    let initialised = false;
    // Held so the effect's own cleanup can dispose them — returning a cleanup
    // from setup() went nowhere, since setup runs as an event handler, so every
    // scene switch leaked its context and its seek listeners.
    let ctx: gsap.Context | null = null;
    let cleanupSeek: (() => void) | null = null;

    const setup = () => {
      if (initialised) return;
      const duration = video.duration;
      if (!duration || isNaN(duration)) return;
      initialised = true;

      // Kill any previous triggers
      ScrollTrigger.getAll().forEach((t) => t.kill());

      ctx = gsap.context(() => {
        gsap.from(phase1Ref.current, {
          y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.3,
        });
        gsap.set(phase2Ref.current, { autoAlpha: 0, y: 30 });

        // Seeking is asynchronous, so a currentTime assignment made while the
        // decoder is still busy is dropped. Queue the newest requested time and
        // flush it when the decoder frees up, so the frame converges on where
        // the scroll actually is instead of drifting behind it.
        let pendingTime = -1;
        let seeking = false;
        const minDelta = 1 / 30;

        const flush = () => {
          if (pendingTime < 0) {
            seeking = false;
            return;
          }
          seeking = true;
          const t = pendingTime;
          pendingTime = -1;
          video.currentTime = t;
        };

        // 'error' as well as 'seeked': a seek into an unbuffered gap never
        // fires 'seeked', which would otherwise wedge `seeking` true forever
        // and freeze the video against further scrolling.
        const onSeeked = () => flush();
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onSeeked);
        cleanupSeek = () => {
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onSeeked);
        };

        ScrollTrigger.create({
          trigger: scrollerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
          onUpdate: (self) => {
            const p = self.progress;
            setProgress(p);

            const target = p * duration;
            // Compare against what the video is actually showing rather than a
            // time merely requested, so a dropped seek gets retried.
            const shown = pendingTime >= 0 ? pendingTime : video.currentTime;
            if (Math.abs(target - shown) >= minDelta) {
              pendingTime = target;
              if (!seeking) flush();
            }

            // Phase 1 — property identity fades out 0.25 → 0.38
            const p1out = Math.max(0, Math.min(1, (p - 0.25) / 0.13));
            if (phase1Ref.current) {
              gsap.set(phase1Ref.current, { autoAlpha: 1 - p1out, y: p1out * -40 });
            }

            // Phase 2 — developer CTA fades in at 0.78
            const p2in = Math.max(0, Math.min(1, (p - 0.78) / 0.10));
            if (phase2Ref.current) {
              gsap.set(phase2Ref.current, { autoAlpha: p2in, y: (1 - p2in) * 30 });
            }

            // Progress bar
            if (progressBarRef.current) {
              gsap.set(progressBarRef.current, { scaleX: p, transformOrigin: 'left center' });
            }
          },
        });
      }, wrapperRef);

      // The pin/scrub distance is resolved when the trigger is created, so it
      // is only right if layout has settled. With a cached video this runs
      // synchronously during mount, before that is true — re-measure after the
      // browser has painted.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
    };

    const onMeta = () => setup();

    if (video.readyState >= 1) setup();
    else {
      video.addEventListener('loadedmetadata', onMeta, { once: true });
      // Safari occasionally settles on readyState 1 without firing metadata again
      video.addEventListener('canplay', onMeta, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('canplay', onMeta);
      cleanupSeek?.();
      cleanupSeek = null;
      ctx?.revert();
      ctx = null;
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  // Re-run when active scene changes (video src swapped)
  }, [activeScene.id]);

  // Initial label animation
  useEffect(() => { animateSceneLabel(); }, [animateSceneLabel]);

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) wrapperRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div ref={scrollerRef} className="relative w-full bg-black" style={{ height: '500vh' }}>
    <div ref={wrapperRef} className="sticky top-0 h-screen w-full overflow-hidden bg-black">

      {/* ── Video ── */}
      <video
        ref={videoRef}
        src={scrubbableVideoUrl(activeScene.videoUrl, isMobile)}
        poster={videoPosterUrl(activeScene.videoUrl)}
        muted={muted}
        playsInline
        // metadata, not auto: scrubbing needs the duration and the ability to
        // range-request, not the whole file downloaded up front — which on
        // mobile data was buying a long wait before anything rendered.
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* ── Overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/5 to-black/65" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* ══════════════════════════════════════════
          TOP BAR
      ══════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <Link
            href={`/${property.slug}`}
            className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>{property.name}</span>
          </Link>
          <span className="text-white/15 text-xs">·</span>
          <span className="text-white/40 text-xs tracking-[0.15em] uppercase">Cinematic Tour</span>
        </div>

        <div className="flex items-center gap-2">
          {property.has3DTour && (
            <Link
              href={`/${property.slug}/tour/3d`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <Box size={12} /> 3D Tour
            </Link>
          )}
          {property.hasVRTour && (
            <Link
              href={`/${property.slug}/tour/vr`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-violet-500/20 bg-violet-500/10 backdrop-blur-sm px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/20 transition-all"
            >
              <Headset size={12} /> VR Tour
            </Link>
          )}
          {/* Scene picker toggle */}
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border backdrop-blur-sm px-3 py-1.5 text-xs transition-all cursor-pointer',
              pickerOpen
                ? 'border-warm-500/40 bg-warm-500/15 text-warm-300'
                : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10',
            )}
          >
            <LayoutGrid size={12} />
            <span className="hidden sm:inline">Scenes</span>
          </button>
          <button
            onClick={() => setMuted((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:text-white transition-all cursor-pointer"
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SCENE PICKER PANEL
      ══════════════════════════════════════════ */}
      {pickerOpen && (
        <div
          className="absolute inset-0 z-40 flex items-stretch"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
        >
          <div className="relative flex flex-col w-full max-w-3xl mx-auto my-20 sm:my-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 shrink-0">
              <div>
                <p className="text-white font-semibold text-base">Choose a Scene</p>
                <p className="text-white/40 text-xs mt-0.5">{scenes.length} scenes available</p>
              </div>
              <button
                onClick={() => setPickerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Category filter tabs */}
            <div className="flex gap-2 px-6 py-3 border-b border-white/8 shrink-0 overflow-x-auto">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs tracking-wide transition-all cursor-pointer',
                  filter === 'all'
                    ? 'bg-warm-500 text-white'
                    : 'border border-white/10 text-white/40 hover:text-white hover:border-white/30',
                )}
              >
                All
              </button>
              {presentCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-xs tracking-wide transition-all cursor-pointer',
                    filter === cat
                      ? 'bg-warm-500 text-white'
                      : 'border border-white/10 text-white/40 hover:text-white hover:border-white/30',
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Scene grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredScenes.map((scene) => {
                  const isActive = scene.id === activeScene.id;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => selectScene(scene)}
                      className={cn(
                        'group relative rounded-xl overflow-hidden aspect-video text-left cursor-pointer transition-all duration-200',
                        isActive ? 'ring-2 ring-warm-400' : 'hover:ring-1 hover:ring-white/30',
                      )}
                    >
                      {/* Thumbnail */}
                      {scene.thumbnailUrl ? (
                        <Image
                          src={scene.thumbnailUrl}
                          alt={scene.label}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-white/5" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-warm-500">
                          <Play size={8} className="fill-white text-white ml-0.5" />
                        </div>
                      )}

                      {/* Category badge */}
                      <div className="absolute top-2 left-2">
                        <span className={cn(
                          'text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded-full',
                          scene.category === 'full_tour'
                            ? 'bg-warm-500/80 text-white'
                            : 'bg-black/50 text-white/60',
                        )}>
                          {CATEGORY_LABELS[scene.category]}
                        </span>
                      </div>

                      {/* Label */}
                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
                        <p className="text-white text-xs font-medium leading-tight">{scene.label}</p>
                        {scene.sublabel && (
                          <p className="text-white/50 text-[10px] mt-0.5 truncate">{scene.sublabel}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Current scene label (bottom-left floating) ── */}
      <div
        ref={sceneLabelRef}
        className="absolute z-20 px-8 sm:px-14 lg:px-20"
        style={{ bottom: '14rem' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            'text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full',
            activeScene.category === 'full_tour'
              ? 'bg-warm-500/70 text-white'
              : 'border border-white/15 text-white/40',
          )}>
            {CATEGORY_LABELS[activeScene.category]}
          </span>
          {activeScene.sublabel && (
            <span className="text-white/35 text-[10px] tracking-[0.15em]">{activeScene.sublabel}</span>
          )}
        </div>
        <p
          className="font-display font-light text-white tracking-tight leading-none"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 4rem)' }}
        >
          {activeScene.label}
        </p>
      </div>

      {/* ── Progress bar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-px bg-white/10">
        <div ref={progressBarRef} className="h-full bg-warm-400 origin-left" style={{ transform: 'scaleX(0)' }} />
      </div>

      {/* ── Scroll hint ── */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 transition-opacity duration-500 pointer-events-none"
        style={{ opacity: progress < 0.05 ? 1 : 0 }}
      >
        <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase">Scroll to explore</span>
        <div className="w-px h-6 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
      </div>

      {/* ══════════════════════════════════
          PHASE 1 — Property identity
      ══════════════════════════════════ */}
      <div
        ref={phase1Ref}
        className="absolute bottom-16 left-0 right-0 z-20 px-8 sm:px-14 lg:px-20"
      >
        <div className="w-10 h-px bg-warm-500 mb-6" />
        <p className="text-white/40 text-xs tracking-[0.2em] uppercase mb-3">
          {property.address.neighborhood} · {property.address.city}
        </p>
        <h1
          className="font-display font-light text-white tracking-tight leading-none mb-4"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 7rem)' }}
        >
          {property.name}
        </h1>
        <p className="text-white/50 text-sm sm:text-base max-w-lg leading-relaxed">
          {property.tagline}
        </p>
      </div>

      {/* ══════════════════════════════════
          PHASE 2 — Developer + CTA
      ══════════════════════════════════ */}
      <div
        ref={phase2Ref}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center"
        style={{ pointerEvents: 'none' }}
      >
        <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase mb-5">Developed by</p>
        <p className="font-display font-light text-white text-2xl sm:text-3xl mb-2">
          {property.developer.name}
        </p>
        <p className="text-white/40 text-sm mb-12 max-w-sm">
          {property.developer.completedProjects} completed projects · Est. {property.developer.establishedYear}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4" style={{ pointerEvents: 'auto' }}>
          <Link
            href={`/${property.slug}`}
            className="inline-flex items-center gap-3 border border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white text-xs tracking-[0.12em] uppercase px-8 py-4 transition-all duration-500"
          >
            View Full Listing
            <span className="w-5 h-px bg-white" />
          </Link>
          <Link
            href={`/${property.slug}#booking`}
            className="inline-flex items-center gap-3 bg-warm-500 hover:bg-warm-400 text-white text-xs tracking-[0.12em] uppercase px-8 py-4 transition-all duration-500"
          >
            Book a Viewing
          </Link>
        </div>
      </div>

    </div>
    </div>
  );
}
