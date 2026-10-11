import {
	createMD5,
	createSHA1,
	createSHA256,
	createSHA512,
	type IHasher,
} from "hash-wasm";

export type Algorithm = "md5" | "sha1" | "sha256" | "sha512";

export const ALGORITHMS: { id: Algorithm; label: string }[] = [
	{ id: "md5", label: "MD5" },
	{ id: "sha1", label: "SHA-1" },
	{ id: "sha256", label: "SHA-256" },
	{ id: "sha512", label: "SHA-512" },
];

const CREATE: Record<Algorithm, () => Promise<IHasher>> = {
	md5: createMD5,
	sha1: createSHA1,
	sha256: createSHA256,
	sha512: createSHA512,
};

// Files are streamed through every hasher at once, so a multi-gigabyte ISO
// never has to fit in memory and is only read from disk a single time.
export async function hashFile(
	file: File,
	algorithms: Algorithm[],
	onProgress: (fraction: number) => void,
): Promise<Partial<Record<Algorithm, string>>> {
	const hashers = await Promise.all(
		algorithms.map(async (algorithm) => {
			const hasher = await CREATE[algorithm]();
			hasher.init();
			return [algorithm, hasher] as const;
		}),
	);

	const reader = file.stream().getReader();
	let read = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		for (const [, hasher] of hashers) hasher.update(value);
		read += value.length;
		onProgress(file.size === 0 ? 1 : read / file.size);
	}

	return Object.fromEntries(
		hashers.map(([algorithm, hasher]) => [algorithm, hasher.digest("hex")]),
	);
}

export function normalizeHash(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/^.*?([0-9a-f]{32,128}).*$/s, "$1");
}
