/**
 * Parallax engine.
 *
 * The whole scene renders into one low-resolution framebuffer which is then
 * upscaled by an exact integer factor with CSS. That is what guarantees pixel
 * perfection: every source pixel maps to an N×N block, so nothing is ever
 * resampled or half-covered.
 *
 * Each layer is a pre-baked offscreen canvas plus an optional per-frame
 * `over()` pass for the parts that must live (eyes, runes, torches, the
 * runner, the water). Compositing is a handful of drawImage calls.
 */
import { makeLayout } from './scene/layout.js';
import { buildSky } from './scene/sky.js';
import { buildJotunn } from './scene/jotunn.js';
import { buildDeepForest } from './scene/deepforest.js';
import { buildSentinels } from './scene/sentinels.js';
import { buildPath } from './scene/path.js';
import { buildForeground } from './scene/foreground.js';
import { buildWeather } from './scene/weather.js';
import { DEPTH } from './palette.js';
import { clamp } from './lib/paint.js';

const SEED = 0x5c0d;

export function createEngine(canvas, opts = {}) {
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  ctx.imageSmoothingEnabled = false;

  const state = {
    scale: 3,
    vw: 0, vh: 0,        // framebuffer size in virtual pixels
    mx: 0, my: 0,        // parallax margins
    layers: [],
    weather: null,
    ready: false,
    reducedMotion: !!opts.reducedMotion,
    rainIntensity: 1,
    // camera
    pointer: 0, pointerY: 0,
    nav: 0, navTarget: 0,
    camX: 0, camY: 0,
    running: false,
    lastT: 0,
    clock: 0,
    onReady: opts.onReady || (() => {}),
    onCamera: opts.onCamera || (() => {}),
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
    state.mx = clamp(Math.round(iw * 0.11), 50, 150);
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
    const W = state.vw + state.mx * 2;
    const H = state.vh + state.my * 2;
    const L = makeLayout(W, H, state.mx, state.my);

    const sentinels = buildSentinels(W, H, L, SEED + 400);

    state.layers = [
      { key: 'sky', factor: DEPTH.sky, ...buildSky(W, H, L, SEED + 100) },
      { key: 'jotunn', factor: DEPTH.jotunn, ...buildJotunn(W, H, L, SEED + 200) },
      { key: 'deepForest', factor: DEPTH.deepForest, ...buildDeepForest(W, H, L, SEED + 300) },
      { key: 'sentinels', factor: DEPTH.sentinels, ...sentinels },
      { key: 'path', factor: DEPTH.path, ...buildPath(W, H, L, SEED + 500) },
      { key: 'foreground', factor: DEPTH.foreground, ...buildForeground(W, H, L, SEED + 600) },
    ];

    state.weather = buildWeather(state.vw, state.vh, SEED + 700);
    state.runeColumns = sentinels.columns;

    if (!state.ready) {
      state.ready = true;
      state.onReady();
    }
  }

  /* -------------------------------------------------------------- render */

  function frame(now) {
    if (!state.running) return;
    const dt = Math.min(0.05, (now - state.lastT) / 1000 || 0);
    state.lastT = now;
    if (!state.reducedMotion) state.clock += dt;
    const t = state.clock;

    // camera easing — frame-rate independent exponential smoothing
    const damp = state.reducedMotion ? 0.45 : 1 - Math.exp(-dt * 5.5);
    state.nav += (state.navTarget - state.nav) * (1 - Math.exp(-dt * 4));
    const tilt = state.reducedMotion ? 0.25 : 1;
    const targetX = clamp(state.pointer * 0.45 * tilt + state.nav * 0.9, -1, 1) * state.mx;
    const targetY = clamp(state.pointerY * 0.6 * tilt, -1, 1) * state.my;
    state.camX += (targetX - state.camX) * damp;
    state.camY += (targetY - state.camY) * damp;

    const shared = {
      reducedMotion: state.reducedMotion,
      runeColumns: state.runeColumns,
      sentinelOx: 0,
    };

    // pre-compute the sentinel offset so the water can mirror the runes
    for (const layer of state.layers) {
      if (layer.key === 'sentinels') {
        shared.sentinelOx = Math.round(-state.mx + state.camX * layer.factor);
      }
    }

    for (const layer of state.layers) {
      const ox = Math.round(-state.mx + state.camX * layer.factor);
      const oy = Math.round(-state.my + state.camY * layer.factor);
      ctx.drawImage(layer.canvas, ox, oy);
      if (layer.over) layer.over(ctx, t, ox, oy, shared);
    }

    state.weather.draw(ctx, t, dt, state.vw, state.vh, {
      intensity: state.rainIntensity,
      reducedMotion: state.reducedMotion,
    });

    state.onCamera(state.nav);
    requestAnimationFrame(frame);
  }

  /* -------------------------------------------------------------- input */

  function onPointerMove(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    state.pointer = (x / window.innerWidth) * 2 - 1;
    state.pointerY = (y / window.innerHeight) * 2 - 1;
  }

  let dragging = false;
  let dragX = 0;
  let dragStart = 0;

  function onDown(e) {
    dragging = true;
    dragX = e.touches ? e.touches[0].clientX : e.clientX;
    dragStart = state.navTarget;
    canvas.style.cursor = 'grabbing';
  }
  function onMove(e) {
    onPointerMove(e);
    if (!dragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    state.navTarget = clamp(dragStart - ((x - dragX) / window.innerWidth) * 2.2, -1, 1);
    if (e.cancelable) e.preventDefault();
  }
  function onUp() {
    dragging = false;
    canvas.style.cursor = '';
  }
  function onWheel(e) {
    // vertical wheel drives horizontal travel through the wood
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    state.navTarget = clamp(state.navTarget + d * 0.0016, -1, 1);
    e.preventDefault();
  }
  function onKey(e) {
    const step = 0.28;
    if (e.key === 'ArrowRight') state.navTarget = clamp(state.navTarget + step, -1, 1);
    else if (e.key === 'ArrowLeft') state.navTarget = clamp(state.navTarget - step, -1, 1);
    else if (e.key === 'Home') state.navTarget = -1;
    else if (e.key === 'End') state.navTarget = 1;
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
    /** Move the camera to a normalised position in [-1, 1]. */
    panTo(n) {
      state.navTarget = clamp(n, -1, 1);
    },
    setRain(v) {
      state.rainIntensity = clamp(v, 0, 1);
    },
    setReducedMotion(v) {
      state.reducedMotion = !!v;
    },
    get state() {
      return state;
    },
  };
}
