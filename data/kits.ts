import type { Kit } from '@/types';

/** The kits, in the order they appear. Photographs go to the paths shown. */
export const KITS: Kit[] = [
  {
    id: 'base',
    name: 'Base',
    summary: 'Alphas, core modifiers and the legends of the ritual.',
    plate: { ratio: '3 / 2', path: '/images/kits/base.webp', alt: 'The base kit, laid out' },
  },
  {
    id: 'numpad',
    name: 'Numpad',
    summary: 'The full numpad, with the tall zero and enter.',
    plate: { ratio: '4 / 5', path: '/images/kits/numpad.webp', alt: 'The numpad kit' },
  },
  {
    id: 'novelties',
    name: 'Novelties',
    summary: 'Accent keys in the theme of the set.',
    plate: { ratio: '4 / 5', path: '/images/kits/novelties.webp', alt: 'The novelty keys' },
  },
  {
    id: 'deskmat',
    name: 'Deskmat',
    summary: 'The carpet pattern of the set, printed for the desk.',
    plate: { ratio: '21 / 9', path: '/images/kits/deskmat.webp', alt: 'The deskmat' },
  },
];
