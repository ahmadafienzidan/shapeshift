import { beforeEach, describe, expect, it, vi } from "vitest";
import { bitmap, canvases, installCanvas } from "../test/canvas";
import { decodeImage, encodeImage } from "./image";
import { drawResized, resizeImage } from "./resize";

vi.mock("./image", () => ({ decodeImage: vi.fn(), encodeImage: vi.fn() }));

beforeEach(installCanvas);

const target = (width: number, height: number) => {
	const context = new OffscreenCanvas(width, height).getContext("2d");
	if (!context) throw new Error("no context");
	return { context, canvas: canvases[canvases.length - 1] };
};

describe("drawResized", () => {
	it("covers the canvas and slides the overflow by the focus point", () => {
		const source = bitmap(200, 100);
		for (const [focus, x] of [
			[0, 0],
			[0.5, -50],
			[1, -100],
		] as const) {
			const { context, canvas } = target(100, 100);
			drawResized(context, source, { fit: "cover", focus, background: "" });
			const [drawn, drawX, ...rest] = canvas?.called("drawImage")[0] ?? [];
			expect(drawn).toBe(source);
			expect(drawX).toBeCloseTo(x);
			expect(rest).toEqual([0, 200, 100]);
			expect(canvas?.called("fillRect")).toEqual([]);
		}
	});

	it("fits the whole image over a solid color", () => {
		const source = bitmap(200, 100);
		const { context, canvas } = target(100, 100);
		drawResized(context, source, {
			fit: "color",
			focus: 0,
			background: "#123456",
		});
		expect(canvas?.methods()).toEqual([
			"imageSmoothingQuality=",
			"clearRect",
			"fillStyle=",
			"fillRect",
			"drawImage",
		]);
		expect(canvas?.called("fillStyle=")).toEqual([["#123456"]]);
		expect(canvas?.called("fillRect")).toEqual([[0, 0, 100, 100]]);
		expect(canvas?.called("drawImage")).toEqual([[source, 0, 25, 100, 50]]);
	});

	it("fits the whole image over a darkened, blurred copy of itself", () => {
		const source = bitmap(200, 100);
		const { context, canvas } = target(100, 100);
		drawResized(context, source, { fit: "blur", focus: 0, background: "" });
		const steps = canvases.slice(1);
		expect(steps.map((step) => [step.width, step.height])).toEqual([
			[3, 3],
			[25, 25],
			[100, 100],
		]);
		expect(steps[0]?.called("drawImage")[0]?.[0]).toBe(source);
		expect(steps[1]?.called("drawImage")[0]?.[0]).toBe(steps[0]);
		expect(canvas?.called("drawImage")).toEqual([
			[steps[2], 0, 0],
			[source, 0, 25, 100, 50],
		]);
		expect(canvas?.called("fillStyle=")).toEqual([["rgb(0 0 0 / 0.15)"]]);
	});
});

describe("resizeImage", () => {
	it("draws the decoded image at the requested size and encodes it", async () => {
		const source = bitmap(400, 300);
		const output = new Blob(["out"], { type: "image/webp" });
		vi.mocked(decodeImage).mockResolvedValue(source);
		vi.mocked(encodeImage).mockResolvedValue(output);
		const file = new File([""], "photo.jpg");

		const blob = await resizeImage(
			file,
			1080,
			1350,
			{ fit: "cover", focus: 0.5, background: "" },
			"image/webp",
			0.7,
		);

		expect(blob).toBe(output);
		expect(decodeImage).toHaveBeenCalledWith(file);
		expect(source.close).toHaveBeenCalled();
		expect([canvases[0]?.width, canvases[0]?.height]).toEqual([1080, 1350]);
		const [encoded, type, quality] = vi.mocked(encodeImage).mock.calls[0] ?? [];
		expect([encoded?.width, encoded?.height, type, quality]).toEqual([
			1080,
			1350,
			"image/webp",
			0.7,
		]);
	});
});
