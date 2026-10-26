// Makes the favicon, the app icons and the share image (the embed).
//
//   node scripts/make-brand.mjs
//
// From the CVLTSM outlines in assets/brand/ (cut from Valhalica, so nothing
// depends on a font being installed), the SWG logo and two of the engravings:
//   app/favicon.ico, app/icon.svg, app/apple-icon.png    (browser tabs, phones)
//   app/opengraph-image.png, app/twitter-image.png       (links shared anywhere)
// Next serves them by their names, with no code. The embed (v2) is the set's
// logo bleeding over a still from the film; see the share image below.
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { dripShapes, oozeFilter } from '../lib/ooze.ts';

const BONE = '#d4ccbf';
const pathOf = (file) => readFileSync(file, 'utf8').match(/ d="([^"]+)"/)[1];
const boxOf = (file) => readFileSync(file, 'utf8').match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);

const C = { d: pathOf('assets/brand/cvltsm-c.svg'), box: boxOf('assets/brand/cvltsm-c.svg') };
const WORD = { d: pathOf('assets/brand/cvltsm-wordmark.svg'), box: boxOf('assets/brand/cvltsm-wordmark.svg') };

// ---- the icon: the C, bone on black, centred with room round it
function iconSvg(size, pad, bg, round = 0) {
  const [x, y, w, h] = C.box;
  const s = (size - 2 * pad) / Math.max(w, h);
  const tx = (size - w * s) / 2 - x * s, ty = (size - h * s) / 2 - y * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" rx="${round}" fill="${bg}"/>
<path transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})" fill="${BONE}" d="${C.d}"/></svg>`;
}
writeFileSync('app/icon.svg', iconSvg(64, 11, '#070605', 12) + '\n');
await sharp(Buffer.from(iconSvg(180, 36, '#14110d'))).png().toFile('app/apple-icon.png');

// favicon.ico: a few PNGs in an ICO container (browsers read these directly)
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((n) => sharp(Buffer.from(iconSvg(n * 4, n * 0.6, '#070605', n * 0.8))).resize(n, n).png().toBuffer()));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
sizes.forEach((n, i) => {
  const e = 6 + 16 * i;
  head.writeUInt8(n, e); head.writeUInt8(n, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(pngs[i].length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
writeFileSync('app/favicon.ico', Buffer.concat([head, ...pngs]));

// ---- the share image (v2): the set's logo in its red, bleeding, over a
// still from the film crushed nearly to black and stained with blood; two
// engravings in dried-blood ink at the edges; grain over all of it; the
// manufacturer small at the top left. Darker and wetter than the page.
const W = 1200, H = 630;
const RED = '#cd1616';

// an engraving (black ink on white) turned into ink of `rgb` on nothing:
// the darkness of the ink becomes the opacity of a coloured layer
async function inkLayer(file, height, opacity, rgb = [0xd4, 0xcc, 0xbf]) {
  const grey = await sharp(file).flatten({ background: '#ffffff' }).resize({ height }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height: h, channels } = grey.info;
  const rgba = Buffer.alloc(width * h * 4);
  for (let i = 0; i < width * h; i++) {
    rgba[i * 4] = rgb[0]; rgba[i * 4 + 1] = rgb[1]; rgba[i * 4 + 2] = rgb[2];
    rgba[i * 4 + 3] = Math.round((255 - grey.data[i * channels]) * opacity);
  }
  const png = await sharp(rgba, { raw: { width, height: h, channels: 4 } }).png().toBuffer();
  return { href: `data:image/png;base64,${png.toString('base64')}`, w: width, h };
}
const uri = (buf) => `data:image/png;base64,${buf.toString('base64')}`;

// the film: the horned one before the fire, cropped to the frame, crushed and stained
const still = await sharp('public/film/berserker.webp')
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .greyscale().linear(1.7, -60)           // blacks crushed, the fire kept
  .png().toBuffer()
  // the light becomes blood: the grey drives a red ramp (black, dried blood, the fire's red)
  .then((b) => sharp(b).recomb([[0.95, 0, 0], [0.09, 0, 0], [0.07, 0, 0]]).png().toBuffer());

const dragon = await inkLayer('public/engravings/1-01.webp', 560, 0.2, [0x8a, 0x16, 0x12]);
const skull = await inkLayer('public/engravings/1-87.webp', 520, 0.24, [0x8a, 0x16, 0x12]);

// ---- the blood: the logo bleeds the way the colour chips do on the page,
// with the same filter and the same drip shapes (lib/ooze.ts), in the
// artwork's red; drawn at twice the size and scaled down.
const S = 2;
const LW = 860;
const logo = await sharp('public/brand/cvltsm.png').resize({ width: LW * S }).png().toBuffer({ resolveWithObject: true });
const LH = logo.info.height / S, LX = (W - LW) / 2, LY = 64;
const { data: la } = await sharp(logo.data).extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
const AW = LW * S;
const footAt = (x) => { for (let y = LH * S - 1; y >= 0; y--) if (la[y * AW + Math.round(x * S)] > 150) return y / S; return -1; };
const foot = Array.from({ length: LW }, (_, x) => footAt(x));
// the lowest points of the strokes (local lows of the outline, spread apart): the blood runs from there
const lows = [];
for (let x = 8; x < LW - 8; x++) {
  const y = foot[x];
  if (y < LH * 0.5) continue;
  if (foot.slice(x - 8, x + 9).every((v) => v <= y) && !lows.some((l) => Math.abs(l.x - x) < 40)) lows.push({ x, y });
}
// seeded, so the image is the same each time it is made; most drips short, a few long, as on the chips
let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
const drips = lows.filter(() => rand() > 0.12).map(({ x, y }) => {
  const w = 4.5 + rand() * 7.5;
  const len = rand() < 0.3 ? 130 + rand() * 110 : rand() < 0.25 ? 70 + rand() * 50 : 22 + rand() * 68;
  const d = dripShapes(w, len);
  const drop = len > 110 && rand() < 0.7 ? `<g transform="translate(0 ${(len + 28 + rand() * 40).toFixed(1)})"><circle ${attrs(d.drop)}/></g>` : '';
  return `<g transform="translate(${((LX + x) * S).toFixed(1)} ${((LY + y - 10) * S).toFixed(1)}) scale(${S})"><ellipse ${attrs(d.sag)}/><rect ${attrs(d.line)}/><g transform="translate(0 ${len.toFixed(1)})"><circle ${attrs(d.tip)}/></g>${drop}</g>`;
}).join('');

const BW = W * S, BH = H * S;
const logoImg = `<image href="${uri(logo.data)}" x="${LX * S}" y="${LY * S}" width="${LW * S}" height="${LH * S}"/>`;
const bloodSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}">
<defs>
  ${oozeFilter('ooze', { x: 0, y: 0, w: BW, h: BH }, S)}
  <filter id="under" filterUnits="userSpaceOnUse" x="0" y="0" width="${BW}" height="${BH}"><feGaussianBlur in="SourceAlpha" stdDeviation="${6 * S}"/><feOffset dy="${5 * S}"/></filter>
</defs>
<!-- a soft dark under the blood, so it stands off the film -->
<g filter="url(#under)" opacity="0.8">${logoImg}<g>${drips}</g></g>
<g filter="url(#ooze)">${logoImg}<g fill="${RED}">${drips}</g></g>
</svg>`;
const blood = await sharp(Buffer.from(bloodSvg)).png().toBuffer().then((b) => sharp(b).resize(W, H, { kernel: 'lanczos3' }).png().toBuffer());

const grain = await sharp('public/textures/grain.png').resize(W, H, { fit: 'cover' }).png().toBuffer();
const swg = await sharp('public/brand/SWGX.png').resize({ height: 40 }).png().toBuffer();

const groundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <radialGradient id="v" cx="0.5" cy="0.44" r="0.74"><stop offset="0.25" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#020000" stop-opacity="0.96"/></radialGradient>
  <linearGradient id="foot" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#030000" stop-opacity="0.9"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="#070101"/>
<image href="${uri(still)}" width="${W}" height="${H}"/>
<rect width="${W}" height="${H}" fill="#1a0201" opacity="0.35"/>
<image href="${dragon.href}" width="${dragon.w}" height="${dragon.h}" transform="translate(-150 270) rotate(-14 ${dragon.w / 2} ${dragon.h / 2})"/>
<image href="${skull.href}" width="${skull.w}" height="${skull.h}" transform="translate(880 -130) rotate(11 ${skull.w / 2} ${skull.h / 2})"/>
<rect width="${W}" height="${H}" fill="url(#v)"/>
<rect width="${W}" height="${H}" fill="url(#foot)"/>
</svg>`;
// the ground first, with its grain; the blood over it, clean
const ground = await sharp(Buffer.from(groundSvg)).composite([{ input: grain, blend: 'overlay' }]).png().toBuffer();
await sharp(ground)
  .composite([{ input: blood }, { input: swg, left: 52, top: 44 }])
  .png({ compressionLevel: 9 }).toFile('app/opengraph-image.png');
await sharp('app/opengraph-image.png').toFile('app/twitter-image.png');
console.log('favicon.ico, icon.svg, apple-icon.png, opengraph-image.png, twitter-image.png');
