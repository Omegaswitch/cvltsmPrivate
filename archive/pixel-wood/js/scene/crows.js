/**
 * Crows.
 *
 * A handful of birds crossing the wood on their own errands — they drift in
 * from the right at varied heights and speeds, flap in bursts, glide, and
 * wander vertically. Drawn between the deep forest and the sentinels, so the
 * near trunks and the foreground pass in front of them.
 */
import { makeRng } from '../lib/rng.js';
import { rect, line, mix, clamp } from '../lib/paint.js';
import { PAL } from '../palette.js';

const BODY = PAL.voidBlack;
const BODY_FAR = mix(PAL.voidBlack, PAL.mist, 0.22);

export function buildCrows(vw, vh, L, seed) {
  const rng = makeRng(seed);
  const flock = [];
  const count = clamp(Math.round(vw / 95), 4, 9);
  for (let i = 0; i < count; i++) flock.push(spawn(rng, vw, vh, true));

  return {
    draw(ctx, t, dt, w, h, still, worldSpeed = 0) {
      for (const b of flock) {
        if (!still) {
          b.delay -= dt;
          if (b.delay > 0) continue;

          // flap in bursts, then set the wings and glide
          b.glideT -= dt;
          if (b.glideT <= 0) {
            b.gliding = !b.gliding;
            b.glideT = b.gliding ? rng.range(0.6, 2.2) : rng.range(0.8, 3.0);
          }
          if (!b.gliding) b.flap += b.flapRate * dt;

          b.wander += dt * b.wanderRate;
          // the wood's own travel carries them along a little as well
          b.x -= (b.speed + worldSpeed * b.depth) * dt;
          b.y = b.baseY + Math.sin(b.wander) * b.sway + Math.sin(b.wander * 2.3) * b.sway * 0.35;
          b.baseY += b.drift * dt;

          if (b.x < -20 || b.baseY < h * 0.13 || b.baseY > h * 0.36) {
            Object.assign(b, spawn(rng, w, h, false));
          }
        }
        if (b.delay > 0) continue;
        drawCrow(ctx, Math.round(b.x), Math.round(b.y), b.scale,
          b.gliding ? 0.15 : Math.sin(b.flap), b.scale > 2 ? BODY : BODY_FAR);
      }
    },
  };
}

function spawn(rng, w, h, initial) {
  const scale = rng.chance(0.45) ? 3 : 2;
  return {
    x: initial ? rng.range(0, w) : w + rng.range(6, 90),
    baseY: rng.range(h * 0.17, h * 0.31),
    y: 0,
    scale,
    speed: rng.range(14, 34) * (scale >= 3 ? 1.25 : 1),
    depth: scale >= 3 ? 0.35 : 0.16,
    flap: rng.range(0, Math.PI * 2),
    flapRate: rng.range(9, 15),
    gliding: rng.chance(0.3),
    glideT: rng.range(0.3, 2),
    wander: rng.range(0, Math.PI * 2),
    wanderRate: rng.range(0.5, 1.4),
    sway: rng.range(2, 6.5),
    drift: rng.signed(1.4),
    delay: initial ? 0 : rng.range(0, 6),
  };
}

/**
 * One bird. `f` is the wing position, -1 (down) to 1 (up); the body is a
 * couple of pixels and the wings do all the reading at this size.
 */
function drawCrow(c, x, y, s, f, col) {
  const wing = 3 * s;
  const lift = -f * wing * 0.8;

  // body and head, facing the direction of travel (left)
  rect(c, x - s, y, s * 2, Math.max(1, s), col);
  rect(c, x - s * 2, y - (s > 1 ? 1 : 0), s, Math.max(1, s), col);
  // tail
  rect(c, x + s * 2, y, s, 1, col);
  // wings
  line(c, x, y, x - wing, y + lift, col, s);
  line(c, x, y, x + wing * 0.9, y + lift, col, s);
  // wrist bend on the upstroke reads as a real wingbeat
  if (f > 0.3) {
    line(c, x - wing, y + lift, x - wing * 1.3, y + lift * 0.4, col, 1);
    line(c, x + wing * 0.9, y + lift, x + wing * 1.2, y + lift * 0.4, col, 1);
  }
}
