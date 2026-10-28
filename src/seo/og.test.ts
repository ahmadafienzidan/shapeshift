import { describe, expect, it } from "vitest";
import { ogCard, ogImage } from "./og";

const texts = (node: unknown): string[] => {
	if (typeof node === "string") return [node];
	if (Array.isArray(node)) return node.flatMap(texts);
	if (node && typeof node === "object" && "props" in node)
		return texts((node as { props: { children?: unknown } }).props.children);
	return [];
};

describe("ogCard", () => {
	it("shows the tool name, its summary, and the tagline", () => {
		expect(texts(ogCard("compress", "id"))).toEqual(
			expect.arrayContaining([
				"Shapeshift",
				"Kompres",
				"Perkecil ukuran file, batasi dimensi, dan hapus metadata EXIF seperti lokasi GPS.",
				"Gratis · Tanpa upload · Jalan di browser",
			]),
		);
	});

	it("headlines the home page with its search title", () => {
		expect(texts(ogCard("home", "en"))).toContain(
			"Free Private File Tools, No Upload",
		);
	});
});

describe("ogImage", () => {
	it("renders a 1200×630 PNG", async () => {
		const png = await ogImage("compress", "en");
		expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
		const header = new DataView(png.buffer, png.byteOffset + 16, 8);
		expect([header.getUint32(0), header.getUint32(4)]).toEqual([1200, 630]);
	});
});
