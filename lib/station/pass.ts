import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/*
 * The station's clearance, on the server only. A visitor carries a pass: the
 * level they have reached and a signature over it, so a pass cannot be
 * written by hand to skip ahead. Answers are kept as hashes of their
 * normalised form, never as plain text, and never leave the server.
 *
 * The signing key is HUNT_SECRET (set on Vercel). Without it a fixed
 * development key is used, which is fine locally and nowhere else.
 */

const KEY = process.env.HUNT_SECRET || 'svartskog-development-key';

const sign = (level: number) => createHmac('sha256', KEY).update(`svartskog:${level}`).digest('base64url');

export const passFor = (level: number) => `${level}.${sign(level)}`;

/** The level a pass vouches for; 0 (a guest) for anything missing or forged. */
export function levelOf(pass: unknown): number {
  if (typeof pass !== 'string') return 0;
  const [l, sig] = pass.split('.');
  const level = Number(l);
  if (!Number.isInteger(level) || level < 0 || level > 9 || !sig) return 0;
  const want = Buffer.from(sign(level));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got) ? level : 0;
}

/** Answers are compared as letters and digits only, lower case. */
export const normalise = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');

export const hash = (s: string) => createHash('sha256').update(`svartskog/${s}`).digest('hex');
