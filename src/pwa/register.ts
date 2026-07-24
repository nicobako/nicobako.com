// Registers the service worker emitted by the build (see integration.mjs).
// There is no `sw.js` during `astro dev`, so registration only happens in
// production builds — run `npm run build && npm run preview` to exercise it.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
	window.addEventListener('load', async () => {
		try {
			const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

			// When a new build installs alongside an existing controller, let it
			// take over right away. Pages already open keep the assets they
			// loaded; the next navigation gets the new build.
			registration.addEventListener('updatefound', () => {
				const installing = registration.installing;
				if (!installing) return;

				installing.addEventListener('statechange', () => {
					if (installing.state === 'installed' && navigator.serviceWorker.controller) {
						installing.postMessage('SKIP_WAITING');
					}
				});
			});
		} catch (error) {
			console.error('Service worker registration failed', error);
		}
	});
}
