/**
 * Ground mist.
 *
 * Low fog lying in the crop and along the foot of the treeline. Without it the
 * far bands sit at full contrast against the sky and the field reads as a flat
 * cut-out; with it they recede. The blobs are baked once into a surface two
 * screens wide, and the layer is then slid sideways at a crawl. Every blob is
 * also drawn one screen either side, so the pattern repeats and the slide wraps
 * without a seam.
 */
import { makeSurface, blit } from './surface.js';

const SPEED = 9;     // screen pixels per second

export function buildMist(w, h, horizonY, dpr, rng) {
  const top = horizonY * 0.9;
  const height = horizonY * 0.55;
  const surface = makeSurface(0, top, w * 2, height, dpr);
  const c = surface.ctx;

  for (let i = 0; i < 40; i++) {
    const x = rng() * w;
    const y = top + rng() * height;
    const rx = w * (0.07 + rng() * 0.15);
    const ry = height * (0.14 + rng() * 0.22);
    const a = 0.45 + rng() * 0.4;
    for (const ox of [-w, 0, w]) {
      c.save();
      c.translate(x + ox, y);
      c.scale(1, ry / rx);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, `rgba(58,46,74,${a.toFixed(3)})`);
      g.addColorStop(0.5, `rgba(42,32,56,${(a * 0.45).toFixed(3)})`);
      g.addColorStop(1, 'rgba(42,32,56,0)');
      c.fillStyle = g;
      c.fillRect(-rx, -rx, rx * 2, rx * 2);
      c.restore();
    }
  }

  // fade the layer out at both ends, so the bank has no edge to show
  c.save();
  c.globalCompositeOperation = 'destination-in';
  const fade = c.createLinearGradient(0, top, 0, top + height);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(0.35, 'rgba(0,0,0,1)');
  fade.addColorStop(0.65, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = fade;
  c.fillRect(0, top, w * 2, height);
  c.restore();

  return { surface, period: w };
}

export function drawMist(c, mist, t) {
  const off = (t * SPEED) % mist.period;
  c.save();
  c.globalAlpha = 0.5;
  blit(c, { ...mist.surface, x: mist.surface.x - off });
  c.restore();
}
