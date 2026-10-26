// Prepares the textures in public/textures/ from the originals in assets/textures/.
// Usage: node scripts/make-textures.mjs
import sharp from 'sharp';

const A = 'assets/textures';
const OUT = 'public/textures';

// grime: the brushed concrete as it is, greyscale. Multiplied over the
// footage, its white leaves the picture alone and its marks darken it.
await sharp(`${A}/concrete-brushed.jpg`).greyscale().resize({ width: 1280 }).webp({ quality: 42, effort: 6 })   // seen at 30% under a multiply and stretched to the screen: size and compression are invisible
  .toFile(`${OUT}/grime.webp`);

// ground: the plain concrete pressed into the dark, a warm near-black with
// its marks still legible, for everything below the film
// (two passes: sharp applies greyscale last, which would undo the tint)
const grey = await sharp(`${A}/concrete-plain.jpg`).greyscale().resize({ width: 1800 }).linear(0.12, 2).png().toBuffer();
await sharp(grey).toColourspace('srgb').tint({ r: 48, g: 30, b: 24 }).webp({ quality: 74 })
  .toFile(`${OUT}/ground.webp`);

// grain: a small tile of grey noise, shifted a few times a second
const N = 220;
const px = Buffer.alloc(N * N);
for (let i = 0; i < px.length; i++) px[i] = 128 + Math.round((Math.random() + Math.random() + Math.random() - 1.5) * 70);
await sharp(px, { raw: { width: N, height: N, channels: 1 } }).png().toFile(`${OUT}/grain.png`);

console.log('grime, ground, grain written to', OUT);
