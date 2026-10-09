/**
 * The renders, in order. `span` places each on the grid: `lead` 7 of 12
 * columns, `side` 4 columns set low beside it, `wide` the full width, `half`
 * 6 columns. Put the files in public/renders/ and set `src`; until then each
 * slot holds its place and proportions.
 */
export interface Render {
  id: string;
  span: 'lead' | 'side' | 'wide' | 'half';
  ratio: string;
  alt: string;
  src?: string;
}

export const RENDERS: Render[] = [
  { id: 'r1', span: 'lead', ratio: '4 / 3', alt: 'Render 1' },
  { id: 'r2', span: 'side', ratio: '4 / 5', alt: 'Render 2' },
  { id: 'r3', span: 'wide', ratio: '21 / 9', alt: 'Render 3' },
  { id: 'r4', span: 'half', ratio: '3 / 2', alt: 'Render 4' },
  { id: 'r5', span: 'half', ratio: '3 / 2', alt: 'Render 5' },
];
