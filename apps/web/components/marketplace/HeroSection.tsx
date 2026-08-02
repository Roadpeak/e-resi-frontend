'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, Headset, Box, ArrowRight, Film } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
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

  // The hero is a pinned, scrub-driven section, so a restored mid-page scroll
  // is measured before GSAP sets anything up — which is what glitched on
  // refresh. Kept in its own effect because the one below bails early when the
  // video ref is not yet populated, and this must run on every mount.
  useEffect(() => {
    if (!('scrollRestoration' in history)) return;
    history.scrollRestoration = 'manual';
    // The flag only prevents a future restore; this load may already have been
    // moved, so put it back at the top.
    if (window.scrollY > 0) window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;

    const onReady = () => {
      const duration = video.duration;
      if (!duration || isNaN(duration)) return;

      const ctx = gsap.context(() => {

        // ── Entrance sequence ──
        // Safe to always play: the effect above guarantees we start at the top,
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
        gsap.set(phase2HeadRef.current, { autoAlpha: 0, y: 30 });

        // ── Main scroll driver ──
        let lastTime = -1;
        // A phone travels five screen-heights of finger-scrolling to clear a
        // 500% pin while seeking a video frame the whole way. Shorten the
        // travel, lighten the scrub, and ask for fewer seeks — mobile decoders
        // are far slower, and a seek queue that cannot keep up is the stutter.
        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        const minDelta = isMobile ? 1 / 12 : 1 / 24;

        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top top',
          end: isMobile ? '+=250%' : '+=500%',
          pin: true,
          scrub: isMobile ? 0.6 : 1.5,
          onUpdate: (self) => {
            const p = self.progress;

            // Video scrub — full duration across full scroll
            const target = p * duration;
            if (Math.abs(target - lastTime) >= minDelta) {
              video.currentTime = target;
              lastTime = target;
            }

            // ── Phase 1: 0 → 0.28  (headline visible → fades out) ──
            const p1out = Math.max(0, Math.min(1, (p - 0.18) / 0.12)); // fades 0.18→0.30
            if (headlineRef.current) {
              gsap.set(headlineRef.current, {
                y: p1out * -80,
                opacity: 1 - p1out,
              });
            }
            if (subRef.current)  gsap.set(subRef.current,  { opacity: 1 - p1out * 1.4 });
            if (ctaRef.current)  gsap.set(ctaRef.current,  { opacity: 1 - p1out * 1.4 });
            if (lineRef.current) gsap.set(lineRef.current, { opacity: 1 - p1out });
            if (scrollIndRef.current) gsap.set(scrollIndRef.current, { opacity: Math.max(0, 1 - p * 6) });

            // ── Phase 2: 0.32 → 0.72 (VR/3D panel fades in, stays, fades out) ──
            const p2in  = Math.max(0, Math.min(1, (p - 0.32) / 0.12)); // fade in
            const p2out = Math.max(0, Math.min(1, (p - 0.62) / 0.12)); // fade out

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
          },
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

      // The browser restores scroll position on refresh, and does so before this
      // runs — so ScrollTrigger measures a page that has already moved, the pin
      // never engages, and the hero scrolls away. Re-measure after layout has
      // settled, then push the scrubbed values to the restored position.
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        ScrollTrigger.update();
      });
    };

    if (video.readyState >= 1) {
      onReady();
    } else {
      video.addEventListener('loadedmetadata', onReady, { once: true });
      // Safari can settle at readyState 1 without firing loadedmetadata again.
      video.addEventListener('canplay', onReady, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('canplay', onReady);
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, []);

  const words = ['Experience', 'Living', 'Before', 'You', 'Arrive'];

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-ink">

      {/* ── Scrubbed video ── */}
      <video
        ref={videoRef}
        src="/videos/hero1.mp4"
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

        <div ref={headlineRef} className="overflow-hidden mb-6">
          <div className="flex flex-wrap gap-x-5 gap-y-0">
            {words.map((word, i) => (
              <div key={i} className="overflow-hidden leading-none">
                <span
                  className="hero-word inline-block font-display font-light tracking-tight text-chalk"
                  style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)', lineHeight: 1.0 }}
                >
                  {i === 1 ? <em className="not-italic text-warm-400">{word}</em> : word}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p
          ref={subRef}
          className="font-sans text-stone/80 text-base sm:text-lg max-w-md mb-10 leading-relaxed tracking-wide"
        >
          Cinematic VR tours, interactive 3D models and digital twins of
          Kenya's most exceptional developments.
        </p>

        <div ref={ctaRef} className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link
            href="/properties"
            className="btn-glow-chalk group inline-flex items-center gap-3 border border-chalk/30 bg-chalk/5 hover:bg-chalk/10 backdrop-blur-sm text-chalk text-sm tracking-[0.12em] uppercase px-8 py-4 transition-all duration-500"
          >
            Buy / Invest
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/rent"
            className="btn-glow-warm group inline-flex items-center gap-3 border border-warm-400/40 bg-warm-400/5 hover:bg-warm-400/10 backdrop-blur-sm text-warm-300 text-sm tracking-[0.12em] uppercase px-8 py-4 transition-all duration-500"
          >
            Properties for Rent
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/onboarding"
            className="btn-glow-dim group inline-flex items-center gap-3 border border-white/15 bg-white/4 hover:bg-white/8 text-white/35 hover:text-chalk text-sm tracking-[0.12em] uppercase px-8 py-4 transition-all duration-300"
          >
            List Your Development
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
              href="/properties?filter=vr"
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
              href="/properties?filter=3d"
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
              href="/properties?filter=cinematic"
              className="group inline-flex items-center gap-3 text-warm-400 text-xs tracking-[0.15em] uppercase mt-auto hover:text-chalk transition-colors duration-300"
            >
              Browse Cinematic
              <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

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
        <span className="font-display text-6xl font-light text-chalk/10">4+</span>
        <span className="text-[10px] text-stone/40 tracking-[0.2em] uppercase">Premium Listings</span>
      </div>
    </section>
  );
}
