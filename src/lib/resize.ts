import { decodeImage, encodeImage, type OutputType } from "./image";

export type Fit = "cover" | "blur" | "color";

export type ResizeOptions = {
	fit: Fit;
	focus: number;
	background: string;
};

type Source = ImageBitmap | OffscreenCanvas;

type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function drawScaled(
	context: Context,
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

// Draws `source` into the whole of `context`'s canvas, so the same code
// renders the small live previews and the full-size output.
export function drawResized(
	context: Context,
	source: ImageBitmap,
	options: ResizeOptions,
) {
	const { width, height } = context.canvas;
	context.imageSmoothingQuality = "high";
	context.clearRect(0, 0, width, height);

	if (options.fit === "cover") {
		drawScaled(
			context,
			source,
			width,
			height,
			coverScale(source, width, height),
			options.focus,
		);
		return;
	}
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

export async function resizeImage(
	file: File,
	width: number,
	height: number,
	options: ResizeOptions,
	type: OutputType,
	quality: number,
): Promise<Blob> {
	const source = await decodeImage(file);
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	drawResized(context, source, options);
	source.close();
	return encodeImage(await createImageBitmap(canvas), type, quality);
}
