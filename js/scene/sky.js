/**
 * LAYER 0 — Celestial dome & distant peaks.  Parallax 0.05
 *
 * Brooding mauve-to-charcoal gradient, storm cloud masses, a blood-tinged
 * moon ring, snow-capped ridges, the monolith ruins and the cliffside
 * waterfall. Generated as a horizontally tiling strip: the cloud field uses
 * periodic noise and the ridgelines close on themselves, so the dome can
 * stream past forever without a seam.
 */
import { makeRng, fbm2dTiling, ridgeline } from '../lib/rng.js';
import {
  surface, rect, hline, vline, px, disc, vgrad, shadeRegion, wrapX, bayer,
  mix, shade, hexToRgb, clamp, lerp, glow, fillPoly,
} from '../lib/paint.js';
import { PAL } from '../palette.js';

const TAU = Math.PI * 2;

export function buildSky(L, seed) {
  const { W, H, sw } = L;
  const rng = makeRng(seed);
  const s = surface(W, H);
  const c = s.ctx;

  /* ---------------------------------------------------- gradient dome */
  vgrad(c, 0, 0, W, H, [
    [0.00, PAL.skyTop],
    [0.34, PAL.skyMid],
    [0.62, PAL.skyLow],
    [1.00, PAL.skyBottom],
  ]);

  /* ------------------------------------------------- storm cloud mass */
  const cloudNoise = fbm2dTiling(rng, W, 70, 4);
  const detailNoise = fbm2dTiling(rng, W, 22, 3);
  const cloudA = hexToRgb(PAL.cloud);
  const cloudB = hexToRgb(PAL.cloudLit);
  shadeRegion(c, 0, 0, W, Math.round(L.horizon * 1.05), (x, y) => {
    const n = cloudNoise(x, y * 2.1) * 0.75 + detailNoise(x, y * 2.4) * 0.25;
    const band = 1 - clamp(Math.abs(y - L.vy(0.14)) / (L.vh * 0.46), 0, 1);
    const v = (n - 0.48) * 2.6 * band;
    if (v <= 0.02) return null;
    const t = clamp((n - 0.5) * 3.2, 0, 1);
    return [
      lerp(cloudA[0], cloudB[0], t),
      lerp(cloudA[1], cloudB[1], t),
      lerp(cloudA[2], cloudB[2], t),
      clamp(v, 0, 1) * 92,
    ];
  });

  /* ------------------------------------------------------- blood moon */
  const moonX = Math.round(L.tx(0.40));
  const moonY = Math.round(L.vy(0.13));
  const moonR = Math.max(9, Math.round(L.vh * 0.036));
  glow(c, moonX, moonY, moonR * 4.5, PAL.crimsonDim, 0.13);
  glow(c, moonX, moonY, moonR * 2.0, PAL.crimson, 0.07);
  disc(c, moonX, moonY, moonR, mix(PAL.skyTop, PAL.crimsonDeep, 0.35));
  for (let i = 0; i < 360; i++) {
    const a = (i / 180) * Math.PI;
    const limb = clamp(Math.sin(a + 0.6) * 0.5 + 0.55, 0, 1);
    if (rng.chance(0.2 + limb * 0.5)) {
      const col = mix(mix(PAL.crimsonDeep, PAL.mistPale, 0.35), PAL.crimson, limb * limb);
      px(c, moonX + Math.cos(a) * moonR, moonY + Math.sin(a) * moonR, col);
    }
  }
  shadeRegion(c, moonX - moonR * 4, moonY - moonR * 3, moonR * 8, moonR * 6, (x, y) => {
    const n = detailNoise(x * 1.2, y * 2.6);
    return n < 0.56 ? null : [cloudA[0], cloudA[1], cloudA[2], (n - 0.56) * 240];
  });

  /* ------------------------------------------------------ mountain ranges */
  drawRange(c, rng, W, L, {
    top: L.vy(0.31), amp: L.vh * 0.085, baseY: L.horizon + 4,
    color: mix(PAL.skyLow, PAL.frostShadow, 0.22),
    snowLine: L.vy(0.345), snowBright: mix(PAL.frostMid, PAL.skyLow, 0.68),
    snowShadow: mix(PAL.frostShadow, PAL.skyLow, 0.35),
    roughness: 0.45, waves: 3,
  });
  drawRange(c, rng, W, L, {
    top: L.vy(0.385), amp: L.vh * 0.095, baseY: L.horizon + 6,
    color: mix(PAL.skyBottom, PAL.frostShadow, 0.30),
    snowLine: L.vy(0.415), snowBright: mix(PAL.frost, PAL.frostShadow, 0.62),
    snowShadow: PAL.frostShadow,
    roughness: 0.42, waves: 5,
  });

  /* ------------------------------------------- cliff, ruins & waterfall */
  wrapX(W, L.tx(0.70), sw * 0.2, (x) => drawCliff(c, makeRng(seed + 77), L, x));

  /* ----------------------------------------------- horizon haze & fade */
  const mistRgb = hexToRgb(PAL.mist);
  const hazeTop = Math.round(L.horizon - L.vh * 0.14);
  shadeRegion(c, 0, hazeTop, W, Math.round(L.vh * 0.22), (x, y) => {
    const t = clamp((y - hazeTop) / (L.vh * 0.16), 0, 1);
    const n = detailNoise(x * 0.8, y * 3);
    const a = t * t * (3 - 2 * t) * 170 * (0.65 + n * 0.55);
    return [mistRgb[0], mistRgb[1], mistRgb[2], clamp(a, 0, 195)];
  });

  return { canvas: s.canvas };
}

/**
 * One snow-capped ridge.
 *
 * Midpoint displacement alone gives a furry, single-pixel-spiky profile that
 * reads as noise rather than rock, and per-column random snow depth turns the
 * snowline into a comb. So the profile is box-smoothed into facets first, and
 * the snow is laid to a depth that follows height above the snowline with an
 * ordered-dither lower edge.
 *
 * The profile starts and ends at the same height and every modulation is a
 * whole number of cycles across the tile, so the range closes on itself.
 */
function drawRange(c, rng, W, L, o) {
  const raw = ridgeline(rng, W, o.top, o.top, o.amp, o.roughness);

  // major peaks come from the periodic terms; the displacement only roughens
  for (let x = 0; x < W; x++) {
    const u = (x / W) * TAU;
    raw[x] += Math.sin(u * o.waves) * o.amp * 0.55
      + Math.sin(u * o.waves * 2.3 + 1.2) * o.amp * 0.24
      + Math.sin(u * o.waves * 4.1 + 2.7) * o.amp * 0.09;
  }

  // box smooth, wrapping at the seam — knocks out the single-pixel fur
  const r = new Float32Array(W);
  const k = Math.max(1, Math.round(L.sw * 0.006));
  for (let x = 0; x < W; x++) {
    let sum = 0;
    for (let d = -k; d <= k; d++) sum += raw[(x + d + W) % W];
    r[x] = sum / (k * 2 + 1);
  }

  const rockLit = mix(o.color, PAL.frostMid, 0.16);
  const rockShadow = shade(o.color, -0.4);
  const maxSnow = L.vh * 0.042;

  for (let x = 0; x < W; x++) {
    const y = Math.round(r[x]);
    const slope = r[(x + 1) % W] - r[(x - 1 + W) % W];

    // body, then a facet pass: faces falling away to the right sit in shadow
    vline(c, x, y, o.baseY, o.color);
    if (slope < -0.25) {
      vline(c, x, y, y + clamp(-slope * 5, 1, L.vh * 0.05), rockShadow);
    } else if (slope > 0.25) {
      vline(c, x, y, y + clamp(slope * 3, 1, L.vh * 0.025), rockLit);
    }

    if (y >= o.snowLine) continue;

    // Snow depth follows height above the snowline, not a dice roll — but a
    // constant depth over a flat crest lines the dither edge up into a long
    // horizontal dotted rule, so the boundary undulates.
    const u = (x / W) * TAU;
    const wob = 0.72 + 0.5 * (Math.sin(u * o.waves * 7.3) * 0.5
      + Math.sin(u * o.waves * 17.1 + 2.1) * 0.35
      + Math.sin(u * o.waves * 31.7 + 0.8) * 0.15);
    const above = clamp((o.snowLine - y) / (L.vh * 0.09), 0, 1);
    const depth = Math.max(1, above * maxSnow * wob);
    const lit = slope > -0.1;
    const col = lit ? o.snowBright : o.snowShadow;

    for (let i = 0; i < depth; i++) {
      const edge = i / depth;
      // ordered dither dissolves the lower boundary. Kept to the last quarter
      // of the depth — spread wider it reads as a screen door, not snow.
      if (edge > 0.74 && bayer(x, y + i) + 0.5 < (edge - 0.74) / 0.26) continue;
      px(c, x, y + i, edge > 0.82 ? mix(col, o.color, 0.45) : col);
    }
    // crisp lit edge along the crest
    if (lit) px(c, x, y, mix(col, '#ffffff', 0.14));
  }
}

/** A plateau: monolith ruins above, waterfall spilling below. */
function drawCliff(c, rng, L, cx) {
  const topY = Math.round(L.vy(0.425));
  const halfW = Math.round(L.sw * 0.075);
  const baseY = L.horizon + 6;
  const rock = mix(PAL.skyBottom, PAL.frostShadow, 0.72);
  const rockLit = mix(rock, PAL.frostMid, 0.22);
  const rockDark = shade(rock, -0.45);

  fillPoly(c, [
    [cx - halfW, topY + 3],
    [cx + halfW, topY],
    [cx + halfW * 1.15, baseY],
    [cx - halfW * 1.1, baseY],
  ], rock);

  for (let i = 0; i < 26; i++) {
    const y = topY + rng.range(6, baseY - topY);
    const x0 = cx - halfW * rng.range(0.4, 1.05);
    hline(c, x0, x0 + rng.range(4, halfW * 1.1), y, rng.chance(0.5) ? rockDark : mix(rock, rockLit, 0.6));
  }
  hline(c, cx - halfW, cx + halfW, topY + 2, rockLit);
  hline(c, cx - halfW, cx - halfW * 0.2, topY + 3, mix(PAL.frostMid, rock, 0.45));

  /* ---- monolith ruins: a trilithon gate plus broken standing stones ---- */
  const stone = mix(PAL.frostShadow, PAL.skyLow, 0.35);
  const stoneLit = mix(stone, PAL.frostMid, 0.30);
  const gx = cx - Math.round(halfW * 0.15);
  const gh = Math.round(L.vh * 0.052);
  const pw = Math.max(2, Math.round(L.vh * 0.011));
  rect(c, gx - Math.round(gh * 0.34), topY - gh, pw, gh + 2, stone);
  rect(c, gx + Math.round(gh * 0.22), topY - gh, pw, gh + 2, stone);
  vline(c, gx - Math.round(gh * 0.34), topY - gh, topY + 2, stoneLit);
  vline(c, gx + Math.round(gh * 0.22), topY - gh, topY + 2, stoneLit);
  rect(c, gx - Math.round(gh * 0.42), topY - gh - pw, Math.round(gh * 0.78) + pw, pw, stone);
  hline(c, gx - Math.round(gh * 0.42), gx + Math.round(gh * 0.36), topY - gh - pw, stoneLit);
  px(c, gx - 1 + rng.int(0, 1), topY - Math.round(gh * 0.45), PAL.crimsonDim);
  glow(c, gx, topY - gh * 0.45, gh * 0.55, PAL.crimson, 0.3);

  for (let i = 0; i < 5; i++) {
    const sx = cx + rng.range(-halfW * 0.95, halfW * 0.95);
    const sh = rng.range(gh * 0.18, gh * 0.55);
    const sw2 = Math.max(1, Math.round(rng.range(1, 2.6)));
    const tilt = rng.signed(1.2);
    for (let k = 0; k < sh; k++) {
      rect(c, sx + (k / sh) * tilt, topY + 1 - k, sw2, 1,
        k > sh * 0.75 ? mix(stone, PAL.frostMid, 0.3) : stone);
    }
  }

  /* --------------------------- waterfall off the left face of the cliff */
  const fx = cx - halfW * 0.82;
  const fw = Math.max(3, Math.round(L.sw * 0.012));
  const fTop = topY + 6;
  const fBot = baseY - 2;
  const waterCol = mix(PAL.frostMid, PAL.skyBottom, 0.35);
  for (let x = 0; x < fw; x++) {
    const edge = Math.abs(x - (fw - 1) / 2) / ((fw - 1) / 2 || 1);
    for (let y = fTop; y < fBot; y++) {
      if (!rng.chance(0.62 - edge * 0.35)) continue;
      const t = (y - fTop) / (fBot - fTop);
      px(c, fx + x + Math.sin(y * 0.12) * 0.8, y,
        mix(waterCol, PAL.frost, clamp(0.5 - edge * 0.5, 0, 1) * (1 - t * 0.6)));
    }
  }
  for (let i = 0; i < 90; i++) {
    const a = rng.range(0, TAU);
    const r = Math.pow(rng(), 0.6) * fw * 2.6;
    px(c, fx + fw / 2 + Math.cos(a) * r * 1.6, fBot + Math.sin(a) * r * 0.55,
      mix(PAL.mistPale, PAL.frostMid, rng.range(0, 0.6)));
  }
  glow(c, fx + fw / 2, fBot, fw * 3, PAL.frostMid, 0.12);
}
