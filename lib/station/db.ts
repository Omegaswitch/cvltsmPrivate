import { neon } from '@neondatabase/serverless';

/*
 * The register, in Neon (project cvltsm-station, Frankfurt). Tables:
 *   players  one row per name: their level and when they came and went
 *   solves   which seal each player opened, and when
 *   asks     what they asked the archive (the Gemini assistant), and whether
 *            the answer was held back
 * and a view, `register`, with one row per player and a column per seal:
 *   SELECT * FROM register;
 */

const url = process.env.DATABASE_URL;
export const sql = url ? neon(url) : null;

export type Player = { id: number; name: string; level: number };

/** a name, as typed, and the key it is matched on (so "Ingrid" and "ingrid " are one player) */
export const nameKey = (name: string) => name.trim().toLowerCase().normalize('NFKC').replace(/\s+/g, ' ');

export async function enter(name: string): Promise<Player> {
  if (!sql) throw new Error('no database');
  const rows = await sql`
    INSERT INTO players (name, name_key) VALUES (${name.trim()}, ${nameKey(name)})
    ON CONFLICT (name_key) DO UPDATE SET last_seen = now()
    RETURNING id, name, level`;
  return rows[0] as Player;
}

export async function player(id: number): Promise<Player | null> {
  if (!sql) return null;
  const rows = await sql`UPDATE players SET last_seen = now() WHERE id = ${id} RETURNING id, name, level`;
  return (rows[0] as Player) ?? null;
}

export async function solve(id: number, seal: string, level: number) {
  if (!sql) return;
  await sql`UPDATE players SET level = GREATEST(level, ${level}) WHERE id = ${id}`;
  await sql`INSERT INTO solves (player_id, seal) VALUES (${id}, ${seal}) ON CONFLICT DO NOTHING`;
}

/** questions asked in the last hour */
export async function asksLastHour(id: number): Promise<number> {
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM asks WHERE player_id = ${id} AND asked_at > now() - interval '1 hour'`;
  return (rows[0] as { n: number }).n;
}

export async function logAsk(id: number, question: string, answer: string, blocked: boolean) {
  if (!sql) return;
  await sql`INSERT INTO asks (player_id, question, answer, blocked) VALUES (${id}, ${question}, ${answer}, ${blocked})`;
}
