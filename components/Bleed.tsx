'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { dripShapes, oozeFilter } from '@/lib/ooze';

/*
 * The set's logo, bleeding: the way the colour chips bleed, with the same
 * filter and drip shapes (lib/ooze.ts) and the same motion (.drip in
 * globals.css). The drips run from the lowest points of the strokes, found
 * from the logo's own outline once it has loaded; they start when the loader
 * lifts, run down each in its own time, and stay; then a bead slides, a tip
 * swells, a drop falls, for as long as the logo is on screen.
 *
 * The SVG is drawn in the logo's own pixels (it is about twice the size it is
 * shown, so the filter's distances are doubled). Without script, or with
 * reduced motion, the drips are drawn already run.
 */

type Drip = { x: number; y: number; w: number; len: number; dur: number; delay: number; slide: number; swell: number; drop: number; dd: number };

const SCALE = 2;            // logo pixels per CSS pixel, roughly, at the size it is shown
const BELOW = 640;          // room under the logo for the drips and the drops that fall from them

function random(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** the lowest points of the strokes (local lows of the outline, spread apart), in the logo's pixels */
function lowsOf(img: HTMLImageElement) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return [];
  g.drawImage(img, 0, 0);
  const a = g.getImageData(0, 0, w, h).data;
  const foot = new Array<number>(w).fill(-1);
  for (let x = 0; x < w; x++) for (let y = h - 1; y >= 0; y--) if (a[(y * w + x) * 4 + 3] > 150) { foot[x] = y; break; }
  const lows: { x: number; y: number }[] = [];
  const near = Math.round(w * 0.006), apart = Math.round(w * 0.028);
  for (let x = near; x < w - near; x++) {
    const y = foot[x];
    if (y < h * 0.5) continue;
    let low = true;
    for (let k = x - near; k <= x + near; k++) if (foot[k] > y) { low = false; break; }
    if (low && !lows.some((l) => Math.abs(l.x - x) < apart)) lows.push({ x, y });
  }
  return lows;
}

export function Bleed({ src, alt }: { src: string; alt: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const [img, setImg] = useState<{ w: number; h: number; drips: Drip[] } | null>(null);

  // the logo's size and where it bleeds from
  useEffect(() => {
    const i = new Image();
    i.onload = () => {
      const rand = random(23);
      const compact = window.matchMedia('(max-width: 820px)').matches;
      const drips = lowsOf(i).filter(() => rand() > 0.1).map(({ x, y }) => {
        const w = (4.5 + rand() * 7.5) * SCALE;
        const r = rand();
        const len = (r < 0.3 ? 120 + rand() * 120 : r < 0.5 ? 60 + rand() * 50 : 18 + rand() * 50) * SCALE * (compact ? 0.6 : 1);
        return {
          x, y: y - 10 * SCALE, w, len,
          dur: 1.2 + len / SCALE / 95 + rand() * 1.2,
          delay: rand() * 1.4,
          slide: 2.4 + len / SCALE / 110 + rand() * 2.2,
          swell: 2.6 + rand() * 2.6,
          drop: 3.4 + rand() * 4,
          dd: rand() * 3.2,
        };
      });
      setImg({ w: i.naturalWidth, h: i.naturalHeight, drips });
    };
    i.src = src;
  }, [src]);

  // the bleeding begins when the loader has lifted (or at once, where there is none), and only runs on screen
  useEffect(() => {
    const el = box.current;
    if (!el || !img) return;
    el.dataset.armed = '';
    let started = false;
    const start = () => { if (!started) { started = true; el.dataset.dripping = ''; } };
    const waitLoader = () => (document.querySelector('.loader') ? false : (start(), true));
    const id = window.setInterval(() => { if (waitLoader()) clearInterval(id); }, 200);
    waitLoader();
    // on screen means not yet covered: the film is pinned, and the kits slide over it (as Film decides)
    const live = () => { if (window.scrollY < window.innerHeight * 0.98 && !document.hidden) el.dataset.live = ''; else delete el.dataset.live; };
    live();
    window.addEventListener('scroll', live, { passive: true });
    document.addEventListener('visibilitychange', live);
    return () => { clearInterval(id); window.removeEventListener('scroll', live); document.removeEventListener('visibilitychange', live); };
  }, [img]);

  if (!img) return <img className="logo" src={src} alt={alt} />;
  const { w: W, h: H, drips } = img;
  const vh = H + BELOW;
  return (
    <span ref={box} className="bleed" role="img" aria-label={alt}>
      <svg className="bleed__svg" viewBox={`0 0 ${W} ${vh}`} style={{ aspectRatio: `${W} / ${vh}` }} aria-hidden="true" focusable="false">
        <defs dangerouslySetInnerHTML={{ __html: oozeFilter('bleed-logo', { x: -40, y: -40, w: W + 80, h: vh + 80 }, SCALE) }} />
        <g filter="url(#bleed-logo)" fill="currentColor">
          <image href={src} x={0} y={0} width={W} height={H} />
          {drips.map((d, n) => {
            const s = dripShapes(d.w, d.len);
            return (
              <g
                key={n}
                className="drip"
                transform={`translate(${d.x} ${d.y})`}
                style={{
                  '--len': d.len.toFixed(0),
                  '--fall': `${Math.round(BELOW - d.len - 40)}px`,
                  '--dur': `${d.dur.toFixed(2)}s`,
                  '--delay': `${d.delay.toFixed(2)}s`,
                  '--slide': `${d.slide.toFixed(2)}s`,
                  '--swell': `${d.swell.toFixed(2)}s`,
                  '--drop': `${d.drop.toFixed(2)}s`,
                  '--dd': `${d.dd.toFixed(2)}s`,
                } as CSSProperties}
              >
                <ellipse {...s.sag} />
                <rect className="drip__line" {...s.line} />
                <g className="drip__end"><circle className="drip__tip" {...s.tip} /></g>
                <circle className="drip__bead" cx={0} cy={0} r={d.w * 0.95} />
                <g className="drip__end"><circle className="drip__drop" {...s.drop} /></g>
              </g>
            );
          })}
        </g>
      </svg>
    </span>
  );
}
