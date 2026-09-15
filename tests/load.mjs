/**
 * Concurrent session load test.
 *
 * This site is static: there is no application server to saturate, so the
 * meaningful load is on the CLIENT. Every visitor generates the entire scene
 * in their own browser, and that generation is the expensive part. This test
 * opens N independent sessions at once and asserts that each one boots inside
 * a budget, holds framerate, and reports no errors.
 *
 *   node tests/load.mjs [sessions] [--headed]
 *
 * It serves the repo itself, so it needs nothing running.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SESSIONS = Number(process.argv[2]) || 12;

/**
 * Thresholds.
 *
 * Two different things are being measured and they need different budgets.
 *
 * BASELINE is one session alone on the machine — that is what a real visitor
 * experiences, so it gets tight limits.
 *
 * CONCURRENT is N browsers sharing this one CPU. Real visitors do not share a
 * CPU with each other, so the framerate here measures contention on the test
 * runner, not the site. It is reported, and gated only loosely: a floor that
 * catches a genuine collapse (a leak, a runaway loop) without failing because
 * the runner is busy. What IS asserted strictly under concurrency is
 * correctness — every session boots, and nothing errors.
 */
const BUDGET = {
  baselineBootMs: 3000,
  baselineFps: 50,
  concurrentBootMsP95: 15000,
  concurrentFpsFloor: 8,
  maxErrors: 0,
};

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.otf': 'font/otf',
};

function serve() {
  const server = createServer(async (req, res) => {
    try {
      const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
      const path = join(ROOT, rel === '/' ? 'index.html' : rel);
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/** One visitor: boot the page, then sample framerate for two seconds. */
async function session(browser, url, id) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/CERT|net::ERR_CERT/.test(m.text())) errors.push(m.text());
  });

  const t0 = Date.now();
  let bootMs = null;
  let fps = 0;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(
      () => document.documentElement.classList.contains('is-ready'),
      null, { timeout: 30000 },
    );
    bootMs = Date.now() - t0;

    fps = await page.evaluate(() => new Promise((res) => {
      let n = 0;
      const start = performance.now();
      const tick = () => {
        n++;
        if (performance.now() - start < 2000) requestAnimationFrame(tick);
        else res(+(n / ((performance.now() - start) / 1000)).toFixed(1));
      };
      requestAnimationFrame(tick);
    }));
  } catch (err) {
    errors.push(`session ${id}: ${err.message}`);
  } finally {
    await ctx.close();
  }
  return { id, bootMs, fps, errors };
}

const pct = (arr, q) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * q))];
};

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/index.html`;
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') });

// --- baseline: one visitor, undisturbed ---------------------------------
console.log(`baseline: 1 session against ${url}`);
const baseline = await session(browser, url, 'base');
console.log(`  boot ${baseline.bootMs}ms   ${baseline.fps}fps\n`);

// --- concurrent: N visitors at once -------------------------------------
console.log(`launching ${SESSIONS} concurrent sessions\n`);
const started = Date.now();
const results = await Promise.all(
  Array.from({ length: SESSIONS }, (_, i) => session(browser, url, i)),
);
const wall = Date.now() - started;

await browser.close();
server.close();

const booted = results.filter((r) => r.bootMs !== null);
const boots = booted.map((r) => r.bootMs);
const fpsAll = booted.map((r) => r.fps);
const errors = results.flatMap((r) => r.errors);

console.log('session  boot(ms)   fps');
for (const r of results) {
  console.log(
    String(r.id).padEnd(9),
    String(r.bootMs ?? 'FAILED').padEnd(10),
    String(r.fps || '-'),
  );
}

const summary = {
  baseline: { bootMs: baseline.bootMs, fps: baseline.fps },
  concurrent: {
    sessions: SESSIONS,
    booted: booted.length,
    wallMs: wall,
    bootMsMin: Math.min(...boots),
    bootMsP50: pct(boots, 0.5),
    bootMsP95: pct(boots, 0.95),
    fpsMin: Math.min(...fpsAll),
    fpsP50: pct(fpsAll, 0.5),
  },
  errors: errors.length + baseline.errors.length,
};
console.log('\nSUMMARY', JSON.stringify(summary, null, 2));
console.log('\nnote: concurrent fps reflects N browsers sharing one CPU on this'
  + '\n      runner. Real visitors do not share a CPU — see the baseline.');

const allErrors = [...baseline.errors, ...errors];
const failures = [];
if (baseline.bootMs === null) failures.push('baseline session failed to boot');
else if (baseline.bootMs > BUDGET.baselineBootMs) failures.push(`baseline boot ${baseline.bootMs}ms > ${BUDGET.baselineBootMs}ms`);
if (baseline.fps < BUDGET.baselineFps) failures.push(`baseline ${baseline.fps}fps < ${BUDGET.baselineFps}fps`);
if (booted.length !== SESSIONS) failures.push(`${SESSIONS - booted.length} session(s) failed to boot`);
if (summary.concurrent.bootMsP95 > BUDGET.concurrentBootMsP95) failures.push(`concurrent boot p95 ${summary.concurrent.bootMsP95}ms > ${BUDGET.concurrentBootMsP95}ms`);
if (summary.concurrent.fpsMin < BUDGET.concurrentFpsFloor) failures.push(`a session collapsed to ${summary.concurrent.fpsMin}fps (floor ${BUDGET.concurrentFpsFloor})`);
if (allErrors.length > BUDGET.maxErrors) failures.push(`${allErrors.length} console/page error(s): ${allErrors.slice(0, 3).join(' | ')}`);

if (failures.length) {
  console.error('\nFAIL\n - ' + failures.join('\n - '));
  process.exit(1);
}
console.log('\nPASS — baseline within budget, every concurrent session booted clean.');
