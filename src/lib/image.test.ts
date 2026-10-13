import { describe, expect, it } from "vitest";
import {
	isHeic,
	isImage,
	isSvg,
	renameExtension,
	resolveFormat,
} from "./image";

const file = (name: string, type = "") => new File([""], name, { type });

describe("file detection", () => {
	it("recognizes HEIC by name or type, since browsers often leave the type empty", () => {
		expect(isHeic(file("IMG_0001.HEIC"))).toBe(true);
		expect(isHeic(file("photo", "image/heif"))).toBe(true);
		expect(isImage(file("IMG_0001.heic"))).toBe(true);
		expect(isImage(file("notes.txt", "text/plain"))).toBe(false);
		expect(isSvg(file("logo.svg"))).toBe(true);
	});
});

describe("renameExtension", () => {
	it("swaps only the last extension", () => {
		expect(renameExtension("trip.2024.heic", "image/jpeg")).toBe(
			"trip.2024.jpg",
		);
		expect(renameExtension("scan", "image/webp")).toBe("scan.webp");
	});
});

describe("resolveFormat", () => {
	it("keeps encodable formats and falls back to PNG for SVG, JPG otherwise", () => {
		expect(resolveFormat(file("a.webp", "image/webp"), "original")).toBe(
			"image/webp",
		);
		expect(resolveFormat(file("a.svg", "image/svg+xml"), "original")).toBe(
			"image/png",
		);
		expect(resolveFormat(file("a.heic"), "original")).toBe("image/jpeg");
		expect(resolveFormat(file("a.png", "image/png"), "image/jpeg")).toBe(
			"image/jpeg",
		);
	});
});
