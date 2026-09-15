/**
 * The running villager — an 8-frame spritesheet baked once at boot.
 *
 * The frames are generated parametrically from a run cycle (contact, down,
 * pass, up, ×2) rather than hand-plotted, which keeps the loop fluid and lets
 * the sprite scale with the viewport's pixel unit. The sheet is a real
 * spritesheet: the path layer blits a single source rect per frame.
 */
import { surface, rect, px, line, fillPoly, disc, hline, mix } from '../lib/paint.js';
import { PAL } from '../palette.js';
import { hipBob, footReach, footLift, armSwing, joint } from './gait.js';

export const FRAME_COUNT = 8;

const CLOAK = '#171320';
const CLOAK_DARK = '#0c0a11';
const HOOD = '#100d16';
const BOOT = '#0a080d';

export function buildRunner(bodyHeight) {
  const u = Math.max(1, bodyHeight / 20);      // one "pixel unit" of the body
  const fw = Math.ceil(u * 20);
  const fh = Math.ceil(u * 24);
  const s = surface(fw * FRAME_COUNT, fh);
  const c = s.ctx;

  for (let i = 0; i < FRAME_COUNT; i++) {
    drawFrame(c, i * fw + fw * 0.42, fh - Math.round(u * 1.5), u, (i / FRAME_COUNT) * Math.PI * 2);
  }

  return {
    sheet: s.canvas,
    frameW: fw,
    frameH: fh,
    count: FRAME_COUNT,
    /** Lantern position within a frame, for the travelling light. */
    lantern: { x: fw * 0.42 + u * 5.6, y: fh - Math.round(u * 1.5) - u * 10.5 },
    /** Blit one frame with its feet at (x, y). */
    draw(ctx, x, y, frame) {
      const f = ((frame % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
      ctx.drawImage(
        s.canvas,
        f * fw, 0, fw, fh,
        Math.round(x - fw * 0.42), Math.round(y - (fh - Math.round(u * 1.5))),
        fw, fh,
      );
    },
  };
}

/** One pose of the cycle. Origin (ox, oy) is the ground contact point. */
function drawFrame(c, ox, oy, u, phase) {
  // hips drop a quarter-step after each contact and rise before the next
  const bob = hipBob(phase) * u * 0.85;
  const hipY = oy - u * 8 + bob;
  const shoulderY = oy - u * 15 + bob;
  // the torso pitches forward slightly as the body rises over the front foot
  const lean = u * (0.9 - hipBob(phase) * 0.35);

  const rimLit = mix(CLOAK, PAL.amber, 0.30);       // lantern side
  const rimCold = mix(CLOAK, PAL.frostMid, 0.18);   // moon side

  /* ------------------------------------------------------------- legs */
  drawLeg(c, ox, hipY, u, phase, CLOAK_DARK);
  drawLeg(c, ox, hipY, u, phase + Math.PI, mix(CLOAK_DARK, CLOAK, 0.6));

  /* --------------------------------------------------- trailing cloak */
  const flap = Math.sin(phase * 2 + 0.9);
  fillPoly(c, [
    [ox - u * 1.2, shoulderY + u * 1.2],
    [ox - u * 5.5 - flap * u * 1.6, shoulderY + u * 3.5 + flap * u],
    [ox - u * 6.2 - flap * u * 1.2, hipY + u * 3.2 - flap * u * 0.8],
    [ox - u * 2.6, hipY + u * 4],
    [ox + u * 0.6, hipY + u * 1.5],
  ], CLOAK_DARK);

  /* -------------------------------------------------------- torso/robe */
  fillPoly(c, [
    [ox - u * 2 + lean, shoulderY],
    [ox + u * 2.4 + lean, shoulderY + u * 0.4],
    [ox + u * 2.8, hipY + u * 2.6],
    [ox - u * 2.9, hipY + u * 2.8],
  ], CLOAK);
  // hem shadow
  hline(c, ox - u * 2.9, ox + u * 2.8, hipY + u * 2.6, CLOAK_DARK);

  /* --------------------------------------------------------------- arms */
  // The free arm swings opposite its own leg and is at full stretch at the
  // down pose, not at contact. Elbow comes from the same IK as the knees.
  const shx = ox - u * 0.6 + lean;
  const shy = shoulderY + u * 1.2;
  const handX = shx + armSwing(phase) * u * 2.3 - u * 1.5;
  const handY = shy + u * 3.6;
  const elbow = joint(shx, shy, handX, handY, u * 2.1, u * 2.0, -1);
  line(c, shx, shy, elbow.x, elbow.y, CLOAK_DARK, Math.max(1, Math.round(u * 1.4)));
  line(c, elbow.x, elbow.y, handX, handY, CLOAK_DARK, Math.max(1, Math.round(u * 1.2)));

  // lantern arm reaches forward and down, barely swinging so the light is steady
  const hx = ox + u * 5.6;
  const hy = shoulderY + u * 4.5 + hipBob(phase) * u * 0.3;
  line(c, ox + u * 1.4 + lean, shoulderY + u * 1.2, ox + u * 3.4, shoulderY + u * 3,
    CLOAK, Math.max(1, Math.round(u * 1.4)));
  line(c, ox + u * 3.4, shoulderY + u * 3, hx, hy, CLOAK, Math.max(1, Math.round(u * 1.2)));

  /* --------------------------------------------------------------- head */
  const headY = shoulderY - u * 2.2;
  disc(c, ox + u * 0.6 + lean, headY, u * 2.1, HOOD);
  // hood peak trailing behind
  fillPoly(c, [
    [ox + u * 0.6 + lean, headY - u * 2.1],
    [ox - u * 3.4 - flap * u, headY + u * 1.2],
    [ox - u * 0.6, headY + u * 2],
  ], HOOD);
  // the face is a void inside the hood
  rect(c, ox + u * 1.4 + lean, headY - u * 0.2, u * 1.4, u * 1.4, PAL.voidBlack);

  /* ------------------------------------------------ rim light & lantern */
  // warm edge on the lantern side
  for (let y = headY - u * 2; y < hipY + u * 3; y += 1) {
    if ((y | 0) % 2 === 0) continue;
    px(c, ox + u * 2.5 + lean * 0.4, y, rimLit);
  }
  px(c, ox + u * 2.6 + lean, shoulderY + u, rimLit);
  px(c, ox - u * 2.4, shoulderY + u * 2, rimCold);

  drawLantern(c, hx, hy, u);
}

function drawLeg(c, ox, hipY, u, phase, col) {
  const fx = ox + footReach(phase) * u * 3.5;
  const fy = hipY + u * 7.4 - footLift(phase) * u * 3.0;

  // fixed bone lengths with the knee folding forward: the leg straightens at
  // contact and folds through the swing instead of stretching to reach
  const knee = joint(ox, hipY, fx, fy, u * 4.25, u * 4.1, 1);
  const th = Math.max(1, Math.round(u * 1.5));
  line(c, ox, hipY, knee.x, knee.y, col, th);
  line(c, knee.x, knee.y, fx, fy, col, Math.max(1, th - 1));

  // the foot rolls: flat through stance, toe down at push off
  const toe = footReach(phase) < -0.45 ? u * 0.3 : 0;
  rect(c, fx - u * 0.8, fy - u * 0.4 + toe, u * 2.2, u * 1.2, BOOT);
}

function drawLantern(c, x, y, u) {
  const frame = mix(PAL.bark, PAL.amberDeep, 0.35);
  // bail handle
  line(c, x, y - u * 1.9, x - u * 0.6, y - u * 1.2, frame, 1);
  line(c, x, y - u * 1.9, x + u * 0.6, y - u * 1.2, frame, 1);
  // housing
  rect(c, x - u, y - u * 1.2, u * 2.2, u * 0.5, frame);
  rect(c, x - u, y + u * 1.4, u * 2.2, u * 0.5, frame);
  // glass
  rect(c, x - u * 0.7, y - u * 0.7, u * 1.6, u * 2.1, PAL.amber);
  rect(c, x - u * 0.3, y - u * 0.4, u * 0.8, u * 1.4, PAL.amberPale);
  px(c, x, y + u * 0.2, '#fff6e2');
}
