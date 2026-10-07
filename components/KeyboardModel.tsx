'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KEYCAPS } from '@/data/keycaps';
import { progress } from '@/lib/progress';

/*
 * The keyboard, built from the keycap data.
 *
 * This is a stand-in geometry: a plate, a stem under each cap, and a cap with
 * its rune on top. When the production models exist, replace the body of
 * `buildCap` / `buildPlate` with a loaded asset; everything that positions and
 * fades the object reads the group, not the parts, so it keeps working.
 */

export type KeyboardMode = 'hero' | 'complete';

const PITCH = 1.14;          // centre-to-centre spacing of the keys
const CAP = { w: 0.92, h: 0.46, d: 0.92 };
const PLATE = { w: 7.4, h: 0.16, d: 5.0 };

/** The rune painted onto a cap's top face. */
function legendTexture(glyph: string): THREE.CanvasTexture {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const c = cv.getContext('2d');
  if (c) {
    c.fillStyle = '#1b1a18';
    c.fillRect(0, 0, size, size);
    c.fillStyle = '#d2ccbe';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `${size * 0.6}px "Noto Sans Runic", "Segoe UI Symbol", serif`;
    c.fillText(glyph, size / 2, size / 2 + size * 0.03);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function KeyboardModel({ mode }: { mode: KeyboardMode }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  // Shared materials: one set for the whole object, so its opacity can be
  // faded in a single place.
  const mats = useMemo(() => ({
    cap: new THREE.MeshStandardMaterial({ color: '#2a2825', roughness: 0.55, metalness: 0.04, transparent: true }),
    stem: new THREE.MeshStandardMaterial({ color: '#0c0c0b', roughness: 0.8, transparent: true }),
    plate: new THREE.MeshStandardMaterial({ color: '#34322e', roughness: 0.8, metalness: 0.2, transparent: true }),
  }), []);

  const { caps, legends, geometries } = useMemo(() => {
    const capGeo = new THREE.BoxGeometry(CAP.w, CAP.h, CAP.d);
    const stemGeo = new THREE.BoxGeometry(0.32, 0.5, 0.32);
    const legendList: THREE.CanvasTexture[] = [];
    const items: { geo: THREE.BufferGeometry; x: number; y: number; z: number; mat: THREE.Material[] }[] = [];

    KEYCAPS.forEach((k) => {
      const col = k.position - 3.5;
      const row = 1.5 - (k.row - 1);
      // the rows step back and sit slightly staggered, as a real set does
      const x = col * PITCH + (k.row % 2 === 0 ? PITCH * 0.12 : 0);
      const z = row * PITCH;
      const legend = legendTexture(k.rune.glyph);
      legendList.push(legend);
      const top = new THREE.MeshStandardMaterial({ map: legend, roughness: 0.6, transparent: true });
      const side = mats.cap;
      // BoxGeometry face order: +x, -x, +y (top), -y, +z, -z
      items.push({ geo: capGeo, x, y: CAP.h / 2 + 0.5, z, mat: [side, side, top, side, side, side] });
      items.push({ geo: stemGeo, x, y: 0.25, z, mat: [mats.stem] });
    });
    return { caps: items, legends: legendList, geometries: [capGeo, stemGeo] };
  }, [mats]);

  const plateGeo = useMemo(() => new THREE.BoxGeometry(PLATE.w, PLATE.h, PLATE.d), []);

  // release everything this object allocated when it leaves the scene
  useEffect(() => {
    return () => {
      geometries.forEach((g) => g.dispose());
      legends.forEach((t) => t.dispose());
      mats.cap.dispose();
      mats.stem.dispose();
      mats.plate.dispose();
      plateGeo.dispose();
    };
  }, [geometries, legends, mats, plateGeo]);

  // Pointer: a faint drift of the whole object, never a chase after the cursor.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const p = mode === 'hero' ? progress.hero : 1 - progress.complete;
    // the object emerges as the visitor descends, and sinks into the dark at the end
    const ease = p * p * (3 - 2 * p);
    const k = Math.min(1, dt * 2.2);
    g.scale.setScalar(THREE.MathUtils.lerp(0.78, 1.12, ease));
    g.position.y = THREE.MathUtils.lerp(-0.6, 0, ease) + (mode === 'complete' ? -progress.complete * 1.4 : 0);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.9 + pointer.current.y * 0.025, k);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, pointer.current.x * 0.02, k);
    const opacity = THREE.MathUtils.clamp(mode === 'hero' ? 0.06 + ease * 1.05 : p * 1.05, 0, 1);
    mats.cap.opacity = opacity;
    mats.stem.opacity = opacity;
    mats.plate.opacity = opacity;
  });

  return (
    <group ref={group} rotation={[0.9, 0, 0]}>
      <mesh geometry={plateGeo} material={mats.plate} position={[0, -PLATE.h / 2, 0]} receiveShadow />
      {caps.map((c, i) => (
        <mesh
          key={i}
          geometry={c.geo}
          material={c.mat}
          position={[c.x, c.y, c.z]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}
