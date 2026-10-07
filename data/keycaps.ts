import type { Keycap } from '@/types';
import { RUNES } from './runes';

/**
 * The set: twenty-four keycaps, one per rune, in four rows of six.
 * Profile, legend and material are placeholders for the production spec.
 * Each macro plate is a placeholder until a photograph exists; set `src` to
 * the public path of the finished image to replace it.
 */
export const KEYCAPS: Keycap[] = RUNES.map((rune, i) => {
  const n = String(i + 1).padStart(3, '0');
  return {
    specimen: `RIT-${n}`,
    rune,
    row: Math.floor(i / 6) + 1,
    position: (i % 6) + 1,
    profile: 'placeholder: CUSTOM / SCULPTED',
    legend: 'placeholder: DYE-SUB, RUNE',
    material: 'PBT',
    plate: {
      ratio: '1 / 1',
      path: `/images/keycaps/${n}-macro.webp`,
      alt: `Macro of keycap RIT-${n}, ${rune.name}`,
    },
  };
});

export const KEYCAP_ROWS = 4;
