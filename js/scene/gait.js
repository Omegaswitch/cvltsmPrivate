/**
 * Walk cycle mechanics, shared by the traveller and the pack.
 *
 * Built on the four standard key poses — contact, down, passing, up — rather
 * than a foot swinging around an ellipse:
 *
 *   contact  the foot reaches the ground, legs at full split
 *   down     the body drops as it accepts the weight; hips at their LOWEST,
 *            because the leg that just landed is bending
 *   passing  the free leg passes under the body
 *   up       the body rises onto the ball of the standing foot; hips at their
 *            HIGHEST, just before the next contact
 *
 * Phase runs 0..2π for one full stride of one leg: stance over [0, π] with
 * the foot planted and travelling backward under the body, swing over [π, 2π]
 * with the foot lifted and travelling forward. The other leg runs at phase+π.
 *
 * Two details that are easy to get wrong and obvious once wrong: the hips
 * oscillate twice per stride (once per step), lowest a quarter-step AFTER
 * contact rather than at it; and the arms swing opposite their own leg and
 * are at full stretch at the down pose, not at contact.
 */

const QUARTER = Math.PI / 4;

/** Hip height offset. +1 is the lowest point of the cycle (the down pose). */
export const hipBob = (phase) => Math.sin(phase * 2);

/** Foot travel: +1 fully forward (contact), -1 fully back (toe off). */
export const footReach = (phase) => Math.cos(phase);

/** Ground clearance: flat through stance, arcing up through swing. */
export const footLift = (phase) => Math.max(0, -Math.sin(phase));

/** True while this leg is carrying weight. */
export const isStance = (phase) => Math.sin(phase) >= 0;

/** Arm swing, opposite its own leg and widest at the down pose. */
export const armSwing = (phase) => -Math.cos(phase - QUARTER);

/**
 * Two-bone IK. Returns the knee (or elbow) that keeps both bone lengths
 * fixed, bending toward `forward` (+1 bends in the direction of travel).
 *
 * Without this the knee is a fixed fraction along the hip-to-foot line, so
 * the leg stretches and squashes through the cycle instead of folding — the
 * single biggest reason a walk reads as a puppet rather than a body.
 */
export function joint(hx, hy, fx, fy, l1, l2, forward) {
  const dx = fx - hx;
  const dy = fy - hy;
  const span = l1 + l2 - 0.001;
  const reach = Math.max(0.001, Math.min(Math.hypot(dx, dy), span));
  const a = (l1 * l1 - l2 * l2 + reach * reach) / (2 * reach);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / reach;
  const uy = dy / reach;
  return {
    x: hx + ux * a + uy * h * forward,
    y: hy + uy * a - ux * h * forward,
  };
}
