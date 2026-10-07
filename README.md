# CVLTSM

The site for CVLTSM, a keycap set in double-shot ABS, drawn from the Nordic ritual.
It presents the set: the kits, the colourway, the renders, the ritual, the vendors.
It is not a shop. There are no prices and no cart.

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

## Motion and accessibility

- The keyboard rises with the scroll. Nothing else on the page moves on its own.
- Reduced motion shows the keyboard in its final pose, with no scroll-linked motion.
- Narrow screens and browsers without WebGL get a still poster in place of the canvas.
- The viewer closes on Escape. Links and buttons are real elements.

## What has not been measured

This was built and checked in a headless browser on a machine with no GPU. WebGL there is software-rendered, so the frame rate of the keyboard on real hardware is unknown. That is the first thing to check on a phone and a laptop.

## Archive

Earlier work is kept whole and runnable under `archive/`: `sigil/` (the WebGL sigil site), `wheat-field/`, and `pixel-wood/`.
