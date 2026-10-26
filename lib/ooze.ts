/*
 * The blood, in one place: the gooey filter that fuses a colour and its drips
 * into one wet body (blur, then alpha contrast), lights its relief so the
 * drips catch a sheen, and shakes it a little. The colour chips draw with it
 * on the page (components/Ooze.tsx), and the share image is made with it
 * (scripts/make-brand.mjs), so both bleed the same way.
 *
 * `scale` multiplies every distance in it, for a drawing made at a larger
 * size than it is shown (the share image is drawn at twice its size).
 */
export function oozeFilter(id: string, box: { x: number; y: number; w: number; h: number }, scale = 1) {
  const s = (n: number) => +(n * scale).toFixed(4);
  return `<filter id="${id}" filterUnits="userSpaceOnUse" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceGraphic" stdDeviation="${s(3.4)}" result="soft"/>
  <feColorMatrix in="soft" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -9.5" result="goo"/>
  <feSpecularLighting in="soft" surfaceScale="${s(9)}" specularConstant="0.9" specularExponent="28" lighting-color="#ffffff" result="shine">
    <feDistantLight azimuth="235" elevation="42"/>
  </feSpecularLighting>
  <feComposite in="shine" in2="goo" operator="in" result="sheen"/>
  <feComposite in="goo" in2="sheen" operator="arithmetic" k1="0" k2="1" k3="0.42" k4="0" result="wet"/>
  <feTurbulence type="fractalNoise" baseFrequency="${+(0.03 / scale).toFixed(5)} ${+(0.05 / scale).toFixed(5)}" numOctaves="2" seed="3" result="noise"/>
  <feDisplacementMap in="wet" in2="noise" scale="${s(7)}" xChannelSelector="R" yChannelSelector="G"/>
</filter>`;
}

/** One drip's shapes at rest, from where it leaves an edge (0, 0) down: the sag, the line, its tip, the drop below. */
export function dripShapes(w: number, len: number, compact = false) {
  return {
    sag: { cx: 0, cy: 2, rx: w * 1.4, ry: compact ? 7 : 11 },
    line: { x: -w / 2, y: 0, width: w, height: len, rx: w / 2 },
    tip: { cx: 0, cy: 9 - w * 0.75, r: w * 0.75 },
    drop: { cx: 0, cy: 9, r: w * 0.85 },
  };
}
