/**
 * LAYER 0 — Celestial dome & distant peaks.  Parallax 0.05
 *
 * Brooding mauve-to-charcoal gradient, storm cloud masses, a blood-tinged
 * moon ring, snow-capped ridges, the monolith ruins and the cliffside
 * waterfall. Entirely static: at 0.05 depth nothing here needs to move.
 */
import { makeRng, fbm2d, ridgeline } from '../lib/rng.js';
import {
  surface, rect, hline, vline, px, disc, vgrad, shadeRegion, mix, shade,
  hexToRgb, clamp, lerp, glow, fillPoly,
} from '../lib/paint.js';
import { PAL } from '../palette.js';

export function buildSky(W, H, L, seed) {
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
  const cloudNoise = fbm2d(rng, 70, 4);
  const detailNoise = fbm2d(rng, 22, 3);
  const cloudA = hexToRgb(PAL.cloud);
  const cloudB = hexToRgb(PAL.cloudLit);
  const skyFade = L.horizon * 1.05;
  shadeRegion(c, 0, 0, W, Math.round(skyFade), (x, y) => {
    const n = cloudNoise(x, y * 2.1) * 0.75 + detailNoise(x, y * 2.4) * 0.25;
    // clouds mass toward the upper third and thin out at the horizon
    const band = 1 - clamp(Math.abs(y - H * 0.16) / (H * 0.46), 0, 1);
    const v = (n - 0.48) * 2.6 * band;
    if (v <= 0.02) return null;
    const a = clamp(v, 0, 1) * 92;
    const t = clamp((n - 0.5) * 3.2, 0, 1);
    return [
      lerp(cloudA[0], cloudB[0], t),
      lerp(cloudA[1], cloudB[1], t),
      lerp(cloudA[2], cloudB[2], t),
      a,
    ];
  });

  /* ------------------------------------------------------- blood moon */
  const moonX = Math.round(L.vx(0.80));
  const moonY = Math.round(L.vy(0.14));
  const moonR = Math.max(9, Math.round(L.vh * 0.036));
  glow(c, moonX, moonY, moonR * 4.5, PAL.crimsonDim, 0.13);
  glow(c, moonX, moonY, moonR * 2.0, PAL.crimson, 0.07);
  // the eclipsed disc is barely lighter than the sky behind it
  disc(c, moonX, moonY, moonR, mix(PAL.skyTop, PAL.crimsonDeep, 0.35));
  // the ring itself: bright on the lower-left limb, guttering out at the top
  for (let i = 0; i < 360; i += 1) {
    const a = (i / 180) * Math.PI;
    const limb = clamp(Math.sin(a + 0.6) * 0.5 + 0.55, 0, 1);
    if (rng.chance(0.2 + limb * 0.5)) {
      const col = mix(mix(PAL.crimsonDeep, PAL.mistPale, 0.35), PAL.crimson, limb * limb);
      px(c, moonX + Math.cos(a) * moonR, moonY + Math.sin(a) * moonR, col);
    }
  }
  // thin veil of cloud drawn back over the moon so it sits inside the storm
  shadeRegion(c, moonX - moonR * 4, moonY - moonR * 3, moonR * 8, moonR * 6, (x, y) => {
    const n = detailNoise(x * 1.2, y * 2.6);
    if (n < 0.56) return null;
    return [cloudA[0], cloudA[1], cloudA[2], (n - 0.56) * 240];
  });

  /* ------------------------------------------------------ mountain ranges */
  drawRange(c, rng, W, L, {
    top: L.vy(0.30), amp: L.vh * 0.10, baseY: L.horizon + 4,
    color: mix(PAL.skyLow, PAL.frostShadow, 0.22),
    snowLine: L.vy(0.345), snowBright: mix(PAL.frostMid, PAL.skyLow, 0.55),
    snowShadow: mix(PAL.frostShadow, PAL.skyLow, 0.35),
    roughness: 0.60, depth: 0.45,
  });
  drawRange(c, rng, W, L, {
    top: L.vy(0.375), amp: L.vh * 0.115, baseY: L.horizon + 6,
    color: mix(PAL.skyBottom, PAL.frostShadow, 0.30),
    snowLine: L.vy(0.415), snowBright: mix(PAL.frost, PAL.frostShadow, 0.45),
    snowShadow: PAL.frostShadow,
    roughness: 0.55, depth: 0.8,
  });

  /* ------------------------------------------- cliff, ruins & waterfall */
  drawCliff(c, rng, L.vw, L.vh, L);

  /* ----------------------------------------------- horizon haze & fade */
  const mistRgb = hexToRgb(PAL.mist);
  shadeRegion(c, 0, Math.round(L.horizon - H * 0.14), W, Math.round(H * 0.22), (x, y) => {
    const t = clamp((y - (L.horizon - H * 0.14)) / (H * 0.16), 0, 1);
    const n = detailNoise(x * 0.8, y * 3);
    const a = smooth(t) * 130 * (0.65 + n * 0.55);
    return [mistRgb[0], mistRgb[1], mistRgb[2], clamp(a, 0, 150)];
  });

  return { canvas: s.canvas };
}

const smooth = (t) => t * t * (3 - 2 * t);

/** One snow-capped ridge, filled column by column. */
function drawRange(c, rng, W, L, o) {
  const r = ridgeline(
    rng, W,
    o.top + rng.signed(o.amp * 0.4),
    o.top + rng.signed(o.amp * 0.4),
    o.amp, o.roughness,
  );
  // secondary displacement gives the peaks their sharp, sawn profile
  for (let x = 0; x < W; x++) r[x] += Math.sin(x * 0.11 + r[x] * 0.2) * o.amp * 0.07;

  for (let x = 0; x < W; x++) {
    const y = Math.round(r[x]);
    vline(c, x, y, o.baseY, o.color);
  }

  const shadowCol = shade(o.color, -0.35);
  for (let x = 1; x < W - 1; x++) {
    const y = r[x];
    const slope = r[x + 1] - r[x - 1];

    // rock shading: right-facing faces fall into shadow
    if (slope < -0.35) {
      const d = clamp(-slope * 2.4, 1, 9);
      vline(c, x, y, y + d, shadowCol);
    }

    if (y >= o.snowLine) continue;
    const above = (o.snowLine - y) / (o.snowLine * 0.35 + 1);
    const depth = clamp(above * 7 * rng.range(0.5, 1.4), 1, 9);
    const lit = slope > 0.1;
    const col = lit ? o.snowBright : o.snowShadow;
    for (let i = 0; i < depth; i++) {
      // dithered lower edge so the snow line never reads as a hard band
      const edge = i / depth;
      if (edge > 0.55 && rng.chance((edge - 0.55) * 2.2)) continue;
      px(c, x, y + i, edge > 0.72 ? mix(col, o.color, 0.5) : col);
    }
    if (lit && rng.chance(0.3)) px(c, x, y, mix(col, '#ffffff', 0.35 * o.depth));
  }
}

/** Right-hand plateau: monolith ruins above, waterfall spilling below. */
function drawCliff(c, rng, W, H, L) {
  // W/H here are the *visible* frame dimensions
  const cx = Math.round(L.vx(0.745));
  const topY = Math.round(L.vy(0.425));
  const halfW = Math.round(L.vw * 0.075);
  const baseY = L.horizon + 6;
  const rock = mix(PAL.skyBottom, PAL.frostShadow, 0.72);
  const rockLit = mix(rock, PAL.frostMid, 0.22);
  const rockDark = shade(rock, -0.45);

  // plateau body
  fillPoly(c, [
    [cx - halfW, topY + 3],
    [cx + halfW, topY],
    [cx + halfW * 1.15, baseY],
    [cx - halfW * 1.1, baseY],
  ], rock);

  // strata
  for (let i = 0; i < 26; i++) {
    const y = topY + rng.range(6, baseY - topY);
    const x0 = cx - halfW * rng.range(0.4, 1.05);
    const x1 = x0 + rng.range(4, halfW * 1.1);
    hline(c, x0, x1, y, rng.chance(0.5) ? rockDark : mix(rock, rockLit, 0.6));
  }
  // lit top lip
  hline(c, cx - halfW, cx + halfW, topY + 2, rockLit);
  hline(c, cx - halfW, cx - halfW * 0.2, topY + 3, mix(PAL.frostMid, rock, 0.45));

  /* ---- monolith ruins: a trilithon gate plus broken standing stones ---- */
  const stone = mix(PAL.frostShadow, PAL.skyLow, 0.35);
  const stoneLit = mix(stone, PAL.frostMid, 0.30);
  const gx = cx - Math.round(halfW * 0.15);
  const gh = Math.round(H * 0.052);
  const pw = Math.max(2, Math.round(H * 0.011));
  // uprights
  rect(c, gx - Math.round(gh * 0.34), topY - gh, pw, gh + 2, stone);
  rect(c, gx + Math.round(gh * 0.22), topY - gh, pw, gh + 2, stone);
  vline(c, gx - Math.round(gh * 0.34), topY - gh, topY + 2, stoneLit);
  vline(c, gx + Math.round(gh * 0.22), topY - gh, topY + 2, stoneLit);
  // lintel
  rect(c, gx - Math.round(gh * 0.42), topY - gh - pw, Math.round(gh * 0.78) + pw, pw, stone);
  hline(c, gx - Math.round(gh * 0.42), gx + Math.round(gh * 0.36), topY - gh - pw, stoneLit);
  // a single ember of crimson burning under the gate
  px(c, gx - 1 + rng.int(0, 1), topY - Math.round(gh * 0.45), PAL.crimsonDim);
  glow(c, gx, topY - gh * 0.45, gh * 0.55, PAL.crimson, 0.35);

  // broken stones scattered along the lip
  for (let i = 0; i < 5; i++) {
    const sx = cx + rng.range(-halfW * 0.95, halfW * 0.95);
    const sh = rng.range(gh * 0.18, gh * 0.55);
    const sw = Math.max(1, Math.round(rng.range(1, 2.6)));
    const tilt = rng.signed(1.2);
    for (let k = 0; k < sh; k++) {
      rect(c, sx + (k / sh) * tilt, topY + 1 - k, sw, 1, k > sh * 0.75 ? mix(stone, PAL.frostMid, 0.3) : stone);
    }
  }

  /* --------------------------- waterfall off the left face of the cliff */
  const fx = cx - halfW * 0.82;
  const fw = Math.max(3, Math.round(W * 0.012));
  const fTop = topY + 6;
  const fBot = baseY - 2;
  const waterCol = mix(PAL.frostMid, PAL.skyBottom, 0.35);
  for (let x = 0; x < fw; x++) {
    const edge = Math.abs(x - (fw - 1) / 2) / ((fw - 1) / 2 || 1);
    for (let y = fTop; y < fBot; y++) {
      const flow = rng.chance(0.62 - edge * 0.35);
      if (!flow) continue;
      const t = (y - fTop) / (fBot - fTop);
      const col = mix(waterCol, PAL.frost, clamp(0.5 - edge * 0.5, 0, 1) * (1 - t * 0.6));
      px(c, fx + x + Math.sin(y * 0.12) * 0.8, y, col);
    }
  }
  // spray at the plunge pool
  for (let i = 0; i < 90; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = Math.pow(rng(), 0.6) * fw * 2.6;
    px(c, fx + fw / 2 + Math.cos(a) * r * 1.6, fBot + Math.sin(a) * r * 0.55,
      mix(PAL.mistPale, PAL.frostMid, rng.range(0, 0.6)));
  }
  glow(c, fx + fw / 2, fBot, fw * 3, PAL.frostMid, 0.12);
}
