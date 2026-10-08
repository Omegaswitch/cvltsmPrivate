// Prints the hash of an answer, for lib/hunt.ts.
// Usage: node scripts/hash-answer.mjs "double shot"
// The normalising here must match normalise() in lib/hunt.ts.
import { createHash } from 'node:crypto';

const LETTERS = { 'þ': 'th', 'ð': 'd', 'æ': 'ae', 'ø': 'o', 'œ': 'oe', 'ß': 'ss' };
const normalise = (s) => s.toLowerCase()
  .replace(/[þðæøœß]/g, (c) => LETTERS[c])
  .normalize('NFKD')
  .replace(/[^a-z0-9]/g, '');

const answer = process.argv.slice(2).join(' ');
if (!answer) {
  console.error('usage: node scripts/hash-answer.mjs "<answer>"');
  process.exit(1);
}
console.log(normalise(answer), createHash('sha256').update(normalise(answer)).digest('hex'));
