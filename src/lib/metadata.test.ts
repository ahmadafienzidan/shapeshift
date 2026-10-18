import { describe, expect, it } from "vitest";
import { canStrip, stripMetadata } from "./metadata";

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

const u16 = (value: number) => [value >> 8, value & 0xff];

const u32 = (value: number) => [
	value >>> 24,
	(value >> 16) & 0xff,
	(value >> 8) & 0xff,
	value & 0xff,
];

const u32le = (value: number) => u32(value).reverse();

const segment = (marker: number, payload: number[]) => [
	...u16(marker),
	...u16(payload.length + 2),
	...payload,
];

// Little-endian TIFF with a single Orientation entry, as phones write it.
const exifWithOrientation = (orientation: number) => [
	...ascii("Exif\0\0"),
	...ascii("II"),
	0x2a,
	0,
	...u32le(8),
	1,
	0,
	0x12,
	0x01,
	3,
	0,
	...u32le(1),
	orientation,
	0,
	0,
	0,
	...u32le(0),
];

const strip = async (bytes: number[], type: string) =>
	new Uint8Array(
		await (
			await stripMetadata(new File([Uint8Array.from(bytes)], "x", { type }))
		).arrayBuffer(),
	);

const markers = (jpeg: Uint8Array) => {
	const found: number[] = [];
	for (let offset = 2; ; ) {
		const marker = (jpeg[offset] ?? 0) * 256 + (jpeg[offset + 1] ?? 0);
		found.push(marker);
		if (marker === 0xffda) return found;
		offset += 2 + (jpeg[offset + 2] ?? 0) * 256 + (jpeg[offset + 3] ?? 0);
	}
};

describe("stripMetadata", () => {
	const jfif = segment(0xffe0, ascii("JFIF\0\x01\x01\0\0\x01\0\x01\0\0"));
	const icc = segment(0xffe2, ascii("ICC_PROFILE\0profile"));
	const scan = [0xff, 0xda, 1, 2, 3, 0xff, 0xd9];

	it("drops EXIF, XMP and comments from a JPEG but keeps JFIF, ICC and the pixels", async () => {
		const jpeg = [
			0xff,
			0xd8,
			...jfif,
			...segment(0xffe1, ascii("http://ns.adobe.com/xap/1.0/\0<x/>")),
			...segment(0xfffe, ascii("shot on my phone")),
			...icc,
			...scan,
		];
		expect([...(await strip(jpeg, "image/jpeg"))]).toEqual([
			0xff,
			0xd8,
			...jfif,
			...icc,
			...scan,
		]);
	});

	it("keeps a sideways photo upright with a minimal Orientation block", async () => {
		const jpeg = [
			0xff,
			0xd8,
			...jfif,
			...segment(0xffe1, exifWithOrientation(6)),
			...scan,
		];
		const stripped = await strip(jpeg, "image/jpeg");
		expect(markers(stripped)).toEqual([0xffe1, 0xffe0, 0xffda]);
		// The new block is big-endian with the value right after the entry header.
		expect(new DataView(stripped.buffer).getUint16(30)).toBe(6);
		expect(stripped.length).toBe(
			jpeg.length - (exifWithOrientation(6).length + 4) + 36,
		);
	});

	it("adds nothing when the photo is already upright", async () => {
		const jpeg = [
			0xff,
			0xd8,
			...segment(0xffe1, exifWithOrientation(1)),
			...scan,
		];
		expect([...(await strip(jpeg, "image/jpeg"))]).toEqual([
			0xff,
			0xd8,
			...scan,
		]);
	});

	it("drops text, time and EXIF chunks from a PNG", async () => {
		const chunk = (type: string, data: number[]) => [
			...u32(data.length),
			...ascii(type),
			...data,
			0,
			0,
			0,
			0,
		];
		const signature = [0x89, ...ascii("PNG\r\n\x1a\n")];
		const header = chunk("IHDR", Array(13).fill(1));
		const data = chunk("IDAT", [9, 9, 9]);
		const end = chunk("IEND", []);
		const png = [
			...signature,
			...header,
			...chunk("tEXt", ascii("Author\0me")),
			...chunk("eXIf", [1, 2]),
			...chunk("tIME", Array(7).fill(0)),
			...data,
			...end,
		];
		expect([...(await strip(png, "image/png"))]).toEqual([
			...signature,
			...header,
			...data,
			...end,
		]);
	});

	it("drops EXIF and XMP from a WebP and clears their VP8X flags", async () => {
		const chunk = (type: string, data: number[]) => [
			...ascii(type),
			...u32le(data.length),
			...data,
			...(data.length % 2 ? [0] : []),
		];
		const vp8x = (flags: number) =>
			chunk("VP8X", [flags, 0, 0, 0, 1, 0, 0, 1, 0, 0]);
		const image = chunk("VP8 ", [7, 7, 7]);
		const webp = (body: number[]) => [
			...ascii("RIFF"),
			...u32le(body.length + 4),
			...ascii("WEBP"),
			...body,
		];
		const input = webp([
			...vp8x(0b1100),
			...image,
			...chunk("EXIF", [1, 2, 3]),
			...chunk("XMP ", [4, 5]),
		]);
		expect([...(await strip(input, "image/webp"))]).toEqual(
			webp([...vp8x(0), ...image]),
		);
	});

	it("refuses formats it cannot clean without re-encoding", async () => {
		await expect(strip(ascii("GIF89a"), "image/gif")).rejects.toThrow();
		expect(canStrip(new File([], "photo.JPG"))).toBe(true);
		expect(canStrip(new File([], "anim.gif", { type: "image/gif" }))).toBe(
			false,
		);
	});
});
