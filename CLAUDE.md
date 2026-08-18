# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`nicobako.com` — a personal portfolio site for Nico Bako (software engineer, Python focus), built with **Astro 6** as a static site. No backend, no client-side framework, no database. The site has a home page, a games section with a playable browser game, and a music section with interactive tools (metronome, drone, violin scale fingerings).

## Commands

Requires Node `>=22.12.0`.

- `npm run dev` — local dev server at `localhost:4321` (hot reload)
- `npm run build` — production build to `./dist/`
- `npm run preview` — serve the built `./dist/` locally
- `npm run check` — TypeScript / Astro type checking via `astro check` (the only automated correctness gate; no test framework or linter configured)

`tsconfig.json` extends `astro/tsconfigs/strict`.

## Architecture

### Rendering chain

- `src/layouts/Layout.astro` — the HTML document shell. Accepts `title` and `description` props (with defaults). Composes `Header` + `Footer`, exposes `<slot />` for page content. Owns **all global CSS** via `<style is:global>`, including the design-token `:root` custom properties and their `prefers-color-scheme: dark` overrides.
- `src/pages/*.astro` — each file is a route. Pages import `Layout` and pass content into its slot. Data-driven sections (e.g., focus cards, stack tags on the home page) are defined as arrays in the page's frontmatter `---` block and mapped to markup — edit the arrays to change content rather than duplicating markup.
- `src/components/` — shared UI pieces. `Header.astro` drives the primary navigation (nav links are an array in its frontmatter). `Footer.astro` renders the copyright line. `SimpleLink.astro` and `Link.astro` are small link primitives.

### How pages are built

This is a static site: nothing runs on a server, and a `---` block runs once, at build
time. Four rules keep pages declarative — they are the house style, and reversing any
of them should be a deliberate decision:

1. **Markup is written as markup.** Never build HTML by concatenating strings and
   injecting it with `set:html` or `innerHTML`. Logic modules under `src/` return
   *data* (arrays, records); `.astro` templates map that data to elements. Where the
   browser genuinely has to re-render, it builds nodes with `document.createElement`,
   as `speed-reading.astro` does.
2. **Prefer a static component over a control.** The default answer to "the user might
   want this a bit different" is a component with props plus a short, hand-picked list
   of presets — not a panel of sliders. Pick the handful of variants that are actually
   worth printing or using, name them, and generate a page for each. A knob is only
   worth its weight when the useful values are genuinely continuous and personal
   (there is no sensible preset), and even then it must not be the thing that decides
   what the page contains.
3. **Variation that is purely visual belongs in CSS.** Prefer setting a CSS custom
   property over rebuilding DOM. `SheetMusic.astro` resolves every dimension in its
   `---` block and passes them down as five custom properties, so the CSS stays
   readable while the values are plain build-time constants.
4. **Variation that changes content belongs in a route.** A control that picks between
   a known, finite set of contents should be links to pre-rendered pages, not client
   rendering. The calendars use `[year].astro` + `getStaticPaths()` and the sheet music
   uses `[sheet].astro`, which is why they ship no rendering code at all. The default
   variant keeps the bare path (`/printables/blank-sheet-music`) so existing links
   resolve; the rest hang off it, and the picker is rows of links — one row per axis,
   each swapping its own axis and keeping the rest.

Client `<script>` is for what only the browser can do: audio, timing, persistence,
font measurement, `window.print()`. Selection state that CSS can express — the circle
of fifths uses `:target` — should not become JavaScript.

Every generated variant is a real page that the service worker precaches, so the list
of presets trades directly against install size. Keep it short and deliberate.

### Pages

| Route | File |
|---|---|
| `/` | `src/pages/index.astro` |
| `/games/`, `/games/classrooms-and-angry-teachers` | `src/pages/games/` |
| `/music/`, `/music/metronome`, `/music/drone`, `/music/abc-editor`, `/music/circle-of-fifths`, `/music/violin-3-octave-fingerings` | `src/pages/music/` |
| `/timers/`, `/timers/{timer,stopwatch,pomodoro,interval,meditation}` | `src/pages/timers/` |
| `/printables/`, and the sheets listed below | `src/pages/printables/` |
| `/offline` | `src/pages/offline.astro` |

Printables: `blank-sheet-music`, `speed-reading`, `scribal-abbreviations`,
`weekly-time-tracker`, `daily-practice-schedule`, `weekly-practice-schedule`, plus
`year-calendar` and `bookmark-calendar`, which each also generate a page per year
(`year-calendar/[year].astro`). `src/printables/calendar/years.ts` sets that range —
widening it multiplies real, precached pages, so keep it small. `blank-sheet-music`
works the same way, over two axes: `SIZES` × `PAGE_COUNTS` in `staff-paper.ts` is
expanded into `SHEETS`, and `blank-sheet-music/[sheet].astro` generates a page for
each (`compact`, `compact-2-pages`, …).

### Game subsystem

`src/games/classrooms-and-angry-teachers/` holds an entirely client-side game built with [Kaplay](https://kaplayjs.com/):

- `level.ts` — pure data: grid constants, tile types, spawn positions, item definitions.
- `game.ts` — Kaplay initialisation and all game logic (immediate-mode rendering, per-frame update loop, input handling). Mounted into the `#game-root` div on the game page via a `<script>` import; Kaplay runs with `global: false` so it doesn't pollute the surrounding site.

### Music subsystem

`src/music/` mirrors the game subsystem pattern — pure TypeScript logic modules imported by their Astro pages via `<script>`:

- `src/music/metronome/metronome.ts` — `Metronome` class using the Web Audio API scheduler (look-ahead scheduling with `setInterval`). Accepts a `skipPercent` to randomly drop beats. Mounted by `metronome.astro`.
- `src/music/drone/drone.ts` — `Drone` class and `NOTES` array (one octave C4–C5). Supports one-shot `pluck()` and sustained `startNote`/`stopNote`. Mounted by `drone.astro`, which also computes piano key layout in its frontmatter. The piano key colours are hardcoded (not CSS tokens) because the visual realism requires fixed white/black key colours regardless of theme.
- `src/music/violin/scales.ts` — the Carl Flesch fingering tables. Reference data only; `violin-3-octave-fingerings.astro` is a pure template over it.
- `src/music/circle-of-fifths/circle.ts` — the twelve keys plus the wheel's SVG geometry, all resolved at build time into `SEGMENTS`. The page maps that to static SVG and ships **no** JavaScript: each wedge is an `<a href="#key-N">` and the matching panel is revealed by `:target`.

### Printables subsystem

`src/printables/` holds the same kind of DOM-free logic modules, returning data rather than markup:

- `staff-paper/staff-paper.ts` — staff geometry maths plus the two preset axes: `SIZES` (four staff sizes) and `PAGE_COUNTS` (`1`, and `2` for printing double-sided onto one sheet of paper). `SHEETS` is their cross product, so the page count is a variant like any other rather than a stepper. A size is declared as "this many staves, this rastral size"; the gap between staves is *derived* so the staves fill the printable area exactly, which is what lets a preset be one line of data. Rendered by `components/SheetMusic.astro` (pure props, no state) with `components/SheetMusicPicker.astro` as two rows of links — each row swaps one axis and keeps the other. This page used to expose six sliders and rebuild itself in the browser; it is now eight static pages and the only script left is `window.print()`. Adding a size means adding an entry to `SIZES`, which costs one page per page count.
- `calendar/calendar.ts` — ISO-8601 week maths and the grid/row builders; `calendar/years.ts` decides which years get pages. Rendered by `components/YearGrid.astro` and `components/BookmarkTable.astro`.
- `speed-reading/speed-reading.ts` — line wrapping and column dealing. The one page that must re-render in the browser: where a line breaks depends on the reader's actual font metrics, so the build uses `estimateWidth` for first paint and the browser re-runs the layout with canvas measurements.

### PWA subsystem

The site is an installable, offline-capable PWA. No PWA library is used —
`@vite-pwa/astro` only supports Astro ≤ 5 — so the three pieces are hand-rolled:

- `public/manifest.webmanifest` — name, colours, icons, and app shortcuts. Its
  `theme_color`/`background_color` must be the **light** theme values, since a
  manifest can only carry one of each (the per-scheme `<meta name="theme-color">`
  tags in `Layout.astro` still handle the browser UI).
- `src/pwa/service-worker.js` — the service worker source. It is *not* bundled by
  Astro; `__CACHE_NAME__` and `__PRECACHE_MANIFEST__` are placeholders.
- `src/pwa/integration.mjs` — an Astro integration (registered in
  `astro.config.mjs`) that runs on `astro:build:done`, walks `dist/`, fills in
  those two placeholders, and writes `dist/sw.js`. The cache name is a hash of
  every built file, so each build installs a fresh cache and the `activate`
  handler deletes the previous one.
- `src/pwa/register.ts` — registration, imported by `Layout.astro`. Guarded by
  `import.meta.env.PROD`, because `sw.js` only exists in a build. Test the PWA
  with `npm run build && npm run preview`, never with `npm run dev`.

The whole site (~1.8 MB) is precached, so every page works offline after the
first visit. Caching is network-first for navigations, cache-first for hashed
`/_astro/` assets, and stale-while-revalidate for everything else same-origin.
A navigation to a page that was never cached falls back to `src/pages/offline.astro`.

Icons in `public/icons/` are PNG renders of `public/icon.svg` (rounded, for
`purpose: any`) and `public/icon-maskable.svg` (full-bleed, glyph inside the 80%
safe zone). Edit the SVG sources and re-render the PNGs if the mark changes.

### Theming conventions

- All colours are CSS custom properties defined in `Layout.astro` (e.g. `--bg`, `--text`, `--muted`, `--border`, `--surface`, `--accent`, `--accent-text`), with `prefers-color-scheme: dark` overrides. Never hardcode colours in page or component files — consume the tokens.
- `--measure: 46rem` is the shared max-width used by header, main, and footer.
- Styles in page and component files are Astro-scoped by default; only `Layout.astro`'s `<style is:global>` affects the whole document.
