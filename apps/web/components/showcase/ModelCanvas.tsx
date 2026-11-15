'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, Environment, Html, Lightformer, OrbitControls, useGLTF, useProgress } from '@react-three/drei';

function Loading() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="whitespace-nowrap rounded-full bg-black/50 px-4 py-2 font-google text-[13px] text-white backdrop-blur-sm">
        Loading 3D… {Math.round(progress)}%
      </div>
    </Html>
  );
}

function Model({ url }: { url: string }) {
  // `true` enables Draco-compressed models (decoder from Google's CDN).
  const { scene } = useGLTF(url, true);
  return (
    // Fit the model to the view whatever size it was exported at.
    <Bounds fit clip observe margin={1.15}>
      <Center>
        <primitive object={scene} />
      </Center>
    </Bounds>
  );
}

/**
 * One .glb on a canvas: drag to orbit, wheel or pinch to zoom, right-drag to
 * pan. Lighting is built in (no HDR download), so it renders the same offline.
 * `interactive` false leaves touches to the page so a phone can scroll past.
 */
export default function ModelCanvas({ url, preload, interactive = true }: { url: string; preload?: string | null; interactive?: boolean }) {
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (preload) useGLTF.preload(preload, true); }, [preload]);

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [6, 4, 8], fov: 40, near: 0.05, far: 2000 }}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
      onPointerDown={() => setTouched(true)}
      style={{ touchAction: interactive ? 'none' : 'pan-y' }}
    >
      <color attach="background" args={['#0d0f14']} />
      <hemisphereLight args={['#ffffff', '#30343f', 0.7]} />
      <directionalLight position={[8, 12, 6]} intensity={1.6} />
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 6, -6]} scale={[12, 4, 1]} />
        <Lightformer intensity={1.2} position={[-6, 3, 4]} scale={[6, 6, 1]} />
        <Lightformer intensity={1.2} position={[6, 3, 4]} scale={[6, 6, 1]} />
      </Environment>
      <Suspense fallback={<Loading />}>
        <Model key={url} url={url} />
      </Suspense>
      <OrbitControls
        makeDefault
        enabled={interactive}
        enableDamping
        dampingFactor={0.08}
        autoRotate={!touched}
        autoRotateSpeed={0.6}
        minDistance={0.2}
        maxDistance={500}
      />
    </Canvas>
  );
}
