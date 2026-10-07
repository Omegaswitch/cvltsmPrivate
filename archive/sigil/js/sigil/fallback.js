/**
 * The still sigil, for browsers without WebGL.
 *
 * Built from the same geometry as the painted texture, so the static version
 * is the same drawing with the fire lit everywhere and nothing moving.
 */
import { sigilGeometry } from './glyphs.js';

const EMBER = '#ff3b2f';
const BONE = '#e8e1d6';

export function sigilSvg(S = 1000) {
  const g = sigilGeometry(S);
  const line = (x1, y1, x2, y2) =>
    `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;

  const rings = g.rings.map((r) =>
    `<circle cx="${g.centre}" cy="${g.centre}" r="${r.r.toFixed(2)}" stroke="${EMBER}" stroke-width="${r.w.toFixed(2)}"/>`).join('');

  const ticks = g.ticks.map((t) => line(t.x1, t.y1, t.x2, t.y2)).join('');

  const glyphs = g.glyphs.map((gl) => {
    const segs = gl.segs.map(([x1, y1, x2, y2]) => line(
      -gl.w / 2 + x1 * gl.w, -gl.h / 2 + y1 * gl.h,
      -gl.w / 2 + x2 * gl.w, -gl.h / 2 + y2 * gl.h,
    )).join('');
    const deg = (gl.angle * 180) / Math.PI;
    return `<g transform="translate(${gl.cx.toFixed(2)} ${gl.cy.toFixed(2)}) rotate(${deg.toFixed(2)})">${segs}</g>`;
  }).join('');

  return `<svg class="still__svg" viewBox="0 0 ${S} ${S}" aria-hidden="true" focusable="false">
  <defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="${(S * 0.006).toFixed(2)}" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter></defs>
  <g fill="none" stroke-linecap="round" filter="url(#glow)">
    <g stroke="${BONE}" stroke-opacity="0.35" stroke-width="${(S * 0.0016).toFixed(2)}">${ticks}</g>
    ${rings}
    <g stroke="${EMBER}" stroke-width="${(S * 0.0034).toFixed(2)}">${glyphs}</g>
  </g>
</svg>`;
}
