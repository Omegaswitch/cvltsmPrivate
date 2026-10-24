'use client';

import { useMemo, useState } from 'react';

/*
 * The survey as a topographic map. The ground is a made-up heightfield that
 * agrees with the files: the station low in the south-west by the stream,
 * a ridge along the north, and the ring of seven stones on a knoll at 412 m,
 * where the instruments read strangest. Its contours are traced with marching
 * squares every 10 m, every 50 m drawn heavier and numbered. The trail
 * follows the stream and climbs the knoll's south-west spur to the ring.
 *
 * Coordinates are the SVG's own (760 x 380, 1 unit about 4 m: the 500 m bar
 * is 125 units).
 */

const W = 760, H = 380, STEP = 6;
export const RING = { x: 560, y: 205, r: 26 };
const STATION = { x: 74, y: 318 };

// the stream, from the north-west hills down to the station's valley
const STREAM: [number, number][] = [[330, 40], [350, 110], [320, 170], [250, 230], [180, 270], [120, 300], [40, 340]];

const g = (x: number, y: number, cx: number, cy: number, s: number) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));

function distToStream(x: number, y: number) {
  let best = Infinity;
  for (let i = 0; i < STREAM.length - 1; i++) {
    const [ax, ay] = STREAM[i], [bx, by] = STREAM[i + 1];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
}

export function height(x: number, y: number) {
  return (
    150 +
    (H - y) * 0.32 +                                           // the land rises to the north
    200 * g(x, y, RING.x, RING.y, 62) +                        // the knoll
    70 * g(x, y, 470, 280, 55) +                               // its south-west spur
    150 * Math.exp(-((y - 40) ** 2) / (2 * 40 * 40)) * Math.min(1, Math.max(0, (x - 240) / 260)) + // the ridge
    95 * g(x, y, 150, 80, 70) +                                // the western hill
    40 * g(x, y, 700, 320, 60) -                               // a rise to the south-east
    55 * Math.exp(-(distToStream(x, y) ** 2) / (2 * 22 * 22))  // the stream's valley
  );
}

/** contour segments at `level`, traced with marching squares over the grid */
function contour(field: number[][], level: number) {
  const out: string[] = [];
  const lerp = (a: number, b: number) => (level - a) / (b - a);
  for (let j = 0; j < field.length - 1; j++) {
    for (let i = 0; i < field[0].length - 1; i++) {
      const a = field[j][i], b = field[j][i + 1], c = field[j + 1][i + 1], d = field[j + 1][i];
      const x = i * STEP, y = j * STEP;
      const pts: [number, number][] = [];
      if ((a < level) !== (b < level)) pts.push([x + lerp(a, b) * STEP, y]);
      if ((b < level) !== (c < level)) pts.push([x + STEP, y + lerp(b, c) * STEP]);
      if ((d < level) !== (c < level)) pts.push([x + lerp(d, c) * STEP, y + STEP]);
      if ((a < level) !== (d < level)) pts.push([x, y + lerp(a, d) * STEP]);
      for (let k = 0; k + 1 < pts.length; k += 2) out.push(`M${pts[k][0].toFixed(1)} ${pts[k][1].toFixed(1)}L${pts[k + 1][0].toFixed(1)} ${pts[k + 1][1].toFixed(1)}`);
    }
  }
  return out.join('');
}

/** where to write a 50 m line's number: the point on it furthest into open ground, roughly */
const labelsTaken: [number, number][] = [];
function labelAt(field: number[][], level: number): [number, number] | null {
  let best: [number, number] | null = null, score = -Infinity;
  for (let j = 2; j < field.length - 2; j += 2) {
    for (let i = 4; i < field[0].length - 4; i += 2) {
      const a = field[j][i], b = field[j][i + 1];
      if ((a < level) === (b < level)) continue;
      const x = i * STEP, y = j * STEP;
      const fromRing = Math.hypot(x - RING.x, y - RING.y), fromTrail = Math.abs(y - (318 - (x - 74) * 0.22));
      if (fromRing < 60 || fromTrail < 26 || y > 340 || y < 50 || x > 700) continue;   // clear of the stones, the trail and the edges
      const s = -Math.abs(x - 380) * 0.25 - Math.abs(y - 170) * 0.15 + (labelsTaken.some(([lx, ly]) => Math.hypot(lx - x, ly - y) < 90) ? -1000 : 0);
      if (s > score) { score = s; best = [x, y]; }
    }
  }
  return best;
}

export const TRAIL = 'M74 318 C120 312 160 300 200 286 S280 262 330 262 S420 276 456 262 S492 236 512 226 S540 214 548 210';

export function Topo({ level }: { level: number }) {
  const [probe, setProbe] = useState<{ x: number; y: number } | null>(null);
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setProbe({ x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H });
  };
  const { lines, index, labels } = useMemo(() => {
    labelsTaken.length = 0;
    const field = Array.from({ length: Math.ceil(H / STEP) + 1 }, (_, j) =>
      Array.from({ length: Math.ceil(W / STEP) + 1 }, (_, i) => height(i * STEP, j * STEP)));
    const lines: string[] = [], index: string[] = [];
    const labels: { x: number; y: number; t: string }[] = [];
    for (let h = 150; h <= 430; h += 10) {
      const d = contour(field, h);
      if (h % 50 === 0) {
        index.push(d);
        const at = labelAt(field, h);
        if (at) { labelsTaken.push(at); labels.push({ x: at[0], y: at[1], t: String(h) }); }
      } else lines.push(d);
    }
    return { lines: lines.join(''), index: index.join(''), labels };
  }, []);

  const stones = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return [RING.x + Math.cos(a) * RING.r, RING.y + Math.sin(a) * RING.r];
  });
  const stream = `M${STREAM.map(([x, y]) => `${x} ${y}`).join(' L')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="st-map" onPointerMove={onMove} onPointerLeave={() => setProbe(null)} role="img" aria-label="Topographic survey: the station by the stream in the south-west, the trail climbing to the ring of seven stones on a knoll at 412 metres">
      <defs>
        <clipPath id="st-map-clip"><rect width={W} height={H} /></clipPath>
      </defs>
      <g clipPath="url(#st-map-clip)">
        {/* the grid, 500 m squares */}
        <g className="st-map__grid">
          {[125, 250, 375, 500, 625, 750].map((x) => <line key={`x${x}`} x1={x} y1={0} x2={x} y2={H} />)}
          {[125, 250, 375].map((y) => <line key={`y${y}`} x1={0} y1={y} x2={W} y2={y} />)}
        </g>
        <path d={lines} className="st-map__contour" />
        <path d={index} className="st-map__index" />
        {labels.map((l) => <text key={l.t} x={l.x} y={l.y} className="st-map__height">{l.t}</text>)}
        {/* mist drifting down the valley */}
        <ellipse cx={200} cy={290} rx={150} ry={26} className="st-map__mist" />
        <ellipse cx={420} cy={250} rx={120} ry={20} className="st-map__mist st-map__mist--late" />
        <path d={stream} className="st-map__stream" />
        <path d={TRAIL} className="st-map__ghost" />
        <path d={TRAIL} className="st-map__trail" />
        <path d={TRAIL} className="st-map__walk" />
        <circle cx={RING.x} cy={RING.y} r={RING.r + 14} className="st-map__ring" />
        {stones.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 6 ? 4.5 : 3} className={`st-map__stone${i === 6 ? ' is-seven' : ''}`} />)}
        <rect x={STATION.x - 9} y={STATION.y - 9} width={18} height={18} className="st-map__cabin" />
        <text x={STATION.x + 16} y={STATION.y + 18} className="st-map__label">STN 7 · 172 m</text>
        <text x={RING.x + 46} y={RING.y + 4} className="st-map__label">RING · 412 m</text>
        <text x={290} y={58} className="st-map__label st-map__label--dim">NORDÅSEN</text>
        <text x={210} y={252} className="st-map__label st-map__label--dim" transform="rotate(-32 210 252)">SVARTBEKKEN</text>
        {/* you, partway up the trail, heading for the ring */}
        <path d="M0 -11 L7 7 L0 3 L-7 7 Z" className="st-map__you" transform={`translate(${level >= 2 ? 456 : 330} ${level >= 2 ? 262 : 262}) rotate(${level >= 2 ? 62 : 84})`} />
        {probe ? (
          <g className="st-map__probe">
            <line x1={probe.x} x2={probe.x} y1={0} y2={H} /><line x1={0} x2={W} y1={probe.y} y2={probe.y} />
            <text x={probe.x > W - 200 ? probe.x - 10 : probe.x + 10} y={probe.y < 40 ? probe.y + 26 : probe.y - 10} textAnchor={probe.x > W - 200 ? 'end' : 'start'}>
              {Math.round(height(probe.x, probe.y))} m · ring {(Math.hypot(probe.x - RING.x, probe.y - RING.y) * 4 / 1000).toFixed(2)} km
            </text>
          </g>
        ) : null}
      </g>
      {/* north, and the scale */}
      <g className="st-map__furniture">
        <path d="M730 22 L736 40 L730 36 L724 40 Z" />
        <text x={730} y={16} textAnchor="middle">N</text>
        <line x1={24} y1={22} x2={149} y2={22} />
        <line x1={24} y1={17} x2={24} y2={27} /><line x1={86.5} y1={19} x2={86.5} y2={25} /><line x1={149} y1={17} x2={149} y2={27} />
        <text x={24} y={40}>0</text><text x={149} y={40} textAnchor="end">500 m</text>
      </g>
    </svg>
  );
}
