/**
 * Structured logging.
 *
 * Every event is a flat JSON object with a stable shape, so it can be shipped
 * to a collector later without reformatting. Nothing is sent anywhere by
 * default — `setSink` is the seam where a real collector plugs in.
 */
const RING_MAX = 200;
const ring = [];
let sink = null;
let sessionId = null;

function newSessionId() {
  const a = new Uint8Array(8);
  (globalThis.crypto || {}).getRandomValues?.(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('') || String(Date.now());
}

function emit(level, event, fields) {
  if (!sessionId) sessionId = newSessionId();
  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    session: sessionId,
    ...fields,
  };

  ring.push(record);
  if (ring.length > RING_MAX) ring.shift();

  // console gets the structured record, not a prose string
  const line = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  line.call(console, JSON.stringify(record));

  if (sink) {
    try {
      sink(record);
    } catch {
      /* a failing collector must never break the page */
    }
  }
  return record;
}

export const log = {
  debug: (event, fields) => emit('debug', event, fields),
  info: (event, fields) => emit('info', event, fields),
  warn: (event, fields) => emit('warn', event, fields),
  error: (event, fields) => emit('error', event, fields),

  /** Send records somewhere. fn(record) — errors inside it are swallowed. */
  setSink(fn) {
    sink = fn;
  },

  /** The last N records, for attaching to a bug report. */
  recent: (n = RING_MAX) => ring.slice(-n),

  /** Catch what never reaches a try/catch. */
  install() {
    window.addEventListener('error', (e) => {
      emit('error', 'window.error', {
        message: String(e.message || ''),
        source: e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : undefined,
        stack: e.error && e.error.stack ? String(e.error.stack).slice(0, 900) : undefined,
      });
    });
    window.addEventListener('unhandledrejection', (e) => {
      const r = e.reason;
      emit('error', 'unhandled.rejection', {
        message: String((r && r.message) || r || ''),
        name: r && r.name,
        stack: r && r.stack ? String(r.stack).slice(0, 900) : undefined,
      });
    });
  },
};
