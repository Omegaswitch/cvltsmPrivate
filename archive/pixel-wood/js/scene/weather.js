/**
 * LAYER 6 — Fog, woven through the depth stack.
 *
 * Not an overlay. The fog is split into three depth bands which the engine
 * draws at three different points in the layer order: a high haze behind the
 * treeline, banks rolling over the road, and thin wisps crossing in front of
 * the foreground. So the sentinels and the deadfall sit *inside* the weather
 * rather than under a sheet laid over the finished frame.
 *
 * Every bank is a horizontally tiling strip drifting at its own fraction of
 * the walk, which keeps the near fog moving visibly faster than the far haze.
 */
import { makeRng, fbm2dTiling } from '../lib/rng.js';
import { surface, shadeRegion, hexToRgb, clamp } from '../lib/paint.js';
import { PAL } from '../palette.js';

/**
 * band: which pass draws it — 0 far (behind the trees), 1 mid (over the road),
 * 2 near (in front of everything).
 * y/height are fractions of the viewport; drift is a fraction of world travel.
 */
const BANKS = [
  { band: 0, y: 0.545, h: 0.30, alpha: 0.34, drift: 0.09, period: 150, sway: 0.004 },
  { band: 0, y: 0.60, h: 0.22, alpha: 0.26, drift: 0.14, period: 110, sway: 0.006 },

  { band: 1, y: 0.735, h: 0.26, alpha: 0.46, drift: 0.30, period: 120, sway: 0.007 },
  { band: 1, y: 0.815, h: 0.22, alpha: 0.40, drift: 0.46, period: 95, sway: 0.009 },
  { band: 1, y: 0.90, h: 0.20, alpha: 0.32, drift: 0.62, period: 80, sway: 0.010 },

  { band: 2, y: 0.88, h: 0.26, alpha: 0.36, drift: 1.05, period: 140, sway: 0.012 },
  { band: 2, y: 0.40, h: 0.34, alpha: 0.13, drift: 0.85, period: 190, sway: 0.010 },
];

export function buildWeather(vw, vh, seed) {
  const banks = BANKS.map((b, i) => ({
    ...b,
    strip: makeFog(vw, Math.max(8, Math.round(vh * b.h)), seed + i * 17, b.alpha, b.period),
  }));

  return {
    /** Draw one depth band of fog. Called from inside the layer stack. */
    drawFog(c, band, t, vh2, worldX, still) {
      for (const b of banks) {
        if (b.band !== band) continue;
        const off = still ? 0 : ((worldX * b.drift) % b.strip.width + b.strip.width) % b.strip.width;
        const y = Math.round(vh2 * b.y - b.strip.height * 0.5
          + (still ? 0 : Math.sin(t * 0.11 + b.period) * vh2 * b.sway));
        c.drawImage(b.strip, Math.round(-off), y);
        c.drawImage(b.strip, Math.round(-off + b.strip.width), y);
      }
    },
  };
}

/** A horizontally tiling bank of fog. */
function makeFog(W, H, seed, alpha, period) {
  const rng = makeRng(seed);
  const s = surface(W, H);
  const n = fbm2dTiling(rng, W, period, 3);
  const rgb = hexToRgb(PAL.mistPale);
  shadeRegion(s.ctx, 0, 0, W, H, (x, y) => {
    // soft top and bottom so a bank never shows an edge
    const vert = Math.pow(Math.sin((y / H) * Math.PI), 0.75);
    const a = clamp((n(x, y * 3.6) - 0.36) * 2.0, 0, 1) * vert * alpha * 255;
    return a < 3 ? null : [rgb[0], rgb[1], rgb[2], a];
  });
  return s.canvas;
}
