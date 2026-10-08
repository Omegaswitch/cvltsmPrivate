/*
 * Staves in the twig runes of the Rök stone: a stem, with branches on the
 * left counting the family and branches on the right counting the place.
 * Rendered on the server as plain lines; nothing here names what they spell.
 */

const H = 120;    // stem height
const W = 56;     // width of one stave
const STEP = 16;  // vertical gap between branches

export function TwigStone({ staves }: { staves: [number, number][] }) {
  return (
    <svg
      className="twigs"
      viewBox={`0 0 ${staves.length * W} ${H + 20}`}
      role="img"
      aria-label={`${staves.length} staves cut with branches`}
    >
      {staves.map(([left, right], i) => {
        const x = i * W + W / 2;
        const branch = (n: number, side: -1 | 1) =>
          Array.from({ length: n }, (_, k) => {
            const y = 18 + k * STEP;
            return <line key={`${side}${k}`} x1={x} y1={y + 10} x2={x + side * 14} y2={y} />;
          });
        return (
          <g key={i}>
            <line x1={x} y1={10} x2={x} y2={H + 10} />
            {branch(left, -1)}
            {branch(right, 1)}
          </g>
        );
      })}
    </svg>
  );
}
