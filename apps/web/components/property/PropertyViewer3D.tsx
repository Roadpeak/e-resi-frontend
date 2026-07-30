'use client';

import { Suspense, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Box, Sphere } from '@react-three/drei';
import { Headset, RotateCcw, ZoomIn, ZoomOut, Box as BoxIcon } from 'lucide-react';
import type { Property } from '../../lib/types';

// Placeholder architectural scene — in production this loads a real .glb file
function ArchitectureModel() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0e1423" />
      </mesh>
      <Grid position={[0, 0, 0]} args={[20, 20]} cellSize={1} cellThickness={0.5} cellColor="#1a2540" sectionSize={5} sectionThickness={1} sectionColor="#2e3e66" fadeDistance={25} />

      {/* Building base */}
      <Box args={[6, 0.3, 6]} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#131c30" />
      </Box>

      {/* Main tower */}
      <Box args={[4, 8, 4]} position={[0, 4.3, 0]}>
        <meshStandardMaterial color="#1a2540" metalness={0.3} roughness={0.4} />
      </Box>

      {/* Glass facade strips */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Box key={i} args={[4.02, 0.4, 4.02]} position={[0, 1 + i * 0.75, 0]}>
          <meshStandardMaterial color="#6172f3" transparent opacity={0.15} metalness={0.9} roughness={0.1} />
        </Box>
      ))}

      {/* Roof features */}
      <Box args={[2, 1, 2]} position={[0, 8.8, 0]}>
        <meshStandardMaterial color="#233050" />
      </Box>
      <Sphere args={[0.3]} position={[0, 9.6, 0]}>
        <meshStandardMaterial color="#6172f3" emissive="#6172f3" emissiveIntensity={0.5} />
      </Sphere>

      {/* Surrounding low buildings */}
      {[[-5, 1.5, -3], [5, 1, 2], [-4, 1, 3], [4, 2, -4]].map(([x, h, z], i) => (
        <Box key={i} args={[2.5, h * 2, 2.5]} position={[x, h, z]}>
          <meshStandardMaterial color="#0e1423" />
        </Box>
      ))}

      {/* Point light to simulate sky */}
      <pointLight position={[10, 20, 10]} intensity={1.5} color="#a5bcfd" />
      <ambientLight intensity={0.4} />
    </group>
  );
}

interface Props { property: Property }

export function PropertyViewer3D({ property }: Props) {
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    controlsRef.current?.reset();
  };

  return (
    <section id="viewer3d" className="scroll-mt-24">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-400">Immersive Experience</p>
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-3xl font-semibold text-white">Interactive 3D Model</h2>
        <button className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-sm text-brand-300 hover:bg-brand-500/20 transition-colors cursor-pointer">
          <Headset size={15} /> Enter VR Mode
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl border border-white/5 bg-surface-900"
        style={{ height: '560px' }}
      >
        {/* 3D Canvas */}
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[12, 8, 12]} fov={45} />
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={30}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate
            autoRotateSpeed={0.4}
          />
          <Environment preset="night" />
          <Suspense fallback={null}>
            <ArchitectureModel />
          </Suspense>
        </Canvas>

        {/* Controls overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-1">
            <button onClick={resetCamera} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              <RotateCcw size={14} />
            </button>
            <div className="h-4 w-px bg-white/10" />
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              <ZoomIn size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              <ZoomOut size={14} />
            </button>
          </div>
        </div>

        {/* Label */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm px-3 py-1.5">
          <BoxIcon size={13} className="text-brand-400" />
          <span className="text-xs font-medium text-white/70">{property.name} — 3D Model</span>
        </div>

        {/* Hint */}
        <div className="absolute top-4 right-4 text-xs text-white/30 bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1.5">
          Drag to rotate · Scroll to zoom
        </div>
      </motion.div>
    </section>
  );
}
