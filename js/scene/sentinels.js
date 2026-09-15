/**
 * LAYER 3 — Ancient sentinel pines & glowing runes.  Parallax 0.45
 *
 * The colossal trunks that flank the frame. Their bark is etched with stacked
 * vertical rune columns; the carvings are baked into the trunk as dark
 * grooves, and the light that fills them is painted live every frame so the
 * glow breathes and spills red onto the surrounding bark.
 */
import { makeRng } from '../lib/rng.js';
import { surface, line, mix, shade, clamp, glow } from '../lib/paint.js';
import { PAL } from '../palette.js';
import { drawGreatTrunk, drawPine } from './trees.js';
import { RUNES, WHEEL, drawGlyph } from '../runes.js';

export function buildSentinels(W, H, L, seed) {
  const rng = makeRng(seed);
  const s = surface(W, H);
  const c = s.ctx;

  const baseY = L.groundY + L.vh * 0.04;
  const scale = Math.max(1, Math.round(L.vh / 300));

  /* -------- two unlit trunks sitting a little deeper into the gloom ------- */
  for (const spec of [
    { x: L.vx(0.18), hw: L.vw * 0.016, tint: 0.55 },
    { x: L.vx(0.63), hw: L.vw * 0.013, tint: 0.65 },
    { x: L.vx(0.72), hw: L.vw * 0.010, tint: 0.72 },
  ]) {
    drawGreatTrunk(c, {
      x: spec.x, top: -H * 0.05, baseY: baseY - H * 0.02, halfWidth: spec.hw, rng,
      base: mix(PAL.bark, PAL.mist, spec.tint * 0.5),
      lit: mix(PAL.barkLit, PAL.mist, spec.tint * 0.5),
      dark: mix(PAL.barkDark, PAL.mist, spec.tint * 0.35),
    });
  }

  /* --------------------------------- the three carved sentinels ---------- */
  const columns = [];
  const trunks = [
    { x: L.vx(0.035), hw: L.vw * 0.046, runes: 0, wheel: false },
    { x: L.vx(0.30), hw: L.vw * 0.030, runes: 6, wheel: false },
    { x: L.vx(0.875), hw: L.vw * 0.042, runes: 5, wheel: true },
  ];

  for (const spec of trunks) {
    drawGreatTrunk(c, {
      x: spec.x, top: -H * 0.08, baseY, halfWidth: spec.hw, rng,
      base: PAL.bark, lit: PAL.barkLit, dark: PAL.barkDark, frost: PAL.frostDeep,
    });
    // a few snow-laden stubs where branches were torn away
    for (let i = 0; i < 3; i++) {
      const y = rng.range(L.vy(0.05), L.vy(0.5));
      const dir = rng.chance(0.5) ? -1 : 1;
      line(c, spec.x + dir * spec.hw * 0.8, y,
        spec.x + dir * spec.hw * rng.range(1.6, 2.6), y - rng.range(2, 9),
        shade(PAL.bark, -0.4), 2);
    }
    if (spec.runes > 0) {
      columns.push(carveColumn(c, rng, spec, L, scale));
    }
    if (spec.wheel) {
      columns.push(carveWheel(c, rng, spec, L, scale));
    }
  }

  /* -------- canopy shadow: the sentinels' crowns block the upper frame ---- */
  for (const spec of trunks) {
    drawPine(c, {
      x: spec.x, baseY: L.vy(0.14), height: L.vh * 0.42, halfWidth: spec.hw * 3.6,
      color: mix(PAL.voidBlack, PAL.bark, 0.35),
      snowColor: mix(PAL.frostDeep, PAL.bark, 0.4), snowAmount: 0.12,
      rng, trunk: false,
    });
  }

  return {
    canvas: s.canvas,
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
          const core = mix(PAL.crimsonDim, PAL.crimsonHot, gk);
          glow(ctx, ox + col.x, oy + g.y + (g.h * col.scale) / 2, col.bloom * (0.8 + gk * 0.6),
            PAL.crimson, 0.16 + gk * 0.38);
          drawGlyph(ctx, g.glyph, ox + col.x - (g.w * col.scale) / 2, oy + g.y, core, col.scale);
        }
      }
    },
  };
}

/** Etch a stack of runes into a trunk; returns the live-draw descriptor. */
function carveColumn(c, rng, spec, L, scale) {
  const glyphs = [];
  const top = L.vy(rng.range(0.03, 0.11));
  const gap = Math.round(3 * scale);
  let y = top;
  const count = spec.runes;
  const groove = mix(PAL.barkDark, PAL.crimsonDeep, 0.45);
  const lip = mix(PAL.barkLit, PAL.crimsonDeep, 0.25);

  for (let i = 0; i < count; i++) {
    const glyph = RUNES[rng.int(0, RUNES.length - 1)];
    const gx = spec.x - (glyph.w * scale) / 2;
    // carve: a dark groove with a lit lower lip, so it reads as cut into bark
    drawGlyph(c, glyph, gx, y + 1, lip, scale);
    drawGlyph(c, glyph, gx, y, groove, scale);
    glyphs.push({ glyph, y, w: glyph.w, h: glyph.h, lag: i * 0.55 });
    y += glyph.h * scale + gap;
  }

  return {
    x: spec.x,
    scale,
    glyphs,
    phase: rng.range(0, Math.PI * 2),
    midY: (top + y) / 2,
    bloom: Math.max(6, spec.hw * 1.05),
    spill: Math.max(14, spec.hw * 2.6),
  };
}

/** The sun-wheel medallion plus runes beneath it, as on the right sentinel. */
function carveWheel(c, rng, spec, L, scale) {
  const glyphs = [];
  const groove = mix(PAL.barkDark, PAL.crimsonDeep, 0.45);
  const lip = mix(PAL.barkLit, PAL.crimsonDeep, 0.25);
  const wheelTop = L.vy(0.24);
  let y = wheelTop;

  const wx = spec.x - (WHEEL.w * scale) / 2;
  drawGlyph(c, WHEEL, wx, y + 1, lip, scale);
  drawGlyph(c, WHEEL, wx, y, groove, scale);
  glyphs.push({ glyph: WHEEL, y, w: WHEEL.w, h: WHEEL.h, lag: 0 });
  y += WHEEL.h * scale + 4 * scale;

  for (let i = 0; i < 4; i++) {
    const glyph = RUNES[rng.int(0, RUNES.length - 1)];
    const gx = spec.x - (glyph.w * scale) / 2;
    drawGlyph(c, glyph, gx, y + 1, lip, scale);
    drawGlyph(c, glyph, gx, y, groove, scale);
    glyphs.push({ glyph, y, w: glyph.w, h: glyph.h, lag: (i + 1) * 0.5 });
    y += glyph.h * scale + 3 * scale;
  }

  return {
    x: spec.x,
    scale,
    glyphs,
    phase: rng.range(0, Math.PI * 2),
    midY: wheelTop + (y - wheelTop) / 2,
    bloom: Math.max(7, spec.hw * 1.1),
    spill: Math.max(16, spec.hw * 2.7),
  };
}
