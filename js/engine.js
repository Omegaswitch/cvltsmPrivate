/**
 * Parallax engine.
 *
 * The whole scene renders into one low-resolution framebuffer which is then
 * upscaled by an exact integer factor with CSS. That is what guarantees pixel
 * perfection: every source pixel maps to an N×N block, so nothing is ever
 * resampled or half-covered.
 *
 * The world travels: `worldX` advances continuously and every layer is a
 * horizontally tiling strip drawn at `-worldX * factor` wrapped into its own
 * tile width. The traveller stays put on screen and the forest streams past
 * him right to left, so he is always walking and never arrives. Nothing the
 * pointer does moves the camera — the wood simply passes behind him.
 *
 * Fog and crows are not overlays — they are drawn *between* layers at their
 * own depths, so the sentinels and the foreground occlude them like anything
 * else in the wood.
 */
import { makeLayout } from './scene/layout.js';
import { buildSky } from './scene/sky.js';
import { buildJotunn } from './scene/jotunn.js';
import { buildDeepForest } from './scene/deepforest.js';
import { buildSentinels } from './scene/sentinels.js';
import { buildPath } from './scene/path.js';
import { buildForeground } from './scene/foreground.js';
import { buildWeather } from './scene/weather.js';
import { buildCrows } from './scene/crows.js';
import { buildTraveller } from './scene/runner.js';
import { buildPursuers } from './scene/pursuers.js';
import { DEPTH } from './palette.js';
import { clamp } from './lib/paint.js';

const SEED = 0x5c0d;

/** Simulation tick. World travel is quantised to this so integer-snapped
 *  layer offsets step on a regular beat instead of a jittering one. */
const STEP = 1 / 120;
const MAX_STEPS = 12;

/** Tile width per layer, as a multiple of the viewport width. Deliberately
 *  mismatched so the layers never repeat in lockstep. */
const TILE = {
  sky: 2.3,
  jotunn: 1.55,
  deepForest: 2.1,
  sentinels: 1.9,
  path: 2.2,
  foreground: 1.7,
};

export function createEngine(canvas, opts = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const state = {
    scale: 3,
    vw: 0, vh: 0,        // framebuffer size in virtual pixels
    my: 0,               // vertical parallax margin
    layers: [],
    byKey: {},
    weather: null,
    crows: null,
    traveller: null,
    pursuers: null,
    ready: false,
    reducedMotion: !!opts.reducedMotion,
    // camera
    worldX: 0,
    scrub: 0,            // manual travel added by wheel/drag/keys
    worldSpeed: 30,
    running: false,
    lastT: 0,
    clock: 0,
    accumulator: 0,
    onReady: opts.onReady || (() => {}),
  };

  /* ------------------------------------------------------------- sizing */

  function resize() {
    const vw = Math.max(320, window.innerWidth);
    const vh = Math.max(320, window.innerHeight);

    // integer upscale factor, chosen so the framebuffer lands near 360px tall
    const scale = clamp(Math.round(vh / 360), 2, 8);
    const iw = Math.ceil(vw / scale);
    const ih = Math.ceil(vh / scale);

    state.scale = scale;
    state.vw = iw;
    state.vh = ih;
    state.my = Math.max(6, Math.round(ih * 0.03));

    canvas.width = iw;
    canvas.height = ih;
    canvas.style.width = `${iw * scale}px`;
    canvas.style.height = `${ih * scale}px`;
    ctx.imageSmoothingEnabled = false;

    build();
  }

  /* ------------------------------------------------------------ building */

  function build() {
    const H = state.vh + state.my * 2;
    const sw = state.vw;
    const layout = (key) => makeLayout(Math.round(sw * TILE[key]), H, sw, state.my);

    const skyL = layout('sky');
    const jotunnL = layout('jotunn');
    const deepL = layout('deepForest');
    const sentL = layout('sentinels');
    const pathL = layout('path');
    const foreL = layout('foreground');

    const sentinels = buildSentinels(sentL, SEED + 400);

    state.layers = [
      { key: 'sky', factor: DEPTH.sky, W: skyL.W, ...buildSky(skyL, SEED + 100) },
      { key: 'jotunn', factor: DEPTH.jotunn, W: jotunnL.W, ...buildJotunn(jotunnL, SEED + 200) },
      { key: 'deepForest', factor: DEPTH.deepForest, W: deepL.W, ...buildDeepForest(deepL, SEED + 300) },
      { key: 'sentinels', factor: DEPTH.sentinels, W: sentL.W, ...sentinels },
      { key: 'path', factor: DEPTH.path, W: pathL.W, ...buildPath(pathL, SEED + 500) },
      { key: 'foreground', factor: DEPTH.foreground, W: foreL.W, ...buildForeground(foreL, SEED + 600) },
    ];
    state.byKey = Object.fromEntries(state.layers.map((l) => [l.key, l]));

    state.weather = buildWeather(state.vw, state.vh, SEED + 700);
    state.crows = buildCrows(state.vw, state.vh, pathL, SEED + 800);
    state.traveller = buildTraveller(state.vh, SEED + 900);
    state.pursuers = buildPursuers(state.vh, SEED + 950);
    state.runeColumns = sentinels.columns;
    state.pathLayout = pathL;

    // the ground must slide past at exactly the traveller's walking pace,
    // otherwise his feet skate
    state.worldSpeed = state.traveller.strideSpeed / DEPTH.path;

    if (!state.ready) {
      state.ready = true;
      state.onReady();
    }
  }

  /* -------------------------------------------------------------- render */

  /** Draw one tiling layer across the viewport, and its live pass per tile. */
  function drawLayer(layer, t, shared) {
    const shift = state.worldX * layer.factor;
    const oy = -state.my;
    let x = -(((shift % layer.W) + layer.W) % layer.W);
    const offsets = [];
    for (let i = 0; x < state.vw; x += layer.W, i++) {
      const ox = Math.round(x);
      ctx.drawImage(layer.canvas, ox, oy);
      if (layer.over) {
        // live passes that work in screen space (reflections) need to know
        // which repeat they are, so they paint once rather than per tile
        shared.tileIndex = i;
        layer.over(ctx, t, ox, oy, shared);
      }
      // anything that must occlude the live pass (foliage over rune glow)
      if (layer.after) ctx.drawImage(layer.after, ox, oy);
      offsets.push(ox);
    }
    return { offsets, oy };
  }

  function frame(now) {
    if (!state.running) return;
    const dt = Math.min(0.1, (now - state.lastT) / 1000 || 0);
    state.lastT = now;

    /**
     * Fixed timestep.
     *
     * Layer offsets are integer-snapped to keep the pixel grid exact, so a
     * layer at 0.05 parallax only moves one pixel every 0.6s. Advancing the
     * world by a raw, jittering dt made those snaps land at uneven moments,
     * which reads as the background stuttering even at a solid 60fps. Draining
     * a fixed-size accumulator makes every snap fall on a regular beat.
     */
    state.accumulator += dt;
    let steps = 0;
    while (state.accumulator >= STEP && steps < MAX_STEPS) {
      state.accumulator -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) state.accumulator = 0;   // after a stall, do not sprint
    const sdt = steps * STEP;
    const t = state.clock;

    if (!state.reducedMotion) {
      state.clock += sdt;
      state.worldX += state.worldSpeed * sdt;
    }
    state.worldX += state.scrub * sdt * 6;
    state.scrub *= Math.exp(-sdt * 3.2);

    const shared = {
      reducedMotion: state.reducedMotion,
      runeColumns: state.runeColumns,
      sentinelOffsets: [],
      sentinelOy: 0,
      tileIndex: 0,
    };

    /* ---- back to front, with the weather and the birds woven in between -- */
    drawLayer(state.byKey.sky, t, shared);
    drawLayer(state.byKey.jotunn, t, shared);
    drawLayer(state.byKey.deepForest, t, shared);

    // haze banked up behind the treeline
    state.weather.drawFog(ctx, 0, t, state.vh, state.worldX, state.reducedMotion);
    state.crows.draw(ctx, t, sdt, state.vw, state.vh, state.reducedMotion, state.worldSpeed);

    const sent = drawLayer(state.byKey.sentinels, t, shared);
    shared.sentinelOffsets = sent.offsets;
    shared.sentinelOy = sent.oy;

    const path = drawLayer(state.byKey.path, t, shared);

    // the pack on the road behind him, then the traveller in front of them
    const groundY = path.oy + state.pathLayout.pathY + state.vh * 0.012;
    state.pursuers.draw(ctx, t, state.vw, groundY, state.reducedMotion);

    // the traveller walks on the spot at a fixed point in frame
    state.traveller.draw(
      ctx, t,
      Math.round(state.vw * 0.56),
      groundY,
      state.reducedMotion,
    );

    // banks rolling over the road, then the foreground, then wisps in front
    state.weather.drawFog(ctx, 1, t, state.vh, state.worldX, state.reducedMotion);
    drawLayer(state.byKey.foreground, t, shared);
    state.weather.drawFog(ctx, 2, t, state.vh, state.worldX, state.reducedMotion);

    requestAnimationFrame(frame);
  }

  /* -------------------------------------------------------------- input */

  let dragging = false;
  let dragX = 0;

  function onDown(e) {
    dragging = true;
    dragX = e.touches ? e.touches[0].clientX : e.clientX;
    canvas.style.cursor = 'grabbing';
  }
  function onMove(e) {
    if (!dragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    // dragging left pushes the journey forward
    state.scrub = clamp(state.scrub + (dragX - x) * 0.6, -400, 400);
    dragX = x;
    if (e.cancelable) e.preventDefault();
  }
  function onUp() {
    dragging = false;
    canvas.style.cursor = '';
  }
  function onWheel(e) {
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    state.scrub = clamp(state.scrub + d * 0.5, -400, 400);
    e.preventDefault();
  }
  function onKey(e) {
    if (e.key === 'ArrowRight') state.scrub = clamp(state.scrub + 90, -400, 400);
    else if (e.key === 'ArrowLeft') state.scrub = clamp(state.scrub - 90, -400, 400);
    else return;
    e.preventDefault();
  }

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 180);
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

  /* ---------------------------------------------------------------- api */

  return {
    start() {
      resize();
      window.addEventListener('resize', onResize, { passive: true });
      window.addEventListener('orientationchange', onResize, { passive: true });
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('mousedown', onDown);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchstart', onDown, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp, { passive: true });
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('keydown', onKey);
      document.addEventListener('visibilitychange', onVisibility);

      state.running = true;
      state.lastT = performance.now();
      requestAnimationFrame(frame);
    },
    setReducedMotion(v) {
      state.reducedMotion = !!v;
    },
    get state() {
      return state;
    },
  };
}
