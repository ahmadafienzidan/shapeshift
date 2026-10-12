import { decodeImage, type OutputType } from "./image";

export type MergeOptions = {
	direction: "vertical" | "horizontal";
	gap: number;
	background: string | null;
	sameSize: boolean;
	type: OutputType;
	quality: number;
};

// Browsers refuse to create canvases beyond these limits (Safari is the
// strictest on total area), so oversized results are scaled down to fit.
const MAX_SIDE = 16384;
const MAX_AREA = 64_000_000;

export async function mergeImages(
	files: File[],
	options: MergeOptions,
): Promise<Blob> {
	const bitmaps = await Promise.all(files.map((file) => decodeImage(file)));
	const vertical = options.direction === "vertical";

	// With "same size", every image is scaled to the widest (vertical) or
	// tallest (horizontal) one so the edges line up.
	const crossSize = Math.max(
		...bitmaps.map((bitmap) => (vertical ? bitmap.width : bitmap.height)),
	);
	const sizes = bitmaps.map((bitmap) => {
		if (!options.sameSize)
			return { width: bitmap.width, height: bitmap.height };
		const scale = crossSize / (vertical ? bitmap.width : bitmap.height);
		return {
			width: bitmap.width * scale,
			height: bitmap.height * scale,
		};
	});

	const gaps = options.gap * (bitmaps.length - 1);
	const fullWidth = vertical
		? Math.max(...sizes.map((size) => size.width))
		: sizes.reduce((sum, size) => sum + size.width, 0) + gaps;
	const fullHeight = vertical
		? sizes.reduce((sum, size) => sum + size.height, 0) + gaps
		: Math.max(...sizes.map((size) => size.height));

	const fit = Math.min(
		1,
		MAX_SIDE / Math.max(fullWidth, fullHeight),
		Math.sqrt(MAX_AREA / (fullWidth * fullHeight)),
	);
	const width = Math.round(fullWidth * fit);
	const height = Math.round(fullHeight * fit);

	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	const background =
		options.background ?? (options.type === "image/jpeg" ? "#ffffff" : null);
	if (background) {
		context.fillStyle = background;
		context.fillRect(0, 0, width, height);
	}
	context.imageSmoothingQuality = "high";

	let offset = 0;
	bitmaps.forEach((bitmap, index) => {
		const size = sizes[index] ?? { width: 0, height: 0 };
		const drawWidth = size.width * fit;
		const drawHeight = size.height * fit;
		// Images narrower (or shorter) than the strip are centred across it.
		const x = vertical ? (width - drawWidth) / 2 : offset;
		const y = vertical ? offset : (height - drawHeight) / 2;
		context.drawImage(bitmap, x, y, drawWidth, drawHeight);
		offset += (vertical ? drawHeight : drawWidth) + options.gap * fit;
		bitmap.close();
	});

	return canvas.convertToBlob({ type: options.type, quality: options.quality });
}
