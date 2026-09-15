/**
 * Deterministic pseudo random number generation.
 *
 * Every procedural asset in the scene is generated from a seed so the forest
 * looks identical across reloads, resizes and machines. Nothing here touches
 * Math.random().
 */

/** mulberry32 — small, fast, good enough distribution for art generation. */
export function makeRng(seed) {
  let a = seed >>> 0;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /** Float in [lo, hi). */
  rng.range = (lo, hi) => lo + rng() * (hi - lo);
  /** Integer in [lo, hi]. */
  rng.int = (lo, hi) => Math.floor(lo + rng() * (hi - lo + 1));
  /** True with probability p. */
  rng.chance = (p) => rng() < p;
  /** Random element of an array. */
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  /** Signed float in [-m, m). */
  rng.signed = (m = 1) => (rng() * 2 - 1) * m;
  return rng;
}

/**
 * 1D value noise with cubic smoothing — used for cloud bands, mist and bark.
 * Returns a sampler f(x) -> [0,1].
 */
export function noise1d(rng, period = 16) {
  const n = 256;
  const table = new Float32Array(n);
  for (let i = 0; i < n; i++) table[i] = rng();
  return (x) => {
    const t = x / period;
    const i = Math.floor(t);
    const f = t - i;
    const s = f * f * (3 - 2 * f);
    const a = table[((i % n) + n) % n];
    const b = table[(((i + 1) % n) + n) % n];
    return a + (b - a) * s;
  };
}

/** Fractal sum of 1D value noise. */
export function fbm1d(rng, period = 32, octaves = 4) {
  const layers = [];
  for (let o = 0; o < octaves; o++) {
    layers.push({ f: noise1d(rng, period / Math.pow(2, o)), amp: Math.pow(0.5, o + 1) });
  }
  const norm = layers.reduce((s, l) => s + l.amp, 0);
  return (x) => layers.reduce((s, l) => s + l.f(x) * l.amp, 0) / norm;
}

/**
 * 2D value noise on a tiling lattice. Returns f(x, y) -> [0,1].
 * Used for cloud masses, fog volume and ground scatter.
 */
export function noise2d(rng, period = 24) {
  const n = 128;
  const table = new Float32Array(n * n);
  for (let i = 0; i < table.length; i++) table[i] = rng();
  const at = (ix, iy) => table[(((iy % n) + n) % n) * n + (((ix % n) + n) % n)];
  return (x, y) => {
    const tx = x / period;
    const ty = y / period;
    const ix = Math.floor(tx);
    const iy = Math.floor(ty);
    const fx = tx - ix;
    const fy = ty - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(ix, iy);
    const b = at(ix + 1, iy);
    const c = at(ix, iy + 1);
    const d = at(ix + 1, iy + 1);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  };
}

/** Fractal sum of 2D value noise — 4 octaves reads as storm cloud. */
export function fbm2d(rng, period = 48, octaves = 4) {
  const layers = [];
  for (let o = 0; o < octaves; o++) {
    layers.push({ f: noise2d(rng, Math.max(2, period / Math.pow(2, o))), amp: Math.pow(0.5, o + 1) });
  }
  const norm = layers.reduce((s, l) => s + l.amp, 0);
  return (x, y) => layers.reduce((s, l) => s + l.f(x, y) * l.amp, 0) / norm;
}

/**
 * Horizontally periodic fBm.
 *
 * Cross-blends the field with a copy of itself shifted by one tile width, so
 * f(0, y) === f(W, y) exactly and the strip can be repeated forever with no
 * visible seam. Contrast dips very slightly mid-tile, which clouds and mist
 * hide completely.
 */
export function fbm2dTiling(rng, W, period = 48, octaves = 4) {
  const f = fbm2d(rng, period, octaves);
  return (x, y) => {
    const xw = ((x % W) + W) % W;
    const t = xw / W;
    const s = t * t * (3 - 2 * t);
    return f(xw, y) * (1 - s) + f(xw - W, y) * s;
  };
}

/**
 * Midpoint displacement ridge line. Produces the jagged mountain profiles
 * and the uneven forest floor without looking like a sine wave.
 */
export function ridgeline(rng, width, startY, endY, amplitude, roughness = 0.55) {
  let size = 1;
  while (size < width) size *= 2;
  const pts = new Float32Array(size + 1);
  pts[0] = startY;
  pts[size] = endY;
  let step = size;
  let amp = amplitude;
  while (step > 1) {
    const half = step >> 1;
    for (let i = half; i < size; i += step) {
      pts[i] = (pts[i - half] + pts[i + half]) / 2 + rng.signed(amp);
    }
    step = half;
    amp *= roughness;
  }
  const out = new Float32Array(width);
  for (let x = 0; x < width; x++) out[x] = pts[Math.round((x / (width - 1)) * size)];
  return out;
}
