import { neon } from '@neondatabase/serverless';

/*
 * The register, in Neon (project cvltsm-station, Frankfurt). Tables:
 *   players  one row per name: their level and when they came and went
 *   solves   which seal each player opened, and when
 *   asks     what they asked the archive (the Gemini assistant), and whether
 *            the answer was held back
 * and a view, `register`, with one row per player and a column per seal:
 *   SELECT * FROM register;
 *
 * Without DATABASE_URL, and away from Vercel, a register is kept in memory
 * instead, so the station runs on a developer's machine: it lasts as long as
 * the server does, and holds nothing anyone would miss. On Vercel the
 * database is required, and without it the station says it is offline.
 */

const url = process.env.DATABASE_URL;
export const sql = url ? neon(url) : null;
const memory = !sql && process.env.VERCEL !== '1';

/** true when there is a register to write to, in the database or in memory */
export const ready = Boolean(sql) || memory;

export type Player = { id: number; name: string; level: number };

/** a name, as typed, and the key it is matched on (so "Ingrid" and "ingrid " are one player) */
export const nameKey = (name: string) => name.trim().toLowerCase().normalize('NFKC').replace(/\s+/g, ' ');

// the in-memory register, for development
type Row = Player & { key: string; solves: Record<string, string>; asks: number[] };
const rows: Row[] = [];
const byId = (id: number) => rows.find((r) => r.id === id) ?? null;

export async function enter(name: string): Promise<Player> {
  if (!sql) {
    if (!memory) throw new Error('no database');
    const key = nameKey(name);
    let r = rows.find((x) => x.key === key);
    if (!r) { r = { id: rows.length + 1, name: name.trim(), key, level: 0, solves: {}, asks: [] }; rows.push(r); }
    return { id: r.id, name: r.name, level: r.level };
  }
  const got = await sql`
    INSERT INTO players (name, name_key) VALUES (${name.trim()}, ${nameKey(name)})
    ON CONFLICT (name_key) DO UPDATE SET last_seen = now()
    RETURNING id, name, level`;
  return got[0] as Player;
}

export async function player(id: number): Promise<Player | null> {
  if (!sql) {
    const r = byId(id);
    return r ? { id: r.id, name: r.name, level: r.level } : null;
  }
  const got = await sql`UPDATE players SET last_seen = now() WHERE id = ${id} RETURNING id, name, level`;
  return (got[0] as Player) ?? null;
}

export async function solve(id: number, seal: string, level: number) {
  if (!sql) {
    const r = byId(id);
    if (r) { r.level = Math.max(r.level, level); r.solves[seal] ??= new Date().toISOString(); }
    return;
  }
  await sql`UPDATE players SET level = GREATEST(level, ${level}) WHERE id = ${id}`;
  await sql`INSERT INTO solves (player_id, seal) VALUES (${id}, ${seal}) ON CONFLICT DO NOTHING`;
}

/** questions asked in the last hour */
export async function asksLastHour(id: number): Promise<number> {
  if (!sql) {
    const r = byId(id), since = Date.now() - 3600_000;
    return r ? r.asks.filter((t) => t > since).length : 0;
  }
  const got = await sql`SELECT count(*)::int AS n FROM asks WHERE player_id = ${id} AND asked_at > now() - interval '1 hour'`;
  return (got[0] as { n: number }).n;
}

export async function logAsk(id: number, question: string, answer: string, blocked: boolean) {
  if (!sql) { byId(id)?.asks.push(Date.now()); return; }
  await sql`INSERT INTO asks (player_id, question, answer, blocked) VALUES (${id}, ${question}, ${answer}, ${blocked})`;
}

/** when each seal was opened, by seal */
export async function solvesOf(id: number): Promise<Record<string, string>> {
  if (!sql) return { ...(byId(id)?.solves ?? {}) };
  const got = (await sql`SELECT seal, solved_at FROM solves WHERE player_id = ${id}`) as { seal: string; solved_at: string }[];
  return Object.fromEntries(got.map((r) => [r.seal, new Date(r.solved_at).toISOString()]));
}
