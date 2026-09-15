/**
 * LAYER 1 — The colossal antlered entity.  Parallax 0.12
 *
 * A Jotunn standing behind the treeline, taller than the canopy. The body is
 * a flat silhouette one step lighter than true black so it separates from the
 * void; only the eyes carry colour. They idle, flare, narrow and settle on a
 * ~17 second cycle.
 *
 * It sits alone on a narrow tile, so as the wood streams past it drifts out of
 * frame and, a while later, is standing there again — always somewhere behind
 * you.
 */
import { makeRng } from '../lib/rng.js';
import { surface, rect, vline, px, line, fillPoly, mix, clamp, lerp, glow, bayer } from '../lib/paint.js';
import { PAL } from '../palette.js';

const CYCLE = 17.5; // seconds between flares

export function buildJotunn(L, seed) {
  const { W, H } = L;
  const rng = makeRng(seed);
  const s = surface(W, H);
  const c = s.ctx;

  const cx = Math.round(L.tx(0.46));
  const headY = Math.round(L.vy(0.145));
  const headW = Math.max(11, Math.round(L.sw * 0.046));
  const headH = Math.round(headW * 1.45);
  const bodyTop = headY + headH;
  const bodyBottom = L.horizon + L.vh * 0.03;

  const body = mix(PAL.voidBlack, PAL.skyLow, 0.22);
  const bodyEdge = mix(body, PAL.skyLow, 0.5);

  /* ------------------------------------------------------ torso & shoulders */
  const shoulderY = bodyTop + headH * 0.9;
  const shoulderHalf = headW * 3.4;
  fillPoly(c, [
    [cx - headW * 0.55, bodyTop - 2],
    [cx + headW * 0.55, bodyTop - 2],
    [cx + headW * 1.1, shoulderY - headH * 0.35],
    [cx + shoulderHalf, shoulderY + headH * 0.2],
    [cx + shoulderHalf * 1.35, bodyBottom],
    [cx - shoulderHalf * 1.3, bodyBottom],
    [cx - shoulderHalf * 0.95, shoulderY + headH * 0.15],
    [cx - headW * 1.1, shoulderY - headH * 0.4],
  ], body);

  // ragged pelt along the shoulder line
  for (let i = 0; i < 160; i++) {
    const t = rng();
    const sx = lerp(cx - shoulderHalf, cx + shoulderHalf, t);
    const edgeY = shoulderY + headH * 0.2 - Math.pow(1 - Math.abs(t - 0.5) * 2, 0.7) * headH * 0.55;
    const len = rng.range(1, 7);
    vline(c, sx, edgeY - len, edgeY + rng.range(0, 3), body);
  }

  /* --------------------------------------------------------------- head */
  // a narrow elongated skull: heavy brow over a tapering muzzle
  fillPoly(c, [
    [cx - headW * 0.30, headY],
    [cx + headW * 0.30, headY],
    [cx + headW * 0.42, headY + headH * 0.16],
    [cx + headW * 0.44, headY + headH * 0.52],
    [cx + headW * 0.24, headY + headH],
    [cx - headW * 0.24, headY + headH],
    [cx - headW * 0.44, headY + headH * 0.52],
    [cx - headW * 0.42, headY + headH * 0.16],
  ], body);
  // ragged ear tufts set low and back on the skull
  line(c, cx - headW * 0.40, headY + headH * 0.30, cx - headW * 0.82, headY + headH * 0.06, body, 2);
  line(c, cx + headW * 0.40, headY + headH * 0.30, cx + headW * 0.82, headY + headH * 0.06, body, 2);

  /* ------------------------------------------------------------ antlers */
  const antlerBase = headY + headH * 0.06;
  const spread = headW * 4.4;
  growAntler(c, rng, cx - headW * 0.26, antlerBase, -1, spread, body, 6);
  growAntler(c, rng, cx + headW * 0.26, antlerBase, 1, spread, body, 6);

  /* ------------------------------------------------- faint mauve rim light */
  // a single lit pixel column down the left edge keeps the mass readable
  const img = c.getImageData(0, 0, W, H);
  const d = img.data;
  const rimCol = [ ...hexRgb(bodyEdge) ];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const k = (y * W + x) * 4;
      if (d[k + 3] < 200) continue;
      const leftEmpty = d[(y * W + x - 1) * 4 + 3] < 40;
      const upEmpty = d[((y - 1) * W + x) * 4 + 3] < 40;
      if (leftEmpty || upEmpty) {
        const f = leftEmpty && upEmpty ? 1 : 0.55;
        d[k] = lerp(d[k], rimCol[0], f);
        d[k + 1] = lerp(d[k + 1], rimCol[1], f);
        d[k + 2] = lerp(d[k + 2], rimCol[2], f);
      }
    }
  }
  c.putImageData(img, 0, 0);

  /* ------------------------------------- dissolve the base into the mist */
  const fadeTop = Math.round(bodyBottom - L.vh * 0.22);
  const fadeH = Math.round(bodyBottom - fadeTop);
  const band = c.getImageData(0, fadeTop, W, fadeH);
  const bd = band.data;
  for (let y = 0; y < fadeH; y++) {
    const t = y / fadeH;
    for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4;
      if (!bd[k + 3]) continue;
      // dithered alpha ramp keeps the dissolve chunky instead of gaussian
      const keep = 1 - clamp(t * 1.15 + bayer(x, y + fadeTop) * 0.35, 0, 1);
      bd[k + 3] = keep > 0.5 ? bd[k + 3] : keep > 0.18 ? bd[k + 3] * 0.45 : 0;
    }
  }
  c.putImageData(band, 0, fadeTop);

  /* ------------------------------------------------------------- eyes */
  const eyeGap = headW * 0.30;
  const eyeY = headY + headH * 0.42;
  const eyes = [
    { x: cx - eyeGap, y: eyeY },
    { x: cx + eyeGap, y: eyeY },
  ];
  const eyeW = Math.max(2, Math.round(headW * 0.20));

  return {
    canvas: s.canvas,
    /** Eyes are painted live so they can flare independently of the body. */
    over(ctx, t, ox, oy) {
      const p = (t % CYCLE) / CYCLE;
      // idle breath, then a flare, a narrowing, and a slow settle
      let intensity = 0.34 + Math.sin(t * 0.9) * 0.05;
      let open = 1;
      if (p > 0.58 && p < 0.70) {
        const f = (p - 0.58) / 0.12;
        intensity = lerp(0.34, 1, ease(f));
      } else if (p >= 0.70 && p < 0.775) {
        const f = (p - 0.70) / 0.075;
        intensity = 1;
        open = lerp(1, 0.18, ease(f));           // narrows to a slit
      } else if (p >= 0.775 && p < 0.845) {
        const f = (p - 0.775) / 0.07;
        intensity = 1;
        open = lerp(0.18, 1, ease(f));
      } else if (p >= 0.845 && p < 1) {
        const f = (p - 0.845) / 0.155;
        intensity = lerp(1, 0.34, ease(f));
      }

      for (const e of eyes) {
        const ex = Math.round(ox + e.x);
        const ey = Math.round(oy + e.y);
        const h = Math.max(1, Math.round(eyeW * 0.8 * open));
        glow(ctx, ex, ey, eyeW * (5 + intensity * 16), PAL.crimson, 0.16 + intensity * 0.55);
        glow(ctx, ex, ey, eyeW * (1.6 + intensity * 3), PAL.crimsonHot, 0.3 + intensity * 0.5);
        rect(ctx, ex - (eyeW >> 1), ey - (h >> 1), eyeW, h,
          mix(PAL.crimson, PAL.crimsonHot, intensity));
        if (intensity > 0.6 && h > 1) {
          px(ctx, ex, ey, mix(PAL.crimsonHot, '#ffffff', (intensity - 0.6) * 1.2));
        }
      }
    },
  };
}

const ease = (t) => t * t * (3 - 2 * t);
const hexRgb = (hex) => {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

/**
 * Antler growth: a main beam that starts near-vertical and sweeps outward as
 * it rises, throwing an upright tine at every segment. Recursion gave two thin
 * horns and heavy beams gave rabbit ears; a slim swept beam with a row of
 * vertical tines is what reads as an elk rack in silhouette.
 */
function growAntler(c, rng, x, y, dir, len, col, segs = 6) {
  let cx = x;
  let cy = y;
  let a = -Math.PI * 0.42;                     // almost straight up
  let thick = Math.max(2, Math.round(len * 0.065));

  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const segLen = len * (0.30 - t * 0.035) * rng.range(0.9, 1.1);
    a += rng.range(0.12, 0.22);                 // curve out toward horizontal
    // the beam is stretched horizontally: a rack spreads far wider than it climbs
    const nx = cx + dir * Math.cos(a) * segLen * 1.75;
    const ny = cy + Math.sin(a) * segLen;
    line(c, cx, cy, nx, ny, col, thick);

    // an upright tine off the top of the beam at each joint
    const tineLen = len * (0.36 - t * 0.05) * rng.range(0.82, 1.18);
    const ta = -Math.PI * rng.range(0.42, 0.48);
    line(c, nx, ny, nx + dir * Math.cos(ta) * tineLen, ny + Math.sin(ta) * tineLen,
      col, Math.max(1, thick - 1));

    cx = nx;
    cy = ny;
    if (i % 2 === 1) thick = Math.max(1, thick - 1);
  }
}
