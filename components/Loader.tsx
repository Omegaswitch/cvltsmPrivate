'use client';

import { useEffect, useState } from 'react';
import { PATHS, VIEW } from './loader-paths';

/*
 * While the page loads: the blindfolded horse, one of the engravings, its
 * outline traced in blood and then its inner shapes, the woodcut itself
 * coming up faintly behind. It lifts once the page, its fonts and the first
 * frame of the film are in, and not before the outline has closed. Without
 * script it lifts by itself (globals.css).
 */

const MIN = 2300;   // ms: long enough for the outline to close

export function Loader() {
  const [state, setState] = useState<'on' | 'lifting' | 'gone'>('on');

  useEffect(() => {
    const t0 = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loaded = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true }));
    let timer = 0;
    const root = document.documentElement;
    root.style.overflow = 'hidden';   // nothing scrolls under it
    Promise.all([loaded, document.fonts.ready]).then(() => {
      const wait = Math.max(0, (reduced ? 600 : MIN) - (performance.now() - t0));
      timer = window.setTimeout(() => {
        setState('lifting');
        root.style.overflow = '';
        timer = window.setTimeout(() => setState('gone'), 900);
      }, wait);
    });
    return () => { clearTimeout(timer); root.style.overflow = ''; };
  }, []);

  if (state === 'gone') return null;
  return (
    <div className={`loader${state === 'lifting' ? ' is-lifting' : ''}`} aria-hidden="true">
      <div className="loader__art">
        <img src="/engravings/1-19.webp" alt="" />
        <svg viewBox={VIEW} focusable="false">
          {PATHS.map((d, i) => (
            <path key={i} d={d} pathLength={1} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </svg>
      </div>
    </div>
  );
}
