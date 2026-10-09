import 'server-only';
import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';

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
  /** staves cut in twig runes, drawn under the riddle: [left branches, right branches] */
  stone?: [number, number][];
  /** one of these is added to the riddle, chosen by the visitor's seed, so no one sees them all */
  fragments?: string[][];
  /** added to the riddle by the hour in Stockholm: day is 06:00 to 17:59 */
  hours?: { day: string[]; night: string[] };
}

export const STAGES: Stage[] = [
  {
    // stage 0: the riddle is the manuscript on the home page (data/manuscript.ts)
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
    // the Rök runestone hides words in a cipher of twig runes: left branches
    // count the family (ætt) of the Younger Futhark, right branches the rune
    // within it, and on Rök the first and third families swap numbers.
    // The staves spell uamuþ, Vámóðr, the son the stone was raised for.
    slug: '444cce3874',
    lines: [
      'Five staves, cut the way they were cut on a stone in Östergötland eleven hundred years ago.',
      'Count the branches. Those on the [[left]] name the family, those on the [[right]] the place within it.',
      'On that stone the first family and the last [[traded]] places. Read them as it does.',
      'The staves spell the first name the stone remembers. [[Speak]] it.',
    ],
    stone: [[3, 2], [2, 4], [1, 3], [3, 2], [3, 3]],
    answers: [
      '9fcf369a286a7decad2d9d3ef673c9dc40914d904a5b55e191d33fbe20908a75', // uamuth (uamuþ)
      'bad80600ef2bb8de42a5c14b7f8d2780af4ae2f962059867f7ec01f89ff37f16', // vamodr
      '55a9334bb5ef45224731c18e684004bac842fb2cd95cedef05061afcbfd4fe03', // vamod
      'fa58c1c68f0d2eaa2bec981a906d1fa5c0bb13adb8edfa9a499aabfee9a43244', // vamothr
      '1a173f002598b74a0c00cd3930dba93aaf2aab522a6d3383e7e5bc7445323eff', // vamoth
    ],
  },
  {
    // four fragments, one per visitor: Ymir, Ginnungagap, Gungnir, Ratatoskr.
    // Their first letters spell Yggr, a name of Odin.
    slug: '6f294ec0f7',
    lines: [
      'This page is not the same for everyone. Four were each given one line, and you hold [[one]].',
      'Find the others. Name what each line describes and keep its first letter, in the order of the lines.',
      'Together they spell one of his [[names]].',
    ],
    fragments: [
      ['The first line. From his [[blood]] the sea, from his bones the hills, from his skull the sky.'],
      ['The second line. Before anything, the [[gap]] that yawned between the fire and the ice.'],
      ['The third line. His [[spear]], which never misses.'],
      ['The fourth line. He runs up and down the [[tree]], carrying insults between the eagle and the serpent.'],
    ],
    answers: ['47077d5dfcc638a1d9c15e311cb39a04e09c20f3750c332961071bc7900f7d07'], // yggr
  },
  {
    // the wolves that chase the sun and the moon: Sköll by day, Hati by night
    slug: '8ece93fb04',
    lines: [
      'This page is [[not]] the same by day and by night. It keeps the hours of the north.',
      'Speak both names, the day\'s first.',
    ],
    hours: {
      day: ['By day: one runs behind the sun, and at the end he will catch it. His name means [[treachery]].'],
      night: ['By night: one runs behind the moon, and at the end he will catch it. His name means [[hatred]].'],
    },
    answers: [
      '14a3ef4a938a5a637b88a19418ccb91fbdc62bb3d9be97528165091ae1d7a580', // skollhati
      '1fad0ee3b8871e3ff5081b8fc177c1209330aa0b47597d0e12ffae49b87632c5', // skolhati
      '5137325db506f267120502e529c3c27ec64010d0f4b547752b73c781d2c196a8', // skollandhati
    ],
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

const LETTERS: Record<string, string> = { 'þ': 'th', 'ð': 'd', 'æ': 'ae', 'ø': 'o', 'œ': 'oe', 'ß': 'ss' };

/**
 * Lower case, letters and digits only: "Double-shot" and "double shot" are the
 * same answer, and so are "Vámóðr" and "vamodr". scripts/hash-answer.mjs does the same.
 */
export function normalise(s: string): string {
  return s.toLowerCase()
    .replace(/[þðæøœß]/g, (c) => LETTERS[c])
    .normalize('NFKD')
    .replace(/[^a-z0-9]/g, '');
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

function signature(progress: number, seed: number): string {
  return createHmac('sha256', secret()).update(`rite:${progress}:${seed}`).digest('hex').slice(0, 32);
}

/**
 * Progress is the highest stage the visitor may open. The seed is drawn once,
 * with their first right answer, and decides which fragment they are given.
 */
export interface Rite { progress: number; seed: number }

export function newSeed(): number {
  return randomInt(10_000);
}

export function signProgress({ progress, seed }: Rite): string {
  return `${progress}.${seed}.${signature(progress, seed)}`;
}

/** Reads the cookie back. Anything missing, malformed or forged counts as no progress and no seed. */
export function readProgress(value: string | undefined): Rite | null {
  if (!value) return null;
  const [p, s, sig] = value.split('.');
  const progress = Number(p);
  const seed = Number(s);
  if (!Number.isInteger(progress) || progress < 0 || progress >= STAGES.length) return null;
  if (!Number.isInteger(seed) || seed < 0 || seed >= 10_000 || !sig) return null;
  const expected = Buffer.from(signature(progress, seed));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected) ? { progress, seed } : null;
}

/* ------------------------------------------------------------ the verses */

const hourIn = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Stockholm', hour: 'numeric', hourCycle: 'h23' });

/**
 * The riddle as this visitor sees it now. Their fragment, or the line for the
 * hour in Stockholm, goes after the first line.
 */
export function versesFor(stage: Stage, seed: number, now = new Date()): string[] {
  const [first, ...rest] = stage.lines;
  if (stage.fragments) return [first, ...stage.fragments[seed % stage.fragments.length], ...rest];
  if (stage.hours) {
    const hour = Number(hourIn.format(now));
    return [first, ...(hour >= 6 && hour < 18 ? stage.hours.day : stage.hours.night), ...rest];
  }
  return stage.lines;
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
