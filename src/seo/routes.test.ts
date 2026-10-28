import { describe, expect, it } from "vitest";
import { TOOLS } from "../tools";
import {
	localeFromPath,
	localePath,
	ogImageFile,
	ogImageUrl,
	PAGE_IDS,
	PAGES,
	pageFile,
	pageFromPath,
	pageUrl,
	SITE_URL,
	switchLocalePath,
} from "./routes";

describe("PAGE_IDS", () => {
	it("lists every tool in sidebar order, each served at /<id>", () => {
		expect(PAGE_IDS).toEqual(TOOLS.map((tool) => tool.id));
		for (const tool of TOOLS) expect(tool.path).toBe(`/${tool.id}`);
		expect(PAGES).toEqual(["home", ...PAGE_IDS]);
	});
});

describe("localeFromPath", () => {
	it("reads Indonesian only from a leading /id segment", () => {
		expect(localeFromPath("/")).toBe("en");
		expect(localeFromPath("/compress")).toBe("en");
		expect(localeFromPath("/id")).toBe("id");
		expect(localeFromPath("/id/")).toBe("id");
		expect(localeFromPath("/id/compress")).toBe("id");
		expect(localeFromPath("/idea")).toBe("en");
	});
});

describe("localePath", () => {
	it("prefixes Indonesian paths and keeps the query", () => {
		expect(localePath("/compress", "en")).toBe("/compress");
		expect(localePath("/", "id")).toBe("/id");
		expect(localePath("/compress", "id")).toBe("/id/compress");
		expect(localePath("/pdf?mode=sign", "id")).toBe("/id/pdf?mode=sign");
	});

	it("leaves the English-only Open page alone", () => {
		expect(localePath("/open", "id")).toBe("/open");
		expect(localePath("/open?shared", "id")).toBe("/open?shared");
	});
});

describe("switchLocalePath", () => {
	it("moves to the same page in the other language", () => {
		expect(switchLocalePath("/compress", "", "id")).toBe("/id/compress");
		expect(switchLocalePath("/id/pdf", "?mode=sign", "en")).toBe(
			"/pdf?mode=sign",
		);
		expect(switchLocalePath("/id", "", "en")).toBe("/");
		expect(switchLocalePath("/id/", "", "en")).toBe("/");
		expect(switchLocalePath("/", "", "id")).toBe("/id");
		expect(switchLocalePath("/open", "", "id")).toBe("/open");
	});
});

describe("ogImageFile and ogImageUrl", () => {
	it("name one share image per page and language", () => {
		expect(ogImageFile("home", "en")).toBe("og/index.png");
		expect(ogImageFile("home", "id")).toBe("og/id/index.png");
		expect(ogImageFile("compress", "id")).toBe("og/id/compress.png");
		expect(ogImageUrl("compress", "en")).toBe(`${SITE_URL}og/compress.png`);
	});
});

describe("pageFromPath", () => {
	it("finds the page in either language", () => {
		expect(pageFromPath("/")).toBe("home");
		expect(pageFromPath("/id")).toBe("home");
		expect(pageFromPath("/id/")).toBe("home");
		expect(pageFromPath("/compress")).toBe("compress");
		expect(pageFromPath("/id/compress")).toBe("compress");
		expect(pageFromPath("/compress/")).toBe("compress");
	});

	it("serves the Open page in English only", () => {
		expect(pageFromPath("/open")).toBe("open");
		expect(pageFromPath("/id/open")).toBeUndefined();
	});

	it("knows no other paths", () => {
		expect(pageFromPath("/nope")).toBeUndefined();
		expect(pageFromPath("/compress/extra")).toBeUndefined();
		expect(pageFromPath("/home")).toBeUndefined();
	});
});

describe("pageFile and pageUrl", () => {
	it("name extensionless-friendly files and canonical URLs", () => {
		expect(pageFile("home", "en")).toBe("index.html");
		expect(pageFile("home", "id")).toBe("id/index.html");
		expect(pageFile("compress", "en")).toBe("compress.html");
		expect(pageFile("compress", "id")).toBe("id/compress.html");

		expect(SITE_URL).toBe("https://ahmadafienzidan.github.io/shapeshift/");
		expect(pageUrl("home", "en")).toBe(SITE_URL);
		expect(pageUrl("home", "id")).toBe(`${SITE_URL}id/`);
		expect(pageUrl("compress", "en")).toBe(`${SITE_URL}compress`);
		expect(pageUrl("compress", "id")).toBe(`${SITE_URL}id/compress`);
	});
});
