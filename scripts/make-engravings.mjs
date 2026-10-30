// Prepares the woodcuts and engravings for the page.
//
//   node scripts/make-engravings.mjs
//
// Reads every image in assets/engravings/ (black ink on white or transparent
// paper, any size or format) and writes a small WebP of each, black ink on nothing (the paper cut away), to
// public/engravings/. The page then lays them over the backgrounds of the
// sections (components/Engravings.tsx): inverted to light lines, faded, tilted
// and half off the edge. Add a file, run this, and it is placed.
import { readdirSync, mkdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const SRC = 'assets/engravings';
const OUT = 'public/engravings';
mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp|gif|tiff?)$/i.test(f)).sort();
if (!files.length) { console.log('nothing in', SRC); process.exit(0); }

for (const f of files) {
  const name = basename(f, extname(f)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const grey = await sharp(join(SRC, f))
    .flatten({ background: '#ffffff' })     // transparent paper becomes white
    .greyscale()
    .normalise()                              // ink to black, paper to white, whatever the scan
    .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })   // drawn at most ~1000 px wide on a sharp screen, and faint
    .extractChannel(0)                        // one channel: greyscale alone still hands back three
    .raw()
    .toBuffer({ resolveWithObject: true });
  // the paper is cut away: black ink whose opacity is how dark the ink was,
  // so the page needs no blend mode to lose the paper (and no browser shows it)
  const { width, height } = grey.info;
  const alpha = grey.data.map((v) => 255 - v);
  const info = await sharp({ create: { width, height, channels: 3, background: '#000000' } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .webp({ quality: 60, alphaQuality: 60, effort: 6 })
    .toFile(join(OUT, `${name}.webp`));
  console.log(`${name}.webp`, info.width, 'x', info.height, Math.round(info.size / 1024), 'KB');
}
