'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { XROrigin, useXRInputSourceState, useXR } from '@react-three/xr';
import * as THREE from 'three';
import type { DigitalTwin } from '../../../lib/api/twins';

/**
 * What a headset actually sees.
 *
 * Separated from the page chrome because everything in here only runs inside a
 * live `immersive-vr` session, where there is no DOM, no pointer and no
 * viewport — the headset supplies the camera and we may not touch it. The one
 * thing we control is where the player's feet are, which is what `XROrigin`
 * sets.
 */

/** Eye height is the headset's business; the origin is the floor under it. */
const FLOOR = 0;

/**
 * Metres per second on the thumbstick.
 *
 * Slow enough to read as walking rather than flying: pushing a viewer through
 * a building faster than a walk is the single most reliable way to make them
 * motion sick, and a buyer who takes the headset off is not a buyer.
 */
const WALK_SPEED = 1.6;

/**
 * Snap turning, in degrees.
 *
 * Deliberately snap rather than smooth: continuous rotation is the other
 * classic nausea trigger, and every shipped headset tour uses snap for this
 * reason. 30° is the Quest system default, so it is what the hardware's own
 * users already expect.
 */
export const SNAP_DEGREES = 30;
const SNAP_DEADZONE = 0.7;

interface Props {
  twin: DigitalTwin;
  /** Where the player starts, in model space. */
  start?: { x: number; z: number };
  /** Reports model size once measured, so the page can show it. */
  onMeasured?: (info: {
    radius: number;
    height: number;
    width: number;
    triangles?: number | null;
  }) => void;
}

/**
 * The building, stood on the floor at true scale.
 *
 * Unlike the desktop viewer this one must not re-frame anything: in VR the
 * model has to sit at its real size in the room, because the headset maps one
 * scene unit to one metre. Scaling it to fit a screen would leave a buyer
 * standing in a doll's house or a cathedral.
 */
function Building({ twin, onMeasured }: { twin: DigitalTwin; onMeasured?: Props['onMeasured'] }) {
  const { scene } = useGLTF(twin.meshUrl);
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const scale = twin.scale || 1;
    const box = new THREE.Box3().setFromObject(scene);
    const centre = box.getCenter(new THREE.Vector3());

    // Centred on the player horizontally, resting on the floor — the same
    // placement the desktop viewer uses, so a model that looked right there
    // is not suddenly buried or floating here.
    model.position.set(-centre.x * scale, -box.min.y * scale, -centre.z * scale);
    model.scale.setScalar(scale);

    const size = box.getSize(new THREE.Vector3());
    onMeasured?.({
      radius: size.length() / 2 * scale,
      // The box itself, so the preview can frame a tower without treating it
      // as a sphere the width of its own height.
      height: size.y * scale,
      width: Math.max(size.x, size.z) * scale,
      triangles: twin.triangles,
    });
  }, [model, scene, twin.scale, twin.triangles, onMeasured]);

  return <primitive object={model} />;
}

/**
 * Thumbstick locomotion.
 *
 * Hand-rolled rather than using the library's locomotion helper so movement
 * stays relative to where the viewer is *looking*, which is what people expect
 * from a headset, and so the comfort choices above (walk speed, snap turning)
 * are visible here rather than buried in options.
 */
function Locomotion({ enabled }: { enabled: boolean }) {
  const left = useXRInputSourceState('controller', 'left');
  const right = useXRInputSourceState('controller', 'right');
  const origin = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const snapped = useRef(false);

  useFrame((_, dt) => {
    const rig = origin.current;
    if (!rig || !enabled) return;

    // ── Move: left stick, relative to gaze ──
    const move = left?.gamepad?.['xr-standard-thumbstick'];
    if (move) {
      const x = move.xAxis ?? 0;
      const y = move.yAxis ?? 0;
      if (Math.abs(x) > 0.15 || Math.abs(y) > 0.15) {
        // Flatten the look direction: pushing forward while looking at the
        // ceiling should still walk across the floor, not into it.
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();
        const strafe = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));

        rig.position.addScaledVector(dir, -y * WALK_SPEED * dt);
        rig.position.addScaledVector(strafe, x * WALK_SPEED * dt);
      }
    }

    // ── Turn: right stick, snapped ──
    const turn = right?.gamepad?.['xr-standard-thumbstick'];
    const tx = turn?.xAxis ?? 0;
    if (Math.abs(tx) > SNAP_DEADZONE) {
      // One snap per push — held past the deadzone must not spin the viewer.
      if (!snapped.current) {
        rig.rotation.y -= Math.sign(tx) * THREE.MathUtils.degToRad(SNAP_DEGREES);
        snapped.current = true;
      }
    } else {
      snapped.current = false;
    }
  });

  return <XROrigin ref={origin} position={[0, FLOOR, 0]} />;
}

/**
 * Frames the model for the flat preview, and gets out of the way in VR.
 *
 * The model is placed for a headset — true scale, centred on the player, who
 * therefore starts *inside* the building. That is correct once someone is
 * wearing a headset and wrong on a monitor, where it reads as a camera stuck
 * in the ceiling. So on screen the camera pulls back to frame the whole
 * building; the moment a session starts the headset owns the camera and this
 * stops touching it.
 */
function PreviewCamera({
  radius, height, width, active,
}: { radius: number; height: number; width: number; active: boolean }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const applied = useRef('');

  useEffect(() => {
    const key = `${height}:${width}:${size.width}x${size.height}`;
    if (!active || !height || applied.current === key) return;
    applied.current = key;

    const cam = camera as THREE.PerspectiveCamera;

    /**
     * Fit the building to the viewport, from its box rather than its sphere.
     *
     * A tower is tall and narrow, so its bounding sphere is far wider than the
     * building — backing off by that radius leaves it small and, once aimed at
     * the middle, clipped at the top. Solving the actual trigonometry against
     * height and width means a tower, a villa and a clubhouse each fill the
     * frame properly instead of one being tuned at the others' expense.
     */
    const vFov = (cam.fov * Math.PI) / 180;
    const aspect = Math.max(0.2, size.width / Math.max(1, size.height));
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

    const distForHeight = (height / 2) / Math.tan(vFov / 2);
    const distForWidth = (width / 2) / Math.tan(hFov / 2);
    // 1.25 leaves a margin so the roofline is not flush against the edge.
    const dist = Math.max(distForHeight, distForWidth) * 1.25;

    const mid = height / 2;
    // Three-quarter view: enough angle to read depth, not so much that it
    // becomes a plan.
    cam.position.set(dist * 0.62, mid + height * 0.12, dist * 0.62);
    cam.near = Math.max(0.05, radius * 0.01);
    cam.far = Math.max(200, radius * 12);
    cam.updateProjectionMatrix();
    cam.lookAt(0, mid, 0);
  }, [camera, radius, height, width, active, size.width, size.height]);

  return null;
}

export function VRScene({ twin, onMeasured }: Props) {
  /**
   * Read the session directly rather than mirroring it into state.
   *
   * `XROrigin` has to be mounted *before* a session starts — it is what the
   * runtime binds the reference space to, and an origin that appears a render
   * later leaves the player with no floor to stand on. Keeping this a plain
   * subscription rather than a `useEffect` means the origin is in the tree
   * from the first frame and only the movement maths waits for the session.
   */
  const session = useXR((s) => s.session);
  const [dims, setDims] = useState({ radius: 0, height: 0, width: 0 });

  const measured = useCallback((info: Parameters<NonNullable<Props['onMeasured']>>[0]) => {
    setDims({ radius: info.radius, height: info.height, width: info.width });
    onMeasured?.(info);
  }, [onMeasured]);

  return (
    <>
      {/* Interior lighting: a model exported without lights is otherwise a
          black silhouette in a headset, where there is no fallback ambient. */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 12, 6]} intensity={1.2} castShadow />
      <Environment preset="apartment" />

      <Building twin={twin} onMeasured={measured} />
      <PreviewCamera
        radius={dims.radius}
        height={dims.height}
        width={dims.width}
        active={!session}
      />
      <Locomotion enabled={!!session} />
    </>
  );
}
