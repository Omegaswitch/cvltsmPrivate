'use client';

import { useEffect, useState, type CSSProperties } from 'react';

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/**
 * Seconds elapsed since mount, ticked on the frame clock and stopped once
 * `until` passes. Stopping matters: a beam that keeps requesting frames after
 * its text has settled re-renders forever, and a screen full of them (the root
 * menu is six) would leave that many loops running for nothing.
 */
export function useElapsed(until: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - t0) / 1000;
      setT(elapsed);
      if (elapsed < until) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [until]);
  return t;
}

/** Phosphor at rest, and the instant the beam strikes it. */
export const PHOSPHOR = '#ff2414';
const STRUCK = '#fff1ec';

/**
 * How long a glyph stays hot after the beam writes it, and the most glyphs
 * that are ever hot at once. A slow beam is bound by the first (a word or so
 * glows behind the head); a fast one by the second (the line being written
 * glows, the line above has settled), so the streak never swallows a block.
 */
export const HOT_SECONDS = 0.28;
export const HOT_GLYPHS = 40;

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const s = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/** `t` of the way from `a` to `b`. */
const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)} ${Math.round(g1 + (g2 - g1) * t)} ${Math.round(b1 + (b2 - b1) * t)})`;
};

/**
 * Inline style for a glyph `age` seconds after the beam wrote it: white-hot
 * on arrival, cooling through pale red back to `color`, the glow around it
 * shrinking with it. Undefined once it has settled, so settled text carries
 * no style at all. A dark resting colour (black on the inverted menu row)
 * never goes hot: an overexposed glyph there would only read as a smudge.
 */
export function hotStyle(
  age: number,
  hot: number,
  color = PHOSPHOR,
): CSSProperties | undefined {
  const h = clamp(1 - age / hot, 0, 1);
  if (h <= 0 || luminance(color) < 0.2) return undefined;
  // Cools fast at first, then lingers pale: the curve a real phosphor has.
  const heat = h * h;
  return {
    color: mix(color, STRUCK, heat),
    textShadow: `0 0 ${(2 + 7 * heat).toFixed(1)}px rgb(255 200 188 / ${(0.9 * heat).toFixed(2)}), 0 0 ${(16 * h).toFixed(0)}px ${color}`,
  };
}
