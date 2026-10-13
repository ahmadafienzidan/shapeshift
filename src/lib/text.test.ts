import { describe, expect, it } from "vitest";
import { convertCase, textStats, topWords, transformLines } from "./text";

describe("convertCase", () => {
	it.each([
		["camel", "userProfileId2"],
		["pascal", "UserProfileId2"],
		["snake", "user_profile_id2"],
		["kebab", "user-profile-id2"],
		["constant", "USER_PROFILE_ID2"],
	] as const)("splits words and camel humps for %s case", (to, expected) => {
		expect(convertCase("user profileId2", to, "en")).toBe(expected);
		expect(convertCase("user-profile_id2", to, "en")).toBe(expected);
	});

	it("capitalizes titles and sentences", () => {
		expect(convertCase("hello WORLD. again here", "title", "en")).toBe(
			"Hello World. Again Here",
		);
		expect(
			convertCase("hello WORLD. again here\nnew line", "sentence", "en"),
		).toBe("Hello world. Again here\nNew line");
	});

	it("respects locale-specific casing", () => {
		expect(convertCase("istanbul", "upper", "tr")).toBe("İSTANBUL");
	});
});

describe("transformLines", () => {
	it("sorts naturally, removes duplicates and blanks, and tidies spaces", () => {
		expect(transformLines("item 10\nitem 2\nItem 1", "sort", "en")).toBe(
			"Item 1\nitem 2\nitem 10",
		);
		expect(transformLines("a\nb\na", "unique", "en")).toBe("a\nb");
		expect(transformLines("a\n \nb", "removeEmpty", "en")).toBe("a\nb");
		expect(transformLines("  a   b\t c ", "cleanSpaces", "en")).toBe("a b c");
		expect(transformLines("1\n2\n3", "reverse", "en")).toBe("3\n2\n1");
	});
});

describe("textStats", () => {
	it("counts words, sentences, paragraphs, and lines", () => {
		const stats = textStats("Halo dunia. Apa kabar?\n\nBaik 👍", "id");
		expect(stats).toMatchObject({
			words: 5,
			sentences: 3,
			paragraphs: 2,
			lines: 3,
			characters: 30,
		});
	});

	it("reports zero lines for empty text", () => {
		expect(textStats("", "en").lines).toBe(0);
	});
});

describe("topWords", () => {
	it("lists repeated words of three letters or more, most frequent first, ties A–Z", () => {
		expect(
			topWords("Kopi kopi KOPI teh teh air air air di di", "id", 5),
		).toEqual([
			["air", 3],
			["kopi", 3],
			["teh", 2],
		]);
	});
});
