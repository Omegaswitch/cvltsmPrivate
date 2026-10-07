import type { RenderPlate } from '@/types';

/** Renders and photographs, placed on the grid by `span`. */
export const RENDERS: RenderPlate[] = [
  { span: 'lead', ratio: '4 / 3', path: '/images/renders/01.webp', alt: 'Render of the set on black' },
  { span: 'side', ratio: '4 / 5', path: '/images/renders/02.webp', alt: 'Render of the base kit' },
  { span: 'half', ratio: '3 / 2', path: '/images/renders/03.webp', alt: 'Render of the novelty keys' },
  { span: 'half', ratio: '3 / 4', path: '/images/renders/04.webp', alt: 'Render of a keycap in close view' },
  { span: 'full', ratio: '21 / 8', path: '/images/renders/05.webp', alt: 'Wide render of the set' },
];
