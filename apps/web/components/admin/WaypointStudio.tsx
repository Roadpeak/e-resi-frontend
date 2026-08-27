'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '../../lib/utils';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import { twinsApi, type TwinWaypoint } from '../../lib/api/twins';

/**
 * Placing tour stops by standing in the model.
 *
 * The form this replaces asked an administrator to type X, Y and Z. Nobody
 * knows that a bedroom is at (2.63, 1.55, -1.09) — the only way to find out was
 * to load the model in a script and measure, which is how the reference
 * apartment's stops were authored and is not a thing anyone should have to do.
 *
 * So: walk the model, look at what a visitor should see, press Place. Position
 * and look direction both come from where the camera actually is, which also
 * fixes the half of the problem the old form could not express at all — it had
 * no field for a look direction, so every stop faced whatever the viewer's
 * fallback picked, and the reference flat's principal bedroom pointed at a wall.
 *
 * Coordinates are in the viewer's world space, and the model is centred here by
 * exactly the transform TourViewer3D and the panorama bake both apply. That is
 * not a detail: a stop authored in a different space lands somewhere else in
 * the building, and the panorama would be baked from the wrong spot.
 */

/** Eye height, in metres. Matches the viewer's first-person camera. */
const EYE_HEIGHT = 1.6;

/** How fast W/A/S/D walks, in metres per second. */
const WALK_SPEED = 3.2;

function CentredModel({
  url,
  onReady,
}: {
  url: string;
  onReady: (info: { radius: number; floorY: number }) => void;
}) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    /**
     * The same transform the viewer and the bake apply.
     *
     * Centred on x and z, resting on the ground — not centred on all three,
     * which sinks the lower half of a building below the floor. This must match
     * TourViewer3D exactly or an authored stop lands somewhere else entirely.
     */
    const box = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    model.position.set(-centre.x, -box.min.y, -centre.z);

    const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
    onReady({ radius, floorY: 0 });
  }, [model, onReady]);

  return <primitive object={model} />;
}

/**
 * First-person controls: drag to look, WASD to walk, R/F for height.
 *
 * Deliberately a free camera rather than one that collides with the model.
 * Collision would need a floor mesh nobody has authored, and an administrator
 * placing a stop is not a visitor — being able to drift through a wall to reach
 * the far side of a room is a feature here, not a bug.
 */
function FlyCamera({
  yaw,
  pitch,
  height,
  onPose,
}: {
  yaw: React.MutableRefObject<number>;
  pitch: React.MutableRefObject<number>;
  height: React.MutableRefObject<number>;
  onPose: (pose: { pos: THREE.Vector3; look: THREE.Vector3 }) => void;
}) {
  const { camera } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const reported = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Never swallow typing: the label and caption inputs sit beside this.
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
      keys.current.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    // Without this, alt-tabbing mid-stride leaves the camera walking forever.
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera;

    if (keys.current.has('r')) height.current += delta * 1.5;
    if (keys.current.has('f')) height.current = Math.max(0.2, height.current - delta * 1.5);

    cam.rotation.set(0, 0, 0);
    cam.rotateY(yaw.current);
    cam.rotateX(pitch.current);

    // Walk on the horizontal plane only: looking at the ceiling should not
    // drive the camera into it.
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

    const step = WALK_SPEED * delta * (keys.current.has('shift') ? 2.5 : 1);
    const move = new THREE.Vector3();
    if (keys.current.has('w') || keys.current.has('arrowup')) move.add(forward);
    if (keys.current.has('s') || keys.current.has('arrowdown')) move.sub(forward);
    if (keys.current.has('d') || keys.current.has('arrowright')) move.add(right);
    if (keys.current.has('a') || keys.current.has('arrowleft')) move.sub(right);
    if (move.lengthSq() > 0) cam.position.addScaledVector(move.normalize(), step);

    cam.position.y = height.current;

    // Report the pose a few times a second rather than every frame: this drives
    // a React state update, and sixty of those a second is sixty re-renders of
    // the panel beside it for a readout nobody reads that fast.
    reported.current += delta;
    if (reported.current > 0.12) {
      reported.current = 0;
      const look = cam.position.clone().addScaledVector(forward, 2.5);
      onPose({ pos: cam.position.clone(), look });
    }
  });

  return null;
}

/** A marker where each saved stop stands, so the tour is visible while editing. */
function StopMarkers({
  waypoints,
  activeId,
  onPick,
}: {
  waypoints: TwinWaypoint[];
  activeId: string | null;
  onPick: (w: TwinWaypoint) => void;
}) {
  return (
    <group>
      {waypoints.map((w, i) => {
        const active = w.id === activeId;
        return (
          <group key={w.id} position={[w.posX, w.posY, w.posZ]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onPick(w);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = '';
              }}
            >
              <sphereGeometry args={[0.16, 20, 16]} />
              <meshBasicMaterial color={active ? '#fbbc04' : '#1a73e8'} />
            </mesh>
            {/* A stem to the floor: a sphere alone floats ambiguously and gives
                no sense of where in the room the stop actually stands. */}
            <mesh position={[0, -w.posY / 2, 0]}>
              <cylinderGeometry args={[0.012, 0.012, w.posY, 6]} />
              <meshBasicMaterial color={active ? '#fbbc04' : '#1a73e8'} transparent opacity={0.4} />
            </mesh>
            {/* Which way it faces. */}
            <Heading from={[w.posX, w.posY, w.posZ]} to={[w.lookX, w.lookY, w.lookZ]} active={active} />
            <Billboard index={i + 1} active={active} />
          </group>
        );
      })}
    </group>
  );
}

/** An arrow along the stop's look direction. */
function Heading({
  from,
  to,
  active,
}: {
  from: [number, number, number];
  to: [number, number, number];
  active: boolean;
}) {
  const dir = useMemo(() => {
    const v = new THREE.Vector3(to[0] - from[0], 0, to[2] - from[2]);
    return v.lengthSq() < 1e-6 ? null : v.normalize();
  }, [from, to]);

  if (!dir) return null;
  const angle = Math.atan2(dir.x, dir.z);

  return (
    <group rotation={[0, angle, 0]}>
      <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.07, 0.24, 12]} />
        <meshBasicMaterial color={active ? '#fbbc04' : '#1a73e8'} />
      </mesh>
    </group>
  );
}

/** The stop's number, always facing the camera. */
function Billboard({ index, active }: { index: number; active: boolean }) {
  const ref = useRef<THREE.Sprite>(null);
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = active ? '#fbbc04' : '#1a73e8';
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index), 32, 34);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [index, active]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite ref={ref} position={[0, 0.42, 0]} scale={[0.34, 0.34, 0.34]}>
      <spriteMaterial map={texture} depthTest={false} transparent />
    </sprite>
  );
}

export function WaypointStudio({
  slug,
  twinId,
  meshUrl,
  waypoints,
  onChanged,
  onError,
}: {
  slug: string;
  twinId: string;
  meshUrl: string;
  waypoints: TwinWaypoint[];
  onChanged: () => void;
  onError: (e: unknown) => void;
}) {
  const yaw = useRef(0);
  const pitch = useRef(0);
  const height = useRef(EYE_HEIGHT);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const [pose, setPose] = useState<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null);
  const [form, setForm] = useState({ label: '', caption: '', route: '' });
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [baking, setBaking] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const ordered = useMemo(
    () => [...waypoints].sort((a, b) => a.order - b.order),
    [waypoints],
  );

  /** Place a new stop where the camera is standing. */
  async function place() {
    if (!pose || !form.label.trim()) return;
    setBusy('place');
    try {
      await twinsApi.addWaypoint(twinId, slug, {
        label: form.label.trim(),
        caption: form.caption.trim() || undefined,
        route: form.route.trim() || undefined,
        posX: round(pose.pos.x),
        posY: round(pose.pos.y),
        posZ: round(pose.pos.z),
        lookX: round(pose.look.x),
        lookY: round(pose.look.y),
        lookZ: round(pose.look.z),
        order: ordered.length,
      });
      setForm({ label: '', caption: '', route: '' });
      setNote(`Placed "${form.label.trim()}". Re-bake to render its panorama.`);
      onChanged();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  }

  /** Move an existing stop to where the camera is now standing. */
  async function recapture(w: TwinWaypoint) {
    if (!pose) return;
    setBusy(w.id);
    try {
      await twinsApi.updateWaypoint(slug, w.id, {
        posX: round(pose.pos.x),
        posY: round(pose.pos.y),
        posZ: round(pose.pos.z),
        lookX: round(pose.look.x),
        lookY: round(pose.look.y),
        lookZ: round(pose.look.z),
      });
      setNote(`Moved "${w.label}". Its panorama was cleared — re-bake to render it.`);
      onChanged();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  }

  /**
   * Re-aim a stop without moving it.
   *
   * Separate from recapture because it costs nothing: the panorama is a full
   * sphere, so where the camera looks is a viewer-side heading rather than
   * something baked in. Re-aiming keeps the rendered image.
   */
  async function reaim(w: TwinWaypoint) {
    if (!pose) return;
    setBusy(w.id);
    try {
      const dir = pose.look.clone().sub(pose.pos).setY(0).normalize();
      const look = new THREE.Vector3(w.posX, w.posY, w.posZ).addScaledVector(dir, 1.5);
      await twinsApi.updateWaypoint(slug, w.id, {
        lookX: round(look.x),
        lookY: round(w.posY - 0.25),
        lookZ: round(look.z),
      });
      setNote(`Re-aimed "${w.label}". Its panorama still applies — no re-bake needed.`);
      onChanged();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  }

  /** Stand where a stop stands, so its framing can be judged before editing. */
  function goTo(w: TwinWaypoint) {
    setEditing(w.id);
    height.current = w.posY;
    yaw.current = Math.atan2(w.lookX - w.posX, w.lookZ - w.posZ);
    pitch.current = 0;
    // The camera itself is moved inside the frame loop, which owns position;
    // this is the one place outside it that needs to write, so it goes through
    // a ref the loop reads on its next tick.
    moveTo.current = new THREE.Vector3(w.posX, w.posY, w.posZ);
  }
  const moveTo = useRef<THREE.Vector3 | null>(null);

  async function move(w: TwinWaypoint, delta: number) {
    const next = [...ordered];
    const i = next.findIndex((s) => s.id === w.id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setBusy(w.id);
    try {
      await twinsApi.reorderWaypoints(twinId, slug, next.map((s) => s.id));
      onChanged();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  }

  async function remove(w: TwinWaypoint) {
    setBusy(w.id);
    try {
      await twinsApi.removeWaypoint(slug, w.id);
      if (editing === w.id) setEditing(null);
      onChanged();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  }

  const unbaked = ordered.filter((w) => !w.panoramaUrl).length;

  async function bake() {
    setBaking(true);
    setNote('Rendering — about 25 seconds a stop. This page can be left open.');
    try {
      const r = await twinsApi.bakePanoramas(twinId, slug, { stale: true });
      setNote(r.message);
      onChanged();
    } catch (e) {
      onError(e);
      setNote(null);
    } finally {
      setBaking(false);
    }
  }

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaed] p-5">
        <div>
          <h2 className="text-[16px] font-medium text-[#202124]">Tour stops</h2>
          <p className="mt-0.5 text-[13px] text-[#5f6368]">
            Walk to a spot, look at what a visitor should see, then place a stop there.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#f1f3f4] px-2.5 py-1 text-[12px] text-[#5f6368]">
            {ordered.length} {ordered.length === 1 ? 'stop' : 'stops'}
            {unbaked > 0 && ` · ${unbaked} unrendered`}
          </span>
          <button
            onClick={bake}
            disabled={baking || !ordered.length || !unbaked}
            title={
              !ordered.length
                ? 'Place a stop first'
                : !unbaked
                  ? 'Every stop already has a panorama'
                  : `Render ${unbaked} panorama${unbaked === 1 ? '' : 's'}`
            }
            className="h-9 cursor-pointer rounded-xl bg-[#1a73e8] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:cursor-default disabled:opacity-40"
          >
            {baking ? 'Rendering…' : 'Render panoramas'}
          </button>
        </div>
      </div>

      {note && (
        <p className="border-b border-[#e8eaed] bg-[#e8f0fe] px-5 py-2.5 text-[13px] text-[#1967d2]">
          {note}
        </p>
      )}

      <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
        {/* ── The model ── */}
        <div
          className="relative h-[520px] cursor-grab overflow-hidden bg-[#202124] active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY };
            (e.target as Element).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const dx = e.clientX - drag.current.x;
            const dy = e.clientY - drag.current.y;
            drag.current = { x: e.clientX, y: e.clientY };
            yaw.current -= dx * 0.0045;
            pitch.current = Math.max(-1.3, Math.min(1.3, pitch.current - dy * 0.0045));
          }}
          onPointerUp={(e) => {
            drag.current = null;
            (e.target as Element).releasePointerCapture?.(e.pointerId);
          }}
        >
          <Canvas camera={{ fov: 70, near: 0.05, far: 500, position: [0, EYE_HEIGHT, 3] }} dpr={[1, 2]}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[6, 10, 5]} intensity={1.1} />
            <Suspense fallback={null}>
              <CentredModel url={meshUrl} onReady={() => undefined} />
            </Suspense>
            <StopMarkers waypoints={ordered} activeId={editing} onPick={goTo} />
            <CameraDriver moveTo={moveTo} />
            <FlyCamera yaw={yaw} pitch={pitch} height={height} onPose={setPose} />
          </Canvas>

          {/* Crosshair: the look direction is taken from the centre of the view,
              so it has to be visible where that centre is. */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-5 w-5 rounded-full border-2 border-white/70 shadow" />
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl bg-black/55 px-3 py-2 font-mono text-[11.5px] leading-relaxed text-white/85 backdrop-blur">
            <div>drag look · WASD walk · shift run · R/F height</div>
            {pose && (
              <div className="mt-0.5 text-white/60">
                x {pose.pos.x.toFixed(2)} · y {pose.pos.y.toFixed(2)} · z {pose.pos.z.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* ── The panel ── */}
        <div className="border-t border-[#e8eaed] p-4 lg:border-l lg:border-t-0">
          <div className="rounded-2xl bg-[#f8f9fa] p-3.5">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Stop name, e.g. Principal bedroom"
              maxLength={80}
              className="h-10 w-full rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]"
            />
            <input
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              placeholder="Caption (optional)"
              maxLength={300}
              className="mt-2 h-10 w-full rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]"
            />
            <input
              value={form.route}
              onChange={(e) => setForm({ ...form, route: e.target.value })}
              placeholder="Route (optional)"
              maxLength={60}
              className="mt-2 h-10 w-full rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]"
            />
            <button
              onClick={place}
              disabled={busy === 'place' || !form.label.trim() || !pose}
              className="mt-2 h-10 w-full cursor-pointer rounded-xl bg-[#1a73e8] text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:cursor-default disabled:opacity-40"
            >
              {busy === 'place' ? 'Placing…' : 'Place stop here'}
            </button>
          </div>

          <ul className="mt-3 max-h-[300px] space-y-1.5 overflow-y-auto">
            {ordered.map((w, i) => (
              <li
                key={w.id}
                className={cn(
                  'rounded-xl border p-2.5 transition-colors',
                  editing === w.id ? 'border-[#fbbc04] bg-[#fef7e0]' : 'border-[#dadce0]',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[12px] font-medium tabular-nums text-[#5f6368]">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => goTo(w)}
                    className="min-w-0 flex-1 cursor-pointer text-left"
                    title="Stand at this stop"
                  >
                    <span className="block truncate text-[14px] text-[#202124]">{w.label}</span>
                    <span className="block truncate text-[11.5px] text-[#80868b]">
                      {w.panoramaUrl ? 'rendered' : 'not rendered'}
                      {w.route ? ` · ${w.route}` : ''}
                    </span>
                  </button>
                  <button
                    onClick={() => move(w, -1)}
                    disabled={i === 0 || busy === w.id}
                    aria-label={`Move ${w.label} earlier`}
                    className="shrink-0 cursor-pointer rounded-full p-1 text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-30"
                  >
                    <MaterialIcon name="arrow_upward" size={15} />
                  </button>
                  <button
                    onClick={() => move(w, 1)}
                    disabled={i === ordered.length - 1 || busy === w.id}
                    aria-label={`Move ${w.label} later`}
                    className="shrink-0 cursor-pointer rounded-full p-1 text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-30"
                  >
                    <MaterialIcon name="arrow_downward" size={15} />
                  </button>
                  <button
                    onClick={() => remove(w)}
                    disabled={busy === w.id}
                    aria-label={`Remove ${w.label}`}
                    className="shrink-0 cursor-pointer rounded-full p-1 text-[#5f6368] transition-colors hover:bg-[#fce8e6] hover:text-[#c5221f]"
                  >
                    <MaterialIcon name="close" size={15} />
                  </button>
                </div>

                {editing === w.id && (
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => reaim(w)}
                      disabled={busy === w.id || !pose}
                      title="Point this stop where the camera is looking. Keeps its panorama."
                      className="h-8 flex-1 cursor-pointer rounded-lg border border-[#dadce0] bg-white text-[12.5px] text-[#202124] hover:bg-[#f8f9fa] disabled:opacity-40"
                    >
                      Re-aim here
                    </button>
                    <button
                      onClick={() => recapture(w)}
                      disabled={busy === w.id || !pose}
                      title="Move this stop to where the camera is standing. Clears its panorama."
                      className="h-8 flex-1 cursor-pointer rounded-lg border border-[#dadce0] bg-white text-[12.5px] text-[#202124] hover:bg-[#f8f9fa] disabled:opacity-40"
                    >
                      Move here
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {!ordered.length && (
            <p className="mt-3 rounded-xl bg-[#f8f9fa] p-3 text-[13px] text-[#5f6368]">
              No stops yet. Without them the tour falls back to rooms read out of
              the model&rsquo;s own node names, which works but has no captions and
              no authored framing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Applies a requested jump. Position is owned by the frame loop, so it reads here. */
function CameraDriver({ moveTo }: { moveTo: React.MutableRefObject<THREE.Vector3 | null> }) {
  const { camera } = useThree();
  useFrame(() => {
    if (!moveTo.current) return;
    camera.position.copy(moveTo.current);
    moveTo.current = null;
  });
  return null;
}

/** Two decimal places is millimetres — well past what anyone is aiming by. */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}
