/**
 * LAYER 4 — The road, the water & the bridges.  Parallax 0.7
 *
 * Frozen moss and mud over a dark stream, rickety log bridges, snow-caked
 * scrub. Generated as a tiling strip: the bank profile closes on itself and
 * every prop is drawn through wrapX, so the ground streams past the walker
 * without a join.
 *
 * The water carries horizontal scanline ripples that reflect the lantern and
 * the rune columns standing behind it.
 *
 * Anything rooted NEARER than the walk line goes onto a second surface which
 * the engine composites after the walkers. Baked into one canvas the whole
 * layer sits behind them, and they tramp over the top of bushes that are
 * plainly in front of them.
 */
import { makeRng, ridgeline, fbm2dTiling } from '../lib/rng.js';
import {
  surface, rect, hline, vline, px, line, wrapX,
  mix, shade, clamp, lerp, glowEllipse, rgba, shadeRegion, hexToRgb,
} from '../lib/paint.js';
import { PAL } from '../palette.js';
import { drawPine } from './trees.js';

const TAU = Math.PI * 2;

export function buildPath(L, seed) {
  const { W, H, sw } = L;
  const rng = makeRng(seed);
  const s = surface(W, H);
  const c = s.ctx;
  // undergrowth rooted closer to the camera than the walkers
  const nearSurface = surface(W, H);
  const fc = nearSurface.ctx;
  const walkY = L.pathY + L.vh * 0.012;
  const layerFor = (y) => (y > walkY + L.vh * 0.004 ? fc : c);

  /* -------- bank profile: periodic, so the ground can repeat forever ----- */
  const bankTop = ridgeline(rng, W, L.groundY, L.groundY, L.vh * 0.030, 0.52);
  for (let x = 0; x < W; x++) {
    const u = (x / W) * TAU;
    bankTop[x] += Math.sin(u * 3) * L.vh * 0.022
      + Math.sin(u * 11 + 1.7) * L.vh * 0.010
      + Math.sin(u * 27) * L.vh * 0.004;
  }

  drawWater(c, rng, W, H, L);

  /* ------------------------------------------------------- bank & floor */
  for (let x = 0; x < W; x++) vline(c, x, Math.round(bankTop[x]), L.waterY + 1, PAL.soil);

  const n = fbm2dTiling(rng, W, 26, 3);
  const moss = hexToRgb(PAL.moss);
  const mud = hexToRgb(mix(PAL.soil, PAL.barkMid, 0.5));
  const mottleTop = Math.round(L.groundY - L.vh * 0.04);
  shadeRegion(c, 0, mottleTop, W, Math.round(L.waterY - mottleTop + L.vh * 0.01), (x, y) => {
    if (y < bankTop[clamp(x, 0, W - 1)]) return null;
    const v = n(x, y * 1.8);
    if (v > 0.56) return [moss[0], moss[1], moss[2], (v - 0.56) * 420];
    if (v < 0.4) return [mud[0], mud[1], mud[2], (0.4 - v) * 300];
    return null;
  });

  /* ---------------------------------------------- frost crust on the bank */
  for (let x = 0; x < W; x += rng.int(5, 20)) {
    const run = rng.int(2, 7);
    const tone = mix(PAL.frost, PAL.soil, rng.range(0.45, 0.72));
    for (let i = 0; i < run; i++) {
      const xx = (x + i) % W;
      const top = Math.round(bankTop[xx]);
      const slope = bankTop[(xx + 1) % W] - bankTop[(xx - 1 + W) % W];
      if (Math.abs(slope) > 1.1 && rng.chance(0.6)) continue;
      px(c, xx, top, tone);
      if (rng.chance(0.35)) px(c, xx, top + 1, mix(PAL.frostDeep, PAL.soil, 0.72));
    }
  }

  // snow patches caught in hollows
  for (let i = 0; i < Math.round(W / 26); i++) {
    const x0 = rng.range(0, W);
    const w = rng.range(L.vh * 0.02, L.vh * 0.09);
    const y = rng.range(L.groundY + L.vh * 0.015, L.waterY - L.vh * 0.015);
    const tone = mix(PAL.soil, PAL.frostDeep, rng.range(0.35, 0.75));
    wrapX(W, x0, w + 2, (sx) => {
      for (let k = 0; k < w; k++) {
        rect(c, sx + k, y, 1, Math.max(1, Math.round(Math.sin((k / w) * Math.PI) * 2.2)), tone);
      }
    });
  }

  /* -------------------------------------------------------- the trail */
  const trail = mix(PAL.soil, PAL.barkMid, 0.30);
  for (let x = 0; x < W; x++) {
    const u = (x / W) * TAU;
    const y = L.pathY + Math.sin(u * 5) * L.vh * 0.006;
    const h = L.vh * 0.014 + Math.sin(u * 13) * L.vh * 0.003;
    rect(c, x, y, 1, h, trail);
    if (rng.chance(0.4)) px(c, x, y + rng.range(0, h), mix(trail, PAL.voidBlack, 0.55));
    if (rng.chance(0.07)) px(c, x, y, mix(PAL.frostDeep, trail, 0.55));
  }

  /* ------------------------------------------- planks laid over the mud */
  for (let i = 0; i < Math.round(W / 90); i++) {
    const x = rng.range(0, W);
    const y = L.pathY + rng.range(-L.vh * 0.004, L.vh * 0.016);
    const w = rng.range(L.vh * 0.045, L.vh * 0.12);
    const h = Math.max(2, Math.round(L.vh * 0.008));
    const sd = Math.floor(rng() * 0xffffff);
    wrapX(W, x, w + 4, (sx) => drawPlank(c, makeRng(sd), sx, y, w, h));
  }

  /* ------------------------------------------- rocks & frozen grass tufts */
  for (let i = 0; i < Math.round(W / 30); i++) {
    const x = rng.range(0, W);
    const y = rng.range(L.pathY + L.vh * 0.012, L.waterY - L.vh * 0.008);
    const w = rng.range(L.vh * 0.008, L.vh * 0.028);
    const h = w * rng.range(0.4, 0.75);
    const stone = mix(PAL.soil, PAL.frostShadow, rng.range(0.2, 0.5));
    const sd = Math.floor(rng() * 0xffffff);
    const g = layerFor(y);
    wrapX(W, x, w + 3, (sx) => {
      const r = makeRng(sd);
      for (let k = -w; k <= w; k++) {
        const t = k / w;
        vline(g, sx + k, y - Math.sqrt(Math.max(0, 1 - t * t)) * h, y + h * 0.2, stone);
        if (t < 0.35 && r.chance(0.55)) {
          px(g, sx + k, y - Math.sqrt(Math.max(0, 1 - t * t)) * h, mix(PAL.frost, stone, 0.45));
        }
      }
    });
  }
  for (let i = 0; i < Math.round(W / 16); i++) {
    const x = rng.range(0, W);
    const y = rng.range(L.groundY + L.vh * 0.03, L.waterY - L.vh * 0.01);
    const h = rng.range(L.vh * 0.008, L.vh * 0.026);
    const col = mix(PAL.soil, PAL.voidBlack, 0.35);
    const sd = Math.floor(rng() * 0xffffff);
    const g = layerFor(y);
    wrapX(W, x, h + 3, (sx) => {
      const r = makeRng(sd);
      for (let k = 0; k < r.int(3, 6); k++) {
        const lean = r.signed(h * 0.55);
        line(g, sx + r.signed(1.5), y, sx + lean, y - h * r.range(0.6, 1.1), col, 1);
        if (r.chance(0.3)) px(g, sx + lean, y - h, mix(PAL.frostDeep, col, 0.45));
      }
    });
  }

  /* --------------------------------------- debris: stumps and fallen logs */
  for (let i = 0; i < Math.round(W / 70); i++) {
    const x = rng.range(0, W);
    const y = rng.range(L.groundY + L.vh * 0.02, L.pathY - L.vh * 0.01);
    const sd = Math.floor(rng() * 0xffffff);
    wrapX(W, x, L.vh * 0.05, (sx) => drawStump(c, makeRng(sd), sx, y, L.vh));
  }
  for (let i = 0; i < Math.round(W / 120); i++) {
    const x = rng.range(0, W);
    const y = rng.range(L.pathY + L.vh * 0.02, L.waterY - L.vh * 0.012);
    const sd = Math.floor(rng() * 0xffffff);
    const g = layerFor(y);
    wrapX(W, x, L.vh * 0.2, (sx) => drawFallenLog(g, makeRng(sd), sx, y, L.vh));
  }

  /* --------------------------------------------------------- the bridges */
  for (const t of [0.30, 0.80]) {
    const span = sw * rng.range(0.28, 0.36);
    const b = { x0: L.tx(t), x1: L.tx(t) + span, y: L.waterY + L.vh * 0.045 };
    const sd = Math.floor(rng() * 0xffffff);
    wrapX(W, b.x0, span + L.vh * 0.1, (sx) => {
      drawBridge(c, makeRng(sd), { x0: sx, x1: sx + span, y: b.y }, L.vh);
    });
  }

  bakeReflections(c, rng, W, H, L);
  drawShrubs(c, fc, layerFor, rng, W, L, bankTop);

  /* ------------------------------------------------- mist over the stream */
  const mistRgb = hexToRgb(PAL.mistPale);
  const mistTop = Math.round(L.waterY - L.vh * 0.03);
  shadeRegion(c, 0, mistTop, W, Math.round(L.vh * 0.08), (x, y) => {
    const t = 1 - clamp(Math.abs(y - L.waterY) / (L.vh * 0.04), 0, 1);
    const a = t * n(x * 0.7, y * 4) * 195;
    return a < 4 ? null : [mistRgb[0], mistRgb[1], mistRgb[2], a];
  });

  return {
    canvas: s.canvas,
    /** Composited by the engine after the walkers, so they pass behind it. */
    front: nearSurface.canvas,
    over(ctx, t, ox, oy, shared) {
      const time = shared && shared.reducedMotion ? 6 : t;
      drawRipples(ctx, time, ox, oy, W, H, L);
      // reflections live in screen space, so only the first tile paints them
      if (shared && shared.tileIndex === 0) {
        drawLiveReflections(ctx, time, oy, W, H, L, shared);
      }
    },
  };
}

/* --------------------------------------------------------------- water */

function drawWater(c, rng, W, H, L) {
  const top = Math.round(L.waterY);
  rect(c, 0, top, W, H - top, PAL.water);
  for (let y = top; y < H; y++) {
    const t = (y - top) / (H - top);
    hline(c, 0, W, y, mix(mix(PAL.waterLit, PAL.voidBlack, 0.45), PAL.voidBlack, clamp(t * 1.15, 0, 1)));
  }
  // horizontal scanline structure — the water is read entirely in bands
  for (let y = top; y < H; y += 2) {
    const t = (y - top) / (H - top);
    if (!rng.chance(0.75)) continue;
    const len = rng.range(W * 0.02, W * 0.2);
    const x0 = rng.range(0, W);
    const col = mix(PAL.waterLit, PAL.water, 0.55 + t * 0.4);
    wrapX(W, x0, len + 2, (sx) => hline(c, sx, sx + len, y, col));
  }
  for (let x = 0; x < W; x++) {
    if (rng.chance(0.4)) px(c, x, top + rng.int(0, 1), mix(PAL.frostDeep, PAL.water, rng.range(0.45, 0.8)));
  }
}

/** Static mirror-image smears for the trunks standing over the stream. */
function bakeReflections(c, rng, W, H, L) {
  const top = Math.round(L.waterY);
  for (let i = 0; i < Math.round(W / 70); i++) {
    const x = rng.range(0, W);
    const w = Math.max(2, L.sw * 0.012);
    wrapX(W, x, w * 3, (sx) => {
      for (let y = top; y < H; y++) {
        const t = (y - top) / (H - top);
        if (!rng.chance(0.55 - t * 0.35)) continue;
        const wob = Math.sin(y * 0.5) * w * 0.35;
        hline(c, sx - w + wob, sx + w + wob, y, mix(PAL.voidBlack, PAL.water, 0.45));
      }
    });
  }
}

/** Live horizontal ripple scanlines drifting across the surface. */
function drawRipples(c, t, ox, oy, W, H, L) {
  const top = oy + L.waterY;
  const bottom = oy + H;
  for (let y = Math.round(top); y < bottom; y += 3) {
    const d = (y - top) / Math.max(1, bottom - top);
    const drift = Math.sin(t * 0.8 + y * 0.35) * (6 + d * 22);
    const len = L.sw * 0.05 + Math.sin(t * 0.5 + y) * L.sw * 0.03 + d * L.sw * 0.08;
    const x0 = ox + ((y * 53) % W) + drift;
    c.fillStyle = rgba(PAL.frostDeep, 0.10 + d * 0.06);
    c.fillRect(Math.round(x0), y, Math.round(len), 1);
    c.fillRect(Math.round(x0 - W * 0.4), y, Math.round(len * 0.6), 1);
  }
}

/** Rune light smeared across the moving water, tracking the trunks behind. */
function drawLiveReflections(c, t, oy, W, H, L, shared) {
  const top = oy + L.waterY;
  const depth = H - L.waterY;
  const cols = shared.runeColumns || [];

  for (const sx of shared.sentinelOffsets || []) {
    for (const col of cols) {
      const x = sx + col.x;
      if (x < -20 || x > L.sw + 20) continue;
      const k = clamp(0.55 + Math.sin(t * 0.72 + col.phase) * 0.28, 0.1, 1);
      for (let y = Math.round(top); y < oy + H; y += 2) {
        const d = (y - top) / depth;
        const wob = Math.sin(t * 1.4 + y * 0.42) * (2 + d * 9);
        const w = 1 + d * 4;
        c.fillStyle = rgba(PAL.crimson, (0.38 - d * 0.26) * k);
        c.fillRect(Math.round(x - w + wob), y, Math.round(w * 2), 1);
      }
      glowEllipse(c, x, top + depth * 0.25, L.sw * 0.02, depth * 0.3, PAL.crimsonDim, 0.18 * k);
    }
  }
}

/* ------------------------------------------------------------ undergrowth */

/**
 * Snow-laden scrub along the bank: clusters of squat conifers rather than
 * smooth mounds, so the silhouette stays broken and spiky.
 */
function drawShrubs(c, fc, layerFor, rng, W, L, bankTop) {
  const count = Math.round(W / 19);
  for (let i = 0; i < count; i++) {
    const x = rng.range(0, W);
    const near = rng();
    const y = lerp(bankTop[clamp(Math.round(x), 0, W - 1)] + L.vh * 0.015,
      L.waterY - L.vh * 0.025, near * near);
    const size = L.vh * rng.range(0.035, 0.075) * (0.55 + near * 0.85);
    const dark = mix(PAL.moss, PAL.voidBlack, 0.72 - near * 0.12);
    const snow = mix(PAL.frost, dark, 0.35 + near * 0.15);
    const sd = Math.floor(rng() * 0xffffff);
    const g = layerFor(y);

    wrapX(W, x, size * 3, (sx) => {
      const r = makeRng(sd);
      const tufts = r.int(2, 4);
      for (let k = 0; k < tufts; k++) {
        drawPine(g, {
          x: sx + r.signed(size * 0.85),
          baseY: y + r.signed(size * 0.16),
          height: size * r.range(0.7, 1.35),
          halfWidth: size * r.range(0.34, 0.6),
          color: dark,
          snowColor: snow,
          snowAmount: r.range(0.22, 0.44),
          rng: r,
          trunk: false,
          tierCount: r.int(2, 3),
        });
      }
    });
  }
}

/* ------------------------------------------------------------- props */

function drawPlank(c, rng, x, y, w, h) {
  const wood = mix(PAL.barkMid, PAL.soil, 0.35);
  rect(c, x, y, w, h, wood);
  hline(c, x, x + w, y, mix(wood, PAL.frostDeep, 0.35));
  hline(c, x, x + w, y + h - 1, shade(wood, -0.45));
  for (let i = 0; i < w * 0.3; i++) {
    vline(c, x + rng.range(0, w), y + 1, y + h - 2, shade(wood, rng.chance(0.5) ? -0.25 : 0.15));
  }
}

/**
 * A broken stump. The body used to sit at almost pure black with a lit 1px
 * left edge, so all that actually rendered was that single line — a bare
 * vertical stick standing in the undergrowth. The trunk now carries a tone of
 * its own and the top is genuinely splintered rather than cut square.
 */
function drawStump(c, rng, x, y, vh) {
  const h = rng.range(vh * 0.014, vh * 0.040);
  const w = Math.max(2, Math.round(rng.range(vh * 0.010, vh * 0.024)));
  const col = mix(PAL.bark, PAL.voidBlack, 0.12);
  const left = x - Math.floor(w / 2);

  // splintered crown: each column starts at its own height
  const tops = [];
  for (let i = 0; i < w; i++) {
    const edge = Math.abs(i - (w - 1) / 2) / ((w - 1) / 2 || 1);
    tops.push(y - h + rng.range(0, h * 0.26) + edge * h * 0.1);
  }

  for (let i = 0; i < w; i++) {
    const top = tops[i];
    vline(c, left + i, top, y, col);
    // snow caught on the broken face
    if (rng.chance(0.5)) px(c, left + i, top, mix(PAL.frostDeep, col, 0.35));
    // grain
    if (rng.chance(0.4)) vline(c, left + i, top + rng.range(1, h * 0.7), y, shade(col, -0.35));
  }
  vline(c, left, tops[0], y, shade(col, 0.18));
  vline(c, left + w - 1, tops[w - 1], y, shade(col, -0.4));
}

function drawFallenLog(c, rng, x, y, vh) {
  const len = rng.range(vh * 0.05, vh * 0.16);
  const th = Math.max(2, Math.round(vh * 0.011));
  const tilt = rng.signed(vh * 0.012);
  const col = mix(PAL.bark, PAL.voidBlack, 0.25);
  for (let i = 0; i < len; i++) {
    const yy = y + (i / len) * tilt;
    rect(c, x + i, yy, 1, th, col);
    if (rng.chance(0.28)) px(c, x + i, yy, mix(PAL.frost, col, rng.range(0.55, 0.85)));
    if (rng.chance(0.2)) px(c, x + i, yy + th - 1, shade(col, -0.4));
  }
  for (let i = 0; i < 3; i++) {
    const bx = x + rng.range(0, len);
    line(c, bx, y, bx + rng.signed(vh * 0.02), y - rng.range(vh * 0.01, vh * 0.03), col, 1);
  }
}

/** A rickety plank bridge on log piers, crossing the stream. */
function drawBridge(c, rng, b, vh) {
  const wood = mix(PAL.barkMid, PAL.soil, 0.25);
  const woodDark = shade(wood, -0.5);
  const deckH = Math.max(3, Math.round(vh * 0.016));
  const span = b.x1 - b.x0;

  for (let i = 0; i <= 4; i++) {
    const x = b.x0 + (span * i) / 4;
    const sag = Math.sin((i / 4) * Math.PI) * vh * 0.008;
    rect(c, x, b.y + sag, Math.max(2, Math.round(vh * 0.010)), vh * 0.06, woodDark);
    line(c, x, b.y + sag + vh * 0.01, x + span * 0.1, b.y + vh * 0.035, woodDark, 1);
  }

  for (let x = 0; x < span; x++) {
    const t = x / span;
    const y = b.y + Math.sin(t * Math.PI) * vh * 0.012;
    if (Math.round(x) % 7 === 6) continue;              // gap between boards
    rect(c, b.x0 + x, y, 1, deckH, wood);
    if (rng.chance(0.3)) px(c, b.x0 + x, y, mix(PAL.frost, wood, rng.range(0.5, 0.8)));
    px(c, b.x0 + x, y + deckH - 1, woodDark);
  }

  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    if (rng.chance(0.2)) continue;
    const x = b.x0 + span * t;
    const sag = Math.sin(t * Math.PI) * vh * 0.012;
    vline(c, x, b.y + sag - vh * 0.028, b.y + sag, woodDark);
  }
  for (let x = 0; x < span; x++) {
    const t = x / span;
    if (rng.chance(0.85)) px(c, b.x0 + x, b.y + Math.sin(t * Math.PI) * vh * 0.012 - vh * 0.028, wood);
  }
}
