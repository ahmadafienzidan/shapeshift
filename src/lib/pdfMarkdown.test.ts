import { describe, expect, it } from "vitest";
import { itemsToMarkdown, type PdfText, type PdfTextItem } from "./pdfMarkdown";

type LineOptions = { size?: number; x?: number };

// One text item per line, laid out top-down from y = 800 like a PDF page.
const item = (
	str: string,
	y: number,
	{ size = 10, x = 72 }: LineOptions = {},
): PdfTextItem => ({ str, x, y, width: str.length * size * 0.5, size });

const page = (...items: PdfTextItem[]): PdfText => ({ items });

// Lines spaced 12pt apart (10pt text), with a blank line wherever "" appears.
const lines = (...texts: (string | [string, LineOptions])[]): PdfTextItem[] => {
	let y = 800;
	return texts.flatMap((entry) => {
		const [text, options] = typeof entry === "string" ? [entry, {}] : entry;
		y -= 12 + ((options.size ?? 10) - 10);
		return text === "" ? [] : [item(text, y, options)];
	});
};

describe("itemsToMarkdown", () => {
	it("joins lines wrapped by the page width into one paragraph", () => {
		expect(
			itemsToMarkdown([
				page(...lines("The quick brown fox", "jumps over the dog.")),
			]),
		).toBe("The quick brown fox jumps over the dog.\n");
	});

	it("starts a new paragraph after a vertical gap", () => {
		expect(
			itemsToMarkdown([
				page(...lines("First paragraph.", "", "", "Second paragraph.")),
			]),
		).toBe("First paragraph.\n\nSecond paragraph.\n");
	});

	it("rejoins words hyphenated at the end of a line", () => {
		expect(
			itemsToMarkdown([
				page(...lines("Shapeshift keeps your infor-", "mation private.")),
			]),
		).toBe("Shapeshift keeps your information private.\n");
	});

	it("keeps a hyphen that joins a capitalized word", () => {
		expect(
			itemsToMarkdown([
				page(...lines("It works in the Asia-", "Pacific region.")),
			]),
		).toBe("It works in the Asia-Pacific region.\n");
	});

	it("turns larger text into headings, biggest first", () => {
		expect(
			itemsToMarkdown([
				page(
					...lines(
						["User Guide", { size: 24 }],
						["Getting started", { size: 16 }],
						"Open the app and drop a file.",
						"It is processed on your device.",
						["Exporting", { size: 16 }],
						"Download the result.",
					),
				),
			]),
		).toBe(
			"# User Guide\n\n## Getting started\n\nOpen the app and drop a file. It is processed on your device.\n\n## Exporting\n\nDownload the result.\n",
		);
	});

	it("merges a heading that wraps onto a second line", () => {
		expect(
			itemsToMarkdown([
				page(
					...lines(
						["A very long title that", { size: 20 }],
						["wraps onto two lines", { size: 20 }],
						"Body text that is longer than the title,",
						"as it is in any real document.",
					),
				),
			]),
		).toBe(
			"# A very long title that wraps onto two lines\n\nBody text that is longer than the title, as it is in any real document.\n",
		);
	});

	it("turns bullets and numbers into Markdown lists", () => {
		expect(
			itemsToMarkdown([
				page(
					...lines(
						"Supported formats:",
						"• JPG",
						"◦ PNG",
						"– WEBP",
						"",
						"",
						"1. Drop a file",
						"2) Download it",
					),
				),
			]),
		).toBe(
			"Supported formats:\n\n- JPG\n- PNG\n- WEBP\n\n1. Drop a file\n2. Download it\n",
		);
	});

	it("continues an indented list item that wraps", () => {
		expect(
			itemsToMarkdown([
				page(
					...lines(
						"• A bullet that is long enough",
						["to wrap onto a second line", { x: 84 }],
						"• Short",
					),
				),
			]),
		).toBe(
			"- A bullet that is long enough to wrap onto a second line\n- Short\n",
		);
	});

	it("joins items on the same line, adding spaces only across gaps", () => {
		const first = item("Hello", 700);
		expect(
			itemsToMarkdown([
				page(
					first,
					{ ...item("world", 700), x: first.x + first.width + 3 },
					{ ...item("!", 700), x: first.x + first.width + 3 + 25 },
				),
			]),
		).toBe("Hello world!\n");
	});

	it("reads lines top to bottom and items left to right", () => {
		expect(
			itemsToMarkdown([
				page(
					item("second line.", 688),
					{ ...item("line", 700), x: 102 },
					item("First", 700),
				),
			]),
		).toBe("First line second line.\n");
	});

	it("drops headers, footers, and page numbers repeated on every page", () => {
		const withChrome = (body: string, number: number) =>
			page(
				item("Annual Report 2026", 820),
				item(body, 700),
				item(`Page ${number} of 3`, 40),
			);
		expect(
			itemsToMarkdown([
				withChrome("Intro.", 1),
				withChrome("Middle.", 2),
				withChrome("End.", 3),
			]),
		).toBe("Intro.\n\nMiddle.\n\nEnd.\n");
	});

	it("drops a bare page number at the bottom of a page", () => {
		expect(
			itemsToMarkdown([page(item("Only page.", 700), item("7", 40))]),
		).toBe("Only page.\n");
	});

	it("continues a paragraph that runs onto the next page", () => {
		expect(
			itemsToMarkdown([
				page(item("This sentence keeps", 100)),
				page(item("going on page two.", 780)),
			]),
		).toBe("This sentence keeps going on page two.\n");
	});

	it("escapes text that Markdown would read as a heading", () => {
		expect(itemsToMarkdown([page(item("#1 in sales", 700))])).toBe(
			"\\#1 in sales\n",
		);
	});

	it("ignores whitespace-only items", () => {
		expect(itemsToMarkdown([page(item("Text.", 700), item("   ", 688))])).toBe(
			"Text.\n",
		);
	});

	it("rejects a PDF without a text layer", () => {
		expect(() => itemsToMarkdown([page(), page(item(" ", 700))])).toThrow(
			"pdf.error.noText",
		);
	});
});
