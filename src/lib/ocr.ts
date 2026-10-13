import { createWorker, OEM, type Worker } from "tesseract.js";
import workerPath from "tesseract.js/dist/worker.min.js?url";
import corePath from "tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url";
import { decodeImage } from "./image";

export type OcrLanguage = "eng" | "ind" | "eng+ind";

export type OcrResult = { text: string; confidence: number };

let loaded: { language: OcrLanguage; worker: Promise<Worker> } | undefined;
let onRecognizing: ((progress: number) => void) | undefined;

// One worker is kept alive and only rebuilt when the language changes, since
// loading the engine and models is far slower than recognizing an image.
function getWorker(language: OcrLanguage): Promise<Worker> {
	if (loaded?.language !== language) {
		void loaded?.worker.then((worker) => worker.terminate());
		loaded = {
			language,
			worker: createWorker(language, OEM.LSTM_ONLY, {
				workerPath,
				corePath,
				// Served by the tessdata plugin in vite.config.ts.
				langPath: `${import.meta.env.BASE_URL}tessdata`,
				workerBlobURL: false,
				cacheMethod: "none",
				logger: (message) => {
					if (message.status === "recognizing text") {
						onRecognizing?.(message.progress);
					}
				},
			}),
		};
	}
	return loaded.worker;
}

// Calls must not overlap: progress is reported through the shared worker.
export async function recognizeText(
	file: File,
	language: OcrLanguage,
	onProgress: (progress: number) => void,
): Promise<OcrResult> {
	const [worker, bitmap] = await Promise.all([
		getWorker(language),
		decodeImage(file),
	]);
	// Tesseract misses small text, so small screenshots are upscaled.
	const scale = Math.max(bitmap.width, bitmap.height) < 1500 ? 2 : 1;
	const canvas = new OffscreenCanvas(
		bitmap.width * scale,
		bitmap.height * scale,
	);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");
	// Transparent pixels would otherwise read as black, hiding dark text.
	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.imageSmoothingQuality = "high";
	context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();

	onRecognizing = onProgress;
	try {
		const { data } = await worker.recognize(
			await canvas.convertToBlob({ type: "image/png" }),
		);
		return { text: data.text.trim(), confidence: data.confidence };
	} finally {
		onRecognizing = undefined;
	}
}
