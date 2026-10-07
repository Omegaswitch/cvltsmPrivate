import type { PlateSource } from '@/types';

/*
 * Named placeholder plates used by the compositions that are not generated
 * from a data array. Replace `path` with a real file in /public and set `src`.
 */
export const HERO_POSTER: PlateSource = {
  ratio: '16 / 9',
  path: '/images/hero/poster.webp',
  alt: 'The keyboard, nearly in darkness',
};

export const OBJECT_MACRO: PlateSource = {
  ratio: '4 / 5',
  path: '/images/object/macro-cluster.webp',
  alt: 'Macro of several keycaps, rune legends in bone on black',
};

export const COMPLETE_POSTER: PlateSource = {
  ratio: '16 / 9',
  path: '/images/complete/poster.webp',
  alt: 'The finished object floating in darkness',
};
