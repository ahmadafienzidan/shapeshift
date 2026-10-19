import {
	degrees,
	PageSizes,
	PDFArray,
	PDFDict,
	PDFDocument,
	type PDFFont,
	type PDFObject,
	type PDFPage,
	PDFRef,
	PDFStream,
	rgb,
	StandardFonts,
} from "@cantoo/pdf-lib";
import { decodeImage, EXTENSIONS, encodeImage, type OutputType } from "./image";
import type { BatchOutput } from "./useBatch";

export type PageSize = "fit" | "a4" | "letter";

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

export async function loadPdfJs() {
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

export async function renderThumbnails(
	file: File,
	width: number,
	onPage: (index: number, url: string, count: number) => void,
): Promise<void> {
	const pdfjs = await loadPdfJs();
	const task = pdfjs.getDocument({
		data: new Uint8Array(await file.arrayBuffer()),
	});
	const pdf = await task.promise;
	for (let index = 1; index <= pdf.numPages; index++) {
		const page = await pdf.getPage(index);
		const base = page.getViewport({ scale: 1 });
		const viewport = page.getViewport({ scale: width / base.width });
		const canvas = document.createElement("canvas");
		canvas.width = Math.ceil(viewport.width);
		canvas.height = Math.ceil(viewport.height);
		await page.render({ canvas, viewport, intent: "print" }).promise;
		const blob = await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(
				(result) =>
					result ? resolve(result) : reject(new Error("Canvas export failed")),
				"image/jpeg",
				0.8,
			),
		);
		onPage(index - 1, URL.createObjectURL(blob), pdf.numPages);
		page.cleanup();
	}
	await task.destroy();
}

export async function organizePdf(
	file: File,
	pages: { index: number; rotation: number }[],
): Promise<Blob> {
	const source = await PDFDocument.load(await file.arrayBuffer());
	const output = await PDFDocument.create();
	const copied = await output.copyPages(
		source,
		pages.map((page) => page.index),
	);
	copied.forEach((page, position) => {
		const extra = pages[position]?.rotation ?? 0;
		page.setRotation(degrees((page.getRotation().angle + extra + 360) % 360));
		output.addPage(page);
	});
	return toPdfBlob(await output.save());
}

export type NumberPosition = "none" | "bottom-center" | "bottom-right";

export type StampOptions = {
	watermark: string;
	opacity: number;
	numbers: NumberPosition;
	numberFormat: string;
};

// Pages can carry a /Rotate entry; positions are worked out in the page as it
// is displayed and mapped back, so text lands where the reader expects it.
function drawUpright(
	page: PDFPage,
	text: string,
	font: PDFFont,
	size: number,
	place: (
		visibleWidth: number,
		visibleHeight: number,
		textWidth: number,
	) => {
		x: number;
		y: number;
		angle: number;
	},
	color: ReturnType<typeof rgb>,
	opacity: number,
) {
	const { visibleWidth, visibleHeight, toPage } = visibleSpace(page);
	const { x, y, angle } = place(
		visibleWidth,
		visibleHeight,
		font.widthOfTextAtSize(text, size),
	);
	const point = toPage(x, y);
	page.drawText(text, {
		x: point.x,
		y: point.y,
		size,
		font,
		color,
		opacity,
		rotate: degrees(angle + point.rotation),
	});
}

// Coordinates "as the reader sees the page" (origin bottom-left of the
// displayed page) mapped onto the page's own, possibly rotated, space.
function visibleSpace(page: PDFPage) {
	const rotation = ((page.getRotation().angle % 360) + 360) % 360;
	const { width, height } = page.getSize();
	const sideways = rotation === 90 || rotation === 270;
	return {
		visibleWidth: sideways ? height : width,
		visibleHeight: sideways ? width : height,
		toPage: (x: number, y: number) => {
			const [pageX, pageY] =
				rotation === 90
					? [width - y, x]
					: rotation === 180
						? [width - x, height - y]
						: rotation === 270
							? [y, height - x]
							: [x, y];
			return { x: pageX, y: pageY, rotation };
		},
	};
}

// Placement of an image as fractions of the displayed page, measured from
// its top-left corner (the way the editor shows it).
export type Placement = {
	page: number;
	x: number;
	y: number;
	width: number;
	height: number;
};

export async function signPdf(
	file: File,
	signature: Blob,
	placements: Placement[],
): Promise<Blob> {
	const pdf = await PDFDocument.load(await file.arrayBuffer());
	const image = await pdf.embedPng(await signature.arrayBuffer());
	const pages = pdf.getPages();
	for (const placement of placements) {
		const page = pages[placement.page];
		if (!page) continue;
		const { visibleWidth, visibleHeight, toPage } = visibleSpace(page);
		const width = placement.width * visibleWidth;
		// Derived from the image itself so pages of other sizes never stretch it.
		const height = width / (image.width / image.height);
		const bottom = visibleHeight - (placement.y * visibleHeight + height);
		const point = toPage(placement.x * visibleWidth, bottom);
		page.drawImage(image, {
			x: point.x,
			y: point.y,
			width,
			height,
			rotate: degrees(point.rotation),
		});
	}
	return toPdfBlob(await pdf.save());
}

export type Permissions = {
	printing: boolean;
	copying: boolean;
	modifying: boolean;
};

export async function protectPdf(
	file: File,
	password: string,
	permissions: Permissions,
): Promise<Blob> {
	const pdf = await PDFDocument.load(await file.arrayBuffer());
	pdf.encrypt({
		userPassword: password,
		// Restrictions are only enforced when the owner password differs from
		// the one people open the file with, so a random one is generated.
		ownerPassword: crypto.randomUUID(),
		permissions: {
			printing: permissions.printing ? "highResolution" : false,
			copying: permissions.copying,
			modifying: permissions.modifying,
			annotating: permissions.modifying,
			fillingForms: true,
			contentAccessibility: true,
			documentAssembly: permissions.modifying,
		},
	});
	return toPdfBlob(await pdf.save());
}

// Decrypting keeps the encrypted file's old cross-reference streams and
// encryption dictionary around as unreferenced objects, which would still
// carry an /Encrypt entry. Only objects reachable from the document are kept.
function dropUnreachableObjects(pdf: PDFDocument) {
	const { context } = pdf;
	const reachable = new Set<string>();
	const walk = (object: PDFObject | undefined): void => {
		if (object instanceof PDFRef) {
			if (reachable.has(object.toString())) return;
			reachable.add(object.toString());
			walk(context.lookup(object));
		} else if (object instanceof PDFDict) {
			for (const [, value] of object.entries()) walk(value);
		} else if (object instanceof PDFArray) {
			for (let index = 0; index < object.size(); index++)
				walk(object.get(index));
		} else if (object instanceof PDFStream) {
			walk(object.dict);
		}
	};
	walk(context.trailerInfo.Root);
	walk(context.trailerInfo.Info);
	for (const [ref] of context.enumerateIndirectObjects()) {
		if (!reachable.has(ref.toString())) context.delete(ref);
	}
}

export async function unlockPdf(file: File, password: string): Promise<Blob> {
	const bytes = await file.arrayBuffer();
	const pdf = await PDFDocument.load(bytes, { password }).catch((error) => {
		throw new Error(
			/password/i.test(String(error)) ? "pdf.error.password" : String(error),
		);
	});
	dropUnreachableObjects(pdf);
	return toPdfBlob(await pdf.save());
}

export async function openPdf(file: File) {
	const pdfjs = await loadPdfJs();
	const task = pdfjs.getDocument({
		data: new Uint8Array(await file.arrayBuffer()),
	});
	const pdf = await task.promise;
	return {
		pageCount: pdf.numPages,
		async render(index: number, width: number) {
			const page = await pdf.getPage(index + 1);
			const base = page.getViewport({ scale: 1 });
			const viewport = page.getViewport({ scale: width / base.width });
			const canvas = document.createElement("canvas");
			canvas.width = Math.ceil(viewport.width);
			canvas.height = Math.ceil(viewport.height);
			await page.render({ canvas, viewport, intent: "print" }).promise;
			page.cleanup();
			const blob = await new Promise<Blob>((resolve, reject) =>
				canvas.toBlob(
					(result) =>
						result
							? resolve(result)
							: reject(new Error("Canvas export failed")),
					"image/jpeg",
					0.9,
				),
			);
			return {
				url: URL.createObjectURL(blob),
				aspect: viewport.width / viewport.height,
			};
		},
		destroy: () => task.destroy(),
	};
}

export async function stampPdf(
	file: File,
	options: StampOptions,
): Promise<Blob> {
	const pdf = await PDFDocument.load(await file.arrayBuffer());
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const pages = pdf.getPages();

	pages.forEach((page, index) => {
		const watermark = options.watermark.trim();
		if (watermark) {
			const { width, height } = page.getSize();
			const diagonal = Math.hypot(width, height);
			const size = Math.min(
				120,
				(diagonal * 0.6) / Math.max(1, bold.widthOfTextAtSize(watermark, 1)),
			);
			drawUpright(
				page,
				watermark,
				bold,
				size,
				(visibleWidth, visibleHeight, textWidth) => {
					const angle =
						(Math.atan2(visibleHeight, visibleWidth) * 180) / Math.PI;
					const radians = (angle * Math.PI) / 180;
					// Start point that centres the rotated text on the page.
					return {
						x:
							visibleWidth / 2 -
							(Math.cos(radians) * textWidth) / 2 +
							(Math.sin(radians) * size) / 3,
						y:
							visibleHeight / 2 -
							(Math.sin(radians) * textWidth) / 2 -
							(Math.cos(radians) * size) / 3,
						angle,
					};
				},
				rgb(0.85, 0.1, 0.1),
				options.opacity,
			);
		}

		if (options.numbers !== "none") {
			const label = options.numberFormat
				.replaceAll("{n}", String(index + 1))
				.replaceAll("{total}", String(pages.length));
			drawUpright(
				page,
				label,
				regular,
				10,
				(visibleWidth, _visibleHeight, textWidth) => ({
					x:
						options.numbers === "bottom-center"
							? (visibleWidth - textWidth) / 2
							: visibleWidth - textWidth - 36,
					y: 24,
					angle: 0,
				}),
				rgb(0.35, 0.35, 0.35),
				1,
			);
		}
	});

	return toPdfBlob(await pdf.save());
}
