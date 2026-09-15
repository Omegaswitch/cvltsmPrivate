/**
 * Shared scene anchors.
 *
 * The world scrolls right to left forever, so every layer canvas is a
 * horizontally *tiling* strip, wider than the viewport, drawn repeatedly at a
 * wrapping offset. Two different widths matter and must not be confused:
 *
 *   L.W   tile width  — where things are PLACED  (use L.tx)
 *   L.sw  screen width — how big things ARE      (use for sizing)
 *
 * Sizing off the tile width would make everything twice as large as intended.
 */
export function makeLayout(W, H, sw, my) {
  const vh = H - my * 2;
  return {
    W, H, sw, my, vh,
    /** 0..1 across the tile -> layer x (placement) */
    tx: (t) => t * W,
    /** 0..1 down the visible frame -> layer y */
    vy: (t) => my + t * vh,

    horizon: Math.round(my + vh * 0.565),
    treeBase: Math.round(my + vh * 0.600),
    groundY: Math.round(my + vh * 0.625),
    pathY: Math.round(my + vh * 0.700),
    waterY: Math.round(my + vh * 0.800),
  };
}
