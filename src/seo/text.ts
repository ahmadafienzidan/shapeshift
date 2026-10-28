import type { Locale } from "../i18n/locale";
import { MESSAGES } from "../i18n/messages";
import type { Page } from "./routes";

export type MetaPage = Page | "open";

export function text(locale: Locale, id: string): string {
	const message = MESSAGES[locale][id];
	if (message === undefined)
		throw new Error(`Missing message "${id}" for locale "${locale}"`);
	return message;
}

export function seoTitle(locale: Locale, page: MetaPage): string {
	return `${text(locale, `seo.${page}.title`)} | Shapeshift`;
}

export function seoDescription(locale: Locale, page: MetaPage): string {
	return text(locale, `seo.${page}.description`);
}

export function pageName(locale: Locale, page: Page): string {
	return text(locale, page === "home" ? "nav.home" : `tool.${page}.name`);
}

// The visible headline and summary of a prerendered page and its share image.
export function pageHeading(locale: Locale, page: Page): string {
	return page === "home"
		? text(locale, "seo.home.title")
		: pageName(locale, page);
}

export function pageSummary(locale: Locale, page: Page): string {
	return text(
		locale,
		page === "home" ? "home.subtitle" : `tool.${page}.description`,
	);
}
