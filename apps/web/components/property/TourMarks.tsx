'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Marks for the three immersive tours.
 *
 * These are the platform's headline features — the reason a developer pays for
 * production — and they were being represented by 12px stock icons in small
 * pills. Each is now a drawn mark with real depth and its own motion:
 *
 *   3D        an isometric wireframe cube whose faces rotate
 *   VR        a headset with a viewpoint orbiting around it
 *   Cinematic an aperture that irises open, over a sweeping arc
 *
 * SVG rather than a WebGL canvas per mark. Three canvases on a page — each
 * with its own context, on a phone that is also about to run the actual tour —
 * costs far more than these are worth, and an SVG animated on transform stays
 * on the compositor.
 */

const EASE = 'power2.inOut';

/** Honour the OS setting: decorative motion is exactly what it is meant to stop. */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type TourKind = '3d' | 'vr' | 'cinematic';

/**
 * Continuous, slow, and paused when off-screen.
 *
 * A looping animation that runs while scrolled past is battery a buyer did not
 * agree to spend, so an observer suspends it — which also keeps several marks
 * on one page from all animating at once.
 */
function useIdleLoop(
  build: (root: SVGSVGElement) => gsap.core.Timeline | null,
) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const tl = build(el);
    if (!tl) return;

    // A generous root margin, so a mark just outside the viewport is already
    // running by the time it scrolls in. With a tight boundary the observer
    // fires while the mark is still off-screen, pauses the timeline, and a
    // mark that never re-crosses the edge stays frozen — which is what it did:
    // the transforms were set but nothing ever moved.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? tl.play() : tl.pause()),
      { rootMargin: '200px' },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      tl.kill();
    };
    // `build` is defined per-mark and stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

// ─── 3D ─────────────────────────────────────────────────────────────────────

/**
 * Isometric wireframe cube.
 *
 * Drawn as three rhombus faces meeting at the centre, which reads as a solid
 * from any angle. The faces brighten in sequence so the cube appears to turn
 * under a moving light rather than merely pulsing.
 */
export function Mark3D({ size = 40, className }: { size?: number; className?: string }) {
  const ref = useIdleLoop((root) => {
    const faces = root.querySelectorAll('.face');
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: EASE } });

    // A gentle in-plane rotation, not rotateY. SVG has no 3D transform space,
    // so rotateY on a <g> silently does nothing — which is exactly what it did
    // here until the computed transform was checked and found to be identity.
    // The depth comes from the isometric drawing and the travelling light
    // below; the rotation only keeps the object alive.
    tl.to(root.querySelector('.cube'), { rotate: 360, duration: 14, ease: 'none' }, 0);

    // Light travelling around the solid: each face brightens in turn, which
    // reads as a form turning under a fixed light.
    faces.forEach((f, i) => {
      tl.to(f, { opacity: 0.95, duration: 1.4 }, i * 1.4)
        .to(f, { opacity: 0.35, duration: 1.4 }, i * 1.4 + 1.4);
    });
    return tl;
  });

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <g className="cube" style={{ transformOrigin: '24px 24px' }}>
        {/* Top */}
        <path className="face" d="M24 6 40 15 24 24 8 15Z" fill="currentColor" opacity="0.35" />
        {/* Left */}
        <path className="face" d="M8 15 24 24v18L8 33Z" fill="currentColor" opacity="0.55" />
        {/* Right */}
        <path className="face" d="M40 15 24 24v18l16-9Z" fill="currentColor" opacity="0.45" />
        {/* Edges, for the wireframe read */}
        <path
          d="M24 6 40 15v18l-16 9-16-9V15Z M24 24v18 M8 15l16 9 16-9"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
          opacity="0.9"
          fill="none"
        />
      </g>
    </svg>
  );
}

// ─── VR ─────────────────────────────────────────────────────────────────────

/**
 * Headset with a viewpoint orbiting it — the thing VR actually offers, which a
 * static headset glyph does not convey.
 */
export function MarkVR({ size = 40, className }: { size?: number; className?: string }) {
  const ref = useIdleLoop((root) => {
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: EASE } });
    tl.to(root.querySelector('.orbit'), { rotate: 360, duration: 7, ease: 'none' }, 0)
      // A slight tilt of the headset itself, as if a head were turning.
      .to(root.querySelector('.headset'), { rotate: -6, duration: 2.2 }, 0)
      .to(root.querySelector('.headset'), { rotate: 6, duration: 2.2 }, 2.2)
      .to(root.querySelector('.headset'), { rotate: 0, duration: 2.2 }, 4.4);
    return tl;
  });

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      {/* Orbit ring and its travelling viewpoint */}
      <g className="orbit" style={{ transformOrigin: '24px 24px' }}>
        <ellipse
          cx="24" cy="24" rx="21" ry="9"
          stroke="currentColor" strokeWidth="1.1" opacity="0.3" fill="none"
        />
        <circle cx="45" cy="24" r="2.6" fill="currentColor" />
      </g>

      <g className="headset" style={{ transformOrigin: '24px 24px' }}>
        <path
          d="M11 19h26a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-6.6a3 3 0 0 1-2.3-1.1l-1.6-2a2 2 0 0 0-3 0l-1.6 2A3 3 0 0 1 19.6 32H11a4 4 0 0 1-4-4v-5a4 4 0 0 1 4-4Z"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Lenses, so it reads as optics rather than a blank block */}
        <circle cx="16.5" cy="25.5" r="2.4" fill="#fff" opacity="0.55" />
        <circle cx="31.5" cy="25.5" r="2.4" fill="#fff" opacity="0.55" />
      </g>
    </svg>
  );
}

// ─── Cinematic ──────────────────────────────────────────────────────────────

/**
 * Camera aperture that irises open and closed, with a sweeping arc — the
 * language of a moving camera rather than a play button.
 */
export function MarkCinematic({ size = 40, className }: { size?: number; className?: string }) {
  const ref = useIdleLoop((root) => {
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: EASE } });
    tl.to(root.querySelector('.blades'), { rotate: 120, duration: 5, ease: 'none' }, 0)
      // The iris breathes: open, hold, close.
      .to(root.querySelector('.iris'), { scale: 0.62, duration: 1.6 }, 0)
      .to(root.querySelector('.iris'), { scale: 1, duration: 1.6 }, 2.4)
      .to(root.querySelector('.sweep'), { rotate: 360, duration: 5, ease: 'none' }, 0);
    return tl;
  });

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.2" opacity="0.35" fill="none" />

      {/* Sweeping highlight, suggesting a camera travelling around the subject */}
      <g className="sweep" style={{ transformOrigin: '24px 24px' }}>
        <path
          d="M24 6a18 18 0 0 1 15.6 9"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.85" fill="none"
        />
      </g>

      <g className="blades" style={{ transformOrigin: '24px 24px' }}>
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <path
            key={deg}
            d="M24 24 33 11a15 15 0 0 1 5 6Z"
            fill="currentColor"
            opacity="0.45"
            transform={`rotate(${deg} 24 24)`}
          />
        ))}
      </g>

      <circle
        className="iris"
        cx="24" cy="24" r="6"
        fill="currentColor"
        style={{ transformOrigin: '24px 24px' }}
      />
    </svg>
  );
}

/** Pick a mark by tour kind. */
export function TourMark({
  kind,
  size = 40,
  className,
}: {
  kind: TourKind;
  size?: number;
  className?: string;
}) {
  if (kind === 'vr') return <MarkVR size={size} className={className} />;
  if (kind === 'cinematic') return <MarkCinematic size={size} className={className} />;
  return <Mark3D size={size} className={className} />;
}
