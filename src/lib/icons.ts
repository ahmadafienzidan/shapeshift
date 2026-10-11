import type { BatchOutput } from "./useBatch";

export type IconOptions = {
	background: string | null;
	padding: number;
	radius: number;
	name: string;
	themeColor: string;
};

type PngIcon = { file: string; size: number; opaque?: boolean };

const PNG_ICONS: PngIcon[] = [
	{ file: "favicon-16x16.png", size: 16 },
	{ file: "favicon-32x32.png", size: 32 },
	// iOS fills transparent areas with black, so the touch icon is always opaque.
	{ file: "apple-touch-icon.png", size: 180, opaque: true },
	{ file: "android-chrome-192x192.png", size: 192 },
	{ file: "android-chrome-512x512.png", size: 512 },
];

const ICO_SIZES = [16, 32, 48];

async function renderIcon(
	source: ImageBitmap,
	size: number,
	options: IconOptions,
	opaque = false,
): Promise<Blob> {
	const canvas = new OffscreenCanvas(size, size);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D context is unavailable");

	const background = options.background ?? (opaque ? "#ffffff" : null);
	const radius = (size / 2) * options.radius;

	context.beginPath();
	context.roundRect(0, 0, size, size, radius);
	if (background) {
		context.fillStyle = background;
		context.fill();
	}
	context.clip();

	const inner = size * (1 - options.padding * 2);
	const scale = inner / Math.max(source.width, source.height);
	const width = source.width * scale;
	const height = source.height * scale;
	context.imageSmoothingQuality = "high";
	context.drawImage(
		source,
		(size - width) / 2,
		(size - height) / 2,
		width,
		height,
	);
	return canvas.convertToBlob({ type: "image/png" });
}

// ICO files can embed PNG data directly: a 6-byte header, one 16-byte
// directory entry per image, then the PNG bytes back to back.
async function createIco(images: { size: number; png: Blob }[]): Promise<Blob> {
	const header = new DataView(new ArrayBuffer(6 + images.length * 16));
	header.setUint16(2, 1, true);
	header.setUint16(4, images.length, true);

	let offset = header.byteLength;
	images.forEach(({ size, png }, index) => {
		const entry = 6 + index * 16;
		header.setUint8(entry, size >= 256 ? 0 : size);
		header.setUint8(entry + 1, size >= 256 ? 0 : size);
		header.setUint16(entry + 4, 1, true);
		header.setUint16(entry + 6, 32, true);
		header.setUint32(entry + 8, png.size, true);
		header.setUint32(entry + 12, offset, true);
		offset += png.size;
	});

	return new Blob([header.buffer, ...images.map(({ png }) => png)], {
		type: "image/x-icon",
	});
}

function manifest(options: IconOptions): Blob {
	const json = {
		name: options.name,
		short_name: options.name,
		icons: [192, 512].map((size) => ({
			src: `/android-chrome-${size}x${size}.png`,
			sizes: `${size}x${size}`,
			type: "image/png",
		})),
		theme_color: options.themeColor,
		background_color: options.background ?? "#ffffff",
		display: "standalone",
	};
	return new Blob([`${JSON.stringify(json, null, 2)}\n`], {
		type: "application/manifest+json",
	});
}

export async function generateIcons(
	source: ImageBitmap,
	options: IconOptions,
): Promise<BatchOutput[]> {
	const pngs = await Promise.all(
		PNG_ICONS.map(async (icon) => ({
			name: icon.file,
			blob: await renderIcon(source, icon.size, options, icon.opaque),
		})),
	);
	const ico = await createIco(
		await Promise.all(
			ICO_SIZES.map(async (size) => ({
				size,
				png: await renderIcon(source, size, options),
			})),
		),
	);
	return [
		{ name: "favicon.ico", blob: ico },
		...pngs,
		{ name: "site.webmanifest", blob: manifest(options) },
	];
}

export function iconSnippet(themeColor: string): string {
	return [
		'<link rel="icon" href="/favicon.ico" sizes="48x48">',
		'<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
		'<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
		'<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
		'<link rel="manifest" href="/site.webmanifest">',
		`<meta name="theme-color" content="${themeColor}">`,
	].join("\n");
}
