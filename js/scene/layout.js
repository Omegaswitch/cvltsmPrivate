/**
 * Shared scene anchors.
 *
 * Layer canvases are wider and taller than the viewport by a parallax margin,
 * so raw canvas coordinates are misleading: x = 0.9 * W sits out in the margin
 * and is never on screen at rest. `vx`/`vy` map a 0..1 position within the
 * *visible* frame to layer coordinates, which is what composition needs.
 */
export function makeLayout(W, H, mx = 0, my = 0) {
  const vw = W - mx * 2;
  const vh = H - my * 2;
  return {
    W, H, mx, my, vw, vh,
    /** 0..1 across the visible frame -> layer x */
    vx: (t) => mx + t * vw,
    /** 0..1 down the visible frame -> layer y */
    vy: (t) => my + t * vh,

    horizon: Math.round(my + vh * 0.565),
    treeBase: Math.round(my + vh * 0.600),
    groundY: Math.round(my + vh * 0.625),
    pathY: Math.round(my + vh * 0.700),
    waterY: Math.round(my + vh * 0.800),
  };
}
