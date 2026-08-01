'use client';

import { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Box as DreiBox, Sphere } from '@react-three/drei';
import {
  ArrowLeft, Building2, Sparkles, DoorOpen, ChevronRight,
  RotateCcw, ZoomIn, ZoomOut, Headset, Maximize2, Info,
  ChevronLeft, ChevronDown, Box as BoxIcon,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Property, PropertyTour, TourSection, TourScene } from '../../../lib/types';

// ── 3D scene icons map ────────────────────────────────────────────────────────
const sectionIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Building2, Sparkles, DoorOpen,
};

// ── Camera presets ────────────────────────────────────────────────────────────
const cameraPresets: Record<string, [number, number, number]> = {
  aerial:   [18, 14, 18],
  street:   [8,  3,  8],
  rooftop:  [10, 10, 2],
  interior: [5,  4,  5],
};

// ── Placeholder 3D building model (same as existing PropertyViewer3D) ─────────
function BuildingModel() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0b1020" />
      </mesh>
      <Grid position={[0, 0, 0]} args={[24, 24]} cellSize={1} cellThickness={0.4} cellColor="#151f3a" sectionSize={4} sectionThickness={0.8} sectionColor="#263050" fadeDistance={28} />
      {/* Tower base */}
      <DreiBox args={[6, 0.4, 6]} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#111827" />
      </DreiBox>
      {/* Main tower */}
      <DreiBox args={[4.2, 10, 4.2]} position={[0, 5.4, 0]}>
        <meshStandardMaterial color="#1a2540" metalness={0.35} roughness={0.4} />
      </DreiBox>
      {/* Glass strips */}
      {Array.from({ length: 13 }).map((_, i) => (
        <DreiBox key={i} args={[4.22, 0.38, 4.22]} position={[0, 1.1 + i * 0.72, 0]}>
          <meshStandardMaterial color="#5b72f3" transparent opacity={0.12} metalness={0.95} roughness={0.05} />
        </DreiBox>
      ))}
      {/* Roof */}
      <DreiBox args={[2.4, 1.2, 2.4]} position={[0, 10.8, 0]}>
        <meshStandardMaterial color="#1e2e50" />
      </DreiBox>
      <Sphere args={[0.35]} position={[0, 11.7, 0]}>
        <meshStandardMaterial color="#6172f3" emissive="#6172f3" emissiveIntensity={0.6} />
      </Sphere>
      {/* Context buildings */}
      {([[-6, 1.6, -4], [6, 1.1, 3], [-5, 0.9, 4], [5, 2.1, -5]] as [number, number, number][]).map(([x, h, z], i) => (
        <DreiBox key={i} args={[2.6, h * 2, 2.6]} position={[x, h, z]}>
          <meshStandardMaterial color="#0d1525" />
        </DreiBox>
      ))}
      <pointLight position={[12, 22, 12]} intensity={1.6} color="#a5bcfd" />
      <ambientLight intensity={0.35} />
    </group>
  );
}

// ── Scene preview thumbnail strip ─────────────────────────────────────────────
function SceneThumbnail({
  scene, active, onClick,
}: { scene: TourScene; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex-shrink-0 overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer text-left',
        active
          ? 'border-brand-500/50 ring-2 ring-brand-500/20'
          : 'border-white/5 hover:border-white/15',
      )}
      style={{ width: 112, minWidth: 112 }}
    >
      <div className="relative h-16 w-full overflow-hidden bg-white/5">
        {scene.thumbnailUrl ? (
          <Image
            src={scene.thumbnailUrl}
            alt={scene.label}
            fill
            className={cn('object-cover transition-transform duration-500', !active && 'group-hover:scale-105')}
            sizes="112px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/25">
            <BoxIcon size={16} />
          </div>
        )}
        {active && <div className="absolute inset-0 bg-brand-500/20" />}
      </div>
      <div className={cn('px-2 py-1.5', active ? 'bg-brand-900/40' : 'bg-surface-900')}>
        <p className={cn('text-[11px] font-medium leading-tight truncate', active ? 'text-brand-300' : 'text-white/60')}>
          {scene.label}
        </p>
      </div>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  property: Property;
  tour: PropertyTour;
}

export function Tour3DExperience({ property, tour }: Props) {
  // A section can legitimately have no scenes yet — never index blindly.
  const firstSection = tour.sections.find((s) => s.scenes.length > 0) ?? tour.sections[0];
  const [activeSection, setActiveSection] = useState<TourSection>(firstSection);
  const [activeScene, setActiveScene] = useState<TourScene | undefined>(firstSection?.scenes[0]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [infoVisible, setInfoVisible] = useState(true);
  const controlsRef = useRef<any>(null);

  const camPos = cameraPresets[activeScene?.cameraPreset ?? 'aerial'];
  // Real uploaded media wins over the abstract massing model.
  const hasSceneMedia = Boolean(activeScene?.videoUrl || activeScene?.imageUrl);

  const selectScene = (section: TourSection, scene: TourScene) => {
    setActiveSection(section);
    setActiveScene(scene);
    setInfoVisible(true);
    // Reset camera to preset
    if (controlsRef.current) controlsRef.current.reset();
  };

  const SectionIcon = sectionIcons[activeSection?.icon] ?? Building2;

  // adjacent section navigation
  const sectionIndex = tour.sections.findIndex((s) => s.id === activeSection?.id);
  const nextSection = tour.sections[sectionIndex + 1];

  // No 3D scenes uploaded yet — show a graceful empty state rather than crashing.
  if (!activeScene) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-6 text-center">
        <BoxIcon size={34} className="mb-5 text-white/25" />
        <p className="text-xl font-semibold text-white">No 3D scenes yet</p>
        <p className="mt-2 max-w-sm text-sm text-white/45">
          The developer hasn&apos;t published a 3D tour for {property.name} yet.
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
    <div className="fixed inset-0 bg-surface-950 flex flex-col overflow-hidden">

      {/* ── Top chrome ── */}
      <header className="relative z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl px-4 shrink-0">
        <Link
          href={`/${property.slug}`}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">{property.name}</span>
        </Link>

        <div className="h-4 w-px bg-white/10" />

        {/* Section breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm">
          <SectionIcon size={14} className="text-brand-400" />
          <span className="text-white/30 hidden sm:inline">{activeSection.label}</span>
          <ChevronRight size={12} className="text-white/15 hidden sm:block" />
          <span className="text-white font-medium">{activeScene.label}</span>
        </div>

        {/* Mode badge */}
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
            <BoxIcon size={12} /> Interactive 3D
          </span>

          {/* Switch to VR if available */}
          {tour.hasVR && (
            <Link
              href={`/${property.slug}/tour/vr`}
              className="flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors"
            >
              <Headset size={12} /> Switch to VR
            </Link>
          )}

          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            {sidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar: section + scene selector ── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex-shrink-0 overflow-hidden border-r border-white/5 bg-surface-900/60 backdrop-blur-sm"
            >
              <div className="flex flex-col h-full w-[280px]">
                {/* Property identity */}
                <div className="p-4 border-b border-white/5">
                  <p className="text-xs font-medium text-white/30 uppercase tracking-widest mb-0.5">3D Tour</p>
                  <p className="font-semibold text-white text-sm truncate">{property.name}</p>
                  <p className="text-xs text-white/35">{property.address.neighborhood}, {property.address.city}</p>
                </div>

                {/* Section list */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                  {tour.sections.map((section) => {
                    const Icon = sectionIcons[section.icon] ?? Building2;
                    const isActive = section.id === activeSection.id;
                    return (
                      <div key={section.id}>
                        <button
                          onClick={() => selectScene(section, section.scenes[0])}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all cursor-pointer',
                            isActive ? 'bg-brand-500/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5',
                          )}
                        >
                          <Icon size={15} className={isActive ? 'text-brand-400' : ''} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{section.label}</p>
                            <p className="text-[11px] text-white/30">{section.scenes.length} scenes</p>
                          </div>
                          {isActive && <ChevronDown size={13} className="text-brand-400 shrink-0" />}
                        </button>

                        {/* Inline scene list when section is active */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-3 mt-1 space-y-0.5 border-l border-white/5 pl-3">
                                {section.scenes.map((scene) => {
                                  const isSceneActive = scene.id === activeScene.id;
                                  return (
                                    <button
                                      key={scene.id}
                                      onClick={() => selectScene(section, scene)}
                                      className={cn(
                                        'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-all cursor-pointer',
                                        isSceneActive
                                          ? 'bg-brand-500/15 text-brand-300'
                                          : 'text-white/35 hover:text-white hover:bg-white/5',
                                      )}
                                    >
                                      <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', isSceneActive ? 'bg-brand-400' : 'bg-white/15')} />
                                      <span className="truncate">{scene.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>

                {/* Bottom: thumbnail strip of current section */}
                <div className="p-3 border-t border-white/5">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">{activeSection.label}</p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {activeSection.scenes.map((scene) => (
                      <SceneThumbnail
                        key={scene.id}
                        scene={scene}
                        active={scene.id === activeScene.id}
                        onClick={() => selectScene(activeSection, scene)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── 3D Canvas viewport ── */}
        <div className="relative flex-1 overflow-hidden">
          {hasSceneMedia ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScene.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 bg-black"
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
                    controls
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <Image
                    src={activeScene.imageUrl}
                    alt={activeScene.label}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
          <Canvas shadows key={activeScene.id}>
            <PerspectiveCamera makeDefault position={camPos} fov={45} />
            <OrbitControls
              ref={controlsRef}
              enablePan
              enableZoom
              enableRotate
              minDistance={4}
              maxDistance={32}
              maxPolarAngle={Math.PI / 2.05}
              autoRotate
              autoRotateSpeed={0.3}
            />
            <Environment preset="night" />
            <Suspense fallback={null}>
              <BuildingModel />
            </Suspense>
          </Canvas>
          )}

          {/* Scene info overlay */}
          <AnimatePresence>
            {infoVisible && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm"
              >
                <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-brand-400 font-medium uppercase tracking-widest mb-0.5">{activeSection.label}</p>
                      <p className="font-semibold text-white">{activeScene.label}</p>
                      {activeScene.description && (
                        <p className="text-sm text-white/50 mt-1">{activeScene.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setInfoVisible(false)}
                      className="text-white/30 hover:text-white transition-colors mt-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls toolbar */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm p-1.5">
              <button
                onClick={() => controlsRef.current?.reset()}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset view"
              >
                <RotateCcw size={14} />
              </button>
              <div className="h-4 w-px bg-white/10" />
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Zoom in">
                <ZoomIn size={14} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Zoom out">
                <ZoomOut size={14} />
              </button>
              <div className="h-4 w-px bg-white/10" />
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Fullscreen">
                <Maximize2 size={14} />
              </button>
              <button
                onClick={() => setInfoVisible((v) => !v)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl transition-colors cursor-pointer',
                  infoVisible ? 'text-brand-400 bg-brand-500/15' : 'text-white/50 hover:text-white hover:bg-white/10',
                )}
                title="Scene info"
              >
                <Info size={14} />
              </button>
            </div>
          </div>

          {/* Section prev / next navigation */}
          <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-2">
            {nextSection && (
              <button
                onClick={() => selectScene(nextSection, nextSection.scenes[0])}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm px-3 py-2.5 text-white/40 hover:text-white hover:border-white/20 transition-all cursor-pointer group"
              >
                <span className="text-[10px] uppercase tracking-widest">Next</span>
                <span className="text-xs font-medium group-hover:text-brand-300 transition-colors text-center leading-tight max-w-[80px]">{nextSection.label}</span>
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Hint */}
          <div className="absolute top-4 right-4 text-xs text-white/25 bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1.5">
            Drag · Scroll · Pinch
          </div>
        </div>
      </div>
    </div>
  );
}
