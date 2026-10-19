import type { Locale } from "../i18n/locale";
import { localeFromPath, switchLocalePath } from "./routes";

// English URLs follow a stored or browser preference for Indonesian, while
// /id URLs only give way to an explicit choice of English, so visitors from
// Indonesian search results stay on the page they found.
function preferred(
	current: Locale,
	stored: string | null,
	browserLanguage: string,
): Locale {
	if (current === "en") {
		const wantsId =
			stored === "id" || (stored === null && browserLanguage.startsWith("id"));
		return wantsId ? "id" : "en";
	}
	return stored === "en" ? "en" : "id";
}

export function redirectTarget(
	pathname: string,
	search: string,
	stored: string | null,
	browserLanguage: string,
): string | null {
	const current = localeFromPath(pathname);
	const locale = preferred(current, stored, browserLanguage);
	if (locale === current) return null;
	const target = switchLocalePath(pathname, search, locale);
	return target === `${pathname}${search}` ? null : target;
}
