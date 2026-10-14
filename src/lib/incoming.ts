// Must match public/share-target.js.
const SHARE_CACHE = "shared-files";

let incoming: File[] = [];

// Files picked on the Open page wait here until the chosen tool's dropzone
// mounts and takes them.
export function handOff(files: File[]) {
	incoming = files;
}

export function takeIncoming(matches: (file: File) => boolean): File[] {
	const files = incoming.filter(matches);
	if (files.length > 0) incoming = [];
	return files;
}

let shared: Promise<File[]> | undefined;

// The service worker stores shared files in a cache and redirects here, so
// they are read once per page load.
export function takeSharedFiles(): Promise<File[]> {
	shared ??= (async () => {
		const cache = await caches.open(SHARE_CACHE);
		const files = await Promise.all(
			(await cache.keys()).map(async (request) => {
				const response = await cache.match(request);
				if (!response) throw new Error(`Missing shared file ${request.url}`);
				const blob = await response.blob();
				const name = decodeURIComponent(request.url.split("/").pop() as string);
				return new File([blob], name, { type: blob.type });
			}),
		);
		await caches.delete(SHARE_CACHE);
		return files;
	})();
	return shared;
}
