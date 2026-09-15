/**
 * LAYER 6 — Weather, woven through the depth stack.
 *
 * The rain is NOT an overlay. It is split into three depth bands which the
 * engine draws at three different points in the layer order: the far band
 * behind the treeline, the mid band in front of the road, the near band in
 * front of everything. So the sentinels and the foreground occlude rain the
 * same way they occlude anything else, and the near streaks fly past far
 * faster than the distant ones.
 *
 * Every streak is stepped out pixel by pixel into the low-resolution
 * framebuffer, so it stays exactly one pixel wide after the integer upscale.
 */
import { makeRng, fbm2dTiling } from '../lib/rng.js';
import { surface, rgba, shadeRegion, hexToRgb, clamp } from '../lib/paint.js';
import { PAL } from '../palette.js';

/** Far to near. `depth` scales how much the walker's own travel drags them. */
const BANDS = [
  { alpha: 0.13, speed: 150, len: [3, 7], count: 0.40, slant: -0.24, depth: 0.30 },
  { alpha: 0.22, speed: 240, len: [6, 12], count: 0.34, slant: -0.27, depth: 0.75 },
  { alpha: 0.38, speed: 350, len: [9, 19], count: 0.26, slant: -0.30, depth: 1.35 },
];

export function buildWeather(vw, vh, seed) {
  const rng = makeRng(seed);
  const density = clamp((vw * vh) / 4200, 110, 520);

  const bands = BANDS.map((band) => {
    const drops = [];
    const n = Math.round(density * band.count);
    for (let i = 0; i < n; i++) {
      drops.push({
        x: rng.range(-vw * 0.2, vw * 1.2),
        y: rng.range(-vh, vh),
        len: rng.range(band.len[0], band.len[1]),
        speed: band.speed * rng.range(0.85, 1.15),
        alpha: band.alpha * rng.range(0.75, 1.2),
      });
    }
    drops.sort((a, b) => a.alpha - b.alpha);
    return { ...band, drops };
  });

  const fogBanks = [
    { strip: makeFog(vw, Math.round(vh * 0.20), seed + 3, 0.30), y: 0.80, speed: 0.22 },
    { strip: makeFog(vw, Math.round(vh * 0.16), seed + 7, 0.24), y: 0.88, speed: 0.34 },
    { strip: makeFog(vw, Math.round(vh * 0.13), seed + 13, 0.18), y: 0.70, speed: 0.15 },
  ];

  return {
    /** Draw one depth band of rain. Called from inside the layer stack. */
    drawRain(c, index, t, dt, w, h, opts = {}) {
      const intensity = opts.intensity === undefined ? 1 : opts.intensity;
      if (intensity <= 0.001) return;
      const band = bands[index];
      const still = opts.reducedMotion;
      const drag = (opts.worldSpeed || 0) * band.depth;

      let lastAlpha = -1;
      for (const d of band.drops) {
        if (!still) {
          d.y += d.speed * dt;
          // slant from the wind, plus the apparent drift of walking into it
          d.x += (d.speed * band.slant - drag) * dt;
          if (d.y > h + d.len) {
            d.y = -d.len - Math.random() * h * 0.2;
            d.x = Math.random() * (w * 1.4) - w * 0.2;
          }
          if (d.x < -w * 0.3) d.x += w * 1.5;
        }
        const a = d.alpha * intensity;
        if (a !== lastAlpha) {
          c.fillStyle = rgba(PAL.frost, a);
          lastAlpha = a;
        }
        const steps = Math.round(d.len);
        for (let i = 0; i < steps; i++) {
          c.fillRect(Math.round(d.x + i * band.slant), Math.round(d.y - i), 1, 1);
        }
      }
    },

    /** Low fog banks, drifting with the walk. */
    drawFog(c, t, w, h, worldX, still) {
      for (const bank of fogBanks) {
        const off = still ? 0 : ((worldX * bank.speed) % w + w) % w;
        const y = Math.round(h * bank.y - bank.strip.height * 0.5
          + (still ? 0 : Math.sin(t * 0.12 + bank.speed) * h * 0.006));
        c.drawImage(bank.strip, Math.round(-off), y);
        c.drawImage(bank.strip, Math.round(-off + bank.strip.width), y);
      }
    },
  };
}

/** A horizontally tiling fog bank. */
function makeFog(W, H, seed, alpha) {
  const rng = makeRng(seed);
  const s = surface(W, H);
  const n = fbm2dTiling(rng, W, 90, 3);
  const rgb = hexToRgb(PAL.mistPale);
  shadeRegion(s.ctx, 0, 0, W, H, (x, y) => {
    const vert = Math.pow(Math.sin((y / H) * Math.PI), 0.8);
    const a = clamp((n(x, y * 4.5) - 0.40) * 2.1, 0, 1) * vert * alpha * 255;
    return a < 3 ? null : [rgb[0], rgb[1], rgb[2], a];
  });
  return s.canvas;
}
