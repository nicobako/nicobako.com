// @ts-check
import { defineConfig } from 'astro/config';
import pwa from './src/pwa/integration.mjs';

// https://astro.build/config
export default defineConfig({
	integrations: [pwa()],
	// Astro's default inlines any stylesheet under 4 KB, which put a byte-identical
	// copy of Layout's global CSS (5.7 KB) into all 562 pages. Extracting it instead
	// cuts the built HTML from 9.01 to 7.22 MB — the generated etude and printable
	// variants are most of the page count, so a shared, cached stylesheet is worth
	// the extra request far more here than on a site with a handful of pages.
	build: { inlineStylesheets: 'never' },
});
