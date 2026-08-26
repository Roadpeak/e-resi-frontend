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
  Maximize2, Share2, MoreVertical, Ruler, Layers, LayoutGrid, X, Home, Footprints,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { twinsApi, type DigitalTwin } from '../../../lib/api/twins';
import type { Property, PropertyTour, TourScene } from '../../../lib/types';
import { deriveRooms, type DerivedRoom } from '../../../lib/tour/rooms';

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

/**
 * One stop on the tour, whatever it was built from.
 *
 * `pos` is null only for legacy scenes, which carry no coordinates — the
 * viewer falls back to the preset anchors for those and cannot do better,
 * because the data does not exist.
 */
interface Stop {
  id: string;
  label: string;
  caption: string | null;
  pos: [number, number, number] | null;
  look: [number, number, number] | null;
  /** Longest side of the room, for framing. Zero when unknown. */
  extent: number;
  sectionId: string;
  sectionLabel: string;
  /** Present only on legacy scene stops. */
  scene?: TourScene;
}

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
  onRooms,
}: {
  url: string;
  scale: number;
  /** Reports the model's size so the camera can frame it. */
  onMeasured: (radius: number, centre: THREE.Vector3) => void;
  /** Reports the rooms read out of the model's own node names. */
  onRooms?: (rooms: DerivedRoom[]) => void;
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

    /**
     * Centred horizontally, but stood on the ground.
     *
     * Centring all three axes put the model's midpoint at the origin, which
     * sinks the lower half of a building beneath the ground plane — the
     * bottom floors simply disappeared. A building rests on the ground; only
     * x and z want centring.
     */
    model.position.set(
      -centre.x * scale,
      -box.min.y * scale,
      -centre.z * scale,
    );
    onMeasured(radius, centre);

    /**
     * Read the rooms *after* positioning.
     *
     * deriveRooms measures world-space boxes, and the line above has just
     * moved the model — measuring before it would hand the camera coordinates
     * from the model's authored origin, which for a Sketchfab capture can be
     * anywhere. Updating the world matrices first is what makes the derived
     * centres the same space the camera flies in.
     */
    if (onRooms) {
      model.updateWorldMatrix(true, true);
      onRooms(deriveRooms(model));
    }
  }, [model, scale, onMeasured, onRooms]);

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
  focusExtent = 0,
  eyepoint = null,
}: {
  mode: ViewMode;
  target: [number, number, number] | null;
  orbit: { yaw: number; pitch: number; dist: number };
  /** Bounding radius of whatever is loaded; drives distances and clip planes. */
  radius: number;
  /** Longest side of the room in focus, so framing suits the room not the block. */
  focusExtent?: number;
  /** An authored stand-here-look-there viewpoint, which overrides the orbit. */
  eyepoint?: { pos: [number, number, number]; look: [number, number, number] } | null;
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

  /**
   * Clipping planes follow the model too.
   *
   * These were fixed at 0.1 and 200, which suited a model a few metres across.
   * A villa exported at 290 units wide needs the camera roughly 440 units out
   * — beyond the far plane — so every triangle was clipped and the scene
   * rendered empty while the file downloaded perfectly well.
   */
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.near = Math.max(0.05, radius * 0.01);
    cam.far = Math.max(200, radius * 12);
    cam.updateProjectionMatrix();
  }, [camera, radius]);

  useFrame((_, dt) => {

    if (eyepoint) {
      /**
       * Exactly where the author put it.
       *
       * Drag still turns the head — yaw rotates the aim around the standing
       * point rather than moving the camera — so a visitor can look around
       * from the spot without losing it.
       */
      wantPos.current.set(eyepoint.pos[0], eyepoint.pos[1], eyepoint.pos[2]);
      const dx = eyepoint.look[0] - eyepoint.pos[0];
      const dz = eyepoint.look[2] - eyepoint.pos[2];
      const dist = Math.max(0.5, Math.hypot(dx, dz));
      const baseYaw = Math.atan2(dx, dz);
      const yaw = baseYaw + orbit.yaw;
      wantLook.current.set(
        eyepoint.pos[0] + Math.sin(yaw) * dist,
        eyepoint.look[1] + orbit.pitch * 1.5,
        eyepoint.pos[2] + Math.cos(yaw) * dist,
      );
    } else if (mode === 'walk' && target && focusExtent > 0) {
      /**
       * Standing in the room, at eye height, looking across it.
       *
       * This used to hold the camera outside the room looking in, because the
       * placeholder plan was five hollow boxes and any eye-height position
       * inside one had a wall against the lens. A real captured interior does
       * not have that problem: it has furniture, depth and something to look
       * at in every direction, which is exactly why a first-person viewpoint
       * is what a walkthrough should be — it is the difference between being
       * in a room and inspecting a model of one.
       *
       * Stand at the room's edge and look across it, rather than on its
       * centre point.
       *
       * Standing on the centre point is what a floor-plan pin describes, not
       * what a person does — and with the near plane at a few centimetres, the
       * centre of a furnished room is usually inside a sofa. Backing off by
       * most of the room's half-width puts the camera against the wall it
       * entered by, which is where a photographer stands and what makes the
       * whole room readable in one frame.
       */
      const half = Math.max(1.6, (focusExtent || 4) * 0.42);
      const back = half * orbit.dist;
      const eye = target[1] + Math.max(0.2, (focusExtent || 4) * 0.06);
      wantPos.current.set(
        target[0] + Math.sin(orbit.yaw) * back,
        eye,
        target[2] + Math.cos(orbit.yaw) * back,
      );
      // Aim at the room's centre, level. A walkthrough that looks at the floor
      // reads as a stumble, and one that looks at the ceiling reads as a fall.
      wantLook.current.set(
        target[0],
        eye + orbit.pitch * 1.5,
        target[2],
      );
    } else if (
      (mode === 'walk' && (!target || focusExtent <= 0)) ||
      (mode === 'dollhouse' && !target)
    ) {
      /**
       * No stop to stand in yet — frame the whole thing.
       *
       * Walk mode has no target until the model has loaded and reported its
       * rooms, which takes a second or two on a real mesh. Without this branch
       * the camera sat at the origin inside the geometry and the opening frame
       * was black, which reads as a broken viewer rather than as loading.
       */
      const mid = radius * 0.45;
      const r = radius * 2.1 * orbit.dist;
      wantPos.current.set(
        Math.sin(orbit.yaw) * r,
        Math.max(radius * 0.35, mid + radius * 0.7 + orbit.pitch * radius),
        Math.cos(orbit.yaw) * r,
      );
      wantLook.current.set(0, mid, 0);
    } else if (mode === 'dollhouse' && target) {
      /**
       * Dollhouse, focused on one room.
       *
       * This is what makes a guided tour read as a tour rather than as a
       * caption changing under a static model. The camera stays outside and
       * above — the dollhouse view's whole appeal is seeing the plan with the
       * roof off — but it closes in on the room being described and orbits
       * around *that*, not around the building's centre.
       *
       * Distance is taken from the room's own extent rather than the
       * building's, so a corridor is framed as tightly as a corridor deserves
       * and a living room gets the room it needs.
       */
      const roomR = Math.max(2.5, (focusExtent || radius * 0.5) * 1.9) * orbit.dist;
      wantPos.current.set(
        target[0] + Math.sin(orbit.yaw) * roomR,
        target[1] + roomR * (0.55 + orbit.pitch * 0.5),
        target[2] + Math.cos(orbit.yaw) * roomR,
      );
      wantLook.current.set(target[0], target[1], target[2]);
    } else if (mode === 'dollhouse') {
      // Far enough out to hold the whole building in frame, whatever its size.
      // Aimed at the model's middle height. It stands on the ground now, so
      // the origin is its base — aiming there tips the whole building into the
      // top of the frame.
      const mid = radius * 0.45;
      const r = radius * 2.1 * orbit.dist;
      wantPos.current.set(
        Math.sin(orbit.yaw) * r,
        Math.max(radius * 0.35, mid + radius * 0.7 + orbit.pitch * radius),
        Math.cos(orbit.yaw) * r,
      );
      wantLook.current.set(0, mid, 0);
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

/**
 * Pins on the model.
 *
 * There is no fallback list any more. This used to carry four invented tags —
 * "Quartz worktops, soft-close cabinetry and a fitted oven and hob" — at
 * coordinates picked for the placeholder flat, so every development with a
 * real model showed four pins floating in the wrong places describing a
 * kitchen nobody had photographed. Copy a buyer could reasonably act on, about
 * a property, invented by us.
 *
 * A tag is now either something a person placed against this model, or a room
 * the model itself declares. Both are true statements. Nothing else is shown.
 */
function Tags({
  visible,
  openTag,
  onOpen,
  twinTags,
  rooms,
}: {
  visible: boolean;
  openTag: string | null;
  onOpen: (id: string | null) => void;
  /** Tags placed against the real model, when there is one. */
  twinTags?: { id: string; title: string; body?: string | null; posX: number; posY: number; posZ: number }[];
  /** Rooms read out of the model, used only when nobody has placed tags. */
  rooms?: DerivedRoom[];
}) {
  if (!visible) return null;

  /**
   * Authored tags win. They are anchored in the model's own space and say
   * something specific about the place; a derived room label only says what
   * the room is called, which is worth showing when there is nothing better
   * and worth replacing the moment someone writes a real one.
   */
  const pins: TagDef[] = twinTags?.length
    ? twinTags.map((t) => ({
        id: t.id,
        room: '',
        pos: [t.posX, t.posY, t.posZ] as [number, number, number],
        title: t.title,
        body: t.body ?? '',
      }))
    : (rooms ?? []).map((r) => ({
        id: r.id,
        room: '',
        // Head height inside the room rather than its centre, so the pin sits
        // where a person would be standing rather than inside the furniture.
        pos: [r.centre[0], r.centre[1] + r.size[1] * 0.18, r.centre[2]] as [number, number, number],
        title: r.label,
        body: '',
      }));

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
  focusExtent,
  eyepoint,
  onRooms,
}: {
  mode: ViewMode;
  target: [number, number, number] | null;
  orbit: { yaw: number; pitch: number; dist: number };
  activeRoom: string | null;
  openTag: string | null;
  onOpenTag: (id: string | null) => void;
  twin: DigitalTwin | null;
  /** Longest side of the room in focus, for framing. */
  focusExtent: number;
  /** An authored stand-here-look-there viewpoint. */
  eyepoint: { pos: [number, number, number]; look: [number, number, number] } | null;
  /** Rooms read out of the model, reported up to build the tour from. */
  onRooms: (rooms: DerivedRoom[]) => void;
}) {
  /**
   * Bounding radius of what is on screen.
   *
   * Defaults to the stand-in plan's own size, then updates when a real model
   * reports its dimensions — one rig then frames a flat and a tower alike.
   */
  const [radius, setRadius] = useState(7);
  const onMeasured = useCallback((r: number) => setRadius(Math.max(2, r)), []);

  // Kept here as well as reported upward: Tags needs them to label rooms when
  // nobody has placed a real tag, and threading them back down would be a
  // round trip through the parent for data this component already produced.
  const [derivedRooms, setDerivedRooms] = useState<DerivedRoom[]>([]);
  const handleMeshRooms = useCallback(
    (r: DerivedRoom[]) => {
      setDerivedRooms(r);
      onRooms(r);
    },
    [onRooms],
  );

  return (
    <>
      <CameraRig
        mode={mode}
        target={target}
        orbit={orbit}
        radius={radius}
        focusExtent={focusExtent}
        eyepoint={eyepoint}
      />

      <ambientLight intensity={0.75} />
      <directionalLight position={[7, 12, 6]} intensity={1.25} castShadow />
      <directionalLight position={[-6, 5, -5]} intensity={0.45} />
      <Environment preset="city" />

      {/* The real building when one has been published, the stand-in plan
          until then. Suspense keeps the placeholder on screen while a mesh
          downloads rather than blanking the viewer. */}
      {twin ? (
        <Suspense fallback={<Rooms activeRoom={activeRoom} />}>
          <Mesh url={twin.meshUrl} scale={twin.scale} onMeasured={onMeasured} onRooms={handleMeshRooms} />
        </Suspense>
      ) : (
        <Rooms activeRoom={activeRoom} />
      )}

      <Tags
        visible={mode !== 'floorplan'}
        openTag={openTag}
        onOpen={onOpenTag}
        twinTags={twin?.tags}
        rooms={derivedRooms}
      />

      {/* Ground, only where it reads — a floor plan wants no context. */}
      {mode !== 'floorplan' && (
        <>
          {/* Ground and grid scale with the model. Fixed at 60 units they
              vanished under anything large, leaving it floating in black. */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[radius * 8, radius * 8]} />
            <meshStandardMaterial color="#0d1117" />
          </mesh>
          <Grid
            position={[0, -0.01, 0]}
            args={[radius * 8, radius * 8]}
            cellSize={Math.max(1, radius / 8)}
            cellThickness={0.4}
            cellColor="#1b2436"
            sectionSize={Math.max(5, radius / 1.6)}
            sectionThickness={0.8}
            sectionColor="#2a3550"
            fadeDistance={radius * 6}
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
  const { data: twins = [] } = useQuery({
    queryKey: ['twin', property.slug],
    queryFn: () => twinsApi.list(property.slug),
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Which model is on screen.
   *
   * A development is captured in pieces — the building, a show unit, the pool
   * deck — and a visitor picks between them. Defaults to whichever was marked
   * to open first.
   */
  const [twinId, setTwinId] = useState<string | null>(null);
  const twin = twins.find((t) => t.id === twinId) ?? twins[0] ?? null;

  /** Rooms read out of the loaded model's own node names. */
  const [rooms, setRooms] = useState<DerivedRoom[]>([]);
  // Identity-stable, so Mesh's effect does not re-run every render.
  const handleRooms = useCallback((r: DerivedRoom[]) => setRooms(r), []);

  /**
   * Every stop in the tour, in order of how much the data is worth trusting.
   *
   * 1. Waypoints a person authored. `TwinWaypoint` has carried posX/Y/Z and
   *    lookX/Y/Z since the schema was written — "where the camera goes and
   *    what it says there" — and the viewer never read it. Someone who has
   *    walked the building and placed stops knows better than any heuristic.
   *
   * 2. Rooms derived from the model. Every building arrives with its rooms
   *    named by whoever modelled it, which is enough to build a tour nobody
   *    had to author. This is what a freshly uploaded model gets.
   *
   * 3. The legacy scene list. Photographs and clips arranged as a slideshow,
   *    which is what a "3D tour" meant before it was geometry. Kept so old
   *    developments do not lose their tour, but it cannot move a camera —
   *    a TourScene3D has no coordinates at all, only a cameraPreset enum
   *    mapping onto seven positions invented for the placeholder flat.
   */
  const allStops = useMemo((): Stop[] => {
    if (twin?.waypoints?.length) {
      return [...twin.waypoints]
        .sort((a, b) => a.order - b.order)
        .map((w) => ({
          id: w.id,
          label: w.label,
          caption: w.caption ?? null,
          pos: [w.posX, w.posY, w.posZ] as [number, number, number],
          look:
            w.lookX === null || w.lookY === null || w.lookZ === null
              ? null
              : ([w.lookX, w.lookY, w.lookZ] as [number, number, number]),
          extent: 0,
          sectionId: w.route ?? 'all',
          sectionLabel: w.route ?? '',
        }));
    }

    if (rooms.length) {
      return rooms.map((r) => ({
        id: r.id,
        label: r.label,
        caption: null,
        pos: r.centre,
        look: r.centre,
        extent: r.extent,
        sectionId: 'all',
        sectionLabel: '',
      }));
    }

    return sections.flatMap((s) =>
      s.scenes.map((sc) => ({
        id: sc.id,
        label: sc.label,
        caption: sc.description ?? null,
        pos: null,
        look: null,
        extent: 0,
        sectionId: s.id,
        sectionLabel: s.label,
        scene: sc,
      })),
    );
  }, [twin?.waypoints, rooms, sections]);

  // 'all' is the full tour; otherwise a single section.
  const [routeId, setRouteId] = useState<string>('all');
  const stops = useMemo(
    () => (routeId === 'all' ? allStops : allStops.filter((s) => s.sectionId === routeId)),
    [allStops, routeId],
  );

  const [index, setIndex] = useState(0);
  /**
   * Opens on the dollhouse.
   *
   * First-person is the better opening — it is what the reference viewers do
   * and what a buyer came for — but walk mode cannot place a camera until the
   * mesh has loaded and reported its rooms, which is a second or two on a real
   * model. Opening there means opening on a black frame, and a viewer that
   * looks broken for two seconds is worse than one that opens on the plan and
   * lets you step inside. Walk is one button away, and it now stands in the
   * room properly once there is a room to stand in.
   */
  const [mode, setMode] = useState<ViewMode>('dollhouse');

  /**
   * An authored tour opens where its author put the first stop.
   *
   * The dollhouse is the right opening when the tour is derived — nobody has
   * said where to stand, so showing the plan first is honest. But a waypoint
   * is someone stating exactly that, and opening on the plan then makes the
   * visitor click into the thing that was authored for them. Switching once,
   * when the waypoints arrive, is the difference between a tour and a model.
   */
  const authoredOpen = useRef(false);
  useEffect(() => {
    if (authoredOpen.current) return;
    if (!twin?.waypoints?.length) return;
    authoredOpen.current = true;
    setMode('walk');
  }, [twin?.waypoints?.length]);
  const [playing, setPlaying] = useState(false);
  const [openTag, setOpenTag] = useState<string | null>(null);
  const [showRooms, setShowRooms] = useState(false);
  /** The model tiles, opened from the control bar. */
  const [showModels, setShowModels] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  // dist is a zoom multiplier, not a distance — the rig scales it by the
  // model's own size, so one value works for any building.
  const [orbit, setOrbit] = useState({ yaw: 0.6, pitch: 0.1, dist: 1 });

  const current = stops[Math.min(index, Math.max(0, stops.length - 1))];

  /**
   * Where the camera is going.
   *
   * A stop with real coordinates drives both walk and dollhouse — which is the
   * whole point, because dollhouse is the mode this viewer opens in and it
   * previously had no target at all. `target` being null there is what made
   * Play advance a caption under a camera that never moved.
   *
   * Floor plan stays overhead: it is a plan, and a plan that pans is a map.
   */
  const target = useMemo<[number, number, number] | null>(() => {
    if (mode === 'floorplan') return null;
    if (current?.pos) return current.look ?? current.pos;
    // Legacy scenes: the preset anchors are all there is, and they only ever
    // made sense for walk mode against the placeholder plan.
    return mode === 'walk' ? anchorFor(current?.scene) : null;
  }, [mode, current]);

  /**
   * An authored viewpoint: stand exactly here, aim exactly there.
   *
   * A derived room gives a centre and nothing else, so the rig has to invent a
   * viewpoint by orbiting around it. A waypoint is someone standing in the
   * building saying "from this spot, facing that way" — which is the whole
   * value of authoring one, and orbiting it would throw that away. Only walk
   * mode honours it; the dollhouse is a view *of* the building rather than a
   * view *from* somewhere inside it.
   */
  const eyepoint = useMemo<
    { pos: [number, number, number]; look: [number, number, number] } | null
  >(() => {
    if (mode !== 'walk' || !current?.pos || !current.look) return null;
    return { pos: current.pos, look: current.look };
  }, [mode, current]);

  /** How big the room in focus is, so the camera frames it rather than the block. */
  const focusExtent = current?.extent ?? 0;

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

  /**
   * Guided playback: hold each stop, then move on.
   *
   * The count is read through a ref rather than depended on. `stops` is
   * derived from the rooms the model reports, and that array gets a fresh
   * identity whenever the mesh re-measures — which re-ran this effect, cleared
   * the pending timeout and started a new 6s wait every time. The tour sat on
   * its first stop indefinitely while the Pause button insisted it was
   * playing. Only `playing` and `index` should restart the hold.
   */
  const stopCount = useRef(stops.length);
  stopCount.current = stops.length;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (stopCount.current < 2) return;
      setOpenTag(null);
      setIndex((i) => (i + 1) % stopCount.current);
    }, 6000);
    return () => clearTimeout(t);
  }, [playing, index]);

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
            activeRoom={routeId === 'all' ? null : (current?.scene?.label ? roomForScene(current.scene.label) : null)}
            openTag={openTag}
            onOpenTag={setOpenTag}
            twin={twin ?? null}
            focusExtent={focusExtent}
            eyepoint={eyepoint}
            onRooms={handleRooms}
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
          {twin && twins.length > 1 && (
            <p className="text-[11px] leading-tight text-white/55">{twin.label}</p>
          )}
        </div>
      </div>

      {/* ── Tour selector, top right ── */}
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

      {/* ── Model switcher ──
          A development is captured in pieces, so a visitor chooses what to
          tour: the whole building, a show unit, the amenity deck. Tiles rather
          than a dropdown, because what someone is choosing between is places,
          and a still says more than a name does. */}
      {twins.length > 1 && (
        <AnimatePresence>
          {showModels && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 bottom-24 z-20 px-5"
            >
              <div className="mx-auto flex max-w-4xl gap-2.5 overflow-x-auto pb-1">
                {twins.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTwinId(t.id);
                      setIndex(0);
                      setOpenTag(null);
                      setShowModels(false);
                    }}
                    className={cn(
                      'group relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border-2 text-left transition-all',
                      t.id === twin?.id
                        ? 'border-white shadow-lg'
                        : 'border-white/25 hover:border-white/60',
                    )}
                  >
                    {t.posterUrl ? (
                      <Image src={t.posterUrl} alt="" fill className="object-cover" sizes="128px" />
                    ) : (
                      <span className="absolute inset-0 bg-white/10" />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <span className="absolute inset-x-2 bottom-1.5">
                      <span className="block truncate text-[12px] font-semibold leading-tight text-white">
                        {t.label}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wide text-white/60">
                        {t.kind.toLowerCase()}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Caption, bottom left ── */}
      <AnimatePresence mode="wait">
        {current && mode !== 'floorplan' && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute bottom-28 left-5 z-20 max-w-md"
          >
            {current.sectionLabel && (
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
                {current.sectionLabel}
              </p>
            )}
            <h2 className="mt-1.5 text-[28px] font-semibold leading-tight text-white drop-shadow-lg sm:text-[34px]">
              {current.label}
            </h2>
            {current.caption && (
              <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-white/75 drop-shadow">
                {current.caption}
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

            {twins.length > 1 && (
              <ModeBtn
                active={showModels}
                label="Choose what to tour"
                onClick={() => setShowModels((v) => !v)}
              >
                <LayoutGrid size={17} />
              </ModeBtn>
            )}

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
              key={s.id}
              onClick={() => { setIndex(i); setOpenTag(null); }}
              aria-label={`Go to ${s.label}`}
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
                key={s.id}
                onClick={() => { setIndex(i); setShowRooms(false); setOpenTag(null); }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition-colors',
                  i === index ? 'bg-brand-600/25' : 'hover:bg-white/8',
                )}
              >
                <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10">
                  {s.scene?.thumbnailUrl ? (
                    <Image src={s.scene.thumbnailUrl} alt="" fill className="object-cover" sizes="64px" />
                  ) : (
                    // A room derived from the model has no photograph — its
                    // index reads better than an empty grey box.
                    <span className="flex h-full w-full items-center justify-center text-[12px] font-semibold text-white/40">
                      {i + 1}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-white">{s.label}</span>
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
