// @ts-check
import { defineConfig } from 'astro/config';
import pwa from './src/pwa/integration.mjs';

// https://astro.build/config
export default defineConfig({
	integrations: [pwa()],
});
