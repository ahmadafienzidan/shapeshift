import { describe, expect, it } from "vitest";
import { redirectTarget } from "./redirect";

describe("redirectTarget", () => {
	it("sends people who chose Indonesian from English URLs to /id", () => {
		expect(redirectTarget("/compress", "", "id", "en-US")).toBe("/id/compress");
		expect(redirectTarget("/", "", "id", "en-US")).toBe("/id");
	});

	it("sends Indonesian browsers with no stored choice to /id", () => {
		expect(redirectTarget("/compress", "", null, "id-ID")).toBe("/id/compress");
		expect(redirectTarget("/compress", "", null, "id")).toBe("/id/compress");
	});

	it("leaves English URLs alone for everyone else", () => {
		expect(redirectTarget("/compress", "", null, "en-US")).toBeNull();
		expect(redirectTarget("/compress", "", "en", "id-ID")).toBeNull();
	});

	it("leaves /id only after an explicit choice of English", () => {
		expect(redirectTarget("/id/compress", "", "en", "id-ID")).toBe("/compress");
		expect(redirectTarget("/id/compress", "", null, "en-US")).toBeNull();
		expect(redirectTarget("/id/compress", "", "id", "en-US")).toBeNull();
	});

	it("never moves the English-only Open page", () => {
		expect(redirectTarget("/open", "?shared", "id", "id-ID")).toBeNull();
	});

	it("keeps the query string", () => {
		expect(redirectTarget("/pdf", "?mode=sign", "id", "en-US")).toBe(
			"/id/pdf?mode=sign",
		);
		expect(redirectTarget("/id/pdf", "?mode=sign", "en", "en-US")).toBe(
			"/pdf?mode=sign",
		);
	});
});
