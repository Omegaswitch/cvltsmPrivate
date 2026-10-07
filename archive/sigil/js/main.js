/**
 * Boot. Lights the sigil, wires the menu to it, and hangs the section panel
 * off the same navigation.
 */
import { createSigil } from './sigil/gl.js';
import { paintSigil } from './sigil/texture.js';
import { sigilSvg } from './sigil/fallback.js';
import { runeOrder } from './sigil/glyphs.js';
import { createPanel } from './ui/panel.js';
import { createClient } from './net/client.js';
import { log } from './lib/log.js';

log.install();

const root = document.documentElement;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const bootStarted = performance.now();
const client = createClient();

const sigil = createSigil(document.getElementById('sigil'), {
  texture: paintSigil(1024),
  reducedMotion: motionQuery.matches,
  onContextLost: showStill,
});

if (sigil) {
  sigil.start();
  root.classList.add('has-gl');
  log.info('sigil.ready', { ms: Math.round(performance.now() - bootStarted) });
} else {
  showStill();
  log.warn('sigil.fallback');
}

/* With no WebGL the still drawing takes over. It is the same geometry, lit
   everywhere and not moving, so the page is the same page. */
function showStill() {
  root.classList.remove('has-gl');
  root.classList.add('no-gl');
  document.getElementById('still').innerHTML = sigilSvg(1000);
}

requestAnimationFrame(() => root.classList.add('is-ready'));

motionQuery.addEventListener('change', (e) => sigil && sigil.setReducedMotion(e.matches));

/* The menu answers the sigil: hovering or focusing a section lights its glyph. */
for (const link of document.querySelectorAll('[data-rune]')) {
  const order = runeOrder(Number(link.dataset.rune));
  const on = () => sigil && sigil.setHover(order);
  const off = () => sigil && sigil.setHover(null);
  link.addEventListener('pointerenter', on);
  link.addEventListener('pointerleave', off);
  link.addEventListener('focus', on);
  link.addEventListener('blur', off);
}

createPanel({
  client,
  onOpen: (section) => log.info('panel.open', { section }),
  onClose: () => log.info('panel.close', {}),
});

window.CVLTSM = { logs: () => log.recent(), net: () => client.stats };
