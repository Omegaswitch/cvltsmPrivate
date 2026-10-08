// Plays the hunt against a running server and checks it holds.
// Usage: node scripts/check-hunt.mjs [http://localhost:3000]
// Contains every answer: a spoiler, like docs/HUNT.md.
import assert from 'node:assert/strict';

const BASE = process.argv[2] || 'http://localhost:3000';
const ANSWERS = ['key', 'double shot', 'Vámóðr', 'Yggr', 'Sköll Hati', 'dried blood'];

async function speak(stage, guess, cookie = '') {
  const res = await fetch(`${BASE}/api/hunt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, 'x-forwarded-for': `check-${Math.random()}` },
    body: JSON.stringify({ stage, guess }),
  });
  const set = res.headers.get('set-cookie');
  return { status: res.status, body: await res.json(), cookie: set ? set.split(';')[0] : cookie };
}
const page = async (path, cookie = '') => fetch(`${BASE}${path}`, { headers: { cookie } });

let cookie = '';
let seed = null;
for (const [stage, answer] of ANSWERS.entries()) {
  assert.equal((await speak(stage, 'wrong', cookie)).body.ok, false, `stage ${stage} takes a wrong answer`);
  if (stage < ANSWERS.length - 1) assert.equal((await speak(stage + 1, ANSWERS[stage + 1], cookie)).status, 403, `stage ${stage + 1} opens early`);
  const r = await speak(stage, answer, cookie);
  assert.equal(r.body.ok, true, `stage ${stage} refuses "${answer}"`);
  cookie = r.cookie;
  const s = cookie.split('=')[1].split('.')[1];
  if (seed === null) seed = s;
  assert.equal(s, seed, 'the seed changed between stages');
  assert.equal((await page(r.body.next, cookie)).status, 200, `${r.body.next} is closed after a right answer`);
  assert.equal((await page(r.body.next)).status, 404, `${r.body.next} is open without the cookie`);
  const forged = cookie.replace(`.${seed}.`, `.${(Number(seed) + 1) % 10000}.`);
  assert.equal((await page(r.body.next, forged)).status, 404, `${r.body.next} accepts a forged cookie`);
}
console.log('hunt holds: six answers, early, wrong and forged attempts refused, seed', seed);
