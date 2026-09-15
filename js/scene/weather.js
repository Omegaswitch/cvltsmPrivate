/**
 * LAYER 6 — Global atmospheric overlay.  Fixed / independent of parallax.
 *
 * Slanted pixel rain across the whole viewport plus low horizontal fog banks
 * drifting through the bottom third. Drawn straight into the low-res
 * framebuffer so the rain stays exactly one pixel wide after upscaling.
 */
import { makeRng, fbm2d } from '../lib/rng.js';
import { surface, rgba, shadeRegion, hexToRgb, clamp } from '../lib/paint.js';
import { PAL } from '../palette.js';

/** Three depth bands: far rain is dim and slow, near rain is bright and fast. */
const BANDS = [
  { alpha: 0.14, speed: 150, len: [3, 7], count: 0.45, slant: -0.24 },
  { alpha: 0.24, speed: 235, len: [6, 11], count: 0.35, slant: -0.27 },
  { alpha: 0.40, speed: 340, len: [9, 18], count: 0.20, slant: -0.30 },
];

export function buildWeather(W, H, seed) {
  const rng = makeRng(seed);

  /* ------------------------------------------------------------- rain */
  const density = clamp((W * H) / 4200, 110, 520);
  const drops = [];
  for (const band of BANDS) {
    const n = Math.round(density * band.count);
    for (let i = 0; i < n; i++) {
      drops.push({
        x: rng.range(-W * 0.2, W * 1.1),
        y: rng.range(-H, H),
        len: rng.range(band.len[0], band.len[1]),
        speed: band.speed * rng.range(0.85, 1.15),
        slant: band.slant,
        alpha: band.alpha * rng.range(0.7, 1.25),
      });
    }
  }
  // group by alpha so the draw loop changes fillStyle a handful of times
  drops.sort((a, b) => a.alpha - b.alpha);

  /* -------------------------------------------------------------- fog */
  const fogBanks = [
    { strip: makeFog(W, Math.round(H * 0.20), seed + 3, 0.30), y: 0.80, speed: 7 },
    { strip: makeFog(W, Math.round(H * 0.16), seed + 7, 0.24), y: 0.88, speed: 12 },
    { strip: makeFog(W, Math.round(H * 0.13), seed + 13, 0.18), y: 0.70, speed: 4.5 },
  ];

  let splashes = [];

  return {
    /**
     * @param intensity 0..1 — lets the UI dial the storm down without a rebuild.
     */
    draw(c, t, dt, W2, H2, opts = {}) {
      const intensity = opts.intensity === undefined ? 1 : opts.intensity;
      const still = opts.reducedMotion;

      /* ------------------------------------------------------- fog first */
      for (const bank of fogBanks) {
        const off = still ? 0 : ((t * bank.speed) % W2 + W2) % W2;
        const y = Math.round(H2 * bank.y - bank.strip.height * 0.5 + (still ? 0 : Math.sin(t * 0.12 + bank.speed) * H2 * 0.006));
        c.drawImage(bank.strip, Math.round(-off), y);
        c.drawImage(bank.strip, Math.round(-off + bank.strip.width), y);
      }

      if (intensity <= 0.001) return;

      /* ------------------------------------------------------------ rain */
      let lastAlpha = -1;
      for (const d of drops) {
        if (!still) {
          d.y += d.speed * dt;
          d.x += d.speed * d.slant * dt;
          if (d.y > H2 + d.len) {
            d.y = -d.len - Math.random() * H2 * 0.2;
            d.x = Math.random() * (W2 * 1.35) - W2 * 0.25;
            if (splashes.length < 70 && Math.random() < 0.25) {
              splashes.push({ x: d.x, y: H2 * (0.72 + Math.random() * 0.28), life: 0.35 });
            }
          }
          if (d.x < -W2 * 0.3) d.x += W2 * 1.4;
        }
        const a = d.alpha * intensity;
        if (a !== lastAlpha) {
          c.fillStyle = rgba(PAL.frost, a);
          lastAlpha = a;
        }
        // step the streak pixel by pixel: one px wide, hard edged
        const steps = Math.round(d.len);
        for (let i = 0; i < steps; i++) {
          c.fillRect(Math.round(d.x + i * d.slant), Math.round(d.y - i), 1, 1);
        }
      }

      /* ------------------------------------------ splash ticks on impact */
      if (!still && splashes.length) {
        c.fillStyle = rgba(PAL.frostMid, 0.22 * intensity);
        splashes = splashes.filter((s) => {
          s.life -= dt;
          if (s.life <= 0) return false;
          const r = (1 - s.life / 0.35) * 3;
          c.fillRect(Math.round(s.x - r), Math.round(s.y), 1, 1);
          c.fillRect(Math.round(s.x + r), Math.round(s.y), 1, 1);
          return true;
        });
      }
    },
  };
}

/** A horizontally tiling fog bank. */
function makeFog(W, H, seed, alpha) {
  const rng = makeRng(seed);
  const s = surface(W, H);
  const n = fbm2d(rng, 90, 3);
  const rgb = hexToRgb(PAL.mistPale);
  shadeRegion(s.ctx, 0, 0, W, H, (x, y) => {
    const seam = Math.min(1, Math.min(x, W - x) / (W * 0.15));
    const vert = Math.pow(Math.sin((y / H) * Math.PI), 0.8);
    const v = n(x, y * 4.5);
    const a = clamp((v - 0.40) * 2.1, 0, 1) * vert * seam * alpha * 255;
    return a < 3 ? null : [rgb[0], rgb[1], rgb[2], a];
  });
  return s.canvas;
}
