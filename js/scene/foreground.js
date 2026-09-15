/**
 * LAYER 5 — Foreground framing & totems.  Parallax 1.0
 *
 * The darkest mass in the frame: twisted roots along the bottom edge,
 * frost-tipped boughs pushing in from the top corners, and a weathered antler
 * skull staked on the right. Moving at full parallax factor, this is what
 * sells the depth.
 */
import { makeRng } from '../lib/rng.js';
import { surface, rect, hline, vline, px, line, fillPoly, mix, shade, lerp, glow } from '../lib/paint.js';
import { PAL } from '../palette.js';
import { drawBough, drawPine } from './trees.js';

const FG = PAL.voidBlack;

export function buildForeground(W, H, L, seed) {
  const rng = makeRng(seed);
  const s = surface(W, H);
  const c = s.ctx;

  /* -------------------------------------- boughs reaching in from the top */
  drawBough(c, {
    x: L.vx(-0.04), y: L.vy(-0.03), length: L.vw * 0.30, dir: 1, droop: 0.42,
    rng, color: FG, frost: PAL.frost, frostAmount: 0.55, thickness: 5,
  });
  drawBough(c, {
    x: L.vx(0.0), y: L.vy(0.12), length: L.vw * 0.20, dir: 1, droop: 0.55,
    rng, color: FG, frost: PAL.frost, frostAmount: 0.42, thickness: 3,
  });
  drawBough(c, {
    x: L.vx(1.04), y: L.vy(-0.04), length: L.vw * 0.27, dir: -1, droop: 0.40,
    rng, color: FG, frost: PAL.frost, frostAmount: 0.50, thickness: 5,
  });
  drawBough(c, {
    x: L.vx(1.0), y: L.vy(0.17), length: L.vw * 0.17, dir: -1, droop: 0.5,
    rng, color: FG, frost: PAL.frost, frostAmount: 0.38, thickness: 3,
  });
  drawBough(c, {
    x: L.vx(0.44), y: L.vy(-0.05), length: L.vw * 0.13, dir: -1, droop: 0.9,
    rng, color: FG, frost: PAL.frost, frostAmount: 0.3, thickness: 3,
  });

  /* ------------------------------------------- hard silhouette side walls */
  const wallL = (y) => L.vx(0.045 * (0.6 + Math.sin(y * 0.014) * 0.4 + Math.sin(y * 0.061) * 0.12));
  const wallR = (y) => L.vx(1 - 0.05 * (0.6 + Math.cos(y * 0.011) * 0.4 + Math.sin(y * 0.047) * 0.1));
  for (let y = 0; y < H; y++) {
    hline(c, -1, wallL(y), y, FG);
    hline(c, wallR(y), W + 1, y, FG);
  }
  // frost catching the inner edge of the side walls
  for (let y = 0; y < H; y += 1) {
    if (rng.chance(0.10)) px(c, wallL(y), y, mix(PAL.frostDeep, FG, rng.range(0.2, 0.7)));
    if (rng.chance(0.10)) px(c, wallR(y), y, mix(PAL.frostDeep, FG, rng.range(0.2, 0.7)));
  }

  /* ---------------------------------------------- tangled roots & deadfall */
  // The deadfall banks up at the corners and dips through the middle, so the
  // stream and the bridge stay visible between the roots.
  const rootline = (x) => {
    const t = (x - L.mx) / L.vw;                       // 0..1 across the frame
    const left = Math.max(0, 1 - t / 0.30);
    const right = Math.max(0, (t - 0.72) / 0.28);
    const edge = Math.max(left * left, right * right);
    return L.vy(0.955 - 0.165 * edge)
      + Math.sin(x * 0.035) * L.vh * 0.012
      + Math.sin(x * 0.11) * L.vh * 0.005;
  };

  for (let x = -10; x < W + 10; x += rng.range(5, 14)) {
    const t = (x - L.mx) / L.vw;
    const edge = Math.max(0, 1 - t / 0.28) + Math.max(0, (t - 0.74) / 0.26);
    const h = rng.range(L.vh * 0.045, L.vh * 0.10) + edge * L.vh * 0.10;
    drawRoot(c, rng, x, rootline(x) + L.vh * 0.05, h, W, H);
  }
  // solid black mass below the root line
  for (let x = 0; x < W; x++) {
    vline(c, x, rootline(x), H, FG);
  }
  // broken branch spars lying across the very bottom
  for (let i = 0; i < 16; i++) {
    const x = rng.range(-W * 0.02, W);
    const y = rootline(x) + rng.range(-L.vh * 0.045, L.vh * 0.03);
    const len = rng.range(W * 0.03, W * 0.12);
    const tilt = rng.signed(H * 0.03);
    line(c, x, y, x + len, y + tilt, FG, Math.max(2, Math.round(H * 0.008)));
    if (rng.chance(0.6)) {
      for (let k = 0; k < len; k += 2) {
        if (rng.chance(0.3)) px(c, x + k, y + (k / len) * tilt - Math.round(H * 0.004), mix(PAL.frostDeep, FG, 0.45));
      }
    }
  }

  /* ---------------------------------- snow-laden foreground pine, far left */
  drawPine(c, {
    x: L.vx(0.005), baseY: L.vy(1.05), height: L.vh * 0.68, halfWidth: L.vw * 0.075,
    color: FG, snowColor: PAL.frost, snowAmount: 0.30, rng, trunk: false,
  });
  drawPine(c, {
    x: L.vx(0.995), baseY: L.vy(1.06), height: L.vh * 0.56, halfWidth: L.vw * 0.065,
    color: FG, snowColor: PAL.frost, snowAmount: 0.26, rng, trunk: false,
  });

  /* ------------------------------- snow-caked scrub banked in the corners */
  for (const spot of [
    { t: 0.045, y: 0.965, s: 1.15 }, { t: 0.14, y: 0.995, s: 0.9 },
    { t: 0.30, y: 1.01, s: 0.75 }, { t: 0.62, y: 1.015, s: 0.7 },
    { t: 0.80, y: 0.985, s: 0.95 }, { t: 0.95, y: 0.955, s: 1.1 },
  ]) {
    const size = L.vh * 0.075 * spot.s;
    for (let k = 0; k < 3; k++) {
      drawPine(c, {
        x: L.vx(spot.t) + rng.signed(size * 1.1),
        baseY: L.vy(spot.y) + rng.signed(size * 0.2),
        height: size * rng.range(0.8, 1.5),
        halfWidth: size * rng.range(0.45, 0.8),
        color: FG,
        snowColor: PAL.frost,
        snowAmount: rng.range(0.3, 0.5),
        rng,
        trunk: false,
        tierCount: rng.int(2, 4),
      });
    }
  }

  /* ------------------------------------------------ the antler skull totem */
  const totem = drawTotem(c, rng, L.vx(0.962), L.vy(0.83), L.vh);

  return {
    canvas: s.canvas,
    over(ctx, t, ox, oy, shared) {
      const still = shared && shared.reducedMotion;
      // the totem's eye sockets catch a faint, slow ember of the ritual light
      const k = still ? 0.5 : 0.45 + Math.sin(t * 0.55 + 1.2) * 0.3;
      glow(ctx, ox + totem.x, oy + totem.y, totem.r * 3.2, PAL.crimsonDim, 0.12 + k * 0.16);
      px(ctx, ox + totem.eyeL[0], oy + totem.eyeL[1], mix(PAL.crimsonDeep, PAL.crimson, k));
      px(ctx, ox + totem.eyeR[0], oy + totem.eyeR[1], mix(PAL.crimsonDeep, PAL.crimson, k));
    },
  };
}

/** One gnarled root arcing up out of the bottom edge. */
function drawRoot(c, rng, x, baseY, h, W, H) {
  let cx = x;
  let cy = baseY;
  const segs = rng.int(3, 6);
  let dir = rng.signed(1);
  let th = Math.max(2, Math.round(H * 0.012));
  for (let i = 0; i < segs; i++) {
    const len = (h / segs) * rng.range(0.7, 1.4);
    const nx = cx + dir * len * rng.range(0.3, 0.9);
    const ny = cy - len;
    line(c, cx, cy, nx, ny, FG, th);
    // frost on the upper surface of the root
    if (rng.chance(0.72)) {
      const steps = Math.round(len);
      for (let k = 0; k < steps; k++) {
        if (rng.chance(0.3)) {
          px(c, lerp(cx, nx, k / steps), lerp(cy, ny, k / steps) - th / 2,
            mix(PAL.frostDeep, FG, rng.range(0.05, 0.5)));
        }
      }
    }
    // occasional fork
    if (rng.chance(0.45)) {
      line(c, nx, ny, nx - dir * len * rng.range(0.4, 1.1), ny - len * rng.range(0.2, 0.6),
        FG, Math.max(1, th - 1));
    }
    cx = nx;
    cy = ny;
    dir = rng.chance(0.4) ? -dir : dir;
    th = Math.max(1, th - 1);
  }
}

/**
 * A weathered antlered skull lashed to a stake — bone is the only warm-neutral
 * value allowed this close to the camera.
 */
function drawTotem(c, rng, x, groundY, H) {
  // weathered, not white — it must not outshine the runes or the lantern
  const bone = shade(mix(PAL.frostMid, '#b3ab97', 0.5), -0.34);
  const boneDark = shade(bone, -0.5);
  const boneShadow = shade(bone, -0.78);
  const stakeTop = groundY - H * 0.30;

  // the stake
  const sw = Math.max(2, Math.round(H * 0.012));
  rect(c, x - sw / 2, stakeTop, sw, H * 0.34, mix(PAL.bark, FG, 0.55));
  vline(c, x - sw / 2, stakeTop, groundY + H * 0.04, mix(PAL.bark, FG, 0.25));
  // lashings
  for (let i = 0; i < 3; i++) {
    const y = stakeTop + H * 0.03 + i * H * 0.012;
    hline(c, x - sw, x + sw, y, mix(PAL.barkMid, FG, 0.3));
  }

  const skullY = stakeTop - H * 0.015;
  const sh = H * 0.042;
  const swd = H * 0.027;

  // cranium + muzzle
  fillPoly(c, [
    [x - swd * 0.5, skullY],
    [x + swd * 0.5, skullY],
    [x + swd * 0.42, skullY + sh * 0.5],
    [x + swd * 0.22, skullY + sh],
    [x - swd * 0.22, skullY + sh],
    [x - swd * 0.42, skullY + sh * 0.5],
  ], bone);
  // shaded right side
  fillPoly(c, [
    [x + swd * 0.12, skullY],
    [x + swd * 0.5, skullY],
    [x + swd * 0.42, skullY + sh * 0.5],
    [x + swd * 0.22, skullY + sh],
    [x + swd * 0.05, skullY + sh],
  ], mix(bone, boneDark, 0.55));

  // eye sockets
  const eyeY = skullY + sh * 0.34;
  const ex = swd * 0.24;
  rect(c, x - ex - 1, eyeY, Math.max(2, swd * 0.20), Math.max(2, sh * 0.16), boneShadow);
  rect(c, x + ex - swd * 0.2 + 1, eyeY, Math.max(2, swd * 0.20), Math.max(2, sh * 0.16), boneShadow);
  // nasal cavity + jaw line
  rect(c, x - 1, skullY + sh * 0.62, 2, Math.max(2, sh * 0.2), boneShadow);
  hline(c, x - swd * 0.22, x + swd * 0.22, skullY + sh * 0.86, boneDark);
  // highlight along the brow
  hline(c, x - swd * 0.45, x + swd * 0.1, skullY + 1, mix(bone, PAL.frost, 0.3));

  // antlers
  antler(c, rng, x - swd * 0.38, skullY + 1, -1, H * 0.055, bone, boneDark, 3);
  antler(c, rng, x + swd * 0.38, skullY + 1, 1, H * 0.055, bone, boneDark, 3);

  return {
    x,
    y: eyeY,
    r: Math.max(6, swd),
    eyeL: [x - ex, eyeY + 1],
    eyeR: [x + ex - swd * 0.2 + 2, eyeY + 1],
  };
}

function antler(c, rng, x, y, dir, len, bone, boneDark, depth) {
  if (depth <= 0 || len < 2) return;
  const ex = x + dir * len * rng.range(0.45, 0.85);
  const ey = y - len * rng.range(0.6, 0.95);
  const th = Math.max(1, Math.round(depth * 0.55));
  line(c, x, y, ex, ey, depth > 2 ? mix(bone, boneDark, 0.25) : mix(bone, boneDark, 0.55), th);
  if (th > 1) line(c, x, y + 1, ex, ey + 1, boneDark, 1);
  if (rng.chance(0.8)) {
    const t = rng.range(0.3, 0.8);
    const bx = lerp(x, ex, t);
    const by = lerp(y, ey, t);
    line(c, bx, by, bx + dir * len * rng.range(0.1, 0.4), by - len * rng.range(0.4, 0.8),
      mix(bone, boneDark, 0.2), Math.max(1, th - 1));
  }
  antler(c, rng, ex, ey, dir, len * rng.range(0.55, 0.75), bone, boneDark, depth - 1);
}
