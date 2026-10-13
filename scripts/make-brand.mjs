// Makes the favicon, the app icons and the share image (the embed).
//
//   node scripts/make-brand.mjs
//
// From the CVLTSM outlines in assets/brand/ (cut from Valhalica, so nothing
// depends on a font being installed), the SWG logo and two of the engravings:
//   app/favicon.ico, app/icon.svg, app/apple-icon.png    (browser tabs, phones)
//   app/opengraph-image.png, app/twitter-image.png       (links shared anywhere)
// Next serves them by their names, with no code. Change the two engravings
// below to change the embed.
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

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

// ---- the share image: the name alone, large, over two faint engravings
// (light ink on the dark, tilted and half off the edge, as on the page), the
// manufacturer small at the top left
const W = 1200, H = 630;
const [wx, wy, ww, wh] = WORD.box;
const wordW = 800, ws = wordW / ww;
const wordH = wh * ws;

// an engraving (black ink on white) turned into light ink on nothing: the
// darkness of the ink becomes the opacity of a bone-coloured layer
async function inkLayer(file, height, opacity) {
  const grey = await sharp(file).flatten({ background: '#ffffff' }).resize({ height }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height: h, channels } = grey.info;
  const rgba = Buffer.alloc(width * h * 4);
  for (let i = 0; i < width * h; i++) {
    rgba[i * 4] = 0xd4; rgba[i * 4 + 1] = 0xcc; rgba[i * 4 + 2] = 0xbf;
    rgba[i * 4 + 3] = Math.round((255 - grey.data[i * channels]) * opacity);
  }
  const png = await sharp(rgba, { raw: { width, height: h, channels: 4 } }).png().toBuffer();
  return { href: `data:image/png;base64,${png.toString('base64')}`, w: width, h };
}
const dragon = await inkLayer('public/engravings/1-01.webp', 560, 0.26);
const web = await inkLayer('public/engravings/1-36.webp', 620, 0.22);

const swg = await sharp('public/brand/SWGX.png').resize({ height: 44 }).png().toBuffer();
const wordX = (W - wordW) / 2, wordY = (H - wordH) / 2 + 6;
const shareSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><radialGradient id="v" cx="0.5" cy="0.5" r="0.75"><stop offset="0.35" stop-color="#14110d"/><stop offset="1" stop-color="#050404"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#v)"/>
<image href="${dragon.href}" width="${dragon.w}" height="${dragon.h}" transform="translate(-110 250) rotate(-14 ${dragon.w / 2} ${dragon.h / 2})"/>
<image href="${web.href}" width="${web.w}" height="${web.h}" transform="translate(860 -150) rotate(9 ${web.w / 2} ${web.h / 2})"/>
<path transform="translate(${wordX} ${wordY}) scale(${ws.toFixed(5)}) translate(${-wx} ${-wy})" fill="${BONE}" d="${WORD.d}"/></svg>`;
await sharp(Buffer.from(shareSvg)).composite([{ input: swg, left: 56, top: 48 }]).png({ compressionLevel: 9 }).toFile('app/opengraph-image.png');
await sharp('app/opengraph-image.png').toFile('app/twitter-image.png');
console.log('favicon.ico, icon.svg, apple-icon.png, opengraph-image.png, twitter-image.png');
