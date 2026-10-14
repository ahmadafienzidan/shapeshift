import { describe, expect, it } from "vitest";
import { search } from "./search";

const ENTRIES = [
	{ names: ["Image Converter", "Konversi Gambar"], keywords: "heic jpg" },
	{ names: ["Resize Image", "Ubah Ukuran"], keywords: "tanpa mengubah warna" },
	{ names: ["Compress", "Kompres"], keywords: "images" },
	{ names: ["Compress", "Kompres"], keywords: "pdf" },
	{ names: ["Color", "Warna"], keywords: "palette" },
];

const found = (query: string) =>
	search(ENTRIES, query).map((entry) => ENTRIES.indexOf(entry));

describe("search", () => {
	it("returns everything for an empty query", () => {
		expect(found("  ")).toEqual([0, 1, 2, 3, 4]);
	});

	it("requires every word and ignores case and accents", () => {
		expect(found("COMPRESS pdf")).toEqual([3]);
		expect(found("cölor")).toEqual([4]);
	});

	it("ranks a name in either language above keyword matches", () => {
		expect(found("warna")).toEqual([4, 1]);
		expect(found("ukuran")).toEqual([1]);
	});

	it("ranks names starting with the query first", () => {
		expect(found("gambar")).toEqual([0]);
		expect(found("im")).toEqual([0, 1, 2]);
	});
});
