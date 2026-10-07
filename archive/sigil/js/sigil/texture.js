/**
 * Paints the sigil into a canvas that the shader samples as a texture.
 *
 * Channels are used as data, not colour: alpha is the stroke's coverage, so
 * edges are antialiased for free, and red is the glyph's order, which tells
 * the shader when that stroke lights during the ignition.
 */
import { sigilGeometry } from './glyphs.js';

export function paintSigil(S = 1024) {
  const g = sigilGeometry(S);
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const c = cv.getContext('2d');
  c.lineCap = 'round';
  c.lineJoin = 'round';

  const ink = (order) => `rgb(${Math.round(order * 255)},0,0)`;

  for (const ring of g.rings) {
    c.strokeStyle = ink(ring.order);
    c.lineWidth = ring.w;
    c.beginPath();
    c.arc(g.centre, g.centre, ring.r, 0, Math.PI * 2);
    c.stroke();
  }

  c.strokeStyle = ink(0);
  c.lineWidth = S * 0.0016;
  c.beginPath();
  for (const t of g.ticks) {
    c.moveTo(t.x1, t.y1);
    c.lineTo(t.x2, t.y2);
  }
  c.stroke();

  for (const gl of g.glyphs) {
    c.save();
    c.translate(gl.cx, gl.cy);
    c.rotate(gl.angle);
    c.strokeStyle = ink(gl.order);
    c.lineWidth = gl.stroke;
    c.beginPath();
    for (const [x1, y1, x2, y2] of gl.segs) {
      c.moveTo(-gl.w / 2 + x1 * gl.w, -gl.h / 2 + y1 * gl.h);
      c.lineTo(-gl.w / 2 + x2 * gl.w, -gl.h / 2 + y2 * gl.h);
    }
    c.stroke();
    c.restore();
  }

  return cv;
}
