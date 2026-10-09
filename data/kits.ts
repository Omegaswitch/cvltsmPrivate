/**
 * The kits, in the order they appear. Each has a render slot: set `src` to
 * the file's public path once it exists (put it in public/kits/); until
 * then the slot holds its place and proportions.
 */
export interface Kit {
  id: string;
  name: string;
  contents: string;
  ratio: string;
  src?: string;
}

export const KITS: Kit[] = [
  { id: 'base', name: 'Base', contents: 'Alphas and modifiers', ratio: '3 / 2' },
  { id: 'numpad', name: 'Numpad', contents: 'The full numpad', ratio: '4 / 5' },
  { id: 'novelties', name: 'Novelties', contents: 'Accent keys', ratio: '4 / 5' },
  { id: 'deskmat', name: 'Deskmat', contents: 'Printed deskmat', ratio: '21 / 9' },
];
