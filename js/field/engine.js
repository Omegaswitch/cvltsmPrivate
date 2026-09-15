/**
 * The field renderer.
 *
 * One canvas at device resolution — no integer upscaling, no pixel grid. The
 * order is fixed and shallow: sky, the crop behind the effigy, the effigy and
 * its fire, the crop in front of it, then chaff and grain over everything.
 *
 * Nothing here responds to the pointer or the wheel. The field moves because
 * the wind moves.
 */
import { buildSky } from './sky.js';
import { buildWheat, wind } from './wheat.js';
import { buildEffigy } from './effigy.js';
import { PAL } from './palette.js';
import { blit } from './surface.js';

const SEED = 0x63f1;
const STEP = 1 / 120;
const MAX_STEPS = 12;
const DPR_CAP = 2;

/** mulberry32 — the field is the same field on every load. */
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function createField(canvas, opts = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });

  const state = {
    w: 0, h: 0, dpr: 1,
    sky: null, wheat: null, effigy: null,
    chaff: [],
    reducedMotion: !!opts.reducedMotion,
    running: false,
    lastT: 0, clock: 0, acc: 0,
    ready: false,
    onReady: opts.onReady || (() => {}),
  };

  /* --------------------------------------------------------------- build */

  function build() {
    const rng = makeRng(SEED);
    const { w, h, dpr } = state;

    state.sky = buildSky(w, h, dpr, rng);
    // where the fire stands, so the crop can be lit by it as it is built
    const light = {
      x: w * 0.5,
      y: state.sky.horizonY + h * 0.22,
      radius: Math.max(w * 0.26, h * 0.46),
    };
    state.wheat = buildWheat(w, h, state.sky.horizonY, light, dpr, rng);
    state.effigy = buildEffigy(w, h, state.sky.horizonY, dpr, rng);

    // chaff lifting off the crop
    state.chaff = [];
    const motes = Math.round((w * h) / 42000);
    for (let i = 0; i < motes; i++) {
      state.chaff.push({
        x: rng() * w,
        y: state.sky.horizonY + rng() * (h - state.sky.horizonY),
        r: 0.5 + rng() * 1.3,
        drift: 4 + rng() * 14,
        rise: 2 + rng() * 9,
        phase: rng() * 10,
        a: 0.05 + rng() * 0.22,
      });
    }

    if (!state.ready) {
      state.ready = true;
      state.onReady();
    }
  }

  function resize() {
    const dpr = Math.min(DPR_CAP, window.devicePixelRatio || 1);
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(360, window.innerHeight);
    state.dpr = dpr;
    state.w = w;
    state.h = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  /* -------------------------------------------------------------- render */

  function frame(now) {
    if (!state.running) return;
    const dt = Math.min(0.1, (now - state.lastT) / 1000 || 0);
    state.lastT = now;

    state.acc += dt;
    let steps = 0;
    while (state.acc >= STEP && steps < MAX_STEPS) {
      state.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) state.acc = 0;
    if (!state.reducedMotion) state.clock += steps * STEP;
    const t = state.reducedMotion ? 4.2 : state.clock;

    blit(ctx, state.sky.surface);
    state.wheat.drawBack(ctx, t, state.w);
    blit(ctx, state.effigy.body);
    state.effigy.drawFire(ctx, t);
    drawChaff(ctx, state, t);
    state.wheat.drawFront(ctx, t);

    requestAnimationFrame(frame);
  }

  function onVisibility() {
    if (document.hidden) {
      state.running = false;
    } else if (!state.running) {
      state.running = true;
      state.lastT = performance.now();
      requestAnimationFrame(frame);
    }
  }

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 180);
  }

  return {
    start() {
      resize();
      window.addEventListener('resize', onResize, { passive: true });
      window.addEventListener('orientationchange', onResize, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      state.running = true;
      state.lastT = performance.now();
      requestAnimationFrame(frame);
    },
    setReducedMotion(v) {
      state.reducedMotion = !!v;
    },
    /** Where the effigy stands, so the interface can be arranged around it. */
    get anchor() {
      return state.effigy
        ? { x: state.effigy.cx / state.w, y: state.effigy.heartY / state.h }
        : { x: 0.5, y: 0.5 };
    },
    get state() { return state; },
  };
}

/* ------------------------------------------------------------- overlays */

function drawChaff(c, state, t) {
  c.save();
  c.globalCompositeOperation = 'screen';
  for (const m of state.chaff) {
    const gust = wind(t, m.x, m.phase);
    const x = m.x + gust * m.drift;
    const y = m.y - ((t * m.rise + m.phase * 30) % (state.h * 0.35));
    c.globalAlpha = m.a * (0.5 + 0.5 * Math.sin(t * 1.3 + m.phase));
    c.fillStyle = PAL.chaff;
    c.beginPath();
    c.arc(x, y, m.r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
