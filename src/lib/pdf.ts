import { PageSizes, PDFDocument } from "@cantoo/pdf-lib";
import { decodeImage, EXTENSIONS, encodeImage, type OutputType } from "./image";
import type { BatchOutput } from "./useBatch";

export type PageSize = "fit" | "a4" | "letter";

export const PDF_KIND = {
	accept: ["application/pdf", ".pdf"],
	matches: (file: File) =>
		file.type === "application/pdf" || /\.pdf$/i.test(file.name),
	formats: "PDF",
};

const PAGE_DIMENSIONS: Record<Exclude<PageSize, "fit">, [number, number]> = {
	a4: PageSizes.A4,
	letter: PageSizes.Letter,
};

// CSS pixels to PDF points (72 per inch vs. 96 per inch).
const PX_TO_PT = 72 / 96;

function toPdfBlob(bytes: Uint8Array): Blob {
	return new Blob([bytes as Uint8Array<ArrayBuffer>], {
		type: "application/pdf",
	});
}

export async function imagesToPdf(
	files: File[],
	options: { pageSize: PageSize; margin: number; quality: number },
): Promise<Blob> {
	const pdf = await PDFDocument.create();

	for (const file of files) {
		const jpeg = await encodeImage(
			await decodeImage(file),
			"image/jpeg",
			options.quality,
		);
		const image = await pdf.embedJpg(await jpeg.arrayBuffer());
		const width = image.width * PX_TO_PT;
		const height = image.height * PX_TO_PT;

		if (options.pageSize === "fit") {
			const page = pdf.addPage([
				width + options.margin * 2,
				height + options.margin * 2,
			]);
			page.drawImage(image, {
				x: options.margin,
				y: options.margin,
				width,
				height,
			});
			continue;
		}

		const [short, long] = PAGE_DIMENSIONS[options.pageSize];
		const landscape = width > height;
		const pageWidth = landscape ? long : short;
		const pageHeight = landscape ? short : long;
		const scale = Math.min(
			(pageWidth - options.margin * 2) / width,
			(pageHeight - options.margin * 2) / height,
			1,
		);
		const page = pdf.addPage([pageWidth, pageHeight]);
		page.drawImage(image, {
			x: (pageWidth - width * scale) / 2,
			y: (pageHeight - height * scale) / 2,
			width: width * scale,
			height: height * scale,
		});
	}

	return toPdfBlob(await pdf.save());
}

export async function mergePdfs(files: File[]): Promise<Blob> {
	const merged = await PDFDocument.create();
	for (const file of files) {
		const source = await PDFDocument.load(await file.arrayBuffer());
		const pages = await merged.copyPages(source, source.getPageIndices());
		for (const page of pages) merged.addPage(page);
	}
	return toPdfBlob(await merged.save());
}

async function loadPdfJs() {
	const [pdfjs, worker] = await Promise.all([
		import("pdfjs-dist"),
		import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
	]);
	pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
	return pdfjs;
}

export async function pdfToImages(
	file: File,
	options: { type: OutputType; dpi: number; quality: number },
): Promise<BatchOutput[]> {
	const pdfjs = await loadPdfJs();
	const task = pdfjs.getDocument({
		data: new Uint8Array(await file.arrayBuffer()),
	});
	const pdf = await task.promise;
	const base = file.name.replace(/\.pdf$/i, "");
	const digits = String(pdf.numPages).length;
	const outputs: BatchOutput[] = [];

	for (let index = 1; index <= pdf.numPages; index++) {
		const page = await pdf.getPage(index);
		const viewport = page.getViewport({ scale: options.dpi / 72 });
		const canvas = document.createElement("canvas");
		canvas.width = Math.ceil(viewport.width);
		canvas.height = Math.ceil(viewport.height);
		// The "display" intent paces rendering with requestAnimationFrame, which
		// never fires in a background tab and would stall bulk conversions.
		await page.render({ canvas, viewport, intent: "print" }).promise;

		const blob = await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(
				(result) =>
					result ? resolve(result) : reject(new Error("Canvas export failed")),
				options.type,
				options.quality,
			),
		);
		outputs.push({
			blob,
			name: `${base}-page-${String(index).padStart(digits, "0")}.${EXTENSIONS[options.type]}`,
		});
		page.cleanup();
	}

	await task.destroy();
	return outputs;
}
