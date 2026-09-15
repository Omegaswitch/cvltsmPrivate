/**
 * SKOGLØP — the hidden run.
 *
 * Reached only by clicking the wordmark ten times. The wood is already an
 * endless side-scroller with a man running through it, so the game is that
 * scene with the brakes off: obstacles on the road, and jump and slide to
 * clear them.
 *
 * It borrows the engine rather than replacing it. The engine keeps drawing
 * every layer; the game takes over the actor slot and winds the world speed
 * up. That way the parallax, weather, crows and the pack behind him all keep
 * running, and nothing has to be duplicated.
 */
import { buildRunner, POSE, FRAME_COUNT } from '../scene/villager.js';
import { rect, line, px, mix, clamp, glow, glowEllipse } from '../lib/paint.js';
import { PAL } from '../palette.js';

/* physics, in virtual pixels and seconds */
const GRAVITY = 1250;
const JUMP_V = 292;
const SLIDE_TIME = 0.52;
const COYOTE = 0.09;          // grace after leaving the ground
const BUFFER = 0.12;          // jump pressed just before landing still counts

const RUN_CYCLE = 0.42;       // seconds per stride while running

export const STATE = { READY: 'ready', RUNNING: 'running', DEAD: 'dead' };

export function createGame({ vh, baseGroundSpeed, onState, onScore }) {
  const bodyH = Math.max(14, Math.round(vh * 0.056));
  const u = bodyH / 20;
  const sprite = buildRunner(bodyH);

  let state = STATE.READY;
  let speedMul = 1;
  let distance = 0;
  let elapsed = 0;
  let best = readBest();

  // the runner
  let y = 0;                  // height above the ground line, +up
  let vy = 0;
  let sliding = 0;            // seconds of slide left
  let airborne = 0;           // seconds since leaving the ground
  let wantJump = 0;           // buffered input
  let runPhase = 0;

  let obstacles = [];
  let nextGap = 0;
  let deathT = 0;

  function readBest() {
    try {
      return Number(localStorage.getItem('cvltsm:best') || 0) || 0;
    } catch {
      return 0;
    }
  }
  function writeBest(v) {
    try {
      localStorage.setItem('cvltsm:best', String(Math.round(v)));
    } catch {
      /* private mode — the score just does not persist */
    }
  }

  function setState(next) {
    state = next;
    if (onState) onState(next);
  }

  function reset() {
    distance = 0;
    elapsed = 0;
    speedMul = 1;
    y = 0;
    vy = 0;
    sliding = 0;
    airborne = 0;
    wantJump = 0;
    runPhase = 0;
    obstacles = [];
    nextGap = 220;
    deathT = 0;
  }

  /** Ground pixels per second at the current difficulty. */
  const groundSpeed = () => baseGroundSpeed * 3.4 * speedMul;

  /** How far he travels while airborne — spacing must beat this. */
  const jumpSpan = () => groundSpeed() * ((2 * JUMP_V) / GRAVITY);

  function spawn(vw) {
    const roll = Math.random();
    // a branch hangs low enough that only a slide clears it
    if (roll < 0.3) {
      obstacles.push({
        kind: 'branch',
        x: vw + 12,
        w: u * 13,
        top: u * 15.5,
        h: u * 9,
      });
    } else if (roll < 0.62) {
      obstacles.push({ kind: 'stump', x: vw + 12, w: u * 6, top: u * 12.5, h: u * 12.5 });
    } else {
      obstacles.push({ kind: 'rock', x: vw + 12, w: u * 9.5, top: u * 7.5, h: u * 7.5 });
    }
  }

  /** Hit box, measured up from the ground line. */
  function hitbox(runnerX) {
    if (sliding > 0) {
      return { x0: runnerX - u * 3, x1: runnerX + u * 6, y0: 0, y1: u * 8 };
    }
    return { x0: runnerX - u * 2, x1: runnerX + u * 3.2, y0: y, y1: y + u * 18 };
  }

  const overlaps = (b, o) =>
    b.x1 > o.x && b.x0 < o.x + o.w && b.y1 > o.top - o.h && b.y0 < o.top;

  return {
    get state() { return state; },
    get score() { return Math.floor(distance / 10); },
    get best() { return Math.floor(best); },
    /** Multiplier the engine should apply to the world scroll. */
    get speedScale() { return state === STATE.RUNNING ? groundSpeed() / baseGroundSpeed : 1; },

    start() {
      reset();
      setState(STATE.RUNNING);
    },
    stop() {
      reset();
      setState(STATE.READY);
    },

    jump() {
      if (state === STATE.DEAD) return;
      wantJump = BUFFER;
    },
    slide() {
      if (state !== STATE.RUNNING) return;
      if (airborne > COYOTE) {
        vy = Math.min(vy, -JUMP_V * 0.7);       // slam back down to slide
        return;
      }
      sliding = SLIDE_TIME;
    },

    update(dt, vw) {
      if (state === STATE.DEAD) {
        deathT += dt;
        return;
      }
      if (state !== STATE.RUNNING) return;

      elapsed += dt;
      speedMul = 1 + Math.min(0.85, elapsed / 70);
      const speed = groundSpeed();
      distance += speed * dt;
      runPhase += (dt / RUN_CYCLE) * Math.PI * 2 * speedMul;

      /* ------------------------------------------------------- the runner */
      wantJump = Math.max(0, wantJump - dt);
      sliding = Math.max(0, sliding - dt);

      const grounded = y <= 0.001 && vy <= 0;
      if (grounded) {
        y = 0;
        vy = 0;
        airborne = 0;
      } else {
        airborne += dt;
      }
      if (wantJump > 0 && airborne <= COYOTE && sliding <= 0) {
        vy = JUMP_V;
        wantJump = 0;
        airborne = COYOTE + 1;
      }
      if (!grounded || vy > 0) {
        vy -= GRAVITY * dt;
        y = Math.max(0, y + vy * dt);
      }

      /* ------------------------------------------------------- the road */
      for (const o of obstacles) o.x -= speed * dt;
      obstacles = obstacles.filter((o) => o.x + o.w > -20);

      nextGap -= speed * dt;
      if (nextGap <= 0) {
        spawn(vw);
        const floor = jumpSpan() * 1.5;
        nextGap = floor + Math.random() * (vw * 0.5) / speedMul;
      }

      /* ------------------------------------------------------- collision */
      const runnerX = Math.round(vw * 0.42);
      const box = hitbox(runnerX);
      for (const o of obstacles) {
        if (overlaps(box, o)) {
          best = Math.max(best, this.score);
          writeBest(best);
          if (onScore) onScore(this.score, Math.floor(best));
          setState(STATE.DEAD);
          return;
        }
      }
      if (onScore) onScore(this.score, Math.floor(best));
    },

    /** Called by the engine in place of the traveller. */
    draw(ctx, t, dt, vw, groundY) {
      const runnerX = Math.round(vw * 0.42);

      /* ------------------------------------------------------- obstacles */
      for (const o of obstacles) {
        const x = Math.round(o.x);
        const base = Math.round(groundY - o.top + o.h);
        if (o.kind === 'branch') drawBranch(ctx, x, Math.round(groundY - o.top), o.w, o.h, u);
        else if (o.kind === 'stump') drawStump(ctx, x, base, o.w, o.h, u);
        else drawRock(ctx, x, base, o.w, o.h, u);
      }

      /* ---------------------------------------------------------- runner */
      const ry = Math.round(groundY - y);
      const dead = state === STATE.DEAD;

      // lantern light travels with him
      const lift = clamp(y / (u * 26), 0, 1);
      glowEllipse(ctx, runnerX + u * 5, groundY, bodyH * 2.6 * (1 - lift * 0.45),
        bodyH * 0.8, PAL.amber, 0.34);
      glow(ctx, runnerX + u * 5, ry - bodyH * 0.55, bodyH * 1.9, PAL.amber, 0.45);

      if (dead) {
        // tipped over where he fell
        ctx.save();
        ctx.translate(runnerX, ry);
        ctx.rotate(Math.min(1.35, deathT * 5));
        sprite.blit(ctx, 0, 0, POSE.SLIDE);
        ctx.restore();
      } else if (sliding > 0) {
        sprite.blit(ctx, runnerX, ry, POSE.SLIDE);
        // grit sprayed along the ground
        for (let i = 0; i < 4; i++) {
          px(ctx, runnerX - u * (2 + i * 2.4) - (t * 60 % (u * 3)),
            groundY - u * (0.4 + (i % 2)), mix(PAL.amberDeep, PAL.soil, 0.4));
        }
      } else if (y > 0.5) {
        sprite.blit(ctx, runnerX, ry, POSE.JUMP);
      } else {
        sprite.draw(ctx, runnerX, ry, Math.floor((runPhase / (Math.PI * 2)) * FRAME_COUNT));
      }
    },
  };
}

/* ------------------------------------------------------------- obstacles */

/*
 * Obstacles are lit harder than anything else in the wood. The ambient scene
 * can afford to swallow detail; a hazard the player cannot see in time is
 * just an unfair death, so each one carries a frost-lit crown and a hard
 * shadow line to separate it from the ground.
 */

function drawRock(c, x, base, w, h, u) {
  const stone = mix(PAL.frostShadow, PAL.soil, 0.3);
  const lit = mix(PAL.frost, stone, 0.25);
  for (let i = 0; i < w; i++) {
    const t = (i / w) * 2 - 1;
    const top = base - Math.sqrt(Math.max(0, 1 - t * t)) * h;
    rect(c, x + i, top, 1, base - top, stone);
    // snow on the upper face
    if (t < 0.45) rect(c, x + i, top, 1, Math.max(1, u), lit);
  }
  rect(c, x, base - 1, w, 1, PAL.voidBlack);
}

function drawStump(c, x, base, w, h, u) {
  const wood = mix(PAL.barkLit, PAL.bark, 0.35);
  const lit = mix(PAL.frost, wood, 0.3);
  rect(c, x, base - h, w, h, wood);
  rect(c, x, base - h, 1, h, mix(wood, PAL.frostMid, 0.4));
  rect(c, x + w - 1, base - h, 1, h, PAL.voidBlack);
  // splintered, snow-capped crown
  for (let i = 0; i < w; i++) {
    const notch = (i % 3 === 1) ? Math.round(u) : 0;
    rect(c, x + i, base - h - 1 + notch, 1, Math.max(2, u * 2), lit);
  }
  rect(c, x, base - 1, w, 1, PAL.voidBlack);
}

function drawBranch(c, x, bottom, w, h, u) {
  const wood = mix(PAL.barkLit, PAL.bark, 0.2);
  const lit = mix(PAL.frost, wood, 0.2);
  const th = Math.max(2, Math.round(u * 2));

  // the limb reaching in overhead
  rect(c, x, bottom - h, w, th, wood);
  rect(c, x, bottom - h, w, 1, lit);

  // needles hanging into the gap you have to duck under
  for (let i = 0; i < w; i += 2) {
    const drop = h * (0.5 + 0.5 * Math.abs(Math.sin(i * 0.7)));
    line(c, x + i, bottom - h + th, x + i - u, bottom - h + drop, wood, 1);
    px(c, x + i - u, bottom - h + drop, lit);
  }
}
