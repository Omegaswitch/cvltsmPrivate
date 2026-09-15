/**
 * LAYER 2 — Deep fog & cultists.  Parallax 0.25
 *
 * Background tree silhouettes smothered in low drifting mist, generated as a
 * tiling strip. A procession of hooded cultists carries torches through the
 * fog; because the live pass runs once per visible tile, they come round again
 * further along the road.
 *
 * Further in there is a rite going on — a pyre with figures bowed around it,
 * a standing stone, skull-topped stakes — and dead men lashed to poles stand
 * along the treeline. Both are baked into the strip, so they come past every
 * time the tile does rather than on a timer.
 */
import { makeRng, fbm2dTiling } from '../lib/rng.js';
import {
  surface, rect, hline, vline, px, line, fillPoly, disc, wrapX,
  mix, shade, clamp, lerp, glow, hexToRgb, shadeRegion,
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

  /* ------------------------------------------ the rite, and what it leaves */
  const fires = [];
  wrapX(W, L.tx(0.255), L.sw * 0.07, (x) => {
    fires.push(drawRitualSite(c, makeRng(seed + 51), x, L.treeBase + L.vh * 0.012, L));
  });

  // scattered, and each at its own depth: fixed spacing at one height made a
  // row of them, which reads as a fence rather than as bodies left in a wood
  const poles = Math.max(3, Math.round(W / 230));
  for (let i = 0; i < poles; i++) {
    const px0 = rng.range(0, W);
    const depth = rng();                          // 0 deep in the trees, 1 near
    const baseY = L.treeBase + lerp(-L.vh * 0.030, L.vh * 0.028, depth);
    const h = L.vh * lerp(0.048, 0.088, depth);
    const lean = rng.signed(0.14);
    const sd = Math.floor(rng() * 0xffffff);
    wrapX(W, px0, h + L.vh * 0.04, (sx) => {
      drawSkeletonPole(c, makeRng(sd), sx, baseY, h, lean);
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

      // the pyre and the cultists first — the mist should drift in front
      for (const f of fires) drawRitualFire(ctx, f, time, ox, oy);
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

/* --------------------------------------------------------------- the rite */

/**
 * A pyre in a clearing with figures bowed around it, a standing stone at its
 * back and skull-topped stakes to either side. Everything but the fire is
 * baked; the flame is painted live so it flickers.
 */
function drawRitualSite(c, rng, x, baseY, L) {
  const unit = Math.max(7, Math.round(L.vh * 0.026));
  const body = mix(PAL.voidBlack, PAL.mist, 0.07);
  const wood = mix(PAL.voidBlack, PAL.bark, 0.5);

  /* The firelight is baked in first, before anything standing around it.
   * Painted live it would composite OVER the congregation and wash them out;
   * behind them it does the one job that matters here — turning them into
   * readable silhouettes. Only the flame itself is live. */
  glow(c, x, baseY - unit * 1.1, unit * 7.5, PAL.crimsonDim, 0.45);
  glow(c, x, baseY - unit * 0.8, unit * 3.4, PAL.amberDeep, 0.42);

  /* scorched ground */
  const burnW = unit * 2.8;
  for (let i = -burnW; i <= burnW; i++) {
    const t = i / burnW;
    const d = Math.sqrt(Math.max(0, 1 - t * t)) * unit * 0.42;
    vline(c, x + i, baseY - d * 0.3, baseY + d * 0.3, mix(PAL.voidBlack, PAL.soil, 0.55));
  }

  /* the standing stone behind it */
  const stoneH = unit * 2.3;
  const stoneW = Math.max(3, Math.round(unit * 0.5));
  fillPoly(c, [
    [x - stoneW * 0.5, baseY - stoneH],
    [x + stoneW * 0.5, baseY - stoneH * 0.94],
    [x + stoneW * 0.62, baseY - unit * 0.2],
    [x - stoneW * 0.6, baseY - unit * 0.2],
  ], mix(PAL.voidBlack, PAL.mist, 0.16));
  // a mark cut into it, catching the firelight
  for (let i = 0; i < 4; i++) {
    px(c, x - 1 + (i % 2), baseY - stoneH * 0.72 + i * 2, mix(PAL.crimsonDeep, PAL.mist, 0.35));
  }

  /* the pyre: crossed timbers stacked into a cone */
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI + rng.range(-0.2, 0.2);
    const len = unit * rng.range(0.8, 1.15);
    line(c, x - Math.cos(a) * len, baseY, x + Math.cos(a) * len * 0.45, baseY - len * 1.15, wood, 1);
  }
  rect(c, x - unit * 0.55, baseY - 1, unit * 1.1, 2, shade(wood, -0.3));

  /* the congregation, bowed toward it */
  for (const spot of [-2.75, -1.95, -1.2, 1.15, 1.9, 2.7]) {
    const fx = x + spot * unit;
    const h = unit * rng.range(1.2, 1.6);
    drawWorshipper(c, fx, baseY + rng.signed(1.5), h, rng.chance(0.5), spot < 0 ? 1 : -1, body);
  }

  /* stakes with skulls on them, flanking the fire */
  drawSkullStake(c, rng, x - unit * 3.6, baseY, unit, body);
  drawSkullStake(c, rng, x + unit * 3.5, baseY, unit, body);

  return { x, y: baseY - unit * 0.55, unit, phase: rng.range(0, Math.PI * 2) };
}

/** A hooded figure, standing or on its knees, turned toward the fire. */
function drawWorshipper(c, x, y, h, kneeling, face, body) {
  const hw = Math.max(1, h * 0.18);
  if (kneeling) {
    // folded forward, forehead near the ground
    fillPoly(c, [
      [x - hw * 1.5, y],
      [x - hw * 1.1, y - h * 0.42],
      [x + face * hw * 0.5, y - h * 0.58],
      [x + face * hw * 1.7, y - h * 0.24],
      [x + hw * 1.6, y],
    ], body);
    disc(c, x + face * hw * 1.2, y - h * 0.5, hw * 0.72, body);
  } else {
    fillPoly(c, [
      [x - hw * 0.85, y - h * 0.8],
      [x + hw * 0.85, y - h * 0.8],
      [x + hw * 1.5, y],
      [x - hw * 1.5, y],
    ], body);
    fillPoly(c, [
      [x - hw * 0.62, y - h * 0.74],
      [x, y - h * 1.04],
      [x + hw * 0.62, y - h * 0.74],
    ], body);
    // arms lifted toward the flame, drawn thick enough to be a shape
    line(c, x + face * hw * 0.7, y - h * 0.62,
      x + face * hw * 1.9, y - h * 0.88, body, 2);
  }
}

/** A stake with a skull set on top of it. */
function drawSkullStake(c, rng, x, baseY, unit, body) {
  const h = unit * rng.range(1.3, 1.8);
  rect(c, x, baseY - h, 2, h, body);
  const bone = mix(shade(mix(PAL.frostMid, '#b3ab97', 0.5), -0.38), PAL.mist, 0.18);
  rect(c, x - 1, baseY - h - 3, 3, 3, bone);
  px(c, x - 1, baseY - h - 2, PAL.voidBlack);
  px(c, x + 1, baseY - h - 2, PAL.voidBlack);
}

/**
 * A dead man lashed to a pole: skull, ribs, hanging arms and legs. Bone is
 * kept dim and mixed toward the mist so it sits back in the trees instead of
 * jumping forward as the brightest thing in the frame.
 */
function drawSkeletonPole(c, rng, x, baseY, h, lean) {
  const tilt = (dy) => Math.round(dy * lean);     // the stake is not plumb
  const bone = mix(shade(mix(PAL.frostMid, '#b3ab97', 0.5), -0.36), PAL.mist, 0.16);
  const boneDim = shade(bone, -0.4);
  const wood = mix(PAL.voidBlack, PAL.bark, 0.45);
  const rope = mix(PAL.barkMid, PAL.voidBlack, 0.35);

  /* the stake, leaning a little, and the crossbar the arms hang from */
  for (let dy = 0; dy <= h; dy++) {
    const sx = x + tilt(h - dy);
    px(c, sx, baseY - dy, wood);
    px(c, sx + 1, baseY - dy, shade(wood, -0.45));
  }
  x += tilt(h * 0.8);
  const armY = Math.round(baseY - h * 0.80);
  const arm = Math.max(2, Math.round(h * 0.24));
  hline(c, x - arm, x + arm + 1, armY, wood);

  /* skull, slumped forward */
  const skullY = Math.round(baseY - h * 0.94) + tilt(-h * 0.14);
  rect(c, x - 1, skullY, 3, 3, bone);
  px(c, x - 1, skullY + 1, PAL.voidBlack);
  px(c, x + 1, skullY + 1, PAL.voidBlack);
  px(c, x, skullY + 3, boneDim);

  /* spine and ribs */
  const hipY = Math.round(armY + h * 0.30);
  vline(c, x, skullY + 4, hipY, bone);
  for (let i = 0; i < 3; i++) {
    const ry = skullY + 5 + i * 2;
    if (ry >= hipY) break;
    hline(c, x - 2, x - 1, ry, boneDim);
    hline(c, x + 1, x + 2, ry, boneDim);
  }
  rect(c, x - 1, hipY, 3, 2, boneDim);

  /* arms lashed out along the bar, then dropping */
  line(c, x - arm + 1, armY, x - arm, armY + h * 0.22, bone, 1);
  line(c, x + arm, armY, x + arm + 1, armY + h * 0.20, bone, 1);
  px(c, x - arm + 1, armY, rope);
  px(c, x + arm, armY, rope);

  /* legs, hanging clear of the ground */
  line(c, x - 1, hipY + 2, x - 2, hipY + h * 0.24, bone, 1);
  line(c, x + 1, hipY + 2, x + 2, hipY + h * 0.22, bone, 1);
  px(c, x, hipY - 1, rope);
}

/** The pyre flame, painted every frame. */
function drawRitualFire(c, site, t, ox, oy) {
  const u = site.unit;
  const f = 0.72 + Math.sin(t * 6.3 + site.phase) * 0.18 + Math.sin(t * 14.1 + site.phase) * 0.1;
  const x = ox + site.x;
  const y = oy + site.y;

  glow(c, x, y, u * 3.4 * f, PAL.amber, 0.55);
  glow(c, x, y, u * 1.5, PAL.amberPale, 0.5);

  // tongues of flame: a broad low cone, tallest in the middle
  const half = Math.max(2, Math.round(u * 0.32));
  for (let i = -half; i <= half; i++) {
    const edge = Math.abs(i) / half;
    const lick = 0.7 + 0.55 * Math.abs(Math.sin(t * 8 + i * 1.7 + site.phase));
    const hgt = u * (0.95 - edge * 0.62) * lick;
    const col = edge < 0.34 ? PAL.amberPale : edge < 0.72 ? PAL.amber : PAL.amberDeep;
    vline(c, x + i, y - hgt, y, col);
  }
  // embers lifting off it
  for (let i = 0; i < 3; i++) {
    const rise = ((t * 0.45 + i * 0.37) % 1);
    px(c, x + Math.round(Math.sin(t * 1.7 + i * 2.3) * u * 0.5),
      Math.round(y - u * (1.1 + rise * 1.9)), rise > 0.6 ? PAL.crimsonDim : PAL.crimson);
  }
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
