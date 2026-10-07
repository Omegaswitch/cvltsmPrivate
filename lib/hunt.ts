import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/*
 * The hunt. Everything that decides it lives here, on the server: the
 * riddles past the first, the answers, the address of each page. The
 * `server-only` import fails the build if anything here is ever pulled into
 * code that ships to the browser.
 *
 * Answers are stored as SHA-256 hashes of the normalised answer, so they are
 * not readable in the source either. Make a new one with:
 *   node scripts/hash-answer.mjs "your answer"
 */

export interface Stage {
  /** the page address, /rite/<slug>; the first stage is the home page */
  slug: string;
  /** the riddle, one paragraph per entry; [[word]] marks a word that glows */
  lines: string[];
  /** hashes of the accepted answers; empty on the last page */
  answers: string[];
}

export const STAGES: Stage[] = [
  {
    // stage 0: the riddle is the manuscript behind the home page (data/manuscript.ts)
    slug: '',
    lines: [],
    answers: [
      '2c70e12b7a0646f92279f427c7b38e7334d8e5389cff167a1dc30e73f826b683', // key
      '02c03cafcd09be9edb48088334582495e4505d04d3c453ce8614a4e776057818', // keycap
    ],
  },
  {
    slug: 'ae3f9c71b2',
    lines: [
      'Two pours, one body.',
      'The [[legend]] is not laid on me. It is [[poured]] into me, a [[second]] time, so that a thousand strikes cannot wear it away.',
      'Name the [[method]].',
    ],
    answers: ['1ca4038ef225f6baaf68d92557e86adca647356ff92559a91d7c4ab1e52a7484'], // doubleshot
  },
  {
    slug: '5d02b8e4c6',
    lines: [
      'I was spilled on the stone, and then I was left there.',
      'Now I am the colour of what has [[dried]]. The set gives me a [[name]] of two words.',
      '[[Speak]] it.',
    ],
    answers: ['3d1effb4b5adeb364385aa931850c53436fed8d972b17ea28ddb8b5979265a0d'], // dried blood
  },
  {
    slug: 'c917a6f04d',
    lines: [
      'It is done.',
      'You are [[counted]] among those who finished the rite.',
    ],
    answers: [],
  },
];

export const COOKIE = 'cvltsm_rite';

/** Lower case, letters and digits only: "Double-shot" and "double shot" are the same answer. */
export function normalise(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
}

function sha256(s: string): Buffer {
  return createHash('sha256').update(s).digest();
}

export function checkAnswer(stage: number, guess: string): boolean {
  const h = sha256(normalise(guess));
  return STAGES[stage].answers.some((a) => timingSafeEqual(Buffer.from(a, 'hex'), h));
}

/* --------------------------------------------------- signed progress cookie */

function secret(): string {
  const s = process.env.HUNT_SECRET;
  if (s) return s;
  // fail closed: a production server without a secret would accept forged progress
  if (process.env.NODE_ENV === 'production') throw new Error('HUNT_SECRET is not set');
  return 'dev-only-hunt-secret';
}

function signature(progress: number): string {
  return createHmac('sha256', secret()).update(`rite:${progress}`).digest('hex').slice(0, 32);
}

/** The cookie value for a given progress: the highest stage the visitor may open. */
export function signProgress(progress: number): string {
  return `${progress}.${signature(progress)}`;
}

/** Reads the cookie back. Anything missing, malformed or forged counts as 0. */
export function readProgress(value: string | undefined): number {
  if (!value) return 0;
  const [n, sig] = value.split('.');
  const progress = Number(n);
  if (!Number.isInteger(progress) || progress < 0 || progress >= STAGES.length || !sig) return 0;
  const expected = Buffer.from(signature(progress));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected) ? progress : 0;
}

/* ------------------------------------------------------------- rate limit */

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 20;
const attempts = new Map<string, { count: number; reset: number }>();

// ponytail: per-process memory. Each server instance counts on its own; move
// to a shared store (KV, Redis) if the hunt runs on many instances.
export function allowAttempt(key: string): boolean {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now > a.reset) {
    attempts.set(key, { count: 1, reset: now + WINDOW_MS });
    if (attempts.size > 5000) attempts.clear();
    return true;
  }
  a.count++;
  return a.count <= MAX_ATTEMPTS;
}
