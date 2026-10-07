/**
 * Slide-up section panel.
 *
 * Rises over the scene, which keeps running untouched behind it — no page
 * scroll, no transform on the canvas, nothing that would make the background
 * lurch as the panel moves.
 *
 * Owns the three request-facing UI states: loading while the section is
 * fetched, empty when it has no entries, and error with a retry when the
 * fetch fails. Repeat opens are served from the client's cache, so reopening
 * a section does not re-request it.
 */
import { log } from '../lib/log.js';
import { QuotaError, TimeoutError, HttpError } from '../net/client.js';

const OPEN_CLASS = 'is-open';

export function createPanel({ client, onOpen, onClose }) {
  const panel = document.getElementById('panel');
  const scrim = document.getElementById('scrim');
  const body = document.getElementById('panelBody');
  const title = document.getElementById('panelTitle');
  const entries = document.getElementById('panelEntries');
  const errorNote = document.getElementById('panelErrorNote');
  const closeBtn = document.getElementById('panelClose');
  const retryBtn = document.getElementById('panelRetry');
  const ui = document.querySelector('.ui');

  let current = null;          // section id currently shown
  let opener = null;           // element to restore focus to
  let inFlight = null;         // AbortController for the open request

  function setState(state, busy = false) {
    body.dataset.state = state;
    body.setAttribute('aria-busy', String(busy));
  }

  function describe(err) {
    if (err instanceof QuotaError) {
      return `Too many requests. Try again in ${Math.ceil(err.retryAfterMs / 1000)}s.`;
    }
    if (err instanceof TimeoutError) return 'The request timed out.';
    if (err instanceof HttpError) return `The server answered ${err.status}.`;
    return 'The network is unreachable.';
  }

  function render(data) {
    const items = Array.isArray(data && data.items) ? data.items : [];
    if (!items.length) {
      setState('empty');
      return;
    }
    entries.replaceChildren(...items.map((item) => {
      const li = document.createElement('li');
      li.className = 'entry';
      const h = document.createElement('h3');
      h.className = 'entry__title';
      h.textContent = String(item.title ?? '');
      const p = document.createElement('p');
      p.className = 'entry__body';
      p.textContent = String(item.body ?? '');
      li.append(h, p);
      return li;
    }));
    setState('ready');
  }

  async function load(section) {
    if (inFlight) inFlight.abort();
    inFlight = new AbortController();
    setState('loading', true);

    const started = performance.now();
    try {
      const data = await client.getJSON(`content/${section}.json`, {
        signal: inFlight.signal,
        cacheKey: `section:${section}`,
      });
      if (current !== section) return;              // user moved on
      log.info('section.loaded', { section, ms: Math.round(performance.now() - started) });
      render(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (current !== section) return;
      log.error('section.load_failed', { section, name: err.name, message: err.message });
      errorNote.textContent = describe(err);
      setState('error');
    } finally {
      inFlight = null;
    }
  }

  function open(section, label, invoker) {
    current = section;
    opener = invoker || null;
    title.textContent = label;
    entries.replaceChildren();

    scrim.hidden = false;
    // next frame, so the browser has the element laid out before it animates
    requestAnimationFrame(() => {
      scrim.classList.add(OPEN_CLASS);
      panel.classList.add(OPEN_CLASS);
    });
    panel.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('has-panel');
    // the hero behind is not reachable while the panel is modal
    ui.inert = true;
    panel.focus({ preventScroll: true });

    if (onOpen) onOpen(section);
    load(section);
  }

  function close() {
    if (!current) return;
    current = null;
    if (inFlight) {
      inFlight.abort();
      inFlight = null;
    }
    panel.classList.remove(OPEN_CLASS);
    scrim.classList.remove(OPEN_CLASS);
    panel.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('has-panel');
    ui.inert = false;

    const done = () => { scrim.hidden = true; };
    panel.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 700);                         // in case transitions are off

    if (opener) opener.focus({ preventScroll: true });
    opener = null;
    if (onClose) onClose();
  }

  /* ------------------------------------------------------------- wiring */

  for (const el of document.querySelectorAll('[data-section]')) {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      // the label alone: a menu item may carry decoration, such as a numeral
      const label = el.querySelector('.nav__label') || el;
      open(el.dataset.section, label.textContent.trim(), el);
    });
  }

  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);
  retryBtn.addEventListener('click', () => {
    if (!current) return;
    client.invalidate(`section:${current}`);
    load(current);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) {
      e.preventDefault();
      close();
    }
  });

  // keep focus inside the panel while it is modal
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !current) return;
    const focusable = panel.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  return { open, close, get section() { return current; } };
}
