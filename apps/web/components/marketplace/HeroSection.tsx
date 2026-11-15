'use client';

import { useEffect, useRef, type Ref } from 'react';
import Link from 'next/link';
import { announceHeroBlue } from '../../lib/hero-blue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, Headset, Box, ArrowRight, Film, Building2, KeyRound, PlusCircle, ScanLine } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/** Pinned scroll length in screen heights. Phases 1–2 were designed for BASE; phase 3 uses the rest. */
const BASE_SCREENS = 5;
const TOTAL_SCREENS = 6.5;
const BASE_SCREENS_MOBILE = 2.5;
const TOTAL_SCREENS_MOBILE = 3.25;

/** The blue chooser's ground: electric blue at the top fading to white, colour-sampled from a reference down its full height. */
const HERO_BLUE_GRADIENT =
  'linear-gradient(180deg, #0149FE 0%, #205EFE 12.5%, #4B7EFE 29%, #749CFE 46%, #9FBAFF 62.5%, #B5CBFF 71%, #DAE4FE 79%, #F2F4FF 87.5%, #FFFFFF 100%)';

/** The end-of-hero chooser: Buy / Rent / List share one segmented white button; the tours offer sits below it on glass. */
const SEGMENTS = [
  { href: '/properties', title: 'Buy', Icon: Building2 },
  { href: '/rent', title: 'Rent', Icon: KeyRound },
  { href: '/list-development', title: 'List', Icon: PlusCircle },
] as const;
const TOURS = { href: '/for-developers', title: 'Get 3D and VR tours for your property', Icon: ScanLine } as const;

/** A magnifying glass with a house in its lens: "find a home". */
function HomeSearchMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="27" cy="27" r="19" strokeWidth="3.2" />
      <path d="M41 41 54.5 54.5" strokeWidth="5.5" />
      <path d="M17.5 28.5 27 20l9.5 8.5" strokeWidth="2.8" />
      <path d="M20.5 26v10.5h13V26" strokeWidth="2.8" />
      <path d="M25 36.5v-5h4v5" strokeWidth="2.4" />
    </svg>
  );
}

/** Tablet and desktop: the pinned film hero with its three scroll phases. */
function CinematicHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const scrollIndRef = useRef<HTMLDivElement>(null);
  // Phase 2 — VR / 3D / Cinematic panels
  const phase2Ref = useRef<HTMLDivElement>(null);
  const vrCardRef = useRef<HTMLDivElement>(null);
  const tdCardRef = useRef<HTMLDivElement>(null);
  const cinCardRef = useRef<HTMLDivElement>(null);
  const phase2HeadRef = useRef<HTMLDivElement>(null);
  // Phase 3: the film gives way to e-resi blue and a plain "what are you here for" chooser.
  const phase3BgRef = useRef<HTMLDivElement>(null);
  const phase3Ref = useRef<HTMLDivElement>(null);
  const phase3HeadRef = useRef<HTMLDivElement>(null);
  const phase3GridRef = useRef<HTMLDivElement>(null);

  // Builds the pinned, scrub-driven hero — immediately, not once the video's
  // duration is known.
  //
  // It used to wait for metadata, and that gate was a landing-page bug in two
  // parts. Until the video yielded a duration the hero had no ScrollTrigger at
  // all — a plain 100vh section a visitor scrolls past in one flick, which on a
  // slow connection is the first N seconds of the page's centrepiece. Worse,
  // when metadata finally arrived mid-scroll, building the pin injected five
  // viewport-heights of spacer at the top of the document: everything below
  // teleported down, and the showcase's already-measured trigger was left
  // pointing at positions that no longer existed — pins refusing to engage,
  // black voids where sections should be.
  //
  // The pin never needed the duration. Only the seek multiplier does, so the
  // duration lives in a ref that starts null: the rig builds on mount into a
  // layout that never shifts, and the scrub starts driving frames the moment
  // metadata lands — snapping first to wherever the scroll already is.
  //
  // Scroll restoration is deliberately not handled here — SmoothScroll owns
  // Lenis and so can reset the window and Lenis's own position together, where
  // this component could only ever reset the window.
  // The scrubbed film is 9.8 MB and every scroll step is a decoder seek —
  // heavy for a phone on mobile data, and the cause of scroll stutter there.
  // Phones (and anyone with data saver on) keep the poster, which is the
  // film's first frame; the scroll-driven text phases run the same. The
  // source is attached after mount, so the HTML never starts the download.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || video.getAttribute('src')) return;
    const wide = window.matchMedia('(min-width: 768px)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (wide && !saveData) video.src = '/videos/hero1.mp4';
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Phones get MobileHero instead; this one is display:none there, so pinning it would only add dead scroll.
    if (window.matchMedia('(max-width: 767px)').matches) return;

    video.pause();
    // Paused, scrub-driven video paints nothing until a seek resolves. Ask for
    // a frame immediately so the hero shows imagery before the first scroll.
    if (video.currentTime === 0) video.currentTime = 0.01;

    // null until metadata arrives; the poster covers the wait.
    const durationRef = { current: null as number | null };
    // Progress is remembered so a late-arriving duration can seek straight to
    // where the visitor already is, rather than to wherever the video was.
    const progressRef = { current: 0 };

    let removeVideoListeners: (() => void) | null = null;

    const ctx = gsap.context(() => {

      // ── Entrance sequence ──
      // Safe to always play: SmoothScroll guarantees we start at the top,
      // so the intro never animates over values the scrub already owns.
      const tl = gsap.timeline({ delay: 0.3 });
      tl.from(lineRef.current, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.2,
        ease: 'power4.out',
      })
      .from('.hero-word', {
        y: '110%',
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'power4.out',
      }, '-=0.8')
      .from(subRef.current, {
        y: 24,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      }, '-=0.4')
      .from(ctaRef.current, {
        y: 16,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      }, '-=0.3')
      .from(scrollIndRef.current, {
        opacity: 0,
        duration: 0.6,
      }, '-=0.2');

      // ── Phase 2 hidden initially ──
      gsap.set(phase2Ref.current, { autoAlpha: 0 });
      gsap.set(vrCardRef.current, { autoAlpha: 0, x: -60 });
      gsap.set(tdCardRef.current, { autoAlpha: 0, x: 60 });
      gsap.set(cinCardRef.current, { autoAlpha: 0, y: 40 });

      // ── Phase 3 hidden initially ──
      gsap.set(phase3BgRef.current, { autoAlpha: 0 });
      gsap.set(phase3Ref.current, { autoAlpha: 0 });
      gsap.set(phase3HeadRef.current, { autoAlpha: 0, y: 30 });
      gsap.set(phase3GridRef.current, { autoAlpha: 0, y: 40 });
      gsap.set(phase2HeadRef.current, { autoAlpha: 0, y: 30 });

      // ── Main scroll driver ──
      // A phone travels five screen-heights of finger-scrolling to clear a
      // 500% pin while seeking a video frame the whole way. Shorten the
      // travel, lighten the scrub, and ask for fewer seeks — mobile decoders
      // are far slower, and a seek queue that cannot keep up is the stutter.
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      const minDelta = isMobile ? 1 / 12 : 1 / 24;

      // Seeking is asynchronous: assigning currentTime while the decoder is
      // still seeking is dropped on the floor. Dropping the *request* along
      // with it broke reverse scrubbing: a backward seek jumps to an earlier
      // keyframe and decodes forward to the target, so it is much slower
      // than a forward one, and with Lenis still easing out scroll events
      // the decoder was busy for most frames of an upward scroll. Nearly
      // every seek got dropped, the video lagged half its length behind the
      // scroll, and the stale frames only caught up whenever a much later
      // event slipped one through — which read as the second half of the
      // video playing by itself, well after the scrolling stopped.
      //
      // So: never drop, defer. While the decoder is busy the latest target
      // is parked in `pending`, and the `seeked` handler issues it the
      // moment the in-flight seek lands. Latest wins; the video converges
      // to wherever the scroll actually is, in one corrective step, in
      // both directions. Because `pending` is re-issued from an event
      // rather than a poll, a missed frame cannot strand it.
      //
      // Driven straight from onUpdate rather than gsap.ticker: a ticker
      // callback registered inside gsap.context() is torn down when that
      // context reverts, which left the video frozen with the pin still
      // running. onUpdate fires on every scrub frame anyway.
      let pending: number | null = null;
      const seekTo = (time: number) => {
        if (video.seeking) {
          pending = time;
          return;
        }
        if (Math.abs(time - video.currentTime) < minDelta) return;
        video.currentTime = time;
      };
      const onSeeked = () => {
        if (pending === null) return;
        const target = pending;
        pending = null;
        // Same threshold as seekTo, so this cannot ping-pong: a target
        // within minDelta of where the decoder just landed is done.
        if (Math.abs(target - video.currentTime) < minDelta) return;
        video.currentTime = target;
      };
      video.addEventListener('seeked', onSeeked);

      // Metadata may land after the visitor has already scrolled — the pin
      // no longer waits for it. Snap the frame to where they are, not to
      // wherever the video happened to be.
      const onMeta = () => {
        if (!video.duration || isNaN(video.duration)) return;
        durationRef.current = video.duration;
        seekTo(progressRef.current * video.duration);
      };
      video.addEventListener('loadedmetadata', onMeta);
      // Already loaded (cached, or a remount that reused the resource).
      if (video.readyState >= 1) onMeta();

      // The video listeners live on a DOM element gsap did not create, so
      // revert() would leave them behind. Handed to the outer effect's own
      // cleanup instead — not ctx.add(), which cannot be called from inside
      // the context callback (`ctx` does not exist yet while it runs).
      removeVideoListeners = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('loadedmetadata', onMeta);
      };

      let blueShown = false;
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: isMobile ? `+=${TOTAL_SCREENS_MOBILE * 100}%` : `+=${TOTAL_SCREENS * 100}%`,
        pin: true,
        scrub: isMobile ? 0.6 : 1.5,
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;
          // Phases 1 and 2 were laid out for a shorter pin; q keeps them at the
          // same scroll distance they always had, and phase 3 gets the rest.
          const q = Math.min(1, p * (isMobile ? TOTAL_SCREENS_MOBILE / BASE_SCREENS_MOBILE : TOTAL_SCREENS / BASE_SCREENS));

          // Video scrub — full duration across full scroll. Until metadata
          // arrives there is nothing to seek; the poster holds the frame
          // and onMeta catches the scrub up the moment there is.
          if (durationRef.current) seekTo(p * durationRef.current);

          // ── Phase 1: 0 → 0.28  (headline visible → fades out) ──
          const p1out = Math.max(0, Math.min(1, (q - 0.18) / 0.12)); // fades 0.18→0.30
          if (headlineRef.current) {
            gsap.set(headlineRef.current, {
              y: p1out * -80,
              opacity: 1 - p1out,
            });
          }
          if (subRef.current)  gsap.set(subRef.current,  { opacity: 1 - p1out * 1.4 });
          if (ctaRef.current)  gsap.set(ctaRef.current,  { opacity: 1 - p1out * 1.4 });
          if (lineRef.current) gsap.set(lineRef.current, { opacity: 1 - p1out });
          if (scrollIndRef.current) gsap.set(scrollIndRef.current, { opacity: Math.max(0, 1 - q * 6) });

          // ── Phase 2: 0.32 → 0.72 (VR/3D panel fades in, stays, fades out) ──
          const p2in  = Math.max(0, Math.min(1, (q - 0.32) / 0.12)); // fade in
          const p2out = Math.max(0, Math.min(1, (q - 0.62) / 0.12)); // fade out

          const p2Opacity = p2in * (1 - p2out);

          if (phase2Ref.current)    gsap.set(phase2Ref.current,    { autoAlpha: p2Opacity });
          if (phase2HeadRef.current) {
            gsap.set(phase2HeadRef.current, {
              autoAlpha: p2Opacity,
              y: (1 - p2in) * 30,
            });
          }
          if (vrCardRef.current) {
            gsap.set(vrCardRef.current, {
              autoAlpha: p2Opacity,
              x: (1 - p2in) * -60,
            });
          }
          if (tdCardRef.current) {
            gsap.set(tdCardRef.current, {
              autoAlpha: p2Opacity,
              x: (1 - p2in) * 60,
            });
          }
          if (cinCardRef.current) {
            gsap.set(cinCardRef.current, {
              autoAlpha: p2Opacity,
              y: (1 - p2in) * 40,
            });
          }

          // ── Phase 3: the film gives way to blue, then the chooser rises in and holds ──
          // Starts as phase 2 leaves (q ≈ 0.70); measured in q-space so it lines up
          // on phones and desktop alike, then holds to the end of the pin.
          const p3bg   = Math.max(0, Math.min(1, (q - 0.70) / 0.14));
          const p3head = Math.max(0, Math.min(1, (q - 0.80) / 0.10));
          const p3grid = Math.max(0, Math.min(1, (q - 0.86) / 0.12));
          if (phase3BgRef.current) gsap.set(phase3BgRef.current, { autoAlpha: p3bg });
          if (phase3Ref.current) gsap.set(phase3Ref.current, { autoAlpha: p3head > 0 ? 1 : 0 });
          if (phase3HeadRef.current) gsap.set(phase3HeadRef.current, { autoAlpha: p3head, y: (1 - p3head) * 30 });
          if (phase3GridRef.current) gsap.set(phase3GridRef.current, { autoAlpha: p3grid, y: (1 - p3grid) * 40 });

          // Blue runs up behind the nav: let the bar go transparent while it is showing.
          const blue = p3bg > 0.5 && p < 1;
          if (blue !== blueShown) { blueShown = blue; announceHeroBlue(blue); }
        },
        onLeave: () => { if (blueShown) { blueShown = false; announceHeroBlue(false); } },
      });

      // ── Scroll indicator float ──
      if (scrollIndRef.current) {
        gsap.to(scrollIndRef.current, {
          y: 8,
          duration: 1.4,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }

    }, sectionRef);

    // Hold the context so the effect's cleanup can revert it. Returning it
    // from this callback went nowhere, so every re-init leaked a context.
    ctxRef.current = ctx;

    // The pin's `end: '+=500%'` is resolved to a pixel distance the moment
    // the trigger is created — during mount, before the page below has
    // settled. Re-measure once the browser has painted. Two rAFs because the
    // first only guarantees we are before a paint; the second runs after it,
    // when layout reflects reality.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    return () => {
      announceHeroBlue(false);
      removeVideoListeners?.();
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, []);

  const words = ['Find', 'and', 'experience', 'your', 'next', 'home'];
  // The warm accent sits on the word the line turns on.
  const ACCENT = 2;

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-ink"
      // Keep this on its own compositing layer. While pinned, ScrollTrigger
      // makes the section position:fixed and parks it at a sub-pixel offset
      // (top: 0.001px). Without its own layer the browser can stop painting
      // that fixed layer entirely after a client-side navigation — the section
      // still measures correctly and the scrub keeps running, but the viewport
      // renders blank white until something forces a repaint.
      //
      // `will-change` rather than a translateZ hack: a transform here would
      // make the section a containing block for its own position:fixed
      // descendants, which is exactly what ScrollTrigger relies on for pinning.
      style={{ willChange: 'transform' }}
    >

      {/* ── Scrubbed video ── */}
      {/*
        The source is ~50MB and the video is paused and scrub-driven, so it
        paints nothing until enough has downloaded to seek. The poster is 47KB
        and shows the first frame immediately, so the hero is never blank.
      */}
      <video
        ref={videoRef}
        poster="/videos/hero1-poster.jpg"
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* ── Overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/10 to-ink" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-ink/20" />

      {/* ══════════════════════════════════════
          PHASE 1 — Hero headline
      ══════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col justify-end h-full px-8 sm:px-14 lg:px-20 pb-20">
        <div ref={lineRef} className="w-12 h-px bg-warm-500 mb-8" />

        {/* The page's one H1. Spans keep the exact layout of the old divs (flex
            items are blocks either way); the trailing spaces only give the
            heading readable text, and collapse at the end of each word box. */}
        <h1 ref={headlineRef} className="overflow-hidden mb-6 font-normal">
          {/* Capped on wide screens so the line wraps before the "Verified listings" badge at the right. */}
          <span className="flex flex-wrap gap-x-5 gap-y-0 lg:max-w-[76%]">
            {words.map((word, i) => (
              <span key={i} className="block overflow-hidden leading-none">
                <span
                  className="hero-word inline-block font-display font-light tracking-tight text-chalk"
                  style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)', lineHeight: 1.0 }}
                >
                  {i === ACCENT ? <em className="not-italic text-warm-400">{word}</em> : word}
                </span>{' '}
              </span>
            ))}
          </span>
        </h1>

        <p
          ref={subRef}
          className="font-sans text-stone/80 text-base sm:text-lg max-w-md mb-10 leading-relaxed tracking-wide"
        >
          Off-plan developments, homes for sale and homes to rent across
          Kenya — toured in cinematic film, 3D and VR before you visit.
        </p>

        <div ref={ctaRef} className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link
            href="/for-developers"
            className="btn-glow-blue group inline-flex items-center gap-3 rounded-lg border border-[#4A80F5]/80 bg-[#4A80F5]/10 hover:bg-[#4A80F5]/20 backdrop-blur-sm text-chalk text-sm tracking-[0.12em] uppercase px-8 py-4 transition-all duration-500"
          >
            List Your Development
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/properties"
            className="btn-glow-warm group inline-flex items-center gap-3 rounded-lg border border-warm-400/80 bg-warm-400/10 hover:bg-warm-400/20 backdrop-blur-sm text-warm-300 text-sm tracking-[0.12em] uppercase px-8 py-4 transition-all duration-500"
          >
            Buy / Invest
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/rent"
            className="btn-glow-blue-late group inline-flex items-center gap-3 rounded-lg border border-[#4A80F5]/80 bg-[#4A80F5]/10 hover:bg-[#4A80F5]/20 backdrop-blur-sm text-chalk text-sm tracking-[0.12em] uppercase px-8 py-4 transition-all duration-500"
          >
            Properties for Rent
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PHASE 2 — VR / 3D showcase
      ══════════════════════════════════════ */}
      <div
        ref={phase2Ref}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8 sm:px-14 lg:px-20"
        // Hidden in markup, not only via gsap.set() in the video's ready
        // handler — on a connection where the video never loads that handler
        // never runs, and this phase would otherwise render over phase 1.
        style={{ pointerEvents: 'none', visibility: 'hidden', opacity: 0 }}
      >
        {/* Eyebrow + headline */}
        <div ref={phase2HeadRef} className="text-center mb-14">
          <p className="text-warm-400 text-xs tracking-[0.25em] uppercase mb-4">Immersive Technology</p>
          <h2
            className="font-display font-light text-chalk tracking-tight leading-none"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 6.5rem)' }}
          >
            Three ways to{' '}
            <em className="not-italic text-warm-400">explore</em>
          </h2>
        </div>

        {/* Cards row — 3 col on lg, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-5xl">

          {/* VR card */}
          <div
            ref={vrCardRef}
            className="border border-chalk/10 bg-ink/40 backdrop-blur-md p-7 sm:p-8 flex flex-col gap-5"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 border border-warm-500/40 text-warm-400">
                <Headset size={16} />
              </div>
              <span className="text-stone/50 text-[10px] tracking-[0.2em] uppercase">VR Experience</span>
            </div>
            <h3 className="font-display font-light text-chalk text-xl sm:text-2xl leading-tight">
              Step inside.<br />
              <em className="not-italic text-warm-400">Before it's built.</em>
            </h3>
            <p className="text-stone/60 text-xs leading-relaxed">
              Full 360° immersive tours — walk the corridors, feel the light,
              experience the views before a single brick is laid.
            </p>
            <Link
              href="/properties?hasVRTour=true"
              className="group inline-flex items-center gap-3 text-warm-400 text-xs tracking-[0.15em] uppercase mt-auto hover:text-chalk transition-colors duration-300"
            >
              Browse VR
              <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* 3D card */}
          <div
            ref={tdCardRef}
            className="border border-chalk/10 bg-ink/40 backdrop-blur-md p-7 sm:p-8 flex flex-col gap-5"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 border border-warm-500/40 text-warm-400">
                <Box size={16} />
              </div>
              <span className="text-stone/50 text-[10px] tracking-[0.2em] uppercase">3D Interactive Tour</span>
            </div>
            <h3 className="font-display font-light text-chalk text-xl sm:text-2xl leading-tight">
              Every angle.<br />
              <em className="not-italic text-warm-400">Every detail.</em>
            </h3>
            <p className="text-stone/60 text-xs leading-relaxed">
              Rotate, zoom and walk through interactive 3D models. Inspect floor layouts
              and finishes with precision — from anywhere.
            </p>
            <Link
              href="/properties?has3DTour=true"
              className="group inline-flex items-center gap-3 text-warm-400 text-xs tracking-[0.15em] uppercase mt-auto hover:text-chalk transition-colors duration-300"
            >
              Browse 3D
              <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Cinematic card */}
          <div
            ref={cinCardRef}
            className="border border-chalk/10 bg-ink/40 backdrop-blur-md p-7 sm:p-8 flex flex-col gap-5"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 border border-warm-500/40 text-warm-400">
                <Film size={16} />
              </div>
              <span className="text-stone/50 text-[10px] tracking-[0.2em] uppercase">Cinematic Tour</span>
            </div>
            <h3 className="font-display font-light text-chalk text-xl sm:text-2xl leading-tight">
              Scroll through.<br />
              <em className="not-italic text-warm-400">Room by room.</em>
            </h3>
            <p className="text-stone/60 text-xs leading-relaxed">
              Scroll-driven cinematic flythroughs — living room, kitchen, bedroom,
              amenities, aerial views and unit types, all individually selectable.
            </p>
            <Link
              href="/properties"
              className="group inline-flex items-center gap-3 text-warm-400 text-xs tracking-[0.15em] uppercase mt-auto hover:text-chalk transition-colors duration-300"
            >
              Browse Cinematic
              <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

        </div>
      </div>

      {/* ── Phase 3: e-resi blue, and what the visitor is here for ── */}
      {/* Electric blue fading to white, sampled from the reference David chose. */}
      <div
        ref={phase3BgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[25] overflow-hidden"
        style={{ visibility: 'hidden', backgroundImage: HERO_BLUE_GRADIENT }}
      >
      </div>
      <div
        ref={phase3Ref}
        className="absolute inset-0 z-[26] flex items-center justify-center px-5 pt-16 sm:px-10"
        style={{ visibility: 'hidden' }}
      >
        <div className="w-full max-w-[880px] font-sans">
          <InterestChooser headRef={phase3HeadRef} gridRef={phase3GridRef} />
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div
        ref={scrollIndRef}
        className="absolute bottom-10 right-10 z-30 flex flex-col items-center gap-2"
      >
        <span className="text-stone/40 text-[10px] tracking-[0.2em] uppercase rotate-90 origin-center mb-2">Scroll</span>
        <ArrowDown size={14} className="text-stone/40" />
      </div>

      {/* ── Property count badge ── */}
      <div className="absolute top-1/2 right-8 sm:right-14 lg:right-20 z-10 -translate-y-1/2 hidden lg:flex flex-col items-end gap-1">
        <span className="font-display text-6xl font-light text-chalk/10">Live</span>
        <span className="text-[10px] text-stone/40 tracking-[0.2em] uppercase">Verified listings</span>
      </div>
    </section>
  );
}

/** "What are you interested in?": the last step of the desktop hero and the whole hero on phones. */
function InterestChooser({ headRef, gridRef }: { headRef?: Ref<HTMLDivElement>; gridRef?: Ref<HTMLDivElement> }) {
  return (
    <>
      <div ref={headRef} className="mb-7 flex flex-col items-center text-center sm:mb-9 [@media(max-height:700px)]:mb-4">
        <HomeSearchMark className="mb-4 h-14 w-14 text-white drop-shadow-[0_4px_14px_rgba(1,30,120,0.35)] sm:h-16 sm:w-16 [@media(max-height:700px)]:mb-2 [@media(max-height:700px)]:h-10 [@media(max-height:700px)]:w-10" />
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/85 [@media(max-height:700px)]:mb-1.5 [@media(max-height:700px)]:text-[11px]">Get started</p>
        <h2 className="text-[32px] font-semibold leading-[1.1] tracking-tight text-white sm:text-[48px] [@media(max-height:700px)]:text-[24px] [@media(max-height:700px)]:sm:text-[34px]" style={{ textWrap: 'balance' }}>
          What are you interested in?
        </h2>
      </div>
      <div ref={gridRef} className="mx-auto flex w-full max-w-[400px] flex-col gap-3 sm:max-w-[520px]">
        {/* One white bar, three doors. */}
        <nav aria-label="Buy, rent or list" className="flex h-14 overflow-hidden rounded-full bg-white shadow-[0_1px_2px_rgba(16,26,58,0.14),0_8px_24px_rgba(16,26,58,0.22)] sm:h-[60px] [@media(max-height:700px)]:h-12">
          {SEGMENTS.map(({ href, title, Icon }, i) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 items-center justify-center gap-2 text-[15px] font-semibold text-[#14120a] transition-colors hover:bg-[#eef3ff] focus-visible:bg-[#eef3ff] focus-visible:outline-none sm:text-base ${i > 0 ? 'border-l border-[#e3e6ee]' : ''}`}
            >
              <Icon size={18} strokeWidth={2.2} className="text-[#0149FE]" />
              {title}
            </Link>
          ))}
        </nav>
        {/* Liquid glass with a yellow frame. */}
        <Link
          href={TOURS.href}
          className="flex min-h-14 items-center justify-center gap-2.5 rounded-full border-2 border-[#FFE345] bg-[rgba(1,45,160,0.30)] px-5 py-2 text-center text-[15px] font-semibold leading-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(16,26,58,0.22)] backdrop-blur-xl backdrop-saturate-150 transition-colors [text-shadow:0_1px_2px_rgba(1,20,80,0.35)] hover:bg-[rgba(1,45,160,0.40)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-[60px] sm:text-base [@media(max-height:700px)]:min-h-12"
        >
          <TOURS.Icon size={18} strokeWidth={2.2} className="shrink-0 text-[#FFE345]" />
          {TOURS.title}
        </Link>
      </div>
    </>
  );
}

/** Phones: no film and no scroll animation, just the blue chooser over a tower photo as the hero. */
const PHONE_PHOTO = '/images/hero-mobile-tower.jpg';
const phoneSrc = (w: number) => `/_next/image?url=${encodeURIComponent(PHONE_PHOTO)}&w=${w}&q=75`;
/** 1×1 transparent GIF: what wider screens pick, so the phone photo never downloads on desktop. */
const BLANK_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function MobileHero() {
  return (
    <section
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 pb-10 pt-24"
      style={{ backgroundImage: HERO_BLUE_GRADIENT }}
    >
      {/* The photo's pale sky melts into the gradient; the towers and pool fill the bottom of the screen. */}
      <picture>
        <source media="(min-width: 768px)" srcSet={BLANK_GIF} />
        <img
          src={phoneSrc(828)}
          srcSet={`${phoneSrc(640)} 640w, ${phoneSrc(828)} 828w, ${phoneSrc(1080)} 1080w`}
          sizes="100vw"
          alt="Residential towers around a landscaped pool and lawn"
          fetchPriority="high"
          decoding="async"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[64%] w-full object-cover object-[50%_30%]"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 38%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, #000 38%)',
          }}
        />
      </picture>
      <div className="hero-rise relative z-10 mx-auto w-full max-w-[880px] font-sans">
        <InterestChooser />
      </div>
    </section>
  );
}

/** Desktop and tablet keep the film hero; phones get the blue chooser on its own. Both are server-rendered, CSS shows one. */
export function HeroSection() {
  return (
    <>
      <div className="md:hidden">
        <MobileHero />
      </div>
      <div className="hidden md:block">
        <CinematicHero />
      </div>
    </>
  );
}
