import { beforeEach, describe, expect, it, vi } from "vitest";
import { bitmap, canvases, installCanvas } from "../test/canvas";
import { decodeImage, encodeImage } from "./image";
import {
	drawWatermark,
	POSITIONS,
	type WatermarkOptions,
	watermarkImage,
} from "./watermark";

vi.mock("./image", () => ({ decodeImage: vi.fn(), encodeImage: vi.fn() }));

beforeEach(installCanvas);

const options = (extra: Partial<WatermarkOptions> = {}): WatermarkOptions => ({
	text: "abcd",
	color: "#ff0000",
	size: 0.2,
	opacity: 0.4,
	position: "bottom-right",
	...extra,
});

// The fake canvas measures text at half its font size per character, so
// "abcd" at 100px is 200px wide: exactly the stamp width (0.2 × 1000) below.
const watermark = (extra: Partial<WatermarkOptions> = {}) => {
	const target = new OffscreenCanvas(1000, 500);
	const context = target.getContext("2d");
	if (!context) throw new Error("no context");
	const source = bitmap(1000, 500);
	drawWatermark(context, source, options(extra));
	const [canvas, ...rest] = canvases;
	const stamp = rest[rest.length - 1];
	if (!canvas || !stamp) throw new Error("nothing drawn");
	return { canvas, stamp, source };
};

describe("POSITIONS", () => {
	it("lists the nine anchors followed by tile", () => {
		expect(POSITIONS).toEqual([
			"top-left",
			"top",
			"top-right",
			"left",
			"center",
			"right",
			"bottom-left",
			"bottom",
			"bottom-right",
			"tile",
		]);
	});
});

describe("drawWatermark", () => {
	it("sizes the text so it spans the requested share of the width", () => {
		const { stamp } = watermark();
		expect([stamp.width, stamp.height]).toEqual([260, 200]);
		expect(stamp.called("font=").at(-1)).toEqual([
			'700 100px "Inter Variable", sans-serif',
		]);
		expect(stamp.called("fillStyle=")).toEqual([["#ff0000"]]);
		expect(stamp.called("fillText")).toEqual([["abcd", 30, 100]]);
	});

	it("never shrinks the text below 8px", () => {
		const { stamp } = watermark({ text: "x".repeat(1000) });
		expect(stamp.called("font=").at(-1)).toEqual([
			'700 8px "Inter Variable", sans-serif',
		]);
	});

	it("places the stamp inside a 3% margin at the chosen anchor", () => {
		for (const [position, x, y] of [
			["top-left", 15, 15],
			["center", 370, 150],
			["bottom-right", 725, 285],
		] as const) {
			canvases.length = 0;
			const { canvas, stamp, source } = watermark({ position });
			expect(canvas.called("drawImage")).toEqual([
				[source, 0, 0, 1000, 500],
				[stamp, x, y],
			]);
		}
	});

	it("draws with the chosen opacity and restores the context afterwards", () => {
		const { canvas } = watermark();
		const methods = canvas.methods();
		expect(canvas.called("globalAlpha=")).toEqual([[0.4]]);
		expect(methods[0]).toBe("save");
		expect(methods.at(-1)).toBe("restore");
	});

	it("scales a logo to the stamp width, keeping its aspect ratio", () => {
		const logo = bitmap(50, 25);
		const { stamp } = watermark({ logo });
		expect([stamp.width, stamp.height]).toEqual([200, 100]);
		expect(stamp.called("drawImage")).toEqual([[logo, 0, 0, 200, 100]]);
		expect(stamp.called("fillText")).toEqual([]);
	});

	it("tiles rotated, brick-offset rows across the whole image", () => {
		const { canvas, stamp } = watermark({ position: "tile" });
		expect(canvas.called("translate")).toEqual([[500, 250]]);
		expect(canvas.called("rotate")).toEqual([[-Math.PI / 6]]);
		const stamps = canvas
			.called("drawImage")
			.filter(([image]) => image === stamp);
		const rows = Map.groupBy(stamps, ([, , y]) => y);
		expect([...rows.values()].map((row) => row.length)).toEqual([3, 4]);
		const [first, second] = [...rows.values()];
		expect(Number(second?.[0]?.[1]) - Number(first?.[0]?.[1])).toBeCloseTo(
			-stamp.width * 0.8,
		);
	});
});

describe("watermarkImage", () => {
	it("stamps the decoded image at its own size and encodes it", async () => {
		const source = bitmap(640, 480);
		const output = new Blob(["out"], { type: "image/png" });
		vi.mocked(decodeImage).mockResolvedValue(source);
		vi.mocked(encodeImage).mockResolvedValue(output);

		const blob = await watermarkImage(
			new File([""], "a.png"),
			options(),
			"image/png",
			1,
		);

		expect(blob).toBe(output);
		expect(source.close).toHaveBeenCalled();
		expect([canvases[0]?.width, canvases[0]?.height]).toEqual([640, 480]);
		expect(canvases[0]?.called("drawImage")[0]).toEqual([
			source,
			0,
			0,
			640,
			480,
		]);
		const [encoded, type] = vi.mocked(encodeImage).mock.calls[0] ?? [];
		expect([encoded?.width, encoded?.height, type]).toEqual([
			640,
			480,
			"image/png",
		]);
	});
});
