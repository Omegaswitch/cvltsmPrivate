'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { progress } from '@/lib/progress';

/*
 * The keyboard, procedural until the production model exists. A plate and
 * twenty-four plain caps on stems, in four rows of six. Replace the body of
 * this component with the loaded model; the group is what the scroll moves,
 * so the emergence keeps working.
 */

const PITCH = 1.14;
const CAP = { w: 0.92, h: 0.46, d: 0.92 };
const PLATE = { w: 7.4, h: 0.16, d: 5.0 };

export default function KeyboardModel() {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const mats = useMemo(() => ({
    cap: new THREE.MeshStandardMaterial({ color: '#2a2825', roughness: 0.55, metalness: 0.04, transparent: true }),
    stem: new THREE.MeshStandardMaterial({ color: '#0c0c0b', roughness: 0.8, transparent: true }),
    plate: new THREE.MeshStandardMaterial({ color: '#34322e', roughness: 0.8, metalness: 0.2, transparent: true }),
  }), []);

  const geo = useMemo(() => ({
    cap: new THREE.BoxGeometry(CAP.w, CAP.h, CAP.d),
    stem: new THREE.BoxGeometry(0.32, 0.5, 0.32),
    plate: new THREE.BoxGeometry(PLATE.w, PLATE.h, PLATE.d),
  }), []);

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
    geo.cap.dispose();
    geo.stem.dispose();
    geo.plate.dispose();
    mats.cap.dispose();
    mats.stem.dispose();
    mats.plate.dispose();
  }, [geo, mats]);

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
    mats.cap.opacity = opacity;
    mats.stem.opacity = opacity;
    mats.plate.opacity = opacity;
  });

  return (
    <group ref={group} rotation={[0.9, 0, 0]}>
      <mesh geometry={geo.plate} material={mats.plate} position={[0, -PLATE.h / 2, 0]} receiveShadow />
      {keys.map((k, i) => (
        <group key={i} position={[k.x, 0, k.z]}>
          <mesh geometry={geo.stem} material={mats.stem} position={[0, 0.25, 0]} />
          <mesh geometry={geo.cap} material={mats.cap} position={[0, CAP.h / 2 + 0.5, 0]} castShadow receiveShadow />
        </group>
      ))}
    </group>
  );
}
