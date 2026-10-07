/**
 * The effigy.
 *
 * A harvest figure bound out of timber and straw, standing out in the crop:
 * splayed legs, a bundled torso, arms on a crossbeam, a sun wheel for a head.
 * Runes are burned down its body and along its arms, and they are the only
 * saturated thing in the frame.
 *
 * The silhouette is baked once, and so is the bloom around the runes.
 *
 * The bloom used to be drawn live with `shadowBlur` on every stroke, which
 * measured at 5.9fps against 60.5 with the whole fire pass switched off — a
 * large canvas shadow is one of the most expensive things a 2D context can
 * do, and there were twenty of them a frame. It is now baked into its own
 * layer once and blitted with a breathing alpha, while the sharp cores are
 * stroked live without any shadow so each rune can still flicker on its own.
 *
 * Each of those layers is cropped to what it actually paints. The figure
 * stands in about a tenth of the frame, and its bloom in rather less; blitting
 * two screenfuls of transparency a frame to move them was most of what the
 * effigy cost.
 */
import { PAL } from './palette.js';
import { RUNES, strokeRune, strokeWheel } from './runes.js';
import { makeSurface, blit } from './surface.js';

export function buildEffigy(w, h, horizonY, dpr, rng) {
  /* ------------------------------------------------- proportions on screen */
  const cx = Math.round(w * 0.5);
  const footY = Math.round(horizonY + h * 0.30);
  const height = Math.round(h * 0.46);
  const topY = footY - height;
  const span = height * 0.46;                 // arm span, tip to tip
  const armY = topY + height * 0.30;
  const headR = height * 0.075;
  const hipY = topY + height * 0.56;

  /* the runes are placed once and then lit every frame */
  const marks = [];
  const torsoRunes = 4;
  for (let i = 0; i < torsoRunes; i++) {
    const size = height * 0.068;
    marks.push({
      rune: RUNES[Math.floor(rng() * RUNES.length)],
      x: cx - size / 2,
      y: topY + height * (0.34 + i * 0.055),
      w: size,
      h: size * 1.25,
      phase: rng() * Math.PI * 2,
    });
  }
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const size = height * 0.05;
      marks.push({
        rune: RUNES[Math.floor(rng() * RUNES.length)],
        x: cx + dir * span * (0.26 + i * 0.22) - size / 2,
        y: armY - size * 0.6,
        w: size,
        h: size * 1.25,
        phase: rng() * Math.PI * 2,
      });
    }
  }
  for (const dir of [-1, 1]) {
    const size = height * 0.055;
    marks.push({
      rune: RUNES[Math.floor(rng() * RUNES.length)],
      x: cx + dir * height * 0.085 - size / 2,
      y: hipY + height * 0.16,
      w: size,
      h: size * 1.25,
      phase: rng() * Math.PI * 2,
    });
  }

  /* ---------------------------------------------------- the bound silhouette */
  /* the timber reaches half an arm span past centre, and the round line caps
     and the wheel a little past that again */
  const bodyPad = height * 0.06;
  const body = makeSurface(
    cx - span * 0.54 - bodyPad, topY - bodyPad,
    span * 1.08 + bodyPad * 2, height + bodyPad * 2, dpr,
  );
  const c = body.ctx;

  const timber = (x1, y1, x2, y2, width, col) => {
    c.strokeStyle = col;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  };

  const legW = height * 0.055;
  const armW = height * 0.042;
  const torsoW = height * 0.105;

  /* A bound timber is a cylinder, so it is shaded like one. The key light is
     the moon, high on the upper left, so the straw there catches it; the
     fire's rim lights the far side of each piece, and the fire throws warmth
     back onto whatever stands nearest it. Drawn as three offset strokes, so it
     costs nothing once baked. */
  const bound = (x1, y1, x2, y2, width) => {
    timber(x1, y1, x2, y2, width, PAL.strawDark);
    c.globalAlpha = 0.55;
    timber(x1 - width * 0.22, y1 - width * 0.1, x2 - width * 0.22, y2 - width * 0.1,
      width * 0.38, PAL.strawHi);
    c.globalAlpha = 0.3;
    timber(x1 + width * 0.34, y1 + width * 0.12, x2 + width * 0.34, y2 + width * 0.12,
      width * 0.14, PAL.ember);
    c.globalAlpha = 1;
  };

  // the contact shadow where the feet meet the crop, drawn under the legs
  c.save();
  c.translate(cx, footY);
  c.scale(1, 0.12);
  const contact = c.createRadialGradient(0, 0, 0, 0, 0, span * 0.42);
  contact.addColorStop(0, 'rgba(0,0,0,0.65)');
  contact.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = contact;
  c.fillRect(-span * 0.42, -span * 0.42, span * 0.84, span * 0.84);
  c.restore();

  // legs, splayed into the crop
  bound(cx - height * 0.02, hipY, cx - height * 0.15, footY, legW);
  bound(cx + height * 0.02, hipY, cx + height * 0.15, footY, legW);
  // the cross brace between them
  timber(cx - height * 0.10, footY - height * 0.10, cx + height * 0.10, footY - height * 0.10,
    legW * 0.5, PAL.strawDark);

  // torso: a bundle, wider at the shoulders
  const torsoFill = c.createLinearGradient(cx - torsoW * 0.62, 0, cx + torsoW * 0.62, 0);
  torsoFill.addColorStop(0, PAL.strawHi);
  torsoFill.addColorStop(0.4, PAL.strawDark);
  torsoFill.addColorStop(1, '#07050a');
  c.fillStyle = torsoFill;
  c.beginPath();
  c.moveTo(cx - torsoW * 0.62, armY - height * 0.02);
  c.lineTo(cx + torsoW * 0.62, armY - height * 0.02);
  c.lineTo(cx + torsoW * 0.40, hipY + height * 0.02);
  c.lineTo(cx - torsoW * 0.40, hipY + height * 0.02);
  c.closePath();
  c.fill();

  // arms: one beam, bound bundles hanging at the ends
  bound(cx - span * 0.5, armY + height * 0.02, cx + span * 0.5, armY - height * 0.01, armW);
  for (const dir of [-1, 1]) {
    bound(cx + dir * span * 0.5, armY + dir * height * 0.005,
      cx + dir * span * 0.54, armY + height * 0.11, armW * 0.8);
  }

  // neck and the wheel that stands for a head
  bound(cx, armY - height * 0.02, cx, topY + headR * 1.7, armW * 0.75);
  c.strokeStyle = PAL.strawDark;
  c.lineWidth = height * 0.022;
  strokeWheel(c, cx, topY + headR, headR);

  // straw stuffing catching a little of its own light
  c.strokeStyle = PAL.strawLit;
  c.lineWidth = 1;
  for (let i = 0; i < 160; i++) {
    const t = rng();
    const sx = cx + (rng() - 0.5) * torsoW * (t < 0.5 ? 1.1 : 0.8);
    const sy = armY + t * (hipY - armY);
    const len = height * (0.012 + rng() * 0.022);
    const a = (rng() - 0.5) * 1.3;
    c.globalAlpha = 0.25 + rng() * 0.4;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx + Math.sin(a) * len, sy - Math.cos(a) * len);
    c.stroke();
  }
  c.globalAlpha = 1;

  // bindings
  c.strokeStyle = PAL.bind;
  for (const [y, halfW] of [
    [armY + height * 0.015, torsoW * 0.60],
    [armY + height * 0.10, torsoW * 0.52],
    [hipY - height * 0.03, torsoW * 0.44],
    [hipY + height * 0.015, torsoW * 0.40],
  ]) {
    c.lineWidth = height * 0.012;
    c.beginPath();
    c.moveTo(cx - halfW, y);
    c.lineTo(cx + halfW, y - height * 0.006);
    c.stroke();
  }

  // grooves where the runes are cut, so they read even unlit
  c.strokeStyle = 'rgba(0,0,0,0.85)';
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (const m of marks) {
    c.lineWidth = Math.max(2, m.w * 0.17);
    strokeRune(c, m.rune, m.x, m.y, m.w, m.h);
  }

  /* ---- the bloom, baked once with the shadows that cost too much live ---- */
  /* only as large as the marks and the blur that spills off them */
  let gx0 = cx - headR, gy0 = topY - headR, gx1 = cx + headR, gy1 = topY + headR * 2;
  for (const m of marks) {
    const spill = m.w * 3.4;                  // shadowBlur carries about twice its radius
    gx0 = Math.min(gx0, m.x - spill);
    gy0 = Math.min(gy0, m.y - spill);
    gx1 = Math.max(gx1, m.x + m.w + spill);
    gy1 = Math.max(gy1, m.y + m.h + spill);
  }
  const glow = makeSurface(gx0, gy0, gx1 - gx0, gy1 - gy0, dpr);
  const gc = glow.ctx;
  gc.lineCap = 'round';
  gc.lineJoin = 'round';
  for (const m of marks) {
    gc.shadowColor = PAL.ember;
    gc.shadowBlur = m.w * 1.7;
    gc.strokeStyle = 'rgba(196,18,31,0.85)';
    gc.lineWidth = Math.max(2.4, m.w * 0.15);
    strokeRune(gc, m.rune, m.x, m.y, m.w, m.h);
    // a second pass deepens the halo without a wider blur
    strokeRune(gc, m.rune, m.x, m.y, m.w, m.h);
  }
  gc.shadowColor = PAL.ember;
  gc.shadowBlur = headR * 1.3;
  gc.strokeStyle = 'rgba(255,34,51,0.6)';
  gc.lineWidth = Math.max(1.4, height * 0.007);
  strokeWheel(gc, cx, topY + headR, headR * 0.92);

  /* ---- the halo, baked too ----------------------------------------------
     Both of its stops scale linearly with the fire's breath, so baking it at
     full strength and blitting it at `breath` is the same picture without a
     radial gradient rasterised every frame. */
  const heartY = armY + (hipY - armY) * 0.4;
  const haloR = height * 0.5;
  const halo = makeSurface(cx - haloR, heartY - haloR, haloR * 2, haloR * 2, dpr);
  const hg = halo.ctx.createRadialGradient(cx, heartY, 0, cx, heartY, haloR);
  hg.addColorStop(0, 'rgba(150,26,30,0.42)');
  hg.addColorStop(0.45, 'rgba(96,12,20,0.14)');
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  halo.ctx.fillStyle = hg;
  halo.ctx.fillRect(halo.x, halo.y, halo.w, halo.h);

  return {
    body,
    cx,
    footY,
    topY,
    heartY,
    height,

    /**
     * The fire. Three passes: the light it throws into the crop around its
     * feet, the bloom around the body, then the strokes themselves.
     */
    drawFire(c2, t) {
      const breath = 0.72 + Math.sin(t * 0.8) * 0.18 + Math.sin(t * 2.3) * 0.06;

      /* Bloom around the body only. The light reaching the crop is baked
       * into the stalks themselves in wheat.js — a big composited gradient
       * laid over the finished field banded badly and read as a flat wash. */
      c2.save();
      c2.globalCompositeOperation = 'lighter';
      c2.globalAlpha = breath;
      blit(c2, halo);

      /* the baked bloom, breathing */
      c2.globalAlpha = Math.min(1, 0.55 + breath * 0.45);
      blit(c2, glow);
      c2.globalAlpha = 1;

      /* the sharp cores, stroked live so each rune flickers on its own */
      c2.lineCap = 'round';
      c2.lineJoin = 'round';
      for (const m of marks) {
        const k = 0.55 + 0.45 * Math.sin(t * 0.9 + m.phase);
        const heat = breath * (0.62 + k * 0.38);
        c2.strokeStyle = `rgba(255,138,98,${0.85 * heat})`;
        c2.lineWidth = Math.max(1, m.w * 0.07);
        strokeRune(c2, m.rune, m.x, m.y, m.w, m.h);
      }
      const wk = 0.6 + 0.4 * Math.sin(t * 0.7 + 1.1);
      c2.strokeStyle = `rgba(255,120,90,${0.55 * breath * wk})`;
      c2.lineWidth = Math.max(1.2, height * 0.005);
      strokeWheel(c2, cx, topY + headR, headR * 0.92);
      c2.restore();
    },
  };
}
