import type { Locale } from "../i18n/locale";

export const SITE_URL = "https://ahmadafienzidan.github.io/shapeshift/";

// Kept free of icon imports so vite.config.ts can read it; routes.test.ts
// keeps it in step with TOOLS.
export const PAGE_IDS = [
	"convert",
	"compress",
	"resize",
	"crop",
	"merge",
	"watermark",
	"ocr",
	"icons",
	"metadata",
	"color",
	"pdf",
	"markdown",
	"qr",
	"data",
	"text",
	"base64",
	"checksum",
	"json",
	"diff",
	"devtools",
] as const;

export type Page = "home" | (typeof PAGE_IDS)[number];

export const PAGES: Page[] = ["home", ...PAGE_IDS];

// Where shared and opened files land; its path is fixed in the manifest.
const ENGLISH_ONLY = "/open";

export function localeFromPath(pathname: string): Locale {
	return /^\/id(\/|$)/.test(pathname) ? "id" : "en";
}

export function localePath(path: string, locale: Locale): string {
	if (locale === "en" || path.split("?")[0] === ENGLISH_ONLY) return path;
	return path === "/" ? "/id" : `/id${path}`;
}

export function switchLocalePath(
	pathname: string,
	search: string,
	locale: Locale,
): string {
	const english = pathname.replace(/^\/id(?=\/|$)/, "") || "/";
	return localePath(`${english}${search}`, locale);
}

export function pageFromPath(pathname: string): Page | "open" | undefined {
	const locale = localeFromPath(pathname);
	const segment = pathname.replace(/^\/id(?=\/|$)/, "").replace(/^\/|\/$/g, "");
	if (segment === "") return "home";
	if (`/${segment}` === ENGLISH_ONLY)
		return locale === "en" ? "open" : undefined;
	return PAGE_IDS.find((id) => id === segment);
}

export function pageFile(page: Page, locale: Locale): string {
	const prefix = locale === "id" ? "id/" : "";
	return `${prefix}${page === "home" ? "index" : page}.html`;
}

export function pageUrl(page: Page, locale: Locale): string {
	const prefix = locale === "id" ? "id/" : "";
	return `${SITE_URL}${prefix}${page === "home" ? "" : page}`;
}
