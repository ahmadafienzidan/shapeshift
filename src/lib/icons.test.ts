import { beforeEach, describe, expect, it } from "vitest";
import { bitmap, canvases, installCanvas } from "../test/canvas";
import { generateIcons, type IconOptions, iconSnippet } from "./icons";

beforeEach(installCanvas);

const options = (extra: Partial<IconOptions> = {}): IconOptions => ({
	background: null,
	padding: 0.1,
	radius: 0.5,
	name: "Shapeshift",
	themeColor: "#001e2b",
	...extra,
});

const generate = async (extra: Partial<IconOptions> = {}) => {
	const outputs = await generateIcons(bitmap(200, 100), options(extra));
	return Object.fromEntries(outputs.map(({ name, blob }) => [name, blob]));
};

const canvasOf = (size: number) =>
	canvases.find((canvas) => canvas.width === size);

describe("generateIcons", () => {
	it("produces the favicon set, touch and Android icons, and a manifest", async () => {
		const outputs = await generateIcons(bitmap(200, 100), options());
		expect(outputs.map(({ name }) => name)).toEqual([
			"favicon.ico",
			"favicon-16x16.png",
			"favicon-32x32.png",
			"apple-touch-icon.png",
			"android-chrome-192x192.png",
			"android-chrome-512x512.png",
			"site.webmanifest",
		]);
		expect(canvases.map((canvas) => canvas.width)).toEqual([
			16, 32, 180, 192, 512, 16, 32, 48,
		]);
	});

	it("centres the image inside the padding and rounds the corners", async () => {
		const source = bitmap(200, 100);
		await generateIcons(source, options());
		const canvas = canvasOf(512);
		expect(canvas?.called("roundRect")).toEqual([[0, 0, 512, 512, 128]]);
		expect(canvas?.called("clip")).toHaveLength(1);
		const [drawn, ...box] = canvas?.called("drawImage")[0] ?? [];
		expect(drawn).toBe(source);
		for (const [actual, expected] of box.map((value, index) => [
			value,
			[51.2, 153.6, 409.6, 204.8][index],
		]))
			expect(actual).toBeCloseTo(Number(expected));
	});

	it("keeps icons transparent except the opaque Apple touch icon", async () => {
		await generate();
		expect(canvasOf(192)?.called("fill")).toEqual([]);
		expect(canvasOf(180)?.called("fillStyle=")).toEqual([["#ffffff"]]);
		expect(canvasOf(180)?.called("fill")).toHaveLength(1);
	});

	it("fills every icon with the chosen background", async () => {
		await generate({ background: "#ff8800" });
		for (const canvas of canvases)
			expect(canvas.called("fillStyle=")).toEqual([["#ff8800"]]);
	});

	it("packs 16, 32, and 48px PNGs into the ICO directory", async () => {
		const ico = (await generate())["favicon.ico"];
		expect(ico?.type).toBe("image/x-icon");
		const bytes = new Uint8Array((await ico?.arrayBuffer()) ?? []);
		const view = new DataView(bytes.buffer);
		expect([view.getUint16(0, true), view.getUint16(2, true)]).toEqual([0, 1]);
		expect(view.getUint16(4, true)).toBe(3);

		// The fake canvas encodes each PNG as its "WxH" text, five bytes here.
		const entries = [0, 1, 2].map((index) => {
			const entry = 6 + index * 16;
			return [
				view.getUint8(entry),
				view.getUint8(entry + 1),
				view.getUint16(entry + 4, true),
				view.getUint16(entry + 6, true),
				view.getUint32(entry + 8, true),
				view.getUint32(entry + 12, true),
			];
		});
		expect(entries).toEqual([
			[16, 16, 1, 32, 5, 54],
			[32, 32, 1, 32, 5, 59],
			[48, 48, 1, 32, 5, 64],
		]);
		expect(new TextDecoder().decode(bytes.slice(54))).toBe("16x1632x3248x48");
	});

	it("writes a manifest naming the Android icons and colors", async () => {
		const manifest = (await generate())["site.webmanifest"];
		expect(manifest?.type).toBe("application/manifest+json");
		expect(JSON.parse((await manifest?.text()) ?? "")).toEqual({
			name: "Shapeshift",
			short_name: "Shapeshift",
			icons: [
				{
					src: "/android-chrome-192x192.png",
					sizes: "192x192",
					type: "image/png",
				},
				{
					src: "/android-chrome-512x512.png",
					sizes: "512x512",
					type: "image/png",
				},
			],
			theme_color: "#001e2b",
			background_color: "#ffffff",
			display: "standalone",
		});
	});

	it("uses the icon background as the manifest background", async () => {
		const manifest = (await generate({ background: "#ff8800" }))[
			"site.webmanifest"
		];
		expect(JSON.parse((await manifest?.text()) ?? "").background_color).toBe(
			"#ff8800",
		);
	});
});

describe("iconSnippet", () => {
	it("links every generated file and sets the theme color", () => {
		const snippet = iconSnippet("#001e2b");
		for (const file of [
			"/favicon.ico",
			"/favicon-32x32.png",
			"/favicon-16x16.png",
			"/apple-touch-icon.png",
			"/site.webmanifest",
		])
			expect(snippet).toContain(`href="${file}"`);
		expect(snippet).toContain('<meta name="theme-color" content="#001e2b">');
	});
});
