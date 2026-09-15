/**
 * Elder-futhark inspired glyphs, hand-plotted on a 5- or 7-wide pixel grid.
 * These are stylised carvings for the sentinel trunks, not a faithful
 * transliteration alphabet.
 */
const G = (rows) => ({
  w: rows[0].length,
  h: rows.length,
  rows,
});

export const RUNES = [
  // fehu — cattle, wealth
  G(['X....', 'XX...', 'X.X..', 'XX...', 'X.X..', 'X....', 'X....']),
  // uruz — aurochs
  G(['XX..X', 'X.X.X', 'X..XX', 'X...X', 'X...X', 'X...X', 'X...X']),
  // thurisaz — the thorn / giant
  G(['X....', 'XX...', 'X.X..', 'X..X.', 'X.X..', 'XX...', 'X....']),
  // ansuz — the god, breath
  G(['X.X..', 'XX.X.', 'X.X..', 'XX...', 'X....', 'X....', 'X....']),
  // raido — the ride
  G(['XXX..', 'X..X.', 'X..X.', 'XXX..', 'X.X..', 'X..X.', 'X..X.']),
  // kaunan — the torch
  G(['...X.', '..X..', '.X...', 'X....', '.X...', '..X..', '...X.']),
  // hagalaz — hail
  G(['X...X', 'X...X', '.X.X.', '..X..', '.X.X.', 'X...X', 'X...X']),
  // isa — ice
  G(['..X..', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..']),
  // tiwaz — the spear of Tyr
  G(['..X..', '.XXX.', 'X.X.X', '..X..', '..X..', '..X..', '..X..']),
  // algiz — the elk, warding
  G(['X.X.X', 'X.X.X', '.XXX.', '..X..', '..X..', '..X..', '..X..']),
  // sowilo — the sun
  G(['..XX.', '.X...', '.X...', '..X..', '...X.', '...X.', '.XX..']),
  // dagaz — daybreak
  G(['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X.X.X', 'XX.XX', 'X...X']),
  // othala — the ancestral seat
  G(['.XXX.', 'X...X', 'X...X', '.XXX.', '.X.X.', 'X...X', 'X...X']),
  // antler ward
  G(['X...X', '.X.X.', 'X.X.X', '.XXX.', '..X..', '..X..', '..X..']),
  // jera — the turning year
  G(['.X...', 'X.X..', '.X.X.', '..X..', '.X.X.', 'X.X..', '...X.']),
];

/** The sun wheel medallion that anchors each rune column. */
export const WHEEL = {
  w: 9,
  h: 9,
  rows: [
    '...XXX...',
    '.XX.X.XX.',
    '.X..X..X.',
    'X...X...X',
    'XXXXXXXXX',
    'X...X...X',
    '.X..X..X.',
    '.XX.X.XX.',
    '...XXX...',
  ],
};

/**
 * Blit a glyph at 1:1 pixel scale (or an integer multiple).
 * Returns the height consumed so callers can stack columns.
 */
export function drawGlyph(ctx, glyph, x, y, color, scale = 1) {
  ctx.fillStyle = color;
  for (let r = 0; r < glyph.h; r++) {
    const row = glyph.rows[r];
    for (let c = 0; c < glyph.w; c++) {
      if (row[c] !== '.') {
        ctx.fillRect(Math.round(x + c * scale), Math.round(y + r * scale), scale, scale);
      }
    }
  }
  return glyph.h * scale;
}
