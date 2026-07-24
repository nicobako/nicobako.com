/// <reference lib="webworker" />

/**
 * Service worker source. This file is never bundled by Astro — the build
 * integration in `src/pwa/integration.mjs` reads it, substitutes the two
 * placeholders below with the real build output, and writes the result to
 * `dist/sw.js`.
 *
 * Caching strategy:
 *   - navigations   → network first, falling back to the precached page, then
 *                     to the offline page. Keeps HTML fresh, still works offline.
 *   - /_astro/*     → cache first. Those filenames contain a content hash, so a
 *                     cached copy can never be stale.
 *   - everything    → stale while revalidate. Instant response, refreshed in the
 *     else on origin   background (favicon, manifest, icons, …).
 *
 * Cross-origin requests are left alone entirely.
 */

// `self` is typed as a Window by the ambient DOM lib; this is what it really is.
const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

const CACHE_NAME = '__CACHE_NAME__';
/** @type {string[]} */
const PRECACHE_URLS = __PRECACHE_MANIFEST__;
const OFFLINE_URL = '/offline/';

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const names = await caches.keys();
			await Promise.all(
				names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
			);
			await sw.clients.claim();
		})(),
	);
});

// The page asks the waiting worker to take over as soon as a new build is
// installed, so an update lands on the next navigation instead of waiting for
// every tab to close.
sw.addEventListener('message', (event) => {
	if (event.data === 'SKIP_WAITING') {
		sw.skipWaiting();
	}
});

sw.addEventListener('fetch', (event) => {
	const request = event.request;

	// Range requests (media seeking) and anything that isn't a plain same-origin
	// GET go straight to the network.
	if (request.method !== 'GET' || request.headers.has('range')) return;

	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	if (request.mode === 'navigate') {
		event.respondWith(networkFirst(request));
		return;
	}

	if (url.pathname.startsWith('/_astro/')) {
		event.respondWith(cacheFirst(request));
		return;
	}

	event.respondWith(staleWhileRevalidate(request));
});

/**
 * Fresh HTML when online; the precached copy of the page — or the offline
 * page — when not.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
	const cache = await caches.open(CACHE_NAME);
	try {
		const response = await fetch(request);
		if (response.ok) cache.put(request, response.clone());
		return response;
	} catch (error) {
		const cached = await matchDocument(cache, new URL(request.url));
		if (cached) return cached;

		const offline = await cache.match(OFFLINE_URL);
		if (offline) return offline;

		throw error;
	}
}

/**
 * A page can be precached under a slightly different URL than the one the
 * browser navigates to (`/music/drone` vs `/music/drone/`), so try the
 * equivalent forms before giving up.
 * @param {Cache} cache
 * @param {URL} url
 * @returns {Promise<Response | undefined>}
 */
async function matchDocument(cache, url) {
	const pathname = url.pathname;
	const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
	const candidates = [pathname, withSlash, `${withSlash}index.html`];

	for (const candidate of candidates) {
		const response = await cache.match(candidate, { ignoreSearch: true });
		if (response) return response;
	}

	return undefined;
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function cacheFirst(request) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request, { ignoreSearch: true });
	if (cached) return cached;

	const response = await fetch(request);
	if (response.ok) cache.put(request, response.clone());
	return response;
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function staleWhileRevalidate(request) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request, { ignoreSearch: true });

	const network = fetch(request)
		.then((response) => {
			if (response.ok) cache.put(request, response.clone());
			return response;
		})
		.catch(() => undefined);

	const response = cached ?? (await network);
	if (response) return response;

	return Response.error();
}
