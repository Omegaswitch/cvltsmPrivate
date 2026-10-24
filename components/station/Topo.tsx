'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

/*
 * The survey as a topographic map. The ground is a made-up heightfield that
 * agrees with the files: the station low in the south-west by the stream,
 * a ridge along the north, and the ring of seven stones on a knoll at 412 m,
 * where the instruments read strangest. Its contours are traced with marching
 * squares every 10 m, every 50 m drawn heavier and numbered. The trail
 * follows the stream and climbs the knoll's south-west spur to the ring.
 *
 * It is an instrument, not a picture. It zooms (wheel, pinch, double-click,
 * the + and - keys and buttons) and pans (drag, two fingers, the arrow keys);
 * the pointer reads the height, and the bearing and distance from the
 * station; Measure takes two points and gives the distance, climb and
 * bearing between them; and the places marked on it are the ones the files
 * name. More of them appear as the seals open, and clicking one prints its
 * survey line in the terminal (onNote).
 *
 * Coordinates are the SVG's own (760 x 380, 1 unit about 4 m: the 500 m bar
 * is 125 units). Zoom and pan never go through React: the view is a
 * transform on one group, set straight on the DOM, and so is the pointer's
 * readout, so a drag costs nothing but the paint.
 */

const W = 760, H = 380, STEP = 6;
const M = 4;                       // metres per unit
const ZOOM = { min: 1, max: 5 };
export const RING = { x: 560, y: 205, r: 26 };
const STATION = { x: 74, y: 318 };
const MAST = { x: 58, y: 296 };

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

/** compass bearing from a to b, degrees, north up (y runs down the page) */
const bearing = (ax: number, ay: number, bx: number, by: number) => (Math.atan2(bx - ax, -(by - ay)) * 180 / Math.PI + 360) % 360;
const km = (units: number) => `${(units * M / 1000).toFixed(2)} km`;
const deg = (b: number) => `${String(Math.round(b)).padStart(3, '0')}°`;

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
function labelAt(field: number[][], level: number, taken: [number, number][]): [number, number] | null {
  let best: [number, number] | null = null, score = -Infinity;
  for (let j = 2; j < field.length - 2; j += 2) {
    for (let i = 4; i < field[0].length - 4; i += 2) {
      const a = field[j][i], b = field[j][i + 1];
      if ((a < level) === (b < level)) continue;
      const x = i * STEP, y = j * STEP;
      const fromRing = Math.hypot(x - RING.x, y - RING.y), fromTrail = Math.abs(y - (318 - (x - 74) * 0.22));
      if (fromRing < 60 || fromTrail < 26 || y > 340 || y < 50 || x > 700) continue;   // clear of the stones, the trail and the edges
      const s = -Math.abs(x - 380) * 0.25 - Math.abs(y - 170) * 0.15 + (taken.some(([lx, ly]) => Math.hypot(lx - x, ly - y) < 90) ? -1000 : 0);
      if (s > score) { score = s; best = [x, y]; }
    }
  }
  return best;
}

export const TRAIL = 'M74 318 C120 312 160 300 200 286 S280 262 330 262 S420 276 456 262 S492 236 512 226 S540 214 548 210';
const RIDGE_ROAD = 'M240 58 C330 50 420 46 510 44 S660 48 760 56';

const STONES = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
  return [RING.x + Math.cos(a) * RING.r, RING.y + Math.sin(a) * RING.r] as [number, number];
});

// ------------------------------------------------------------------ places

/**
 * The places the files name. `from` is the clearance that shows one; its
 * lines come in with the files too, so a place says more as the seals open.
 */
type Place = {
  id: string; x: number; y: number; name: string; from: number;
  kind: 'cabin' | 'mast' | 'ring' | 'stone' | 'water' | 'ridge' | 'clearing' | 'fire' | 'camera' | 'hut';
  lines: [number, string][];
  label?: [number, number];   // where its name goes, if not beside it
  h?: number;                 // its height as the survey has it published; otherwise read from the ground
};

const PLACES: Place[] = [
  { id: 'stn', x: STATION.x, y: STATION.y, name: 'STN 7', from: 0, kind: 'cabin', label: [16, 18], h: 172, lines: [
    [0, 'the cabin, by the stream. unmanned since 4 Feb 1988.'],
    [0, 'a face at the window most nights, behind the wire. no tracks below.'],
    [4, 'E6, 4 Feb: the fire is at the cabin. the face has moved. it is smiling.'],
  ] },
  { id: 'mast', x: MAST.x, y: MAST.y, name: 'MAST', from: 0, kind: 'mast', label: [-8, -10], lines: [
    [0, 'radio mast and receiver, the forest band. "the radio sings at night."'],
    [3, 'carrier 203 kHz, no drift, strongest at the ring. voices on it.'],
  ] },
  { id: 'ring', x: RING.x, y: RING.y, name: 'RING', from: 0, kind: 'ring', label: [46, 4], h: 412, lines: [
    [0, 'seven stones on the knoll, carved. numbered from the north, clockwise.'],
    [0, 'interior 20 degrees colder than the forest. magnetometers point into it.'],
    [2, 'anomaly 01, 19 Dec 02:14 to 05:51: all channels. figures in the ring, 7 / 9 / 7.'],
    [4, 'the station was put on the ring, by people who knew what it was.'],
  ] },
  { id: 'stone7', x: STONES[6][0], y: STONES[6][1], name: 'STONE 7', from: 0, kind: 'stone', label: [-10, -14], lines: [
    [0, 'fresh cuts, this year\'s. nine signs, one word. see stone_07.txt.'],
    [1, 'ULFHEDNAR: the wolf-coats. the word she locked her notes under.'],
  ] },
  { id: 'bekk', x: 250, y: 230, name: 'SVARTBEKKEN', from: 0, kind: 'water', label: [-40, 22], lines: [
    [0, 'the stream. the trail follows it from the station before it climbs.'],
  ] },
  { id: 'ridge', x: 520, y: 46, name: 'NORDÅSEN', from: 0, kind: 'ridge', label: [-230, 12], lines: [
    [0, 'the ridge along the north, and the ridge road over it.'],
    [4, 'E5, 19 Dec: riders with torches on the ridge road.'],
  ] },
  { id: 'clearing', x: 400, y: 304, name: 'CLEARING', from: 0, kind: 'clearing', label: [12, 20], lines: [
    [0, '14 Aug: four of them at the edge of the clearing, hooded, one with horns.'],
    [1, 'the fires in the clearing moved closer to the cabin each week.'],
  ] },
  { id: 'fire1', x: 330, y: 296, name: 'FIRE · NOV', from: 1, kind: 'fire', label: [-10, 20], lines: [[1, 'a fire, the first week of November. closer than the last.']] },
  { id: 'fire2', x: 250, y: 300, name: 'FIRE · DEC', from: 1, kind: 'fire', label: [-10, 20], lines: [[1, 'a fire, the first week of December. closer again.']] },
  { id: 'fire3', x: 170, y: 306, name: 'FIRE · 19 DEC', from: 2, kind: 'fire', label: [-14, 20], lines: [[2, 'the night of the anomaly. a coat on the hook in the morning, smelling of smoke.']] },
  { id: 'cam', x: 604, y: 252, name: 'CAM 2', from: 2, kind: 'camera', label: [10, 16], lines: [
    [2, 'camera 2, facing the ring. 03:05: figures in the ring, count 7 / 9 / 7.'],
    [4, 'A5, COUNT: seven or nine, depending on who counts. cameras disagree.'],
  ] },
  { id: 'hut', x: 690, y: 322, name: 'OLD HUT', from: 4, kind: 'hut', label: [-64, 22], lines: [
    [4, 'E4, 2 Nov: a shape on four legs that stood up. antlered. taller than the hut.'],
  ] },
];

/** a place's survey line: name, height, and where it is from the station */
function surveyLine(p: Place) {
  const h = p.h ?? Math.round(height(p.x, p.y));
  if (p.id === 'stn') return `STN 7 · ${h} m · the station`;
  return `${p.name} · ${h} m · ${km(Math.hypot(p.x - STATION.x, p.y - STATION.y))} from STN 7 · bearing ${deg(bearing(STATION.x, STATION.y, p.x, p.y))}`;
}

// ------------------------------------------------------------------ ground

/** everything that never changes: grid, contours, their numbers, the stream, the mist. Drawn once. */
const Ground = memo(function Ground() {
  const { lines, index, labels } = useMemo(() => {
    const taken: [number, number][] = [];
    const field = Array.from({ length: Math.ceil(H / STEP) + 1 }, (_, j) =>
      Array.from({ length: Math.ceil(W / STEP) + 1 }, (_, i) => height(i * STEP, j * STEP)));
    const lines: string[] = [], index: string[] = [];
    const labels: { x: number; y: number; t: string }[] = [];
    for (let h = 150; h <= 430; h += 10) {
      const d = contour(field, h);
      if (h % 50 === 0) {
        index.push(d);
        const at = labelAt(field, h, taken);
        if (at) { taken.push(at); labels.push({ x: at[0], y: at[1], t: String(h) }); }
      } else lines.push(d);
    }
    return { lines: lines.join(''), index: index.join(''), labels };
  }, []);
  const stream = `M${STREAM.map(([x, y]) => `${x} ${y}`).join(' L')}`;
  return (
    <>
      <g className="st-map__grid">
        {[125, 250, 375, 500, 625, 750].map((x) => <line key={`x${x}`} x1={x} y1={0} x2={x} y2={H} />)}
        {[125, 250, 375].map((y) => <line key={`y${y}`} x1={0} y1={y} x2={W} y2={y} />)}
      </g>
      <path d={lines} className="st-map__contour" />
      <path d={index} className="st-map__index" />
      {labels.map((l) => <text key={l.t} x={l.x} y={l.y} className="st-map__height">{l.t}</text>)}
      <ellipse cx={200} cy={290} rx={150} ry={26} className="st-map__mist" />
      <ellipse cx={420} cy={250} rx={120} ry={20} className="st-map__mist st-map__mist--late" />
      <path d={stream} className="st-map__stream" />
    </>
  );
});

/** the mark for a kind of place, drawn at its own origin (counter-scaled against the zoom, so it stays one size) */
function Mark({ kind, selected }: { kind: Place['kind']; selected: boolean }) {
  switch (kind) {
    case 'cabin': return <rect x={-9} y={-9} width={18} height={18} className="st-map__cabin" />;
    case 'mast': return <path d="M0 0 L0 -14 M-4 -10 L4 -10 M-3 -5 L3 -5" className="st-map__mast" />;
    case 'ring': return <circle r={RING.r + 14} className="st-map__ring" />;
    case 'stone': return <circle r={4.5} className="st-map__stone is-seven" />;
    case 'water': return <circle r={2.5} className="st-map__dot" />;
    case 'ridge': return <path d="M-8 4 L0 -4 L8 4" className="st-map__ridge" />;
    case 'clearing': return <circle r={7} className="st-map__clearing" />;
    case 'fire': return <path d="M0 -7 L4 0 L0 7 L-4 0 Z" className={`st-map__fire${selected ? ' is-on' : ''}`} />;
    case 'camera': return <path d="M-6 -4 L4 -4 L4 4 L-6 4 Z M4 -1 L9 -4 L9 4 L4 1" className="st-map__camera" />;
    case 'hut': return <path d="M-7 5 L-7 -2 L0 -8 L7 -2 L7 5 Z" className="st-map__hut" />;
  }
}

// --------------------------------------------------------------------- map

type Pt = [number, number];
export type Note = (text: string) => void;

export function Topo({ level, onNote, big = false }: { level: number; onNote?: Note; big?: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  const viewG = useRef<SVGGElement>(null);
  const bar = useRef<HTMLElement>(null);
  const probeG = useRef<SVGGElement>(null);
  const probeV = useRef<SVGLineElement>(null);
  const probeH = useRef<SVGLineElement>(null);
  const probeT = useRef<SVGGElement>(null);
  const probeText = useRef<SVGTextElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const view = useRef({ k: 1, tx: 0, ty: 0 });
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<{ start: Pt; moved: boolean; place?: string; pinch?: { d: number; mid: Pt } } | null>(null);
  const pinned = useRef(false);   // the probe placed by a tap, kept until the next

  const [measuring, setMeasuring] = useState(false);
  const [measure, setMeasure] = useState<Pt[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);   // shown in the toolbar only: set after a gesture ends

  const places = useMemo(() => PLACES.filter((p) => p.from <= level), [level]);
  const selected = places.find((p) => p.id === sel) ?? null;

  /**
   * The part of the map that is on screen, in the map's units: the whole of
   * it in a wide box, a slice of it in a tall one (the expanded map on a
   * phone fills its box and is panned). The pan is held so the map always
   * covers that window.
   */
  const windowOf = useCallback(() => {
    const s = svg.current;
    const m = s?.getScreenCTM();
    if (!s || !m) return { x0: 0, y0: 0, x1: W, y1: H, a: 1 };
    const r = s.getBoundingClientRect();
    const inv = m.inverse();
    const a = new DOMPoint(r.left, r.top).matrixTransform(inv), b = new DOMPoint(r.right, r.bottom).matrixTransform(inv);
    return { x0: Math.max(0, a.x), y0: Math.max(0, a.y), x1: Math.min(W, b.x), y1: Math.min(H, b.y), a: m.a };
  }, []);

  // ---- the view: a transform set straight on the DOM
  const apply = useCallback(() => {
    const { k, tx, ty } = view.current;
    const s = svg.current, vg = viewG.current;
    if (!s || !vg) return;
    vg.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)})`);
    s.querySelectorAll<SVGGElement>('.st-map__pin').forEach((p) => p.setAttribute('transform', `scale(${(1 / k).toFixed(4)})`));
    if (bar.current) bar.current.style.width = `${(125 * windowOf().a * k).toFixed(1)}px`;   // 500 m, as drawn
    // zoomed in, a finger pans the map; at rest it scrolls the page
    s.style.touchAction = big || k > 1.01 ? 'none' : 'pan-y';
  }, [big, windowOf]);

  const clamp = useCallback(() => {
    const v = view.current, w = windowOf();
    v.tx = Math.min(w.x0, Math.max(w.x1 - W * v.k, v.tx));
    v.ty = Math.min(w.y0, Math.max(w.y1 - H * v.k, v.ty));
  }, [windowOf]);

  /** zoom to `k` keeping the map point under (px, py) where it is */
  const zoomAt = useCallback((k: number, px: number, py: number) => {
    const v = view.current;
    k = Math.min(ZOOM.max, Math.max(ZOOM.min, k));
    const r = k / v.k;
    v.tx = px - (px - v.tx) * r;
    v.ty = py - (py - v.ty) * r;
    v.k = k;
    clamp();
    apply();
  }, [apply, clamp]);

  const panBy = useCallback((dx: number, dy: number) => {
    const v = view.current;
    v.tx += dx; v.ty += dy;
    clamp();
    apply();
  }, [apply, clamp]);

  const fit = useCallback(() => { view.current = { k: 1, tx: 0, ty: 0 }; clamp(); apply(); setZoom(1); }, [apply, clamp]);
  /** the middle of what is on screen: where the keys and buttons zoom about */
  const centre = (): Pt => { const w = windowOf(); return [(w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2]; };

  /** client → map (svg) coordinates, exact whatever box the map is drawn in (it letterboxes when expanded on a phone) */
  const toSvg = (e: { clientX: number; clientY: number }): Pt => {
    const m = svg.current!.getScreenCTM();
    if (!m) return [0, 0];
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  };
  /** map → ground coordinates, under the current view */
  const toWorld = ([x, y]: Pt): Pt => {
    const { k, tx, ty } = view.current;
    return [(x - tx) / k, (y - ty) / k];
  };

  // ---- the probe: lines and a readout, set straight on the DOM
  const showProbe = useCallback((p: Pt | null) => {
    const pg = probeG.current;
    if (!pg) return;
    if (!p) { pg.style.display = 'none'; if (readout.current) readout.current.textContent = ''; return; }
    const [x, y] = p;
    const h = Math.round(height(x, y));
    const d = Math.hypot(x - STATION.x, y - STATION.y);
    pg.style.display = '';
    probeV.current?.setAttribute('x1', String(x)); probeV.current?.setAttribute('x2', String(x));
    probeH.current?.setAttribute('y1', String(y)); probeH.current?.setAttribute('y2', String(y));
    probeT.current?.setAttribute('transform', `translate(${x} ${y})`);
    const t = probeText.current;
    if (t) {
      const left = x > W - 200 / view.current.k;
      t.setAttribute('x', String(left ? -10 : 10));
      t.setAttribute('y', String(y < 40 / view.current.k ? 26 : -10));
      t.setAttribute('text-anchor', left ? 'end' : 'start');
      t.textContent = `${h} m · ring ${km(Math.hypot(x - RING.x, y - RING.y))}`;
    }
    if (readout.current) readout.current.textContent = `pointer · ${h} m · ${km(d)} from STN 7 · bearing ${deg(bearing(STATION.x, STATION.y, x, y))}`;
  }, []);

  useEffect(() => {
    clamp(); apply(); showProbe(null);
    // the box changes (a phone turns, the panel opens): the scale and the clamps follow it
    const ro = new ResizeObserver(() => { clamp(); apply(); });
    if (svg.current) ro.observe(svg.current);
    return () => ro.disconnect();
  }, [apply, clamp, showProbe]);

  // ---- pointers: hover reads, drag pans, two fingers pinch, a tap places the probe or a measure point
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = toSvg(e);
    pointers.current.set(e.pointerId, p);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { start: p, moved: true, pinch: { d: Math.hypot(a[0] - b[0], a[1] - b[1]), mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] } };
    } else {
      // the place under the finger, if any: chosen on release if it has not moved (the capture below
      // retargets the click to the svg, so a click handler on the place would never hear it)
      const place = (e.target as Element).closest<SVGGElement>('.st-map__place')?.dataset.id;
      gesture.current = { start: p, moved: false, place };
    }
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = toSvg(e);
    const gs = gesture.current;
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, p);
    if (gs && pointers.current.size === 2 && gs.pinch) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      zoomAt(view.current.k * (d / gs.pinch.d), mid[0], mid[1]);
      panBy(mid[0] - gs.pinch.mid[0], mid[1] - gs.pinch.mid[1]);
      gs.pinch = { d, mid };
      return;
    }
    if (gs && pointers.current.size === 1) {
      const dx = p[0] - gs.start[0], dy = p[1] - gs.start[1];
      if (!gs.moved && Math.hypot(dx, dy) * (svg.current!.getScreenCTM()?.a ?? 1) > 5) gs.moved = true;
      if (gs.moved) {
        panBy(dx, dy);
        gs.start = p;
        showProbe(null);
        return;
      }
    }
    if (e.pointerType === 'mouse' && !pinned.current) showProbe(toWorld(p));
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const gs = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size) { if (gs) gs.pinch = undefined; return; }
    gesture.current = null;
    setZoom(view.current.k);
    if (!gs || gs.moved) return;
    // a tap or click, in place
    const w = toWorld(toSvg(e));
    if (measuring) {
      setMeasure((m) => (m.length >= 2 ? [w] : [...m, w]));
      return;
    }
    if (gs.place) {
      const p = places.find((x) => x.id === gs.place);
      if (p) { setSel(p.id); onNote?.(`survey: ${surveyLine(p)}`); }
      return;
    }
    if (e.pointerType !== 'mouse') {
      // a finger has no hover: the tap places the probe, the next tap lifts it
      pinned.current = !pinned.current;
      showProbe(pinned.current ? w : null);
    }
    setSel(null);
  };
  const onLeave = () => { if (!pinned.current) showProbe(null); };
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const [x, y] = toSvg(e);
    zoomAt(view.current.k * Math.exp(-e.deltaY * 0.0016), x, y);
    setZoom(view.current.k);
  };
  const onDouble = (e: React.MouseEvent<SVGSVGElement>) => {
    const [x, y] = toSvg(e);
    zoomAt(view.current.k >= ZOOM.max ? 1 : view.current.k * 2, x, y);
    setZoom(view.current.k);
  };
  const onKey = (e: React.KeyboardEvent<SVGSVGElement>) => {
    const step = 40 / view.current.k, [cx, cy] = centre();
    const map: Record<string, () => void> = {
      '+': () => zoomAt(view.current.k * 1.5, cx, cy), '=': () => zoomAt(view.current.k * 1.5, cx, cy),
      '-': () => zoomAt(view.current.k / 1.5, cx, cy), '0': fit,
      ArrowLeft: () => panBy(step, 0), ArrowRight: () => panBy(-step, 0), ArrowUp: () => panBy(0, step), ArrowDown: () => panBy(0, -step),
      Escape: () => { setMeasure([]); setMeasuring(false); setSel(null); pinned.current = false; showProbe(null); },
    };
    // Escape with nothing to clear is left to whoever holds the map (the panel closes on it)
    if (e.key === 'Escape' && !measuring && !measure.length && !sel && !pinned.current) return;
    const f = map[e.key];
    if (f) { e.preventDefault(); f(); setZoom(view.current.k); }
  };
  // the wheel must be a non-passive listener to keep the page still; React's is passive
  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    const stop = (e: WheelEvent) => e.preventDefault();
    s.addEventListener('wheel', stop, { passive: false });
    return () => s.removeEventListener('wheel', stop);
  }, []);

  // ---- the measure: two points, a line, the figures
  const measured = measure.length === 2 ? (() => {
    const [a, b] = measure;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const climb = Math.round(height(b[0], b[1]) - height(a[0], a[1]));
    return { d, text: `${km(d)} · ${climb >= 0 ? '+' : '−'}${Math.abs(climb)} m · bearing ${deg(bearing(a[0], a[1], b[0], b[1]))}` };
  })() : null;

  const you: [number, number, number] = level >= 4 ? [534, 216, 50] : level >= 2 ? [456, 262, 62] : [330, 262, 84];

  return (
    <div className={`st-mapp${big ? ' st-mapp--big' : ''}`}>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio={big ? 'xMidYMid slice' : 'xMidYMid meet'}
        className={`st-map${measuring ? ' is-measuring' : ''}`}
        tabIndex={0}
        role="application"
        aria-label="Topographic survey: the station by the stream in the south-west, the trail climbing to the ring of seven stones on a knoll at 412 metres. Zoom with plus and minus, pan with the arrow keys."
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onLeave}
        onWheel={onWheel} onDoubleClick={onDouble} onKeyDown={onKey}
      >
        <defs>
          <clipPath id="st-map-clip"><rect width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#st-map-clip)">
          <g ref={viewG}>
            <Ground />
            {/* the ways: the trail, and what the later files add to it */}
            {level >= 4 ? <path d={RIDGE_ROAD} className="st-map__road" /> : null}
            {level >= 3 ? <line x1={MAST.x} y1={MAST.y} x2={RING.x} y2={RING.y} className="st-map__carrier" /> : null}
            <path d={TRAIL} className="st-map__trail" />
            <path d={TRAIL} className="st-map__walk" />
            {level >= 4 ? <path d={`${TRAIL} S556 208 ${RING.x} ${RING.y}`} className="st-map__ghost" /> : null}
            {STONES.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} className={`st-map__stone${i === 6 ? ' is-seven' : ''}`} />)}
            {/* the places, each mark and name held to one size as the map zooms */}
            {places.map((p) => (
              <g key={p.id} data-id={p.id} transform={`translate(${p.x} ${p.y})`} className={`st-map__place${sel === p.id ? ' is-selected' : ''}`}>
                <g className="st-map__pin">
                  <circle r={14} className="st-map__hit" />
                  <Mark kind={p.kind} selected={sel === p.id} />
                  {sel === p.id ? <circle r={p.kind === 'ring' ? RING.r + 20 : 11} className="st-map__halo" /> : null}
                  <text x={p.label?.[0] ?? 12} y={p.label?.[1] ?? 5} className={`st-map__label${['water', 'ridge'].includes(p.kind) ? ' st-map__label--dim' : ''}`}>
                    {p.name}{p.id === 'stn' ? ' · 172 m' : p.id === 'ring' ? ' · 412 m' : ''}
                  </text>
                </g>
              </g>
            ))}
            {/* you, partway up the trail, heading for the ring */}
            <g transform={`translate(${you[0]} ${you[1]})`}><g className="st-map__pin"><path d="M0 -11 L7 7 L0 3 L-7 7 Z" className="st-map__you" transform={`rotate(${you[2]})`} /></g></g>
            {/* the measure */}
            {measure.length === 2 ? <line x1={measure[0][0]} y1={measure[0][1]} x2={measure[1][0]} y2={measure[1][1]} className="st-map__tape" /> : null}
            {measure.map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}><g className="st-map__pin">
                <circle r={4} className="st-map__pt" />
                <text x={8} y={-6} className="st-map__pt-label">{i === 0 ? 'A' : 'B'}</text>
                {i === 1 && measured ? <text x={8} y={14} className="st-map__pt-label st-map__pt-label--figures">{measured.text}</text> : null}
              </g></g>
            ))}
            {/* the probe under the pointer */}
            <g ref={probeG} className="st-map__probe" style={{ display: 'none' }}>
              <line ref={probeV} y1={-H * 4} y2={H * 5} /><line ref={probeH} x1={-W * 4} x2={W * 5} />
              <g ref={probeT}><g className="st-map__pin"><text ref={probeText} /></g></g>
            </g>
          </g>
        </g>
      </svg>

      <div className="st-map__bar">
        <div className="st-map__tools" role="group" aria-label="Map controls">
          <button type="button" onClick={() => { zoomAt(view.current.k / 1.5, ...centre()); setZoom(view.current.k); }} disabled={zoom <= ZOOM.min + 0.001} aria-label="Zoom out">−</button>
          <span className="st-map__zoom" aria-live="polite">{zoom.toFixed(1)}×</span>
          <button type="button" onClick={() => { zoomAt(view.current.k * 1.5, ...centre()); setZoom(view.current.k); }} disabled={zoom >= ZOOM.max - 0.001} aria-label="Zoom in">+</button>
          <button type="button" onClick={fit} disabled={zoom <= ZOOM.min + 0.001}>Fit</button>
          <button type="button" className={measuring ? 'is-on' : ''} aria-pressed={measuring} onClick={() => { setMeasuring((m) => !m); setMeasure([]); }}>Measure</button>
          {measure.length ? <button type="button" onClick={() => setMeasure([])}>Clear</button> : null}
          {/* north is up; the bar is 500 m as the map is drawn now */}
          <span className="st-map__north" aria-label="North is up">N ↑</span>
          <span className="st-map__scale"><i ref={bar} />500 m</span>
        </div>
        <span ref={readout} className="st-map__readout" />
      </div>

      <div className="st-map__note" aria-live="polite">
        {measuring ? (
          <p className="st-map__hint">{measure.length === 0 ? 'Measure: click the first point.' : measure.length === 1 ? 'now the second.' : measured?.text}</p>
        ) : selected ? (
          <>
            <p className="st-map__line">{surveyLine(selected)}</p>
            {selected.lines.filter(([from]) => from <= level).map(([, t]) => <p key={t} className="st-map__hint">{t}</p>)}
          </>
        ) : (
          <p className="st-map__hint">{places.length} places marked. Click one; scroll or pinch to zoom, drag to pan.</p>
        )}
      </div>
    </div>
  );
}
