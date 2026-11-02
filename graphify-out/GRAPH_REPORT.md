# Graph Report - cvltsmprivate  (2026-11-02)

## Corpus Check
- 159 files · ~439,954 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: .css 8, .otf 4, (none) 1)

## Summary
- 1270 nodes · 2658 edges · 79 communities (70 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d8df4924`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mix
- assets.mjs
- sigil/js/main.js
- createGame
- draw.mjs
- field/engine.js
- route.ts
- wheat-field/js/main.js
- 6. Recipes
- charts.js
- Topo.tsx
- inspect.mjs
- package.json
- app-draw.mjs
- Station.tsx
- Imagery
- app/page.tsx
- load.mjs
- Engravings.tsx
- compilerOptions
- The run
- layout.tsx
- The study
- Daub.tsx
- Page
- Nav.tsx
- lint.mjs
- react
- Layout
- make-brand.mjs
- Colour
- scenes.mjs
- make-loader.py
- CVLTSM: design
- App screens
- Scroll scenes
- Tells — the dated registry
- Type
- Terminal.tsx
- Stage
- 7. Tables and lists
- Words
- sigil/package.json
- CVLTSM
- 2. The run for an app screen
- Critique — judging the render
- rules.mjs
- Film.tsx
- ref_node_fs
- cdp.mjs
- tasteskill v2 (`design-taste-frontend`)
- Station
- app.json
- 9. Type and colour
- kinds
- 3. The shell
- 4. The canvas and the page title
- 6. Charts
- Archived: the pixel wood
- builder
- commerce
- community
- creator
- devtools
- finance
- markets
- report
- smb-admin
- support
- wallet
- workspace
- 8. Forms and settings
- encode-film.sh
- vercel.json
- eslint.config.mjs
- encode-audio.sh

## God Nodes (most connected - your core abstractions)
1. `mix()` - 52 edges
2. `px()` - 37 edges
3. `rect()` - 36 edges
4. `line()` - 36 edges
5. `clamp()` - 33 edges
6. `getOne()` - 31 edges
7. `fillPoly()` - 24 edges
8. `buildPath()` - 24 edges
9. `makeRng()` - 23 edges
10. `search()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `2. Margins and the grid` --references--> `clamp()`  [INFERRED]
  .agents/skills/design-taste-frontend/references/layout.md → archive/pixel-wood/js/lib/paint.js
- `2. The scale: few sizes, far apart` --references--> `clamp()`  [INFERRED]
  .agents/skills/design-taste-frontend/references/type.md → archive/pixel-wood/js/lib/paint.js
- `10. Markup and credits` --references--> `height()`  [INFERRED]
  .agents/skills/design-taste-frontend/references/imagery.md → components/station/Topo.tsx
- `8. Reduced motion and performance` --references--> `height()`  [INFERRED]
  .agents/skills/design-taste-frontend/references/motion.md → components/station/Topo.tsx
- `3. Filling it` --references--> `height()`  [INFERRED]
  .agents/skills/design-taste-frontend/references/scenes.md → components/station/Topo.tsx

## Import Cycles
- None detected.

## Communities (79 total, 9 thin omitted)

### Community 0 - "mix"
Cohesion: 0.07
Nodes (121): createEngine(), build(), drawLayer(), frame(), onResize(), onVisibility(), resize(), TILE (+113 more)

### Community 1 - "assets.mjs"
Cohesion: 0.07
Nodes (85): AIC_FIELDS, AIC_HEADERS, applyThumb(), ARCHIVE_LICENCE, args, argv, base(), clock() (+77 more)

### Community 2 - "sigil/js/main.js"
Cohesion: 0.06
Nodes (45): emit(), log, newSessionId(), ring, bootStarted, client, motionQuery, showStill() (+37 more)

### Community 3 - "createGame"
Cohesion: 0.07
Nodes (29): createGame(), STATE, emit(), log, newSessionId(), ring, bootStarted, client (+21 more)

### Community 4 - "draw.mjs"
Cohesion: 0.10
Nodes (41): adjustments(), argv, assetQueries(), ASSETS_PATH, briefStop(), briefWords(), deal(), dealHero() (+33 more)

### Community 5 - "field/engine.js"
Cohesion: 0.13
Nodes (35): hexToRgb(), litAmount(), mix(), rgbToHex(), buildEffigy(), buildEmbers(), drawEmbers(), createField() (+27 more)

### Community 6 - "route.ts"
Cohesion: 0.11
Nodes (36): dynamic, json(), listing(), POST(), slow(), askArchive(), ASKS_PER_HOUR, context() (+28 more)

### Community 7 - "wheat-field/js/main.js"
Cohesion: 0.10
Nodes (25): emit(), log, newSessionId(), ring, bootStarted, client, field, motionQuery (+17 more)

### Community 8 - "6. Recipes"
Cohesion: 0.06
Nodes (30): 10. Rules for motion, 1. The budget, 2. What strong pages do with motion, 3. Four questions before any animation, 4. Tokens, 5. Scroll behaviours, ranked, 6. Recipes, 7. Signature moves (+22 more)

### Community 9 - "charts.js"
Cohesion: 0.21
Nodes (24): axes(), bars(), dayHeads(), diverging(), frame(), hits(), kindStyle(), lane() (+16 more)

### Community 10 - "Topo.tsx"
Cohesion: 0.11
Nodes (27): 10. Markup and credits, 8. Reduced motion and performance, 3. Filling it, Survey(), bearing(), contour(), deg(), distToStream() (+19 more)

### Community 11 - "inspect.mjs"
Cohesion: 0.09
Nodes (18): allow, appMode, args, asJson, dealtFonts, fails, film, HEIGHT (+10 more)

### Community 12 - "package.json"
Cohesion: 0.10
Nodes (25): dependencies, @neondatabase/serverless@^1.2.0, next@^16.4.3, react@^19.3.0, react-dom@^19.3.0, description, devDependencies, @types/node@^22.20.5 (+17 more)

### Community 13 - "app-draw.mjs"
Cohesion: 0.12
Nodes (22): argv, deal(), dealScreen(), dealShell(), dealStyle(), fontLink(), HERE, kebab() (+14 more)

### Community 14 - "Station.tsx"
Cohesion: 0.13
Nodes (23): ASKED, FUTHARK, Result, Runes(), STONE_7, Tune(), CARRIER, Clock() (+15 more)

### Community 15 - "Imagery"
Cohesion: 0.09
Nodes (21): 11. Video, 12. Where pictures and footage go, 1. What the study measured, 2. Decide what imagery exists, 3. Real pictures from the open collections, 4. The dealt photographs, 5. Cropping and placing, 6. Treatment (+13 more)

### Community 16 - "app/page.tsx"
Cohesion: 0.18
Nodes (9): metadata, Page(), site, metadata, Privacy(), BloodDefs(), Hero(), Lightbox() (+1 more)

### Community 17 - "load.mjs"
Cohesion: 0.11
Nodes (13): allErrors, booted, boots, BUDGET, { chromium }, errors, failures, fpsAll (+5 more)

### Community 18 - "Engravings.tsx"
Cohesion: 0.17
Nodes (13): Engravings(), files, Place, PLACES, Section, WHOLE, KitsSection(), RendersSection() (+5 more)

### Community 19 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 20 - "The run"
Cohesion: 0.11
Nodes (17): 10. Report, 1. Read the brief and the project, 2. Write the argument, 3. Draw the direction, 4. Find the idea, 5. Write the words, 6. Build it, still, 7. Gate (+9 more)

### Community 21 - "layout.tsx"
Cohesion: 0.19
Nodes (12): metadata, RootLayout(), viewport, Loader(), PATHS, SRC, VIEW, SiteOnly() (+4 more)

### Community 22 - "The study"
Cohesion: 0.12
Nodes (15): 10. The 25 highest-scored sites and their ideas, 11. How the skill was tested, 12. The October 2026 study: 100 Sites of the Day, 13. The app-screen study, 1. Method and its limits, 2. Scores, 3. Where the idea comes from, 4. Headlines (+7 more)

### Community 23 - "Daub.tsx"
Cohesion: 0.23
Nodes (11): Blood(), Common, DaubLink(), DRIPS, Footer(), maskOf(), tear(), tears() (+3 more)

### Community 24 - "Page"
Cohesion: 0.25
Nodes (3): Browser, Page, sleep()

### Community 25 - "Nav.tsx"
Cohesion: 0.27
Nodes (10): BUMPS, FillDefs(), FillLink(), ease(), Glide, placeOf(), stop(), Home() (+2 more)

### Community 26 - "lint.mjs"
Cohesion: 0.14
Nodes (13): APP_LEVEL, appMode, args, asJson, byId, EXT, files, findings (+5 more)

### Community 27 - "react"
Cohesion: 0.29
Nodes (9): ColourSection(), DripWatch(), Ooze(), plan(), random(), COLOURS, dripShapes(), oozeFilter() (+1 more)

### Community 28 - "Layout"
Cohesion: 0.15
Nodes (12): 10. How pages fail, 1. What strong pages do, 2. Margins and the grid, 3. Where text sits, 4. Empty space, 5. The frame: margins, balance and titles, 6. Sections: carry the idea, vary the arrangement, 7. Navigation (+4 more)

### Community 29 - "make-brand.mjs"
Cohesion: 0.15
Nodes (5): C, head, sizes, WORD, px

### Community 30 - "Colour"
Cohesion: 0.17
Nodes (11): 1. What the study measured, 2. The roles, 3. Proportion, 4. Surfaces without lines or shadows, 5. Colour fields, 6. Dark pages, 7. Colour and photographs, 8. Contrast (+3 more)

### Community 31 - "scenes.mjs"
Cohesion: 0.21
Nodes (9): args, go(), only, outDir, problems, rel(), run(), sheet() (+1 more)

### Community 33 - "CVLTSM: design"
Cohesion: 0.17
Nodes (11): Colour, CVLTSM: design, Layout, Motion, Outlines and engravings, Phones, Rules, Sound (+3 more)

### Community 34 - "App screens"
Cohesion: 0.18
Nodes (10): 10. Density, 11. Empty, zero, loading and error states, 12. The phone, 13. House rules for app screens, 14. Tells of generated dashboards, 1. When this applies, 5. KPIs, App screens (+2 more)

### Community 35 - "Scroll scenes"
Cohesion: 0.18
Nodes (10): 1. What a scene is, 2. Putting a scene on a page, 4. Fitting it to the page, 5. The phone, reduced motion, no script, 6. Checking it, 7. Rules for scenes, 8. When no scene in the library fits, 9. The catalogue (+2 more)

### Community 36 - "Tells — the dated registry"
Cohesion: 0.18
Nodes (10): 1. First wave (2023–2024), 2. Second wave (2025), 3. Third wave (2025–2026): the "fix" that became the look, 4. Gallery fashion, banned as house style, 5. Structural tells, 6. Copy tells, 7. Motion tells, 8. Why removal is not enough (+2 more)

### Community 37 - "Type"
Cohesion: 0.18
Nodes (10): 1. What the study measured, 2. The scale: few sizes, far apart, 3. Setting display type, 4. Setting text, 5. Loading the fonts properly, 6. One family or two, 7. Details that separate set type from typed text, 8. Mistakes the inspector cannot see (+2 more)

### Community 38 - "Terminal.tsx"
Cohesion: 0.29
Nodes (9): CLEARANCE, getSession(), Listing, SEALED, station(), Block, COMMANDS, Terminal() (+1 more)

### Community 40 - "7. Tables and lists"
Cohesion: 0.20
Nodes (10): 7.1 Rows, 7.2 Header, 7.3 Dividers, 7.4 Figures and alignment, 7.5 Ink inside rows, 7.6 Status pills, 7.7 Media, 7.8 Actions and paging (+2 more)

### Community 41 - "Words"
Cohesion: 0.20
Nodes (9): 1. Write the argument first, 2. The two-line headline, 3. Headline shapes that work, 4. Supporting line, body, buttons, 5. Proof without inventing it, 6. Things that read as generated, 7. Micro-typography, Contents (+1 more)

### Community 42 - "sigil/package.json"
Cohesion: 0.20
Nodes (9): description, name, private, scripts, lint, start, test:load, type (+1 more)

### Community 43 - "CVLTSM"
Cohesion: 0.20
Nodes (9): Archive, CVLTSM, Motion and accessibility, Replacing things, Sound, The film, The hidden station (/svartskog), What has not been measured (+1 more)

### Community 44 - "2. The run for an app screen"
Cohesion: 0.22
Nodes (9): 2.1 Inventory the data and the jobs, 2.2 Name the screen's one question, 2.3 Choose a style, 2.4 Build the shell, 2.5 Put in the data, 2.6 Build the states, 2.7 The check, 2.8 Report (+1 more)

### Community 45 - "Critique — judging the render"
Cohesion: 0.22
Nodes (8): 1. How to look, 2. The score, 3. Caps, 4. Writing the critique, 5. What to fix first, 6. When to stop, Contents, Critique — judging the render

### Community 46 - "rules.mjs"
Cohesion: 0.31
Nodes (8): APP_SKIP, colourFamily(), hexToHsl(), inRange(), judge(), judgeApp(), judgeLayout(), RULE_IDS

### Community 47 - "Film.tsx"
Cohesion: 0.42
Nodes (7): Film(), Clip, clipSrc(), DISSOLVE, FILM, Format, posterSrc()

### Community 48 - "ref_node_fs"
Cohesion: 0.39
Nodes (6): files, f(), loop(), r(), rand(), side()

### Community 49 - "cdp.mjs"
Cohesion: 0.32
Nodes (3): alive(), findChrome(), sweepProfiles()

### Community 50 - "tasteskill v2 (`design-taste-frontend`)"
Cohesion: 0.29
Nodes (6): Contents, How it works, Install, Notes, Requirements, tasteskill v2 (`design-taste-frontend`)

### Community 51 - "Station"
Cohesion: 0.38
Nodes (5): metadata, Page(), setSession(), Gate(), Station()

### Community 52 - "app.json"
Cohesion: 0.33
Nodes (5): about, patterns, shells, styles, version

### Community 53 - "9. Type and colour"
Cohesion: 0.33
Nodes (6): 9.1 Type, 9.2 Colour on light screens, 9.3 Colour on dark screens, 9.4 Surfaces, radius, icons, spacing, 9.5 Default tokens, 9. Type and colour

### Community 54 - "kinds"
Cohesion: 0.40
Nodes (5): note, screens, styles, kinds, analytics

### Community 55 - "3. The shell"
Cohesion: 0.40
Nodes (5): 3.1 Five archetypes, 3.2 Sidebar, 3.3 Top bar, 3.4 Right rail and pinned columns, 3. The shell

### Community 56 - "4. The canvas and the page title"
Cohesion: 0.40
Nodes (5): 4.1 Width and gutters, 4.2 One left edge, one right edge, 4.3 The title, 4.4 Tabs, filters and the date range, 4. The canvas and the page title

### Community 57 - "6. Charts"
Cohesion: 0.40
Nodes (5): 6.1 Which chart for which question, 6.2 One question, one series, 6.3 Axes and gridlines, 6.4 Marks, 6. Charts

### Community 58 - "Archived: the pixel wood"
Cohesion: 0.40
Nodes (4): Archived: the pixel wood, Running it, The things worth remembering, What is in here

### Community 59 - "builder"
Cohesion: 0.50
Nodes (4): note, screens, styles, builder

### Community 60 - "commerce"
Cohesion: 0.50
Nodes (4): note, screens, styles, commerce

### Community 61 - "community"
Cohesion: 0.50
Nodes (4): note, screens, styles, community

### Community 62 - "creator"
Cohesion: 0.50
Nodes (4): note, screens, styles, creator

### Community 63 - "devtools"
Cohesion: 0.50
Nodes (4): note, screens, styles, devtools

### Community 64 - "finance"
Cohesion: 0.50
Nodes (4): note, screens, styles, finance

### Community 65 - "markets"
Cohesion: 0.50
Nodes (4): markets, note, screens, styles

### Community 66 - "report"
Cohesion: 0.50
Nodes (4): report, note, screens, styles

### Community 67 - "smb-admin"
Cohesion: 0.50
Nodes (4): smb-admin, note, screens, styles

### Community 68 - "support"
Cohesion: 0.50
Nodes (4): support, note, screens, styles

### Community 69 - "wallet"
Cohesion: 0.50
Nodes (4): wallet, note, screens, styles

### Community 70 - "workspace"
Cohesion: 0.50
Nodes (4): workspace, note, screens, styles

### Community 71 - "8. Forms and settings"
Cohesion: 0.50
Nodes (4): 8.1 Fields, 8.2 Settings layout, 8.3 Buttons, 8. Forms and settings

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `Terminal.tsx`, `Topo.tsx`, `package.json`, `Station.tsx`, `Film.tsx`, `app/page.tsx`, `Engravings.tsx`, `layout.tsx`, `Daub.tsx`, `Nav.tsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `clamp()` (e.g. with `2. Margins and the grid` and `2. The scale: few sizes, far apart`) actually correct?**
  _`clamp()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `mix` be split into smaller, more focused modules?**
  _Cohesion score 0.07009919697685404 - nodes in this community are weakly interconnected._
- **Why does `Browser` connect `Page` to `cdp.mjs`, `inspect.mjs`, `scenes.mjs`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `assets.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.06648426812585499 - nodes in this community are weakly interconnected._
- **Should `sigil/js/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.062146892655367235 - nodes in this community are weakly interconnected._
- **Should `createGame` be split into smaller, more focused modules?**
  _Cohesion score 0.07030527289546716 - nodes in this community are weakly interconnected._