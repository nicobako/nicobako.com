# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`nicobako.com` — a single-page personal profile site for Nico Bako (software engineer, Python focus), built with **Astro 6** as a static site. No backend, no client-side framework, no database.

## Commands

Requires Node `>=22.12.0`.

- `npm run dev` — local dev server at `localhost:4321` (hot reload)
- `npm run build` — production build to `./dist/`
- `npm run preview` — serve the built `./dist/` locally
- `npm run check` — TypeScript / Astro type checking via `astro check` (there is no separate lint or test setup)

Type checking is powered by the `@astrojs/check` and `typescript` dev dependencies; `tsconfig.json` extends `astro/tsconfigs/strict`. There is no test framework, linter, or CI configured. Type checking via `npm run check` is the only automated correctness gate.

## Architecture

The page renders through a three-file chain:

1. `src/pages/index.astro` — the only route. Composes `Layout` + `Welcome`; holds no content itself.
2. `src/layouts/Layout.astro` — the HTML document shell. Owns `<head>` (SEO meta, Open Graph/Twitter tags, canonical URL, Inter font from Google Fonts) and **all global CSS**, including the design-token `:root` custom properties and their `prefers-color-scheme: dark` overrides. `title`/`description` are props with defaults.
3. `src/components/Welcome.astro` — the actual page content and its own scoped `<style>`.

### Conventions that matter here

- **Theming is entirely CSS custom properties** defined in `Layout.astro` (`--accent`, `--surface`, `--text`, etc.), with light/dark variants. Components style themselves by consuming these vars — do not hardcode colors in `Welcome.astro`; add or reuse a token in `Layout.astro` instead.
- **Content is data-driven.** The `focus` cards and `stack` tag list are arrays in the `Welcome.astro` frontmatter (`---` block). Edit those arrays to change the page's content rather than duplicating markup. Card icons are selected by an `icon` string keyed to inline SVGs in the template.
- Styles in `Welcome.astro` are scoped (Astro default); only `Layout.astro`'s `<style is:global>` leaks to the whole document.

Note: `README.md` is still the stock Astro starter README and does not describe this project.
