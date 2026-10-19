import { vi } from "vitest";

export type Call = { method: string; args: unknown[] };

export type FakeBitmap = ImageBitmap & {
	source?: FakeCanvas;
	pixels?: Uint8ClampedArray;
};

// Tests run in Node, which has no canvas. This stand-in records every context
// call (and property assignment, as "name=") so tests can check what was
// drawn. Only a few calls touch `pixels`: getImageData/putImageData read and
// write the whole canvas, a same-size drawImage copies a source's pixels, and
// fillText paints one opaque pixel at its anchor point.
export class FakeCanvas {
	calls: Call[] = [];
	pixels: Uint8ClampedArray;

	constructor(
		public width: number,
		public height: number,
	) {
		this.pixels = new Uint8ClampedArray(width * height * 4);
		canvases.push(this);
	}

	getContext() {
		return createContext(this);
	}

	async convertToBlob(options?: ImageEncodeOptions) {
		this.calls.push({ method: "convertToBlob", args: [options] });
		return new Blob([`${this.width}x${this.height}`], {
			type: options?.type ?? "image/png",
		});
	}

	called(method: string): unknown[][] {
		return this.calls
			.filter((call) => call.method === method)
			.map((call) => call.args);
	}

	methods(): string[] {
		return this.calls.map((call) => call.method);
	}
}

export const canvases: FakeCanvas[] = [];

export function bitmap(
	width: number,
	height: number,
	extra: Partial<FakeBitmap> = {},
): FakeBitmap {
	return { width, height, close: vi.fn(), ...extra } as FakeBitmap;
}

export function installCanvas() {
	canvases.length = 0;
	vi.stubGlobal("OffscreenCanvas", FakeCanvas);
	vi.stubGlobal("createImageBitmap", async (source: FakeCanvas) =>
		bitmap(source.width, source.height, { source }),
	);
}

function fontSize(font: unknown) {
	return Number(String(font).match(/(\d+(?:\.\d+)?)px/)?.[1] ?? 10);
}

function createContext(canvas: FakeCanvas) {
	const state: Record<string | symbol, unknown> = {
		canvas,
		fillStyle: "#000000",
		font: "10px sans-serif",
		globalAlpha: 1,
	};
	const behaviour: Record<string, (...args: never[]) => unknown> = {
		measureText: (text: string) => ({
			width: text.length * fontSize(state.font) * 0.5,
		}),
		getImageData: () => ({
			data: canvas.pixels,
			width: canvas.width,
			height: canvas.height,
		}),
		putImageData: (image: ImageData) => {
			canvas.pixels = new Uint8ClampedArray(image.data);
		},
		drawImage: (source: FakeBitmap) => {
			if (
				source.pixels &&
				source.width === canvas.width &&
				source.height === canvas.height
			) {
				canvas.pixels.set(source.pixels);
			}
		},
		fillText: (_text: string, x: number, y: number) => {
			const index = (Math.round(y) * canvas.width + Math.round(x)) * 4;
			canvas.pixels[index + 3] = 255;
		},
	};
	return new Proxy(state, {
		get(target, key) {
			if (key in target) return target[key];
			return (...args: never[]) => {
				canvas.calls.push({ method: String(key), args });
				return behaviour[String(key)]?.(...args);
			};
		},
		set(target, key, value) {
			target[key] = value;
			canvas.calls.push({ method: `${String(key)}=`, args: [value] });
			return true;
		},
	}) as unknown as OffscreenCanvasRenderingContext2D;
}
