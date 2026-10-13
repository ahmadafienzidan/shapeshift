import { describe, expect, it } from "vitest";
import { pngUnfilter } from "./pdfCompress";

describe("pngUnfilter", () => {
	it("reverses the None, Sub, Up, Average, and Paeth row filters", () => {
		// Five rows of three one-byte pixels, each prefixed by its filter type.
		// biome-ignore format: one row of pixels per line
		const filtered = Uint8Array.from([
			0, 10, 15, 20,
			1, 10, 5, 5,
			2, 1, 1, 1,
			3, 0, 0, 0,
			4, 0, 0, 0,
		]);
		// biome-ignore format: one row of pixels per line
		expect([...pngUnfilter(filtered, 1, 3)]).toEqual([
			10, 15, 20,
			10, 15, 20,
			11, 16, 21,
			5, 10, 15,
			5, 10, 15,
		]);
	});

	it("wraps sums around at 256 and uses the pixel width for Sub", () => {
		// One row of two RGB pixels: each channel adds the same channel to its left.
		const filtered = Uint8Array.from([1, 200, 10, 20, 100, 250, 5]);
		expect([...pngUnfilter(filtered, 3, 6)]).toEqual([200, 10, 20, 44, 4, 25]);
	});
});
