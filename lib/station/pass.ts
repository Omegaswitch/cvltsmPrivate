import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/*
 * Who a visitor is, on the server only. After logging in a visitor carries a
 * session: their player id and a signature over it, so it cannot be written
 * by hand to become someone else. How far they have got is kept in the
 * database, never on their device. Answers are kept as hashes of their
 * normalised form, never as plain text, and never leave the server.
 *
 * The signing key is HUNT_SECRET (set on Vercel). Without it a fixed
 * development key is used, which is fine locally and nowhere else.
 */

const KEY = process.env.HUNT_SECRET || 'svartskog-development-key';

const sign = (id: number) => createHmac('sha256', KEY).update(`svartskog:player:${id}`).digest('base64url');

export const sessionFor = (id: number) => `${id}.${sign(id)}`;

/** The player a session vouches for, or null for anything missing or forged. */
export function playerOf(session: unknown): number | null {
  if (typeof session !== 'string') return null;
  const [i, sig] = session.split('.');
  const id = Number(i);
  if (!Number.isInteger(id) || id <= 0 || !sig) return null;
  const want = Buffer.from(sign(id));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got) ? id : null;
}

/** Answers are compared as letters and digits only, lower case. */
export const normalise = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');

export const hash = (s: string) => createHash('sha256').update(`svartskog/${s}`).digest('hex');

/**
 * The station's access code, hidden on the main site (faint runes at the foot
 * of the privacy policy: SKOGSRA). Any name logs in with it.
 */
export const ACCESS = 'ec53744d1f57d619de27999c2384c074e185a036e0da24acfa4089f3f3cabc11';
