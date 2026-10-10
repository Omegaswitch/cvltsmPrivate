// Makes the favicon, the app icons and the share image (the embed).
//
//   node scripts/make-brand.mjs
//
// From the CVLTSM outlines in assets/brand/ (cut from Valhalica, so nothing
// depends on a font being installed), the SWG logo and one graded film frame:
//   app/favicon.ico, app/icon.svg, app/apple-icon.png    (browser tabs, phones)
//   app/opengraph-image.png, app/twitter-image.png       (links shared anywhere)
// Next serves them by their names, with no code. Change the frame below to
// change the embed.
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const BONE = '#d4ccbf';
const FRAME = 'public/film/berserker.webp';
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

// ---- the share image: the film's frame, darkened, the wordmark low on the
// left and the manufacturer small at the top, as on the page
const W = 1200, H = 630;
const [wx, wy, ww, wh] = WORD.box;
const wordW = 640, ws = wordW / ww;
const wordSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070605" stop-opacity="0.55"/><stop offset="0.45" stop-color="#070605" stop-opacity="0"/><stop offset="1" stop-color="#070605" stop-opacity="0.8"/></linearGradient>
<radialGradient id="v" cx="0.5" cy="0.45" r="0.8"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#v)"/>
<path transform="translate(64 ${H - 64 - wh * ws}) scale(${ws.toFixed(5)}) translate(${-wx} ${-wy})" fill="${BONE}" d="${WORD.d}"/></svg>`;
const swg = await sharp('public/brand/SWGX.png').resize({ height: 44 }).png().toBuffer();
await sharp(FRAME).resize(W, H, { fit: 'cover', position: 'attention' }).modulate({ brightness: 1.1 }).composite([
  { input: Buffer.from(wordSvg) },
  { input: swg, left: 64, top: 52 },
]).png({ compressionLevel: 9, palette: false }).toFile('app/opengraph-image.png');
await sharp('app/opengraph-image.png').toFile('app/twitter-image.png');
writeFileSync('app/opengraph-image.alt.txt', 'CVLTSM, in Valhalica letters, over a dark film frame of a horned figure before a fire. SWG.\n');
writeFileSync('app/twitter-image.alt.txt', 'CVLTSM, in Valhalica letters, over a dark film frame of a horned figure before a fire. SWG.\n');
console.log('favicon.ico, icon.svg, apple-icon.png, opengraph-image.png, twitter-image.png');
