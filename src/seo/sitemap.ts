import { PAGES, pageUrl, SITE_URL } from "./routes";

export function sitemap(): string {
	const entries = PAGES.flatMap((page) => {
		const alternates = [
			`<xhtml:link rel="alternate" hreflang="en" href="${pageUrl(page, "en")}" />`,
			`<xhtml:link rel="alternate" hreflang="id" href="${pageUrl(page, "id")}" />`,
			`<xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(page, "en")}" />`,
		].join("\n\t\t");
		return (["en", "id"] as const).map(
			(locale) =>
				`\t<url>\n\t\t<loc>${pageUrl(page, locale)}</loc>\n\t\t${alternates}\n\t</url>`,
		);
	});
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...entries,
		"</urlset>",
		"",
	].join("\n");
}

export function robots(): string {
	return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`;
}
