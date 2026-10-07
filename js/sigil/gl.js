/**
 * The WebGL driver for the sigil.
 *
 * Owns the context, the sigil texture and the frame loop. It keeps the frame
 * rate by lowering the resolution the scene is drawn at when frames run long,
 * and raising it again once there is headroom, so a weak phone gets a softer
 * image rather than a stutter. Under reduced motion it draws one lit frame,
 * and redraws only when something it shows has changed.
 */
import { VERT, FRAG } from './shader.js';
import { log } from '../lib/log.js';

const INTRO_DELAY = 0.35;     // seconds before the ignition starts
const INTRO_LENGTH = 4.2;     // seconds for the whole sigil to light
const MIN_SCALE = 0.45;
const MAX_SCALE = 1;
const COOLDOWN = 90;          // frames to wait between resolution changes

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    log.error('gl.shader_failed', { info: gl.getShaderInfoLog(sh) });
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} opts
 * @param {HTMLCanvasElement} opts.texture   the painted sigil (see texture.js)
 * @param {boolean} [opts.reducedMotion]
 * @param {() => void} [opts.onContextLost]
 * @returns {object|null} null when WebGL is unavailable
 */
export function createSigil(canvas, { texture, reducedMotion = false, onContextLost } = {}) {
  let gl = null;
  try {
    gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, powerPreference: 'high-performance',
    });
  } catch {
    gl = null;
  }
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    log.error('gl.link_failed', { info: gl.getProgramInfoLog(prog) });
    return null;
  }
  gl.useProgram(prog);

  // one oversized triangle covers the screen
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // the sigil texture; 1024 is a power of two, so it samples cleanly
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const u = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    ignite: gl.getUniformLocation(prog, 'uIgnite'),
    hover: gl.getUniformLocation(prog, 'uHover'),
  };
  gl.uniform1i(gl.getUniformLocation(prog, 'uSigil'), 0);

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let scale = dpr >= 2 ? 0.8 : MAX_SCALE;
  let motion = !reducedMotion;
  let hover = -1;
  let running = false;
  let dirty = true;
  let raf = 0;
  let frames = 0;
  let avgMs = 16;
  let last = 0;
  let cooldown = 0;
  let t0 = 0;

  function resize() {
    const w = Math.max(1, Math.round(window.innerWidth * dpr * scale));
    const h = Math.max(1, Math.round(window.innerHeight * dpr * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u.res, w, h);
    dirty = true;
  }

  function easeOut(x) {
    const c = Math.min(1, Math.max(0, x));
    return 1 - Math.pow(1 - c, 3);
  }

  function draw(now) {
    const t = motion ? (now - t0) / 1000 : 0;
    const ignite = motion ? easeOut((t - INTRO_DELAY) / INTRO_LENGTH) : 1;
    gl.uniform1f(u.time, t);
    gl.uniform1f(u.ignite, ignite);
    gl.uniform1f(u.hover, hover);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    dirty = false;
  }

  /* Adapt the resolution to the frame time. The average is a moving average,
     and the cooldown stops it from flip-flopping between two sizes. */
  function adapt(ms) {
    avgMs = avgMs * 0.92 + ms * 0.08;
    if (cooldown > 0) { cooldown--; return; }
    if (avgMs > 22 && scale > MIN_SCALE) {
      scale = Math.max(MIN_SCALE, scale * 0.85);
      cooldown = COOLDOWN;
      resize();
    } else if (avgMs < 12 && scale < MAX_SCALE) {
      scale = Math.min(MAX_SCALE, scale * 1.08);
      cooldown = COOLDOWN;
      resize();
    }
  }

  function loop(now) {
    if (!running) return;
    if (motion) {
      const ms = now - last;
      if (frames > 30 && ms < 500) adapt(ms);
      draw(now);
      last = now;
      frames++;
      raf = requestAnimationFrame(loop);
    } else {
      // reduced motion: nothing moves, so there is nothing to keep drawing
      if (dirty) draw(now);
      raf = 0;
    }
  }

  function start() {
    if (running) return;
    running = true;
    t0 = performance.now();
    last = t0;
    frames = 0;
    resize();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(raf);
    raf = 0;
  }

  /** Repaint for a change that is not motion: hover, or a switch of motion mode. */
  function refresh() {
    if (!running || raf) return;    // a frame is already scheduled
    raf = requestAnimationFrame(loop);
  }

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }

  function onContextLost(e) {
    e.preventDefault();
    stop();
    log.warn('gl.context_lost');
    if (onContextLost) onContextLost();
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); refresh(); }, 150);
  }, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost, false);

  return {
    start,
    stop,
    setHover(order) {
      hover = order == null ? -1 : Math.round(order * 255) / 255;
      dirty = true;
      refresh();
    },
    setReducedMotion(v) {
      motion = !v;
      dirty = true;
      refresh();
    },
  };
}
