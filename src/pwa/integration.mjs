// @ts-check
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SW_SOURCE = new URL('./service-worker.js', import.meta.url);

/** Files in `dist/` that must never end up inside the precache. */
const EXCLUDED = new Set(['sw.js', '_headers', '_redirects', 'robots.txt', 'sitemap-index.xml']);

/**
 * Astro integration that emits `dist/sw.js`: the service worker in
 * `service-worker.js` with a precache manifest of every file the build
 * produced, plus a cache name derived from those files' contents (so a new
 * build always installs a fresh cache and drops the old one).
 *
 * @returns {import('astro').AstroIntegration}
 */
export default function pwa() {
	return {
		name: 'nicobako-pwa',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				const outDir = fileURLToPath(dir);
				const files = (await walk(outDir)).sort();

				const urls = [];
				const hash = createHash('sha256');

				for (const file of files) {
					if (EXCLUDED.has(file)) continue;

					urls.push(toUrl(file));
					hash.update(file);
					hash.update(await readFile(path.join(outDir, file)));
				}

				const template = await readFile(SW_SOURCE, 'utf8');
				const serviceWorker = template
					.replace('__CACHE_NAME__', `nicobako-${hash.digest('hex').slice(0, 8)}`)
					.replace('__PRECACHE_MANIFEST__', JSON.stringify(urls, null, '\t'));

				await writeFile(path.join(outDir, 'sw.js'), serviceWorker);
				logger.info(`sw.js written — precaching ${urls.length} files`);
			},
		},
	};
}

/**
 * Every file under `dir`, as paths relative to it and using forward slashes.
 *
 * @param {string} dir
 * @param {string} [prefix]
 * @returns {Promise<string[]>}
 */
async function walk(dir, prefix = '') {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			files.push(...(await walk(path.join(dir, entry.name), relative)));
		} else {
			files.push(relative);
		}
	}

	return files;
}

/**
 * The URL a built file is actually requested under. Astro's directory build
 * format means `music/drone/index.html` is served as `/music/drone/`, and
 * caching it under that URL is what lets a navigation match it offline.
 *
 * @param {string} file
 * @returns {string}
 */
function toUrl(file) {
	if (file === 'index.html') return '/';
	if (file.endsWith('/index.html')) return `/${file.slice(0, -'index.html'.length)}`;
	return `/${file}`;
}
