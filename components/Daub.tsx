import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

/*
 * A link that, on hover or focus, is painted over with blood: a
 * brush scrubs back and forth across it, drips fall from the foot of the
 * smear and fuse with it, and the word is written over the blood in
 * Valhalica. The look and the timing are in globals.css; this file is
 * the markup. The shapes are strokes drawn along paths (so they can be
 * revealed along their length, which is what makes the stroke look painted
 * rather than wiped) and a gooey filter (BloodDefs, once per page) melts
 * them together.
 */

/** Drips of blood running from the smear: x, length, thickness, delay (s), and
 *  which way each wanders (a drip never runs quite straight). Unevenly spaced,
 *  as drips are; each ends in a drop that swells as it arrives. */
const DRIPS: [number, number, number, number, 1 | -1][] = [
  [21, 40, 5.5, 0.48, 1],
  [49, 24, 4, 0.66, -1],
  [93, 56, 6.5, 0.44, 1],
  [116, 18, 3.5, 0.74, -1],
  [151, 36, 5, 0.58, 1],
  [176, 46, 5.5, 0.52, -1],
];

const SMEAR = 'M12 20 C70 10 130 24 188 16 C198 26 192 32 182 37 C130 46 70 31 14 40 C6 48 12 54 22 56 C80 63 140 51 186 58';

function Blood() {
  return (
    <svg className="daub__blood" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g filter="url(#blood)">
        {/* a darker edge beneath, where the blood dries first; then the smear itself */}
        <path className="daub__smear daub__smear--rim" pathLength={1} d={SMEAR} />
        <path className="daub__smear" pathLength={1} d={SMEAR} />
        {DRIPS.map(([x, len, w, delay, lean]) => {
          const timing = { ['--d' as string]: `${delay}s`, ['--t' as string]: `${0.3 + len / 90}s` };
          return (
            <g key={x} style={timing}>
              <path
                className="daub__drip"
                pathLength={1}
                d={`M${x} 52 C${x + lean * 1.6} ${52 + len * 0.35} ${x - lean * 1.2} ${52 + len * 0.7} ${x} ${52 + len}`}
                style={{ strokeWidth: w }}
              />
              <circle className="daub__drop" cx={x} cy={52 + len} r={w * 0.95} />
            </g>
          );
        })}
      </g>
      <path className="daub__shine" pathLength={1} d="M18 13 C70 7 130 17 186 10" />
    </svg>
  );
}

/** The gooey filters the blood and the colours use. Render once, anywhere in the body. */
export function BloodDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="blood" filterUnits="userSpaceOnUse" x="-30" y="-30" width="260" height="180" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="soft" />
          <feColorMatrix in="soft" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
          {/* the same light as on the colour chips (Ooze), so the blood is wet, not flat: a sheen along its relief */}
          <feSpecularLighting in="soft" surfaceScale="6" specularConstant="0.7" specularExponent="24" lightingColor="#ffffff" result="shine">
            <feDistantLight azimuth="235" elevation="42" />
          </feSpecularLighting>
          <feComposite in="shine" in2="goo" operator="in" result="sheen" />
          <feComposite in="goo" in2="sheen" operator="arithmetic" k1="0" k2="1" k3="0.34" k4="0" result="wet" />
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.22" numOctaves="2" seed="8" result="noise" />
          <feDisplacementMap in="wet" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <linearGradient id="blood-fill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="110">
          <stop offset="0" stopColor="#bd1008" />
          <stop offset="0.45" stopColor="#8a0a04" />
          <stop offset="1" stopColor="#4a0602" />
        </linearGradient>
      </defs>
    </svg>
  );
}

type Common = { label: string; children: ReactNode };

export function DaubLink({ label, children, className = '', href = '', ...rest }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  // a link to another page of the site is followed without reloading, so the
  // music goes on; an anchor in the page is an ordinary link
  const Tag = href.startsWith('/') ? Link : 'a';
  return (
    <Tag className={`daub ${className}`} data-label={label} href={href} {...rest}>
      <span>{children}</span>
      <Blood />
    </Tag>
  );
}
