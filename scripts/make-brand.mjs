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

// the logo, and where its strokes end at the bottom: the blood runs from there
const LW = 880;
const logo = await sharp('public/brand/cvltsm.png').resize({ width: LW }).png().toBuffer({ resolveWithObject: true });
const LH = logo.info.height, LX = (W - LW) / 2, LY = 70;
const { data: la } = await sharp(logo.data).extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
const foot = Array.from({ length: LW }, (_, x) => { for (let y = LH - 1; y >= 0; y--) if (la[y * LW + x] > 140) return y; return -1; });
// the lowest points of the strokes, one a stroke (local lows of the outline, spread apart)
const lows = [];
for (let x = 6; x < LW - 6; x++) {
  const y = foot[x];
  if (y < LH * 0.55) continue;
  if (foot.slice(x - 6, x + 7).every((v) => v <= y) && !lows.some((l) => Math.abs(l.x - x) < 46)) lows.push({ x, y });
}
// seeded, so the image is the same each time it is made
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const drips = lows.slice(0, 11).map(({ x, y }) => {
  const len = 30 + rand() * (rand() < 0.4 ? 150 : 70), w = 5 + rand() * 6;
  return { x: LX + x + (rand() - 0.5) * 4, y: LY + y - 4, len, w };
});
const dripSvg = drips.map(({ x, y, len, w }) => `
  <path d="M${x - w * 1.3} ${y} Q${x} ${y + 10} ${x + w * 1.3} ${y} Z"/>
  <rect x="${(x - w / 2).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${len.toFixed(1)}" rx="${(w / 2).toFixed(1)}"/>
  <circle cx="${x.toFixed(1)}" cy="${(y + len).toFixed(1)}" r="${(w * 0.85).toFixed(1)}"/>
  ${len > 110 ? `<circle cx="${(x + (rand() - 0.5) * 3).toFixed(1)}" cy="${(y + len + 26 + rand() * 30).toFixed(1)}" r="${(w * 0.6).toFixed(1)}"/>` : ''}`).join('');
// spatter: fine drops thrown off to the sides of the logo
const spatter = Array.from({ length: 70 }, () => {
  const a = rand() * Math.PI * 2, d = 120 + rand() * 360;
  const x = W / 2 + Math.cos(a) * d * 1.25, y = LY + LH * 0.5 + Math.sin(a) * d * 0.55;
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + rand() ** 3 * 4.5).toFixed(1)}"/>`;
}).join('');

const grain = await sharp('public/textures/grain.png').resize(W, H, { fit: 'cover' }).png().toBuffer();
const swg = await sharp('public/brand/SWGX.png').resize({ height: 40 }).png().toBuffer();

const shareSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <radialGradient id="v" cx="0.5" cy="0.46" r="0.72"><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#030000" stop-opacity="0.94"/></radialGradient>
  <linearGradient id="foot" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#050000" stop-opacity="0.85"/></linearGradient>
  <linearGradient id="blood" gradientUnits="userSpaceOnUse" x1="0" y1="${LY + LH * 0.6}" x2="0" y2="${H}"><stop offset="0" stop-color="${RED}"/><stop offset="0.5" stop-color="#9a0d08"/><stop offset="1" stop-color="#5a0503"/></linearGradient>
  <filter id="goo" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.6"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"/></filter>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feGaussianBlur in="SourceAlpha" stdDeviation="14"/><feOffset dy="6"/><feComponentTransfer><feFuncA type="linear" slope="0.85"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="${W}" height="${H}" fill="#0a0202"/>
<image href="${uri(still)}" width="${W}" height="${H}"/>
<rect width="${W}" height="${H}" fill="#2a0302" opacity="0.25"/>
<image href="${dragon.href}" width="${dragon.w}" height="${dragon.h}" transform="translate(-150 270) rotate(-14 ${dragon.w / 2} ${dragon.h / 2})"/>
<image href="${skull.href}" width="${skull.w}" height="${skull.h}" transform="translate(880 -130) rotate(11 ${skull.w / 2} ${skull.h / 2})"/>
<rect width="${W}" height="${H}" fill="url(#v)"/>
<rect width="${W}" height="${H}" fill="url(#foot)"/>
<g fill="#7a0904" opacity="0.8">${spatter}</g>
<g filter="url(#shadow)">
  <g filter="url(#goo)" fill="url(#blood)">${dripSvg}</g>
  <image href="${uri(logo.data)}" x="${LX}" y="${LY}" width="${LW}" height="${LH}"/>
</g>
</svg>`;
await sharp(Buffer.from(shareSvg))
  .composite([
    { input: grain, blend: 'overlay' },
    { input: swg, left: 52, top: 44 },
  ])
  .png({ compressionLevel: 9 }).toFile('app/opengraph-image.png');
await sharp('app/opengraph-image.png').toFile('app/twitter-image.png');
console.log('favicon.ico, icon.svg, apple-icon.png, opengraph-image.png, twitter-image.png');
