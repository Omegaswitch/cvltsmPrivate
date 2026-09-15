/**
 * LAYER 2 — Deep fog & cultists.  Parallax 0.25
 *
 * Background tree silhouettes smothered in low drifting mist, generated as a
 * tiling strip. A procession of hooded cultists carries torches through the
 * fog; because the live pass runs once per visible tile, they come round again
 * further along the road.
 */
import { makeRng, fbm2dTiling } from '../lib/rng.js';
import {
  surface, rect, hline, vline, px, line, fillPoly, wrapX,
  mix, clamp, glow, hexToRgb, shadeRegion,
} from '../lib/paint.js';
import { PAL } from '../palette.js';
import { drawForestBand, drawPine } from './trees.js';

export function buildDeepForest(L, seed) {
  const { W, H } = L;
  const rng = makeRng(seed);
  const s = surface(W, H);
  const c = s.ctx;

  /* ------------------------------------------------- three receding bands */
  drawForestBand(c, {
    W, baseY: L.treeBase - L.vh * 0.015,
    minH: L.vh * 0.14, maxH: L.vh * 0.26,
    color: mix(PAL.voidSoft, PAL.mist, 0.42),
    snowColor: mix(PAL.frostDeep, PAL.mist, 0.4), snowAmount: 0.10,
    rng, step: L.vh * 0.030,
  });
  veil(c, W, L.horizon - L.vh * 0.10, L.vh * 0.34, PAL.mist, 0.36);

  drawForestBand(c, {
    W, baseY: L.treeBase + L.vh * 0.012,
    minH: L.vh * 0.18, maxH: L.vh * 0.34,
    color: mix(PAL.voidSoft, PAL.mist, 0.20),
    snowColor: mix(PAL.frostDeep, PAL.mist, 0.25), snowAmount: 0.14,
    rng, step: L.vh * 0.042,
  });
  veil(c, W, L.horizon - L.vh * 0.04, L.vh * 0.30, PAL.mist, 0.26);

  drawForestBand(c, {
    W, baseY: L.treeBase + L.vh * 0.045,
    minH: L.vh * 0.24, maxH: L.vh * 0.40,
    color: mix(PAL.voidBlack, PAL.mist, 0.13),
    snowColor: mix(PAL.frostDeep, PAL.voidSoft, 0.2), snowAmount: 0.16,
    rng, step: L.vh * 0.055,
  });

  /* ------------------ taller spires breaking the line of the canopy -------
   * These used to be bare rectangles: a flat-topped bar ending in open sky
   * with nothing on it, which reads as a rendering fault rather than a tree.
   * They are narrow conifers now — same job of breaking up the skyline, but
   * they actually have a crown on them.
   */
  for (let i = 0; i < Math.round(W / 52); i++) {
    const x = rng.range(0, W);
    const h = rng.range(L.vh * 0.34, L.vh * 0.54);
    const halfWidth = h * rng.range(0.085, 0.135);
    const treeSeed = Math.floor(rng() * 0xffffff);
    wrapX(W, x, halfWidth + 4, (sx) => {
      drawPine(c, {
        x: sx,
        baseY: L.treeBase + L.vh * 0.05,
        height: h,
        halfWidth,
        color: mix(PAL.voidBlack, PAL.mist, 0.10),
        snowColor: mix(PAL.frostDeep, PAL.voidSoft, 0.22),
        snowAmount: 0.13,
        rng: makeRng(treeSeed),
        trunk: false,
      });
    });
  }

  /* ---------------------------------------- ground haze pooled at the base */
  const mistRgb = hexToRgb(PAL.mist);
  const n = fbm2dTiling(rng, W, 40, 3);
  const hazeTop = Math.round(L.treeBase - L.vh * 0.10);
  shadeRegion(c, 0, hazeTop, W, Math.round(L.vh * 0.22), (x, y) => {
    const t = clamp((y - hazeTop) / (L.vh * 0.14), 0, 1);
    return [mistRgb[0], mistRgb[1], mistRgb[2], clamp(t * 180 * (0.5 + n(x, y * 2.5) * 0.9), 0, 200)];
  });

  /* ------------------------------------------------- drifting mist ribbons */
  const ribbons = [
    makeMistStrip(W, Math.round(L.vh * 0.18), seed + 11, PAL.mist, 0.72),
    makeMistStrip(W, Math.round(L.vh * 0.13), seed + 29, PAL.mistPale, 0.46),
  ];
  const ribbonY = [
    Math.round(L.treeBase - L.vh * 0.10),
    Math.round(L.treeBase - L.vh * 0.02),
  ];

  /* ------------------------------------------------------ the procession */
  const proc = makeProcession(rng, L);

  return {
    canvas: s.canvas,
    over(ctx, t, ox, oy, opts) {
      const still = opts && opts.reducedMotion;
      const time = still ? 0 : t;

      // cultists first — the mist should drift in front of them
      drawProcession(ctx, proc, time, ox, oy);

      for (let i = 0; i < ribbons.length; i++) {
        const strip = ribbons[i];
        const speed = i === 0 ? 5.5 : 9;
        const off = ((time * speed) % W + W) % W;
        const y = oy + ribbonY[i] + (i === 0 ? Math.sin(time * 0.15) * 2 : 0);
        ctx.drawImage(strip, Math.round(ox - off), Math.round(y));
        ctx.drawImage(strip, Math.round(ox - off + W), Math.round(y));
      }
    },
  };
}

/** Flat translucent wash used to push a band of trees into the distance. */
function veil(c, W, y, h, col, alpha) {
  const rgb = hexToRgb(col);
  shadeRegion(c, 0, Math.round(y), W, Math.round(h), (x, iy) => {
    const t = clamp((iy - y) / h, 0, 1);
    return [rgb[0], rgb[1], rgb[2], alpha * 255 * (0.35 + t * 0.9)];
  });
}

/** A horizontally tiling ribbon of fog. */
function makeMistStrip(W, H, seed, col, alpha) {
  const rng = makeRng(seed);
  const s = surface(W, H);
  const n = fbm2dTiling(rng, W, 56, 3);
  const rgb = hexToRgb(col);
  shadeRegion(s.ctx, 0, 0, W, H, (x, y) => {
    const vert = Math.sin((y / H) * Math.PI);
    const a = clamp((n(x, y * 3.2) - 0.42) * 2.4, 0, 1) * vert * alpha * 255;
    return a < 3 ? null : [rgb[0], rgb[1], rgb[2], a];
  });
  return s.canvas;
}

/* ----------------------------------------------------------- cultists */

function makeProcession(rng, L) {
  const unit = Math.max(9, Math.round(L.vh * 0.036));
  const members = [];
  for (let i = 0; i < 4; i++) {
    members.push({
      offset: i * unit * rng.range(1.1, 1.8),
      height: unit * rng.range(0.85, 1.12),
      horned: i === 1 || i === 3,
      torch: i !== 2,
      phase: rng.range(0, Math.PI * 2),
      bob: rng.range(0.8, 1.4),
      flick: rng.range(0.5, 1.5),
    });
  }
  return {
    members,
    banner: { offset: -unit * 1.6, height: unit * 2.5 },
    startX: L.tx(0.12),
    span: L.sw * 0.09,
    baseY: L.treeBase + L.vh * 0.05,
    unit,
  };
}

function drawProcession(ctx, p, t, ox, oy) {
  // the group creeps forward and loops, so they are always "arriving"
  const gx = p.startX + ((t * 1.35) % p.span);

  const b = p.banner;
  drawBanner(ctx, Math.round(ox + gx + b.offset),
    Math.round(oy + p.baseY - Math.sin(t * 1.1) * 0.6), b.height, t);

  for (const m of p.members) {
    const x = Math.round(ox + gx + m.offset);
    const walk = t * 2.4 + m.phase;
    const y = Math.round(oy + p.baseY + Math.sin(walk * 2) * 0.5 * m.bob);
    drawCultist(ctx, x, y, m.height, walk, m.horned);
    if (m.torch) {
      drawTorch(ctx, x + Math.round(m.height * 0.42), y - Math.round(m.height * 0.92),
        m.height, t * 9 * m.flick + m.phase);
    }
  }
}

function drawCultist(c, x, y, h, walk, horned) {
  const body = mix(PAL.voidBlack, PAL.mist, 0.06);
  const hw = Math.max(1, h * 0.16);

  fillPoly(c, [
    [x - hw * 0.7, y - h * 0.78],
    [x + hw * 0.7, y - h * 0.78],
    [x + hw * 1.5, y],
    [x - hw * 1.5, y],
  ], body);

  fillPoly(c, [
    [x - hw * 0.55, y - h * 0.72],
    [x, y - h],
    [x + hw * 0.55, y - h * 0.72],
  ], body);

  if (horned) {
    line(c, x - hw * 0.4, y - h * 0.95, x - hw * 1.5, y - h * 1.25, body, 1);
    line(c, x - hw * 1.5, y - h * 1.25, x - hw * 1.2, y - h * 1.42, body, 1);
    line(c, x + hw * 0.4, y - h * 0.95, x + hw * 1.5, y - h * 1.25, body, 1);
    line(c, x + hw * 1.5, y - h * 1.25, x + hw * 1.2, y - h * 1.42, body, 1);
  }

  const swing = Math.sin(walk) * hw * 0.7;
  line(c, x - hw * 0.2, y - h * 0.1, x - hw * 0.2 + swing, y + h * 0.06, body, 1);
  line(c, x + hw * 0.2, y - h * 0.1, x + hw * 0.2 - swing, y + h * 0.06, body, 1);
}

function drawTorch(c, x, y, h, flick) {
  const stick = mix(PAL.voidBlack, PAL.bark, 0.5);
  line(c, x - h * 0.1, y + h * 0.35, x + h * 0.05, y, stick, 1);

  const f = Math.sin(flick) * 0.5 + Math.sin(flick * 2.3) * 0.3 + 0.6;
  const size = Math.max(1, h * 0.14 * (0.75 + f * 0.5));
  glow(c, x, y, size * 11, PAL.crimsonDim, 0.38 + f * 0.24);
  glow(c, x, y, size * 4.5, PAL.amber, 0.55 + f * 0.35);
  rect(c, x, y, Math.max(1, size * 0.8), Math.max(1, size * 1.3), PAL.amber);
  px(c, x, y - 1, PAL.amberPale);
  px(c, x + (f > 0.8 ? 1 : 0), y - 2, PAL.crimson);
}

function drawBanner(c, x, y, h, t) {
  const pole = mix(PAL.voidBlack, PAL.bark, 0.35);
  vline(c, x, y - h, y, pole);
  hline(c, x - 2, x + 2, y - h, pole);

  const w = Math.max(3, h * 0.26);
  const top = y - h + 2;
  const len = h * 0.55;
  for (let i = 0; i < len; i++) {
    const sway = Math.sin(t * 1.1 + i * 0.22) * (i / len) * 1.6;
    const col = mix(PAL.crimsonDeep, PAL.crimsonDim, 0.25 + Math.sin(i * 0.5) * 0.15);
    hline(c, x + 1 + sway, x + w + sway, top + i,
      i / len > 0.85 ? mix(col, PAL.voidBlack, 0.4) : col);
    if (i % 7 === 3) px(c, x + w * 0.5 + sway, top + i, PAL.crimson);
  }
}
