'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

/**
 * Standing inside a photograph.
 *
 * The walkthrough this replaces moved a camera through the mesh, and indoors
 * that fails structurally: two rooms have a wall between them, so any move
 * between them passes through it, and routing around it needs door positions
 * the model does not record.
 *
 * Here nothing moves. Each viewpoint is a 360° image rendered offline from that
 * exact spot, mapped to the inside of a sphere with the camera at its centre;
 * "walking" to the next room crossfades to that room's image. A transition
 * cannot clip a wall because there is no travel to clip with — the same reason
 * Matterport's walkthrough downloads photographs and no mesh at all.
 *
 * What it gives up is honest: only the baked viewpoints exist, so a visitor
 * moves between them rather than freely. That is the trade every photographic
 * tour makes, and buyers already read it as normal.
 */

/**
 * Aligning the sphere with the bake.
 *
 * Two conventions have to agree and neither is obliged to. The bake shader
 * writes world direction (sin θ, ·, cos θ) — θ measured from +Z toward +X — at
 * longitude θ of the image. Three.js SphereGeometry lays its own UVs out from
 * +X, and a camera at yaw 0 looks down −Z. Composed, they leave the image a
 * quarter turn away from where the coordinates say it should be.
 *
 * Rotating the sphere by that quarter turn is what makes `yaw = θ` true rather
 * than approximately true, which is what the arrival turn below relies on. The
 * alternative — carrying a fudge factor in the yaw formula — was measured twice
 * and disagreed with itself, because it was correcting for something structural
 * with a number.
 */
const SPHERE_YAW_OFFSET = -Math.PI / 2;

/** One baked viewpoint. */
export interface PanoramaStop {
  id: string;
  label: string;
  caption?: string | null;
  panoramaUrl: string;
  /** Where it was baked, used to point the camera along the direction of travel. */
  pos?: [number, number, number] | null;
  /**
   * What the author said to face from here, if they said.
   *
   * Preferred over the direction of travel, which is only a guess at what
   * matters in the room — and a poor one when you enter from the far side, as
   * facing the way you came in means facing the wall behind the bed.
   */
  look?: [number, number, number] | null;
}

/**
 * A sphere seen from inside.
 *
 * Two of them, in fact — one showing the current image and one the incoming,
 * crossfaded by opacity. A single sphere swapping its texture would flash the
 * unpainted material for a frame on every move.
 */
function PanoramaSphere({
  url,
  opacity,
  renderOrder,
  onReady,
}: {
  url: string;
  opacity: number;
  renderOrder: number;
  onReady?: () => void;
}) {
  const { gl } = useThree();
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(url, (loaded) => {
      if (cancelled) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      // The image wraps the full 360°, so its seam must repeat rather than clamp.
      loaded.wrapS = THREE.RepeatWrapping;
      loaded.minFilter = THREE.LinearFilter;
      loaded.generateMipmaps = false;
      loaded.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      setTexture(loaded);
      onReady?.();
    });
    return () => {
      cancelled = true;
    };
    // onReady is a stable callback from the parent; re-running on it would
    // reload the image on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, gl]);

  useEffect(() => () => texture?.dispose(), [texture]);

  useFrame(() => {
    if (material.current) material.current.opacity = opacity;
  });

  if (!texture) return null;

  return (
    <mesh renderOrder={renderOrder} rotation={[0, SPHERE_YAW_OFFSET, 0]}>
      {/* Enough segments that the horizon reads straight rather than faceted.
          The sphere is turned inward by BackSide on the material below, and by
          that alone: flipping the scale as well would cancel it out and cull
          every face, and it would mirror the image into the bargain. */}
      <sphereGeometry args={[10, 64, 40]} />
      <meshBasicMaterial
        ref={material}
        map={texture}
        side={THREE.BackSide}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Look around by dragging; zoom with the wheel.
 *
 * Written directly rather than with OrbitControls because the camera never
 * moves — it only turns in place, which is a yaw/pitch pair rather than an
 * orbit around a target, and pitch must clamp before the pole where an
 * equirectangular image degenerates.
 */
function LookControls({
  yaw,
  pitch,
  fov,
}: {
  yaw: React.MutableRefObject<number>;
  pitch: React.MutableRefObject<number>;
  fov: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov.current) > 0.01) {
      cam.fov = fov.current;
      cam.updateProjectionMatrix();
    }
    // Yaw about world up, then pitch — applied in that order so that looking up
    // near the ceiling does not roll the horizon.
    cam.rotation.set(0, 0, 0);
    cam.rotateY(yaw.current);
    cam.rotateX(pitch.current);
  });

  return null;
}

export function PanoramaView({
  stops,
  index,
  className,
}: {
  stops: PanoramaStop[];
  /** Which stop to stand in. The parent owns it, so the existing tour controls
   *  — Next, Prev, Play, the room list — drive this mode unchanged. */
  index: number;
  className?: string;
}) {
  const current = stops[index];
  const [previous, setPrevious] = useState<PanoramaStop | null>(null);
  const [fade, setFade] = useState(1);
  const lastIndex = useRef(index);

  const yaw = useRef(0);
  const pitch = useRef(0);
  const fov = useRef(75);

  /**
   * Turn to face the room on arrival.
   *
   * Landing in the next room pointed in an arbitrary direction is disorienting
   * — it reads as somewhere else entirely — so the heading is set before the
   * crossfade rather than left wherever the last room's dragging left it.
   *
   * Runs on the opening stop too, not only on transitions: the first thing a
   * visitor sees deserves the author's framing as much as the seventh does.
   */
  const aimed = useRef(false);
  useEffect(() => {
    const moved = index !== lastIndex.current;
    if (!moved && aimed.current) return;
    const from = stops[lastIndex.current];
    const to = stops[index];
    lastIndex.current = index;
    aimed.current = true;

    /**
     * Where to face on arrival.
     *
     * The author's own look target first: a waypoint is someone standing in the
     * room saying "from here, look at that", and the whole value of authoring
     * one is thrown away by overriding it. The direction of travel is the
     * fallback for a stop nobody aimed — better than an arbitrary heading, but
     * only a guess, and a bad one when the visitor enters from the far side.
     */
    const aim =
      to?.look && to?.pos
        ? { dx: to.look[0] - to.pos[0], dz: to.look[2] - to.pos[2] }
        : from?.pos && to?.pos
          ? { dx: to.pos[0] - from.pos[0], dz: to.pos[2] - from.pos[2] }
          : null;

    if (aim) {
      const { dx, dz } = aim;
      if (Math.hypot(dx, dz) > 0.25) {
        /**
         * θ in the bake's convention, less half a turn.
         *
         * SPHERE_YAW_OFFSET has already put baked longitude θ at world longitude
         * θ. What remains is that a camera at yaw Y faces world longitude Y+180,
         * because three.js starts it looking down −Z — so facing θ means yawing
         * to θ−π. Both halves were derived from the geometry rather than fitted
         * to screenshots, which is why this is exact.
         */
        yaw.current = Math.atan2(dx, dz) - Math.PI;
        pitch.current *= 0.35; // level off; a tilted arrival reads as a stumble
      }
    }

    // Only an actual move crossfades. Aiming the opening stop is not a
    // transition, and fading it in from a previous room that was never on
    // screen would open the tour on a dissolve out of nothing.
    if (moved) {
      setPrevious(from ?? null);
      setFade(0);
    }
  }, [index, stops]);

  /**
   * Drive the crossfade.
   *
   * Keyed on the arriving stop rather than on `fade`: reading the animated value
   * back as a dependency would restart the animation on each of its own frames.
   * Short enough not to feel like a wipe, long enough that the two rooms
   * visibly overlap rather than cutting.
   */
  useEffect(() => {
    if (!previous) return;
    let raf = 0;
    const start = performance.now();
    const DURATION = 620;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // Ease-in-out: the middle of a crossfade is where both images are muddy,
      // so it should be passed through quickly.
      setFade(t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setPrevious(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [previous, current.id]);

  const drag = useRef<{ x: number; y: number } | null>(null);

  const handlers = useMemo(
    () => ({
      onPointerDown: (e: React.PointerEvent) => {
        drag.current = { x: e.clientX, y: e.clientY };
        (e.target as Element).setPointerCapture?.(e.pointerId);
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        drag.current = { x: e.clientX, y: e.clientY };
        // Scaled by field of view: zoomed in, the same drag should turn less.
        const rate = (fov.current / 75) * 0.0042;
        yaw.current -= dx * rate;
        // Clamped short of the poles, where an equirectangular image smears.
        pitch.current = Math.max(-1.15, Math.min(1.15, pitch.current - dy * rate));
      },
      onPointerUp: (e: React.PointerEvent) => {
        drag.current = null;
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      },
      onWheel: (e: React.WheelEvent) => {
        fov.current = Math.max(32, Math.min(88, fov.current + e.deltaY * 0.035));
      },
    }),
    [],
  );

  if (!current) return null;

  return (
    <div
      className={className}
      style={{ touchAction: 'none', cursor: drag.current ? 'grabbing' : 'grab' }}
      {...handlers}
    >
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 100, position: [0, 0, 0] }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <LookControls yaw={yaw} pitch={pitch} fov={fov} />
        {previous && (
          <PanoramaSphere url={previous.panoramaUrl} opacity={1} renderOrder={0} />
        )}
        <PanoramaSphere url={current.panoramaUrl} opacity={fade} renderOrder={1} />
      </Canvas>
    </div>
  );
}
