/** Colour helpers. Plain hex in, plain hex out — no colour library needed. */

export function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Blend two hex colours. t = 0 gives a, t = 1 gives b. */
export function mix(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return rgbToHex(r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k);
}

/**
 * How strongly a point is lit by the effigy. Falls off faster vertically than
 * horizontally, because the light spills along the ground.
 */
export function litAmount(x, y, light) {
  const dx = (x - light.x) / light.radius;
  const dy = ((y - light.y) / light.radius) * 1.7;
  const d = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, 1 - d) ** 1.8;
}
