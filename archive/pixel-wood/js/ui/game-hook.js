/**
 * The way in.
 *
 * Ten clicks on the wordmark and the hero lifts out of frame, the world winds
 * up and the scene becomes a side-scroller. Nothing advertises it; the only
 * tell is that the wordmark starts to twitch once you are most of the way
 * there.
 */
import { createGame, STATE } from '../game/runner.js';
import { log } from '../lib/log.js';

const UNLOCK_CLICKS = 10;
const STIR_AT = 6;            // the wordmark starts reacting here
const IDLE_RESET = 2500;      // stop counting if they wander off

export function installHiddenGame({ engine }) {
  const title = document.querySelector('.hero__title');
  const root = document.documentElement;
  const panel = document.getElementById('game');
  const overlay = document.getElementById('gameOver');
  const scoreEl = document.getElementById('gameScore');
  const bestEl = document.getElementById('gameBest');
  const finalEl = document.getElementById('gameFinal');
  if (!title || !panel) return;

  let clicks = 0;
  let lastClick = 0;
  let game = null;
  let playing = false;

  function build() {
    if (game) return game;
    game = createGame({
      vh: engine.state.vh,
      baseGroundSpeed: engine.groundSpeed,
      onState(next) {
        if (next === STATE.DEAD) {
          finalEl.textContent = String(game.score);
          overlay.hidden = false;
        } else {
          overlay.hidden = true;
        }
      },
      onScore(score, best) {
        scoreEl.textContent = String(score);
        bestEl.textContent = String(best);
      },
    });
    return game;
  }

  function enter() {
    if (playing) return;
    playing = true;
    build();
    root.classList.add('is-playing');
    panel.hidden = false;
    overlay.hidden = true;
    bestEl.textContent = String(game.best);
    engine.setActor(game);
    game.start();
    log.info('game.enter', {});
  }

  function leave() {
    if (!playing) return;
    playing = false;
    clicks = 0;
    root.classList.remove('is-playing');
    panel.hidden = true;
    overlay.hidden = true;
    engine.setActor(null);
    if (game) game.stop();
    log.info('game.leave', { score: game ? game.score : 0 });
  }

  /* ------------------------------------------------------------- the lock */

  title.addEventListener('click', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastClick > IDLE_RESET) clicks = 0;
    lastClick = now;
    clicks++;

    if (clicks >= STIR_AT && clicks < UNLOCK_CLICKS) {
      title.classList.remove('is-stirring');
      void title.offsetWidth;                  // restart the animation
      title.classList.add('is-stirring');
    }
    if (clicks >= UNLOCK_CLICKS) {
      title.classList.remove('is-stirring');
      enter();
    }
  });

  /* ---------------------------------------------------------- the controls */

  const jump = () => { if (playing && game.state === STATE.RUNNING) game.jump(); };
  const slide = () => { if (playing && game.state === STATE.RUNNING) game.slide(); };
  const again = () => { if (playing) game.start(); };

  window.addEventListener('keydown', (e) => {
    if (!playing) return;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      if (game.state === STATE.DEAD) again(); else jump();
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      slide();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      leave();
    }
  });

  // a tap anywhere on the scene jumps; the pads below handle sliding on touch
  window.addEventListener('pointerdown', (e) => {
    if (!playing || e.target.closest('button')) return;
    if (game.state === STATE.DEAD) again(); else jump();
  });

  document.getElementById('btnJump').addEventListener('click', jump);
  document.getElementById('btnSlide').addEventListener('click', slide);
  document.getElementById('gameAgain').addEventListener('click', again);
  document.getElementById('gameLeave').addEventListener('click', leave);

  return { enter, leave };
}
