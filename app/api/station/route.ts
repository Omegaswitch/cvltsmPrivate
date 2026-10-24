import { FILES, HINTS, LOCKS, type Lock } from '@/lib/station/content';
import { hash, levelOf, normalise, passFor } from '@/lib/station/pass';

/*
 * The station's machine. One POST endpoint; the visitor's pass says how far
 * they are, and nothing past that leaves the server.
 *
 *   { op: 'ls', pass }                     the files they can see
 *   { op: 'cat', pass, name }              one file, if they may read it
 *   { op: 'unlock', pass, lock, answer }   try a key; a new pass if it fits
 *   { op: 'hint', pass }                   a nudge for their level
 */

export const dynamic = 'force-dynamic';

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });

const listing = (level: number) =>
  FILES.filter((f) => (f.shown ?? 0) <= level).map((f) => ({ name: f.name, locked: f.level > level }));

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }
  const level = levelOf(body.pass);

  switch (body.op) {
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
      if (level >= lock.to) return json({ ok: true, level, pass: passFor(level) });
      const answer = body.lock === 'admin' ? `${normalise(body.user)}/${normalise(body.answer)}` : normalise(body.answer);
      // a little delay per try, so guessing by script is slow
      await new Promise((r) => setTimeout(r, 350));
      if (!lock.answers.includes(hash(answer))) return json({ ok: false });
      return json({ ok: true, level: lock.to, pass: passFor(lock.to), files: listing(lock.to) });
    }

    case 'hint':
      return json({ hint: HINTS[Math.min(level, HINTS.length - 1)] });

    default:
      return json({ error: 'unknown op' }, 400);
  }
}
