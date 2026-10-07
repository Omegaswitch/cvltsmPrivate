/** Identity of the set. The manufacturer logo slot is filled by `manufacturerLogo`. */
export const SET = {
  name: 'CVLTSM',
  line: 'A keycap set in double-shot ABS, drawn from the Nordic ritual.',
  year: 'MMXXVI',
  /** public path of the manufacturer mark; undefined keeps the slot empty */
  manufacturerLogo: undefined as string | undefined,
} as const;
