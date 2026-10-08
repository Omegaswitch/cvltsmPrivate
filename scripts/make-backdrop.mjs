// Turns an old engraving or woodcut (dark ink on light paper) into the
// backdrop behind the manuscript: the ink becomes bone-coloured lines on
// transparency, faded so it sits deep in the paper.
// Usage: node scripts/make-backdrop.mjs <image> [strength 0..1]
// Then set SET.backdrop to '/textures/backdrop.webp' in data/site.ts.
import sharp from 'sharp';

const [src, strength = '0.14'] = process.argv.slice(2);
if (!src) { console.error('usage: node scripts/make-backdrop.mjs <image> [strength]'); process.exit(1); }
const k = Number(strength);
const { data, info } = await sharp(src)
  .resize({ height: 2400, withoutEnlargement: true })
  .greyscale()
  .normalise() // stretch the paper to white and the ink to black, whatever the scan's tone
  .raw()
  .toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(info.width * info.height * 4);
for (let i = 0, j = 0; i < data.length; i += info.channels, j += 4) {
  out[j] = 0xd2; out[j + 1] = 0xcc; out[j + 2] = 0xbe;
  out[j + 3] = Math.round((255 - data[i]) * k); // ink, not paper, carries the line
}
await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .webp({ quality: 80, alphaQuality: 85 })
  .toFile('public/textures/backdrop.webp');
console.log('public/textures/backdrop.webp', info.width, 'x', info.height, 'strength', k);
