/**
 * LAYER 5 — Foreground framing & totems.  Parallax 1.0
 *
 * The darkest mass in the frame: twisted roots along the bottom edge,
 * frost-tipped boughs hanging in from above, snow-caked scrub and the
 * occasional near-black trunk sweeping past. Moving at full parallax factor,
 * this is what sells the depth — and at walking pace it is what makes the
 * travel feel fast.
 */
import { makeRng } from '../lib/rng.js';
import {
  surface, rect, hline, vline, px, line, fillPoly, wrapX,
  mix, shade, lerp, glow,
} from '../lib/paint.js';
import { PAL } from '../palette.js';
import { drawBough, drawPine } from './trees.js';

const FG = PAL.voidBlack;
const TAU = Math.PI * 2;

export function buildForeground(L, seed) {
  const { W, H, sw } = L;
  const rng = makeRng(seed);
  const s = surface(W, H);
  const c = s.ctx;

  /* -------------------------------------- boughs hanging in from above */
  for (const b of [
    { t: 0.02, y: -0.03, len: 0.30, dir: 1, droop: 0.42, th: 5, frost: 0.55 },
    { t: 0.07, y: 0.12, len: 0.20, dir: 1, droop: 0.55, th: 3, frost: 0.42 },
    { t: 0.46, y: -0.05, len: 0.13, dir: -1, droop: 0.9, th: 3, frost: 0.30 },
    { t: 0.55, y: -0.04, len: 0.27, dir: 1, droop: 0.40, th: 5, frost: 0.50 },
    { t: 0.78, y: 0.16, len: 0.17, dir: -1, droop: 0.5, th: 3, frost: 0.38 },
    { t: 0.90, y: -0.03, len: 0.26, dir: -1, droop: 0.44, th: 5, frost: 0.5 },
  ]) {
    const sd = Math.floor(rng() * 0xffffff);
    wrapX(W, L.tx(b.t), sw * (b.len + 0.06), (x) => {
      drawBough(c, {
        x, y: L.vy(b.y), length: sw * b.len, dir: b.dir, droop: b.droop,
        rng: makeRng(sd), color: FG, frost: PAL.frost,
        frostAmount: b.frost, thickness: b.th,
      });
    });
  }

  /* ------------------------------ near-black trunks sweeping past camera */
  // Sparse and slim on purpose: at this depth a wide slab blanks the frame.
  for (const t of [0.21, 0.74]) {
    const hw = sw * rng.range(0.009, 0.019);
    const sd = Math.floor(rng() * 0xffffff);
    wrapX(W, L.tx(t), hw * 3, (x) => {
      const r = makeRng(sd);
      for (let y = 0; y < H; y++) {
        const w = hw * (0.85 + 0.15 * (y / H)) + Math.sin(y * 0.02) * hw * 0.12;
        hline(c, x - w, x + w, y, FG);
      }
      // frost catching one edge of the bark
      for (let y = 0; y < H; y++) {
        if (!r.chance(0.10)) continue;
        const w = hw * (0.85 + 0.15 * (y / H)) + Math.sin(y * 0.02) * hw * 0.12;
        px(c, x - w + 1, y, mix(PAL.frostDeep, FG, r.range(0.25, 0.75)));
      }
    });
  }

  /* ---------------------------------------------- tangled roots & deadfall */
  // a periodic contour: the deadfall banks and dips as the ground rolls past
  const rootline = (x) => {
    const u = (x / W) * TAU;
    return L.vy(0.945)
      + Math.sin(u * 2) * L.vh * 0.045
      + Math.sin(u * 5 + 1.1) * L.vh * 0.018
      + Math.sin(u * 13) * L.vh * 0.006;
  };

  for (let x = 0; x < W; x += rng.range(5, 14)) {
    const h = rng.range(L.vh * 0.045, L.vh * 0.14);
    const sd = Math.floor(rng() * 0xffffff);
    const baseY = rootline(x) + L.vh * 0.05;
    wrapX(W, x, L.vh * 0.2, (sx) => drawRoot(c, makeRng(sd), sx, baseY, h, H));
  }
  for (let x = 0; x < W; x++) vline(c, x, rootline(x), H, FG);

  // broken branch spars lying across the deadfall
  for (let i = 0; i < Math.round(W / 60); i++) {
    const x = rng.range(0, W);
    const y = rootline(x) + rng.range(-L.vh * 0.045, L.vh * 0.03);
    const len = rng.range(sw * 0.03, sw * 0.12);
    const tilt = rng.signed(L.vh * 0.03);
    const sd = Math.floor(rng() * 0xffffff);
    wrapX(W, x, len + 6, (sx) => {
      const r = makeRng(sd);
      line(c, sx, y, sx + len, y + tilt, FG, Math.max(2, Math.round(L.vh * 0.008)));
      for (let k = 0; k < len; k += 2) {
        if (r.chance(0.3)) {
          px(c, sx + k, y + (k / len) * tilt - Math.round(L.vh * 0.004), mix(PAL.frostDeep, FG, 0.45));
        }
      }
    });
  }

  /* ------------------------------- snow-caked scrub banked along the edge */
  for (let i = 0; i < Math.round(W / 42); i++) {
    const x = rng.range(0, W);
    const size = L.vh * rng.range(0.05, 0.1);
    const baseY = rootline(x) + rng.range(-L.vh * 0.01, L.vh * 0.04);
    const sd = Math.floor(rng() * 0xffffff);
    wrapX(W, x, size * 4, (sx) => {
      const r = makeRng(sd);
      for (let k = 0; k < 3; k++) {
        drawPine(c, {
          x: sx + r.signed(size * 1.1),
          baseY: baseY + r.signed(size * 0.2),
          height: size * r.range(0.8, 1.5),
          halfWidth: size * r.range(0.45, 0.8),
          color: FG, snowColor: PAL.frost, snowAmount: r.range(0.3, 0.5),
          rng: r, trunk: false, tierCount: r.int(2, 4),
        });
      }
    });
  }

  /* ------------------------------------------------ the antler skull totem */
  const totems = [];
  for (const t of [0.34, 0.86]) {
    const sd = Math.floor(rng() * 0xffffff);
    wrapX(W, L.tx(t), L.vh * 0.2, (x) => {
      // stake it into the deadfall, not into thin air
      totems.push(drawTotem(c, makeRng(sd), x, rootline(x) + L.vh * 0.02, L.vh));
    });
  }

  return {
    canvas: s.canvas,
    over(ctx, t, ox, oy, shared) {
      const still = shared && shared.reducedMotion;
      // the totems' eye sockets catch a slow ember of the ritual light
      const k = still ? 0.5 : 0.45 + Math.sin(t * 0.55 + 1.2) * 0.3;
      for (const m of totems) {
        if (ox + m.x < -m.r * 4 || ox + m.x > 2000) continue;
        glow(ctx, ox + m.x, oy + m.y, m.r * 3.2, PAL.crimsonDim, 0.12 + k * 0.16);
        px(ctx, ox + m.eyeL[0], oy + m.eyeL[1], mix(PAL.crimsonDeep, PAL.crimson, k));
        px(ctx, ox + m.eyeR[0], oy + m.eyeR[1], mix(PAL.crimsonDeep, PAL.crimson, k));
      }
    },
  };
}

/** One gnarled root arcing up out of the bottom edge. */
function drawRoot(c, rng, x, baseY, h, H) {
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
    if (rng.chance(0.72)) {
      const steps = Math.round(len);
      for (let k = 0; k < steps; k++) {
        if (rng.chance(0.3)) {
          px(c, lerp(cx, nx, k / steps), lerp(cy, ny, k / steps) - th / 2,
            mix(PAL.frostDeep, FG, rng.range(0.05, 0.5)));
        }
      }
    }
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
 * value allowed this close to the camera, and it stays dim so it never
 * outshines the runes or the lantern.
 */
function drawTotem(c, rng, x, groundY, vh) {
  const bone = shade(mix(PAL.frostMid, '#b3ab97', 0.5), -0.56);
  const boneDark = shade(bone, -0.5);
  const boneShadow = shade(bone, -0.78);
  const stakeTop = groundY - vh * 0.26;

  const sw2 = Math.max(2, Math.round(vh * 0.012));
  rect(c, x - sw2 / 2, stakeTop, sw2, vh * 0.34, mix(PAL.bark, FG, 0.55));
  vline(c, x - sw2 / 2, stakeTop, groundY + vh * 0.04, mix(PAL.bark, FG, 0.25));
  for (let i = 0; i < 3; i++) {
    hline(c, x - sw2, x + sw2, stakeTop + vh * 0.03 + i * vh * 0.012, mix(PAL.barkMid, FG, 0.3));
  }

  const skullY = stakeTop - vh * 0.012;
  const sh = vh * 0.033;
  const swd = vh * 0.021;

  fillPoly(c, [
    [x - swd * 0.5, skullY], [x + swd * 0.5, skullY],
    [x + swd * 0.42, skullY + sh * 0.5], [x + swd * 0.22, skullY + sh],
    [x - swd * 0.22, skullY + sh], [x - swd * 0.42, skullY + sh * 0.5],
  ], bone);
  fillPoly(c, [
    [x + swd * 0.12, skullY], [x + swd * 0.5, skullY],
    [x + swd * 0.42, skullY + sh * 0.5], [x + swd * 0.22, skullY + sh],
    [x + swd * 0.05, skullY + sh],
  ], mix(bone, boneDark, 0.55));

  const eyeY = skullY + sh * 0.34;
  const ex = swd * 0.24;
  rect(c, x - ex - 1, eyeY, Math.max(2, swd * 0.20), Math.max(2, sh * 0.16), boneShadow);
  rect(c, x + ex - swd * 0.2 + 1, eyeY, Math.max(2, swd * 0.20), Math.max(2, sh * 0.16), boneShadow);
  rect(c, x - 1, skullY + sh * 0.62, 2, Math.max(2, sh * 0.2), boneShadow);
  hline(c, x - swd * 0.22, x + swd * 0.22, skullY + sh * 0.86, boneDark);
  hline(c, x - swd * 0.45, x + swd * 0.1, skullY + 1, mix(bone, PAL.frost, 0.15));

  antler(c, rng, x - swd * 0.38, skullY + 1, -1, vh * 0.038, bone, boneDark, 3);
  antler(c, rng, x + swd * 0.38, skullY + 1, 1, vh * 0.038, bone, boneDark, 3);

  return {
    x, y: eyeY, r: Math.max(6, swd),
    eyeL: [x - ex, eyeY + 1],
    eyeR: [x + ex - swd * 0.2 + 2, eyeY + 1],
  };
}

function antler(c, rng, x, y, dir, len, bone, boneDark, depth) {
  if (depth <= 0 || len < 2) return;
  const ex = x + dir * len * rng.range(0.45, 0.85);
  const ey = y - len * rng.range(0.6, 0.95);
  const th = Math.max(1, Math.round(depth * 0.55));
  line(c, x, y, ex, ey, depth > 2 ? mix(bone, boneDark, 0.55) : mix(bone, boneDark, 0.8), th);
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
