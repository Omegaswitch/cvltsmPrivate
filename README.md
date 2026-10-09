# CVLTSM

The site for CVLTSM, a keycap set. Not a shop: a way into its world. It opens on a film, a ritual found on damaged footage, with the set's logo over it, and closes on a short colophon.

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
  page.tsx               the page: nav, film, colophon
  layout.tsx             metadata and the web font
  globals.css            every rule, in the order of the page
components/
  Hero.tsx               the opening: film, logo slots
  Film.tsx               the film player and its layers of damage
  LogoSlot.tsx           a logo, or the marked space where it will go
  Nav.tsx, Footer.tsx    two links; the colophon
  TornEdge.tsx           the torn top edge of the colophon
data/
  brand.ts               names and logo paths
  film.ts                the clips: order, length, how each arrives
public/film/             the graded clips, posters and the damage loop
public/textures/         grime, ground and grain
public/brand/            the logos, when they exist
assets/                  originals the textures (and, locally, the film) are made from
scripts/                 encode-film.sh, make-textures.mjs
```

## Replacing things

- **Logos.** Put the files in `public/brand/` (SVG preferred) and set `BRAND.logo` and `BRAND.manufacturer.logo` (and `.name`) in `data/brand.ts`. Until then the hero shows a dashed slot of the right proportions in each place. No logo is drawn or set in type as a stand-in.
- **Clips.** The originals go in `assets/film/` (kept out of git; they are large). Each clip's source, cut and grade are a line in `scripts/encode-film.sh`; run it with `FFMPEG=/path/to/ffmpeg scripts/encode-film.sh`. It writes 720p and 480p, WebM and MP4, and a poster frame per clip to `public/film/`. The order, lengths and transitions are in `data/film.ts`.
- **Textures.** The concrete originals are in `assets/textures/`; `node scripts/make-textures.mjs` remakes the grime, the dark ground and the grain tile.
- **The red.** The blood in the film is one colour pass, `--film-tint` in `globals.css`. Its alpha is its strength.

## The film

Four clips, about half a minute, looping: a window choked with wire and the eyes behind it; hands against frosted glass; a hooded figure with a scythe in a misty court; a cabin wall under a flashlight. All are graded to one look: near-monochrome, blacks crushed, a dirty cast, then a colour pass toward dried blood.

- Two video elements take turns. The next clip starts on top of the one still playing and dissolves in over 2.4 seconds, so the picture never drops to black. Two of the four arrivals are broken, for under a second, by interference: scan lines, a jump of grain, the picture torn sideways.
- Over the footage: a looping pass of real film dust and grime (screened, so it only lightens), the brushed concrete multiplied in as dirt, two hairline scratches that appear a few times a minute, and the frame's edges burned.
- One sheet of grain covers the whole site, moving in hard steps like a projector, so the film's texture carries on below it.
- The colophon comes up over the film on a torn edge while the film sinks back and darkens.

**Loading.** A poster frame is in the page from the start; the clips load one at a time as they are needed, at 480p on phones. The whole film, both sizes and both formats, is under 6 MB. The damage loop plays on large screens only.

**When it does not play.** With reduced motion, or a data-saving connection, nothing autoplays: the first poster frame stands, and the reel's Play starts the film. It pauses when it is covered or the tab is hidden. Pause is always at hand in the reel.

## Motion and accessibility

- The film has a Pause control and plays nothing on its own under reduced motion or data saving. Under reduced motion the grain and scratches are still too, and the scroll effects are off.
- The logo slots are images with a label; the film is decorative and hidden from assistive technology.
- Links and buttons are real elements.

## What has not been measured

Checked in a headless browser with software rendering and the web fonts blocked. Video smoothness, the cost of the blend layers on a phone's GPU, and the type in its real faces are the first things to look at on real devices.

## Archive

Earlier designs are kept whole under `archive/`.
