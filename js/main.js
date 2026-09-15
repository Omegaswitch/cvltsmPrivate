/**
 * Boot. Wires the engine to the page and honours the reduced-motion contract.
 */
import { createEngine } from './engine.js';

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const engine = createEngine(document.getElementById('scene'), {
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
