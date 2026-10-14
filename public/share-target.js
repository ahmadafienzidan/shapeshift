// Imported by the generated service worker. A static host can't accept the
// share sheet's POST, so the shared files are kept in a cache (read by
// src/lib/incoming.ts) and the app is opened on its Open page instead.
const SHARE_CACHE = "shared-files";

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const scope = self.registration.scope;
	if (request.method !== "POST" || request.url !== `${scope}share`) return;
	event.respondWith(
		(async () => {
			const data = await request.formData();
			await caches.delete(SHARE_CACHE);
			const cache = await caches.open(SHARE_CACHE);
			await Promise.all(
				data
					.getAll("files")
					.map((file, index) =>
						cache.put(
							`${scope}shared/${index}/${encodeURIComponent(file.name)}`,
							new Response(file, { headers: { "Content-Type": file.type } }),
						),
					),
			);
			return Response.redirect(`${scope}open?shared`, 303);
		})(),
	);
});
