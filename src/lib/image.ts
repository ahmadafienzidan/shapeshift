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
];

export function isHeic(file: File): boolean {
	return (
		/\.(heic|heif)$/i.test(file.name) || /^image\/hei[cf]$/.test(file.type)
	);
}

export function isImage(file: File): boolean {
	return file.type.startsWith("image/") || isHeic(file);
}

export async function decodeImage(file: File): Promise<ImageBitmap> {
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
	formats: "HEIC, WEBP, AVIF, PNG, JPG, GIF, BMP",
};
