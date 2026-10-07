/**
 * HTTP client: timeouts, retries, de-duplication, a client-side quota and a
 * read-through cache.
 *
 * IMPORTANT — what this is not. A client-side quota is a politeness guard, not
 * rate limiting: it lives in the page and anyone can bypass it by not using
 * the page. Real rate limiting has to be enforced by the server or the edge.
 * The same applies to idempotency: the `Idempotency-Key` header sent here only
 * prevents duplicate work if the server honours it.
 */
import { log } from '../lib/log.js';

export class HttpError extends Error {
  constructor(status, url, body) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
    this.body = body;
    this.retryable = status === 408 || status === 429 || status >= 500;
  }
}

export class TimeoutError extends Error {
  constructor(url, ms) {
    super(`Timed out after ${ms}ms for ${url}`);
    this.name = 'TimeoutError';
    this.url = url;
    this.retryable = true;
  }
}

export class QuotaError extends Error {
  constructor(retryAfterMs) {
    super('Client request quota exhausted');
    this.name = 'QuotaError';
    this.retryAfterMs = retryAfterMs;
    this.retryable = false;
  }
}

const DEFAULTS = {
  timeoutMs: 8000,
  retries: 2,
  baseBackoffMs: 300,
  maxBackoffMs: 4000,
  cacheTtlMs: 60000,
  // token bucket: a burst of 12, refilling 3 per second
  quota: { capacity: 12, refillPerSec: 3 },
};

/** Token bucket. Returns null when a token is available, else the wait in ms. */
function createQuota({ capacity, refillPerSec }) {
  let tokens = capacity;
  let last = Date.now();
  return {
    take() {
      const now = Date.now();
      tokens = Math.min(capacity, tokens + ((now - last) / 1000) * refillPerSec);
      last = now;
      if (tokens >= 1) {
        tokens -= 1;
        return null;
      }
      return Math.ceil(((1 - tokens) / refillPerSec) * 1000);
    },
    get available() {
      return Math.floor(tokens);
    },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Exponential backoff with full jitter — avoids a retry stampede. */
function backoffFor(attempt, base, max) {
  const ceiling = Math.min(max, base * 2 ** attempt);
  return Math.random() * ceiling;
}

export function createClient(options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  const quota = createQuota(cfg.quota);

  /** key -> promise, so N callers asking at once make one request. */
  const inFlight = new Map();
  /** key -> { expires, value } */
  const memo = new Map();
  /** idempotency key -> settled result, so a resubmit never posts twice. */
  const submitted = new Map();

  const stats = { requests: 0, retries: 0, cacheHits: 0, deduped: 0, failures: 0, quotaBlocks: 0 };

  function readCache(key) {
    const hit = memo.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    if (hit) memo.delete(key);
    try {
      const raw = sessionStorage.getItem(`cvltsm:${key}`);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      if (parsed.expires > Date.now()) {
        memo.set(key, parsed);
        return parsed.value;
      }
      sessionStorage.removeItem(`cvltsm:${key}`);
    } catch {
      /* private mode, quota, corrupt entry — the cache is optional */
    }
    return undefined;
  }

  function writeCache(key, value, ttl) {
    const entry = { expires: Date.now() + ttl, value };
    memo.set(key, entry);
    try {
      sessionStorage.setItem(`cvltsm:${key}`, JSON.stringify(entry));
    } catch {
      /* never let a full storage quota break a request */
    }
  }

  /** One attempt, with its own timeout. */
  async function attempt(url, init, timeoutMs) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    const onAbort = () => ctl.abort();
    if (init.signal) init.signal.addEventListener('abort', onAbort, { once: true });
    try {
      const res = await fetch(url, { ...init, signal: ctl.signal });
      if (!res.ok) {
        const retryAfter = Number(res.headers.get('retry-after')) * 1000;
        const err = new HttpError(res.status, url, await res.text().catch(() => ''));
        if (Number.isFinite(retryAfter) && retryAfter > 0) err.retryAfterMs = retryAfter;
        throw err;
      }
      return res;
    } catch (err) {
      if (err.name === 'AbortError') {
        if (init.signal && init.signal.aborted) throw err;   // the caller cancelled
        throw new TimeoutError(url, timeoutMs);
      }
      if (err instanceof HttpError) throw err;
      err.retryable = true;                                   // network-level failure
      throw err;
    } finally {
      clearTimeout(timer);
      if (init.signal) init.signal.removeEventListener('abort', onAbort);
    }
  }

  async function withRetries(url, init, opts) {
    const retries = opts.retries ?? cfg.retries;
    let lastErr;
    for (let i = 0; i <= retries; i++) {
      const wait = quota.take();
      if (wait !== null) {
        stats.quotaBlocks++;
        log.warn('net.quota_exhausted', { url, retryAfterMs: wait });
        throw new QuotaError(wait);
      }
      try {
        stats.requests++;
        const res = await attempt(url, init, opts.timeoutMs ?? cfg.timeoutMs);
        if (i > 0) log.info('net.retry_succeeded', { url, attempt: i });
        return res;
      } catch (err) {
        lastErr = err;
        const canRetry = err.retryable && i < retries && !(init.signal && init.signal.aborted);
        if (!canRetry) break;
        const delay = err.retryAfterMs ?? backoffFor(i, cfg.baseBackoffMs, cfg.maxBackoffMs);
        stats.retries++;
        log.warn('net.retrying', { url, attempt: i + 1, delayMs: Math.round(delay), reason: err.name });
        await sleep(delay);
      }
    }
    stats.failures++;
    log.error('net.request_failed', { url, name: lastErr.name, message: lastErr.message });
    throw lastErr;
  }

  return {
    stats,
    get quotaAvailable() {
      return quota.available;
    },

    /**
     * Cached, de-duplicated, retried GET returning parsed JSON.
     * Concurrent callers for the same key share one request.
     */
    async getJSON(url, opts = {}) {
      const key = opts.cacheKey || url;
      const ttl = opts.cacheTtlMs ?? cfg.cacheTtlMs;

      if (ttl > 0) {
        const cached = readCache(key);
        if (cached !== undefined) {
          stats.cacheHits++;
          log.debug('net.cache_hit', { url });
          return cached;
        }
      }

      const existing = inFlight.get(key);
      if (existing) {
        stats.deduped++;
        log.debug('net.deduped', { url });
        return existing;
      }

      const p = (async () => {
        const res = await withRetries(url, {
          method: 'GET',
          headers: { accept: 'application/json' },
          signal: opts.signal,
        }, opts);
        const value = await res.json();
        if (ttl > 0) writeCache(key, value, ttl);
        return value;
      })().finally(() => inFlight.delete(key));

      inFlight.set(key, p);
      return p;
    },

    /**
     * Write that must happen at most once.
     *
     * Two guards: concurrent calls with the same key share one in-flight
     * promise, and a key that already settled returns its previous result
     * rather than posting again. The key also goes out as `Idempotency-Key`
     * so the server can enforce the same thing — which is where it actually
     * counts, since this map dies with the tab.
     */
    async submitOnce(url, body, opts = {}) {
      const key = opts.idempotencyKey;
      if (!key) throw new Error('submitOnce requires an idempotencyKey');

      if (submitted.has(key)) {
        stats.deduped++;
        log.info('net.submit_replayed', { url, key });
        return submitted.get(key);
      }
      const existing = inFlight.get(key);
      if (existing) {
        stats.deduped++;
        log.info('net.submit_in_flight', { url, key });
        return existing;
      }

      const p = (async () => {
        const res = await withRetries(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            'idempotency-key': key,
          },
          body: JSON.stringify(body),
          signal: opts.signal,
        }, { ...opts, retries: opts.retries ?? 0 });   // no blind retry on writes
        return res.status === 204 ? null : res.json();
      })();

      inFlight.set(key, p);
      try {
        const value = await p;
        submitted.set(key, value);
        return value;
      } finally {
        inFlight.delete(key);
      }
    },

    /** Drop cached reads (all, or one key). */
    invalidate(key) {
      if (key) {
        memo.delete(key);
        try { sessionStorage.removeItem(`cvltsm:${key}`); } catch { /* optional */ }
        return;
      }
      memo.clear();
    },
  };
}
