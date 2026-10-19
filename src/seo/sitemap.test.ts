import { describe, expect, it } from "vitest";
import { PAGES, pageUrl, SITE_URL } from "./routes";
import { robots, sitemap } from "./sitemap";

describe("sitemap", () => {
	const xml = sitemap();
	const urls = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map(([url]) => url);

	it("is a sitemap with the xhtml namespace for language alternates", () => {
		expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
		expect(xml).toContain(
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		);
	});

	it("lists every page once per language", () => {
		expect(urls).toHaveLength(PAGES.length * 2);
		const locs = urls.map((url) => url.match(/<loc>(.*)<\/loc>/)?.[1]);
		expect(new Set(locs)).toEqual(
			new Set(
				PAGES.flatMap((page) => [pageUrl(page, "en"), pageUrl(page, "id")]),
			),
		);
	});

	it("gives each URL its English, Indonesian, and default alternates", () => {
		const entry = urls.find((url) =>
			url.includes(`<loc>${SITE_URL}id/compress</loc>`),
		);
		expect(entry).toContain(
			`<xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}compress" />`,
		);
		expect(entry).toContain(
			`<xhtml:link rel="alternate" hreflang="id" href="${SITE_URL}id/compress" />`,
		);
		expect(entry).toContain(
			`<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}compress" />`,
		);
	});
});

describe("robots", () => {
	it("allows crawling and points to the sitemap", () => {
		expect(robots()).toBe(
			`User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`,
		);
	});
});
