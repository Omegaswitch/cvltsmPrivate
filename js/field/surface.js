/**
 * Offscreen layers.
 *
 * Every baked layer used to be a canvas of CSS-pixel size blitted through the
 * main context's device-pixel transform, which meant each one was *magnified*
 * on every frame — four times on a retina display, nine on a phone. It cost
 * most of the frame budget and it softened everything that was baked: stars,
 * rune cores, the wheel. A surface is sized in device pixels and carries the
 * transform that lets it be painted in ordinary screen coordinates, so it
 * blits one to one.
 *
 * A surface also carries an origin, so a layer that only covers part of the
 * frame — the effigy stands in about a tenth of it — can be cropped to what it
 * actually paints instead of blitting a screenful of transparency.
 */

/**
 * @param {number} x,y  top-left of the region, in screen coordinates
 * @param {number} w,h  its size, in screen coordinates
 * @param {number} dpr  device pixel ratio
 */
export function makeSurface(x, y, w, h, dpr) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));

  // snap the origin to a whole device pixel so the blit never lands on a
  // half pixel and resamples
  const ox = Math.round(x * dpr) / dpr;
  const oy = Math.round(y * dpr) / dpr;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr);

  return {
    canvas,
    ctx,
    dpr,
    x: ox,
    y: oy,
    /* the exact screen size that maps the canvas one to one */
    w: canvas.width / dpr,
    h: canvas.height / dpr,
  };
}

/** Paint a surface back at its own origin, one device pixel to one. */
export function blit(c, s) {
  c.drawImage(s.canvas, s.x, s.y, s.w, s.h);
}

/**
 * Paint a surface as a sprite anchored at an arbitrary point, snapped to whole
 * device pixels so it copies rather than resamples.
 */
export function stamp(c, s, x, y) {
  const d = s.dpr;
  c.drawImage(
    s.canvas,
    Math.round((x + s.x) * d) / d,
    Math.round((y + s.y) * d) / d,
    s.w, s.h,
  );
}
