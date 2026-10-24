import { ASKS_PER_HOUR, MAX_QUESTION, askArchive, leaks } from '@/lib/station/archive';
import { FILES, HINTS, LOCKS, type Lock } from '@/lib/station/content';
import { asksLastHour, enter, logAsk, player, solve, solvesOf, sql } from '@/lib/station/db';
import { ACCESS, hash, normalise, playerOf, sessionFor } from '@/lib/station/pass';

/*
 * The station's machine. One POST endpoint. A visitor logs in with any name
 * and the access code hidden on the main site; their session says who they
 * are, the register (Neon) says how far they are, and nothing past that
 * leaves the server.
 *
 *   { op: 'login', name, code }            a session for that name
 *   { op: 'me', session }                  name, level, and when each seal was opened
 *   { op: 'ls', session }                  the files they can see
 *   { op: 'cat', session, name }           one file, if they may read it
 *   { op: 'unlock', session, lock, answer } try a key; recorded if it fits
 *   { op: 'hint', session }                a nudge for their level
 *   { op: 'ask', session, question }       the archive (Gemini), held to the station
 */

export const dynamic = 'force-dynamic';

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });

const listing = (level: number) =>
  FILES.filter((f) => (f.shown ?? 0) <= level).map((f) => ({ name: f.name, locked: f.level > level }));

const slow = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }
  if (!sql) return json({ error: 'register offline' }, 503);

  if (body.op === 'login') {
    const name = String(body.name ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 32);
    if (name.length < 2) return json({ error: 'a name, two letters at least' }, 400);
    await slow(400);
    if (hash(normalise(body.code)) !== ACCESS) return json({ error: 'access denied' }, 403);
    const p = await enter(name);
    return json({ session: sessionFor(p.id), name: p.name, level: p.level, solves: await solvesOf(p.id) });
  }

  const id = playerOf(body.session);
  const me = id ? await player(id) : null;
  if (!me) return json({ error: 'not logged in' }, 401);
  const level = me.level;

  switch (body.op) {
    case 'me':
      return json({ name: me.name, level, solves: await solvesOf(me.id) });

    case 'ls':
      return json({ level, files: listing(level) });

    case 'cat': {
      const name = String(body.name ?? '').trim().replace(/^\.\//, '');
      const file = FILES.find((f) => f.name === name && (f.shown ?? 0) <= level);
      if (!file) return json({ error: 'no such file' }, 404);
      if (file.level > level) return json({ error: 'sealed', lock: file.lock }, 403);
      return json({ name: file.name, body: file.body });
    }

    case 'unlock': {
      const lock = LOCKS[body.lock as Lock];
      if (!lock) return json({ error: 'no such lock' }, 400);
      if (level < lock.from) return json({ ok: false, error: 'not yet' }, 403);
      if (level >= lock.to) return json({ ok: true, level });
      const answer = body.lock === 'admin' ? `${normalise(body.user)}/${normalise(body.answer)}` : normalise(body.answer);
      await slow(350);   // guessing by script is slow
      if (!lock.answers.includes(hash(answer))) return json({ ok: false });
      await solve(me.id, String(body.lock), lock.to);
      return json({ ok: true, level: lock.to, files: listing(lock.to) });
    }

    case 'hint':
      return json({ hint: HINTS[Math.min(level, HINTS.length - 1)] });

    case 'ask': {
      const question = String(body.question ?? '').replace(/[\u0000-\u001f]/g, ' ').trim();
      if (!question) return json({ error: 'ask <question>' }, 400);
      if (question.length > MAX_QUESTION) return json({ error: `the archive takes ${MAX_QUESTION} characters at most` }, 400);
      if ((await asksLastHour(me.id)) >= ASKS_PER_HOUR) return json({ error: 'the archive is resting. try again within the hour.' }, 429);
      let reply = await askArchive(question, level).catch(() => null);
      if (reply === null) return json({ error: 'archive offline' }, 503);
      const held = leaks(reply, level);
      if (held) reply = 'THE ARCHIVE DOES NOT HOLD KEYS. READ THE FILES.';
      await logAsk(me.id, question, reply, held);
      return json({ reply });
    }

    default:
      return json({ error: 'unknown op' }, 400);
  }
}
