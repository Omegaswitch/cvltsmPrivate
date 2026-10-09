/**
 * The opening film: clips play in this order and loop. Each clip is cut and
 * graded from the originals by scripts/encode-film.sh, which writes
 * public/film/<id>-lg (720p) and <id>-sm (480p, phones), each as .webm and
 * .mp4, and <id>.webp (the poster frame). `seconds` is the clip's length
 * after cutting.
 *
 * `into` is how this clip arrives over the one before it: a slow dissolve,
 * or a dissolve broken for a moment by interference in the signal.
 */
export interface Clip {
  id: string;
  seconds: number;
  into: 'dissolve' | 'interference';
}

export const FILM: Clip[] = [
  { id: 'window', seconds: 10, into: 'dissolve' },
  { id: 'hands', seconds: 6, into: 'interference' },
  { id: 'figure', seconds: 10, into: 'dissolve' },
  { id: 'cabin', seconds: 17, into: 'interference' },
];

/** how long one clip takes to dissolve into the next, in seconds */
export const DISSOLVE = 2.4;

export type Format = 'webm' | 'mp4';
export const clipSrc = (id: string, size: 'lg' | 'sm', format: Format) => `/film/${id}-${size}.${format}`;
export const posterSrc = (id: string) => `/film/${id}.webp`;
