import { decodeImage } from "./image";

export type Rgb = { r: number; g: number; b: number; a: number };

const probe = new OffscreenCanvas(1, 1).getContext("2d", {
	willReadFrequently: true,
});

// The browser's own CSS parser understands every colour syntax (names, hex,
// rgb, hsl, oklch, color()), so it is asked to paint one pixel and that pixel
// is read back.
export function parseColor(input: string): Rgb | undefined {
	const value = input.trim();
	if (!value || !CSS.supports("color", value) || !probe) return undefined;
	probe.clearRect(0, 0, 1, 1);
	probe.fillStyle = value;
	probe.fillRect(0, 0, 1, 1);
	const [r = 0, g = 0, b = 0, a = 0] = probe.getImageData(0, 0, 1, 1).data;
	return { r, g, b, a: Math.round((a / 255) * 100) / 100 };
}

const hex2 = (value: number) => value.toString(16).padStart(2, "0");

export function toHex({ r, g, b, a }: Rgb): string {
	const alpha = a < 1 ? hex2(Math.round(a * 255)) : "";
	return `#${hex2(r)}${hex2(g)}${hex2(b)}${alpha}`;
}

export function toRgbString({ r, g, b, a }: Rgb): string {
	return a < 1 ? `rgb(${r} ${g} ${b} / ${a})` : `rgb(${r} ${g} ${b})`;
}

export function toHsl({ r, g, b, a }: Rgb): string {
	const [rn, gn, bn] = [r / 255, g / 255, b / 255];
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const lightness = (max + min) / 2;
	const delta = max - min;
	let hue = 0;
	let saturation = 0;
	if (delta !== 0) {
		saturation = delta / (1 - Math.abs(2 * lightness - 1));
		if (max === rn) hue = ((gn - bn) / delta) % 6;
		else if (max === gn) hue = (bn - rn) / delta + 2;
		else hue = (rn - gn) / delta + 4;
		hue = (hue * 60 + 360) % 360;
	}
	const body = `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
	return a < 1 ? `hsl(${body} / ${a})` : `hsl(${body})`;
}

const toLinear = (channel: number) => {
	const c = channel / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (channel: number) => {
	const c =
		channel <= 0.0031308
			? channel * 12.92
			: 1.055 * channel ** (1 / 2.4) - 0.055;
	return Math.round(Math.min(1, Math.max(0, c)) * 255);
};

type Oklch = { l: number; c: number; h: number };

export function rgbToOklch({ r, g, b }: Rgb): Oklch {
	const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
	const l = Math.cbrt(
		0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
	);
	const m = Math.cbrt(
		0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
	);
	const s = Math.cbrt(
		0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
	);
	const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const aAxis = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	return {
		l: lightness,
		c: Math.hypot(aAxis, bAxis),
		h: ((Math.atan2(bAxis, aAxis) * 180) / Math.PI + 360) % 360,
	};
}

function oklchToLinear({ l, c, h }: Oklch): [number, number, number] {
	const radians = (h * Math.PI) / 180;
	const aAxis = c * Math.cos(radians);
	const bAxis = c * Math.sin(radians);
	const lp = (l + 0.3963377774 * aAxis + 0.2158037573 * bAxis) ** 3;
	const mp = (l - 0.1055613458 * aAxis - 0.0638541728 * bAxis) ** 3;
	const sp = (l - 0.0894841775 * aAxis - 1.291485548 * bAxis) ** 3;
	return [
		4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp,
		-1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp,
		-0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp,
	];
}

// Lowers chroma until the colour fits in sRGB, keeping lightness and hue.
export function oklchToRgb(color: Oklch): Rgb {
	let chroma = color.c;
	let linear = oklchToLinear(color);
	while (chroma > 0 && linear.some((channel) => channel < 0 || channel > 1)) {
		chroma = Math.max(0, chroma - 0.005);
		linear = oklchToLinear({ ...color, c: chroma });
	}
	const [r, g, b] = linear.map(fromLinear) as [number, number, number];
	return { r, g, b, a: 1 };
}

export function toOklchString(rgb: Rgb): string {
	const { l, c, h } = rgbToOklch(rgb);
	const body = `${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${c < 0.0005 ? 0 : h.toFixed(1)}`;
	return rgb.a < 1 ? `oklch(${body} / ${rgb.a})` : `oklch(${body})`;
}

export function toCmyk({ r, g, b }: Rgb): string {
	const k = 1 - Math.max(r, g, b) / 255;
	if (k === 1) return "cmyk(0%, 0%, 0%, 100%)";
	const channel = (value: number) =>
		Math.round(((1 - value / 255 - k) / (1 - k)) * 100);
	return `cmyk(${channel(r)}%, ${channel(g)}%, ${channel(b)}%, ${Math.round(k * 100)}%)`;
}

function luminance({ r, g, b }: Rgb): number {
	return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(foreground: Rgb, background: Rgb): number {
	const [light, dark] = [luminance(foreground), luminance(background)].sort(
		(x, y) => y - x,
	) as [number, number];
	return (light + 0.05) / (dark + 0.05);
}

const SHADE_LIGHTNESS: [string, number][] = [
	["50", 0.97],
	["100", 0.94],
	["200", 0.88],
	["300", 0.8],
	["400", 0.71],
	["500", 0.62],
	["600", 0.53],
	["700", 0.45],
	["800", 0.37],
	["900", 0.29],
	["950", 0.21],
];

export function shades(rgb: Rgb): { name: string; rgb: Rgb }[] {
	const { c, h } = rgbToOklch(rgb);
	return SHADE_LIGHTNESS.map(([name, l]) => ({
		name,
		// Very light and very dark shades cannot hold much chroma.
		rgb: oklchToRgb({ l, c: c * (1 - Math.abs(l - 0.6) * 0.9), h }),
	}));
}

export type PaletteColor = { rgb: Rgb; share: number };

const SAMPLE_SIZE = 120;

export async function extractPalette(
	file: File,
	count: number,
): Promise<PaletteColor[]> {
	const bitmap = await decodeImage(file);
	const scale = Math.min(
		1,
		SAMPLE_SIZE / Math.max(bitmap.width, bitmap.height),
	);
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) throw new Error("Canvas 2D context is unavailable");
	context.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();
	const data = context.getImageData(0, 0, width, height).data;

	const pixels: [number, number, number][] = [];
	for (let index = 0; index < data.length; index += 4) {
		if ((data[index + 3] ?? 0) < 128) continue;
		pixels.push([data[index] ?? 0, data[index + 1] ?? 0, data[index + 2] ?? 0]);
	}
	if (pixels.length === 0) return [];

	const distance = (p: number[], q: number[]) =>
		((p[0] ?? 0) - (q[0] ?? 0)) ** 2 +
		((p[1] ?? 0) - (q[1] ?? 0)) ** 2 +
		((p[2] ?? 0) - (q[2] ?? 0)) ** 2;

	// Deterministic farthest-point seeding so the same photo always gives the
	// same palette.
	const centers: number[][] = [
		pixels[Math.floor(pixels.length / 2)] ?? [0, 0, 0],
	];
	while (centers.length < Math.min(count, pixels.length)) {
		let farthest = pixels[0] ?? [0, 0, 0];
		let best = -1;
		for (const pixel of pixels) {
			const nearest = Math.min(
				...centers.map((center) => distance(pixel, center)),
			);
			if (nearest > best) {
				best = nearest;
				farthest = pixel;
			}
		}
		centers.push([...farthest]);
	}

	const assignment = new Array<number>(pixels.length).fill(0);
	for (let iteration = 0; iteration < 12; iteration++) {
		pixels.forEach((pixel, index) => {
			let nearest = 0;
			let best = Number.POSITIVE_INFINITY;
			centers.forEach((center, centerIndex) => {
				const d = distance(pixel, center);
				if (d < best) {
					best = d;
					nearest = centerIndex;
				}
			});
			assignment[index] = nearest;
		});
		const sums = centers.map(() => [0, 0, 0, 0]);
		pixels.forEach((pixel, index) => {
			const sum = sums[assignment[index] ?? 0];
			if (!sum) return;
			sum[0] = (sum[0] ?? 0) + pixel[0];
			sum[1] = (sum[1] ?? 0) + pixel[1];
			sum[2] = (sum[2] ?? 0) + pixel[2];
			sum[3] = (sum[3] ?? 0) + 1;
		});
		sums.forEach(([r = 0, g = 0, b = 0, n = 0], index) => {
			if (n > 0) centers[index] = [r / n, g / n, b / n];
		});
	}

	const totals = centers.map(
		(_, index) => assignment.filter((value) => value === index).length,
	);
	return centers
		.map((center, index) => ({
			rgb: {
				r: Math.round(center[0] ?? 0),
				g: Math.round(center[1] ?? 0),
				b: Math.round(center[2] ?? 0),
				a: 1,
			},
			share: (totals[index] ?? 0) / pixels.length,
		}))
		.filter((color) => color.share > 0)
		.sort((x, y) => y.share - x.share);
}
