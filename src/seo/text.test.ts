import { describe, expect, it } from "vitest";
import { PAGES } from "./routes";
import { seoDescription, seoTitle, text } from "./text";

const LOCALES = ["en", "id"] as const;
const META_PAGES = [...PAGES, "open"] as const;

describe("text", () => {
	it("returns the message for a locale", () => {
		expect(text("en", "tool.compress.name")).toBe("Compress");
		expect(text("id", "tool.compress.name")).toBe("Kompres");
	});

	it("throws on a missing message instead of falling back", () => {
		expect(() => text("id", "seo.nope.title")).toThrow(
			'Missing message "seo.nope.title" for locale "id"',
		);
	});
});

describe("SEO copy", () => {
	it("gives every page a title that fits in search results", () => {
		for (const locale of LOCALES)
			for (const page of META_PAGES) {
				const title = seoTitle(locale, page);
				expect(title).toMatch(/ \| Shapeshift$/);
				expect(title.length, `${locale} ${page}: ${title}`).toBeLessThanOrEqual(
					60,
				);
			}
	});

	it("gives every page a description of at most 160 characters", () => {
		for (const locale of LOCALES)
			for (const page of META_PAGES) {
				const description = seoDescription(locale, page);
				expect(description.length, `${locale} ${page}`).toBeGreaterThan(0);
				expect(
					description.length,
					`${locale} ${page}: ${description}`,
				).toBeLessThanOrEqual(160);
			}
	});

	it("writes different copy for each language", () => {
		for (const page of META_PAGES)
			expect(seoTitle("id", page)).not.toBe(seoTitle("en", page));
	});
});
