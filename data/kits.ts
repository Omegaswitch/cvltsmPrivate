/**
 * The kits, in the order they appear. Each render is square (4000 × 4000,
 * compressed): put it in public/kits/ and set `src`; until then the slot
 * holds its place.
 */
export interface Kit {
  id: string;
  name: string;
  src?: string;
}

export const KITS: Kit[] = [
  { id: 'base', name: 'Base' },
  { id: 'numpad', name: 'Numpad' },
  { id: 'novelties', name: 'Novelties' },
];
