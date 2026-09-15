/**
 * The crop.
 *
 * Several depth bands, far to near. Each band is drawn once into its own
 * offscreen surface and then animated by shearing it in horizontal slabs —
 * the top of a band shifts further than its base, which is how a head of
 * wheat actually moves. Redrawing tens of thousands of stalks every frame
 * would look no better and cost a hundred times as much.
 *
 * The nearest band is the exception: it is drawn live, few enough stalks to
 * afford real per-stalk bending, because it is the one close enough that
 * shearing a flat image would read as a flat image.
 *
 * The effigy's light is baked into the stalks themselves, tinting each one by
 * how close it stands to the fire. An earlier version laid a single big
 * `screen` gradient over the finished field instead; it left hard rectangular
 * banding across the crop, and even without the artefact a flat wash over the
 * top is not what light in a field looks like.
 *
 * A stalk is three pieces — stem, grain, awns — and painting each one of them
 * separately meant three state changes and three rasteriser passes per stalk,
 * eight thousand stalks at build and a hundred and sixty every frame. They are
 * batched instead: stalks sharing a colour and a weight go into one path each,
 * which is why the tint is quantised into a handful of levels rather than
 * being continuous. At these values the steps are not visible.
 *
 * The near band goes further. A head of grain and its awns are rigid — they
 * ride on the top of the stem and the bend barely reshapes them — so each one
 * is baked into a small sprite at build and stamped at the stalk's top every
 * frame. Only the stems, which really do curve, are still drawn as paths.
 */
import { PAL } from './palette.js';
import { mix, litAmount } from './color.js';
import { makeSurface, stamp } from './surface.js';

const SLABS = 26;              // horizontal strips a sheared band is cut into
const PAD = 90;                // headroom each side so shearing never gaps
const LIT_LEVELS = 10;         // quantised tint steps in a baked band
const NEAR_LIT_LEVELS = 6;
const NEAR_WEIGHTS = 3;

/**
 * Wind: a couple of travelling waves plus a slow gust that moves the whole
 * field together. Returns roughly -2..2.
 */
export function wind(t, x, phase) {
  return Math.sin(t * 0.55 + x * 0.004 + phase) * 0.8
    + Math.sin(t * 1.27 + x * 0.011 + phase * 1.7) * 0.35
    + Math.sin(t * 0.21 + phase * 0.4) * 1.1;
}

/* ------------------------------------------------------- pieces of a stalk */

function stemPath(c, x, baseY, height, lean) {
  c.moveTo(x, baseY);
  c.quadraticCurveTo(x + lean * 0.25, baseY - height * 0.6, x + lean, baseY - height);
}

/* The head. Wheat is not a spike: it is a column of paired grains with long
   awns off the top, and without both it reads as a reed. */
function headPath(c, topX, topY, lean, ear) {
  const rows = 4;
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1);
    const gy = topY + ear * 2.1 * t;
    const gx = topX + lean * 0.04 * (1 - t);
    const gw = ear * 0.46 * (1 - Math.abs(t - 0.45) * 0.9);
    const gh = ear * 0.52;
    for (const side of [-1, 1]) {
      c.moveTo(gx + side * gw * 1.17, gy);
      c.ellipse(gx + side * gw * 0.55, gy, gw * 0.62, gh * 0.5, side * 0.25, 0, Math.PI * 2);
    }
  }
}

/** awns, swept up and out */
function awnPath(c, topX, topY, ear) {
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const ax = topX + (t - 0.5) * ear * 0.8;
    const ay = topY + ear * (0.1 + t * 0.5);
    c.moveTo(ax, ay);
    c.quadraticCurveTo(
      ax + (t - 0.5) * ear * 1.4, ay - ear * 1.1,
      ax + (t - 0.5) * ear * 2.4, ay - ear * 2.3,
    );
  }
}

/** Every stalk of one colour and weight, in three paths. `bend` is the lean. */
function paintGroup(c, list, col, width, bend) {
  c.strokeStyle = col;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.beginPath();
  for (const s of list) stemPath(c, s.x, s.baseY, s.height, bend(s));
  c.stroke();

  c.fillStyle = col;
  c.beginPath();
  for (const s of list) {
    const l = bend(s);
    headPath(c, s.x + l, s.baseY - s.height, l, s.ear);
  }
  c.fill();

  c.lineWidth = Math.max(0.35, width * 0.45);
  c.beginPath();
  for (const s of list) awnPath(c, s.x + bend(s), s.baseY - s.height, s.ear);
  c.stroke();
}

const ownLean = (s) => s.lean;

/**
 * One stalk's head and awns, baked around a local origin at the top of its
 * stem. The box is the convex hull of the awn curves plus the grain column,
 * with the line weight allowed for on every side.
 */
function makeCrown(s, col, width, dpr) {
  const pen = Math.max(0.35, width * 0.45) * 2;
  const hx = s.ear * 2.0 + pen;
  const up = s.ear * 2.5 + pen;
  const down = s.ear * 2.8 + pen;

  const sprite = makeSurface(-hx, -up, hx * 2, up + down, dpr);
  const c = sprite.ctx;
  c.lineCap = 'round';

  c.fillStyle = col;
  c.beginPath();
  headPath(c, 0, 0, s.lean, s.ear);
  c.fill();

  c.strokeStyle = col;
  c.lineWidth = Math.max(0.35, width * 0.45);
  c.beginPath();
  awnPath(c, 0, 0, s.ear);
  c.stroke();

  return sprite;
}

/* ------------------------------------------------------------------ bands */

/** Render one band of crop into its own surface. */
function makeBand(w, spec, rng, light, bandY, dpr) {
  /* Headroom above. Stalk heights vary past the nominal band height, and a
     surface sized to the nominal height cut them off in a dead flat line —
     that was the hard seam between bands. */
  const cw = w + PAD * 2;
  /* Headroom below. A band whose feet all sat on one line ended in a razor
     edge, and where that edge fell the crop density dropped off a cliff. The
     feet sink over a range instead, and the nearest band sinks right off the
     bottom of the frame: standing in a crop there is no ground line to see. */
  const spread = spec.spread;
  const ch = Math.ceil(spec.height * 1.75 + spread);
  const rootY = ch - spread;
  const surface = makeSurface(0, 0, cw, ch, dpr);
  const c = surface.ctx;

  /* Bucketed by how much of the fire reaches the stalk. Every stalk in a band
     shares a weight, so a bucket is exactly three paths. */
  const buckets = new Map();
  let top = ch;

  for (let i = 0; i < spec.count; i++) {
    const x = rng() * cw;
    const depth = rng();
    const lean = (rng() - 0.5) * spec.height * 0.22;
    const accent = rng() < 0.18;
    // how far below the root line this one stands — and it grows to match, so
    // the heads of the band still sit at one height
    const sink = rng() * spread;
    const foot = rootY + sink;
    const height = spec.height * (0.45 + depth * 0.55) * (0.8 + rng() * 0.4) + sink;

    const k = litAmount(x - PAD, bandY + rootY - height * 0.6, light);
    const level = Math.round(Math.min(1, k) * LIT_LEVELS);
    const key = (accent ? 'a' : 'b') + level;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        col: mix(accent ? spec.accent : spec.color, PAL.litWarm,
          (level / LIT_LEVELS) * 0.9),
        list: [],
      };
      buckets.set(key, bucket);
    }
    bucket.list.push({ x, baseY: foot, height, lean, ear: spec.ear });

    // the highest the awns reach, so the empty headroom is never blitted
    top = Math.min(top, foot - height - spec.ear * 2.4 - spec.width);
  }

  for (const b of buckets.values()) paintGroup(c, b.list, b.col, spec.width, ownLean);

  // dissolve the top of the band into the one behind it
  const fade = c.createLinearGradient(0, 0, 0, ch * 0.62);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = fade;
  c.fillRect(0, 0, cw, ch * 0.62);
  c.globalCompositeOperation = 'source-over';

  return { surface, top: Math.max(0, top), rootY };
}

export function buildWheat(w, h, horizonY, light, dpr, rng) {
  const bands = [];

  /* far to near. Each sits lower, is darker, coarser and sways further. */
  const specs = [
    { root: 1.02, height: h * 0.11, spread: 6, count: Math.round(w * 1.8),
      color: PAL.wheatFar, accent: PAL.haze, width: 0.55, ear: 1.6, sway: 5 },
    { root: 1.13, height: h * 0.17, spread: 6, count: Math.round(w * 1.3),
      color: PAL.wheatMid, accent: PAL.wheatFar, width: 0.8, ear: 2.6, sway: 9 },
    { root: 1.27, height: h * 0.25, spread: 6, count: Math.round(w * 0.9),
      color: PAL.wheatNear, accent: PAL.wheatMid, width: 1.1, ear: 3.8, sway: 14 },
    /* The nearest. Its feet run from its own root line to below the bottom of
       the window, which is what hides the one below it and fills the near
       ground that used to be flat black. */
    { root: 1.44, height: h * 0.30, spread: h * 0.36, count: Math.round(w * 0.95),
      color: PAL.wheatBlack, accent: PAL.wheatNear, width: 1.6, ear: 5.2, sway: 20 },
  ];

  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const rootLine = Math.round(horizonY * s.root + h * 0.015 * i);
    const { surface, top, rootY } = makeBand(
      w, s, rng, light, Math.round(rootLine - s.height), dpr);
    bands.push({
      surface,
      top,
      /* The shear ramps from nothing at the roots to full at the ears. It is
         measured against the painted extent, not the surface, or cropping the
         empty headroom away would quietly halve the sway. */
      relScale: 1 / Math.max(0.15, 1 - top / surface.h),
      y: rootLine - rootY,
      sway: s.sway,
      phase: rng() * 10,
    });
  }

  /* the nearest crop, drawn live so it actually bends */
  const near = [];
  const nearCount = Math.round(w * 0.085);
  for (let i = 0; i < nearCount; i++) {
    const nx = rng() * (w + PAD * 2) - PAD;
    near.push({
      x: nx,
      baseY: h * (1.03 + rng() * 0.07),
      height: h * (0.11 + rng() * 0.32),
      lean: (rng() - 0.5) * h * 0.05,
      width: 1.1 + rng() * 1.5,
      ear: 4 + rng() * 4.5,
      phase: rng() * 10,
      bend: 0,
    });
  }

  /* grouped the same way, by tint and by weight */
  const nearGroups = [];
  const byKey = new Map();
  for (const s of near) {
    const k = litAmount(s.x, s.baseY - s.height * 0.55, light);
    const level = Math.round(Math.min(1, k) * NEAR_LIT_LEVELS);
    const weight = Math.round(((s.width - 1.1) / 1.5) * (NEAR_WEIGHTS - 1));
    const key = `${level}:${weight}`;
    let g = byKey.get(key);
    if (!g) {
      g = {
        col: mix(mix(PAL.wheatBlack, PAL.wheatNear, 0.45), PAL.litWarm,
          (level / NEAR_LIT_LEVELS) * 0.6),
        width: 1.1 + (weight / (NEAR_WEIGHTS - 1)) * 1.5,
        list: [],
      };
      byKey.set(key, g);
      nearGroups.push(g);
    }
    g.list.push(s);
    /* the head and the awns, baked once at this stalk's resting lean */
    s.crown = makeCrown(s, g.col, g.width, dpr);
  }

  return {
    bands,

    /** Sheared bands, far to near. */
    drawBack(c, t, viewW) {
      for (const band of bands) {
        const s = band.surface;
        const d = s.dpr;
        const vw = Math.min(s.canvas.width, Math.ceil(viewW * d));
        const dTop = Math.floor(band.top * d);
        const dSpan = s.canvas.height - dTop;
        for (let i = 0; i < SLABS; i++) {
          const sy = dTop + Math.floor((i / SLABS) * dSpan);
          /* Slabs abut exactly. An earlier version overlapped them by a row
             against gaps, but shearing only moves a slab sideways — vertically
             they already tile — and the shared row was composited twice at two
             different offsets, which printed a faint dark line across the crop
             every slab. */
          const end = i === SLABS - 1
            ? s.canvas.height
            : dTop + Math.floor(((i + 1) / SLABS) * dSpan);
          const sh = end - sy;
          if (sh <= 0) continue;

          const cssY = sy / d;
          const rel = Math.min(1, (1 - cssY / s.h) * band.relScale);
          /* The wave travels UP the stem, so height shifts the phase — but
             only slightly. Feeding the slab's y straight into the wind's
             horizontal term swung the phase wildly between neighbouring slabs
             and tore the band into horizontal steps. */
          const off = wind(t, band.phase * 60 + cssY * 0.12, band.phase)
            * band.sway * rel * rel;
          /* Only the part of the slab that lands on screen. The surface
             carries PAD of slack each side so the shear never opens a gap at
             the edges; blitting that slack is a twelfth of the band for
             nothing. */
          const sx = Math.round((PAD - off) * d);
          c.drawImage(
            s.canvas,
            sx, sy, vw, sh,
            sx / d - PAD + off, band.y + cssY, vw / d, sh / d,
          );
        }
      }
    },

    /** The near crop, bent stalk by stalk, drawn over everything else. */
    drawFront(c, t) {
      for (const s of near) s.bend = s.lean + wind(t, s.x, s.phase) * 11;

      /* One stroke per stem, deliberately. Batching them into a path each
         made it slower, not faster: the cost of an antialiased path scales
         with its bounding box, and a hundred and sixty stalks scattered right
         across the frame give a path the size of the window. Grouping is kept
         only so the colour and the weight are set once. Measured at 1920x1080:
         one path per group 51fps, one path for all of them 46, this 55. */
      c.lineCap = 'round';
      for (const g of nearGroups) {
        c.strokeStyle = g.col;
        c.lineWidth = g.width;
        for (const s of g.list) {
          c.beginPath();
          stemPath(c, s.x, s.baseY, s.height, s.bend);
          c.stroke();
        }
      }
      for (const s of near) stamp(c, s.crown, s.x + s.bend, s.baseY - s.height);
    },
  };
}
