/**
 * Boot. Wires the engine to the interface: nav panning, the rain and ambient
 * toggles, the camera rail, and the reduced-motion contract.
 */
import { createEngine } from './engine.js';
import { createAmbience } from './audio.js';

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const canvas = document.getElementById('scene');
const railFill = document.getElementById('railfill');
const hint = document.getElementById('hint');

const engine = createEngine(canvas, {
  reducedMotion: motionQuery.matches,
  onReady() {
    // one frame of grace so the first composite lands before the veil lifts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
    });
  },
  onCamera(n) {
    if (railFill) {
      const travel = (railFill.parentElement.clientWidth - railFill.offsetWidth) / 2;
      railFill.style.transform = `translateX(${n * travel}px)`;
    }
  },
});

engine.start();

motionQuery.addEventListener('change', (e) => engine.setReducedMotion(e.matches));

/* ------------------------------------------------------- nav panning ---- */

for (const el of document.querySelectorAll('[data-pan]')) {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    engine.panTo(parseFloat(el.dataset.pan));
  });
}

/* ----------------------------------------------------------- rain toggle */

const rainBtn = document.getElementById('rain');
let rainOn = true;
rainBtn.addEventListener('click', () => {
  rainOn = !rainOn;
  rainBtn.setAttribute('aria-pressed', String(rainOn));
  engine.setRain(rainOn ? 1 : 0);
});

/* ------------------------------------------------- ambient fx (no music) */

const ambience = createAmbience();
const ambientBtn = document.getElementById('ambient');
ambientBtn.addEventListener('click', async () => {
  const on = await ambience.toggle();
  ambientBtn.setAttribute('aria-pressed', String(!!on));
});

/* ---------------------------------------------------------- first input */

// the pan hint retires once the visitor has worked out the controls
const retireHint = () => {
  if (!hint) return;
  hint.style.transition = 'opacity .8s ease';
  hint.style.opacity = '0';
  window.removeEventListener('wheel', retireHint);
  window.removeEventListener('mousedown', retireHint);
  window.removeEventListener('touchstart', retireHint);
  window.removeEventListener('keydown', retireHint);
};
window.addEventListener('wheel', retireHint, { once: true, passive: true });
window.addEventListener('mousedown', retireHint, { once: true });
window.addEventListener('touchstart', retireHint, { once: true, passive: true });
window.addEventListener('keydown', retireHint, { once: true });
