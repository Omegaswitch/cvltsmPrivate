# CVLTSM

The site for CVLTSM, a keycap set. Not a shop: a way into its world. It opens on a film, a ritual found on damaged footage, with the set's logo over it; then the kits scroll up over the film and uncover the colors waiting beneath; then renders, vendors and a short colophon, each section torn over the one before.

```
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint     # type check
```

Next.js, React and TypeScript, built as a fully static page: any static host serves it, no server or secrets needed. No animation or 3D libraries: the film is plain video, the degradation is CSS, and the scroll effects run on CSS scroll timelines.

## Where things are

```
app/
  page.tsx               the page: nav, film, kits, colors, renders, vendors, colophon
  layout.tsx             metadata and the web font
  globals.css            every rule, in the order of the page
components/
  Hero.tsx               the opening: film, logo slots
  Film.tsx               the film player and its layers of damage
  KitsSection.tsx        the kits, each render at its own depth
  ColourSection.tsx      the colors, pinned beneath the kits
  RendersSection.tsx     the renders on an uneven grid
  VendorsSection.tsx     vendors by region
  Nav.tsx, Footer.tsx    three links; the colophon
  TornEdge.tsx           the torn edge between sections
data/
  brand.ts               names and logo paths
  film.ts                the clips: order, length, how each arrives
  Sound.tsx (components) the ambient track and its control
  kits.ts, colours.ts    the kits (and their render paths) and the colors
  renders.ts, vendors.ts the render slots and the vendors by region
public/film/             the graded clips, posters and the damage loop
public/audio/            the ambient loop (Ogg Opus and MP3)
public/textures/         grime, ground, grain and the blood for the hover
public/fonts/            Valhalica (the wordmark) and Faith Collapsing (headings and buttons)
public/brand/            the logos, when they exist
assets/                  originals the textures (and, locally, the film) are made from
scripts/                 encode-film.sh, encode-audio.sh, make-textures.mjs
```

## Replacing things

- **Kit renders.** All square (4000 × 4000, compressed). Put each in `public/kits/` and set its `src` in `data/kits.ts`; until then each kit shows a dashed square.
- **Renders.** All square (4000 × 4000, compressed). Put each in `public/renders/` and set its `src` in `data/renders.ts`.
- **Vendors.** Add names (and links) per region in `data/vendors.ts`; until then each region reads "To be announced".
- **Logos.** The SWG logo is `public/brand/SWGX.png`. Put the set logo in `public/brand/` and set `BRAND.logo` in `data/brand.ts`; until then CVLTSM is set in Valhalica.
- **Clips.** The originals go in `assets/film/` (kept out of git; they are large). Each clip's source, cut and grade are a line in `scripts/encode-film.sh`; run it with `FFMPEG=/path/to/ffmpeg scripts/encode-film.sh`. It writes 480p and 360p, WebM and MP4, and a poster frame per clip to `public/film/`. Each clip's line also sets how worn it is: the height it is shrunk to before being blown back up, and how much grain is baked in. The order, lengths and transitions are in `data/film.ts`.
- **Sound.** The original track is `assets/audio/dark-shamanic-horror.mp3`; `FFMPEG=/path/to/ffmpeg scripts/encode-audio.sh` bakes it into a seamless loop (the last 4 seconds crossfaded into the first) at about 0.7 MB. Swap the file and re-run to change the track.
- **Textures.** The concrete originals are in `assets/textures/`; `node scripts/make-textures.mjs` remakes the grime, the dark ground and the grain tile.
- **The red.** The blood in the film is one colour pass, `--film-tint` in `globals.css`. Its alpha is its strength.

## The film

Four clips, about 40 seconds, looping: a window choked with wire and the masked face behind it; hands against frosted glass; a hooded figure with a scythe in a misty court; the longer cabin sequence under a flashlight. All are graded to one look (near-monochrome, blacks crushed, a dirty cast, then a colour pass toward dried blood) and deliberately worn: shrunk to 200 to 320 lines and blown back up, grain baked in, 18 frames a second. The masked face is worn the most.

- Two video elements take turns. The next clip starts on top of the one still playing and dissolves in over 2.4 seconds, so the picture never drops to black. Two of the four arrivals are broken, for under a second, by interference: scan lines, a jump of grain, the picture torn sideways.
- Over the footage: a pass of real film dust and the brushed concrete as dirt. They do not sit still: they come in a pulse, two beats and a rest, and the dirt jumps on the beat. Every few seconds the picture glitches for a fraction of a second. Hairline scratches appear a few times a minute; the frame's edges are burned.
- One sheet of grain covers the whole site, moving in hard steps like a projector, so the film's texture carries on below it.
- The kits come up over the film on a torn edge while the film sinks back and darkens. Each kit render drifts against the scroll at its own pace. The colour section waits pinned beneath the kits, uncovered as they scroll away, its chips rising one after another.
- **Hover:** blood is dragged across a link or button in one smooth stroke, dripping; then the word rises out of it in Faith Collapsing, glowing, with paint running off its letters.

**Loading.** A poster frame is in the page from the start; the clips load one at a time as they are needed, at 480p on phones. The whole film, both sizes and both formats, is under 5 MB. The damage loop plays on large screens only.

**When it does not play.** With reduced motion, or a data-saving connection, nothing autoplays: the first poster frame stands, and the reel's Play starts the film. It pauses when it is covered or the tab is hidden. Pause is always at hand in the reel.

## Sound

Browsers keep a page silent until the visitor does something, so the ambient track begins on the first click, tap or key press, fading in over three seconds, and stops whenever the tab is hidden. The "Sound on / off" control at the foot of the screen, on the right, turns it off and on; the choice is kept on the visitor's device, and someone who turned it off is not played to again. iPhones ignore volume settings from the page, so there it simply starts at the file's own level.

## Motion and accessibility

- The film has a Pause control and plays nothing on its own under reduced motion or data saving. Under reduced motion the grain and scratches are still too, and the scroll effects are off.
- The logo slots are images with a label; the film is decorative and hidden from assistive technology.
- Links and buttons are real elements.

## What has not been measured

Checked in a headless browser with software rendering and the web fonts blocked. Video smoothness, the cost of the blend layers on a phone's GPU, and the type in its real faces are the first things to look at on real devices.

## Archive

Earlier designs are kept whole under `archive/`.
