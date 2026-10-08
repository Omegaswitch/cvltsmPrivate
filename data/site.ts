/** Identity of the set. The manufacturer logo slot is filled by `manufacturerLogo`. */
export const SET = {
  name: 'CVLTSM',
  line: 'A keycap set in double-shot ABS, drawn from the Nordic ritual.',
  year: 'MMXXVI',
  /** public path of the manufacturer mark; undefined keeps the slot empty */
  manufacturerLogo: undefined as string | undefined,
  /** public path of the old image deep behind the manuscript (make it with
   *  scripts/make-backdrop.mjs); undefined leaves the paper bare */
  backdrop: undefined as string | undefined,
} as const;
