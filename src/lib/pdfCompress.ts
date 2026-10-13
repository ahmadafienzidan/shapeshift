import {
	PDFArray,
	PDFDict,
	PDFDocument,
	PDFName,
	PDFNumber,
	PDFRawStream,
	type PDFRef,
} from "@cantoo/pdf-lib";
import { unzlibSync } from "fflate";
import { loadPdfJs } from "./pdf";

export type CompressLevel = "light" | "recommended" | "strong";

export type CompressMethod = "images" | "flatten";

const LEVELS: Record<
	CompressLevel,
	{ maxSide: number; quality: number; dpi: number }
> = {
	light: { maxSide: 2400, quality: 0.82, dpi: 150 },
	recommended: { maxSide: 1600, quality: 0.7, dpi: 110 },
	strong: { maxSide: 1000, quality: 0.5, dpi: 80 },
};

const name = (value: string) => PDFName.of(value);

// Reverses the PNG row filters (predictors 10–15) that Flate-compressed PDF
// images often use, given the bytes per pixel and per row.
export function pngUnfilter(
	data: Uint8Array,
	bytesPerPixel: number,
	rowLength: number,
): Uint8Array {
	const rows = Math.floor(data.length / (rowLength + 1));
	const output = new Uint8Array(rows * rowLength);
	for (let row = 0; row < rows; row++) {
		const filter = data[row * (rowLength + 1)];
		const input = row * (rowLength + 1) + 1;
		const start = row * rowLength;
		for (let index = 0; index < rowLength; index++) {
			const raw = data[input + index] ?? 0;
			const left =
				index >= bytesPerPixel
					? (output[start + index - bytesPerPixel] ?? 0)
					: 0;
			const up = row > 0 ? (output[start + index - rowLength] ?? 0) : 0;
			const upLeft =
				row > 0 && index >= bytesPerPixel
					? (output[start + index - rowLength - bytesPerPixel] ?? 0)
					: 0;
			let predicted = 0;
			if (filter === 1) predicted = left;
			else if (filter === 2) predicted = up;
			else if (filter === 3) predicted = (left + up) >> 1;
			else if (filter === 4) {
				const estimate = left + up - upLeft;
				const [a, b, c] = [
					Math.abs(estimate - left),
					Math.abs(estimate - up),
					Math.abs(estimate - upLeft),
				];
				predicted = a <= b && a <= c ? left : b <= c ? up : upLeft;
			}
			output[start + index] = (raw + predicted) & 0xff;
		}
	}
	return output;
}

function channelCount(dict: PDFDict): number | undefined {
	const space = dict.lookup(name("ColorSpace"));
	if (space === name("DeviceRGB")) return 3;
	if (space === name("DeviceGray")) return 1;
	if (space instanceof PDFArray && space.lookup(0) === name("ICCBased")) {
		const profile = space.lookup(1);
		const count =
			profile instanceof PDFRawStream
				? profile.dict.lookup(name("N"))
				: undefined;
		return count instanceof PDFNumber ? count.asNumber() : undefined;
	}
	return undefined;
}

function singleFilter(dict: PDFDict): PDFName | undefined {
	const filter = dict.lookup(name("Filter"));
	if (filter instanceof PDFName) return filter;
	if (filter instanceof PDFArray && filter.size() === 1) {
		const only = filter.lookup(0);
		return only instanceof PDFName ? only : undefined;
	}
	return undefined;
}

// Decodes the image formats a browser can redraw faithfully: JPEG, and 8-bit
// RGB or grey Flate data. Anything else (CMYK, masks, JBIG2, …) is left as is.
async function decodePdfImage(
	stream: PDFRawStream,
): Promise<ImageBitmap | undefined> {
	const { dict } = stream;
	const width = dict.lookup(name("Width"));
	const height = dict.lookup(name("Height"));
	const bits = dict.lookup(name("BitsPerComponent"));
	if (
		!(width instanceof PDFNumber) ||
		!(height instanceof PDFNumber) ||
		!(bits instanceof PDFNumber) ||
		bits.asNumber() !== 8 ||
		dict.has(name("Mask")) ||
		dict.has(name("Decode"))
	) {
		return undefined;
	}
	const channels = channelCount(dict);
	if (channels !== 1 && channels !== 3) return undefined;

	const filter = singleFilter(dict);
	if (filter === name("DCTDecode")) {
		return createImageBitmap(
			new Blob([stream.contents as Uint8Array<ArrayBuffer>], {
				type: "image/jpeg",
			}),
		);
	}
	if (filter !== name("FlateDecode")) return undefined;

	const w = width.asNumber();
	const h = height.asNumber();
	let pixels: Uint8Array = unzlibSync(stream.contents);
	const params = dict.lookup(name("DecodeParms"));
	const predictor =
		params instanceof PDFDict ? params.lookup(name("Predictor")) : undefined;
	if (predictor instanceof PDFNumber && predictor.asNumber() >= 10) {
		pixels = pngUnfilter(pixels, channels, w * channels);
	} else if (predictor instanceof PDFNumber && predictor.asNumber() > 1) {
		return undefined;
	}
	if (pixels.length < w * h * channels) return undefined;

	const rgba = new Uint8ClampedArray(w * h * 4);
	for (let pixel = 0; pixel < w * h; pixel++) {
		for (let channel = 0; channel < 3; channel++) {
			rgba[pixel * 4 + channel] =
				pixels[pixel * channels + (channels === 3 ? channel : 0)] ?? 0;
		}
		rgba[pixel * 4 + 3] = 255;
	}
	return createImageBitmap(new ImageData(rgba, w, h));
}

async function recompressImages(
	pdf: PDFDocument,
	maxSide: number,
	quality: number,
) {
	const images: [PDFRef, PDFRawStream][] = [];
	for (const [ref, object] of pdf.context.enumerateIndirectObjects()) {
		if (
			object instanceof PDFRawStream &&
			object.dict.lookup(name("Subtype")) === name("Image")
		) {
			images.push([ref, object]);
		}
	}

	for (const [ref, stream] of images) {
		const bitmap = await decodePdfImage(stream);
		if (!bitmap) continue;
		const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
		const canvas = new OffscreenCanvas(
			Math.max(1, Math.round(bitmap.width * scale)),
			Math.max(1, Math.round(bitmap.height * scale)),
		);
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Canvas 2D context is unavailable");
		context.imageSmoothingQuality = "high";
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();
		const jpeg = new Uint8Array(
			await (
				await canvas.convertToBlob({ type: "image/jpeg", quality })
			).arrayBuffer(),
		);
		if (jpeg.length >= stream.contents.length) continue;

		const dict = stream.dict.clone(pdf.context);
		dict.set(name("Width"), PDFNumber.of(canvas.width));
		dict.set(name("Height"), PDFNumber.of(canvas.height));
		dict.set(name("ColorSpace"), name("DeviceRGB"));
		dict.set(name("BitsPerComponent"), PDFNumber.of(8));
		dict.set(name("Filter"), name("DCTDecode"));
		dict.set(name("Length"), PDFNumber.of(jpeg.length));
		dict.delete(name("DecodeParms"));
		pdf.context.assign(ref, PDFRawStream.of(dict, jpeg));
	}
}

async function flattenPages(file: File, dpi: number, quality: number) {
	const pdfjs = await loadPdfJs();
	const task = pdfjs.getDocument({
		data: new Uint8Array(await file.arrayBuffer()),
	});
	const source = await task.promise;
	const output = await PDFDocument.create();

	for (let index = 1; index <= source.numPages; index++) {
		const page = await source.getPage(index);
		const viewport = page.getViewport({ scale: dpi / 72 });
		const canvas = document.createElement("canvas");
		canvas.width = Math.ceil(viewport.width);
		canvas.height = Math.ceil(viewport.height);
		await page.render({ canvas, viewport, intent: "print" }).promise;
		const blob = await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(
				(result) =>
					result ? resolve(result) : reject(new Error("Canvas export failed")),
				"image/jpeg",
				quality,
			),
		);
		const image = await output.embedJpg(await blob.arrayBuffer());
		// The viewport already includes the page's rotation, so the new page is
		// laid out the way the original is displayed.
		const { width, height } = page.getViewport({ scale: 1 });
		output
			.addPage([width, height])
			.drawImage(image, { x: 0, y: 0, width, height });
		page.cleanup();
	}

	await task.destroy();
	return output;
}

export async function compressPdf(
	file: File,
	level: CompressLevel,
	method: CompressMethod,
): Promise<Blob> {
	const { maxSide, quality, dpi } = LEVELS[level];
	let pdf: PDFDocument;
	if (method === "flatten") {
		pdf = await flattenPages(file, dpi, quality);
	} else {
		pdf = await PDFDocument.load(await file.arrayBuffer(), {
			updateMetadata: false,
		});
		await recompressImages(pdf, maxSide, quality);
	}
	const bytes = await pdf.save({ useObjectStreams: true });
	// Already well-optimized files can grow slightly; keep the original then.
	return bytes.length < file.size
		? new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" })
		: new Blob([file], { type: "application/pdf" });
}
