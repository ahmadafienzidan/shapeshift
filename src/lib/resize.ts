import { decodeImage, encodeImage, type OutputType } from "./image";

export type Fit = "cover" | "blur" | "color";

export type ResizeOptions = {
	width: number;
	height: number;
	fit: Fit;
	focus: number;
	background: string;
};

type Source = ImageBitmap | OffscreenCanvas;

function drawScaled(
	context: OffscreenCanvasRenderingContext2D,
	source: Source,
	width: number,
	height: number,
	scale: number,
	focus: number,
) {
	const drawWidth = source.width * scale;
	const drawHeight = source.height * scale;
	context.drawImage(
		source,
		(width - drawWidth) * focus,
		(height - drawHeight) * focus,
		drawWidth,
		drawHeight,
	);
}

function coverScale(source: Source, width: number, height: number) {
	return Math.max(width / source.width, height / source.height);
}

// Downscaling to a few pixels and smoothing back up blurs without relying on
// `context.filter`, which Safari does not support on canvases.
function blurredCover(source: Source, width: number, height: number) {
	let current: Source = source;
	for (const divisor of [32, 4, 1]) {
		const canvas = new OffscreenCanvas(
			Math.max(1, Math.round(width / divisor)),
			Math.max(1, Math.round(height / divisor)),
		);
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Canvas 2D context is unavailable");
		context.imageSmoothingQuality = "high";
		drawScaled(
			context,
			current,
			canvas.width,
			canvas.height,
			coverScale(current, canvas.width, canvas.height),
			0.5,
		);
		current = canvas;
	}
	return current;
}

export async function resizeImage(
	file: File,
	options: ResizeOptions,
	type: OutputType,
	quality: number,
): Promise<Blob> {
	const { width, height } = options;
	const source = await decodeImage(file);
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	context.imageSmoothingQuality = "high";

	if (options.fit === "cover") {
		drawScaled(
			context,
			source,
			width,
			height,
			coverScale(source, width, height),
			options.focus,
		);
	} else {
		if (options.fit === "blur") {
			context.drawImage(blurredCover(source, width, height), 0, 0);
			context.fillStyle = "rgb(0 0 0 / 0.15)";
		} else {
			context.fillStyle = options.background;
		}
		context.fillRect(0, 0, width, height);
		drawScaled(
			context,
			source,
			width,
			height,
			Math.min(width / source.width, height / source.height),
			0.5,
		);
	}

	source.close();
	return encodeImage(await createImageBitmap(canvas), type, quality);
}
