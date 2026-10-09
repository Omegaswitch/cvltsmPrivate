# CVLTSM

The site for CVLTSM, a keycap set. Not a shop: a way into its world. It opens on a film, a ritual found on damaged footage, with the set's logo over it; below that, a manuscript that hides the first riddle of a hunt.

```
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint     # type check
```

Next.js, React and TypeScript. No animation or 3D libraries: the film is plain video, the degradation is CSS, and the scroll effects run on CSS scroll timelines.

## Where things are

```
app/
  page.tsx               the page: nav, film, manuscript, colophon
  layout.tsx             metadata and the two web fonts
  globals.css            every rule, in the order of the page
  rite/[slug]/page.tsx   a page of the hunt (server)
  api/hunt/route.ts      checks a guess (server)
components/
  Hero.tsx               the opening: film, logo slots
  Film.tsx               the film player and its layers of damage
  LogoSlot.tsx           a logo, or the marked space where it will go
  Nav.tsx, Footer.tsx    two links; the colophon
  TornEdge.tsx           the torn top edge of the manuscript
  Manuscript.tsx         the old text and its hidden, glowing words
  Incantation.tsx        typing an answer, and the Speak field
  TwigStone.tsx          the twig-rune staves on a hunt page
data/
  brand.ts               names and logo paths
  film.ts                the clips: order, length, how each arrives
  manuscript.ts          the text of the first riddle
lib/hunt.ts              the hunt (server only)
public/film/             the graded clips, posters and the damage loop
public/textures/         grime, ground and grain
public/brand/            the logos, when they exist
assets/                  originals the textures (and, locally, the film) are made from
scripts/                 encode-film.sh, make-textures.mjs, hunt tools
docs/HUNT.md             the hunt's answers (spoilers)
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
- The manuscript slides up over the film on a torn edge while the film sinks back and darkens.

**Loading.** A poster frame is in the page from the start; the clips load one at a time as they are needed, at 480p on phones. The whole film, both sizes and both formats, is under 6 MB. The damage loop plays on large screens only.

**When it does not play.** With reduced motion, or a data-saving connection, nothing autoplays: the first poster frame stands, and the reel's Play starts the film. It pauses when the manuscript has covered it and when the tab is hidden. Pause is always at hand in the reel.

## The manuscript and the hunt

Below the film lies a page of old text (`components/Manuscript.tsx`, text in `data/manuscript.ts`). Some words are hidden in the same ink as the rest; they glow red when a cursor or a finger passes over them, and cool slowly when it moves on. Read in order, they are a riddle.

Typing the answer anywhere on the home page, outside a form field, opens the next page of the hunt (on a phone, use the **Speak** field in the footer). Each page holds another riddle, and the last one ends the hunt. There are six riddles. Past the first two they lean on things a search engine or a chatbot cannot simply hand over: a cipher that has to be read off a drawing, a riddle split between visitors, and a page that changes with the hour in Stockholm. The answers and the reasoning are in [`docs/HUNT.md`](docs/HUNT.md) (spoilers).

**Everything that decides the hunt is on the server.** The browser never receives an answer or the address of a page it has not earned:

- `lib/hunt.ts` (marked `server-only`, so the build fails if it is ever imported into browser code) holds the stages: each page's address, its riddle, and the SHA-256 hashes of its accepted answers.
- `app/api/hunt/route.ts` checks a guess. A right answer raises a signed, httpOnly progress cookie and returns the next address. A wrong one returns nothing useful. It is rate-limited to 20 attempts a minute per address.
- `app/rite/[slug]/page.tsx` renders a hunt page only when the cookie says it has been earned. For anyone else the address is a 404, so guessing or sharing a link reveals nothing, and a forged cookie is rejected.

Answers ignore case, spaces, punctuation and accents, and Norse letters are spelled out (þ as th, ð as d), so `Vámóðr` and `vamodr` are the same answer.

**To change a riddle:** edit its `lines` in `lib/hunt.ts` (wrap a word in `[[ ]]` to make it glow). A stage can also carry `stone` (twig runes drawn under the riddle), `fragments` (each visitor is given one, by a seed kept in their cookie) or `hours` (a line for day and one for night, by the clock in Stockholm). **To change an answer:** run `node scripts/hash-answer.mjs "new answer"` and put the hash in that stage's `answers`. The first riddle is the manuscript itself, in `data/manuscript.ts`; its answers are stage 0 in `lib/hunt.ts`. To add a page, add a stage with a new random slug (`openssl rand -hex 5`).

**To check it:** with the server running, `node scripts/check-hunt.mjs http://localhost:3000` plays the whole hunt and confirms that wrong answers, skipped stages, missing cookies and forged cookies are all refused. The script holds the answers, so treat it as a spoiler.

**Hosting:** the hunt needs a server, so the site can no longer be exported as static files. Vercel or any Node host runs it as is. Set `HUNT_SECRET` to a long random string in production (`openssl rand -hex 32`); the server refuses to sign progress without it. Changing it resets everyone's progress.

## Motion and accessibility

- The film has a Pause control and plays nothing on its own under reduced motion or data saving. Under reduced motion the grain and scratches are still too, and the scroll effects are off.
- The logo slots are images with a label; the film is decorative and hidden from assistive technology.
- Links and buttons are real elements; the manuscript is real text.

## What has not been measured

Checked in a headless browser with software rendering and the web fonts blocked. Video smoothness, the cost of the blend layers on a phone's GPU, and the type in its real faces are the first things to look at on real devices.

## Archive

Earlier designs are kept whole under `archive/`.
