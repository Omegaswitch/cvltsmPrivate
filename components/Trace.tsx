'use client';

import { useEffect, useRef } from 'react';

/**
 * A contour scratched round a picture when the pointer first comes to it:
 * two uneven lines drawn along their length, from opposite corners, the
 * second a little behind and not quite closing. Once drawn it stays until
 * the page is reloaded. Inside a .frame; the look and timing are in
 * globals.css (.trace).
 */
export function Trace() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const frame = svg.current?.parentElement;
    if (!frame) return;
    const keep = () => frame.classList.add('is-traced');
    frame.addEventListener('pointerenter', keep, { once: true });
    return () => frame.removeEventListener('pointerenter', keep);
  }, []);

  return (
    <svg ref={svg} className="trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path pathLength={1} d="M-1.2 0.9 L38 0.2 L71 1.3 L100.6 0.1 L99.7 34 L100.9 71 L99.4 100.8 L62 99.6 L29 100.7 L0.3 99.5 L-0.6 64 L0.8 31 L-0.4 -1.5" />
      <path pathLength={1} d="M101.8 98.6 L66 101.2 L33 99.9 L-1.4 101.6 L-0.9 70 L-1.8 36 L-0.7 -1.2 L35 -1.6 L68 -0.6 L101.4 -1.9 L102 30" />
    </svg>
  );
}
