/**
 * Boot. Wires the engine, the section panel and the error reporting together.
 */
import { createEngine } from './engine.js';
import { createPanel } from './ui/panel.js';
import { installHiddenGame } from './ui/game-hook.js';
import { createClient } from './net/client.js';
import { log } from './lib/log.js';

log.install();

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const bootStarted = performance.now();

const client = createClient();

const engine = createEngine(document.getElementById('scene'), {
  reducedMotion: motionQuery.matches,
  onReady() {
    // one frame of grace so the first composite lands before the veil lifts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('is-ready');
        log.info('scene.ready', { ms: Math.round(performance.now() - bootStarted) });
      });
    });
  },
});

engine.start();

motionQuery.addEventListener('change', (e) => engine.setReducedMotion(e.matches));

createPanel({
  client,
  onOpen: (section) => log.info('panel.open', { section }),
  onClose: () => log.info('panel.close', {}),
});

installHiddenGame({ engine });

// expose the log buffer for support: a visitor can paste it into a bug report
window.CVLTSM = {
  logs: () => log.recent(),
  net: () => client.stats,
  seek: (px) => engine.seek(px),   // jump the world along, for inspection
};
