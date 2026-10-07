/**
 * Sparks off the fire.
 *
 * A few dozen embers lift from the effigy's chest, each on its own slow cycle.
 * They drift on the wind, brighten as they leave the fire and go out as they
 * climb. The glow is baked once into a sprite; per frame it is only stamped,
 * additively, so the cost is a few dozen small draws.
 */
import { makeSurface } from './surface.js';

const COUNT = 34;

export function buildEmbers(effigy, dpr, rng) {
  const r = 9;
  const sprite = makeSurface(-r, -r, r * 2, r * 2, dpr);
  const c = sprite.ctx;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, 'rgba(255,200,170,1)');
  g.addColorStop(0.22, 'rgba(255,96,80,0.75)');
  g.addColorStop(0.55, 'rgba(255,34,51,0.22)');
  g.addColorStop(1, 'rgba(255,34,51,0)');
  c.fillStyle = g;
  c.fillRect(-r, -r, r * 2, r * 2);

  const list = [];
  for (let i = 0; i < COUNT; i++) {
    list.push({
      spread: rng() * 2 - 1,
      rate: 0.05 + rng() * 0.09,       // cycles per second
      phase: rng(),
      rise: effigy.height * (0.3 + rng() * 0.55),
      size: 0.4 + rng() * 0.9,
      wobble: 0.5 + rng() * 0.8,
      wobblePhase: rng() * 10,
    });
  }
  return { sprite, list, x: effigy.cx, y: effigy.heartY, span: effigy.height * 0.46 };
}

export function drawEmbers(c, e, t) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const p of e.list) {
    const k = (t * p.rate + p.phase) % 1;             // 0 at the fire, 1 spent
    const x = e.x + p.spread * e.span * 0.07 * (1 + k)
      + Math.sin(t * p.wobble + p.wobblePhase) * e.span * 0.035 * k;
    const y = e.y - k * p.rise;
    c.globalAlpha = Math.sin(Math.PI * k) * (1 - k * 0.6) * 0.9;
    const s = p.size * 18;
    c.drawImage(e.sprite.canvas, x - s / 2, y - s / 2, s, s);
  }
  c.restore();
}
