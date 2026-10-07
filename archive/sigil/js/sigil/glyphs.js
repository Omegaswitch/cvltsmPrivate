/**
 * The sixteen runes and the geometry of the sigil built from them.
 *
 * Everything here is in plain numbers. The WebGL floor reads a texture that is
 * painted from this geometry, and the static fallback is an SVG built from the
 * same numbers, so the two cannot drift apart.
 */

/** Each rune is a list of [x1, y1, x2, y2] segments in a 0..1 box. */
export const RUNES = [
  // fehu
  [[0.3, 0, 0.3, 1], [0.3, 0.18, 0.75, 0.04], [0.3, 0.52, 0.72, 0.38]],
  // uruz
  [[0.2, 1, 0.2, 0.12], [0.2, 0.12, 0.72, 0.0], [0.72, 0.0, 0.72, 1]],
  // thurisaz
  [[0.28, 0, 0.28, 1], [0.28, 0.22, 0.72, 0.42], [0.72, 0.42, 0.28, 0.62]],
  // ansuz
  [[0.3, 0, 0.3, 1], [0.3, 0.1, 0.74, 0.26], [0.3, 0.4, 0.74, 0.56]],
  // raido
  [[0.26, 0, 0.26, 1], [0.26, 0.04, 0.72, 0.2], [0.72, 0.2, 0.26, 0.46], [0.26, 0.46, 0.74, 1]],
  // kaunan
  [[0.72, 0.04, 0.28, 0.5], [0.28, 0.5, 0.72, 0.96]],
  // hagalaz
  [[0.24, 0, 0.24, 1], [0.76, 0, 0.76, 1], [0.24, 0.36, 0.76, 0.64]],
  // isa
  [[0.5, 0, 0.5, 1]],
  // jera
  [[0.3, 0.1, 0.66, 0.3], [0.66, 0.3, 0.3, 0.5], [0.7, 0.9, 0.34, 0.7], [0.34, 0.7, 0.7, 0.5]],
  // eihwaz
  [[0.5, 0.06, 0.5, 0.94], [0.5, 0.06, 0.78, 0.0], [0.5, 0.94, 0.22, 1]],
  // algiz
  [[0.5, 0.18, 0.5, 1], [0.5, 0.18, 0.18, 0.0], [0.5, 0.18, 0.82, 0.0]],
  // sowilo
  [[0.72, 0.04, 0.34, 0.3], [0.34, 0.3, 0.68, 0.6], [0.68, 0.6, 0.3, 0.94]],
  // tiwaz
  [[0.5, 0.12, 0.5, 1], [0.5, 0.12, 0.2, 0.42], [0.5, 0.12, 0.8, 0.42]],
  // berkanan
  [[0.28, 0, 0.28, 1], [0.28, 0.02, 0.74, 0.22], [0.74, 0.22, 0.28, 0.46],
    [0.28, 0.46, 0.76, 0.72], [0.76, 0.72, 0.28, 0.98]],
  // othala
  [[0.5, 0, 0.22, 0.28], [0.22, 0.28, 0.5, 0.56], [0.5, 0.56, 0.78, 0.28], [0.78, 0.28, 0.5, 0],
    [0.22, 0.56, 0.16, 1], [0.78, 0.56, 0.84, 1]],
  // dagaz
  [[0.2, 1, 0.2, 0], [0.8, 1, 0.8, 0], [0.2, 0, 0.8, 1], [0.2, 1, 0.8, 0]],
];

export const RUNE_COUNT = RUNES.length;

/**
 * Each glyph's order, 0..1. The ring lights first (order 0) and the glyphs
 * follow clockwise from the top. The same number drives the ignition and the
 * menu hover: the shader matches a hovered glyph by its order.
 */
export function runeOrder(i) {
  return (i + 1) / (RUNE_COUNT + 1);
}

/**
 * Geometry for a sigil drawn at size S (square, in pixels).
 * Returned in pixel units so the painter and the SVG can use it directly.
 */
export function sigilGeometry(S) {
  const c = S / 2;

  const rings = [
    { r: S * 0.4, w: S * 0.0034, order: 0 },
    { r: S * 0.385, w: S * 0.0014, order: 0 },
    { r: S * 0.205, w: S * 0.0022, order: 0 },
    { r: S * 0.082, w: S * 0.0026, order: 0 },
  ];

  // sixty-four ticks on the outer ring; every fourth one is longer
  const ticks = [];
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    const inner = S * (k % 4 === 0 ? 0.35 : 0.367);
    const outer = S * 0.376;
    ticks.push({
      x1: c + Math.cos(a) * inner, y1: c + Math.sin(a) * inner,
      x2: c + Math.cos(a) * outer, y2: c + Math.sin(a) * outer,
    });
  }

  const gh = S * 0.094;
  const gw = gh * 0.62;
  const rg = S * 0.283;
  const glyphs = RUNES.map((segs, i) => {
    const a = -Math.PI / 2 + (i / RUNE_COUNT) * Math.PI * 2;
    return {
      i,
      order: runeOrder(i),
      cx: c + Math.cos(a) * rg,
      cy: c + Math.sin(a) * rg,
      // turned so each glyph's top points outward, as they are cut on a ring
      angle: a + Math.PI / 2,
      w: gw,
      h: gh,
      stroke: S * 0.0034,
      segs,
    };
  });

  return { size: S, centre: c, rings, ticks, glyphs };
}
