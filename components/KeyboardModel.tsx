'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { progress } from '@/lib/progress';

/*
 * The keycaps, procedural until the production model exists: twenty-four
 * tapered caps in four rows of six, with no board under them, so they stand
 * in the dark over the page. Replace the body of this component with the
 * loaded model; the group is what the scroll moves, so the emergence keeps
 * working.
 */

const PITCH = 1.14;
const H = 0.62;
// a square frustum: four radial segments turned 45 degrees, so its faces
// line up with the axes. Radius is the corner distance, side / sqrt(2).
const BOTTOM = 0.98 / Math.SQRT2;
const TOP = 0.74 / Math.SQRT2;

export default function KeyboardModel() {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const cap = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(TOP, BOTTOM, H, 4, 1);
    geometry.rotateY(Math.PI / 4);
    const material = new THREE.MeshStandardMaterial({ color: '#2a2825', roughness: 0.5, metalness: 0.05, transparent: true });
    return { geometry, material };
  }, []);

  const keys = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        list.push({
          x: (col - 2.5) * PITCH + (row % 2 === 1 ? PITCH * 0.12 : 0),
          z: (1.5 - row) * PITCH,
        });
      }
    }
    return list;
  }, []);

  useEffect(() => () => {
    cap.geometry.dispose();
    cap.material.dispose();
  }, [cap]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const p = progress.hero;
    const ease = p * p * (3 - 2 * p);
    const k = Math.min(1, dt * 2.2);
    g.scale.setScalar(THREE.MathUtils.lerp(0.78, 1.12, ease));
    g.position.y = THREE.MathUtils.lerp(-0.6, 0, ease);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.9 + pointer.current.y * 0.025, k);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, pointer.current.x * 0.02, k);
    const opacity = THREE.MathUtils.clamp(0.06 + ease * 1.05, 0, 1);
    cap.material.opacity = opacity;
  });

  return (
    <group ref={group} rotation={[0.9, 0, 0]}>
      {keys.map((k, i) => (
        <mesh key={i} geometry={cap.geometry} material={cap.material} position={[k.x, 0, k.z]} />
      ))}
    </group>
  );
}
