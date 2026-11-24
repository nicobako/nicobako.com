# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## The one rule

**The words on this site are Nico's. Never write or rewrite them.**

Not a blog post, not an About paragraph, not a section blurb, not a `description`
prop, not a tagline. Helping means the frame around the words: the schema, the
pages, the layout, the styling, and — where he asks for one — an empty skeleton
to fill in.

This site was cut from 646 pages to 29 precisely because it had filled up with
prose nobody wrote. If a change would add a sentence a visitor reads, don't; add
the markup and leave the sentence to Nico. Code comments are the exception —
they explain how things work and they should stay thorough.

The second rule follows from the first: **a page has to earn its keep.** The test
is whether Nico opens it. Not whether it is clever, not whether it generates
nicely from a table. Anything a visitor would sooner ask their own AI to make for
them does not belong here.

## What this is

`nicobako.com` — Nico Bako's personal site, built with **Astro 6** as a static
site. No backend, no client-side framework, no database. A home page, violin
practice tools, a few timers, and two printables. There is no page *about* Nico
and no blog: what a visitor can infer from the things he made is as much as the
site says about him, and that is deliberate — see "What isn't here".

## Commands

Requires Node `>=22.12.0`.

- `npm run dev` — local dev server at `localhost:4321` (hot reload)
- `npm run build` — production build to `./dist/`
- `npm run preview` — serve the built `./dist/` locally
- `npm run check` — TypeScript / Astro type checking via `astro check` (the only automated correctness gate; no test framework or linter configured)

`tsconfig.json` extends `astro/tsconfigs/strict`.

## Pages

| Route | File |
|---|---|
| `/` | `src/pages/index.astro` |
| `/music/`, `/music/{metronome,drone,vibrato,ear-training,etude-builder,abc-editor}`, `/music/presets/` and a page per family | `src/pages/music/` |
| `/timers/`, `/timers/{timer,stopwatch,pomodoro,interval,meditation}` | `src/pages/timers/` |
| `/printables/`, `/printables/bookmark-calendar` (+ a page per year), `/printables/sketchbook` | `src/pages/printables/` |
| `/offline` | `src/pages/offline.astro` |

29 pages. Keep it that way: every page is precached by the service worker, so a
new one costs install size as well as attention.

## Architecture

### Rendering chain

- `src/layouts/Layout.astro` — the HTML document shell. Accepts `title` and `description` props (with defaults). Composes `Header` + `Footer`, exposes `<slot />` for page content. Owns **all global CSS** via `<style is:global>`, including the design-token `:root` custom properties and their `prefers-color-scheme: dark` overrides.
- `src/pages/*.astro` — each file is a route. Pages import `Layout` and pass content into its slot.
- `src/site/navigation.ts` — the site's map of itself: `SECTIONS` (the list on the home page) and the path-label table a breadcrumb trail is written from. Both live here because a section's name in the list and its name in a trail are otherwise the same fact said twice. Neither carries a blurb — see the one rule. The home page styles `SECTIONS` as full-width menu rows (hairline between each, an arrow on the right), not cards, because a one-word label in a card reads as a card someone forgot to finish.
- `src/components/` — shared UI pieces. `Header.astro` is the brand and a Share menu, and nothing else — **no section links and no off-site links**: the home page's list is the way into the site, and the breadcrumb every page carries is the way back out. The Share menu (Share…, Copy link, Print) is on every page because an installed PWA has no browser toolbar to do any of the three; Share… only appears where `navigator.share` exists. It is the only print, share or copy-link control on the site. `Footer.astro` renders the copyright line and the site's **one** link off itself, to GitHub — a pointer to the code fits in a line, so it does not need a page. `SimpleLink.astro` and `Link.astro` are small link primitives.

### Breadcrumbs

Every page but the home page carries one, and **no page passes its own trail**:
`Layout.astro` derives it from `Astro.url.pathname` through `breadcrumbTrail`,
so a new page cannot forget one and two pages cannot disagree about what a
section is called. The trail is the ancestors only, Home first — a breadcrumb is
the way *out* of where you are, so it doesn't repeat the page you are on.

A label comes from `PATH_LABELS` in `src/site/navigation.ts`, and otherwise from
`titleize` of the segment. Only paths with pages *under* them can ever appear, so
that table is the site's directories and nothing else. A generated segment that
no table can name is passed in as `crumbLabels`; nothing needs that today.

### How pages are built

This is a static site: nothing runs on a server, and a `---` block runs once, at build
time. Four rules keep pages declarative — they are the house style, and reversing any
of them should be a deliberate decision:

1. **Markup is written as markup.** Never build HTML by concatenating strings and
   injecting it with `set:html` or `innerHTML`. Logic modules under `src/` return
   *data* (arrays, records); `.astro` templates map that data to elements. Where the
   browser genuinely has to re-render, it builds nodes with `document.createElement`.
2. **Prefer a static component over a control.** The default answer to "the user might
   want this a bit different" is a component with props plus a short, hand-picked list
   of presets — not a panel of sliders.
3. **Variation that is purely visual belongs in CSS.** Prefer setting a CSS custom
   property over rebuilding DOM.
4. **Variation that changes content belongs in a route.** A control that picks between
   a known, finite set of contents should be links to pre-rendered pages, not client
   rendering — as the bookmark calendar's `[year].astro` + `getStaticPaths()` does.

Client `<script>` is for what only the browser can do: audio, timing, persistence,
font measurement, `window.print()`.

Rule 4 cuts both ways. Generating a page per variant is cheap to write and
expensive to own: this is how the site ended up with 418 etude pages and a
74-page planner. Generate a route only when a reader would actually open each one.

### What isn't here

The site carries **no page about Nico and no blog**, and both were removed on
purpose after being built. The reasoning, so it isn't re-litigated or quietly
undone:

- A visitor can infer plenty from the tools, the etude presets and the
  printables, and that is the amount Nico wants to say. Someone who wants to
  know him can look around.
- Being explicit about biography or opinions is a commitment he isn't making
  right now. "Not yet" is the state, not "forgotten".

So: do not add an About, Now, Uses, Contact or Links page, do not add a blog or
a feed, and do not put biography, a location, a job history or an opinion into
any page's prose — not in a section index, not in a `description` prop. If a
change would tell a visitor something about Nico rather than give them something
to use, it belongs to him to decide, and the answer today is no.

Removed with it: `src/blog/`, `src/content.config.ts`, `src/content/`,
`/rss.xml`, the `<link rel="alternate">` in `Layout.astro`, the feed item in the
Share menu, and the `@astrojs/rss` and `zod` dependencies. Git history has all
of it (`cae2bfb` and before) if any of it comes back.

### Music subsystem

`src/music/` holds pure TypeScript logic modules imported by their Astro pages via `<script>`:

- `metronome/metronome.ts` — `Metronome`, a Web Audio scheduler (look-ahead scheduling with `setInterval`). Accepts a `skipPercent` to randomly drop beats.
- `drone/drone.ts` — `Drone` and `NOTES` (one octave C4–C5), one-shot `pluck()` and sustained `startNote`/`stopNote`. `drone.astro` computes the piano key layout in its frontmatter. The key colours are hardcoded, not CSS tokens, because white and black keys have to stay white and black in either theme.
- `vibrato/vibrato.ts` — `Vibrato`, a sustained tone whose pitch swings *below* the note and back up to it, plus the `SPEEDS` and `WIDTHS` preset tables. The note is the ceiling of the swing rather than its centre, which is what vibrato actually is, so the modulation is two nodes and not one: a sine LFO scaled to half the width plus a constant offset of *minus* half the width, summed into `detune` so the swing lands in `[-width, 0]` cents. Width is in cents because a finger's travel is a distance: it means the same thing on every note. Settings live in the query string.
- `ear-training/ear-training.ts` — derives the twenty-four keys from a tonic letter plus an accidental plus a mode (so a key is three values, not seven spellings), and returns the note pool for the selected octaves and the I–IV–V–I cadence that fixes the key. A key is described as all twelve semitones above its tonic, each marked diatonic or not, which is what lets the accidentals be a filter over one table rather than a second table. These tables are the only ones under `src/music/` that also reach the browser rather than resolving at build time, because the reader changes key while listening. Only *text* is rebuilt — the twelve answer buttons are markup, and both the solfège/letter choice and whether accidentals are in play are attributes (`data-labels`, `data-accidentals`) that CSS reads. Auto-play schedules each part from the length of the one before it, which the synth reports, so `setTimeout` only ever waits out silence. It answers by ear — `answerRun` climbs the notes in play from the tonic up to the question — and holds a screen wake lock while it runs.
- `synth.ts` — `ToneSynth`, single notes, chords and melodies placed on the audio clock rather than held by hand the way `Drone` is. Used by the ear trainer.
- `abc-track/abc-track.ts` — mounting logic for `components/AbcTrack.astro`, one self-contained tune: SVG notation plus abcjs's playback widget. Its only props are `abcText`, `transposition` and `audio`, because everything else abcjs understands is said in the ABC source itself. The source travels to the browser as data attributes and the component's `<script>` (hoisted and bundled once per page) hands it to abcjs. `transposition` shifts notation *and* playback: abcjs reads `visualTranspose` as a transposing-instrument offset and subtracts it back out of the MIDI, so the synth gets a matching `midiTranspose`. Playback fetches soundfonts from abcjs's CDN at first Play, so it is the one part of the site that needs the network even though the page itself is precached.
- `abc-editor/` — the ABC editor page's logic and its `localStorage` persistence.
- `abc-pitch.ts` / `abc-key.ts` — `abcPitch` writes the letter and octave marks for a note *n* letters above written middle C; `TONIC_SPELLINGS` mirrors abcjs's own unconfigurable key-signature spellings.

#### Etudes

`src/music/etudes/` is now **data for the etude builder**, not a page generator.
The 418 pre-generated etude pages are gone; what survives is the model, and Nico
intends to extend the presets.

- `scale.ts` — the seven diatonic modes, as **rotations** of one parent scale rather than sets of intervals over a fixed tonic: the mode decides which letter degree 1 sits on (Ionian C, Dorian D, Aeolian A), so every unaltered degree is a white key, the tune is always written `K:C`, and there is no table of semitone offsets or key signatures per mode. `KEYS` resolves all 7 × 12 keys at build time, and each label comes from the *parent major* at that offset so the page and the staff can never disagree.
- `etude.ts` — what an etude *is*, and the generator that turns one into ABC. Notes, rhythm and bowing cycle independently and the tune runs until they realign (`cycleLength`), which is the whole premise: five notes against a rhythm of three against a bowing of two do not repeat for thirty notes. A **finger is part of its note**, written after it — `3.2` is degree 3, second finger. The notes are spelled for a phone keyboard: digits, letters, `.` and `,` only — `u`/`d` after a degree for an octave up or down, `s`/`b` in front for sharp or flat, `,` to join a double stop (`1.1,3.3`). Parsing is case-insensitive, since a phone capitalises the first letter of a field. `fromLegacyNotes` respells the old `1'`/`7,`/`1+3` syntax so bookmarked builder links still open. The **key** is a transposition handed to abcjs and picks a pitch *class* only; the **root octave** is the register the music is written in — keeping those apart is what lets changing the key never move the octave. The **articulation** cycles with the other axes, and is optional. A token that is a *word* may carry a trailing repeat count (`q14 h`), unambiguous because a rhythm letter is not a number; each count is capped at `MAX_NOTES` where it is read. A *leading* `3` on a rhythm token makes a triplet, expanded at parse time into one slot per note so nothing downstream knows about tuplets. A slot carries the duration it is *written* at and, separately, the time it *takes*, counted in thirds of a unit so a triplet member's two-thirds stays a whole number. `defineEtude` fills every default. The clef is one token on the key line and nothing more: in ABC a letter names an absolute pitch whatever clef is in force, which is the entire viola and cello story.
- `presets/` — the named constants, one module per family (`notes`, `rhythms`, `bowings`, `articulations`, `instruments`), plus `families.ts` listing them so `/music/presets/` and `presets/[family].astro` are maps over data. An `Instrument` is violin, viola or cello: a clef, a default root octave, and the open strings. **Fingerings are not a family**: a finger only means something against a particular note, so it is written on the note. `articulations.ts` is two layers because **a symbol cannot name a bow stroke** — a dot is staccato on the string, spiccato off it or sautillé faster still — so each `Technique` declares the decoration drawn on every note *and* the short instruction written once above the run. `ARTICULATIONS` on top of those is the named patterns *of* technique codes, the first of them empty, because an unmarked etude is the normal case.

Each preset carries a `description`. **Those descriptions are AI-written and
Nico has not replaced them yet** — they are the one body of prose still on the
site that isn't his. When he adds presets, he writes their descriptions; don't
write them for him, and don't backfill the existing ones.

### Printables subsystem

- `calendar/calendar.ts` — ISO-8601 week maths and the row builders; `calendar/years.ts` decides which years get pages (one back, three forward — each is a real precached page, so keep the range small). Rendered by `components/BookmarkTable.astro` and `BookmarkSheet.astro`, with `YearPicker.astro` as a pair of links.
- `booklet/mini-zine.ts` — the eight-page mini zine: one side of a landscape US Letter sheet, folded into a 2 × 4 grid with one slit along the middle crease, and collapsed into a booklet with no staples. It declares only the page layout (which page is in which panel, and which are upside down); the folds, the cut and each fold's direction are *derived*, because the paper is a single ring running through the pages in reading order — neighbouring panels are joined exactly when their pages are consecutive, a leaf folds printing-out, a spread folds printing-in. The module throws, failing the build, if a layout cannot form that ring.

  `components/MiniZine.astro` is the sheet: eight named slots, `page-1` to `page-8`, in reading order and written the right way up; it places them (through `MiniZinePanel.astro`), turns over the upside-down ones, numbers the inside pages and draws the cut. `MiniZineSteps.astro` is the screen-only folding instructions. What goes in the slots comes from `components/paper/`: `Page`, `CoverTitle`, `Heading`, `Blank`, `Box` and `Grid` (dots or squares, drawn as an SVG pattern because CSS background hairlines drop out of print). They are sized in `em` — the sheet sets a panel's font size to a tenth of a printed inch. Astro only accepts static slot names, which is why the eight panels are written out rather than mapped.

  Only one booklet survives, `/printables/sketchbook`. Its drawing prompts are
  AI-written placeholder content; they are Nico's to replace.

### Timers subsystem

`src/timers/` holds the clocks behind `/timers/*`; `shared/countdown.ts` is the
pause-safe `Countdown` every timer but the stopwatch runs on. It keeps an end-time
timeout next to its 200 ms tick, because a hidden tab may run a repeating tick only
once a minute, and the finish is what the notification hangs on.

`shared/notify.ts` — the system notification sent when a timer finishes (and, for
the Pomodoro and interval timers, when each phase or interval does). They are
written to read on a **watch**: Android mirrors them to a paired Fitbit as the
title then the body, on a screen a few words wide with no glyphs for most emoji,
so a title is two or three words, a body one short sentence, and there are no
emoji. They go through the service worker's `showNotification`, because Android
Chrome throws on `new Notification()`; one tag per page with `renotify`, so a new
one replaces the last and still buzzes. Permission is asked on Start (it needs a
user gesture), a skipped phase sends nothing, and `components/TimerNotifications.astro`
is the one line under each timer saying whether notifications are on. The service
worker's `notificationclick` focuses the timer's tab.

### PWA subsystem

The site is an installable, offline-capable PWA. No PWA library is used —
`@vite-pwa/astro` only supports Astro ≤ 5 — so the three pieces are hand-rolled:

- `public/manifest.webmanifest` — name, colours, icons, and app shortcuts. Its
  `theme_color`/`background_color` must be the **light** theme values, since a
  manifest can only carry one of each (the per-scheme `<meta name="theme-color">`
  tags in `Layout.astro` still handle the browser UI). Audit `shortcuts` whenever
  a route is removed.
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

The whole site is precached (73 files, ~1.4 MB), so every page works offline after
the first visit. `npm run build` prints the file count; check it when adding pages.
Caching is network-first for navigations, cache-first for hashed `/_astro/` assets,
and stale-while-revalidate for everything else same-origin. A navigation to a page
that was never cached falls back to `src/pages/offline.astro`.

Icons in `public/icons/` are PNG renders of `public/icon.svg` (rounded, for
`purpose: any`) and `public/icon-maskable.svg` (full-bleed, glyph inside the 80%
safe zone). Edit the SVG sources and re-render the PNGs if the mark changes.

### Theming conventions

- All colours are CSS custom properties defined in `Layout.astro` (e.g. `--bg`, `--text`, `--muted`, `--border`, `--surface`, `--accent`, `--accent-text`), with `prefers-color-scheme: dark` overrides. Never hardcode colours in page or component files — consume the tokens.
- `--measure: 46rem` is the shared max-width used by header, main, and footer.
- Styles in page and component files are Astro-scoped by default; only `Layout.astro`'s `<style is:global>` affects the whole document.
- `build.inlineStylesheets: 'never'` in `astro.config.mjs` keeps stylesheets as shared, hashed files in `/_astro/` instead of inlining them. This mattered far more at 646 pages than at 29, but one cached stylesheet is still cheaper than a copy per page.
