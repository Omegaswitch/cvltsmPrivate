import type { RitualPlate } from '@/types';

/** The ritual plates, at deliberately different scales. */
export const RITUAL: { title: string; plates: RitualPlate[] } = {
  title: 'Something was invoked.',
  plates: [
    { scale: 'wide', align: 'right', ratio: '16 / 10', path: '/images/ritual/01.webp', alt: 'The set on wet stone' },
    { scale: 'small', align: 'left', ratio: '4 / 5', path: '/images/ritual/02.webp', alt: 'Black earth' },
    { scale: 'strip', align: 'centre', ratio: '21 / 6', path: '/images/ritual/03.webp', alt: 'Burned timber' },
    { scale: 'tall', align: 'right', ratio: '3 / 5', path: '/images/ritual/04.webp', alt: 'Ash and candle residue' },
  ],
};
