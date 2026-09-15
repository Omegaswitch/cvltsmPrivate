/**
 * The pursuit.
 *
 * Whatever the wood has sent after him, strung out along the road behind. The
 * traveller holds the middle of the frame, so "behind" is screen-left: the
 * pack occupies the road from the left edge up to his heels, surging closer
 * and falling back but never quite catching him.
 *
 * They are drawn after the road and before the traveller, so he stays clearly
 * in front, and before the fog, which drifts across them and keeps the
 * furthest ones ambiguous.
 */
import { makeRng } from '../lib/rng.js';
import { rect, px, line, fillPoly, disc, mix, glow, glowEllipse } from '../lib/paint.js';
import { PAL } from '../palette.js';

const TAU = Math.PI * 2;

/** One step lighter than the void, so they read as shapes and not holes. */
const FLESH = mix(PAL.voidBlack, PAL.mist, 0.10);
const ROBE = mix(PAL.voidBlack, PAL.mist, 0.05);

export function buildPursuers(vh, seed) {
  const rng = makeRng(seed);
  const bodyH = Math.max(14, Math.round(vh * 0.056));

  // strung out down the road: fraction of the viewport width, behind him
  const specs = [
    { type: 'cultist', f: 0.44, torch: true },
    { type: 'loper', f: 0.375 },
    { type: 'hunched', f: 0.315 },
    { type: 'cultist', f: 0.25, torch: true },
    { type: 'tall', f: 0.185 },
    { type: 'loper', f: 0.115 },
    { type: 'cultist', f: 0.04, torch: true },
  ];

  const pack = specs.map((sp) => ({
    ...sp,
    scale: rng.range(0.82, 1.05),
    lift: rng.range(0, vh * 0.016),
    phase: rng.range(0, TAU),
    gaitRate: rng.range(7.5, 11.5),
    surgeAmp: rng.range(0.010, 0.032),
    surgeRate: rng.range(0.22, 0.55),
    flick: rng.range(0.6, 1.4),
  }));

  // furthest back first, so the nearer ones overlap them correctly
  pack.sort((a, b) => b.lift - a.lift);

  return {
    draw(ctx, t, vw, groundY, still) {
      const time = still ? 1.1 : t;

      // Where each of them is this frame.
      const poses = pack.map((p) => {
        const surge = Math.sin(time * p.surgeRate + p.phase) * p.surgeAmp;
        return {
          p,
          x: Math.round(vw * (p.f + surge)),
          y: Math.round(groundY - p.lift),
          h: bodyH * p.scale,
          gait: time * p.gaitRate + p.phase,
          flick: time * 9 * p.flick + p.phase,
        };
      });

      // 1. the pack lights its own stretch of road. Without this they are
      //    black shapes on black ground and read as nothing at all.
      for (const o of poses) {
        if (!o.p.torch) continue;
        const f = Math.sin(o.flick) * 0.3 + 0.8;
        glowEllipse(ctx, o.x + o.h * 0.2, o.y, o.h * 2.9 * f, o.h * 0.85, PAL.amberDeep, 0.5);
        glowEllipse(ctx, o.x + o.h * 0.2, o.y, o.h * 1.3, o.h * 0.4, PAL.amber, 0.3);
      }

      // 2. the figures, silhouetted against it
      for (const o of poses) {
        if (o.p.type === 'cultist') drawCultistRunner(ctx, o.x, o.y, o.h, o.gait);
        else if (o.p.type === 'loper') drawLoper(ctx, o.x, o.y, o.h, o.gait);
        else if (o.p.type === 'tall') drawTall(ctx, o.x, o.y, o.h, o.gait);
        else drawHunched(ctx, o.x, o.y, o.h, o.gait);
      }

      // 3. the flames themselves, over everything they light
      for (const o of poses) {
        if (!o.p.torch) continue;
        const u = o.h / 20;
        torch(ctx, o.x + u * 5.4, o.y - u * 16.6, o.h, o.flick);
      }
    },
  };
}

/* ------------------------------------------------------ robed, running */

function drawCultistRunner(c, x, y, h, gait) {
  const u = h / 20;
  const bob = Math.sin(gait * 2) * u * 0.7;
  const hipY = y - u * 8 + bob;
  const shoulderY = y - u * 15 + bob;
  const lean = u * 1.1;

  leg(c, x, hipY, u, gait, ROBE);
  leg(c, x, hipY, u, gait + Math.PI, mix(ROBE, PAL.voidBlack, 0.5));

  // robe, whipping behind
  const flap = Math.sin(gait * 2 + 0.6);
  fillPoly(c, [
    [x - u * 1.4, shoulderY + u],
    [x - u * 5.6 - flap * u * 1.7, shoulderY + u * 4],
    [x - u * 5.2, hipY + u * 4],
    [x + u * 2.6, hipY + u * 3],
    [x + u * 2 + lean, shoulderY],
  ], ROBE);

  // hood
  fillPoly(c, [
    [x - u * 1.2 + lean, shoulderY - u * 0.6],
    [x + u * 1.6 + lean, shoulderY - u * 1],
    [x + u * 1.2 + lean, shoulderY + u * 2],
    [x - u * 1.4 + lean, shoulderY + u * 2],
  ], ROBE);
  disc(c, x + u * 0.3 + lean, shoulderY - u * 1.4, u * 1.7, ROBE);

  // reaching arm
  const reach = Math.sin(gait) * u * 1.4;
  line(c, x + u * 1.2 + lean, shoulderY + u * 1.4,
    x + u * 4.4 + reach, shoulderY + u * 0.6, ROBE, Math.max(1, Math.round(u * 1.2)));

  // torch haft, held high; the flame is painted in a later pass
  line(c, x + u * 4.4 + reach, shoulderY + u * 0.6, x + u * 5.4, shoulderY - u * 1.6,
    mix(PAL.voidBlack, PAL.bark, 0.45), 1);
}

/* -------------------------------------------- deformed: the low gallop */

function drawLoper(c, x, y, h, gait) {
  const u = h / 20;
  const bound = Math.sin(gait) * u * 1.3;
  const spineY = y - u * 7 + bound;

  // long limbs reaching ahead, knuckling the ground
  for (const off of [0, Math.PI]) {
    const swing = Math.sin(gait + off);
    const handX = x + u * 5.5 + swing * u * 3.4;
    line(c, x + u * 2.4, spineY + u * 0.5, handX, y - u * 0.4, FLESH, Math.max(1, Math.round(u)));
    rect(c, handX - u * 0.6, y - u * 0.6, u * 1.6, u * 0.8, FLESH);
  }
  // haunches
  for (const off of [0.6, Math.PI + 0.6]) {
    const swing = Math.sin(gait + off);
    const footX = x - u * 3.6 + swing * u * 2.6;
    line(c, x - u * 2, spineY + u, x - u * 3.4, spineY + u * 3.4, FLESH, Math.max(1, Math.round(u * 1.3)));
    line(c, x - u * 3.4, spineY + u * 3.4, footX, y, FLESH, Math.max(1, Math.round(u)));
  }

  // arched, knotted spine
  fillPoly(c, [
    [x - u * 3.4, spineY + u * 1.6],
    [x - u * 1.4, spineY - u * 1.6],
    [x + u * 2, spineY - u * 1],
    [x + u * 3.4, spineY + u * 1.2],
    [x + u * 1.6, spineY + u * 2.4],
    [x - u * 2.6, spineY + u * 2.6],
  ], FLESH);
  for (let i = 0; i < 4; i++) {
    px(c, x - u * 2 + i * u * 1.2, spineY - u * 1.4 - (i === 1 || i === 2 ? 1 : 0),
      mix(FLESH, PAL.frostShadow, 0.3));
  }

  // head slung low and forward
  const headX = x + u * 4.4;
  const headY = spineY + u * 1.6;
  fillPoly(c, [
    [headX - u * 1.4, headY - u * 1.2],
    [headX + u * 2.2, headY - u * 0.4],
    [headX + u * 2, headY + u * 1],
    [headX - u * 1.2, headY + u * 1.2],
  ], FLESH);
  px(c, headX + u * 0.8, headY - u * 0.2, PAL.crimson);
  glow(c, headX + u, headY, u * 3.5, PAL.crimson, 0.30);
}

/* ------------------------------------------ deformed: the tall thin one */

function drawTall(c, x, y, h, gait) {
  const u = (h * 1.45) / 20;
  const sway = Math.sin(gait * 0.5) * u * 0.6;
  const hipY = y - u * 9;
  const shoulderY = y - u * 17;

  // stilt legs, stiff and over-long
  for (const off of [0, Math.PI]) {
    const swing = Math.sin(gait * 0.85 + off);
    const kneeX = x + swing * u * 1.6;
    line(c, x, hipY, kneeX, hipY + u * 4.6, FLESH, Math.max(1, Math.round(u * 0.9)));
    line(c, kneeX, hipY + u * 4.6, x + swing * u * 3.2, y, FLESH, Math.max(1, Math.round(u * 0.8)));
  }

  // narrow trunk of a body
  fillPoly(c, [
    [x - u * 1.3 + sway, shoulderY],
    [x + u * 1.3 + sway, shoulderY],
    [x + u * 1.1, hipY + u],
    [x - u * 1.1, hipY + u],
  ], FLESH);

  // arms hanging past the knee, trailing
  for (const off of [0, 0.9]) {
    const swing = Math.sin(gait * 0.85 + off + Math.PI);
    line(c, x + sway, shoulderY + u, x - u * 1.4 + swing * u, hipY + u * 2.4, FLESH,
      Math.max(1, Math.round(u * 0.7)));
    line(c, x - u * 1.4 + swing * u, hipY + u * 2.4, x - u * 2 + swing * u * 1.6, hipY + u * 5.4,
      FLESH, Math.max(1, Math.round(u * 0.6)));
  }

  // small head, antler stubs
  const hx = x + sway;
  const hy = shoulderY - u * 1.6;
  disc(c, hx, hy, u * 1.3, FLESH);
  line(c, hx - u * 0.7, hy - u, hx - u * 2, hy - u * 2.8, FLESH, 1);
  line(c, hx - u * 2, hy - u * 2.8, hx - u * 1.2, hy - u * 3.6, FLESH, 1);
  line(c, hx + u * 0.7, hy - u, hx + u * 2, hy - u * 2.8, FLESH, 1);
  line(c, hx + u * 2, hy - u * 2.8, hx + u * 1.2, hy - u * 3.6, FLESH, 1);
  px(c, hx - 1, hy, PAL.crimson);
  px(c, hx + 1, hy, PAL.crimson);
  glow(c, hx, hy, u * 4.5, PAL.crimson, 0.26);
}

/* --------------------------------------- deformed: bent double, dragging */

function drawHunched(c, x, y, h, gait) {
  const u = h / 20;
  // limping: one stride long, the next short
  const limp = Math.sin(gait) * 0.5 + Math.sin(gait * 2) * 0.5;
  const bob = Math.abs(Math.sin(gait)) * u * 0.9;
  const backY = y - u * 9 + bob;

  // good leg drives, bad leg drags
  line(c, x, backY + u * 2, x + Math.sin(gait) * u * 2.6, y, ROBE, Math.max(1, Math.round(u * 1.4)));
  line(c, x, backY + u * 2, x - u * 3.4 - limp * u, y - u * 0.3, ROBE, Math.max(1, Math.round(u * 1.1)));

  // spine folded almost horizontal
  fillPoly(c, [
    [x - u * 3, backY + u * 2.6],
    [x - u * 2, backY - u * 1.4],
    [x + u * 2.4, backY - u * 0.6],
    [x + u * 3, backY + u * 1.6],
    [x + u * 1, backY + u * 3],
    [x - u * 2, backY + u * 3.2],
  ], ROBE);

  // head hanging off the front, arm trailing on the ground
  fillPoly(c, [
    [x + u * 2.6, backY - u * 0.4],
    [x + u * 4.4, backY + u * 0.4],
    [x + u * 4, backY + u * 2],
    [x + u * 2.4, backY + u * 1.8],
  ], ROBE);
  px(c, x + u * 3.6, backY + u * 0.7, PAL.crimsonDim);

  const drag = Math.sin(gait * 0.5) * u;
  line(c, x + u * 1.4, backY + u * 1.6, x - u * 2.6 + drag, y - u * 0.4, ROBE,
    Math.max(1, Math.round(u * 0.8)));
}

/* ----------------------------------------------------------- shared bits */

function leg(c, x, hipY, u, phase, col) {
  const fx = x + Math.cos(phase) * u * 3.6;
  const fy = hipY + u * 7.4 - Math.max(0, Math.sin(phase)) * u * 3.2;
  const kx = x + (fx - x) * 0.45 + u * 1.1;
  const ky = hipY + (fy - hipY) * 0.5;
  const th = Math.max(1, Math.round(u * 1.5));
  line(c, x, hipY, kx, ky, col, th);
  line(c, kx, ky, fx, fy, col, Math.max(1, th - 1));
  rect(c, fx - u * 0.8, fy - u * 0.4, u * 2.2, u * 1.2, PAL.voidBlack);
}

function torch(c, x, y, h, flick) {
  const f = Math.sin(flick) * 0.5 + Math.sin(flick * 2.3) * 0.3 + 0.6;
  const size = Math.max(1, h * 0.10 * (0.75 + f * 0.5));
  glow(c, x, y, size * 10, PAL.crimsonDim, 0.34 + f * 0.22);
  glow(c, x, y, size * 4, PAL.amber, 0.5 + f * 0.32);
  rect(c, x, y, Math.max(1, size * 0.8), Math.max(1, size * 1.3), PAL.amber);
  px(c, x, y - 1, PAL.amberPale);
  px(c, x + (f > 0.8 ? 1 : 0), y - 2, PAL.crimson);
}
