import { decodeImage } from "./image";

export type Signature = { blob: Blob; url: string; aspect: number };

// Crops a canvas to the bounding box of its visible pixels, plus a margin, so
// the signature has no empty space around it when placed on a page.
async function trimToInk(
	source: HTMLCanvasElement | OffscreenCanvas,
): Promise<Signature> {
	const context = source.getContext("2d") as
		| CanvasRenderingContext2D
		| OffscreenCanvasRenderingContext2D
		| null;
	if (!context) throw new Error("Canvas 2D context is unavailable");
	const { width, height } = source;
	const pixels = context.getImageData(0, 0, width, height).data;
	let top = height;
	let left = width;
	let right = -1;
	let bottom = -1;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if ((pixels[(y * width + x) * 4 + 3] ?? 0) > 16) {
				if (x < left) left = x;
				if (x > right) right = x;
				if (y < top) top = y;
				if (y > bottom) bottom = y;
			}
		}
	}
	if (right < 0) throw new Error("sign.error.empty");

	const margin = 8;
	const cropWidth = right - left + 1 + margin * 2;
	const cropHeight = bottom - top + 1 + margin * 2;
	const output = new OffscreenCanvas(cropWidth, cropHeight);
	output
		.getContext("2d")
		?.drawImage(
			source,
			left - margin,
			top - margin,
			cropWidth,
			cropHeight,
			0,
			0,
			cropWidth,
			cropHeight,
		);
	const blob = await output.convertToBlob({ type: "image/png" });
	return {
		blob,
		url: URL.createObjectURL(blob),
		aspect: cropWidth / cropHeight,
	};
}

export function signatureFromCanvas(canvas: HTMLCanvasElement) {
	return trimToInk(canvas);
}

export async function signatureFromText(
	text: string,
	color: string,
): Promise<Signature> {
	const font = '700 120px "Dancing Script"';
	await document.fonts.load(font, text);
	const measure = new OffscreenCanvas(1, 1).getContext("2d");
	if (!measure) throw new Error("Canvas 2D context is unavailable");
	measure.font = font;
	const width = Math.ceil(measure.measureText(text).width) + 80;
	const canvas = new OffscreenCanvas(width, 220);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	context.font = font;
	context.fillStyle = color;
	context.textBaseline = "middle";
	context.fillText(text, 40, 110);
	return trimToInk(canvas);
}

export async function signatureFromImage(
	file: File,
	removeWhite: boolean,
): Promise<Signature> {
	const bitmap = await decodeImage(file);
	const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
	const canvas = new OffscreenCanvas(
		Math.round(bitmap.width * scale),
		Math.round(bitmap.height * scale),
	);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	if (removeWhite) {
		const image = context.getImageData(0, 0, canvas.width, canvas.height);
		const data = image.data;
		for (let index = 0; index < data.length; index += 4) {
			const lightness = Math.min(
				data[index] ?? 0,
				data[index + 1] ?? 0,
				data[index + 2] ?? 0,
			);
			// Paper turns transparent; mid-tones fade so pen edges stay smooth.
			if (lightness > 215) data[index + 3] = 0;
			else if (lightness > 160) {
				data[index + 3] = Math.round(
					((data[index + 3] ?? 255) * (215 - lightness)) / 55,
				);
			}
		}
		context.putImageData(image, 0, 0);
	}
	return trimToInk(canvas);
}
