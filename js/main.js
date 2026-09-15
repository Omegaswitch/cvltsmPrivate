/**
 * Boot. Wires the engine to the interface: the rain and ambient toggles and
 * the reduced-motion contract.
 */
import { createEngine } from './engine.js';
import { createAmbience } from './audio.js';

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const canvas = document.getElementById('scene');

const engine = createEngine(canvas, {
  reducedMotion: motionQuery.matches,
  onReady() {
    // one frame of grace so the first composite lands before the veil lifts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
    });
  },
});

engine.start();

motionQuery.addEventListener('change', (e) => engine.setReducedMotion(e.matches));

/* ------------------------------------------------- ambient fx (no music) */

const ambience = createAmbience();
const ambientBtn = document.getElementById('ambient');
ambientBtn.addEventListener('click', async () => {
  const on = await ambience.toggle();
  ambientBtn.setAttribute('aria-pressed', String(!!on));
});
