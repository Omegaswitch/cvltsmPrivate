// Makes the favicon, the app icons and the share image (the embed).
//
//   node scripts/make-brand.mjs
//
// From the CVLTSM outlines in assets/brand/ (cut from Valhalica, so nothing
// depends on a font being installed), the SWG logo and two of the engravings:
//   app/favicon.ico, app/icon.png, app/apple-icon.png    (browser tabs, phones)
//   public/share/cvltsm-v2.png (links shared anywhere; BRAND.share: a new picture takes a new name)
// Next serves them by their names, with no code. The embed (v2) is the set's
// logo bleeding over a still from the film; see the share image below.
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

// ---- the icon: the C of the v2 logo (its two crossed strokes, cut from the
// lettering by hand into assets/brand/cvltsm-c-cross.png), red on black,
// centred with room round it
const CROSS = 'assets/brand/cvltsm-c-cross.png';
async function icon(size, pad, bg, round = 0) {
  const inner = size - 2 * pad;
  // the strokes are thickened a little (blurred, then cut back low), so they hold at tab size
  const mask = await sharp(CROSS).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extractChannel(0).blur(Math.max(0.3, inner * 0.018)).linear(3.2, -40).toBuffer();
  const mark = await sharp({ create: { width: inner, height: inner, channels: 3, background: '#cd1616' } })
    .joinChannel(mask).png().toBuffer();
  const plate = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${round}" fill="${bg}"/></svg>`);
  return sharp(plate).composite([{ input: mark, left: Math.round(pad), top: Math.round(pad) }]).png().toBuffer();
}
writeFileSync('app/icon.png', await icon(192, 16, '#070605', 36));
writeFileSync('app/apple-icon.png', await icon(180, 22, '#070605'));

// favicon.ico: a few PNGs in an ICO container (browsers read these directly)
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map(async (n) => sharp(await icon(n * 4, n * 0.25, '#070605', n * 0.8)).resize(n, n).png().toBuffer()));
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

// ---- the logo: the set's marks in the artwork's red, clean, with a soft
// dark under them so they stand off the film. Drawn at twice the size and
// scaled down.
const S = 2;
const LW = 860;
const logo = await sharp('public/brand/cvltsm.png').resize({ width: LW * S }).png().toBuffer({ resolveWithObject: true });
const LH = logo.info.height / S, LX = (W - LW) / 2, LY = (H - LH) / 2 + 8;
const BW = W * S, BH = H * S;
const logoImg = `<image href="${uri(logo.data)}" x="${LX * S}" y="${LY * S}" width="${LW * S}" height="${LH * S}"/>`;
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}">
<defs><filter id="under" filterUnits="userSpaceOnUse" x="0" y="0" width="${BW}" height="${BH}"><feGaussianBlur in="SourceAlpha" stdDeviation="${8 * S}"/><feOffset dy="${5 * S}"/></filter></defs>
<g filter="url(#under)" opacity="0.85">${logoImg}</g>
${logoImg}
</svg>`;
const mark = await sharp(Buffer.from(markSvg)).png().toBuffer().then((b) => sharp(b).resize(W, H, { kernel: 'lanczos3' }).png().toBuffer());

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
// the ground first, with its grain; the logo over it, clean
const ground = await sharp(Buffer.from(groundSvg)).composite([{ input: grain, blend: 'overlay' }]).png().toBuffer();
await sharp(ground)
  .composite([{ input: mark }, { input: swg, left: 52, top: 44 }])
  .png({ compressionLevel: 9 }).toFile('public/share/cvltsm-v2.png');
console.log('favicon.ico, icon.png, apple-icon.png, share/cvltsm-v2.png');
