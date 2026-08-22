'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import {
  ArrowLeft, Headset, Box as Box3D, Building2, Sparkles, DoorOpen,
  CheckCircle2, AlertCircle, ChevronRight, Monitor, LayoutGrid, X,
  Play, ChevronLeft, Loader2, Gamepad2, RotateCcw,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { twinsApi, type DigitalTwin } from '../../../lib/api/twins';
import { VRScene, SNAP_DEGREES } from './VRScene';
import type { Property, PropertyTour, TourSection, TourScene } from '../../../lib/types';

/**
 * The VR tour.
 *
 * Two different things wear this name, and the distinction decides everything
 * below. A *model* tour puts the buyer inside the building's geometry at true
 * scale and lets them walk it — that is what a headset is for, and what we now
 * capture. A *panorama* tour is the older 360° stills, which a headset can
 * still show but cannot be walked. Properties exist with either, so both are
 * supported and the model is preferred when present.
 *
 * The hard constraint shaping the code: a WebXR session can only be requested
 * from a real user gesture, on a secure origin, against a canvas that already
 * exists. Deferring any of those to the moment the headset connects is how VR
 * pages end up with a button that does nothing.
 */

// ─── XR store ────────────────────────────────────────────────────────────────

/**
 * One store for the page.
 *
 * `emulate: false` matters in production: the library will otherwise fabricate
 * a Meta Quest 3 whenever WebXR is missing on localhost, which is invaluable
 * for testing and disastrous as a default — it would offer "Enter VR" on a
 * developer's laptop and report success against a device that isn't there.
 * It is turned on explicitly and only by the debug flag below.
 *
 * `offerSession` is what puts the tour in the headset's own system UI, so a
 * buyer already wearing one is prompted to enter rather than having to find a
 * button on a page they cannot comfortably read.
 */
const emulateRequested =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('xr') === 'emulate';

const xrStore = createXRStore({
  emulate: emulateRequested ? 'metaQuest3' : false,
  offerSession: 'immersive-vr',
  // Hands are common on Quest and cost nothing to accept; controllers stay
  // the primary path because locomotion is driven by a thumbstick.
  hand: true,
  controller: true,
  // A tour is geometry and texture, not compute — favour resolution.
  frameRate: 'high',
  foveation: 0.2,
});

/**
 * Reachable from the console when emulating, so a headset session can be
 * inspected without one. Only under the debug flag — never in a normal load.
 */
if (typeof window !== 'undefined' && emulateRequested) {
  (window as unknown as { __eresiXR?: unknown }).__eresiXR = xrStore;
}

const sectionIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Building2, Sparkles, DoorOpen,
};

// ─── Support detection ───────────────────────────────────────────────────────

type XRStatus = 'checking' | 'supported' | 'insecure' | 'unsupported' | 'unavailable';

/**
 * Whether this browser can actually open a headset session.
 *
 * Three failures are separated because the remedy differs and a single "not
 * supported" would send people to buy hardware they already own. WebXR is
 * absent entirely (wrong browser); the API exists but refuses (no headset, or
 * an iframe without the permission); or the page is not on a secure origin,
 * which silently removes `navigator.xr` and is the single most common reason a
 * working VR page dies on a staging URL.
 */
function useXRSupport() {
  const [status, setStatus] = useState<XRStatus>('checking');

  useEffect(() => {
    if (typeof window === 'undefined') { setStatus('unavailable'); return; }

    // `navigator.xr` is only exposed on secure origins. Saying so is far more
    // useful than "no headset detected" when the cause is http://.
    if (!window.isSecureContext) { setStatus('insecure'); return; }

    let live = true;

    const check = () => {
      // Re-read `navigator.xr` on every check rather than closing over it.
      // A runtime can install it after first paint — the emulator does, and so
      // does a headset whose driver finishes starting a moment late — and a
      // one-shot check would leave the button permanently greyed out.
      const xr = (navigator as Navigator).xr;
      if (!xr) return false;
      xr.isSessionSupported('immersive-vr')
        .then((ok) => { if (live) setStatus(ok ? 'supported' : 'unsupported'); })
        .catch(() => { if (live) setStatus('unavailable'); });
      return true;
    };

    check();

    /**
     * Keep asking for a while, rather than trusting the first answer.
     *
     * `isSessionSupported` is a snapshot, and the moment a page loads is the
     * worst time to take one: a headset's runtime may still be starting, a
     * Quest browser can answer before its compositor is ready, and a session
     * offered by the system arrives later still. There is also no reliable
     * event for any of it — `devicechange` covers hardware being plugged in,
     * not a runtime that was already plugged in and slow. So the check repeats
     * for a few seconds and then settles, which costs nothing and is the
     * difference between a working button and a permanently grey one.
     */
    let waited = 0;
    const id = setInterval(() => {
      waited += 500;
      const present = check();
      if (waited >= 6000) {
        clearInterval(id);
        // WebXR never appeared at all — settle, so the banner stops spinning
        // and says something the visitor can act on.
        if (live && !present) setStatus('unsupported');
      }
    }, 500);

    const recheck = () => { check(); };
    (navigator as Navigator).xr?.addEventListener?.('devicechange', recheck);
    window.addEventListener('focus', recheck);
    window.addEventListener('visibilitychange', recheck);

    return () => {
      live = false;
      clearInterval(id);
      (navigator as Navigator).xr?.removeEventListener?.('devicechange', recheck);
      window.removeEventListener('focus', recheck);
      window.removeEventListener('visibilitychange', recheck);
    };
  }, []);

  return status;
}

// ─── Panorama (legacy 360° scenes) ───────────────────────────────────────────

function PanoramaSphere({ imageUrl, videoUrl }: { imageUrl?: string; videoUrl?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const apply = (tex: THREE.Texture) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      const mesh = meshRef.current;
      if (mesh) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.map = tex;
        mat.needsUpdate = true;
      }
    };

    if (videoUrl) {
      const el = document.createElement('video');
      el.src = videoUrl;
      el.crossOrigin = 'anonymous';
      el.loop = true;
      el.muted = true;
      el.playsInline = true;
      el.play().catch(() => {});
      apply(new THREE.VideoTexture(el));
      return () => { el.pause(); el.src = ''; };
    }

    if (!imageUrl) return;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(imageUrl, apply);
    return undefined;
  }, [imageUrl, videoUrl]);

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial side={THREE.BackSide} />
    </mesh>
  );
}

// ─── The XR canvas ───────────────────────────────────────────────────────────

/**
 * The canvas that becomes the headset's display.
 *
 * Mounted for the whole life of the page rather than created when VR is
 * entered. `requestSession` must bind to a WebGL context that already exists
 * and is XR-compatible, and it must happen inside the click that asked for it
 * — building a canvas first would spend the user gesture and the browser would
 * reject the session. It is invisible and inert until a session starts, which
 * costs one idle context and buys a button that always works.
 */
function XRCanvas({
  twin,
  scene,
  onMeasured,
}: {
  twin: DigitalTwin | null;
  scene?: TourScene;
  onMeasured?: (info: { radius: number; height: number; width: number; triangles?: number | null }) => void;
}) {
  return (
    <Canvas
      // Depth matters more than antialiasing on a headset, and a tour is a
      // large space seen from inside.
      camera={{ fov: 70, near: 0.05, far: 1000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      shadows
    >
      <XR store={xrStore}>
        <Suspense fallback={null}>
          {twin
            ? <VRScene twin={twin} onMeasured={onMeasured} />
            : scene
              ? (
                <>
                  <PanoramaSphere imageUrl={scene.imageUrl} videoUrl={scene.videoUrl} />
                  <ambientLight intensity={1} />
                </>
              )
              : null}
        </Suspense>
      </XR>
    </Canvas>
  );
}

// ─── Status banner ───────────────────────────────────────────────────────────

function XRStatusBanner({ status, emulating }: { status: XRStatus; emulating: boolean }) {
  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
        <Loader2 size={15} className="animate-spin text-white/40 shrink-0" />
        <p className="text-sm text-white/50">Looking for a headset…</p>
      </div>
    );
  }

  if (status === 'supported') {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
        <p className="text-sm text-white/70">
          {emulating ? (
            <>Emulated headset active — <span className="font-medium text-white">Enter VR</span> runs the real session path.</>
          ) : (
            <>Headset ready — press <span className="font-medium text-white">Enter VR</span> to step inside.</>
          )}
        </p>
      </div>
    );
  }

  if (status === 'insecure') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-400" />
        <div>
          <p className="text-sm text-white/70">VR needs a secure connection.</p>
          <p className="mt-0.5 text-xs text-white/40">
            This page is on an insecure origin, so the browser hides WebXR entirely. Open it over https.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
      <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-400" />
      <div>
        <p className="text-sm text-white/70">No headset on this browser.</p>
        <p className="mt-0.5 text-xs text-white/40">
          Open this page in your headset&apos;s own browser, or connect one to this computer — the tour works
          on screen in the meantime.
        </p>
      </div>
    </div>
  );
}

const headsets = [
  { name: 'Meta Quest 2 / 3 / Pro', note: 'Open this page in Quest Browser' },
  { name: 'Apple Vision Pro', note: 'Open in Safari' },
  { name: 'Valve Index · HTC Vive', note: 'SteamVR running, then Chrome or Edge' },
  { name: 'Pico 4', note: 'Open in Pico Browser' },
];

// ─── Scene grid (panorama tours) ─────────────────────────────────────────────

function SceneGrid({
  tour, activeSection, activeScene, onSelect, onClose,
}: {
  tour: PropertyTour;
  activeSection?: TourSection;
  activeScene?: TourScene;
  onSelect: (section: TourSection, scene: TourScene) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="absolute inset-0 z-30 overflow-y-auto bg-surface-950/98 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Select a scene</h2>
          <button
            onClick={onClose}
            aria-label="Close scene list"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-colors hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        {tour.sections.map((section) => {
          const Icon = sectionIcons[section.icon] ?? Building2;
          return (
            <div key={section.id} className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <Icon size={14} className="text-brand-400" />
                <h3 className="text-sm font-semibold text-white">{section.label}</h3>
                <span className="text-xs text-white/30">{section.scenes.length} scenes</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {section.scenes.map((scene) => {
                  const isActive = scene.id === activeScene?.id && section.id === activeSection?.id;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => { onSelect(section, scene); onClose(); }}
                      className={cn(
                        'group relative cursor-pointer overflow-hidden rounded-2xl border text-left transition-all',
                        isActive ? 'border-brand-500/50 ring-2 ring-brand-500/20' : 'border-white/5 hover:border-white/15',
                      )}
                    >
                      <div className="relative h-28 overflow-hidden">
                        {scene.thumbnailUrl
                          ? <Image src={scene.thumbnailUrl} alt={scene.label} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="240px" />
                          : <div className="absolute inset-0 bg-white/5" />}
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-brand-500/20">
                            <Play size={16} className="fill-white text-white" />
                          </div>
                        )}
                        <div className="absolute left-2 top-2">
                          <span className="rounded-full border border-brand-500/30 bg-black/60 px-2 py-0.5 text-[9px] font-medium text-brand-300 backdrop-blur-sm">360°</span>
                        </div>
                      </div>
                      <div className="bg-surface-800 p-3">
                        <p className="truncate text-xs font-semibold text-white/80">{scene.label}</p>
                        {scene.description && <p className="mt-0.5 line-clamp-1 text-[10px] text-white/35">{scene.description}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface Props {
  property: Property;
  tour: PropertyTour;
}

export function TourVRExperience({ property, tour }: Props) {
  const xrStatus = useXRSupport();

  /**
   * The published models.
   *
   * Fetched client-side for the same reason the 3D viewer does it: the page is
   * statically generated, and a model published afterwards would otherwise not
   * appear until the next build.
   */
  const { data: twins = [], isLoading: twinsLoading } = useQuery({
    queryKey: ['twin', property.slug],
    queryFn: () => twinsApi.list(property.slug),
    staleTime: 5 * 60 * 1000,
  });

  const [twinId, setTwinId] = useState<string | null>(null);
  const twin = twins.find((t) => t.id === twinId) ?? twins[0] ?? null;

  // Panorama scenes, for properties captured before we modelled them.
  const sections = tour?.sections ?? [];
  const firstSection = sections.find((s) => s.scenes.length > 0) ?? sections[0];
  const [activeSection, setActiveSection] = useState<TourSection | undefined>(firstSection);
  const [activeScene, setActiveScene] = useState<TourScene | undefined>(firstSection?.scenes[0]);
  const [gridOpen, setGridOpen] = useState(false);
  const [showHeadsets, setShowHeadsets] = useState(false);

  const [inSession, setInSession] = useState(false);
  const [enterError, setEnterError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  const allScenes = useMemo(
    () => sections.flatMap((s) => s.scenes.map((sc) => ({ section: s, scene: sc }))),
    [sections],
  );
  const currentIndex = allScenes.findIndex(
    (a) => a.scene.id === activeScene?.id && a.section.id === activeSection?.id,
  );
  const prev = allScenes[currentIndex - 1];
  const next = allScenes[currentIndex + 1];

  const selectScene = useCallback((section: TourSection, scene: TourScene) => {
    setActiveSection(section);
    setActiveScene(scene);
  }, []);

  /**
   * Track the live session.
   *
   * The headset's own system menu can end a session without the page being
   * told through our button, so the chrome follows the store rather than
   * whatever the last click implied.
   */
  useEffect(() => xrStore.subscribe((s) => setInSession(!!s.session)), []);

  /**
   * Enter VR.
   *
   * Called straight from the click with no awaits before `enterVR()` — the
   * user gesture that permits a session is spent by the first await, so any
   * preparation has to have happened already. Failures are surfaced because a
   * silent one is indistinguishable from a broken button.
   */
  const enterVR = useCallback(async () => {
    setEnterError(null);
    setEntering(true);
    try {
      const session = await xrStore.enterVR();
      if (!session) setEnterError('The headset refused the session. Check it is awake and not in use by another app.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setEnterError(
        /NotSupported/i.test(msg) ? 'This browser cannot open an immersive session.'
        : /SecurityError|permission/i.test(msg) ? 'The browser blocked the session — VR needs https and permission for this page.'
        : /InvalidState/i.test(msg) ? 'A session is already running. Close it in the headset and try again.'
        : msg || 'Could not start the VR session.',
      );
    } finally {
      setEntering(false);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && next) selectScene(next.section, next.scene);
      if (e.key === 'ArrowLeft' && prev) selectScene(prev.section, prev.scene);
      if (e.key === 'Escape') { setGridOpen(false); setShowHeadsets(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, selectScene]);

  const hasModel = !!twin;
  const hasPanorama = !!activeScene;

  /**
   * Don't commit to a layout until the models are known.
   *
   * A property can hold both a model and older 360° scenes. The scenes arrive
   * with the server-rendered page and the models a moment later over the
   * network, so rendering as soon as scenes exist would show the panorama
   * tour, then swap the whole page under the buyer once the model landed —
   * and on a slow connection they would start reading the wrong one.
   */
  if (twinsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <Loader2 size={22} className="animate-spin text-white/25" />
      </div>
    );
  }

  // Nothing published at all — say so rather than showing dead controls.
  if (!twinsLoading && !hasModel && !hasPanorama) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-6 text-center">
        <Headset size={34} className="mb-5 text-white/25" />
        <p className="text-xl font-semibold text-white">No VR tour yet</p>
        <p className="mt-2 max-w-sm text-sm text-white/45">
          {property.name} hasn&apos;t been captured for VR yet.
        </p>
        <Link
          href={`/${property.slug}`}
          className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} /> Back to {property.name}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-950">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-white/5 bg-surface-950/80 px-4 backdrop-blur-xl sm:px-6">
        <Link href={`/${property.slug}`} className="group flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">{property.name}</span>
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-1.5 text-sm">
          <Headset size={14} className="text-brand-400" />
          <span className="font-medium text-white">VR Tour</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {(tour?.has3D || twins.length > 0) && (
            <Link
              href={`/${property.slug}/tour/3d`}
              className="hidden items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300 transition-colors hover:bg-brand-500/20 sm:flex"
            >
              <Box3D size={12} /> 3D Tour
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">

        {/* ── Left: preview ── */}
        <div className="flex flex-1 flex-col">
          {/* Fills the column on a desktop, where the model is the point of the
              page; falls back to a fixed height on a phone, where the panel
              below it matters more. */}
          <div className="relative flex-1 overflow-hidden bg-black" style={{ minHeight: 420 }}>
            {hasModel ? (
              /**
               * The model, on screen, in the same canvas VR will use.
               *
               * Showing the real thing rather than a poster means the buyer has
               * already seen it load before they put a headset on — and it is
               * the only honest preview of what they are about to step into.
               */
              <div className="absolute inset-0">
                <XRCanvas twin={twin} />
                <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-black/60 px-3 py-1.5 text-xs font-medium text-brand-300 backdrop-blur-sm">
                  <Box3D size={11} /> {twin!.label}
                </div>
              </div>
            ) : activeScene ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScene.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  {activeScene.videoUrl ? (
                    <video
                      key={activeScene.videoUrl}
                      src={activeScene.videoUrl}
                      poster={activeScene.thumbnailUrl || undefined}
                      autoPlay loop muted playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : activeScene.imageUrl ? (
                    <Image src={activeScene.imageUrl} alt={activeScene.label} fill className="object-cover" sizes="100vw" priority />
                  ) : null}
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-transparent" />

                  <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-black/60 px-3 py-1.5 text-xs font-medium text-brand-300 backdrop-blur-sm">
                    360° scene
                  </div>

                  {prev && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <button
                        onClick={() => selectScene(prev.section, prev.scene)}
                        aria-label="Previous scene"
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-black/50 text-white/50 backdrop-blur-sm transition-all hover:border-white/20 hover:text-white"
                      >
                        <ChevronLeft size={18} />
                      </button>
                    </div>
                  )}
                  {next && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        onClick={() => selectScene(next.section, next.scene)}
                        aria-label="Next scene"
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-black/50 text-white/50 backdrop-blur-sm transition-all hover:border-white/20 hover:text-white"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    {activeSection && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-400">{activeSection.label}</p>
                    )}
                    <h2 className="text-2xl font-semibold text-white">{activeScene.label}</h2>
                    {activeScene.description && (
                      <p className="mt-1 max-w-lg text-sm text-white/50">{activeScene.description}</p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-white/25" />
              </div>
            )}
          </div>

          {/* ── Model switcher / scene strip ── */}
          {hasModel && twins.length > 1 && (
            <div className="border-b border-white/5 bg-surface-900/50 p-4 sm:p-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Choose what to tour
              </p>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-0.5">
                {twins.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTwinId(t.id)}
                    className={cn(
                      'shrink-0 cursor-pointer rounded-xl border px-3.5 py-2 text-xs font-medium transition-all',
                      t.id === twin!.id
                        ? 'border-brand-500/50 bg-brand-500/15 text-brand-200'
                        : 'border-white/8 bg-white/3 text-white/50 hover:border-white/15 hover:text-white',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasModel && allScenes.length > 1 && (
            <div className="border-b border-white/5 bg-surface-900/50 p-4 sm:p-5">
              <button
                onClick={() => setGridOpen(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/3 px-3.5 py-1.5 text-xs text-white/40 transition-colors hover:text-white"
              >
                <LayoutGrid size={12} /> All {allScenes.length} scenes
              </button>
            </div>
          )}
        </div>

        {/* ── Right: the VR panel ── */}
        <aside className="w-full shrink-0 space-y-4 border-t border-white/5 p-5 lg:w-[380px] lg:border-l lg:border-t-0">

          <XRStatusBanner status={xrStatus} emulating={emulateRequested} />

          <div className="space-y-4 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/15">
                <Headset size={22} className="text-brand-300" />
              </div>
              <div>
                <p className="font-semibold text-white">Immersive VR</p>
                <p className="text-xs text-white/40">
                  {hasModel ? 'Walk the building at full size' : 'Full 360° on your headset'}
                </p>
              </div>
            </div>

            <button
              onClick={enterVR}
              disabled={xrStatus !== 'supported' || entering || inSession}
              className={cn(
                'flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold transition-all',
                xrStatus === 'supported' && !inSession
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 active:scale-[0.98]'
                  : 'cursor-not-allowed border border-white/8 bg-white/5 text-white/25',
              )}
            >
              {entering ? <Loader2 size={16} className="animate-spin" /> : <Headset size={16} />}
              {inSession ? 'In VR — headset active'
                : entering ? 'Starting…'
                : xrStatus === 'checking' ? 'Looking for a headset…'
                : xrStatus === 'supported' ? 'Enter VR'
                : 'No headset detected'}
            </button>

            {enterError && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-300">
                {enterError}
              </p>
            )}

            {inSession && (
              <button
                onClick={() => xrStore.getState().session?.end()}
                className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-white/60 transition-colors hover:text-white"
              >
                Exit VR
              </button>
            )}
          </div>

          {/* ── Controls, only where they apply ── */}
          {hasModel && (
            <div className="rounded-2xl border border-white/5 bg-surface-800 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Gamepad2 size={14} className="text-white/40" />
                <p className="text-sm font-semibold text-white/80">In the headset</p>
              </div>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/40">Left stick</dt>
                  <dd className="text-right text-white/70">Walk, facing where you look</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/40">Right stick</dt>
                  <dd className="text-right text-white/70">Turn in {SNAP_DEGREES}° steps</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/40">Your feet</dt>
                  <dd className="text-right text-white/70">Walk your real room too</dd>
                </div>
              </dl>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-white/30">
                <RotateCcw size={11} className="mt-0.5 shrink-0" />
                Turning snaps rather than sweeps — it is what keeps a long tour comfortable.
              </p>
            </div>
          )}

          {/* ── How to connect ── */}
          <div className="rounded-2xl border border-white/5 bg-surface-800 p-5">
            <button
              onClick={() => setShowHeadsets((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <Monitor size={14} className="text-white/40" /> Supported headsets
              </span>
              <ChevronRight size={14} className={cn('text-white/30 transition-transform', showHeadsets && 'rotate-90')} />
            </button>
            <AnimatePresence>
              {showHeadsets && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {headsets.map((h) => (
                    <li key={h.name} className="flex justify-between gap-3 border-b border-white/5 py-2.5 text-xs last:border-0">
                      <span className="text-white/70">{h.name}</span>
                      <span className="text-right text-white/30">{h.note}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {gridOpen && tour && (
          <SceneGrid
            tour={tour}
            activeSection={activeSection}
            activeScene={activeScene}
            onSelect={selectScene}
            onClose={() => setGridOpen(false)}
          />
        )}
      </AnimatePresence>

      {/**
        * The session canvas for panorama tours.
        *
        * A model tour already has a live canvas in the preview above and reuses
        * it; a panorama tour has only an <img>, so one is mounted here — kept
        * present from first render for the gesture reason described on
        * XRCanvas, not created when the button is pressed.
        */}
      {!hasModel && hasPanorama && (
        <div className="pointer-events-none fixed inset-0 opacity-0" style={{ zIndex: -1 }} aria-hidden>
          <XRCanvas twin={null} scene={activeScene} />
        </div>
      )}
    </div>
  );
}
