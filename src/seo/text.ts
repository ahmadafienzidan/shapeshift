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
