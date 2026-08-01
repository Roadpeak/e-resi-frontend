'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import {
  ArrowLeft, Headset, Box as Box3D, Building2, Sparkles, DoorOpen,
  CheckCircle2, AlertCircle, ChevronRight, Wifi, Monitor,
  LayoutGrid, X, Play, ChevronLeft,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Property, PropertyTour, TourSection, TourScene } from '../../../lib/types';

// ── XR Store (singleton per session) ─────────────────────────────────────────
const xrStore = createXRStore();

// ── Section icons ──────────────────────────────────────────────────────────────
const sectionIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Building2, Sparkles, DoorOpen,
};

// ── WebXR support detection ───────────────────────────────────────────────────
type XRStatus = 'checking' | 'supported' | 'unsupported' | 'unavailable';

function useXRSupport() {
  const [status, setStatus] = useState<XRStatus>('checking');

  useEffect(() => {
    if (typeof window === 'undefined') { setStatus('unavailable'); return; }
    if (!('xr' in navigator)) { setStatus('unsupported'); return; }
    (navigator as any).xr
      .isSessionSupported('immersive-vr')
      .then((supported: boolean) => setStatus(supported ? 'supported' : 'unsupported'))
      .catch(() => setStatus('unavailable'));
  }, []);

  return status;
}

// ── 360° equirectangular sphere (inside WebXR session) ────────────────────────
function PanoramaSphere({ imageUrl, videoUrl }: { imageUrl?: string; videoUrl?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    const apply = (tex: THREE.Texture) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      texture.current = tex;
      if (meshRef.current) {
        (meshRef.current.material as THREE.MeshBasicMaterial).map = tex;
        (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
    };

    // A 360° video scene wraps the sphere in a live VideoTexture.
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

// ── Floating scene label (visible inside VR headset) ─────────────────────────
function VRSceneLabel({ label, section }: { label: string; section: string }) {
  return (
    <group position={[0, -1.2, -3]}>
      <mesh>
        <planeGeometry args={[2.4, 0.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ── VR canvas (only mounted when entering VR) ─────────────────────────────────
function VRCanvas({ scene, section }: { scene: TourScene; section: TourSection }) {
  return (
    <div className="absolute inset-0">
      <Canvas>
        <XR store={xrStore}>
          <Suspense fallback={null}>
            <PanoramaSphere imageUrl={scene.imageUrl} videoUrl={scene.videoUrl} />
            <VRSceneLabel label={scene.label} section={section.label} />
          </Suspense>
          <ambientLight intensity={1} />
        </XR>
      </Canvas>
    </div>
  );
}

// ── Scene grid picker ─────────────────────────────────────────────────────────
function SceneGrid({
  tour, activeSection, activeScene, onSelect, onClose,
}: {
  tour: PropertyTour;
  activeSection: TourSection;
  activeScene: TourScene;
  onSelect: (section: TourSection, scene: TourScene) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="absolute inset-0 z-30 bg-surface-950/98 backdrop-blur-xl overflow-y-auto"
    >
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Select a Scene</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
        {tour.sections.map((section) => {
          const Icon = sectionIcons[section.icon] ?? Building2;
          return (
            <div key={section.id} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={14} className="text-violet-400" />
                <h3 className="text-sm font-semibold text-white">{section.label}</h3>
                <span className="text-xs text-white/30">{section.scenes.length} scenes</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {section.scenes.map((scene) => {
                  const isActive = scene.id === activeScene.id && section.id === activeSection.id;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => { onSelect(section, scene); onClose(); }}
                      className={cn(
                        'group relative overflow-hidden rounded-2xl border text-left transition-all cursor-pointer',
                        isActive ? 'border-violet-500/50 ring-2 ring-violet-500/20' : 'border-white/5 hover:border-white/15',
                      )}
                    >
                      <div className="relative h-28 overflow-hidden">
                        {scene.thumbnailUrl ? (
                          <Image src={scene.thumbnailUrl} alt={scene.label} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="240px" />
                        ) : <div className="absolute inset-0 bg-white/5" />}
                        {isActive && (
                          <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                            <Play size={16} className="text-white fill-white" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="rounded-full border border-violet-500/30 bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[9px] font-medium text-violet-300">360°</span>
                        </div>
                      </div>
                      <div className="p-3 bg-surface-800">
                        <p className="text-xs font-semibold text-white/80 truncate">{scene.label}</p>
                        {scene.description && <p className="text-[10px] text-white/35 mt-0.5 line-clamp-1">{scene.description}</p>}
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

// ── XR Status banner ─────────────────────────────────────────────────────────
function XRStatusBanner({ status }: { status: XRStatus }) {
  if (status === 'checking') return null;

  if (status === 'supported') {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
        <p className="text-sm text-white/70">
          VR headset detected — click <span className="text-white font-medium">Enter VR</span> to launch the immersive experience on your device.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
      <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-white/70">
          No VR headset detected on this browser.
        </p>
        <p className="text-xs text-white/40 mt-0.5">
          Connect a WebXR-compatible headset (Meta Quest, Valve Index, etc.) and open this page from its browser to launch the VR experience.
        </p>
      </div>
    </div>
  );
}

// ── Compatible headsets ───────────────────────────────────────────────────────
const headsets = [
  { name: 'Meta Quest 2 / 3 / Pro', note: 'Open in Quest Browser' },
  { name: 'Valve Index', note: 'SteamVR + Chrome/Edge' },
  { name: 'HTC Vive / Vive Pro', note: 'SteamVR + Chrome/Edge' },
  { name: 'PlayStation VR2', note: 'Via PC streaming' },
];

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  property: Property;
  tour: PropertyTour;
}

export function TourVRExperience({ property, tour }: Props) {
  const xrStatus = useXRSupport();
  // A section can legitimately have no scenes yet — never index blindly.
  const firstSection = tour.sections.find((s) => s.scenes.length > 0) ?? tour.sections[0];
  const [activeSection, setActiveSection] = useState<TourSection>(firstSection);
  const [activeScene, setActiveScene] = useState<TourScene | undefined>(firstSection?.scenes[0]);
  const [gridOpen, setGridOpen] = useState(false);
  const noScenes = !activeScene;
  const [showHeadsets, setShowHeadsets] = useState(false);

  const allScenes = tour.sections.flatMap((s) => s.scenes.map((sc) => ({ section: s, scene: sc })));
  const currentIndex = allScenes.findIndex((a) => a.scene.id === activeScene?.id && a.section.id === activeSection?.id);
  const prev = allScenes[currentIndex - 1];
  const next = allScenes[currentIndex + 1];

  const selectScene = useCallback((section: TourSection, scene: TourScene) => {
    setActiveSection(section);
    setActiveScene(scene);
  }, []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && next) selectScene(next.section, next.scene);
      if (e.key === 'ArrowLeft' && prev) selectScene(prev.section, prev.scene);
      if (e.key === 'Escape') { setGridOpen(false); setShowHeadsets(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, selectScene]);

  // No VR scenes uploaded yet — show a graceful empty state rather than crashing.
  if (noScenes || !activeScene) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-6 text-center">
        <Headset size={34} className="mb-5 text-white/25" />
        <p className="text-xl font-semibold text-white">No VR scenes yet</p>
        <p className="mt-2 max-w-sm text-sm text-white/45">
          The developer hasn&apos;t published a VR experience for {property.name} yet.
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
    <div className="min-h-screen bg-surface-950 flex flex-col">

      {/* ── Top bar ── */}
      <header className="flex h-14 items-center gap-3 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl px-4 sm:px-6 shrink-0 sticky top-0 z-20">
        <Link href={`/${property.slug}`} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">{property.name}</span>
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-1.5 text-sm">
          <Headset size={14} className="text-violet-400" />
          <span className="text-white font-medium">VR Tour</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {tour.has3D && (
            <Link href={`/${property.slug}/tour/3d`} className="hidden sm:flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300 hover:bg-brand-500/20 transition-colors">
              <Box3D size={12} /> 3D Tour
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ── Left: scene preview + controls ── */}
        <div className="flex-1 flex flex-col">

          {/* Scene preview */}
          <div className="relative overflow-hidden bg-black" style={{ minHeight: 400 }}>
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
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : activeScene.imageUrl ? (
                  <Image
                    src={activeScene.imageUrl}
                    alt={activeScene.label}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                ) : null}
                {/* Immersive overlay */}
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* 360° badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-violet-300">
              <Headset size={12} /> 360° Scene Preview
            </div>

            {/* Scene counter */}
            <div className="absolute top-4 right-4 text-xs text-white/30 bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1.5">
              {currentIndex + 1} / {allScenes.length}
            </div>

            {/* Prev / Next arrows */}
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <AnimatePresence>
                {prev && (
                  <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => selectScene(prev.section, prev.scene)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm text-white/50 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <AnimatePresence>
                {next && (
                  <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => selectScene(next.section, next.scene)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm text-white/50 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Scene info overlay */}
            <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400 mb-1">{activeSection.label}</p>
              <h2 className="text-2xl font-semibold text-white">{activeScene.label}</h2>
              {activeScene.description && (
                <p className="text-sm text-white/50 mt-1 max-w-lg">{activeScene.description}</p>
              )}
            </div>
          </div>

          {/* Section tabs + thumbnail strip */}
          <div className="p-4 sm:p-5 border-b border-white/5 bg-surface-900/50">
            {/* Section tabs */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide">
              {tour.sections.map((section) => {
                const Icon = sectionIcons[section.icon] ?? Building2;
                const isActive = section.id === activeSection.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => selectScene(section, section.scenes[0])}
                    className={cn(
                      'flex items-center gap-1.5 shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
                      isActive ? 'border-violet-500/40 bg-violet-500/15 text-violet-300' : 'border-white/10 bg-white/3 text-white/40 hover:text-white hover:border-white/20',
                    )}
                  >
                    <Icon size={12} /> {section.label}
                  </button>
                );
              })}
              <button
                onClick={() => setGridOpen(true)}
                className="ml-auto flex items-center gap-1.5 shrink-0 rounded-full border border-white/10 bg-white/3 px-3.5 py-1.5 text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <LayoutGrid size={12} /> All Scenes
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {activeSection.scenes.map((scene) => {
                const isActive = scene.id === activeScene.id;
                return (
                  <button
                    key={scene.id}
                    onClick={() => selectScene(activeSection, scene)}
                    className={cn(
                      'relative shrink-0 overflow-hidden rounded-xl border transition-all cursor-pointer',
                      isActive ? 'border-violet-400/60 ring-2 ring-violet-400/20' : 'border-white/8 hover:border-white/20 opacity-60 hover:opacity-100',
                    )}
                    style={{ width: 96, height: 60 }}
                  >
                    {scene.thumbnailUrl ? (
                      <Image src={scene.thumbnailUrl} alt={scene.label} fill className="object-cover" sizes="96px" />
                    ) : <div className="absolute inset-0 bg-white/5" />}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3">
                      <p className="text-[9px] text-white/80 truncate font-medium">{scene.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right panel: VR launcher ── */}
        <div className="lg:w-96 lg:border-l border-white/5 bg-surface-900/30 flex flex-col">
          <div className="p-6 flex-1 space-y-5">

            {/* Property identity */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">VR Experience</p>
              <h3 className="text-lg font-semibold text-white">{property.name}</h3>
              <p className="text-sm text-white/40">{tour.sections.length} sections · {allScenes.length} scenes</p>
            </div>

            {/* XR status */}
            <XRStatusBanner status={xrStatus} />

            {/* Enter VR button */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/20">
                  <Headset size={22} className="text-violet-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">Immersive VR Mode</p>
                  <p className="text-xs text-white/40">Full 360° on your headset display</p>
                </div>
              </div>

              {/* WebXR native button — this is what triggers the headset */}
              <button
                onClick={() => xrStore.enterVR()}
                disabled={xrStatus !== 'supported'}
                className={cn(
                  'w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold transition-all cursor-pointer',
                  xrStatus === 'supported'
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25 active:scale-[0.98]'
                    : 'bg-white/5 text-white/25 cursor-not-allowed border border-white/8',
                )}
              >
                <Headset size={16} />
                {xrStatus === 'checking' ? 'Checking for headset...' : xrStatus === 'supported' ? 'Enter VR' : 'No Headset Detected'}
              </button>

              <p className="text-[11px] text-white/25 text-center">
                Puts the scene directly onto your connected VR headset display
              </p>
            </div>

            {/* How to connect */}
            <div className="rounded-2xl border border-white/5 bg-surface-800 p-5">
              <button
                onClick={() => setShowHeadsets((v) => !v)}
                className="flex items-center justify-between w-full cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Monitor size={15} className="text-white/40" />
                  <span className="text-sm font-medium text-white">Compatible headsets</span>
                </div>
                <ChevronRight size={14} className={cn('text-white/30 transition-transform', showHeadsets && 'rotate-90')} />
              </button>

              <AnimatePresence>
                {showHeadsets && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-2.5">
                      {headsets.map((h) => (
                        <div key={h.name} className="flex items-center justify-between">
                          <span className="text-sm text-white/60">{h.name}</span>
                          <span className="text-xs text-white/30">{h.note}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/5 bg-surface-900 p-3">
                      <Wifi size={13} className="text-white/25 shrink-0 mt-0.5" />
                      <p className="text-xs text-white/35 leading-relaxed">
                        For Meta Quest: open this URL in the Quest Browser directly on the headset, or use Air Link / Quest Link from a PC.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* What's inside */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/30 uppercase tracking-wider">Tour contents</p>
              {tour.sections.map((section) => {
                const Icon = sectionIcons[section.icon] ?? Building2;
                return (
                  <div key={section.id} className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-surface-800 px-3.5 py-2.5">
                    <Icon size={14} className="text-violet-400 shrink-0" />
                    <span className="text-sm text-white/60 flex-1">{section.label}</span>
                    <span className="text-xs text-white/25">{section.scenes.length} scenes</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Scene grid overlay ── */}
      <AnimatePresence>
        {gridOpen && (
          <SceneGrid
            tour={tour}
            activeSection={activeSection}
            activeScene={activeScene}
            onSelect={selectScene}
            onClose={() => setGridOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Hidden WebXR canvas (only used when headset is active) ── */}
      {xrStatus === 'supported' && (
        <div className="fixed inset-0 pointer-events-none opacity-0" style={{ zIndex: -1 }}>
          <VRCanvas scene={activeScene} section={activeSection} />
        </div>
      )}
    </div>
  );
}
