import { describe, expect, it, vi } from "vitest";

// color.ts creates a 1×1 canvas at import time for parseColor, which needs a
// browser; the conversions tested here are plain math.
vi.hoisted(() => {
	vi.stubGlobal(
		"OffscreenCanvas",
		class {
			getContext() {
				return null;
			}
		},
	);
});

const {
	contrastRatio,
	oklchToRgb,
	rgbToOklch,
	shades,
	toCmyk,
	toHex,
	toHsl,
	toOklchString,
	toRgbString,
} = await import("./color");

const rgb = (r: number, g: number, b: number, a = 1) => ({ r, g, b, a });

describe("formatting", () => {
	it("writes hex, rgb, and hsl with alpha only when transparent", () => {
		expect(toHex(rgb(61, 220, 255))).toBe("#3ddcff");
		expect(toHex(rgb(255, 0, 0, 0.5))).toBe("#ff000080");
		expect(toRgbString(rgb(1, 2, 3, 0.25))).toBe("rgb(1 2 3 / 0.25)");
		expect(toHsl(rgb(255, 0, 0))).toBe("hsl(0 100% 50%)");
		expect(toHsl(rgb(128, 128, 128))).toBe("hsl(0 0% 50%)");
	});

	it("writes CMYK, including pure black", () => {
		expect(toCmyk(rgb(255, 0, 0))).toBe("cmyk(0%, 100%, 100%, 0%)");
		expect(toCmyk(rgb(0, 0, 0))).toBe("cmyk(0%, 0%, 0%, 100%)");
	});

	it("writes OKLCH with hue 0 for greys", () => {
		expect(toOklchString(rgb(255, 255, 255))).toBe("oklch(100.0% 0.000 0)");
		expect(toOklchString(rgb(255, 0, 0))).toBe("oklch(62.8% 0.258 29.2)");
	});
});

describe("OKLCH", () => {
	it("round-trips sRGB colors", () => {
		for (const color of [
			rgb(61, 220, 255),
			rgb(124, 92, 255),
			rgb(10, 20, 30),
		]) {
			expect(oklchToRgb(rgbToOklch(color))).toEqual(color);
		}
	});

	it("reduces chroma to fit colors outside sRGB", () => {
		const fitted = oklchToRgb({ l: 0.7, c: 0.4, h: 150 });
		for (const channel of [fitted.r, fitted.g, fitted.b]) {
			expect(channel).toBeGreaterThanOrEqual(0);
			expect(channel).toBeLessThanOrEqual(255);
		}
	});

	it("builds 11 shades from light to dark", () => {
		const scale = shades(rgb(61, 220, 255));
		expect(scale.map((shade) => shade.name)).toEqual([
			"50",
			"100",
			"200",
			"300",
			"400",
			"500",
			"600",
			"700",
			"800",
			"900",
			"950",
		]);
		const lightness = scale.map((shade) => rgbToOklch(shade.rgb).l);
		expect(lightness).toEqual([...lightness].sort((a, b) => b - a));
	});
});

describe("contrastRatio", () => {
	it("matches the WCAG extremes and is symmetric", () => {
		expect(contrastRatio(rgb(0, 0, 0), rgb(255, 255, 255))).toBe(21);
		expect(contrastRatio(rgb(255, 255, 255), rgb(255, 255, 255))).toBe(1);
		expect(contrastRatio(rgb(0, 30, 43), rgb(61, 220, 255))).toBeCloseTo(
			contrastRatio(rgb(61, 220, 255), rgb(0, 30, 43)),
		);
	});
});
