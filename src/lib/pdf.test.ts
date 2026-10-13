import { degrees, PDFDocument } from "@cantoo/pdf-lib";
import { describe, expect, it } from "vitest";
import { mergePdfs, organizePdf, protectPdf, unlockPdf } from "./pdf";

async function samplePdf(name: string, sizes: [number, number][]) {
	const pdf = await PDFDocument.create();
	for (const [width, height] of sizes) {
		pdf
			.addPage([width, height])
			.drawText(`${name} ${width}x${height}`, { x: 20, y: 20 });
	}
	return new File([await pdf.save()], `${name}.pdf`, {
		type: "application/pdf",
	});
}

const bytesOf = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());
const text = async (blob: Blob) =>
	new TextDecoder("latin1").decode(await bytesOf(blob));

describe("mergePdfs", () => {
	it("appends every page in order", async () => {
		const merged = await mergePdfs([
			await samplePdf("a", [[200, 300]]),
			await samplePdf("b", [
				[400, 100],
				[100, 100],
			]),
		]);
		const pdf = await PDFDocument.load(await bytesOf(merged));
		expect(pdf.getPages().map((page) => page.getWidth())).toEqual([
			200, 400, 100,
		]);
	});
});

describe("organizePdf", () => {
	it("reorders, drops, and rotates pages", async () => {
		const file = await samplePdf("doc", [
			[100, 100],
			[200, 200],
			[300, 300],
		]);
		const organized = await organizePdf(file, [
			{ index: 2, rotation: 90 },
			{ index: 0, rotation: 0 },
		]);
		const pdf = await PDFDocument.load(await bytesOf(organized));
		expect(
			pdf.getPages().map((page) => [page.getWidth(), page.getRotation().angle]),
		).toEqual([
			[300, 90],
			[100, 0],
		]);
	});

	it("adds to a page's existing rotation", async () => {
		const source = await PDFDocument.create();
		source.addPage([100, 100]).setRotation(degrees(270));
		const file = new File([await source.save()], "r.pdf");
		const organized = await organizePdf(file, [{ index: 0, rotation: 180 }]);
		const pdf = await PDFDocument.load(await bytesOf(organized));
		expect(pdf.getPage(0).getRotation().angle).toBe(90);
	});
});

describe("protectPdf and unlockPdf", () => {
	const permissions = { printing: true, copying: false, modifying: false };

	it("encrypts with the password and unlocks back to a clean PDF", async () => {
		const file = await samplePdf("secret", [[200, 200]]);
		const locked = await protectPdf(file, "s3cret", permissions);
		expect(await text(locked)).toContain("/Encrypt");
		await expect(PDFDocument.load(await bytesOf(locked))).rejects.toThrow();

		const unlocked = await unlockPdf(
			new File([locked], "locked.pdf"),
			"s3cret",
		);
		// Leftover objects from the encrypted file used to keep /Encrypt around,
		// which made other viewers treat the result as still protected.
		expect(await text(unlocked)).not.toContain("/Encrypt");
		const pdf = await PDFDocument.load(await bytesOf(unlocked));
		expect(pdf.getPageCount()).toBe(1);
	});

	it("reports a wrong password with a translatable id", async () => {
		const locked = await protectPdf(
			await samplePdf("x", [[100, 100]]),
			"right",
			permissions,
		);
		await expect(
			unlockPdf(new File([locked], "locked.pdf"), "wrong"),
		).rejects.toThrow("pdf.error.password");
	});
});
