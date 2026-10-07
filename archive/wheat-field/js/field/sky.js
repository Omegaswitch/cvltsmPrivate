/**
 * The night above the field.
 *
 * Baked once into an offscreen surface: a deep gradient, a scatter of faint
 * stars, a bank of haze sitting on the horizon and a treeline biting into it.
 * None of it moves, so there is no reason to redraw it.
 *
 * It has to cover the whole frame, not just the part of it that is sky. This
 * is the only layer painted over the previous frame, so wherever it is
 * transparent nothing is ever cleared: the ground below the treeline used to
 * be bare, and the crop and the chaff drifting over it accumulated there frame
 * after frame.
 */
import { PAL } from './palette.js';
import { makeSurface } from './surface.js';

export function buildSky(w, h, dpr, rng) {
  const surface = makeSurface(0, 0, w, h, dpr);
  const c = surface.ctx;

  const horizonY = h * 0.44;

  /* ------------------------------------------------- the ground it stands on */
  const ground = c.createLinearGradient(0, horizonY, 0, h);
  ground.addColorStop(0, PAL.horizon);
  ground.addColorStop(0.25, PAL.night2);
  ground.addColorStop(1, PAL.night0);
  c.fillStyle = ground;
  c.fillRect(0, 0, w, h);

  /* ------------------------------------------------------------ gradient */
  const g = c.createLinearGradient(0, 0, 0, horizonY * 1.12);
  g.addColorStop(0, PAL.night0);
  g.addColorStop(0.45, PAL.night1);
  g.addColorStop(0.78, PAL.night2);
  g.addColorStop(1, PAL.horizon);
  c.fillStyle = g;
  c.fillRect(0, 0, w, horizonY * 1.12);

  /* ----------------------------------------------------------------- moon */
  // The one cool light in the scene. Its halo is baked here, so the moon costs
  // nothing per frame, and the crop takes its tint from the same colour.
  const mx = w * 0.2;
  const my = h * 0.19;
  const mr = Math.max(12, h * 0.032);
  const halo = c.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 11);
  halo.addColorStop(0, 'rgba(183,199,224,0.16)');
  halo.addColorStop(0.28, 'rgba(183,199,224,0.07)');
  halo.addColorStop(1, 'rgba(183,199,224,0)');
  c.fillStyle = halo;
  c.fillRect(0, 0, w, h);
  const disc = c.createRadialGradient(mx - mr * 0.28, my - mr * 0.3, mr * 0.1, mx, my, mr);
  disc.addColorStop(0, PAL.moonDisc);
  disc.addColorStop(0.75, PAL.moon);
  disc.addColorStop(1, '#6d7f9c');
  c.fillStyle = disc;
  c.beginPath();
  c.arc(mx, my, mr, 0, Math.PI * 2);
  c.fill();

  /* --------------------------------------------------------------- stars */
  const count = Math.round((w * h) / 26000);
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const y = rng() * horizonY * 0.82;
    // they thin out toward the horizon haze
    const fade = 1 - y / (horizonY * 0.9);
    const a = rng() * 0.5 * fade;
    if (a < 0.03) continue;
    const r = rng() < 0.9 ? 0.6 : 1.1;
    c.beginPath();
    c.fillStyle = `rgba(159,178,204,${a.toFixed(3)})`;
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }

  /* ---------------------------------------------- haze along the horizon */
  const haze = c.createLinearGradient(0, horizonY - h * 0.2, 0, horizonY + h * 0.03);
  haze.addColorStop(0, 'rgba(42,32,56,0)');
  haze.addColorStop(0.65, 'rgba(42,32,56,0.5)');
  haze.addColorStop(1, 'rgba(42,32,56,0.82)');
  c.fillStyle = haze;
  c.fillRect(0, horizonY - h * 0.2, w, h * 0.23);

  /* ------------------------------------------------------ distant trees */
  // a low, ragged band — far enough away to be one flat value
  c.fillStyle = PAL.treeline;
  c.beginPath();
  c.moveTo(0, horizonY + 2);
  let x = 0;
  while (x < w) {
    const span = 14 + rng() * 70;
    const rise = (0.1 + rng() * 0.9) * h * 0.035;
    const kind = rng();
    if (kind < 0.55) {
      // conifer
      c.lineTo(x + span * 0.5, horizonY - rise);
      c.lineTo(x + span, horizonY + 1);
    } else {
      // rounded mass
      c.quadraticCurveTo(x + span * 0.5, horizonY - rise * 0.8, x + span, horizonY + 1);
    }
    x += span;
  }
  // closed at the foot of the frame, not just under the ridge: the ground is
  // all crop from here down, and a band of lit ground behind it left an edge
  c.lineTo(w, h);
  c.lineTo(0, h);
  c.closePath();
  c.fill();

  return { surface, horizonY };
}
