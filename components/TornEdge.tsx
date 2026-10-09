/**
 * A torn edge, as if the section had been ripped from something. On `top`
 * it rises above the section; on `bottom` it hangs below it, over whatever
 * comes next. Its colour is the section's own (--torn). The tear is drawn
 * from a fixed seed, so it is the same on every visit, server and client.
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

export function TornEdge({ seed = 7, side = 'top' }: { seed?: number; side?: 'top' | 'bottom' }) {
  return (
    <svg className={`torn torn--${side}`} viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
      <path d={tear(seed)} />
    </svg>
  );
}
