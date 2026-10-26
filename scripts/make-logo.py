#!/usr/bin/env python3
"""
The set's logo, from the artwork: black marks scratched on red
(assets/brand/cvltsm-logo.png). The red is taken away, the marks are trimmed
to their box with a little air, and two files are written to public/brand/:

  cvltsm.png        the marks in the artwork's red, for the hero over the film
  cvltsm-black.png  the marks as drawn, for anywhere light

    python scripts/make-logo.py [assets/brand/cvltsm-logo.png]

Needs Pillow.
"""
import sys
from pathlib import Path
from PIL import Image

src = Path(sys.argv[1] if len(sys.argv) > 1 else 'assets/brand/cvltsm-logo.png')
out = Path('public/brand')
RED = (205, 22, 22)        # the artwork's ground
PAD = 60                   # air round the marks, in source pixels
WIDTH = 1600               # the files' width

im = Image.open(src).convert('RGB')
w, h = im.size
px = im.load()
# how far each pixel is from the red: 0 on the ground, 1 on a mark (soft at the edges)
alpha = Image.new('L', im.size)
ap = alpha.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        d = abs(r - RED[0]) + abs(g - RED[1]) + abs(b - RED[2])
        ap[x, y] = 255 if d > 160 else 0 if d < 40 else int((d - 40) * 255 / 120)
box = alpha.getbbox()
box = (max(0, box[0] - PAD), max(0, box[1] - PAD), min(w, box[2] + PAD), min(h, box[3] + PAD))
alpha = alpha.crop(box)
scale = WIDTH / alpha.width
alpha = alpha.resize((WIDTH, round(alpha.height * scale)), Image.LANCZOS)

for name, colour in (('cvltsm.png', RED), ('cvltsm-black.png', (20, 13, 13))):
    logo = Image.new('RGBA', alpha.size, colour + (0,))
    logo.putalpha(alpha)
    logo.save(out / name, optimize=True)
    print(f'{out / name}: {logo.width} x {logo.height}')
