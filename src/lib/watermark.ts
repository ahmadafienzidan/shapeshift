import { decodeImage, encodeImage, type OutputType } from "./image";

export type Position =
	| "top-left"
	| "top"
	| "top-right"
	| "left"
	| "center"
	| "right"
	| "bottom-left"
	| "bottom"
	| "bottom-right"
	| "tile";

export type WatermarkOptions = {
	text: string;
	logo?: ImageBitmap;
	color: string;
	// Size of the stamp as a fraction of the image width.
	size: number;
	opacity: number;
	position: Position;
};

// Where the stamp sits, as fractions of the free space (0 = start, 1 = end).
const ANCHORS: Record<Exclude<Position, "tile">, [number, number]> = {
	"top-left": [0, 0],
	top: [0.5, 0],
	"top-right": [1, 0],
	left: [0, 0.5],
	center: [0.5, 0.5],
	right: [1, 0.5],
	"bottom-left": [0, 1],
	bottom: [0.5, 1],
	"bottom-right": [1, 1],
};

export const POSITIONS = [...Object.keys(ANCHORS), "tile"] as Position[];

function textStamp(
	text: string,
	color: string,
	width: number,
): OffscreenCanvas {
	const measure = new OffscreenCanvas(1, 1).getContext("2d");
	if (!measure) throw new Error("Canvas 2D context is unavailable");
	// Font size is chosen so the text spans the requested width.
	measure.font = '700 100px "Inter Variable", sans-serif';
	const fontSize = Math.max(
		8,
		(100 * width) / Math.max(1, measure.measureText(text).width),
	);
	const font = `700 ${fontSize}px "Inter Variable", sans-serif`;
	measure.font = font;
	const padding = fontSize * 0.3;
	const canvas = new OffscreenCanvas(
		Math.ceil(measure.measureText(text).width + padding * 2),
		Math.ceil(fontSize * 1.4 + padding * 2),
	);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	context.font = font;
	context.textBaseline = "middle";
	// A soft shadow keeps light text readable on light photos and vice versa.
	context.shadowColor = "rgba(0, 0, 0, 0.35)";
	context.shadowBlur = fontSize * 0.08;
	context.fillStyle = color;
	context.fillText(text, padding, canvas.height / 2);
	return canvas;
}

function logoStamp(logo: ImageBitmap, width: number): OffscreenCanvas {
	const height = (width * logo.height) / logo.width;
	const canvas = new OffscreenCanvas(
		Math.max(1, Math.round(width)),
		Math.max(1, Math.round(height)),
	);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	context.imageSmoothingQuality = "high";
	context.drawImage(logo, 0, 0, canvas.width, canvas.height);
	return canvas;
}

// Draws `source` and the stamp over the whole of `context`'s canvas. Sizes are
// relative to the canvas, so small previews match the full-size output.
export function drawWatermark(
	context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	source: ImageBitmap,
	options: WatermarkOptions,
) {
	const { width, height } = context.canvas;
	context.save();
	context.clearRect(0, 0, width, height);
	context.imageSmoothingQuality = "high";
	context.drawImage(source, 0, 0, width, height);

	const stampWidth = width * options.size;
	const stamp = options.logo
		? logoStamp(options.logo, stampWidth)
		: textStamp(options.text, options.color, stampWidth);
	const margin = Math.min(width, height) * 0.03;

	context.globalAlpha = options.opacity;
	if (options.position === "tile") {
		// Rotated rows, offset like bricks, covering the image corner to corner.
		const stepX = stamp.width * 1.6;
		const stepY = stamp.height * 3;
		const diagonal = Math.hypot(width, height);
		context.translate(width / 2, height / 2);
		context.rotate(-Math.PI / 6);
		for (let y = -diagonal / 2, row = 0; y < diagonal / 2; y += stepY, row++) {
			const offset = row % 2 === 0 ? 0 : stepX / 2;
			for (let x = -diagonal / 2 - offset; x < diagonal / 2; x += stepX) {
				context.drawImage(stamp, x, y);
			}
		}
	} else {
		const [anchorX, anchorY] = ANCHORS[options.position];
		context.drawImage(
			stamp,
			margin + anchorX * (width - stamp.width - margin * 2),
			margin + anchorY * (height - stamp.height - margin * 2),
		);
	}
	context.restore();
}

export async function watermarkImage(
	file: File,
	options: WatermarkOptions,
	type: OutputType,
	quality: number,
): Promise<Blob> {
	const source = await decodeImage(file);
	const canvas = new OffscreenCanvas(source.width, source.height);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	drawWatermark(context, source, options);
	source.close();
	return encodeImage(await createImageBitmap(canvas), type, quality);
}
