# CVLTSM

The site for CVLTSM, a keycap set in double-shot ABS, drawn from the Nordic ritual.
It presents the set: the kits, the colourway, the renders, the ritual, the vendors.
It is not a shop. There are no prices and no cart. A hidden hunt runs underneath it.

Design rules are in [`DESIGN.md`](DESIGN.md). Read it before changing anything visual.

## Run it

```sh
npm install
npm run dev       # http://localhost:3000
npm run build && npm start
npm run lint      # type check
```

Built with Next.js, React, TypeScript, GSAP (for the scroll-linked keyboard) and React Three Fiber.

## Where things are

```
app/
  page.tsx            the sections, in order
  layout.tsx          metadata, the wordmark font, the Inter Tight stylesheet
  globals.css         the palette, the grid, every section's rules
components/
  Header.tsx          wordmark and section links; the header takes the tone beneath it
  Hero.tsx            the opening: manufacturer slot, wordmark, keyboard
  KitsSection.tsx     Base leads; Numpad and Novelties side by side; Deskmat full width
  ColourSection.tsx   the colourway strip
  RendersSection.tsx  the render grid; a click opens a plain viewer
  RitualSection.tsx   a statement, then plates at uneven scales
  VendorsSection.tsx  regions, with a status line each
  CreditsSection.tsx  credits and the closing wordmark
  KeyboardModel.tsx   the stand-in keyboard (see below)
  KeyboardScene.tsx   the canvas and its single key light
  LazyScene.tsx       mounts the canvas only while near the screen
  Plate.tsx           an image, or an empty tile of the same aspect
data/                 every piece of copy and every item (edit these, not the components)
lib/                  scroll progress, GSAP setup, media queries, WebGL check
types/index.ts        the shapes the data must match
public/fonts/         Valhalica, the wordmark face
public/images/        photographs and renders (not yet supplied)
archive/              earlier designs, kept whole
```

## Content

Everything on the page comes from `data/`:

| File | Holds |
|---|---|
| `site.ts` | the name, the one line under the wordmark, the year, the manufacturer logo path |
| `kits.ts` | the four kits: name, one line, photograph |
| `colours.ts` | the colourway chips, in strip order |
| `renders.ts` | the renders, each with its place on the grid |
| `ritual.ts` | the ritual statement and its plates |
| `vendors.ts` | the regions, and vendor names once confirmed |
| `credits.ts` | the credits; names read `[NAME]` until confirmed |

## Replacing placeholders

Every image is a `Plate`. Until a file exists, its slot is an empty tile with the right aspect ratio, so the layout is already correct.

To fill a slot, put the file at the path in `data/` (under `public/`) and set `src` on that entry, for example:

```ts
{ name: 'Base', ..., plate: { ratio: '3 / 2', path: '/images/kits/base.webp', src: '/images/kits/base.webp', alt: '…' } }
```

Aspect ratios are fixed by the layout. Shoot to them or crop before export. WebP is the format used.

| Slot | Ratio | File |
|---|---|---|
| Base kit | 3 / 2 | `public/images/kits/base.webp` |
| Numpad | 4 / 5 | `public/images/kits/numpad.webp` |
| Novelties | 4 / 5 | `public/images/kits/novelties.webp` |
| Deskmat | 21 / 9 | `public/images/kits/deskmat.webp` |
| Renders 01 to 05 | 4/3, 4/5, 3/2, 3/4, 21/8 | `public/images/renders/01.webp` to `05.webp` |
| Ritual 01 to 04 | 16/10, 4/5, 21/6, 3/5 | `public/images/ritual/01.webp` to `04.webp` |
| Manufacturer mark | any, reserved height | set `SET.manufacturerLogo` in `data/site.ts` |

## The keyboard

`KeyboardModel.tsx` is a stand-in: a plate and twenty-four plain caps. To use the real model, replace the body of that component. The scroll moves the group, not its parts, so the rise from the dark keeps working.

## The manuscript and the hunt

Behind the site lies a page of old text on dark paper (`components/Manuscript.tsx`, text in `data/manuscript.ts`). Some words are hidden in the same ink as the rest; they glow red when a cursor or a finger passes over them, and cool slowly when it moves on. Read in order, they are a riddle.

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

- The keyboard rises with the scroll. Nothing else on the page moves on its own.
- Reduced motion shows the keyboard in its final pose, with no scroll-linked motion.
- Narrow screens and browsers without WebGL get a still poster in place of the canvas.
- The viewer closes on Escape. Links and buttons are real elements.

## What has not been measured

This was built and checked in a headless browser on a machine with no GPU. WebGL there is software-rendered, so the frame rate of the keyboard on real hardware is unknown. That is the first thing to check on a phone and a laptop.

## Archive

Earlier work is kept whole and runnable under `archive/`: `sigil/` (the WebGL sigil site), `wheat-field/`, and `pixel-wood/`.
