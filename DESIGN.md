# Design system: CVLTSM

The source of truth for the CVLTSM keycap set site. Tokens live in `app/globals.css`. When this file and the CSS disagree, the CSS is right and this file needs updating.

## What it is

CVLTSM is a keycap set: double-shot ABS, a Nordic ritual theme. The site presents the set. It is not a shop: no prices, no cart, no product cards, no calls to action beyond following the page.

It should feel like a printed record sleeve or a museum catalogue, not an app and not a horror game. Few elements, a lot of dark space, one thing per section.

## Palette

Four colours and one accent. Nothing else.

- **Void** `#070707`: the page ground. Never pure black.
- **Bone** `#D2CCBE`: primary text on void, and the ground of the bone sections.
- **Ink** `#0A0A09`: text on bone.
- **Ash** `#686762`: secondary text. On void it is small-text legible only at 14px and up.
- **Dried blood** `#541817`: the accent. Used for at most one thing per view (a rule, a focus ring, a single word). Never for fills of large areas.

Hard cuts between void and bone sections. No gradients on backgrounds, no glows, no glassmorphism.

## Type

- **Wordmark:** Valhalica (`public/fonts/Valhalica-Regular.otf`), used for the CVLTSM wordmark only. Set in capitals, tracked, never for body copy or buttons.
- **Interface and display:** Inter Tight, a neo-grotesk. Display sizes carry hierarchy, weight 500, tight tracking (`-0.025em`). Body 1.125rem to 1.1875rem at 1.55 leading.
- **Sizes:** section titles `clamp(2.25rem, 4.6vw, 3.6rem)`, leads at most 60ch, body at most 46ch.
- No monospace. No serif outside the manuscript (below). No letter-spaced uppercase for headings or buttons.

## The manuscript (the one exception)

Behind the whole site lies a page of old text on dark, aged paper. It is the only place that breaks the rules above, and it breaks them on purpose:

- **Paper:** `#14110d`, long fibres from noise, a burnt edge, two faint stains. It never animates.
- **Text:** IM Fell English, bone at 7.5% opacity, two justified columns with a drop cap. On the hunt pages the same face is set large and legible.
- **Hidden words:** set in the same ink as the rest, so they cannot be seen. A cursor or a finger passing near one makes it glow ember red (`#b1291f`); when it moves away the word cools over a few seconds. Read in order, the hidden words are the first riddle.
- **Drift:** the sheet moves at 6% of the scroll, so it sits behind the page. None under reduced motion.
- **Behind the wordmark** a patch of bare paper keeps the text from showing through the letters.

The ember red appears nowhere else on the site. The void sections are transparent so the paper shows through; the bone sections cover it.

## Layout

- A 12-column grid, max width 1600px, gutters `clamp(20px, 3.4vw, 56px)`.
- Sections have 136px top padding on desktop, 96px on mobile. More space above a heading than below.
- Each section uses a different composition. Never repeat one.
- Mobile collapses every multi-column layout to one column, except the contact sheet of renders (two across).

## Sections, in order

1. **Opening.** Full viewport, void. The CVLTSM wordmark and the 3D keyboard. One line of text.
2. **Kits.** Bone. One lead kit at 7/12 with its image, two kits side by side, the deskmat wide.
3. **Colour.** Void. One continuous strip of the set's colourway, widths in proportion, names only.
4. **Renders.** Void. An asymmetric grid of plates at different scales. Click opens a plain viewer.
5. **Ritual.** Void. Large plates pushed to alternating edges with black between them.
6. **Vendors.** Bone. Regions as a list, each with a placeholder row.
7. **Credits.** Void. Roles and names, and the wordmark small at the foot.

## Components

- **Buttons:** one primary per view at most. Square corners, 8px radius at most. Sentence-case label. Solid bone on void, solid void on bone.
- **Links:** underlined with the text colour, offset 0.2em. Hover changes colour, not weight.
- **Plates (image slots):** an empty plate is a flat tile in a colour step from the ground. It draws no text, no corners, no caption, no path. When an image exists it replaces the tile.
- **Navigation:** the wordmark small at top left, section links at top right. Links are real anchors. The active section link is underlined. No numbered progress indicator.
- **Viewer:** black, the image, a close control. Escape closes.

## Motion

- Scroll-linked movement only for the 3D keyboard in the opening, and at most a slow fade of the wordmark.
- Entrances: fade only, 800ms, one per section, once. No blur, no bounce, no stagger longer than two items.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Never linear for UI, never spring.
- Reduced motion: no scroll-linked motion, no fades. The keyboard is shown in its final pose.
- Animate `transform` and `opacity` only.

## Copy

- Short, plain sentences. Active voice. No marketing voice.
- No eyebrow labels above headings. No section numbers. No "chapter" language.
- No em-dashes or en-dashes in visible copy. Use a full stop, a comma or a colon.
- No spec ornaments: no coordinates, no figure numbers, no timestamps, no "placeholder" text on the page.
- Placeholder names (credits, vendors) read `To be confirmed` or `[NAME]` in the data, not on the design.

## Banned

- Eyebrows, section numbers, chapter labels, progress numerals.
- Spec sheets styled as decoration: keylines, FIG labels, dimension callouts, code lists.
- Em-dashes and en-dashes in visible copy.
- Pills, capsules, rounded containers, cards with shadows, double bezels.
- Monospace, serif display, letter-spaced all-caps body text.
- Neon, red glows (except the hidden words of the manuscript), gradient text, glassmorphism, blurred backdrops.
- Decorative runes, skulls, pentagrams, borders made of runes.
- Dashed borders, corner brackets, HUD framing.
- A second accent colour.
- Glitch effects, jump-scares, blood effects.
