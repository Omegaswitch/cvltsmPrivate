'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { SpotLight } from 'three';
import KeyboardModel from './KeyboardModel';

/**
 * One narrow key light from above and to the left. It drifts a few hundredths
 * of a unit with the pointer; the object does not chase the cursor.
 */
function LightRig() {
  const spot = useRef<SpotLight>(null);
  const { pointer } = useThree();

  useFrame(() => {
    spot.current?.position.set(-4 + pointer.x * 0.35, 9, 5 + pointer.y * 0.35);
  });

  return (
    <>
      <spotLight
        ref={spot}
        position={[-4, 9, 5]}
        angle={0.2}
        penumbra={0.9}
        intensity={230}
        distance={30}
        color="#e9e3d6"
      />
      <pointLight position={[6, -2, -6]} intensity={4} color="#541817" distance={18} />
    </>
  );
}

export default function KeyboardScene() {
  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, 1.25]}
      camera={{ position: [0, 13, 16.5], fov: 24, near: 0.1, far: 90 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      flat
    >
      <LightRig />
      <KeyboardModel />
    </Canvas>
  );
}
