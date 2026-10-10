/**
 * The opening film: clips play in this order and loop. Each clip is cut and
 * graded from the originals by scripts/encode-film.sh, which writes
 * public/film/<id>-lg (480p) and <id>-sm (360p, phones), each as .webm and
 * .mp4, and <id>.webp (the poster frame).
 *
 * `into` is how this clip arrives over the one before it: a slow dissolve,
 * or a dissolve broken for a moment by interference in the signal.
 *
 * `focus` is how far across the picture (0 to 1) its subject sits. On a tall
 * screen only a slice of the 16:9 picture shows, and it is panned to keep
 * this point in view.
 */
export interface Clip {
  id: string;
  into: 'dissolve' | 'interference';
  focus: number;
}

export const FILM: Clip[] = [
  { id: 'window', into: 'dissolve', focus: 0.57 },
  { id: 'hands', into: 'interference', focus: 0.5 },
  { id: 'figure', into: 'dissolve', focus: 0.74 },
  { id: 'cabin', into: 'interference', focus: 0.5 },
];

/** how long one clip takes to dissolve into the next, in seconds */
export const DISSOLVE = 2.4;

export type Format = 'webm' | 'mp4';
export const clipSrc = (id: string, size: 'lg' | 'sm', format: Format) => `/film/${id}-${size}.${format}`;
export const posterSrc = (id: string) => `/film/${id}.webp`;
