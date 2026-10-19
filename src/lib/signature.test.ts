import { beforeEach, describe, expect, it, vi } from "vitest";
import { bitmap, canvases, FakeCanvas, installCanvas } from "../test/canvas";
import { decodeImage } from "./image";
import {
	signatureFromCanvas,
	signatureFromImage,
	signatureFromText,
} from "./signature";

vi.mock("./image", () => ({ decodeImage: vi.fn() }));

beforeEach(installCanvas);

const ink = (canvas: FakeCanvas, x: number, y: number, alpha = 255) => {
	canvas.pixels[(y * canvas.width + x) * 4 + 3] = alpha;
};

const alphas = (pixels: Uint8ClampedArray) =>
	pixels.filter((_, index) => index % 4 === 3);

describe("signatureFromCanvas", () => {
	it("crops to the drawn strokes plus an 8px margin", async () => {
		const pad = new FakeCanvas(100, 50);
		ink(pad, 20, 10);
		ink(pad, 39, 19);

		const signature = await signatureFromCanvas(
			pad as unknown as HTMLCanvasElement,
		);

		const output = canvases[1];
		expect([output?.width, output?.height]).toEqual([36, 26]);
		expect(output?.called("drawImage")).toEqual([
			[pad, 12, 2, 36, 26, 0, 0, 36, 26],
		]);
		expect(signature.aspect).toBe(36 / 26);
		expect(signature.blob.type).toBe("image/png");
		expect(signature.url).toMatch(/^blob:/);
	});

	it("ignores nearly transparent pixels and rejects an empty pad", async () => {
		const pad = new FakeCanvas(10, 10);
		ink(pad, 5, 5, 16);
		await expect(
			signatureFromCanvas(pad as unknown as HTMLCanvasElement),
		).rejects.toThrow("sign.error.empty");
	});
});

describe("signatureFromText", () => {
	it("waits for the script font and writes the text in the chosen color", async () => {
		const load = vi.fn(async () => []);
		vi.stubGlobal("document", { fonts: { load } });

		// The fake canvas inks one pixel where the text is anchored.
		const signature = await signatureFromText("Ann", "#1d4ed8");

		const font = '700 120px "Dancing Script"';
		expect(load).toHaveBeenCalledWith(font, "Ann");
		const [, page] = canvases;
		expect([page?.width, page?.height]).toEqual([260, 220]);
		expect(page?.called("font=")).toEqual([[font]]);
		expect(page?.called("fillStyle=")).toEqual([["#1d4ed8"]]);
		expect(page?.called("fillText")).toEqual([["Ann", 40, 110]]);
		expect(signature.aspect).toBe(1);
	});
});

describe("signatureFromImage", () => {
	// White paper, a light-grey edge, dark ink, and a mid-grey edge.
	// biome-ignore format: one pixel per line
	const scan = () => bitmap(4, 1, {
		pixels: Uint8ClampedArray.from([
			255, 255, 255, 255,
			188, 200, 220, 255,
			100, 100, 100, 255,
			230, 180, 240, 255,
		]),
	});

	it("makes paper transparent and fades light edges", async () => {
		vi.mocked(decodeImage).mockResolvedValue(scan());
		const signature = await signatureFromImage(new File([""], "s.jpg"), true);
		expect([...alphas(canvases[0]?.pixels ?? new Uint8ClampedArray())]).toEqual(
			[0, 125, 255, 162],
		);
		expect([canvases[1]?.width, canvases[1]?.height]).toEqual([19, 17]);
		expect(signature.aspect).toBe(19 / 17);
	});

	it("keeps every pixel when white removal is off", async () => {
		vi.mocked(decodeImage).mockResolvedValue(scan());
		await signatureFromImage(new File([""], "s.png"), false);
		expect(canvases[0]?.called("putImageData")).toEqual([]);
		expect([...alphas(canvases[0]?.pixels ?? new Uint8ClampedArray())]).toEqual(
			[255, 255, 255, 255],
		);
	});

	it("scales large photos so the longest side is 1600px", async () => {
		const photo = bitmap(4000, 10);
		vi.mocked(decodeImage).mockResolvedValue(photo);
		await expect(
			signatureFromImage(new File([""], "s.jpg"), false),
		).rejects.toThrow("sign.error.empty");
		expect([canvases[0]?.width, canvases[0]?.height]).toEqual([1600, 4]);
		expect(canvases[0]?.called("drawImage")).toEqual([[photo, 0, 0, 1600, 4]]);
		expect(photo.close).toHaveBeenCalled();
	});
});
