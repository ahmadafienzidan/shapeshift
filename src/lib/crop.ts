import type { OutputType } from "./image";

export type Area = { x: number; y: number; width: number; height: number };

export type Flip = { horizontal: boolean; vertical: boolean };

// Rotation is applied to the image itself (in 90° steps) before it reaches the
// cropper, so the crop box can always cover the whole upright picture.
export async function rotateQuarter(
	source: ImageBitmap,
	turns: number,
): Promise<ImageBitmap> {
	const sideways = turns % 2 === 1;
	const width = sideways ? source.height : source.width;
	const height = sideways ? source.width : source.height;
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	context.translate(width / 2, height / 2);
	context.rotate((turns * Math.PI) / 2);
	context.drawImage(source, -source.width / 2, -source.height / 2);
	return createImageBitmap(canvas);
}

export async function cropImage(
	source: ImageBitmap,
	area: Area,
	flip: Flip,
	type: OutputType,
	quality: number,
): Promise<Blob> {
	const width = Math.max(1, Math.round(area.width));
	const height = Math.max(1, Math.round(area.height));
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	if (type === "image/jpeg") {
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, width, height);
	}
	// The flip only mirrors the cropper's preview, so the reported area is where
	// the box sits on the mirrored image. The matching region of the real image
	// is on the opposite side, and the canvas mirrors it back.
	context.translate(flip.horizontal ? width : 0, flip.vertical ? height : 0);
	context.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
	const x = flip.horizontal ? source.width - area.x - area.width : area.x;
	const y = flip.vertical ? source.height - area.y - area.height : area.y;
	context.drawImage(
		source,
		Math.round(x),
		Math.round(y),
		width,
		height,
		0,
		0,
		width,
		height,
	);
	return canvas.convertToBlob({ type, quality });
}
