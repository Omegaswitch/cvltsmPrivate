/**
 * Pixel painting primitives.
 *
 * Everything draws on integer coordinates with fillRect or raw ImageData —
 * canvas path filling is avoided because it anti-aliases, which would smear
 * the pixel grid the moment the framebuffer is upscaled.
 */

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------------ colour */

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function rgbToHex(r, g, b) {
  const c = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Blend two hex colours. t=0 -> a, t=1 -> b. */
export function mix(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
export function shade(hex, amt) {
  return amt >= 0 ? mix(hex, '#ffffff', amt) : mix(hex, '#000000', -amt);
}

/** Hex colour as an rgba() string with explicit alpha. */
export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/* ----------------------------------------------------------------- canvas */

/** Offscreen pixel buffer with smoothing disabled. */
export function surface(w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w));
  cv.height = Math.max(1, Math.ceil(h));
  const ctx = cv.getContext('2d', { alpha: true });
  ctx.imageSmoothingEnabled = false;
  return { canvas: cv, ctx, w: cv.width, h: cv.height };
}

/* ------------------------------------------------------------- primitives */

export function rect(c, x, y, w, h, col) {
  if (w <= 0 || h <= 0) return;
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

export function px(c, x, y, col) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), 1, 1);
}

export function hline(c, x0, x1, y, col) {
  const a = Math.round(Math.min(x0, x1));
  const b = Math.round(Math.max(x0, x1));
  c.fillStyle = col;
  c.fillRect(a, Math.round(y), b - a + 1, 1);
}

export function vline(c, x, y0, y1, col) {
  const a = Math.round(Math.min(y0, y1));
  const b = Math.round(Math.max(y0, y1));
  c.fillStyle = col;
  c.fillRect(Math.round(x), a, 1, b - a + 1);
}

/** Bresenham line with optional square thickness. */
export function line(c, x0, y0, x1, y1, col, thick = 1) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const xe = Math.round(x1);
  const ye = Math.round(y1);
  const dx = Math.abs(xe - x);
  const dy = -Math.abs(ye - y);
  const sx = x < xe ? 1 : -1;
  const sy = y < ye ? 1 : -1;
  let err = dx + dy;
  c.fillStyle = col;
  const o = thick >> 1;
  for (;;) {
    c.fillRect(x - o, y - o, thick, thick);
    if (x === xe && y === ye) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

/**
 * Scanline polygon fill. Integer spans only — this is what keeps silhouettes
 * (mountains, trunks, the Jotunn) crisp instead of feathered.
 */
export function fillPoly(c, pts, col) {
  if (pts.length < 3) return;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  c.fillStyle = col;
  const xs = [];
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    xs.length = 0;
    const sy = y + 0.5;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if ((yi > sy) !== (yj > sy)) xs.push(xi + ((sy - yi) / (yj - yi)) * (xj - xi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.round(xs[k]);
      const b = Math.round(xs[k + 1]);
      if (b > a) c.fillRect(a, y, b - a, 1);
    }
  }
}

/** Filled disc built from integer scanlines (no AA edge). */
export function disc(c, cx, cy, r, col) {
  c.fillStyle = col;
  const R = Math.round(r);
  for (let y = -R; y <= R; y++) {
    const w = Math.floor(Math.sqrt(Math.max(0, R * R - y * y)));
    if (w > 0) c.fillRect(Math.round(cx) - w, Math.round(cy) + y, w * 2, 1);
  }
}

/**
 * Draw an element at x, and again across the tile seam when it sits near an
 * edge — this is what makes a generated strip repeat forever without a join.
 * `pad` should cover the widest the element can reach from its anchor.
 */
export function wrapX(W, x, pad, fn) {
  fn(x);
  if (x < pad) fn(x + W);
  else if (x > W - pad) fn(x - W);
}

/* ------------------------------------------------------------ pixel buffer */

/**
 * Per-pixel callback over a region using ImageData — far cheaper than a
 * fillRect per pixel for gradients, noise fields and fog.
 * fn(x, y) must return [r, g, b, a] or null to leave the pixel untouched.
 */
export function shadeRegion(c, x, y, w, h, fn) {
  const X = Math.max(0, Math.round(x));
  const Y = Math.max(0, Math.round(y));
  const W = Math.round(w);
  const H = Math.round(h);
  if (W <= 0 || H <= 0) return;
  const img = c.getImageData(X, Y, W, H);
  const d = img.data;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const out = fn(X + i, Y + j);
      if (!out) continue;
      const k = (j * W + i) * 4;
      const a = out[3] === undefined ? 255 : out[3];
      if (a >= 255) {
        d[k] = out[0]; d[k + 1] = out[1]; d[k + 2] = out[2]; d[k + 3] = 255;
      } else {
        const t = a / 255;
        const base = d[k + 3] / 255;
        d[k] = d[k] * (1 - t) + out[0] * t;
        d[k + 1] = d[k + 1] * (1 - t) + out[1] * t;
        d[k + 2] = d[k + 2] * (1 - t) + out[2] * t;
        d[k + 3] = Math.max(d[k + 3], 255 * (t + base * (1 - t)));
      }
    }
  }
  c.putImageData(img, X, Y);
}

/** 4x4 Bayer matrix — ordered dithering keeps gradients from banding. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
export const bayer = (x, y) => BAYER[((y % 4) + 4) % 4][((x % 4) + 4) % 4] / 16 - 0.5;

/**
 * Vertical gradient, quantised and ordered-dithered so it reads as pixel art
 * rather than a smooth CSS ramp.
 * stops: [[t, '#hex'], ...] sorted by t.
 */
export function vgrad(c, x, y, w, h, stops, levels = 26) {
  const rgbStops = stops.map(([t, col]) => [t, hexToRgb(col)]);
  shadeRegion(c, x, y, w, h, (ix, iy) => {
    const t = clamp((iy - y) / Math.max(1, h - 1), 0, 1);
    let i = 0;
    while (i < rgbStops.length - 2 && t > rgbStops[i + 1][0]) i++;
    const [t0, c0] = rgbStops[i];
    const [t1, c1] = rgbStops[i + 1];
    const f = clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1);
    const d = bayer(ix, iy) * (255 / levels);
    return [
      lerp(c0[0], c1[0], f) + d,
      lerp(c0[1], c1[1], f) + d,
      lerp(c0[2], c1[2], f) + d,
      255,
    ];
  });
}

/* ----------------------------------------------------------------- light */

/**
 * Additive radial bloom. Drawn into the low-res buffer, so the falloff is
 * itself pixelated once the frame is scaled up — exactly the chunky glow
 * a CRT-era renderer would give you.
 */
export function glow(c, cx, cy, r, col, alpha = 1, mode = 'lighter') {
  if (r <= 0 || alpha <= 0) return;
  const prev = c.globalCompositeOperation;
  c.globalCompositeOperation = mode;
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgba(col, 0.62 * alpha));
  g.addColorStop(0.3, rgba(col, 0.17 * alpha));
  g.addColorStop(0.62, rgba(col, 0.04 * alpha));
  g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g;
  c.fillRect(cx - r, cy - r, r * 2, r * 2);
  c.globalCompositeOperation = prev;
}

/** Soft elliptical pool of light on the ground. */
export function glowEllipse(c, cx, cy, rx, ry, col, alpha = 1) {
  const prev = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  c.save();
  c.translate(cx, cy);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgba(col, 0.42 * alpha));
  g.addColorStop(0.45, rgba(col, 0.14 * alpha));
  g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g;
  c.fillRect(-rx, -rx, rx * 2, rx * 2);
  c.restore();
  c.globalCompositeOperation = prev;
}
