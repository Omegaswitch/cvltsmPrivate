/**
 * LAYER 3 — Ancient sentinel pines & glowing runes.  Parallax 0.45
 *
 * The colossal trunks the road runs between. Their bark is etched with stacked
 * vertical rune columns; the carvings are baked into the trunk as dark
 * grooves, and the light that fills them is painted live every frame so the
 * glow breathes and spills red onto the surrounding bark.
 *
 * Trunks are distributed along a tiling strip and every one is drawn through
 * wrapX, so the colonnade continues for as long as you keep walking.
 *
 * The crowns are baked into a SEPARATE surface which the engine draws after
 * the live rune pass. Otherwise the glow — painted after the layer canvas —
 * would spill straight over the foliage hanging in front of it.
 */
import { makeRng } from '../lib/rng.js';
import { surface, line, wrapX, mix, shade, clamp, glow } from '../lib/paint.js';
import { PAL } from '../palette.js';
import { drawGreatTrunk, drawPine } from './trees.js';
import { RUNES, WHEEL, drawGlyph } from '../runes.js';

export function buildSentinels(L, seed) {
  const { W, H, sw } = L;
  const rng = makeRng(seed);
  const s = surface(W, H);
  const c = s.ctx;
  // crowns live here, drawn on top of the rune glow
  const crowns = surface(W, H);
  const cc = crowns.ctx;

  const baseY = L.groundY + L.vh * 0.04;
  const scale = Math.max(1, Math.round(L.vh / 300));
  const columns = [];

  /* -------- trunks sitting a little deeper into the gloom ------- */
  for (const spec of [
    { t: 0.09, hw: sw * 0.016, tint: 0.55 },
    { t: 0.37, hw: sw * 0.013, tint: 0.65 },
    { t: 0.61, hw: sw * 0.010, tint: 0.72 },
    { t: 0.84, hw: sw * 0.014, tint: 0.60 },
  ]) {
    const x = L.tx(spec.t);
    const seedN = Math.floor(rng() * 0xffffff);
    wrapX(W, x, spec.hw * 4, (sx) => {
      drawGreatTrunk(c, {
        x: sx, top: -L.vh * 0.05, baseY: baseY - L.vh * 0.02, halfWidth: spec.hw,
        rng: makeRng(seedN),
        base: mix(PAL.bark, PAL.mist, spec.tint * 0.5),
        lit: mix(PAL.barkLit, PAL.mist, spec.tint * 0.5),
        dark: mix(PAL.barkDark, PAL.mist, spec.tint * 0.35),
      });
    });
  }

  /* --------------------------------- the carved sentinels ---------- */
  const trunks = [
    { t: 0.025, hw: sw * 0.046, runes: 0, wheel: false },
    { t: 0.20, hw: sw * 0.030, runes: 6, wheel: false },
    { t: 0.50, hw: sw * 0.042, runes: 0, wheel: false },
    { t: 0.71, hw: sw * 0.034, runes: 5, wheel: true },
    { t: 0.93, hw: sw * 0.038, runes: 4, wheel: false },
  ];

  for (const spec of trunks) {
    const x = L.tx(spec.t);
    const seedN = Math.floor(rng() * 0xffffff);
    const pad = spec.hw * 4.2;

    wrapX(W, x, pad, (sx) => {
      const r = makeRng(seedN);
      drawGreatTrunk(c, {
        x: sx, top: -L.vh * 0.08, baseY, halfWidth: spec.hw, rng: r,
        base: PAL.bark, lit: PAL.barkLit, dark: PAL.barkDark, frost: PAL.frostDeep,
      });
      for (let i = 0; i < 3; i++) {
        const y = r.range(L.vy(0.05), L.vy(0.5));
        const dir = r.chance(0.5) ? -1 : 1;
        line(c, sx + dir * spec.hw * 0.8, y,
          sx + dir * spec.hw * r.range(1.6, 2.6), y - r.range(2, 9),
          shade(PAL.bark, -0.4), 2);
      }
      // canopy shadow from this trunk's crown — onto the overlay surface
      drawPine(cc, {
        x: sx, baseY: L.vy(0.14), height: L.vh * 0.42, halfWidth: spec.hw * 3.6,
        color: mix(PAL.voidBlack, PAL.bark, 0.35),
        snowColor: mix(PAL.frostDeep, PAL.bark, 0.4), snowAmount: 0.12,
        rng: makeRng(seedN + 1), trunk: false,
      });

      if (spec.runes > 0) {
        columns.push(carve(c, makeRng(seedN + 2), sx, spec, L, scale, false));
      }
      if (spec.wheel) {
        columns.push(carve(c, makeRng(seedN + 3), sx, spec, L, scale, true));
      }
    });
  }

  return {
    canvas: s.canvas,
    /** Drawn by the engine after `over`, so foliage occludes the rune glow. */
    after: crowns.canvas,
    columns,
    over(ctx, t, ox, oy, opts) {
      const still = opts && opts.reducedMotion;
      for (const col of columns) {
        // slow breath, plus a faster shimmer so the light never sits flat
        const breath = still
          ? 0.72
          : 0.55 + Math.sin(t * 0.72 + col.phase) * 0.28 + Math.sin(t * 2.3 + col.phase * 2) * 0.07;
        const k = clamp(breath, 0.12, 1);

        // red light washing across the bark around the carvings
        glow(ctx, ox + col.x, oy + col.midY, col.spill, PAL.crimson, 0.10 + k * 0.20);

        for (const g of col.glyphs) {
          // each glyph lags the column breath slightly — the light travels up
          const gk = clamp(k * (0.72 + 0.4 * Math.sin(t * 0.72 + col.phase + g.lag)), 0.08, 1);
          glow(ctx, ox + col.x, oy + g.y + (g.h * col.scale) / 2, col.bloom * (0.8 + gk * 0.6),
            PAL.crimson, 0.16 + gk * 0.38);
          drawGlyph(ctx, g.glyph, ox + col.x - (g.w * col.scale) / 2, oy + g.y,
            mix(PAL.crimsonDim, PAL.crimsonHot, gk), col.scale);
        }
      }
    },
  };
}

/**
 * Etch a stack of runes into a trunk, optionally crowned with the sun wheel.
 * Returns the descriptor the live pass lights up.
 */
function carve(c, rng, x, spec, L, scale, wheel) {
  const glyphs = [];
  const groove = mix(PAL.barkDark, PAL.crimsonDeep, 0.45);
  const lip = mix(PAL.barkLit, PAL.crimsonDeep, 0.25);
  // start below the crown so the column reads on bare bark
  const top = wheel ? L.vy(0.26) : L.vy(rng.range(0.19, 0.30));
  let y = top;

  const cut = (glyph, lag) => {
    const gx = x - (glyph.w * scale) / 2;
    drawGlyph(c, glyph, gx, y + 1, lip, scale);
    drawGlyph(c, glyph, gx, y, groove, scale);
    glyphs.push({ glyph, y, w: glyph.w, h: glyph.h, lag });
    y += glyph.h * scale + 3 * scale;
  };

  if (wheel) cut(WHEEL, 0);
  for (let i = 0; i < spec.runes; i++) {
    cut(RUNES[rng.int(0, RUNES.length - 1)], (i + (wheel ? 1 : 0)) * 0.5);
  }

  return {
    x,
    scale,
    glyphs,
    phase: rng.range(0, Math.PI * 2),
    midY: top + (y - top) / 2,
    bloom: Math.max(6, spec.hw * 1.05),
    spill: Math.max(14, spec.hw * 2.6),
  };
}
