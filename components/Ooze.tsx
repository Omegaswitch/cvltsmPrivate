'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

/*
 * A colour that has bled out of its outline. The fill spills a little over
 * the edge, blobs swell out of the sides, and thin drips run down and hang
 * below; a gooey filter (blur, then alpha contrast, then a little
 * displacement) fuses them into one wet body and lights its relief, so the
 * drips and edges catch a sheen.
 *
 * It is drawn as an SVG, its units the chip's own pixels (measured), with the
 * filter on the SVG's own shapes: every browser draws that the same way,
 * Safari included (a filter put on page elements it draws its own way, and
 * the drips fall apart into circles).
 *
 * It is alive, not only drawn: each drip runs down in its own time (a long
 * one creeps for seconds), and then goes on for as long as it is looked at,
 * a bead sliding down it, its tip swelling, a drop letting go and falling.
 * The timings are per drip; the stylesheet runs them (.drip in globals.css).
 *
 * Nothing is typed in by hand: every chip is drawn from a seeded random, so
 * each bleeds its own way, and the same way on every visit. Most drips are
 * short; one or two on each are long enough to run past the foot of the
 * section, behind the page that slides over it (the renders). On a phone the
 * chips are low bands, and the drips are finer and shorter.
 */

function random(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function plan(index: number) {
  const rand = random(index * 7919 + 17);
  const r = (a: number, b: number) => a + rand() * (b - a);
  const count = 5 + Math.floor(rand() * 4);
  const drips = Array.from({ length: count }, (_, n) => {
    const len = n < 2 ? r(420, 640) : rand() < 0.25 ? r(130, 240) : r(22, 90);
    const dur = 1.0 + len / 105 + r(0, 1.4);       // a long one creeps
    return {
      x: r(5, 94) / 100,
      w: r(4.5, 12),
      len,
      dur,
      delay: r(0.05, 1.6) + n * 0.12,
      slide: 2.4 + len / 110 + r(0, 2.2),          // a bead running down it
      swell: r(2.6, 5.2),                          // its tip filling
      drop: r(3.4, 7.4),                           // a drop letting go
      dd: r(0, 3.2),
    };
  });
  const blobs = Array.from({ length: 2 + Math.floor(rand() * 3) }, () => ({
    left: rand() < 0.5,
    y: r(12, 82) / 100,
    s: r(18, 46),
    h: r(0.8, 1.2),
  }));
  return { drips, blobs };
}

const PAD = 40;      // room round the chip for the spill and the blobs

export function Ooze({ hex, index }: { hex: string; index: number }) {
  const box = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.clientWidth), h = Math.round(el.clientHeight);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!size) return <span ref={box} className="ooze" aria-hidden="true" />;

  const { w: W, h: H } = size;
  const compact = H < 160;                         // a phone's low band
  const { drips, blobs } = plan(index);
  const fall = compact ? 40 : 360;
  const shaped = drips.map((d) => ({
    ...d,
    w: compact ? d.w * 0.8 : d.w,
    len: compact ? Math.min(d.len * 0.55, 30 + d.len * 0.045) : d.len,
  }));
  const below = Math.max(...shaped.map((d) => d.len)) + fall + 40;
  const vw = W + PAD * 2, vh = H + PAD + below;
  const id = `ooze-${index}`;

  return (
    <span ref={box} className="ooze" aria-hidden="true">
      <svg
        className="ooze__svg"
        width={vw}
        height={vh}
        viewBox={`${-PAD} ${-PAD} ${vw} ${vh}`}
        style={{ left: -PAD, top: -PAD }}
        focusable="false"
      >
        <defs>
          <filter id={id} filterUnits="userSpaceOnUse" x={-PAD} y={-PAD} width={vw} height={vh} colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.4" result="soft" />
            <feColorMatrix in="soft" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -9.5" result="goo" />
            <feSpecularLighting in="soft" surfaceScale="9" specularConstant="0.9" specularExponent="28" lightingColor="#ffffff" result="shine">
              <feDistantLight azimuth="235" elevation="42" />
            </feSpecularLighting>
            <feComposite in="shine" in2="goo" operator="in" result="sheen" />
            <feComposite in="goo" in2="sheen" operator="arithmetic" k1="0" k2="1" k3="0.42" k4="0" result="wet" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="2" seed="3" result="noise" />
            <feDisplacementMap in="wet" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter={`url(#${id})`} fill={hex}>
          <rect x={-9} y={-9} width={W + 18} height={H + 18} rx={3} />
          {blobs.map((b, n) => (
            <ellipse
              key={n}
              cx={b.left ? -b.s * 0.45 + b.s / 2 : W + b.s * 0.45 - b.s / 2}
              cy={b.y * H + (b.s * b.h) / 2}
              rx={b.s / 2}
              ry={(b.s * b.h) / 2}
            />
          ))}
          {shaped.map((d, n) => (
            <g
              key={n}
              className="drip"
              transform={`translate(${(d.x * W).toFixed(1)} ${H - (compact ? 8 : 14)})`}
              style={{
                '--len': d.len.toFixed(0),
                '--fall': `${fall}px`,
                '--dur': `${d.dur.toFixed(2)}s`,
                '--delay': `${d.delay.toFixed(2)}s`,
                '--slide': `${d.slide.toFixed(2)}s`,
                '--swell': `${d.swell.toFixed(2)}s`,
                '--drop': `${d.drop.toFixed(2)}s`,
                '--dd': `${d.dd.toFixed(2)}s`,
              } as CSSProperties}
            >
              {/* where it leaves the edge: a sag the filter turns into a fillet */}
              <ellipse cx={0} cy={2} rx={d.w * 1.4} ry={compact ? 7 : 11} />
              <rect className="drip__line" x={-d.w / 2} y={0} width={d.w} height={d.len} rx={d.w / 2} />
              <g className="drip__end"><circle className="drip__tip" cx={0} cy={9 - d.w * 0.75} r={d.w * 0.75} /></g>
              <circle className="drip__bead" cx={0} cy={0} r={d.w * 0.95} />
              <g className="drip__end"><circle className="drip__drop" cx={0} cy={9} r={d.w * 0.85} /></g>
            </g>
          ))}
        </g>
      </svg>
    </span>
  );
}
