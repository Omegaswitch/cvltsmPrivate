import type { CSSProperties } from 'react';

/**
 * Torn edges, as if a section had been ripped from something. A section
 * with one is drawn a little taller than itself (by --tear-h, above or below)
 * and that extra strip is cut to the tear with a mask, so the edge is the
 * section's own ground, texture and burned edges and all: there is no second
 * colour to match. The tear is drawn from a fixed seed, so it is the same on
 * every visit, server and client.
 *
 *   <section className="kits torn-top torn-bottom" style={tears({ top: 7, bottom: 13 })}>
 */
function tear(seed: number, points = 90) {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const edge: string[] = [];
  let y = 22;
  for (let i = 0; i <= points; i++) {
    y = Math.max(4, Math.min(34, y + (rand() - 0.5) * 9 + (rand() < 0.08 ? (rand() - 0.5) * 18 : 0)));
    edge.push(`L${((i / points) * 1000).toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M0 40 ${edge.join(' ')} L1000 40 Z`;
}

/** the tear as a mask image: solid below the ragged line (a top edge), or above it, flipped (a bottom edge) */
const maskOf = (seed: number, side: 'top' | 'bottom') =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 40' preserveAspectRatio='none'><path ${side === 'bottom' ? "transform='matrix(1 0 0 -1 0 40)' " : ''}d='${tear(seed)}'/></svg>`,
  )}")`;

/** the mask images for a section's torn edges, as CSS variables (with the .torn-top / .torn-bottom classes) */
export function tears({ top, bottom }: { top?: number; bottom?: number }) {
  const style: Record<string, string> = {};
  if (top !== undefined) style['--tear-top'] = maskOf(top, 'top');
  if (bottom !== undefined) style['--tear-bottom'] = maskOf(bottom, 'bottom');
  return style as CSSProperties;
}
