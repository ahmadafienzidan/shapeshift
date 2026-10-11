const MIME_EXTENSIONS: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/svg+xml": "svg",
	"image/x-icon": "ico",
	"application/pdf": "pdf",
	"application/json": "json",
	"application/zip": "zip",
	"text/plain": "txt",
	"text/html": "html",
	"text/css": "css",
	"text/csv": "csv",
	"font/woff2": "woff2",
	"audio/mpeg": "mp3",
	"video/mp4": "mp4",
};

export function extensionFor(mime: string): string {
	return MIME_EXTENSIONS[mime] ?? "bin";
}

export function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	// String.fromCharCode takes its arguments on the stack, so large inputs
	// are converted in chunks to avoid "Maximum call stack size exceeded".
	for (let index = 0; index < bytes.length; index += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
	}
	return btoa(binary);
}

export function base64ToBytes(input: string): Uint8Array {
	const normalized = input
		.replace(/\s+/g, "")
		.replace(/-/g, "+")
		.replace(/_/g, "/");
	const padded = normalized.padEnd(
		normalized.length + ((4 - (normalized.length % 4)) % 4),
		"=",
	);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index++) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

export function toUrlSafe(base64: string): string {
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function encodeText(text: string, urlSafe: boolean): string {
	const base64 = bytesToBase64(new TextEncoder().encode(text));
	return urlSafe ? toUrlSafe(base64) : base64;
}

export function decodeText(base64: string): string {
	return new TextDecoder("utf-8", { fatal: true }).decode(
		base64ToBytes(base64),
	);
}

export async function fileToBase64(
	file: File,
	asDataUri: boolean,
): Promise<string> {
	const base64 = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
	if (!asDataUri) return base64;
	return `data:${file.type || "application/octet-stream"};base64,${base64}`;
}

export function parseBase64Input(input: string): {
	mime?: string;
	bytes: Uint8Array;
} {
	const match = input.trim().match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.*)$/s);
	if (match) {
		return { mime: match[1], bytes: base64ToBytes(match[2] ?? "") };
	}
	return { bytes: base64ToBytes(input) };
}
