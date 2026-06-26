# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`nicobako.com` — a personal portfolio site for Nico Bako (software engineer, Python focus), built with **Astro 6** as a static site. No backend, no client-side framework, no database. The site has multiple pages: a home page, a games index, individual game pages, and a music placeholder.

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

### Pages

| Route | File |
|---|---|
| `/` | `src/pages/index.astro` |
| `/games/` | `src/pages/games/index.astro` |
| `/games/classrooms-and-angry-teachers` | `src/pages/games/classrooms-and-angry-teachers.astro` |
| `/music/` | `src/pages/music/index.astro` |

### Game subsystem

`src/games/classrooms-and-angry-teachers/` holds an entirely client-side game built with [Kaplay](https://kaplayjs.com/):

- `level.ts` — pure data: grid constants, tile types, spawn positions, item definitions.
- `game.ts` — Kaplay initialisation and all game logic (immediate-mode rendering, per-frame update loop, input handling). Mounted into the `#game-root` div on the game page via a `<script>` import; Kaplay runs with `global: false` so it doesn't pollute the surrounding site.

### Theming conventions

- All colours are CSS custom properties defined in `Layout.astro` (e.g. `--bg`, `--text`, `--muted`, `--border`, `--surface`, `--accent`, `--accent-text`), with `prefers-color-scheme: dark` overrides. Never hardcode colours in page or component files — consume the tokens.
- `--measure: 46rem` is the shared max-width used by header, main, and footer.
- Styles in page and component files are Astro-scoped by default; only `Layout.astro`'s `<style is:global>` affects the whole document.
