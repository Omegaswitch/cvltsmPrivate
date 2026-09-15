/**
 * Runes as stroke paths rather than bitmaps.
 *
 * The previous design plotted these on a pixel grid. Here they are burned
 * into timber, so they want a real stroke with a real join — segments in a
 * unit box, scaled and stroked at whatever weight the effigy needs.
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

/** The sun wheel that crowns the effigy. */
export const WHEEL = [
  [[0.5, 0, 0.5, 1]], [[0, 0.5, 1, 0.5]],
  [[0.15, 0.15, 0.85, 0.85]], [[0.85, 0.15, 0.15, 0.85]],
];

/**
 * Stroke one rune into a box. Returns nothing; the caller sets stroke style,
 * width, shadow and composite before calling.
 */
export function strokeRune(ctx, rune, x, y, w, h) {
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of rune) {
    ctx.moveTo(x + x1 * w, y + y1 * h);
    ctx.lineTo(x + x2 * w, y + y2 * h);
  }
  ctx.stroke();
}

/** The sun wheel is several sub-paths; stroke it as a circle plus spokes. */
export function strokeWheel(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (const spoke of WHEEL) {
    const [x1, y1, x2, y2] = spoke[0];
    ctx.moveTo(x + (x1 - 0.5) * r * 2, y + (y1 - 0.5) * r * 2);
    ctx.lineTo(x + (x2 - 0.5) * r * 2, y + (y2 - 0.5) * r * 2);
  }
  ctx.stroke();
}
