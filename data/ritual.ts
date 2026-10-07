import type { RitualPlateItem } from '@/types';

/**
 * The ritual sequence. Sizes break the rhythm on purpose: one plate fills
 * eighty per cent of the width, another is a quarter, one is a long strip.
 * Empty black is left between them; it is part of the piece.
 */
export const RITUAL_PLATES: RitualPlateItem[] = [
  {
    label: 'PLATE 05.1', site: 'SITE UNKNOWN', time: '00:12:04', scale: 'wide', align: 'right',
    plate: { ratio: '16 / 10', path: '/images/ritual/05-1-wet-stone.webp', alt: 'Keyboard on wet stone' },
  },
  {
    label: 'PLATE 05.2', site: 'SITE UNKNOWN', time: '00:19:51', scale: 'small', align: 'left',
    plate: { ratio: '4 / 5', path: '/images/ritual/05-2-black-earth.webp', alt: 'Black earth' },
  },
  {
    label: 'PLATE 05.3', site: 'SITE UNKNOWN', time: '00:43:17', scale: 'strip', align: 'centre',
    plate: { ratio: '21 / 6', path: '/images/ritual/05-3-burned-timber.webp', alt: 'Burned timber, extreme crop' },
  },
  {
    label: 'PLATE 05.4', site: 'SITE UNKNOWN', time: '01:02:38', scale: 'tall', align: 'right',
    plate: { ratio: '3 / 5', path: '/images/ritual/05-4-ash.webp', alt: 'Ash and candle residue' },
  },
  {
    label: 'PLATE 05.5', site: 'SITE UNKNOWN', time: '01:11:09', scale: 'wide', align: 'left',
    plate: { ratio: '3 / 2', path: '/images/ritual/05-5-forest.webp', alt: 'Dark Scandinavian forest at night' },
  },
  {
    label: 'PLATE 05.6', site: 'SITE UNKNOWN', time: '01:26:44', scale: 'small', align: 'right',
    plate: { ratio: '1 / 1', path: '/images/ritual/05-6-iron-bone.webp', alt: 'Iron and bone' },
  },
];
