export type TextStats = {
	words: number;
	characters: number;
	charactersNoSpaces: number;
	sentences: number;
	paragraphs: number;
	lines: number;
	readingMinutes: number;
	speakingMinutes: number;
};

function segments(
	text: string,
	locale: string,
	granularity: "word" | "sentence" | "grapheme",
) {
	return [...new Intl.Segmenter(locale, { granularity }).segment(text)];
}

export function textStats(text: string, locale: string): TextStats {
	const words = segments(text, locale, "word").filter(
		(segment) => segment.isWordLike,
	).length;
	const graphemes = segments(text, locale, "grapheme");
	return {
		words,
		characters: graphemes.length,
		charactersNoSpaces: graphemes.filter(({ segment }) => !/\s/.test(segment))
			.length,
		sentences: segments(text, locale, "sentence").filter(({ segment }) =>
			/[\p{L}\p{N}]/u.test(segment),
		).length,
		paragraphs: text.split(/\n\s*\n/).filter((part) => part.trim()).length,
		lines: text === "" ? 0 : text.split("\n").length,
		// Average silent reading and speaking speeds in words per minute.
		readingMinutes: words / 230,
		speakingMinutes: words / 150,
	};
}

export function topWords(
	text: string,
	locale: string,
	limit: number,
): [string, number][] {
	const counts = new Map<string, number>();
	for (const segment of segments(text, locale, "word")) {
		if (!segment.isWordLike || segment.segment.length < 3) continue;
		const word = segment.segment.toLocaleLowerCase(locale);
		counts.set(word, (counts.get(word) ?? 0) + 1);
	}
	return [...counts]
		.filter(([, count]) => count > 1)
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, limit);
}

function codeWords(text: string): string[] {
	return text
		.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean)
		.map((word) => word.toLowerCase());
}

const capitalize = (word: string, locale: string) =>
	word.charAt(0).toLocaleUpperCase(locale) + word.slice(1);

export type CaseId =
	| "upper"
	| "lower"
	| "title"
	| "sentence"
	| "camel"
	| "pascal"
	| "snake"
	| "kebab"
	| "constant";

export function convertCase(text: string, to: CaseId, locale: string): string {
	switch (to) {
		case "upper":
			return text.toLocaleUpperCase(locale);
		case "lower":
			return text.toLocaleLowerCase(locale);
		case "title":
			return text
				.toLocaleLowerCase(locale)
				.replace(/[\p{L}\p{N}]+/gu, (word) => capitalize(word, locale));
		case "sentence":
			return text
				.toLocaleLowerCase(locale)
				.replace(
					/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu,
					(_, prefix: string, letter: string) =>
						prefix + letter.toLocaleUpperCase(locale),
				);
		case "camel":
			return codeWords(text)
				.map((word, index) => (index === 0 ? word : capitalize(word, locale)))
				.join("");
		case "pascal":
			return codeWords(text)
				.map((word) => capitalize(word, locale))
				.join("");
		case "snake":
			return codeWords(text).join("_");
		case "kebab":
			return codeWords(text).join("-");
		case "constant":
			return codeWords(text).join("_").toUpperCase();
	}
}

export type LineAction =
	| "sort"
	| "sortDesc"
	| "reverse"
	| "unique"
	| "removeEmpty"
	| "cleanSpaces";

export function transformLines(
	text: string,
	action: LineAction,
	locale: string,
): string {
	const lines = text.split("\n");
	const compare = (a: string, b: string) =>
		a.localeCompare(b, locale, { numeric: true, sensitivity: "base" });
	switch (action) {
		case "sort":
			return [...lines].sort(compare).join("\n");
		case "sortDesc":
			return [...lines].sort((a, b) => compare(b, a)).join("\n");
		case "reverse":
			return [...lines].reverse().join("\n");
		case "unique":
			return [...new Set(lines)].join("\n");
		case "removeEmpty":
			return lines.filter((line) => line.trim() !== "").join("\n");
		case "cleanSpaces":
			return lines
				.map((line) => line.replace(/[ \t]+/g, " ").trim())
				.join("\n");
	}
}
