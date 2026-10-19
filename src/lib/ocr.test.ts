import { beforeEach, describe, expect, it, vi } from "vitest";
import { bitmap, canvases, installCanvas } from "../test/canvas";

type Logger = (message: { status: string; progress: number }) => void;

// Created outside the mock factories so the same mocks survive resetModules.
const { createWorker, decodeImage } = vi.hoisted(() => ({
	createWorker: vi.fn(),
	decodeImage: vi.fn(),
}));

vi.mock("tesseract.js", () => ({ createWorker, OEM: { LSTM_ONLY: 1 } }));
vi.mock("./image", () => ({ decodeImage }));

let recognizeText: typeof import("./ocr").recognizeText;
let loggers: Logger[];

const fakeWorker = (logger: Logger) => ({
	recognize: vi.fn(async () => {
		logger({ status: "loading language traineddata", progress: 0.9 });
		logger({ status: "recognizing text", progress: 0.5 });
		return { data: { text: "  Hello\n", confidence: 91 } };
	}),
	terminate: vi.fn(),
});

const workers = async () =>
	Promise.all(
		createWorker.mock.results.map(
			(result) => result.value as Promise<ReturnType<typeof fakeWorker>>,
		),
	);

const file = new File([""], "scan.png");

beforeEach(async () => {
	installCanvas();
	vi.resetModules();
	createWorker.mockReset();
	loggers = [];
	createWorker.mockImplementation(
		async (_language: string, _oem: number, options: { logger: Logger }) => {
			loggers.push(options.logger);
			return fakeWorker(options.logger);
		},
	);
	decodeImage.mockImplementation(async () => bitmap(400, 300));
	({ recognizeText } = await import("./ocr"));
});

describe("recognizeText", () => {
	it("returns the trimmed text and confidence", async () => {
		await expect(recognizeText(file, "eng", vi.fn())).resolves.toEqual({
			text: "Hello",
			confidence: 91,
		});
		expect(createWorker).toHaveBeenCalledWith(
			"eng",
			1,
			expect.objectContaining({
				langPath: expect.stringMatching(/tessdata$/),
				workerBlobURL: false,
				cacheMethod: "none",
			}),
		);
	});

	it("doubles small images on a white background before recognizing", async () => {
		const source = bitmap(400, 300);
		decodeImage.mockResolvedValue(source);
		await recognizeText(file, "eng", vi.fn());

		const [canvas] = canvases;
		expect([canvas?.width, canvas?.height]).toEqual([800, 600]);
		expect(canvas?.called("fillStyle=")).toEqual([["#ffffff"]]);
		const methods = canvas?.methods() ?? [];
		expect(methods.indexOf("fillRect")).toBeLessThan(
			methods.indexOf("drawImage"),
		);
		expect(canvas?.called("drawImage")).toEqual([[source, 0, 0, 800, 600]]);
		expect(source.close).toHaveBeenCalled();
		const [worker] = await workers();
		const [image] = (worker?.recognize.mock.calls[0] ?? []) as unknown[];
		expect((image as Blob).type).toBe("image/png");
	});

	it("keeps large images at their own size", async () => {
		decodeImage.mockResolvedValue(bitmap(2000, 1000));
		await recognizeText(file, "eng", vi.fn());
		expect([canvases[0]?.width, canvases[0]?.height]).toEqual([2000, 1000]);
	});

	it("reuses the worker until the language changes, then replaces it", async () => {
		await recognizeText(file, "eng", vi.fn());
		await recognizeText(file, "eng", vi.fn());
		expect(createWorker).toHaveBeenCalledTimes(1);

		await recognizeText(file, "eng+ind", vi.fn());
		expect(createWorker).toHaveBeenCalledTimes(2);
		expect(createWorker).toHaveBeenLastCalledWith(
			"eng+ind",
			1,
			expect.anything(),
		);
		const [first, second] = await workers();
		expect(first?.terminate).toHaveBeenCalled();
		expect(second?.terminate).not.toHaveBeenCalled();
	});

	it("reports recognition progress only while its own call runs", async () => {
		const onProgress = vi.fn();
		await recognizeText(file, "eng", onProgress);
		expect(onProgress).toHaveBeenCalledExactlyOnceWith(0.5);

		loggers[0]?.({ status: "recognizing text", progress: 1 });
		expect(onProgress).toHaveBeenCalledTimes(1);
	});
});
