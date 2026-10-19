import { beforeEach, describe, expect, it } from "vitest";
import { bitmap, canvases, installCanvas } from "../test/canvas";
import { cropImage, rotateQuarter } from "./crop";

beforeEach(installCanvas);

const noFlip = { horizontal: false, vertical: false };

describe("rotateQuarter", () => {
	it("swaps the sides on odd turns and rotates around the centre", async () => {
		const source = bitmap(40, 20);
		const rotated = await rotateQuarter(source, 1);
		const [canvas] = canvases;
		expect([rotated.width, rotated.height]).toEqual([20, 40]);
		expect(canvas?.called("translate")).toEqual([[10, 20]]);
		expect(canvas?.called("rotate")).toEqual([[Math.PI / 2]]);
		expect(canvas?.called("drawImage")).toEqual([[source, -20, -10]]);
	});

	it("keeps the sides on even turns", async () => {
		const rotated = await rotateQuarter(bitmap(40, 20), 2);
		expect([rotated.width, rotated.height]).toEqual([40, 20]);
		expect(canvases[0]?.called("rotate")).toEqual([[Math.PI]]);
	});
});

describe("cropImage", () => {
	it("copies the rounded area into a canvas of the same size", async () => {
		const source = bitmap(100, 80);
		const blob = await cropImage(
			source,
			{ x: 10.4, y: 5.6, width: 30.2, height: 20.7 },
			noFlip,
			"image/png",
			0.9,
		);
		const [canvas] = canvases;
		expect([canvas?.width, canvas?.height]).toEqual([30, 21]);
		expect(canvas?.called("drawImage")).toEqual([
			[source, 10, 6, 30, 21, 0, 0, 30, 21],
		]);
		expect(canvas?.called("fillRect")).toEqual([]);
		expect(canvas?.called("convertToBlob")).toEqual([
			[{ type: "image/png", quality: 0.9 }],
		]);
		expect(blob.type).toBe("image/png");
	});

	it("fills JPG output with white so transparency does not turn black", async () => {
		await cropImage(
			bitmap(100, 80),
			{ x: 0, y: 0, width: 50, height: 40 },
			noFlip,
			"image/jpeg",
			0.8,
		);
		const methods = canvases[0]?.methods() ?? [];
		expect(canvases[0]?.called("fillStyle=")).toEqual([["#ffffff"]]);
		expect(methods.indexOf("fillRect")).toBeLessThan(
			methods.indexOf("drawImage"),
		);
	});

	it("reads a flipped area from the opposite side and mirrors it back", async () => {
		const source = bitmap(100, 80);
		await cropImage(
			source,
			{ x: 10, y: 5, width: 30, height: 20 },
			{ horizontal: true, vertical: true },
			"image/png",
			1,
		);
		const [canvas] = canvases;
		expect(canvas?.called("translate")).toEqual([[30, 20]]);
		expect(canvas?.called("scale")).toEqual([[-1, -1]]);
		expect(canvas?.called("drawImage")).toEqual([
			[source, 60, 55, 30, 20, 0, 0, 30, 20],
		]);
	});

	it("never creates an empty canvas", async () => {
		await cropImage(
			bitmap(100, 80),
			{ x: 0, y: 0, width: 0.2, height: 0 },
			noFlip,
			"image/png",
			1,
		);
		expect([canvases[0]?.width, canvases[0]?.height]).toEqual([1, 1]);
	});
});
