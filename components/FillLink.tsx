/*
 * A menu word that is a vessel: on hover or focus, blood rises inside the
 * letters. Thick, not watery: it comes up in slow surges with pauses between
 * (the easing, in globals.css), its surface is low and lumpy and barely moves,
 * and the lumps change shape as the blood creeps through a fixed field of
 * noise (the filter below, which stays put while the blood moves under it).
 * The word itself is the clip: the blood shows only inside the letters.
 */

/** One stretch of the surface, 140 px long, uneven, so the drift never reads
 *  as a regular wave; drawn three times so it can slide one stretch and loop. */
const P = 140;
const BUMPS: [number, number][] = [[18, -1.6], [44, 0.9], [61, -0.6], [92, 1.4], [117, -1.1], [140, 0]];
const stretch = (o: number) => {
  let d = '';
  let x0 = o;
  for (const [x, y] of BUMPS) {
    const x1 = o + x;
    d += ` Q${(x0 + x1) / 2} ${y * 1.6} ${x1} 0`;
    x0 = x1;
  }
  return d;
};
const SURFACE = `M0 0${stretch(0)}${stretch(P)}${stretch(2 * P)} V60 H0 Z`;

/** The filter and the colour of the blood. Render once, with the menu. */
export function FillDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="viscous" x="-5%" y="-40%" width="110%" height="180%" colorInterpolationFilters="sRGB">
          {/* low, slow noise pushes the surface into lumps */}
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" result="lumpy" />
          {/* then the gooey pass: blurred and cut back hard, so the lumps are rounded and the blood holds together */}
          <feGaussianBlur in="lumpy" stdDeviation="1.1" result="soft" />
          <feColorMatrix in="soft" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
        </filter>
        <linearGradient id="fill-blood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e01a0e" />
          <stop offset="0.12" stopColor="#b10f07" />
          <stop offset="1" stopColor="#5c0502" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FillLink({ href, label }: { href: string; label: string }) {
  const id = `fill-${label.toLowerCase()}`;
  return (
    <a className="fill" href={href}>
      <span>{label}</span>
      <svg className="fill__svg" aria-hidden="true" focusable="false">
        <clipPath id={id}>
          <text x="0" y="50%">{label}</text>
        </clipPath>
        <text className="fill__word" x="0" y="50%">{label}</text>
        <g clipPath={`url(#${id})`}>
          <g filter="url(#viscous)">
            <g className="fill__level">
              <path className="fill__blood" d={SURFACE} fill="url(#fill-blood)" />
            </g>
          </g>
        </g>
      </svg>
    </a>
  );
}
