/**
 * The renders, in order; all are square (4000 × 4000). `span` places each on
 * the 12-column grid: `lead` 7 columns, `side` 4 columns set low beside it,
 * `third` 4 columns. Put the files in public/renders/ and set `src`; until
 * then each slot holds its place.
 */
export interface Render {
  id: string;
  span: 'lead' | 'side' | 'third';
  alt: string;
  src?: string;
}

export const RENDERS: Render[] = [
  { id: 'r1', span: 'lead', alt: 'Render 1' },
  { id: 'r2', span: 'side', alt: 'Render 2' },
  { id: 'r3', span: 'third', alt: 'Render 3' },
  { id: 'r4', span: 'third', alt: 'Render 4' },
  { id: 'r5', span: 'third', alt: 'Render 5' },
];
