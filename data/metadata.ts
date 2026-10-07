import type { MetaRow } from '@/types';

/** The object's record, as printed on the plate beside the macro. */
export const OBJECT_RECORD: MetaRow[] = [
  { key: 'OBJECT', value: 'RITUAL-001' },
  { key: 'SYSTEM', value: 'MX' },
  { key: 'MATERIAL', value: 'PBT' },
  { key: 'YEAR', value: '2026' },
  { key: 'STATUS', value: 'COMPLETE' },
];

/** Tiny measurements set around the exploded view and the set. */
export const SET_RECORD: MetaRow[] = [
  { key: 'PARTS', value: '108' },
  { key: 'KEYCAPS', value: '24' },
  { key: 'ROWS', value: '4 × 6' },
  { key: 'PROFILE', value: 'placeholder: CUSTOM' },
];
