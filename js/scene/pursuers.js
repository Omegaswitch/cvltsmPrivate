/**
 * The pursuit.
 *
 * Whatever the wood has sent after him, strung out down the road behind. The
 * traveller holds the middle of the frame, so "behind" is screen-left.
 *
 * Every one of them is solid and permanently on the road — nothing fades out
 * or blinks away. Two things do the work:
 *
 *  - They LURCH. The stride phase is deliberately non-uniform, and the
 *    deformed ones quantise it into stop-motion steps, which reads far worse
 *    than a smooth walk. Occasional whole-body spasms on top.
 *  - They SURGE. Each closes and falls back on its own slow cycle, so the gap
 *    behind the traveller keeps breathing without ever shutting.
 *
 * Drawn after the road and before the traveller, so he stays clearly ahead,
 * and before the fog, which swallows the far end of the pack.
 */
import { makeRng } from '../lib/rng.js';
import { rect, px, line, fillPoly, disc, mix, glow, glowEllipse } from '../lib/paint.js';
import { PAL } from '../palette.js';

const TAU = Math.PI * 2;

/**
 * Cold, and a shade off the void. The road they walk is almost pure black, so
 * a silhouette mixed toward the warm mist disappeared into it entirely; these
 * lean blue instead, which separates them from the soil without lifting them
 * out of the dark.
 */
const FLESH = mix(PAL.voidBlack, PAL.frostShadow, 0.78);
const ROBE = mix(PAL.voidBlack, PAL.frostShadow, 0.56);

/** Deterministic 0..1 from two numbers — no state, same result every frame. */
const hash = (a, b) => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

export function buildPursuers(vh, seed) {
  const rng = makeRng(seed);
  const bodyH = Math.max(14, Math.round(vh * 0.056));

  // Strung out down the road as a fraction of viewport width. The traveller
  // walks at 0.56, so the nearest of them is a good stretch behind him.
  const specs = [
    { type: 'cultist', f: 0.300, torch: true },
    { type: 'loper', f: 0.225, stutter: 4 },
    { type: 'hunched', f: 0.150 },
    { type: 'cultist', f: 0.075, torch: true },
    { type: 'tall', f: 0.010, stutter: 3 },
    { type: 'loper', f: -0.060, stutter: 4 },
    { type: 'cultist', f: -0.120, torch: true },
  ];

  const pack = specs.map((sp, i) => ({
    ...sp,
    id: i,
    scale: rng.range(0.82, 1.05),
    lift: rng.range(0, vh * 0.016),
    phase: rng.range(0, TAU),
    gaitRate: rng.range(6.5, 10),
    surgeAmp: rng.range(0.008, 0.026),
    surgeRate: rng.range(0.2, 0.5),
    flick: rng.range(0.6, 1.4),

  }));

  // furthest back first, so the nearer ones overlap them correctly
  pack.sort((a, b) => b.lift - a.lift);

  return {
    draw(ctx, t, vw, groundY, still) {
      const time = still ? 1.1 : t;

      const poses = [];
      for (const p of pack) {
        const f = p.f + Math.sin(time * p.surgeRate + p.phase) * p.surgeAmp;

        // an occasional whole-body twitch, a few frames long
        const tick = Math.floor(time * 6);
        const spasm = hash(p.id * 7.3, tick) < 0.05
          ? (hash(p.id, tick + 0.5) - 0.5) * bodyH * 0.22
          : 0;

        poses.push({
          p,
          x: Math.round(vw * f + spasm),
          y: Math.round(groundY - p.lift + spasm * 0.4),
          h: bodyH * p.scale,
          gait: lurch(p, time),
          flick: time * 9 * p.flick + p.phase,
        });
      }

      // 1. what light there is, pooled on the road. The torchless ones are
      //    lit only by whatever leaks out of their own eyes, which is just
      //    enough to catch their legs against the soil.
      for (const o of poses) {
        if (o.p.torch) {
          const f = Math.sin(o.flick) * 0.3 + 0.8;
          glowEllipse(ctx, o.x + o.h * 0.2, o.y, o.h * 2.6 * f, o.h * 0.78, PAL.amberDeep, 0.44);
          glowEllipse(ctx, o.x + o.h * 0.2, o.y, o.h * 1.2, o.h * 0.38, PAL.amber, 0.26);
        } else {
          glowEllipse(ctx, o.x + o.h * 0.25, o.y, o.h * 1.6, o.h * 0.5, PAL.crimsonDeep, 0.5);
        }
      }

      // 2. the figures, silhouetted against it
      for (const o of poses) {
        if (o.p.type === 'cultist') drawCultistRunner(ctx, o.x, o.y, o.h, o.gait);
        else if (o.p.type === 'loper') drawLoper(ctx, o.x, o.y, o.h, o.gait);
        else if (o.p.type === 'tall') drawTall(ctx, o.x, o.y, o.h, o.gait);
        else drawHunched(ctx, o.x, o.y, o.h, o.gait);
      }

      // 3. the eyes
      for (const o of poses) eyesOf(ctx, o);

      // 4. the flames, over everything they light
      for (const o of poses) {
        if (!o.p.torch) continue;
        const u = o.h / 20;
        torch(ctx, o.x + u * 5.4, o.y - u * 16.6, o.h, o.flick);
      }
    },
  };
}

/**
 * Stride phase. Never linear: the beat stretches and snaps so the walk is
 * always slightly wrong, and the deformed ones quantise it into stop-motion.
 */
function lurch(p, time) {
  const g = time * p.gaitRate + p.phase;
  const uneven = g + Math.sin(g * 0.5) * 0.9 + Math.sin(g * 0.23 + 1.3) * 0.45;
  return p.stutter ? (Math.floor(uneven * p.stutter) / p.stutter) : uneven;
}

/** Where each type carries its embers. */
function eyesOf(c, o) {
  const u = o.h / 20;
  const { x, y, gait } = o;
  if (o.p.type === 'cultist') {
    const bob = Math.sin(gait * 2) * u * 0.7;
    embers(c, x + u * 0.8, y - u * 16.4 + bob, u, 0.9);
  } else if (o.p.type === 'loper') {
    embers(c, x + u * 5.2, y - u * 5.4 + Math.sin(gait) * u * 1.3, u, 1.0);
  } else if (o.p.type === 'tall') {
    const tu = (o.h * 1.45) / 20;
    embers(c, x + Math.sin(gait * 0.5) * tu * 0.6, y - tu * 18.6, tu, 0.85);
  } else {
    embers(c, x + u * 3.6, y - u * 8.3 + Math.abs(Math.sin(gait)) * u * 0.9, u, 0.8);
  }
}

function embers(c, x, y, u, strength) {
  const gap = Math.max(1, Math.round(u * 0.9));
  glow(c, x, y, u * 8 * strength, PAL.crimson, 0.55 * strength);
  glow(c, x, y, u * 2.8, PAL.crimsonHot, 0.65 * strength);
  px(c, x - gap / 2, y, PAL.crimsonHot);
  px(c, x + gap / 2, y, PAL.crimsonHot);
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

  const flap = Math.sin(gait * 2 + 0.6);
  fillPoly(c, [
    [x - u * 1.4, shoulderY + u],
    [x - u * 5.6 - flap * u * 1.7, shoulderY + u * 4],
    [x - u * 5.2, hipY + u * 4],
    [x + u * 2.6, hipY + u * 3],
    [x + u * 2 + lean, shoulderY],
  ], ROBE);

  fillPoly(c, [
    [x - u * 1.2 + lean, shoulderY - u * 0.6],
    [x + u * 1.6 + lean, shoulderY - u * 1],
    [x + u * 1.2 + lean, shoulderY + u * 2],
    [x - u * 1.4 + lean, shoulderY + u * 2],
  ], ROBE);
  disc(c, x + u * 0.3 + lean, shoulderY - u * 1.4, u * 1.7, ROBE);

  const reach = Math.sin(gait) * u * 1.4;
  line(c, x + u * 1.2 + lean, shoulderY + u * 1.4,
    x + u * 4.4 + reach, shoulderY + u * 0.6, ROBE, Math.max(1, Math.round(u * 1.2)));

  // torch haft; the flame is painted in a later pass
  line(c, x + u * 4.4 + reach, shoulderY + u * 0.6, x + u * 5.4, shoulderY - u * 1.6,
    mix(PAL.voidBlack, PAL.bark, 0.45), 1);
}

/* -------------------------------------------- deformed: the low gallop */

function drawLoper(c, x, y, h, gait) {
  const u = h / 20;
  const bound = Math.sin(gait) * u * 1.6;
  const spineY = y - u * 7 + bound;

  for (const off of [0, Math.PI]) {
    const swing = Math.sin(gait + off);
    const handX = x + u * 5.5 + swing * u * 3.6;
    line(c, x + u * 2.4, spineY + u * 0.5, handX, y - u * 0.4, FLESH, Math.max(1, Math.round(u)));
    rect(c, handX - u * 0.6, y - u * 0.6, u * 1.6, u * 0.8, FLESH);
  }
  for (const off of [0.6, Math.PI + 0.6]) {
    const swing = Math.sin(gait + off);
    const footX = x - u * 3.6 + swing * u * 2.8;
    line(c, x - u * 2, spineY + u, x - u * 3.4, spineY + u * 3.4, FLESH, Math.max(1, Math.round(u * 1.3)));
    line(c, x - u * 3.4, spineY + u * 3.4, footX, y, FLESH, Math.max(1, Math.round(u)));
  }

  fillPoly(c, [
    [x - u * 3.4, spineY + u * 1.6],
    [x - u * 1.4, spineY - u * 1.6],
    [x + u * 2, spineY - u],
    [x + u * 3.4, spineY + u * 1.2],
    [x + u * 1.6, spineY + u * 2.4],
    [x - u * 2.6, spineY + u * 2.6],
  ], FLESH);
  for (let i = 0; i < 4; i++) {
    px(c, x - u * 2 + i * u * 1.2, spineY - u * 1.4 - (i === 1 || i === 2 ? 1 : 0),
      mix(FLESH, PAL.frostShadow, 0.3));
  }

  const headX = x + u * 4.4;
  const headY = spineY + u * 1.6;
  fillPoly(c, [
    [headX - u * 1.4, headY - u * 1.2],
    [headX + u * 2.2, headY - u * 0.4],
    [headX + u * 2, headY + u],
    [headX - u * 1.2, headY + u * 1.2],
  ], FLESH);
}

/* ------------------------------------------ deformed: the tall thin one */

function drawTall(c, x, y, h, gait) {
  const u = (h * 1.45) / 20;
  const sway = Math.sin(gait * 0.5) * u * 0.6;
  const hipY = y - u * 9;
  const shoulderY = y - u * 17;

  for (const off of [0, Math.PI]) {
    const swing = Math.sin(gait * 0.85 + off);
    const kneeX = x + swing * u * 1.6;
    line(c, x, hipY, kneeX, hipY + u * 4.6, FLESH, Math.max(1, Math.round(u * 0.9)));
    line(c, kneeX, hipY + u * 4.6, x + swing * u * 3.2, y, FLESH, Math.max(1, Math.round(u * 0.8)));
  }

  fillPoly(c, [
    [x - u * 1.3 + sway, shoulderY],
    [x + u * 1.3 + sway, shoulderY],
    [x + u * 1.1, hipY + u],
    [x - u * 1.1, hipY + u],
  ], FLESH);

  for (const off of [0, 0.9]) {
    const swing = Math.sin(gait * 0.85 + off + Math.PI);
    line(c, x + sway, shoulderY + u, x - u * 1.4 + swing * u, hipY + u * 2.4, FLESH,
      Math.max(1, Math.round(u * 0.7)));
    line(c, x - u * 1.4 + swing * u, hipY + u * 2.4, x - u * 2 + swing * u * 1.6, hipY + u * 5.4,
      FLESH, Math.max(1, Math.round(u * 0.6)));
  }

  const hx = x + sway;
  const hy = shoulderY - u * 1.6;
  disc(c, hx, hy, u * 1.3, FLESH);
  line(c, hx - u * 0.7, hy - u, hx - u * 2, hy - u * 2.8, FLESH, 1);
  line(c, hx - u * 2, hy - u * 2.8, hx - u * 1.2, hy - u * 3.6, FLESH, 1);
  line(c, hx + u * 0.7, hy - u, hx + u * 2, hy - u * 2.8, FLESH, 1);
  line(c, hx + u * 2, hy - u * 2.8, hx + u * 1.2, hy - u * 3.6, FLESH, 1);
}

/* --------------------------------------- deformed: bent double, dragging */

function drawHunched(c, x, y, h, gait) {
  const u = h / 20;
  const limp = Math.sin(gait) * 0.5 + Math.sin(gait * 2) * 0.5;
  const bob = Math.abs(Math.sin(gait)) * u * 0.9;
  const backY = y - u * 9 + bob;

  line(c, x, backY + u * 2, x + Math.sin(gait) * u * 2.6, y, ROBE, Math.max(1, Math.round(u * 1.4)));
  line(c, x, backY + u * 2, x - u * 3.4 - limp * u, y - u * 0.3, ROBE, Math.max(1, Math.round(u * 1.1)));

  fillPoly(c, [
    [x - u * 3, backY + u * 2.6],
    [x - u * 2, backY - u * 1.4],
    [x + u * 2.4, backY - u * 0.6],
    [x + u * 3, backY + u * 1.6],
    [x + u, backY + u * 3],
    [x - u * 2, backY + u * 3.2],
  ], ROBE);

  fillPoly(c, [
    [x + u * 2.6, backY - u * 0.4],
    [x + u * 4.4, backY + u * 0.4],
    [x + u * 4, backY + u * 2],
    [x + u * 2.4, backY + u * 1.8],
  ], ROBE);

  const drag = Math.sin(gait * 0.5) * u;
  line(c, x + u * 1.4, backY + u * 1.6, x - u * 2.6 + drag, y - u * 0.4, ROBE,
    Math.max(1, Math.round(u * 0.8)));
}

/* ----------------------------------------------------------- shared bits */

function leg(c, x, hipY, u, phase, col) {
  // lift on the forward stroke (-sin), not the backward one — see villager.js
  const fx = x + Math.cos(phase) * u * 3.6;
  const fy = hipY + u * 7.4 - Math.max(0, -Math.sin(phase)) * u * 3.2;
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
  glow(c, x, y, size * 9, PAL.crimsonDim, 0.3 + f * 0.2);
  glow(c, x, y, size * 3.6, PAL.amber, 0.44 + f * 0.3);
  rect(c, x, y, Math.max(1, size * 0.8), Math.max(1, size * 1.3), PAL.amber);
  px(c, x, y - 1, PAL.amberPale);
  px(c, x + (f > 0.8 ? 1 : 0), y - 2, PAL.crimson);
}
