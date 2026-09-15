/**
 * Conifer + trunk generators shared by the deep forest, the sentinel layer
 * and the foreground framing.
 *
 * Snow is applied as rim light along the silhouette edge rather than as a
 * blob on top: in the reference, frost reads as a cold blue outline tracing
 * every needle cluster.
 */
import { rect, hline, vline, px, lerp, clamp, mix, shade, fillPoly, line, wrapX } from '../lib/paint.js';
import { makeRng } from '../lib/rng.js';
import { PAL } from '../palette.js';

/**
 * A tiered pixel conifer.
 * opts: { x, baseY, height, halfWidth, color, snowColor, snowAmount, rng, trunk }
 */
export function drawPine(c, opts) {
  const {
    x, baseY, height, halfWidth,
    color, snowColor = null, snowAmount = 0, rng,
    trunk = true, tierCount = null,
  } = opts;

  const top = baseY - height;
  const tiers = tierCount || clamp(Math.round(height / 13), 3, 14);
  const crownTop = top + height * 0.04;
  const crownH = height * 0.96;

  if (trunk) {
    const tw = Math.max(1, Math.round(halfWidth * 0.16));
    rect(c, x - (tw >> 1), baseY - height * 0.22, tw, height * 0.22 + 1, shade(color, -0.25));
  }

  // apex spike
  vline(c, x, crownTop - Math.max(2, height * 0.04), crownTop + 2, color);

  for (let t = 0; t < tiers; t++) {
    const p0 = t / tiers;
    const p1 = (t + 1) / tiers;
    const y0 = crownTop + crownH * p0;
    const y1 = crownTop + crownH * p1;
    const wEnd = halfWidth * (0.22 + 0.78 * Math.pow(p1, 0.85));
    const wStart = wEnd * 0.42;
    const rows = Math.max(1, Math.round(y1 - y0));
    const edges = [];

    for (let i = 0; i < rows; i++) {
      const y = Math.round(y0 + i);
      const f = i / rows;
      const w = lerp(wStart, wEnd, Math.pow(f, 0.7));
      // ragged needle silhouette
      const jl = w + rng.signed(Math.max(0.7, w * 0.14));
      const jr = w + rng.signed(Math.max(0.7, w * 0.14));
      hline(c, x - jl, x + jr, y, color);
      edges.push({ y, xl: x - jl, xr: x + jr });
    }

    if (snowColor && snowAmount > 0) capTier(c, edges, snowColor, color, snowAmount, rng);
  }
}

/**
 * Lay snow along the upper edge of one branch tier.
 *
 * Snow used to be scattered a pixel at a time with an independent dice roll
 * per row, which is the classic recipe for orphan pixels: at this scale the
 * result reads as static crawling over the bushes rather than as snow. It is
 * placed as a few short contiguous caps instead, biased to the top of the
 * tier where snow would actually settle, in two tones only.
 */
function capTier(c, edges, snowColor, color, amount, rng) {
  if (edges.length < 2) return;
  const bright = snowColor;
  const dim = mix(snowColor, color, 0.5);

  // one cap per tier at low amounts, two on the heavier trees
  const caps = amount > 0.32 ? rng.int(1, 2) : (rng.chance(amount * 2.4) ? 1 : 0);

  for (let n = 0; n < caps; n++) {
    // start in the upper half of the tier — the shoulder of the branch
    const start = rng.int(0, Math.max(0, Math.floor(edges.length * 0.45)));
    const run = Math.min(edges.length - start, rng.int(2, 5));
    if (run < 2) continue;

    for (let k = 0; k < run; k++) {
      const e = edges[start + k];
      const endCap = k === 0 || k === run - 1;
      px(c, e.xl, e.y, endCap ? dim : bright);
      // thicken the middle of the cap so it is a cluster, not a hairline
      if (!endCap && run > 2) px(c, e.xl + 1, e.y, dim);
    }
  }
}

/**
 * A colossal bark column — the ancient sentinels flanking the frame.
 * Returns { x, top, halfWidth } so runes can be registered against it.
 */
export function drawGreatTrunk(c, opts) {
  const {
    x, top, baseY, halfWidth, rng,
    base = PAL.bark, lit = PAL.barkLit, dark = PAL.barkDark,
    frost = null,
  } = opts;

  const h = baseY - top;

  // main column, slightly tapered toward the canopy
  for (let y = Math.round(top); y <= Math.round(baseY); y++) {
    const f = (y - top) / h;
    const w = halfWidth * (0.82 + 0.18 * f);
    const wobble = Math.sin(y * 0.07) * halfWidth * 0.04;
    hline(c, x - w + wobble, x + w + wobble, y, base);
  }

  // vertical bark striation — the light falls from the left
  const strands = Math.round(halfWidth * 1.5);
  for (let s = 0; s < strands; s++) {
    const off = rng.range(-halfWidth, halfWidth);
    const tone = off < -halfWidth * 0.25
      ? mix(lit, base, rng.range(0.15, 0.7))
      : mix(dark, base, rng.range(0.1, 0.8));
    let y = top + rng.range(0, h * 0.4);
    while (y < baseY) {
      const seg = rng.range(6, 26);
      const wob = Math.sin(y * 0.07) * halfWidth * 0.04;
      vline(c, x + off + wob, y, Math.min(baseY, y + seg), tone);
      y += seg + rng.range(3, 14);
    }
  }

  // hard edge shading so the cylinder reads as round
  for (let y = Math.round(top); y <= Math.round(baseY); y++) {
    const f = (y - top) / h;
    const w = halfWidth * (0.82 + 0.18 * f);
    const wobble = Math.sin(y * 0.07) * halfWidth * 0.04;
    vline(c, x - w + wobble, y, y, mix(base, '#000000', 0.35));
    vline(c, x - w + wobble + 1, y, y, mix(lit, base, 0.5));
    vline(c, x + w + wobble, y, y, mix(base, '#000000', 0.55));
    vline(c, x + w + wobble - 1, y, y, mix(base, '#000000', 0.3));
  }

  // root flare
  const roots = rng.int(3, 5);
  for (let i = 0; i < roots; i++) {
    const dir = i % 2 === 0 ? -1 : 1;
    const spread = halfWidth * rng.range(0.6, 1.8);
    const ry = baseY - rng.range(0, h * 0.02);
    fillPoly(c, [
      [x + dir * halfWidth * 0.5, ry - rng.range(8, 16)],
      [x + dir * (halfWidth + spread), ry + rng.range(2, 7)],
      [x + dir * (halfWidth + spread * 0.7), ry + rng.range(6, 12)],
      [x + dir * halfWidth * 0.3, ry + 6],
    ], mix(base, '#000000', 0.45));
  }

  if (frost) {
    // frost catching the upper-left shoulder of the bark
    for (let i = 0; i < Math.round(h * 0.25); i++) {
      const y = top + rng.range(0, h);
      const f = (y - top) / h;
      const w = halfWidth * (0.82 + 0.18 * f);
      if (rng.chance(0.25)) px(c, x - w + 1 + rng.int(0, 1), y, mix(frost, base, rng.range(0.35, 0.8)));
    }
  }

  return { x, top, baseY, halfWidth };
}

/**
 * A drooping snow-laden bough reaching in from the frame edge.
 *
 * Needles are drawn as short swept-back strokes along the limb rather than
 * scattered points — that is what makes a frond read as foliage instead of
 * noise. Snow is then laid along the upper contour the needles describe.
 * dir: -1 grows leftward, +1 grows rightward.
 */
export function drawBough(c, opts) {
  const {
    x, y, length, dir, droop = 0.35, rng,
    color = PAL.voidBlack, frost = PAL.frost, frostAmount = 0.5, thickness = 3,
  } = opts;

  const steps = Math.max(4, Math.round(length));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([
      x + dir * length * t,
      y + Math.pow(t, 1.65) * length * droop + Math.sin(t * 4.3) * length * 0.02,
    ]);
  }

  // tuft envelope: a scalloped profile so the frond has separate clusters
  const tuftAt = (i) => 0.52 + 0.48 * Math.abs(Math.sin(i * 0.38 + 0.7));
  const spanAt = (i, t) => length * 0.30 * (1 - t * 0.70) * tuftAt(i);

  // ---- needles below the limb
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const [cx, cy] = pts[i];
    const L = spanAt(i, t);
    if (L < 1.2) continue;
    line(c, cx, cy, cx - dir * L * 0.42, cy + L, color, 1);
    if (i % 2 === 0) line(c, cx, cy, cx - dir * L * 0.82, cy + L * 0.62, color, 1);
    if (i % 3 === 0) line(c, cx, cy, cx - dir * L * 0.12, cy + L * 0.78, color, 1);
    // ---- and the shallower mass above it, where the snow will sit
    const U = L * 0.44;
    line(c, cx, cy, cx - dir * U * 0.75, cy - U, color, 1);
    if (i % 2 === 1) line(c, cx, cy, cx - dir * U * 1.3, cy - U * 0.55, color, 1);
  }

  // ---- the limb itself, tapering outward
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const th = Math.max(1, Math.round(thickness * (1 - t * 0.75)));
    line(c, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], color, th);
  }

  // ---- frost crust along the upper contour
  if (frostAmount > 0) {
    let prev = null;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const [cx, cy] = pts[i];
      const U = spanAt(i, t) * 0.44;
      if (U < 1) continue;
      const tip = [cx - dir * U * 0.75, cy - U];
      const heavy = rng.chance(frostAmount);
      if (prev && heavy) {
        line(c, prev[0], prev[1], tip[0], tip[1], mix(frost, color, rng.range(0.15, 0.5)), 1);
        if (rng.chance(0.45)) px(c, tip[0], tip[1] + 1, mix(frost, color, 0.65));
      } else if (heavy) {
        px(c, tip[0], tip[1], mix(frost, color, 0.3));
      }
      prev = tip;
    }
  }
  return pts;
}

/**
 * A silhouette-only conifer band used for distant tree walls.
 *
 * Every tree is drawn through wrapX, so a trunk that overhangs the tile seam
 * is also painted on the far side and the wall repeats forever cleanly.
 */
export function drawForestBand(c, opts) {
  const {
    W, baseY, minH, maxH, color, rng,
    snowColor = null, snowAmount = 0, step = 9,
  } = opts;

  for (let x = 0; x < W; x += rng.range(step * 0.6, step * 1.4)) {
    const h = rng.range(minH, maxH);
    const halfWidth = h * rng.range(0.14, 0.22);
    const baseJitter = baseY + rng.signed(3);
    // one seeded stream per tree so both copies are pixel-identical
    const treeSeed = Math.floor(rng() * 0xffffff);
    wrapX(W, x, halfWidth + 4, (sx) => {
      drawPine(c, {
        x: sx,
        baseY: baseJitter,
        height: h,
        halfWidth,
        color,
        snowColor,
        snowAmount,
        rng: makeRng(treeSeed),
        trunk: false,
      });
    });
  }
}
