'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Grid, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Headset,
  Maximize2, Share2, MoreVertical, Ruler, Layers, X, Home, Footprints,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { twinsApi, type DigitalTwin } from '../../../lib/api/twins';
import type { Property, PropertyTour, TourScene } from '../../../lib/types';

/**
 * The immersive 3D tour.
 *
 * Modelled on the way a digital-twin viewer actually behaves rather than on a
 * static 3D render: one scene, four ways of looking at it, and a camera that
 * moves between them instead of cutting. The modes are what a buyer recognises
 * — walk the space, lift the roof off, look at the plan, or let it play itself.
 *
 * The addition over the reference is the tour selector: a development is not
 * one house, so a visitor picks what they want to see — the full building, the
 * kitchen, the amenities — and the tour re-routes to just those stops.
 */

export type ViewMode = 'walk' | 'dollhouse' | 'floorplan';

/** Where the camera sits, per mode. The rig eases between these. */
const MODE_CAMERA: Record<ViewMode, { pos: [number, number, number]; look: [number, number, number] }> = {
  walk: { pos: [4.5, 4.2, 6.4], look: [0, 0.8, 0] },
  dollhouse: { pos: [11, 9, 13], look: [0, 1.2, 0] },
  floorplan: { pos: [0.001, 20, 0.001], look: [0, 0, 0] },
};

/** Scene-preset anchors, so a chosen stop actually moves the camera somewhere. */
const PRESET_ANCHOR: Record<string, [number, number, number]> = {
  aerial: [0, 9, 0],
  street: [0, 1.6, 7],
  rooftop: [0, 7.4, 0],
  interior: [0, 1.6, 0],
  lobby: [-3.4, 1.6, 3.2],
  pool: [2.8, 7.2, -2.2],
  gym: [3.6, 1.6, -3.4],
};

function anchorFor(scene: TourScene | undefined): [number, number, number] {
  const key = String(scene?.cameraPreset ?? 'interior').toLowerCase();
  return PRESET_ANCHOR[key] ?? PRESET_ANCHOR.interior;
}

// ─── The model ───────────────────────────────────────────────────────────────

/**
 * A sectioned interior.
 *
 * Stands in for a scanned mesh: rooms with real walls and floors, so the
 * dollhouse reads as a building with rooms in it and the floor plan reads as a
 * plan. Every room is a named volume, which is what lets the tour selector
 * highlight the part a visitor chose.
 */
const ROOMS: Array<{
  id: string;
  label: string;
  pos: [number, number, number];
  size: [number, number, number];
  tone: string;
}> = [
  { id: 'living', label: 'Living & Dining', pos: [-1.6, 0, 1.4], size: [5.2, 2.9, 4.6], tone: '#cbd5e8' },
  { id: 'kitchen', label: 'Kitchen', pos: [2.9, 0, 2.2], size: [3.4, 2.9, 3.0], tone: '#dfe6f2' },
  { id: 'master', label: 'Master Bedroom', pos: [-2.6, 0, -2.6], size: [4.0, 2.9, 3.6], tone: '#c6d0e4' },
  { id: 'second', label: 'Second Bedroom', pos: [1.5, 0, -3.0], size: [3.2, 2.9, 3.0], tone: '#ccd6e8' },
  { id: 'balcony', label: 'Balcony', pos: [-1.6, 0, 4.4], size: [5.2, 0.12, 1.6], tone: '#9fb0cc' },
];

function Rooms({ activeRoom }: { activeRoom: string | null }) {
  return (
    <group>
      {ROOMS.map((r) => {
        const dim = activeRoom !== null && activeRoom !== r.id;
        const [w, h, d] = r.size;
        return (
          <group key={r.id} position={r.pos}>
            {/* Floor slab */}
            <mesh position={[0, 0.02, 0]} receiveShadow>
              <boxGeometry args={[w, 0.06, d]} />
              <meshStandardMaterial
                color={r.tone}
                roughness={0.85}
                transparent
                opacity={dim ? 0.25 : 1}
              />
            </mesh>

            {/* Three walls, leaving the fourth open so the dollhouse can see in */}
            {r.id !== 'balcony' && (
              <>
                <mesh position={[0, h / 2, -d / 2]}>
                  <boxGeometry args={[w, h, 0.09]} />
                  <meshStandardMaterial color="#f2f5fa" roughness={0.95} transparent opacity={dim ? 0.12 : 0.96} />
                </mesh>
                <mesh position={[-w / 2, h / 2, 0]}>
                  <boxGeometry args={[0.09, h, d]} />
                  <meshStandardMaterial color="#e9eef6" roughness={0.95} transparent opacity={dim ? 0.12 : 0.96} />
                </mesh>
                <mesh position={[w / 2, h / 2, 0]}>
                  <boxGeometry args={[0.09, h, d]} />
                  <meshStandardMaterial color="#e9eef6" roughness={0.95} transparent opacity={dim ? 0.1 : 0.7} />
                </mesh>
              </>
            )}

            {/* Balustrade, so the balcony reads as outdoor space */}
            {r.id === 'balcony' && (
              <mesh position={[0, 0.55, d / 2]}>
                <boxGeometry args={[w, 1.05, 0.04]} />
                <meshStandardMaterial color="#8fa6c4" transparent opacity={dim ? 0.15 : 0.35} metalness={0.6} roughness={0.2} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/**
 * The real building, when this property has one.
 *
 * useGLTF suspends while the file downloads, so the caller wraps it — the
 * placeholder rooms stay on screen until the mesh is ready rather than the
 * viewer going blank. Draco and KTX2 decoders are resolved from the file
 * itself; drei ships both.
 */
function Mesh({
  url,
  scale,
  onMeasured,
}: {
  url: string;
  scale: number;
  /** Reports the model's size so the camera can frame it. */
  onMeasured: (radius: number, centre: THREE.Vector3) => void;
}) {
  const { scene } = useGLTF(url);

  // Cloned so a model shown twice on one page cannot have two viewers fighting
  // over the same object's transform.
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });

    /**
     * Measure it, and re-centre it on the origin.
     *
     * A model is authored wherever its exporter left it — a tower can sit
     * hundreds of units from origin — and its size is whatever the building
     * is. Fixed camera distances suited the stand-in plan and put the lens
     * inside the glazing of a real skyscraper. Measuring means one rig frames
     * a studio flat and a forty-storey tower equally.
     */
    const box = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius * scale;

    model.position.sub(centre.clone().multiplyScalar(scale));
    onMeasured(radius, centre);
  }, [model, scale, onMeasured]);

  return <primitive object={model} scale={scale} />;
}

// ─── Camera rig ──────────────────────────────────────────────────────────────

/**
 * Eases the camera to wherever the current mode and stop put it.
 *
 * Damped rather than cut: the movement between two viewpoints is most of what
 * makes a twin feel like a place rather than a slideshow, and it is the part a
 * static render cannot imitate.
 */
function CameraRig({
  mode,
  target,
  orbit,
  radius,
}: {
  mode: ViewMode;
  target: [number, number, number] | null;
  orbit: { yaw: number; pitch: number; dist: number };
  /** Bounding radius of whatever is loaded; drives every camera distance. */
  radius: number;
}) {
  const { camera } = useThree();
  const wantPos = useRef(new THREE.Vector3());
  const wantLook = useRef(new THREE.Vector3());
  /**
   * Seeded to the first mode's own look-at, not to the origin.
   *
   * A zero vector puts the aim point inside the floor slab, so the opening
   * frame renders the inside of a polygon — solid black — and only recovers
   * once something moves the camera enough to damp out of it.
   */
  const look = useRef(new THREE.Vector3(...MODE_CAMERA.dollhouse.look));

  useFrame((_, dt) => {

    if (mode === 'walk' && target) {
      // Stand back from the stop and look at it, rather than standing on it
      // and facing outward — at eye height inside a 3m room, "outward" is a
      // wall a foot from the lens, which rendered as a black frame.
      // Above the wall line looking down into the stop, not standing in the
      // room. The stand-in rooms are 2.9m tall and a few metres across, so any
      // eye-height position inside one has a wall against the lens; the near
      // plane then clips straight through it and the frame renders black.
      const r = Math.max(4, radius * 0.55) * orbit.dist;
      wantPos.current.set(
        target[0] + Math.sin(orbit.yaw) * r,
        Math.max(1.6, radius * 0.35) + orbit.pitch * r * 0.4,
        target[2] + Math.cos(orbit.yaw) * r,
      );
      wantLook.current.set(target[0], target[1] * 0.5, target[2]);
    } else if (mode === 'dollhouse') {
      // Far enough out to hold the whole building in frame, whatever its size.
      const r = radius * 2.1 * orbit.dist;
      wantPos.current.set(
        Math.sin(orbit.yaw) * r,
        Math.max(radius * 0.3, radius * 0.9 + orbit.pitch * radius),
        Math.cos(orbit.yaw) * r,
      );
      wantLook.current.set(0, 0, 0);
    } else {
      // Floor plan: straight down, high enough to see the footprint.
      wantPos.current.set(0.001, radius * 2.4, 0.001);
      wantLook.current.set(0, 0, 0);
    }

    // Frame-rate independent damping.
    //
    // Deliberately no first-frame snap: r3f runs the loop before the canvas
    // has its final size, so snapping there locks in a projection built from
    // the wrong aspect and the opening frame renders empty. Easing every
    // frame lets it correct itself as soon as the real size arrives.
    const k = 1 - Math.pow(0.0016, dt);
    camera.position.lerp(wantPos.current, k);
    look.current.lerp(wantLook.current, k);
    camera.lookAt(look.current);

    if (mode === 'floorplan' && 'zoom' in camera) {
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

// ─── Tags ────────────────────────────────────────────────────────────────────

interface TagDef {
  id: string;
  room: string;
  pos: [number, number, number];
  title: string;
  body: string;
}

const TAGS: TagDef[] = [
  { id: 't1', room: 'kitchen', pos: [2.9, 1.5, 2.2], title: 'Fitted kitchen', body: 'Quartz worktops, soft-close cabinetry and a fitted oven and hob.' },
  { id: 't2', room: 'living', pos: [-1.6, 1.7, 1.4], title: 'Double volume', body: 'Full-height glazing to the balcony, with the dining area open to the living space.' },
  { id: 't3', room: 'master', pos: [-2.6, 1.5, -2.6], title: 'En-suite master', body: 'Walk-in wardrobe and a private bathroom, positioned away from the living areas.' },
  { id: 't4', room: 'balcony', pos: [-1.6, 1.2, 4.4], title: 'Balcony', body: 'Deep enough for a table and chairs, facing the open aspect.' },
];

function Tags({
  visible,
  activeRoom,
  openTag,
  onOpen,
  twinTags,
}: {
  visible: boolean;
  activeRoom: string | null;
  openTag: string | null;
  onOpen: (id: string | null) => void;
  /** Tags placed against the real model, when there is one. */
  twinTags?: { id: string; title: string; body?: string | null; posX: number; posY: number; posZ: number }[];
}) {
  if (!visible) return null;

  // Real tags are anchored in the model's own space and are not filtered by
  // room — the room filter only means anything for the stand-in plan.
  const pins: TagDef[] = twinTags?.length
    ? twinTags.map((t) => ({
        id: t.id,
        room: '',
        pos: [t.posX, t.posY, t.posZ] as [number, number, number],
        title: t.title,
        body: t.body ?? '',
      }))
    : TAGS.filter((t) => !activeRoom || t.room === activeRoom);

  return (
    <group>
      {pins.map((t) => (
        <group key={t.id} position={t.pos}>
          <Html center distanceFactor={9} zIndexRange={[20, 0]}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(openTag === t.id ? null : t.id);
              }}
              aria-label={t.title}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-lg transition-transform hover:scale-110"
            >
              <Home size={13} />
            </button>

            {openTag === t.id && (
              <div className="absolute left-1/2 top-9 w-56 -translate-x-1/2 rounded-xl border border-black/10 bg-white p-3 text-left shadow-xl">
                <p className="text-[13px] font-semibold text-neutral-900">{t.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">{t.body}</p>
              </div>
            )}
          </Html>
        </group>
      ))}
    </group>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────

function Scene({
  mode,
  target,
  orbit,
  activeRoom,
  openTag,
  onOpenTag,
  twin,
}: {
  mode: ViewMode;
  target: [number, number, number] | null;
  orbit: { yaw: number; pitch: number; dist: number };
  activeRoom: string | null;
  openTag: string | null;
  onOpenTag: (id: string | null) => void;
  twin: DigitalTwin | null;
}) {
  /**
   * Bounding radius of what is on screen.
   *
   * Defaults to the stand-in plan's own size, then updates when a real model
   * reports its dimensions — one rig then frames a flat and a tower alike.
   */
  const [radius, setRadius] = useState(7);
  const onMeasured = useCallback((r: number) => setRadius(Math.max(2, r)), []);

  return (
    <>
      <CameraRig mode={mode} target={target} orbit={orbit} radius={radius} />

      <ambientLight intensity={0.75} />
      <directionalLight position={[7, 12, 6]} intensity={1.25} castShadow />
      <directionalLight position={[-6, 5, -5]} intensity={0.45} />
      <Environment preset="city" />

      {/* The real building when one has been published, the stand-in plan
          until then. Suspense keeps the placeholder on screen while a mesh
          downloads rather than blanking the viewer. */}
      {twin ? (
        <Suspense fallback={<Rooms activeRoom={activeRoom} />}>
          <Mesh url={twin.meshUrl} scale={twin.scale} onMeasured={onMeasured} />
        </Suspense>
      ) : (
        <Rooms activeRoom={activeRoom} />
      )}

      <Tags
        visible={mode !== 'floorplan'}
        activeRoom={activeRoom}
        openTag={openTag}
        onOpen={onOpenTag}
        twinTags={twin?.tags}
      />

      {/* Ground, only where it reads — a floor plan wants no context. */}
      {mode !== 'floorplan' && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[60, 60]} />
            <meshStandardMaterial color="#0d1117" />
          </mesh>
          <Grid
            position={[0, -0.01, 0]}
            args={[60, 60]}
            cellSize={1}
            cellThickness={0.4}
            cellColor="#1b2436"
            sectionSize={5}
            sectionThickness={0.8}
            sectionColor="#2a3550"
            fadeDistance={42}
          />
        </>
      )}
    </>
  );
}

// ─── Viewer ──────────────────────────────────────────────────────────────────

export function TourViewer3D({ property, tour }: { property: Property; tour: PropertyTour }) {
  const sections = tour.sections ?? [];

  /**
   * The published model, when this property has one.
   *
   * Fetched rather than passed in: the tour page is statically generated, and
   * a model published after that build would otherwise never appear until the
   * page was rebuilt.
   */
  const { data: twin } = useQuery({
    queryKey: ['twin', property.slug],
    queryFn: () => twinsApi.get(property.slug),
    staleTime: 5 * 60 * 1000,
  });

  /** Every stop in the tour, flattened, plus which section it came from. */
  const allStops = useMemo(
    () => sections.flatMap((s) => s.scenes.map((sc) => ({ scene: sc, sectionId: s.id, sectionLabel: s.label }))),
    [sections],
  );

  // 'all' is the full tour; otherwise a single section.
  const [routeId, setRouteId] = useState<string>('all');
  const stops = useMemo(
    () => (routeId === 'all' ? allStops : allStops.filter((s) => s.sectionId === routeId)),
    [allStops, routeId],
  );

  const [index, setIndex] = useState(0);
  /**
   * Opens on the dollhouse, as the reference viewer does.
   *
   * Walk mode drops the camera inside a room, and the first thing a visitor
   * sees is then the inside of one wall with no context for where they are.
   * Starting pulled back shows the whole plan first, so "explore" becomes a
   * choice made from somewhere rather than a place to escape from.
   */
  const [mode, setMode] = useState<ViewMode>('dollhouse');
  const [playing, setPlaying] = useState(false);
  const [openTag, setOpenTag] = useState<string | null>(null);
  const [showRooms, setShowRooms] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  // dist is a zoom multiplier, not a distance — the rig scales it by the
  // model's own size, so one value works for any building.
  const [orbit, setOrbit] = useState({ yaw: 0.6, pitch: 0.1, dist: 1 });

  const current = stops[Math.min(index, Math.max(0, stops.length - 1))];
  const target = mode === 'walk' ? anchorFor(current?.scene) : null;

  // Changing route restarts the tour rather than landing mid-way through a
  // sequence the visitor did not choose.
  useEffect(() => {
    setIndex(0);
    setOpenTag(null);
  }, [routeId]);

  const next = useCallback(() => {
    setOpenTag(null);
    setIndex((i) => (stops.length ? (i + 1) % stops.length : 0));
  }, [stops.length]);

  const prev = useCallback(() => {
    setOpenTag(null);
    setIndex((i) => (stops.length ? (i - 1 + stops.length) % stops.length : 0));
  }, [stops.length]);

  /** Guided playback: hold each stop, then move on. */
  useEffect(() => {
    if (!playing || stops.length < 2) return;
    const t = setTimeout(next, 6000);
    return () => clearTimeout(t);
  }, [playing, index, next, stops.length]);

  // Drag to look around, in whichever mode the drag makes sense.
  const drag = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (mode === 'floorplan') return;
    drag.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setOrbit((o) => ({
      ...o,
      yaw: o.yaw - dx * 0.005,
      pitch: Math.max(-0.5, Math.min(0.9, o.pitch + dy * 0.003)),
    }));
  };
  const onUp = () => { drag.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    if (mode !== 'dollhouse') return;
    setOrbit((o) => ({ ...o, dist: Math.max(0.4, Math.min(2.4, o.dist + e.deltaY * 0.0012)) }));
  };

  const shellRef = useRef<HTMLDivElement>(null);
  const goFullscreen = () => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div ref={shellRef} className="relative h-[100dvh] w-full overflow-hidden bg-[#0d1117]">
      <Canvas
        shadows
        dpr={[1, 2]}
        // The camera rig animates from useFrame every frame, so the loop must
        // stay on rather than rendering on demand.
        frameloop="always"
        camera={{ position: MODE_CAMERA.dollhouse.pos, fov: 55, near: 0.1, far: 200 }}
        // Aim the camera before the first frame, so the opening view is the
        // dollhouse rather than whatever direction the default camera faced.
        onCreated={({ gl, camera }) => {
          gl.setClearColor('#0d1117', 1);
          camera.lookAt(...MODE_CAMERA.dollhouse.look);
        }}
        onPointerMissed={() => setOpenTag(null)}
        className="touch-none"
      >
        <Suspense fallback={null}>
          <Scene
            mode={mode}
            target={target}
            orbit={orbit}
            activeRoom={routeId === 'all' ? null : (current?.scene.label ? roomForScene(current.scene.label) : null)}
            openTag={openTag}
            onOpenTag={setOpenTag}
            twin={twin ?? null}
          />
        </Suspense>
      </Canvas>

      {/* Pointer surface, over the canvas so drags never select page text. */}
      <div
        className={cn(
          'absolute inset-0',
          mode === 'floorplan' ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        )}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onWheel={onWheel}
        style={{ pointerEvents: openTag ? 'none' : 'auto' }}
      />

      {/* ── Brand, top left ── */}
      <div className="pointer-events-none absolute left-5 top-5 z-20 flex items-center gap-3">
        <Link
          href={`/${property.slug}`}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65"
          aria-label="Back to property"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="rounded-full bg-black/45 px-3.5 py-1.5 backdrop-blur-md">
          <p className="text-[13px] font-semibold leading-tight text-white">{property.name}</p>
        </div>
      </div>

      {/* ── Tour selector, top right — the part the reference does not have ── */}
      <div className="absolute right-5 top-5 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-black/45 p-1 backdrop-blur-md">
          <RouteChip label="Full tour" active={routeId === 'all'} onClick={() => setRouteId('all')} />
          {sections.map((s) => (
            <RouteChip
              key={s.id}
              label={s.label}
              active={routeId === s.id}
              onClick={() => setRouteId(s.id)}
            />
          ))}
        </div>
        <p className="rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/70 backdrop-blur-md">
          {stops.length} {stops.length === 1 ? 'stop' : 'stops'}
        </p>
      </div>

      {/* ── Caption, bottom left ── */}
      <AnimatePresence mode="wait">
        {current && mode !== 'floorplan' && (
          <motion.div
            key={current.scene.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute bottom-28 left-5 z-20 max-w-md"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
              {current.sectionLabel}
            </p>
            <h2 className="mt-1.5 text-[28px] font-semibold leading-tight text-white drop-shadow-lg sm:text-[34px]">
              {current.scene.label}
            </h2>
            {current.scene.description && (
              <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-white/75 drop-shadow">
                {current.scene.description}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stop rail, bottom ── */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="flex items-end justify-between gap-4 px-5 pb-5">
          {/* Controls */}
          <div className="flex items-center gap-1 rounded-full bg-black/55 p-1 backdrop-blur-md">
            <IconBtn label="Previous stop" onClick={prev}><ChevronLeft size={17} /></IconBtn>
            <IconBtn label={playing ? 'Pause tour' : 'Play tour'} onClick={() => setPlaying((v) => !v)}>
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </IconBtn>
            <IconBtn label="Next stop" onClick={next}><ChevronRight size={17} /></IconBtn>

            <span className="mx-1 h-5 w-px bg-white/20" />

            <ModeBtn active={mode === 'walk'} label="Explore" onClick={() => setMode('walk')}>
              <Footprints size={17} />
            </ModeBtn>
            <ModeBtn active={mode === 'dollhouse'} label="Dollhouse" onClick={() => setMode('dollhouse')}>
              <Home size={17} />
            </ModeBtn>
            <ModeBtn active={mode === 'floorplan'} label="Floor plan" onClick={() => setMode('floorplan')}>
              <Layers size={17} />
            </ModeBtn>

            <span className="mx-1 h-5 w-px bg-white/20" />

            <ModeBtn active={measuring} label="Measure" onClick={() => setMeasuring((v) => !v)}>
              <Ruler size={17} />
            </ModeBtn>
          </div>

          {/* Right-hand utilities */}
          <div className="flex items-center gap-1 rounded-full bg-black/55 p-1 backdrop-blur-md">
            {property.hasVRTour && (
              <Link
                href={`/${property.slug}/tour/vr`}
                aria-label="Virtual reality tour"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
              >
                <Headset size={17} />
              </Link>
            )}
            <IconBtn label="Share" onClick={() => shareTour(property.name)}><Share2 size={17} /></IconBtn>
            <IconBtn label="Fullscreen" onClick={goFullscreen}><Maximize2 size={17} /></IconBtn>
            <IconBtn label="All stops" onClick={() => setShowRooms((v) => !v)}><MoreVertical size={17} /></IconBtn>
          </div>
        </div>

        {/* Progress segments — one per stop, filling as the tour advances. */}
        <div className="flex gap-1 px-5 pb-4">
          {stops.map((s, i) => (
            <button
              key={s.scene.id}
              onClick={() => { setIndex(i); setOpenTag(null); }}
              aria-label={`Go to ${s.scene.label}`}
              className="group h-1.5 flex-1 cursor-pointer rounded-full bg-white/25 transition-colors hover:bg-white/45"
            >
              <span
                className={cn(
                  'block h-full rounded-full transition-all duration-500',
                  i <= index ? 'w-full bg-brand-500' : 'w-0',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Stop list ── */}
      <AnimatePresence>
        {showRooms && (
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-5 top-24 z-30 max-h-[62vh] w-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#12161d]/95 p-2 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-white/50">Stops</p>
              <button
                onClick={() => setShowRooms(false)}
                aria-label="Close stop list"
                className="cursor-pointer rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {stops.map((s, i) => (
              <button
                key={s.scene.id}
                onClick={() => { setIndex(i); setShowRooms(false); setOpenTag(null); }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition-colors',
                  i === index ? 'bg-brand-600/25' : 'hover:bg-white/8',
                )}
              >
                <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10">
                  {s.scene.thumbnailUrl && (
                    <Image src={s.scene.thumbnailUrl} alt="" fill className="object-cover" sizes="64px" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-white">{s.scene.label}</span>
                  <span className="block truncate text-[11px] text-white/45">{s.sectionLabel}</span>
                </span>
              </button>
            ))}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Measurement is honest about itself rather than inventing numbers. */}
      <AnimatePresence>
        {measuring && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute left-1/2 top-24 z-30 w-[min(360px,calc(100vw-2.5rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#12161d]/95 p-4 backdrop-blur-xl"
          >
            <p className="text-[13px] font-semibold text-white">Measurement</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">
              Dimensions come from the surveyed floor plans for this development.
              Open the floor plans on the property page for room-by-room sizes.
            </p>
            <Link
              href={`/${property.slug}#floorplans`}
              className="mt-3 inline-flex rounded-full bg-brand-600 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Open floor plans
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Map a scene name onto one of the modelled rooms, for the highlight. */
function roomForScene(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes('kitchen')) return 'kitchen';
  if (l.includes('living') || l.includes('dining')) return 'living';
  if (l.includes('master')) return 'master';
  if (l.includes('bedroom')) return 'second';
  if (l.includes('balcony')) return 'balcony';
  return null;
}

async function shareTour(name: string) {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  try {
    if (navigator.share) await navigator.share({ title: `${name} — 3D tour`, url });
    else await navigator.clipboard.writeText(url);
  } catch {
    // A cancelled share sheet is not an error worth reporting.
  }
}

function IconBtn({
  label, onClick, children,
}: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
    >
      {children}
    </button>
  );
}

function ModeBtn({
  active, label, onClick, children,
}: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors',
        active ? 'bg-white text-neutral-900' : 'text-white/85 hover:bg-white/15 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function RouteChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
        active ? 'bg-white text-neutral-900' : 'text-white/80 hover:bg-white/15 hover:text-white',
      )}
    >
      {label}
    </button>
  );
}
