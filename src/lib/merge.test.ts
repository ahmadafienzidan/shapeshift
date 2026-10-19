import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	bitmap,
	canvases,
	type FakeBitmap,
	installCanvas,
} from "../test/canvas";
import { decodeImage } from "./image";
import { type MergeOptions, mergeImages } from "./merge";

vi.mock("./image", () => ({ decodeImage: vi.fn() }));

beforeEach(installCanvas);

const options = (extra: Partial<MergeOptions> = {}): MergeOptions => ({
	direction: "vertical",
	gap: 0,
	background: null,
	sameSize: false,
	type: "image/png",
	quality: 0.9,
	...extra,
});

const merge = async (images: FakeBitmap[], extra: Partial<MergeOptions>) => {
	const files = images.map((_, index) => new File([""], `${index}.png`));
	vi.mocked(decodeImage).mockImplementation(
		async (file) => images[files.indexOf(file as File)] ?? bitmap(0, 0),
	);
	const blob = await mergeImages(files, options(extra));
	const [canvas] = canvases;
	if (!canvas) throw new Error("no canvas");
	return { blob, canvas };
};

describe("mergeImages", () => {
	it("stacks images vertically with gaps, centring narrower ones", async () => {
		const [wide, narrow] = [bitmap(100, 50), bitmap(60, 30)];
		const { canvas } = await merge([wide, narrow], { gap: 10 });
		expect([canvas.width, canvas.height]).toEqual([100, 90]);
		expect(canvas.called("drawImage")).toEqual([
			[wide, 0, 0, 100, 50],
			[narrow, 20, 60, 60, 30],
		]);
	});

	it("scales every image to the tallest one when merging side by side at the same size", async () => {
		const [short, tall] = [bitmap(100, 50), bitmap(40, 100)];
		const { canvas } = await merge([short, tall], {
			direction: "horizontal",
			sameSize: true,
		});
		expect([canvas.width, canvas.height]).toEqual([240, 100]);
		expect(canvas.called("drawImage")).toEqual([
			[short, 0, 0, 200, 100],
			[tall, 200, 0, 40, 100],
		]);
	});

	it("leaves PNG transparent but fills JPG with white", async () => {
		const png = await merge([bitmap(10, 10)], {});
		expect(png.canvas.called("fillRect")).toEqual([]);

		canvases.length = 0;
		const jpeg = await merge([bitmap(10, 10)], { type: "image/jpeg" });
		expect(jpeg.canvas.called("fillStyle=")).toEqual([["#ffffff"]]);
		expect(jpeg.canvas.called("fillRect")).toEqual([[0, 0, 10, 10]]);
	});

	it("uses the chosen background for any format", async () => {
		const { canvas } = await merge([bitmap(10, 10)], { background: "#000" });
		expect(canvas.called("fillStyle=")).toEqual([["#000"]]);
	});

	it("scales results longer than 16384px down to that side", async () => {
		const strip = bitmap(32768, 100);
		const { canvas } = await merge([strip], {});
		expect([canvas.width, canvas.height]).toEqual([16384, 50]);
		expect(canvas.called("drawImage")).toEqual([[strip, 0, 0, 16384, 50]]);
	});

	it("scales results over 64 megapixels down to that area", async () => {
		const images = Array.from({ length: 4 }, () => bitmap(10000, 10000));
		const { canvas } = await merge(images, { direction: "horizontal" });
		// 40000×10000 is over both limits; the area limit is the stricter one.
		expect([canvas.width, canvas.height]).toEqual([16000, 4000]);
		expect(canvas.called("drawImage").map(([, x]) => x)).toEqual([
			0, 4000, 8000, 12000,
		]);
	});

	it("closes every decoded image and encodes with the chosen format", async () => {
		const images = [bitmap(10, 10), bitmap(10, 10)];
		const { blob, canvas } = await merge(images, {
			type: "image/webp",
			quality: 0.6,
		});
		for (const image of images) expect(image.close).toHaveBeenCalled();
		expect(canvas.called("convertToBlob")).toEqual([
			[{ type: "image/webp", quality: 0.6 }],
		]);
		expect(blob.type).toBe("image/webp");
	});
});
