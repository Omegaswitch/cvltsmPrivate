# CVLTSM

The site for CVLTSM, a keycap set. Not a shop: a way into its world. It opens on a film, a ritual found on damaged footage, with the set's logo over it; then the kits scroll up over the film and uncover the colors waiting beneath; then renders, vendors and a colophon of one line (coming in 2027, in Valhalica), each section torn over the one before.

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
  Ooze.tsx               a colour bleeding out of its outline (thin, random, seeded); an SVG with its own goo filter, so Safari draws it right
  DripWatch.tsx          starts the dripping once, and pauses it off screen
  Engravings.tsx         the old woodcuts laid over the backgrounds
data/
  brand.ts               names and logo paths
  film.ts                the clips: order, length, how each arrives
  Sound.tsx (components) the ambient track and its control
  kits.ts, colours.ts    the kits (and their render paths) and the colors
  renders.ts, vendors.ts the render slots and the vendors by region
public/film/             the graded clips, posters and the damage loop
public/audio/            the ambient loop (Ogg Opus and MP3)
public/engravings/       the woodcuts, prepared (about 1 MB for ten; see Replacing things)
public/textures/         grime, ground and grain
public/fonts/            Valhalica (the wordmark, headings and buttons)
public/brand/            the logos, when they exist
assets/                  originals the textures (and, locally, the film) are made from
scripts/                 encode-film.sh, encode-audio.sh, make-textures.mjs, make-frame.mjs, make-engravings.mjs, make-brand.mjs
```

## Replacing things

- **Kit renders.** All square (4000 × 4000, compressed). Put each in `public/kits/` and set its `src` in `data/kits.ts`; until then each kit shows a dashed square.
- **Renders.** All square (4000 × 4000, compressed). Put each in `public/renders/` and set its `src` in `data/renders.ts`.
- **Vendors.** Add names (and links) per region in `data/vendors.ts`; until then each region reads "To be announced".
- **Logos.** The SWG logo is `public/brand/SWGX.png`. Put the set logo in `public/brand/` and set `BRAND.logo` in `data/brand.ts`; until then CVLTSM is set in Valhalica.
- **Clips.** The originals go in `assets/film/` (kept out of git; they are large). Each clip's source, cut and grade are a line in `scripts/encode-film.sh`; run it with `FFMPEG=/path/to/ffmpeg scripts/encode-film.sh`. It writes 480p and 360p, WebM and MP4, and a poster frame per clip to `public/film/`. Each clip's line also sets how worn it is (the height it is shrunk to before being blown back up, and how much grain is baked in) and, if the source has letterbox bars, the crop that takes them off. Name clips to encode only those: `scripts/encode-film.sh creature berserker`. The order, lengths and transitions are in `data/film.ts`.
- **Engravings.** Put the originals (black ink on white or transparent paper, any size) in `assets/engravings/` and run `node scripts/make-engravings.mjs`. Each becomes a faint light outline on a section's background, tilted and half off the edge; the next file takes the next place, and the places (section, side, angle, depth) are listed in `components/Engravings.tsx`.
- **Icon and share image.** `node scripts/make-brand.mjs` builds `app/favicon.ico`, `icon.svg`, `apple-icon.png` (the C of CVLTSM, from `assets/brand/*.svg`, Valhalica outlines) and the 1200×630 `opengraph-image.png` / `twitter-image.png` (a dark film frame, SWG, the name). Next picks them up by file name; `metadataBase` is https://cvltsm.cat.
- **Menu mark.** The SWG logo sits at the left of the menu, with no frame; the name CVLTSM draws in beside it at the same height as the film is scrolled past (scroll-driven, shown at once where unsupported). Both are one link, and its clickable area is the only box: it leads back to the top, smoothly.
- **Contour on hover.** Hovering a kit or render (picture or empty slot) scratches a contour round it: two uneven lines drawn along their length from opposite corners (`components/Trace.tsx`, `.trace` in `globals.css`). Once drawn it stays until the page is reloaded.
- **Loader.** While the page loads, the skull-and-smoke engraving (1-87) is traced in blood: its outline, then its inner shapes, the woodcut faintly behind (`components/Loader.tsx`). It lifts once the page and fonts are in, after at least 2.3s (0.6s with reduced motion), and by itself after 7s without script. The paths come from `python scripts/make-loader.py assets/engravings/1-87.png` (needs `opencv-python-headless` and `numpy`), which writes `components/loader-paths.ts`; pass another engraving to change it.
- **Larger view.** A kit or render that has its picture opens larger on click (`components/Lightbox.tsx`, ported from the GMK Liminal site): the picture itself grows from its place to the middle of the screen over a dark ground and shrinks back on close (click anywhere, Close, or Escape); Prev / Next, the arrow keys or a swipe step through the section's other pictures. A larger file can be given as `data-full` on the image. Slots without a picture are not clickable.
- **Loading.** Kit and render pictures show a dim passing band until they load (plain under reduced motion).
- **Outlines.** The scratched outline round the kits, renders and colors is `public/textures/frame.svg`; `node scripts/make-frame.mjs` draws a new one (it is seeded, so it is the same each time).
- **Sound.** The original track is `assets/audio/dark-shamanic-horror.mp3`; `FFMPEG=/path/to/ffmpeg scripts/encode-audio.sh` bakes it into a seamless loop (the last 4 seconds crossfaded into the first) at about 0.7 MB. Swap the file and re-run to change the track.
- **Textures.** The concrete originals are in `assets/textures/`; `node scripts/make-textures.mjs` remakes the grime, the dark ground and the grain tile.
- **The red.** The blood in the film is one colour pass, `--film-tint` in `globals.css`. Its alpha is its strength.

## The film

Seven clips, about 70 seconds, looping: a window choked with wire and the masked face behind it; hands against frosted glass; a hooded figure with a scythe in a misty court; the creature rising against a burning cabin (*The Ritual*); a horned berserker silhouetted before the fire (*The Northman*); a five-second run of shots from the *Werwulf* trailer (a skull, a snowy wood, riders with torches); and the longer cabin sequence under a flashlight. All are graded to one look (near-monochrome, blacks crushed, a dirty cast, then a colour pass toward dried blood) and deliberately worn: shrunk to 200 to 320 lines and blown back up, grain baked in, 18 frames a second. The masked face is worn the most.

- Two video elements take turns. The next clip starts on top of the one still playing and dissolves in over 2.4 seconds, so the picture never drops to black. Two of the four arrivals are broken, for under a second, by interference: scan lines, a jump of grain, the picture torn sideways.
- Over the footage: a pass of real film dust and the brushed concrete as dirt. They do not sit still: they come in a pulse, two beats and a rest, and the dirt jumps on the beat. Every few seconds the picture glitches for a fraction of a second. Hairline scratches appear a few times a minute; the frame's edges are burned.
- One sheet of grain covers the whole site, moving in hard steps like a projector, so the film's texture carries on below it.
- The kits come up over the film on a torn edge while the film sinks back and darkens. Each kit render drifts against the scroll at its own pace. The colour section waits pinned beneath the kits, uncovered as they scroll away, its chips rising one after another.
- **Hover:** a menu or back link is painted over with blood (not the sound control, which only brightens): a brush scrubs across it, drips fall and merge into the smear, and the word is written over it in Valhalica, glowing. Built as SVG strokes revealed along their length plus a gooey filter, driven by CSS transitions (`components/Daub.tsx`, `.daub` in `globals.css`), so it reverses smoothly if the pointer leaves.

**Loading.** A poster frame is in the page from the start; the clips load one at a time as they are needed, at 360p on phones, 480p on large screens. A visitor downloads one format at one size: the whole loop is about 3.0 MB on a large screen (plus 0.2 MB of film dust) and 1.4 MB on a phone. The damage loop plays on large screens only.

**When it does not play.** With reduced motion, or a data-saving connection, nothing autoplays: the first poster frame stands, and the reel's Play starts the film. It pauses when it is covered or the tab is hidden. Pause is always at hand in the reel.

## Sound

Sound (and the loader) live in the layout, and links between the site's pages do not reload, so the music carries on to the privacy policy and back. Sound is on by default and the control says "Sound on" from the start. Browsers keep a page silent until the visitor does something, so the track is heard from the first click, tap or key press (pressing the control counts too), fading in over three seconds; if the browser still refuses, the next gesture tries again. It stops at once whenever the tab is hidden (a hidden tab runs no animation frames to fade with). After that the "Sound on / off" control at the foot of the screen, on the right, turns it off and on, fading over about a second; the choice is kept on the visitor's device, and someone who turned it off is not played to again. iPhones ignore volume settings from the page, so there it simply starts and stops at the file's own level.

## Motion and accessibility

- The film has a Pause control and plays nothing on its own under reduced motion or data saving. Under reduced motion the grain and scratches are still too, and the scroll effects are off.
- The logo slots are images with a label; the film is decorative and hidden from assistive technology.
- Links and buttons are real elements.

## What has not been measured

Checked in a headless browser with software rendering and the web fonts blocked. Video smoothness, the cost of the blend layers on a phone's GPU, and the type in its real faces are the first things to look at on real devices.

## Archive

Earlier designs are kept whole under `archive/`.

## The hidden station (/svartskog)

A scavenger hunt behind the site. At the foot of the home page a faint line of runes spells SVARTSKOG; the console says where to look. `/svartskog` is Field Station 7: a red phosphor instrument wall set throughout in City Light, the Nostromo terminal's face (`public/fonts/city-light.woff2`), (the layout of a car's track-mode screen, drawn sharp and flat: thin rules, solid red, no glow, boot or flare; the instruments move on smooth waves every frame) and a topographic survey map (contours traced from a heightfield in `components/station/Topo.tsx`) with a terminal, the files of Dr. Ingrid Halvorsen, who observed the cult in the forest in 1987, and two instruments: a rune board (give the 24 runes their letters, stone 7 reads itself) and a receiver dial.

Four seals, each opened by something found in the files: the word on stone 7 (runes), a date (counted from the 1987 winter solstice), a frequency (a sum in the anomaly log), and the director's account (a name read down the transcript, a word in runes). The last level opens the encounters, the magical anomalies and her last entry. The chain and its answers are written at the top of `lib/station/content.ts`.

Everything is checked on the server (`app/api/station/route.ts`): answers are stored as hashes, files are only sent once a visitor's pass allows, and the pass is signed with `HUNT_SECRET` (set it on Vercel; a development key is used without it). The page is not linked, not in the sitemap and not indexed. Files: `components/station/` (Station, Terminal, Games, the beam text), `app/svartskog/station.css`, `lib/station/`.
