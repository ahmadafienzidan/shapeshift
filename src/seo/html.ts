import type { Locale } from "../i18n/locale";
import {
	OG_HEIGHT,
	OG_WIDTH,
	ogImageUrl,
	PAGES,
	type Page,
	pageUrl,
} from "./routes";
import {
	pageHeading,
	pageName,
	pageSummary,
	seoDescription,
	seoTitle,
} from "./text";

const OG_LOCALES: Record<Locale, string> = { en: "en_US", id: "id_ID" };

const escapeHtml = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

function headTags(page: Page, locale: Locale): string {
	const title = escapeHtml(seoTitle(locale, page));
	const description = escapeHtml(seoDescription(locale, page));
	const url = pageUrl(page, locale);
	const image = ogImageUrl(page, locale);
	return [
		`<title>${title}</title>`,
		`<meta name="description" content="${description}" />`,
		`<link rel="canonical" href="${url}" />`,
		`<link rel="alternate" hreflang="en" href="${pageUrl(page, "en")}" />`,
		`<link rel="alternate" hreflang="id" href="${pageUrl(page, "id")}" />`,
		`<link rel="alternate" hreflang="x-default" href="${pageUrl(page, "en")}" />`,
		'<meta property="og:type" content="website" />',
		'<meta property="og:site_name" content="Shapeshift" />',
		`<meta property="og:locale" content="${OG_LOCALES[locale]}" />`,
		`<meta property="og:url" content="${url}" />`,
		`<meta property="og:title" content="${title}" />`,
		`<meta property="og:description" content="${description}" />`,
		`<meta property="og:image" content="${image}" />`,
		`<meta property="og:image:width" content="${OG_WIDTH}" />`,
		`<meta property="og:image:height" content="${OG_HEIGHT}" />`,
		`<meta property="og:image:alt" content="${title}" />`,
		'<meta name="twitter:card" content="summary_large_image" />',
		`<meta name="twitter:title" content="${title}" />`,
		`<meta name="twitter:description" content="${description}" />`,
		`<meta name="twitter:image" content="${image}" />`,
	].join("\n\t\t");
}

// Plain, visible content for crawlers; React replaces it once the app loads.
function body(page: Page, locale: Locale): string {
	const links = PAGES.filter((other) => other !== page)
		.map(
			(other) =>
				`<li><a href="${pageUrl(other, locale)}">${escapeHtml(pageName(locale, other))}</a></li>`,
		)
		.join("");
	return `<div id="root"><main><h1>${escapeHtml(pageHeading(locale, page))}</h1><p>${escapeHtml(pageSummary(locale, page))}</p><nav><ul>${links}</ul></nav></main></div>`;
}

function replaceOnce(html: string, part: string, replacement: string): string {
	if (!html.includes(part))
		throw new Error(`Prerender template is missing ${part}`);
	return html.replace(part, () => replacement);
}

export function renderPage(
	template: string,
	page: Page,
	locale: Locale,
): string {
	let html = replaceOnce(
		template,
		'<html lang="en">',
		`<html lang="${locale}">`,
	);
	html = replaceOnce(html, "<title>Shapeshift</title>", headTags(page, locale));
	return replaceOnce(html, '<div id="root"></div>', body(page, locale));
}
