/**
 * Boot. Draws the field and hangs the interface around it.
 */
import { createField } from './field/engine.js';
import { createPanel } from './ui/panel.js';
import { createClient } from './net/client.js';
import { log } from './lib/log.js';

log.install();

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const bootStarted = performance.now();
const client = createClient();

const field = createField(document.getElementById('field'), {
  reducedMotion: motionQuery.matches,
  onReady() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('is-ready');
        placeRing();
        log.info('field.ready', { ms: Math.round(performance.now() - bootStarted) });
      });
    });
  },
});

field.start();
motionQuery.addEventListener('change', (e) => field.setReducedMotion(e.matches));

/**
 * The ring of menu items is centred on the effigy rather than on the
 * viewport, so it stays around the figure at any aspect ratio.
 */
function placeRing() {
  const ring = document.querySelector('.ring');
  if (!ring) return;
  const { x, y } = field.anchor;
  ring.style.setProperty('--cx', `${(x * 100).toFixed(2)}%`);
  ring.style.setProperty('--cy', `${(y * 100).toFixed(2)}%`);
}
window.addEventListener('resize', placeRing, { passive: true });

createPanel({
  client,
  onOpen: (section) => log.info('panel.open', { section }),
  onClose: () => log.info('panel.close', {}),
});

window.CVLTSM = { logs: () => log.recent(), net: () => client.stats };
