// Turns a white grunge texture with alpha into the paper overlay:
// tinted bone, and faded so it sits in the paper rather than on it.
// Usage: node scripts/make-grunge.mjs assets/grunge-source.webp [strength 0..1]
import sharp from 'sharp';

const [src, strength = '0.09'] = process.argv.slice(2);
if (!src) { console.error('usage: node scripts/make-grunge.mjs <source> [strength]'); process.exit(1); }
const k = Number(strength);
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  // keep the marks, colour them bone (#d2ccbe), scale their alpha
  data[i] = 0xd2; data[i + 1] = 0xcc; data[i + 2] = 0xbe;
  data[i + 3] = Math.round(data[i + 3] * k);
}
await sharp(data, { raw: info }).webp({ quality: 82, alphaQuality: 90 }).toFile('public/textures/grunge.webp');
console.log('public/textures/grunge.webp', info.width, 'x', info.height, 'strength', k);
