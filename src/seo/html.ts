import type { Locale } from "../i18n/locale";
import { PAGES, type Page, pageUrl } from "./routes";
import { seoDescription, seoTitle, text } from "./text";

const OG_LOCALES: Record<Locale, string> = { en: "en_US", id: "id_ID" };

const escapeHtml = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

const pageName = (page: Page, locale: Locale) =>
	text(locale, page === "home" ? "nav.home" : `tool.${page}.name`);

function headTags(page: Page, locale: Locale): string {
	const title = escapeHtml(seoTitle(locale, page));
	const description = escapeHtml(seoDescription(locale, page));
	const url = pageUrl(page, locale);
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
		'<meta name="twitter:card" content="summary" />',
		`<meta name="twitter:title" content="${title}" />`,
		`<meta name="twitter:description" content="${description}" />`,
	].join("\n\t\t");
}

// Plain, visible content for crawlers; React replaces it once the app loads.
function body(page: Page, locale: Locale): string {
	const heading =
		page === "home" ? text(locale, "seo.home.title") : pageName(page, locale);
	const summary = text(
		locale,
		page === "home" ? "home.subtitle" : `tool.${page}.description`,
	);
	const links = PAGES.filter((other) => other !== page)
		.map(
			(other) =>
				`<li><a href="${pageUrl(other, locale)}">${escapeHtml(pageName(other, locale))}</a></li>`,
		)
		.join("");
	return `<div id="root"><main><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(summary)}</p><nav><ul>${links}</ul></nav></main></div>`;
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
