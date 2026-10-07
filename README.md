# RITUAL / 2026

An interactive exhibition for a custom Nordic ritual keycap set. Not a store:
there is no pricing, cart, product grid or call to action. It is laid out and
paced as a museum catalogue, and it runs in nine chapters from the order of the
opening, through the object, its dissection and ritual, back to order.

Built with Next.js 16, React 19, TypeScript, GSAP with ScrollTrigger, and
React Three Fiber.

## Running it

```sh
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint         # type check (tsc --noEmit)
```

## The chapters

| # | Chapter | Component | Composition |
|---|---|---|---|
| 01 | Discovery | `HeroSection` | Near-black. One narrow key light finds the object; the type sits under it and the object may overlap it. Scroll brings it up and in. |
| 02 | The object | `ObjectSection` | A hard cut to bone. Monograph layout: heading in the grid, one macro plate, the record in thin rules. |
| 03 | Anatomy | `AnatomySection` | Black. A sticky stage. Scroll opens the stack layer by layer; leader lines travel with the layers. |
| 04 | Sigils | `SigilsSection` | The Elder Futhark on a grid. Hover dims the rest and reveals the keycap; click opens `RuneSpecimen`. |
| 05 | Ritual | `RitualSection` | Plates at radically different scales, pushed to alternating edges, with black between. The only motion is a slow drift. |
| 06 | Archive | `ArchiveSection` | A numbered contact sheet. Hover shows the record; click opens `ImageViewer`: black, image, index, close. |
| 07 | The set | `SetSection` | Hard cut back to bone and order. Every keycap is a specimen on the grid, with no cards and no shadows. |
| 08 | Void | `VoidSection` | Full black. One rune rises and grows past the viewport. Then DO NOT INVOKE. |
| 09 | Complete | `CompleteSection` | The finished object alone in the dark, which sinks away as the scroll continues. Then the credits and one rune. |

The fixed chrome (`Chrome`) carries RITUAL / 2026, the chapter navigation, the
INDEX overlay, and the chapter indicator. Its colour follows the chapter beneath
it. The indicator runs 01–09 because there are nine chapters; the brief's sketch
showed six.

## Where things live

```
app/
  layout.tsx            metadata, fonts, the root shell
  page.tsx              the chapters, in order
  globals.css           the grid, the palette, every chapter's rules
components/
  Chrome.tsx            navigation, chapter indicator, INDEX overlay
  HeroSection.tsx       chapter 01
  LazyScene.tsx         mounts the 3D scene only when near the screen
  KeyboardScene.tsx     the R3F canvas and its single key light
  KeyboardModel.tsx     the keyboard, built from the keycap data
  ObjectSection.tsx     chapter 02
  AnatomySection.tsx    chapter 03 (scroll drives --explode)
  ExplodedObject.tsx    the layer stack, placed by --i and --explode
  TechnicalAnnotation.tsx
  SigilsSection.tsx     chapter 04
  RuneSpecimen.tsx      the fullscreen specimen view
  RitualSection.tsx     chapter 05
  ArchiveSection.tsx    chapter 06
  ImageViewer.tsx       the archive viewer
  SetSection.tsx        chapter 07
  VoidSection.tsx       chapter 08
  CompleteSection.tsx   chapter 09
  Credits.tsx           end credits and the closing rune
  Plate.tsx             an image, or its labelled placeholder
data/                   every piece of copy and every item (see below)
lib/
  progress.ts           scroll progress read by the 3D scene each frame
  gsap.ts               ScrollTrigger, registered once on the client
  useMedia.ts           reduced motion and compact screens
  useInView.ts          mounts scenes only while near the screen
  useActiveChapter.ts   which chapter is on screen
  webgl.ts              feature check before any canvas mounts
types/index.ts          the shapes the data must match
public/images/          the photographs and plates (not yet supplied)
```

Content is data, not JSX. The runes, keycaps, archive images, ritual plates,
anatomy layers, metadata, chapters and credits are each a file in `data/`. To
change a number, a name or a placeholder, edit that file.

## Replacing the placeholders

Every image is a `Plate`. Until a file exists it renders a labelled placeholder
that names its aspect ratio and the path it is waiting for. To swap one in, put
the file at that path and set `src` on its entry in `data/` (for example,
`src: '/images/ritual/05-3-burned-timber.webp'`). Nothing else changes.

The table below is the complete list. Aspect ratios are fixed by the layout, so
shoot to them or crop before export. Prefer WebP; AVIF is fine where the
pipeline can produce it.

| File (under `public/`) | Aspect | Defined in |
|---|---|---|
| `images/ritual/05-1-wet-stone.webp` | 16 / 10 | `data/ritual.ts` |
| `images/ritual/05-2-black-earth.webp` | 4 / 5 | `data/ritual.ts` |
| `images/ritual/05-3-burned-timber.webp` | 21 / 6 | `data/ritual.ts` |
| `images/ritual/05-4-ash.webp` | 3 / 5 | `data/ritual.ts` |
| `images/ritual/05-5-forest.webp` | 3 / 2 | `data/ritual.ts` |
| `images/ritual/05-6-iron-bone.webp` | 1 / 1 | `data/ritual.ts` |
| `images/anatomy/01-legend.webp` | 4 / 1 | `data/anatomy.ts` |
| `images/anatomy/02-cap.webp` | 4 / 1 | `data/anatomy.ts` |
| `images/anatomy/03-stem.webp` | 4 / 1 | `data/anatomy.ts` |
| `images/anatomy/04-switch.webp` | 4 / 1 | `data/anatomy.ts` |
| `images/anatomy/05-plate.webp` | 4 / 1 | `data/anatomy.ts` |
| `images/hero/poster.webp` | 16 / 9 | `data/assets.ts` |
| `images/object/macro-cluster.webp` | 4 / 5 | `data/assets.ts` |
| `images/complete/poster.webp` | 16 / 9 | `data/assets.ts` |
| `images/keycaps/001-macro.webp` … `024-macro.webp` | 1 / 1 | `data/keycaps.ts (×24)` |
| `images/archive/IMG_001.webp` … `IMG_012.webp` | 4/5, 3/2, 1/1, 2/3, 4/3, 3/4, 1/1, 5/4, 2/3, 3/2, 4/5, 1/1 | `data/archive.ts (×12)` |

The placeholder copy is marked as such in the data. In particular: the keycap
profile, legend and material; the rune meanings; the anatomy dimensions and
notes; the coordinates on the object chapter; the plate captions; and the
credits, which read `[NAME]` until the people are confirmed.

## 3D assets

The keyboard is built procedurally in `KeyboardModel.tsx` from the keycap data,
so the scene works without any model file. The anatomy layers each name the
model that will replace their placeholder plate, in `data/anatomy.ts`:

| Layer | Expected file | Notes |
|---|---|---|
| 01 Legend | `public/models/anatomy/01-legend.glb` | single mesh, origin at the layer's centre |
| 02 Cap | `public/models/anatomy/02-cap.glb` | |
| 03 Stem | `public/models/anatomy/03-stem.glb` | |
| 04 Switch | `public/models/anatomy/04-switch.glb` | |
| 05 Plate | `public/models/anatomy/05-plate.glb` | |

To replace the whole keyboard, load the production model inside
`KeyboardModel.tsx` in place of the generated caps and plate. The scene reads
the group, not its parts, so the scroll-driven scale, height and fade continue
to work. Compress models (Draco or meshopt) and keep each under about 1 MB.

## Motion

Motion is used sparingly, in this order of importance:

1. **Scroll-controlled object movement.** The hero object rises and grows with
   the scroll; the anatomy layers open; the void rune grows; the finished object
   sinks into the dark. All of it is scrubbed to scroll, so the pace belongs to
   the visitor, and nothing springs.
2. **Image reveals.** Plates drift slightly against the scroll in the ritual
   chapter. Nothing blurs into focus.
3. **Typography.** The navigation underline and the indicator change; the
   wordmark does not animate.
4. **Micro-interactions.** Hover dims the other runes; a hover on a keycap
   enlarges it and reveals its record.

Easing is linear or restrained (`--ease-slow`). There is no bounce anywhere.

Scrolling is not hijacked. The page scrolls natively; GSAP only reads the
position. Lenis is not used: native scrolling is already responsive here, and
adding a smoothing layer would only make it less so.

## Performance

- **Code splitting.** The 3D scene is loaded with `next/dynamic`, `ssr: false`,
  and only mounts while its section is within 320px of the viewport. It is torn
  down when it leaves, so an off-screen canvas costs nothing.
- **Still poster where the canvas would cost too much.** Compact screens and
  reduced-motion visitors get the poster, not a live canvas. The same happens
  when the browser has no WebGL.
- **Images.** Plates are plain `<img loading="lazy" decoding="async">` and
  nothing above the fold waits on a large file. `next.config` serves images
  unoptimised, since they are pre-exported WebP/AVIF files in `public/`.
- **3D.** Pixel ratio is capped at 1.6. Shadows are on one spotlight only.
  Materials are shared, so the object's opacity is changed in one place.
- **Cleanup.** Each `useGSAP` context kills its ScrollTriggers on unmount.
  `KeyboardModel` disposes its geometries, textures and materials when it
  leaves. Scroll progress is written to a plain object the scene reads each
  frame, so scrolling does not re-render React.

### What has and has not been measured

This was built and checked in a headless browser on a machine **with no GPU**.
WebGL there is software-rendered, so:

- **Frame rate on real hardware is unknown.** It has not been measured on a
  laptop or phone with a GPU, and the software renderer is not a fair guide to
  it. The one thing to watch on real devices is the spotlight's shadow map and
  the keyboard's draw calls; both are small.
- Layout, every chapter, the hover and specimen interactions, the index, the
  mobile compositions, the no-WebGL poster and reduced motion were all checked
  by screenshot and by script, with no page errors.

## Mobile

Narrow and touch screens are composed for, not scaled down: the object chapter
stacks into one column, the rune index becomes three across, the set becomes
two across, the contact sheet two across with an offset, and the chapter
indicator becomes a corner marker that does not sit on the text. The hero uses
the still poster in place of the live canvas.

## Accessibility

- The menu and every interactive plate are buttons or links with names.
- The rune index and the archive respond to focus as well as hover, so they can
  be used from the keyboard. The set's keycap records appear on hover only; that
  is a gap to close before launch.
- The specimen view and the viewer take focus on open, close on Escape, and
  return focus to the control that opened them.
- Reduced motion removes the transitions and the 3D motion, and shows the still
  compositions.

## Notes and decisions

- **Chapter indicator:** 01–09, not 01–06 (see above).
- **Typography:** Inter Tight for the grotesk, Cormorant Garamond only for the
  serif notes, and Noto Sans Runic for the glyphs. No "Viking" display face is
  used for interface copy.
- **Colour:** the red `#541817` appears only in the chapter marker. Everything
  else is the bone, the black, and the muted grey.
- **Styling:** one stylesheet with a class per component rather than CSS
  modules, to keep the grid and the palette in one place.

## Archive

The earlier work is kept in the repository and nowhere else:

- [`archive/sigil/`](archive/sigil/) — the WebGL sigil and the static site it
  lived in. Runs with `python3 -m http.server` from that folder.
- [`archive/wheat-field/`](archive/wheat-field/) — the field at night, with the
  effigy in the crop.
- [`archive/pixel-wood/`](archive/pixel-wood/README.md) — the six-layer pixel
  forest.
