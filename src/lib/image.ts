export type OutputType = "image/jpeg" | "image/png" | "image/webp";

export const EXTENSIONS: Record<OutputType, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export const ACCEPTED_IMAGES = [
	"image/*",
	".heic",
	".heif",
	".avif",
	".webp",
	".bmp",
	".gif",
	".svg",
];

export function isHeic(file: File): boolean {
	return (
		/\.(heic|heif)$/i.test(file.name) || /^image\/hei[cf]$/.test(file.type)
	);
}

export function isSvg(file: File): boolean {
	return /.svg$/i.test(file.name) || file.type === "image/svg+xml";
}

export function isImage(file: File): boolean {
	return file.type.startsWith("image/") || isHeic(file);
}

// SVG has no fixed pixel size, so it is rasterized at its own size, scaled up
// to `minSize` on the longest side when that is larger (e.g. for crisp icons).
async function rasterizeSvg(file: File, minSize: number): Promise<ImageBitmap> {
	const url = URL.createObjectURL(file);
	try {
		const image = new Image();
		image.src = url;
		await image.decode();
		const width = image.naturalWidth || 1024;
		const height = image.naturalHeight || 1024;
		const scale = Math.max(1, minSize / Math.max(width, height));
		const canvas = new OffscreenCanvas(
			Math.round(width * scale),
			Math.round(height * scale),
		);
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Canvas 2D context is unavailable");
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		return createImageBitmap(canvas);
	} finally {
		URL.revokeObjectURL(url);
	}
}

export async function decodeImage(
	file: File,
	minSize = 0,
): Promise<ImageBitmap> {
	if (isSvg(file)) return rasterizeSvg(file, minSize);
	if (isHeic(file)) {
		const { heicTo } = await import("heic-to");
		return heicTo({ blob: file, type: "bitmap" });
	}
	return createImageBitmap(file);
}

export async function encodeImage(
	bitmap: ImageBitmap,
	type: OutputType,
	quality: number,
	maxDimension?: number,
): Promise<Blob> {
	const scale = maxDimension
		? Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
		: 1;
	const width = Math.round(bitmap.width * scale);
	const height = Math.round(bitmap.height * scale);
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");

	// JPEG has no alpha channel; transparent pixels would otherwise turn black.
	if (type === "image/jpeg") {
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, width, height);
	}
	context.imageSmoothingQuality = "high";
	context.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();
	return canvas.convertToBlob({ type, quality });
}

export function renameExtension(name: string, type: OutputType): string {
	const base = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
	return `${base}.${EXTENSIONS[type]}`;
}

export const IMAGE_KIND = {
	accept: ACCEPTED_IMAGES,
	matches: isImage,
	formats: "HEIC, WEBP, AVIF, PNG, JPG, GIF, BMP, SVG",
};

const ENCODABLE: OutputType[] = ["image/jpeg", "image/png", "image/webp"];

// "original" keeps the file's own format when the browser can write it, and
// otherwise falls back to PNG for SVG (to keep transparency) or JPG.
export function resolveFormat(
	file: File,
	format: OutputType | "original",
): OutputType {
	if (format !== "original") return format;
	const same = ENCODABLE.find((type) => type === file.type);
	if (same) return same;
	return isSvg(file) ? "image/png" : "image/jpeg";
}
