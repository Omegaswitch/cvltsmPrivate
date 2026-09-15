/**
 * The traveller.
 *
 * He holds a fixed point in the frame while the whole wood streams past him
 * right to left, so he is permanently mid-stride and never arrives. His
 * walking pace sets the world's scroll speed (see engine.js) — that is what
 * keeps his feet from skating over ground moving at a different rate.
 */
import { px, mix, glow, glowEllipse } from '../lib/paint.js';
import { PAL } from '../palette.js';
import { buildRunner } from './villager.js';

const CYCLE = 0.55;                     // seconds per full 8-frame stride

export function buildTraveller(vh, seed) {
  const bodyH = Math.max(14, Math.round(vh * 0.056));
  const sprite = buildRunner(bodyH);
  const footOffset = sprite.frameH - Math.round((bodyH / 20) * 1.5);

  return {
    bodyH,
    /** Ground speed his stride implies, in virtual px/second. */
    strideSpeed: bodyH * 1.28,

    draw(ctx, t, x, y, still) {
      const time = still ? 1.7 : t;
      const frame = Math.floor((time / CYCLE) * sprite.count);
      const lx = x + sprite.lantern.x - sprite.frameW * 0.42;
      const ly = y - footOffset + sprite.lantern.y;
      const flicker = still ? 1 : 0.86 + Math.sin(time * 9.3) * 0.08 + Math.sin(time * 21.7) * 0.06;

      // pool of light on the ground, then the lantern's own halo
      glowEllipse(ctx, lx, y + vh * 0.004, bodyH * 2.9 * flicker, bodyH * 0.85, PAL.amber, 0.38);
      glowEllipse(ctx, lx, y + vh * 0.004, bodyH * 1.4, bodyH * 0.42, PAL.amberPale, 0.26);
      glow(ctx, lx, ly, bodyH * 2.0 * flicker, PAL.amber, 0.44);
      glow(ctx, lx, ly, bodyH * 0.8, PAL.amberPale, 0.8);

      sprite.draw(ctx, x, y, frame);

      // grit kicked up behind his heels
      if (!still) {
        for (let i = 0; i < 3; i++) {
          const a = time * 3 + i * 2.1;
          if ((Math.floor(a) + i) % 3 !== 0) continue;
          px(ctx, x - (a % 1) * bodyH * 1.4, y - Math.sin((a % 1) * Math.PI) * bodyH * 0.35,
            mix(PAL.amber, PAL.amberDeep, a % 1));
        }
      }
    },
  };
}
