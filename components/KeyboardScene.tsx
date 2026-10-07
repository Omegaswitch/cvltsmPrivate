'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { SpotLight } from 'three';
import KeyboardModel, { type KeyboardMode } from './KeyboardModel';

/**
 * The lighting is the composition. One narrow key light from above and to the
 * left, nothing else, so the object is found piece by piece rather than shown.
 * The light moves a few hundredths of a unit with the pointer; the object does not chase it.
 */
function LightRig({ mode }: { mode: KeyboardMode }) {
  const spot = useRef<SpotLight>(null);
  const { pointer } = useThree();
  const base = useRef({ x: -4, y: 9, z: 5 });

  useEffect(() => {
    if (spot.current) spot.current.target.position.set(0, 0, 0);
  }, []);

  useFrame(() => {
    const s = spot.current;
    if (!s) return;
    const drift = mode === 'hero' ? 0.35 : 0.15;
    s.position.set(base.current.x + pointer.x * drift, base.current.y, base.current.z + pointer.y * drift);
  });

  return (
    <>
      <spotLight
        ref={spot}
        position={[base.current.x, base.current.y, base.current.z]}
        angle={0.2}
        penumbra={0.9}
        intensity={mode === 'hero' ? 230 : 190}
        distance={30}
        color="#e9e3d6"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[6, -2, -6]} intensity={mode === 'hero' ? 4 : 2} color="#541817" distance={18} />
    </>
  );
}

export default function KeyboardScene({ mode }: { mode: KeyboardMode }) {
  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, 1.6]}
      shadows
      camera={{ position: [0, 13, 16.5], fov: 24, near: 0.1, far: 90 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      flat
    >
      <LightRig mode={mode} />
      <KeyboardModel mode={mode} />
    </Canvas>
  );
}
