/**
 * LAYER 2 — Deep fog & cultists.  Parallax 0.25
 *
 * Background tree silhouettes smothered in low drifting mist. On the far
 * left a procession of hooded cultists carries torches through the fog,
 * moving slowly enough that you only notice them on second look.
 */
import { makeRng, fbm2d } from '../lib/rng.js';
import {
  surface, rect, hline, vline, px, line, fillPoly, mix, clamp, glow,
  hexToRgb, shadeRegion,
} from '../lib/paint.js';
import { PAL } from '../palette.js';
import { drawForestBand } from './trees.js';

export function buildDeepForest(W, H, L, seed) {
  const rng = makeRng(seed);
  const s = surface(W, H);
  const c = s.ctx;

  /* ------------------------------------------------- three receding bands */
  drawForestBand(c, {
    x0: -10, x1: W + 10, baseY: L.treeBase - H * 0.015,
    minH: H * 0.16, maxH: H * 0.30,
    color: mix(PAL.voidSoft, PAL.mist, 0.42),
    snowColor: mix(PAL.frostDeep, PAL.mist, 0.4), snowAmount: 0.10,
    rng, step: H * 0.030,
  });
  veil(c, W, H, L.horizon - H * 0.10, H * 0.34, PAL.mist, 0.24, rng);

  drawForestBand(c, {
    x0: -10, x1: W + 10, baseY: L.treeBase + H * 0.012,
    minH: H * 0.22, maxH: H * 0.42,
    color: mix(PAL.voidSoft, PAL.mist, 0.20),
    snowColor: mix(PAL.frostDeep, PAL.mist, 0.25), snowAmount: 0.14,
    rng, step: H * 0.042, gaps: [{ x: L.vx(0.575), w: L.vw * 0.13, amount: 0.45 },
      { x: L.vx(0.745), w: L.vw * 0.075, amount: 0.38 }],
  });
  veil(c, W, H, L.horizon - H * 0.04, H * 0.30, PAL.mist, 0.15, rng);

  drawForestBand(c, {
    x0: -10, x1: W + 10, baseY: L.treeBase + H * 0.045,
    minH: H * 0.30, maxH: H * 0.54,
    color: mix(PAL.voidBlack, PAL.mist, 0.13),
    snowColor: mix(PAL.frostDeep, PAL.voidSoft, 0.2), snowAmount: 0.16,
    rng, step: H * 0.055, gaps: [{ x: L.vx(0.575), w: L.vw * 0.11, amount: 0.40 },
      { x: L.vx(0.745), w: L.vw * 0.06, amount: 0.30 }],
  });

  /* -------------------------------- scattered bare trunks between the pines */
  for (let i = 0; i < 16; i++) {
    const x = rng.range(0, W);
    const h = rng.range(H * 0.25, H * 0.5);
    const w = Math.max(1, Math.round(rng.range(1, 3)));
    const col = mix(PAL.voidBlack, PAL.mist, rng.range(0.08, 0.22));
    rect(c, x, L.treeBase + H * 0.05 - h, w, h, col);
  }

  /* ---------------------------------------- ground haze pooled at the base */
  const mistRgb = hexToRgb(PAL.mist);
  const n = fbm2d(rng, 40, 3);
  shadeRegion(c, 0, Math.round(L.treeBase - H * 0.10), W, Math.round(H * 0.22), (x, y) => {
    const t = clamp((y - (L.treeBase - H * 0.10)) / (H * 0.14), 0, 1);
    const v = n(x, y * 2.5);
    return [mistRgb[0], mistRgb[1], mistRgb[2], clamp(t * 135 * (0.5 + v * 0.9), 0, 150)];
  });

  /* ------------------------------------------------- drifting mist ribbons */
  const ribbons = [
    makeMistStrip(W, Math.round(H * 0.16), seed + 11, PAL.mist, 0.55),
    makeMistStrip(W, Math.round(H * 0.11), seed + 29, PAL.mistPale, 0.34),
  ];
  const ribbonY = [
    Math.round(L.treeBase - H * 0.10),
    Math.round(L.treeBase - H * 0.02),
  ];

  /* ------------------------------------------------------ the procession */
  const proc = makeProcession(rng, L.vw, L.vh, L);

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
function veil(c, W, H, y, h, col, alpha, rng) {
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
  const n = fbm2d(rng, 56, 3);
  const rgb = hexToRgb(col);
  shadeRegion(s.ctx, 0, 0, W, H, (x, y) => {
    // fade the seam so the wrap is invisible
    const seam = Math.min(1, Math.min(x, W - x) / (W * 0.12));
    const vert = Math.sin((y / H) * Math.PI);
    const v = n(x, y * 3.2);
    const a = clamp((v - 0.42) * 2.4, 0, 1) * vert * seam * alpha * 255;
    if (a < 3) return null;
    return [rgb[0], rgb[1], rgb[2], a];
  });
  return s.canvas;
}

/* ----------------------------------------------------------- cultists */

function makeProcession(rng, W, H, L) {
  const scale = clamp(H / 360, 0.7, 2.2);
  const unit = Math.max(9, Math.round(H * 0.036));
  const members = [];
  const count = 4;
  for (let i = 0; i < count; i++) {
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
    startX: L.vx(0.185),
    span: W * 0.085,
    baseY: L.treeBase + H * 0.05,
    unit,
    scale,
  };
}

function drawProcession(ctx, p, t, ox, oy) {
  // the group creeps forward and loops, so they are always "arriving"
  const march = ((t * 1.35) % p.span);
  const gx = p.startX + march;

  // banner pole
  const b = p.banner;
  const bx = Math.round(ox + gx + b.offset);
  const by = Math.round(oy + p.baseY - Math.sin(t * 1.1) * 0.6);
  drawBanner(ctx, bx, by, b.height, t);

  for (const m of p.members) {
    const x = Math.round(ox + gx + m.offset);
    const walk = t * 2.4 + m.phase;
    const y = Math.round(oy + p.baseY + Math.sin(walk * 2) * 0.5 * m.bob);
    drawCultist(ctx, x, y, m.height, walk, m.horned);
    if (m.torch) {
      const tx = x + Math.round(m.height * 0.42);
      const ty = y - Math.round(m.height * 0.92);
      drawTorch(ctx, tx, ty, m.height, t * 9 * m.flick + m.phase);
    }
  }
}

function drawCultist(c, x, y, h, walk, horned) {
  const body = mix(PAL.voidBlack, PAL.mist, 0.06);
  const hw = Math.max(1, h * 0.16);

  // cloak
  fillPoly(c, [
    [x - hw * 0.7, y - h * 0.78],
    [x + hw * 0.7, y - h * 0.78],
    [x + hw * 1.5, y],
    [x - hw * 1.5, y],
  ], body);

  // hood
  fillPoly(c, [
    [x - hw * 0.55, y - h * 0.72],
    [x, y - h],
    [x + hw * 0.55, y - h * 0.72],
  ], body);

  if (horned) {
    // curved horns / antler stubs on the helm
    line(c, x - hw * 0.4, y - h * 0.95, x - hw * 1.5, y - h * 1.25, body, 1);
    line(c, x - hw * 1.5, y - h * 1.25, x - hw * 1.2, y - h * 1.42, body, 1);
    line(c, x + hw * 0.4, y - h * 0.95, x + hw * 1.5, y - h * 1.25, body, 1);
    line(c, x + hw * 1.5, y - h * 1.25, x + hw * 1.2, y - h * 1.42, body, 1);
  }

  // legs emerging from under the hem
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
  // flame core
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
    const shade1 = i / len;
    const col = mix(PAL.crimsonDeep, PAL.crimsonDim, 0.25 + Math.sin(i * 0.5) * 0.15);
    hline(c, x + 1 + sway, x + w + sway, top + i, shade1 > 0.85 ? mix(col, PAL.voidBlack, 0.4) : col);
    if (i % 7 === 3) px(c, x + w * 0.5 + sway, top + i, PAL.crimson);
  }
}
