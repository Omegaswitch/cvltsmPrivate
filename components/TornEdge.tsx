/**
 * A torn edge along the top of a section, as if the page had been ripped
 * from something. The tear is drawn from a fixed seed, so it is the same on
 * every visit and on the server and the client alike.
 */
function tear(seed: number, points = 90) {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const edge: string[] = [];
  let y = 22;
  for (let i = 0; i <= points; i++) {
    y = Math.max(4, Math.min(34, y + (rand() - 0.5) * 9 + (rand() < 0.08 ? (rand() - 0.5) * 18 : 0)));
    edge.push(`L${((i / points) * 1000).toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M0 40 ${edge.join(' ')} L1000 40 Z`;
}

export function TornEdge({ seed = 7 }: { seed?: number }) {
  return (
    <svg className="torn" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
      <path d={tear(seed)} />
    </svg>
  );
}
