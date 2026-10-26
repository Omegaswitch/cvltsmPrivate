# CVLTSM: design

## The idea

A Nordic cult's ritual, found on damaged film. The site should feel like being shown something you were not meant to see: an archival recording, an underground film, the visual world of a black metal record. Not a product page with horror effects added.

The references set the terms: black, and one red. The red of dried blood, used as a duotone over the image, never as a fill. Small type set like the margin of a film slate. Torn edges. Grime that is real (concrete, film dust), not generated noise.

## Rules

- **Composition over effects.** A strong grid, wide negative space, few elements, each placed on purpose. Degradation sits over a clean structure, never instead of one.
- **No invented copy.** No taglines, eyebrows or marketing sentences. The identity comes from the logos, the footage and the composition. Text that appears states facts. The colophon is one line, "Coming in 2027", in Valhalica, over the credit and the privacy link.
- **No stand-in logos.** Until the artwork exists, its place is a dashed slot of the right proportions. Nothing is drawn or set in a font in its place. (The set's logo exists now: the marks scratched on red, `assets/brand/cvltsm-logo.png`.)
- **Restraint in motion.** Slow dissolves; interference rarely and briefly; nothing flashing. Motion serves the film.

## Colour

Version 2 (the first stood on near-black; it is kept as the `v1` branch of the public repository). The ground is red: the red of the logo's artwork, `#cd1616`, taken down to where it reads as dried blood on stone.

- **Red** `#cd1616`: the artwork's red. The logo over the film, and nothing else at full strength.
- **Black** `#150506`, red at the bottom of it, never pure: the colours and the vendors, the loader, the page behind everything. **Char** `#2a0909` under the concrete.
- **The concrete** (kits, renders, the colophon, the privacy policy): the texture washed in red (`rgb(150 20 20 / 0.5)` over it), its edges burned. It reads about `#4a1210`, which is what the torn edges are cut from.
- **Bone** `#d4ccbf`: all type and hairlines. Dimmed bone (56%) for secondary type.
- **Dried blood** `rgb(160 22 20)`: the colour pass over the film, at 44%, moving the grade's hue toward blood. The film is the darkest red on the page.

## Type

- **Valhalica** (`public/fonts/`, the face the wordmark is drawn in) for everything the visitor reads as a heading or a button: the nav, section titles (up to 9rem), kit names, vendor regions, the sound control and the hover (the sound control itself has no blood, only brightens). Never for running text.
- **Interface:** Inter Tight for the small labels and the body of the privacy policy. Small and exact, like a slate.
- No gothic or blackletter: dark does not mean medieval-pastiche.

## Layout

- **Gutter** `clamp(20px, 3.2vw, 52px)`. Everything aligns to it.
- **The opening:** the film full bleed. The set's logo low on the left, about 56% of the width, where the eye settles; the manufacturer small at top left; the nav at top right; the reel at the foot on the right, opposite the logo. On phones the logo spans the width and the reel sits under it.
- **Kits:** on dark concrete, its top torn, coming up over the film. Square renders: the base kit at 7 of 12 columns, the numpad at 4 set low on the right, the novelties at 4 in the middle below. Each kit drifts at its own depth, name and all.
- **Colors:** pinned beneath the kits on black, uncovered as the kits' torn bottom edge scrolls away; four equal chips (Alphas base #565050, Red #A80800, Dark brown #2A2624, Cyan #B1BEC3), each bleeding out of its outline: the colour spills over the edge, blobs swell from its sides and thin drips run down over its foot, all fused by a gooey filter (blur, then alpha contrast). Every chip bleeds its own way (four to seven drips, 4 to 12px thick, a few long and most short, drawn from a seeded random so it is the same each visit), and the bleed does not stop at the foot of the section: one or two drips on each chip are long (420 to 640px), and keep running until the Renders page, torn edge first, slides over them and they disappear behind it. The dripping starts once, the first time the chips are really in view (the kits above have scrolled off them), and is never undone by scrolling: only a fresh load starts it again. It does not stop there: a bead slides down each drip, its tip swells, a drop forms, lets go and falls, each drip on its own timing, for as long as the colors are on screen (paused off screen). Name and hex below.
- **Renders:** on concrete, torn over the colors; square renders on an uneven 12-column grid (7 columns, 4 set low beside it, then three of 4), each drifting at its own depth.
- **Vendors:** on black, torn over the renders; regions in a ruled list.
- **Colophon:** four facts in a row (set, keycaps, manufacturer SWG, year 2027).

## The film's layers, bottom to top

poster frame; clip under; clip dissolving in; film damage (screen, 17%); concrete grime (multiply, 55%); blood (color, 32%); scratches; interference; shade (top and foot darkened for type, edges burned). Grain over the whole site at 8.5%.

## Motion

- Dissolve 2.4s, `cubic-bezier(0.4, 0, 0.2, 1)`. Interference 0.85s, in hard steps.
- Grain moves in six hard steps per 0.8s, by transform only. Scratches appear for a frame or two, three times in nine seconds.
- On scroll (CSS scroll timeline): the film scales to 1.06 and darkens as the kits rise; the logo and reel rise and fade. Kit renders drift against the scroll by 3 to 12vh. The colour chips rise in as the kits leave.
- The film's grime and dust pulse (two beats and a rest, 5.2s), and the picture glitches briefly every 7.7s.
- Hover (components/Daub.tsx): a brush scrubs back and forth along a path, revealed along its length (0.9s); five drips fall from the foot of the smear, quickening as they go (0.6 to 1.2s, from 0.65s); a gooey filter (blur, then alpha contrast, then a little displacement) melts drips and smear into one body; the word is written over it left to right in Valhalica (0.8s, from 0.4s), glowing, its paint running off its letters (from 1s). All transitions, not animations, so it reverses smoothly from wherever it has got to (0.25s) when the pointer leaves.
- Reduced motion: no autoplay, no grain or scratch movement, no scroll effects, no dissolves.

## Outlines and engravings

Kits, renders and colors are not framed; they are outlined. Two uneven lines, scratched by hand, broken in places and overshooting at the corners, bone at 62% and 32%, so the slot reads as drawn round, not as a frame hung on a wall.

Old woodcuts and engravings lie over the section backgrounds: black ink inverted to light lines, 17% bone, screen-blended so the paper vanishes, tilted 8 to 24 degrees, half off the edge and faded toward the inside. They sit under the content, in the section's own background, and never behind text a visitor has to read closely.

## Phones

The film is 16:9 and a phone shows a tall slice of it, so each clip carries a `focus` (how far across its subject sits, in `data/film.ts`) and is panned to keep that point in view: the masked face at 57%, the figure at 74%. Each clip also carries its own aspect (the two newest are wider than 16:9), so the pan is right for all of them.

## Sound

One ambient track, a seamless loop, at half level. It starts on the visitor's first click or key, fades in over 3 seconds, and the small control at the foot on the right (daubed on hover like the nav) turns it off. Off is remembered. Never autoplays, never plays in a hidden tab.
