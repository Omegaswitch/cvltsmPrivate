/**
 * LAYER 4 — The path, the water & the running villager.  Parallax 0.7
 *
 * Frozen moss and mud over a dark stream, a rickety log bridge, and the
 * cloaked runner whose lantern drags a pool of warm light across the planks
 * and snow underfoot. The water carries horizontal scanline ripples that
 * reflect both the lantern and the rune columns behind it.
 */
import { makeRng, ridgeline, fbm2d } from '../lib/rng.js';
import {
  surface, rect, hline, vline, px, line, mix, shade, clamp, lerp, glow,
  glowEllipse, rgba, shadeRegion, hexToRgb,
} from '../lib/paint.js';
import { PAL } from '../palette.js';
import { drawPine } from './trees.js';
import { buildRunner } from './villager.js';

export function buildPath(W, H, L, seed) {
  const rng = makeRng(seed);
  const s = surface(W, H);
  const c = s.ctx;

  const bankTop = ridgeline(rng, W, L.groundY, L.groundY + L.vh * 0.01, L.vh * 0.030, 0.52);
  // low-frequency mounds so the bank rolls instead of running flat across frame
  for (let x = 0; x < W; x++) {
    bankTop[x] += Math.sin(x * 0.011) * L.vh * 0.022
      + Math.sin(x * 0.037 + 1.7) * L.vh * 0.010
      + Math.sin(x * 0.091) * L.vh * 0.004;
  }

  /* ------------------------------------------------------------- water */
  drawWater(c, rng, W, H, L);

  /* ------------------------------------------------------- bank & floor */
  for (let x = 0; x < W; x++) {
    const top = Math.round(bankTop[x]);
    vline(c, x, top, L.waterY + 1, PAL.soil);
  }
  // moss and mud mottling
  const n = fbm2d(rng, 26, 3);
  const moss = hexToRgb(PAL.moss);
  const mud = hexToRgb(mix(PAL.soil, PAL.barkMid, 0.5));
  shadeRegion(c, 0, Math.round(L.groundY - H * 0.04), W, Math.round(L.waterY - L.groundY + H * 0.05), (x, y) => {
    if (y < bankTop[clamp(x, 0, W - 1)]) return null;
    const v = n(x, y * 1.8);
    if (v > 0.56) return [moss[0], moss[1], moss[2], (v - 0.56) * 420];
    if (v < 0.4) return [mud[0], mud[1], mud[2], (0.4 - v) * 300];
    return null;
  });

  /* ---------------------------------------------- frost crust on the bank */
  // snow gathers in runs along the crest rather than as per-pixel noise
  for (let x = 0; x < W; x += rng.int(5, 20)) {
    const run = rng.int(2, 7);
    const tone = mix(PAL.frost, PAL.soil, rng.range(0.45, 0.72));
    for (let i = 0; i < run && x + i < W; i++) {
      const xx = x + i;
      const top = Math.round(bankTop[xx]);
      const slope = bankTop[clamp(xx + 1, 0, W - 1)] - bankTop[clamp(xx - 1, 0, W - 1)];
      if (Math.abs(slope) > 1.1 && rng.chance(0.6)) continue;
      px(c, xx, top, tone);
      if (rng.chance(0.35)) px(c, xx, top + 1, mix(PAL.frostDeep, PAL.soil, 0.72));
    }
  }
  // snow patches caught in hollows
  for (let i = 0; i < 26; i++) {
    const px0 = rng.range(L.vx(0.01), L.vx(0.99));
    const w = rng.range(L.vh * 0.02, L.vh * 0.09);
    const y = rng.range(L.groundY + L.vh * 0.015, L.waterY - L.vh * 0.015);
    for (let k = 0; k < w; k++) {
      const h = Math.max(1, Math.round(Math.sin((k / w) * Math.PI) * rng.range(1, 3.2)));
      rect(c, px0 + k, y, 1, h, mix(PAL.soil, PAL.frostDeep, rng.range(0.35, 0.75)));
    }
  }

  /* -------------------------------------------------------- the trail */
  const trail = mix(PAL.soil, PAL.barkMid, 0.30);
  for (let x = 0; x < W; x++) {
    const y = L.pathY + Math.sin(x * 0.02) * H * 0.006;
    const h = H * 0.014 + Math.sin(x * 0.05) * H * 0.003;
    rect(c, x, y, 1, h, trail);
    if (rng.chance(0.4)) px(c, x, y + rng.range(0, h), mix(trail, PAL.voidBlack, 0.55));
    if (rng.chance(0.07)) px(c, x, y, mix(PAL.frostDeep, trail, 0.55));
  }

  /* ------------------------------------------- planks laid over the mud */
  const planks = [];
  for (let i = 0; i < 7; i++) {
    const x = rng.range(L.vx(0.03), L.vx(0.95));
    const y = L.pathY + rng.range(-H * 0.004, H * 0.016);
    const w = rng.range(L.vh * 0.045, L.vh * 0.12);
    const h = Math.max(2, Math.round(H * 0.008));
    drawPlank(c, rng, x, y, w, h);
    planks.push({ x, y, w, h });
  }

  /* ------------------------------------------- rocks & frozen grass tufts */
  for (let i = 0; i < 22; i++) {
    const x = rng.range(L.vx(-0.02), L.vx(1.02));
    const y = rng.range(L.pathY + L.vh * 0.012, L.waterY - L.vh * 0.008);
    const w = rng.range(L.vh * 0.008, L.vh * 0.028);
    const h = w * rng.range(0.4, 0.75);
    const stone = mix(PAL.soil, PAL.frostShadow, rng.range(0.2, 0.5));
    for (let k = -w; k <= w; k++) {
      const t = k / w;
      vline(c, x + k, y - Math.sqrt(Math.max(0, 1 - t * t)) * h, y + h * 0.2, stone);
    }
    // snow settles on the stone's upper face
    for (let k = -w; k <= w; k++) {
      const t = k / w;
      if (t < 0.35 && rng.chance(0.55)) {
        px(c, x + k, y - Math.sqrt(Math.max(0, 1 - t * t)) * h, mix(PAL.frost, stone, 0.45));
      }
    }
  }
  for (let i = 0; i < 40; i++) {
    const x = rng.range(L.vx(-0.02), L.vx(1.02));
    const y = rng.range(L.groundY + L.vh * 0.03, L.waterY - L.vh * 0.01);
    const h = rng.range(L.vh * 0.008, L.vh * 0.026);
    const col = mix(PAL.soil, PAL.voidBlack, 0.35);
    for (let k = 0; k < rng.int(3, 6); k++) {
      const lean = rng.signed(h * 0.55);
      line(c, x + rng.signed(1.5), y, x + lean, y - h * rng.range(0.6, 1.1), col, 1);
      if (rng.chance(0.3)) px(c, x + lean, y - h, mix(PAL.frostDeep, col, 0.45));
    }
  }

  /* --------------------------------------- debris: stumps, logs, stakes */
  for (let i = 0; i < 9; i++) {
    drawStump(c, rng, rng.range(L.vx(0.02), L.vx(0.98)), rng.range(L.groundY + L.vh * 0.02, L.pathY - L.vh * 0.01), L.vh);
  }
  for (let i = 0; i < 5; i++) {
    drawFallenLog(c, rng, rng.range(L.vx(0.02), L.vx(0.9)), rng.range(L.pathY + L.vh * 0.02, L.waterY - L.vh * 0.012), L.vh);
  }

  /* --------------------------------------------------------- the bridge */
  const bridge = { x0: L.vx(0.55), x1: L.vx(0.90), y: L.waterY + L.vh * 0.045 };
  drawBridge(c, rng, bridge, L.vh, L);

  /* ---------------------------------------- baked reflections in the water */
  bakeReflections(c, rng, W, H, L);
  drawShrubs(c, rng, W, L, bankTop);

  /* ------------------------------------------------- mist over the stream */
  const mistRgb = hexToRgb(PAL.mistPale);
  shadeRegion(c, 0, Math.round(L.waterY - H * 0.03), W, Math.round(H * 0.08), (x, y) => {
    const v = n(x * 0.7, y * 4);
    const t = 1 - clamp(Math.abs(y - L.waterY) / (H * 0.04), 0, 1);
    const a = t * v * 150;
    return a < 4 ? null : [mistRgb[0], mistRgb[1], mistRgb[2], a];
  });

  /* ---------------------------------------------------------- the runner */
  const bodyH = Math.max(14, Math.round(H * 0.056));
  const runner = buildRunner(bodyH);
  const speed = bodyH * 1.28;                 // tuned so the feet do not slip
  const cycle = 0.55;
  const runY = L.pathY + H * 0.012;
  const span = W + bodyH * 6;

  return {
    canvas: s.canvas,
    over(ctx, t, ox, oy, shared) {
      const still = shared && shared.reducedMotion;
      const time = still ? 6 : t;

      drawRipples(ctx, time, ox, oy, W, H, L);
      drawLiveReflections(ctx, time, ox, oy, W, H, L, shared);

      /* ------------------------------------------------ villager + lantern */
      const travel = still ? span * 0.42 : ((time * speed) + span * 0.30) % span;
      const rx = ox - bodyH * 3 + travel;
      const ry = oy + runY;
      const frame = Math.floor((time / cycle) * runner.count);

      const lx = rx + runner.lantern.x - runner.frameW * 0.42;
      const ly = ry - (runner.frameH - Math.round((bodyH / 20) * 1.5)) + runner.lantern.y;
      const flicker = still ? 1 : 0.86 + Math.sin(time * 9.3) * 0.08 + Math.sin(time * 21.7) * 0.06;

      // pool of light on the ground, then the lantern's own halo
      glowEllipse(ctx, lx, ry + H * 0.004, bodyH * 3.6 * flicker, bodyH * 1.05, PAL.amber, 0.55);
      glowEllipse(ctx, lx, ry + H * 0.004, bodyH * 1.7, bodyH * 0.5, PAL.amberPale, 0.4);
      glow(ctx, lx, ly, bodyH * 2.3 * flicker, PAL.amber, 0.55);
      glow(ctx, lx, ly, bodyH * 0.8, PAL.amberPale, 0.8);

      runner.draw(ctx, rx, ry, frame);

      // sparks kicked up from the frozen ground
      if (!still) {
        for (let i = 0; i < 3; i++) {
          const a = time * 3 + i * 2.1;
          const sx = rx - (a % 1) * bodyH * 1.4;
          const sy = ry - Math.sin((a % 1) * Math.PI) * bodyH * 0.35;
          if ((Math.floor(a) + i) % 3 === 0) px(ctx, sx, sy, mix(PAL.amber, PAL.amberDeep, a % 1));
        }
      }

      // the lantern's warm light reaching the water surface below
      glowEllipse(ctx, lx, oy + L.waterY + H * 0.02, bodyH * 3, bodyH * 0.8, PAL.amberDeep, 0.35 * flicker);
    },
  };
}

/* --------------------------------------------------------------- water */

function drawWater(c, rng, W, H, L) {
  const top = Math.round(L.waterY);
  rect(c, 0, top, W, H - top, PAL.water);
  // depth gradient: the near water is blacker
  for (let y = top; y < H; y++) {
    const t = (y - top) / (H - top);
    const col = mix(mix(PAL.waterLit, PAL.voidBlack, 0.45), PAL.voidBlack, clamp(t * 1.15, 0, 1));
    hline(c, 0, W, y, col);
  }
  // horizontal scanline structure — the water is read entirely in bands
  for (let y = top; y < H; y += 2) {
    const t = (y - top) / (H - top);
    if (rng.chance(0.75)) {
      const len = rng.range(W * 0.04, W * 0.4);
      const x0 = rng.range(-20, W);
      hline(c, x0, x0 + len, y, mix(PAL.waterLit, PAL.water, 0.55 + t * 0.4));
    }
  }
  // ice shelf at the bank edge
  for (let x = 0; x < W; x++) {
    if (rng.chance(0.4)) px(c, x, top + rng.int(0, 1), mix(PAL.frostDeep, PAL.water, rng.range(0.45, 0.8)));
  }
}

/** Static mirror-image smears for the trunks standing over the stream. */
function bakeReflections(c, rng, W, H, L) {
  // mirrored trunk smears, positioned against the visible frame
  const top = Math.round(L.waterY);
  for (const x of [L.vx(0.035), L.vx(0.18), L.vx(0.30), L.vx(0.63), L.vx(0.875)]) {
    const w = Math.max(2, L.vw * 0.012);
    for (let y = top; y < H; y++) {
      const t = (y - top) / (H - top);
      if (rng.chance(0.55 - t * 0.35)) {
        const wob = Math.sin(y * 0.5) * w * 0.35;
        hline(c, x - w + wob, x + w + wob, y, mix(PAL.voidBlack, PAL.water, 0.45));
      }
    }
  }
}

/** Live horizontal ripple scanlines drifting across the surface. */
function drawRipples(c, t, ox, oy, W, H, L) {
  const top = oy + L.waterY;
  const bottom = oy + H;
  for (let y = Math.round(top); y < bottom; y += 3) {
    const d = (y - top) / Math.max(1, bottom - top);
    const drift = Math.sin(t * 0.8 + y * 0.35) * (6 + d * 22);
    const len = (W * 0.05) + Math.sin(t * 0.5 + y) * W * 0.03 + d * W * 0.08;
    const x0 = ox + ((y * 53) % W) + drift;
    c.fillStyle = rgba(PAL.frostDeep, 0.10 + d * 0.06);
    c.fillRect(Math.round(x0), y, Math.round(len), 1);
    c.fillRect(Math.round(x0 - W * 0.4), y, Math.round(len * 0.6), 1);
  }
}

/** Rune and lantern light smeared across the moving water. */
function drawLiveReflections(c, t, ox, oy, W, H, L, shared) {
  const top = oy + L.waterY;
  const depth = H - L.waterY;
  const cols = (shared && shared.runeColumns) || [];
  const sx = (shared && shared.sentinelOx) || ox;

  for (const col of cols) {
    const breath = 0.55 + Math.sin(t * 0.72 + col.phase) * 0.28;
    const k = clamp(breath, 0.1, 1);
    const x = sx + col.x;
    for (let y = Math.round(top); y < oy + H; y += 2) {
      const d = (y - top) / depth;
      const wob = Math.sin(t * 1.4 + y * 0.42) * (2 + d * 9);
      const w = 1 + d * 4;
      c.fillStyle = rgba(PAL.crimson, (0.38 - d * 0.26) * k);
      c.fillRect(Math.round(x - w + wob), y, Math.round(w * 2), 1);
    }
    glowEllipse(c, x, top + depth * 0.25, W * 0.02, depth * 0.3, PAL.crimsonDim, 0.18 * k);
  }
}

/* ------------------------------------------------------------ undergrowth */

/**
 * Snow-laden scrub along the bank.
 *
 * Each bush is a cluster of squat conifers rather than a smooth mound — the
 * broken, spiky silhouette with frost on the upper needles is what the
 * reference undergrowth actually is.
 */
function drawShrubs(c, rng, W, L, bankTop) {
  const clamp01 = (x) => Math.max(0, Math.min(W - 1, Math.round(x)));
  const count = Math.round(L.vw / 19);

  for (let i = 0; i < count; i++) {
    const x = rng.range(L.vx(-0.03), L.vx(1.03));
    const near = rng();
    const y = lerp(bankTop[clamp01(x)] + L.vh * 0.015, L.waterY - L.vh * 0.025, near * near);
    const size = L.vh * rng.range(0.035, 0.075) * (0.55 + near * 0.85);
    // nearer scrub is blacker; distant scrub lifts slightly into the mist
    const dark = mix(PAL.moss, PAL.voidBlack, 0.72 - near * 0.12);
    const snow = mix(PAL.frost, dark, 0.35 + near * 0.15);

    const tufts = rng.int(2, 4);
    for (let k = 0; k < tufts; k++) {
      drawPine(c, {
        x: x + rng.signed(size * 0.85),
        baseY: y + rng.signed(size * 0.16),
        height: size * rng.range(0.7, 1.35),
        halfWidth: size * rng.range(0.34, 0.6),
        color: dark,
        snowColor: snow,
        snowAmount: rng.range(0.22, 0.44),
        rng,
        trunk: false,
        tierCount: rng.int(2, 3),
      });
    }
  }
}

/* ------------------------------------------------------------- props */

function drawPlank(c, rng, x, y, w, h) {
  const wood = mix(PAL.barkMid, PAL.soil, 0.35);
  rect(c, x, y, w, h, wood);
  hline(c, x, x + w, y, mix(wood, PAL.frostDeep, 0.35));
  hline(c, x, x + w, y + h - 1, shade(wood, -0.45));
  for (let i = 0; i < w * 0.3; i++) {
    const gx = x + rng.range(0, w);
    vline(c, gx, y + 1, y + h - 2, shade(wood, rng.chance(0.5) ? -0.25 : 0.15));
  }
}

function drawStump(c, rng, x, y, H) {
  const h = rng.range(H * 0.012, H * 0.038);
  const w = rng.range(H * 0.008, H * 0.022);
  const col = mix(PAL.bark, PAL.voidBlack, 0.35);
  rect(c, x - w / 2, y - h, w, h, col);
  // jagged broken top
  for (let i = 0; i < w; i++) {
    const d = rng.range(0, h * 0.3);
    vline(c, x - w / 2 + i, y - h, y - h + d, 'rgba(0,0,0,0)');
    px(c, x - w / 2 + i, y - h + d, mix(PAL.frostDeep, col, 0.5));
  }
  vline(c, x - w / 2, y - h, y, shade(col, 0.25));
}

function drawFallenLog(c, rng, x, y, H) {
  const len = rng.range(H * 0.05, H * 0.16);
  const th = Math.max(2, Math.round(H * 0.011));
  const tilt = rng.signed(H * 0.012);
  const col = mix(PAL.bark, PAL.voidBlack, 0.25);
  for (let i = 0; i < len; i++) {
    const yy = y + (i / len) * tilt;
    rect(c, x + i, yy, 1, th, col);
    if (rng.chance(0.28)) px(c, x + i, yy, mix(PAL.frost, col, rng.range(0.55, 0.85)));
    if (rng.chance(0.2)) px(c, x + i, yy + th - 1, shade(col, -0.4));
  }
  // stub branches
  for (let i = 0; i < 3; i++) {
    const bx = x + rng.range(0, len);
    line(c, bx, y, bx + rng.signed(H * 0.02), y - rng.range(H * 0.01, H * 0.03), col, 1);
  }
}

/** A rickety plank bridge on log piers, crossing the stream. */
function drawBridge(c, rng, b, H, L) {
  const wood = mix(PAL.barkMid, PAL.soil, 0.25);
  const woodDark = shade(wood, -0.5);
  const deckH = Math.max(3, Math.round(H * 0.016));
  const span = b.x1 - b.x0;

  // piers driven into the water
  for (let i = 0; i <= 4; i++) {
    const x = b.x0 + (span * i) / 4;
    const sag = Math.sin((i / 4) * Math.PI) * H * 0.008;
    rect(c, x, b.y + sag, Math.max(2, Math.round(H * 0.010)), H * 0.06, woodDark);
    // cross brace
    line(c, x, b.y + sag + H * 0.01, x + span * 0.1, b.y + H * 0.035, woodDark, 1);
  }

  // deck: individual planks with gaps, sagging in the middle
  for (let x = 0; x < span; x++) {
    const t = x / span;
    const sag = Math.sin(t * Math.PI) * H * 0.012;
    const y = b.y + sag;
    if (Math.round(x) % 7 === 6) continue;              // gap between boards
    rect(c, b.x0 + x, y, 1, deckH, wood);
    if (rng.chance(0.3)) px(c, b.x0 + x, y, mix(PAL.frost, wood, rng.range(0.5, 0.8)));
    px(c, b.x0 + x, y + deckH - 1, woodDark);
  }

  // handrail, missing a few uprights
  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    if (rng.chance(0.2)) continue;
    const x = b.x0 + span * t;
    const sag = Math.sin(t * Math.PI) * H * 0.012;
    vline(c, x, b.y + sag - H * 0.028, b.y + sag, woodDark);
  }
  for (let x = 0; x < span; x++) {
    const t = x / span;
    const sag = Math.sin(t * Math.PI) * H * 0.012;
    if (rng.chance(0.85)) px(c, b.x0 + x, b.y + sag - H * 0.028, wood);
  }
}
