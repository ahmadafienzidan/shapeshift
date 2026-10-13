// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
	blockEdit,
	continueListEdit,
	documentTitle,
	type Edit,
	linkEdit,
	markdownStats,
	prefixEdit,
	renderMarkdown,
	standaloneHtml,
	wrapEdit,
} from "./markdown";

function apply(value: string, edit: Edit) {
	const result = value.slice(0, edit.from) + edit.text + value.slice(edit.to);
	return {
		value: result,
		selected: result.slice(edit.selectStart, edit.selectEnd),
	};
}

describe("renderMarkdown", () => {
	it("renders GitHub-flavored tables, task lists, and strikethrough", () => {
		const html = renderMarkdown(
			"| a | b |\n| - | - |\n| 1 | 2 |\n\n- [x] done\n- [ ] todo\n\n~~gone~~",
		);
		expect(html).toContain("<table>");
		expect(html).toContain("<td>2</td>");
		expect(html).toMatch(/<input[^>]*checked[^>]*>/);
		expect(html).toContain("<del>gone</del>");
	});

	it("highlights fenced code by language", () => {
		const html = renderMarkdown("```ts\nconst answer = 42;\n```");
		expect(html).toContain('class="hljs language-ts"');
		expect(html).toContain('<span class="hljs-keyword">const</span>');
	});

	it("strips scripts, event handlers, javascript: links, and iframes", () => {
		const html = renderMarkdown(
			'<script>alert(1)</script><img src="x" onerror="alert(2)">' +
				'<iframe src="https://example.com"></iframe>\n\n[click](javascript:alert(3))',
		);
		expect(html).not.toMatch(/<script|onerror|<iframe|javascript:/i);
		expect(html).toContain('<img src="x">');
	});

	it("opens links in a new tab without leaking the opener", () => {
		const html = renderMarkdown("[docs](https://example.com)");
		expect(html).toContain('target="_blank"');
		expect(html).toContain('rel="noopener noreferrer"');
	});
});

describe("markdownStats", () => {
	it("counts words and rounds reading time up to whole minutes", () => {
		expect(markdownStats("")).toEqual({ words: 0, characters: 0, minutes: 1 });
		const long = Array.from({ length: 450 }, () => "word").join(" ");
		expect(markdownStats(long)).toMatchObject({ words: 450, minutes: 3 });
	});
});

describe("documentTitle", () => {
	it("uses the first level-one heading, or the fallback", () => {
		expect(documentTitle("intro\n# Release notes \n## Later", "doc")).toBe(
			"Release notes",
		);
		expect(documentTitle("## Only a subheading", "doc")).toBe("doc");
	});
});

describe("standaloneHtml", () => {
	it("escapes the title so it cannot break out of <title>", () => {
		const html = standaloneHtml(
			'</title><script>alert("x")</script>',
			"<p>hi</p>",
		);
		expect(html).not.toContain("<script>");
		expect(html).toContain("&#60;/title&#62;");
		expect(html).toContain("<main>\n<p>hi</p>\n</main>");
	});
});

describe("wrapEdit", () => {
	it("wraps the selection and keeps it selected", () => {
		expect(
			apply("hello world", wrapEdit("hello world", 6, 11, "**", "**", "bold")),
		).toEqual({
			value: "hello **world**",
			selected: "world",
		});
	});

	it("inserts a selected placeholder when nothing is selected", () => {
		expect(apply("ab", wrapEdit("ab", 1, 1, "*", "*", "italic"))).toEqual({
			value: "a*italic*b",
			selected: "italic",
		});
	});
});

describe("linkEdit", () => {
	it("selects the URL when text was selected", () => {
		expect(
			apply("see docs", linkEdit("see docs", 4, 8, false, "link")),
		).toEqual({
			value: "see [docs](https://)",
			selected: "https://",
		});
	});

	it("selects the placeholder label for an empty image", () => {
		expect(apply("", linkEdit("", 0, 0, true, "alt"))).toEqual({
			value: "![alt](https://)",
			selected: "alt",
		});
	});
});

describe("prefixEdit", () => {
	const value = "one\ntwo\nthree";

	it("prefixes every selected line, including partially selected ones", () => {
		expect(
			apply(
				value,
				prefixEdit(value, 1, 5, () => "- "),
			).value,
		).toBe("- one\n- two\nthree");
	});

	it("toggles the prefix off when every line already has it", () => {
		const listed = "- one\n- two";
		expect(
			apply(
				listed,
				prefixEdit(listed, 0, listed.length, () => "- "),
			).value,
		).toBe("one\ntwo");
	});

	it("replaces another list marker instead of stacking them", () => {
		const listed = "- one\n- two";
		const numbered = prefixEdit(
			listed,
			0,
			listed.length,
			(index) => `${index + 1}. `,
		);
		expect(apply(listed, numbered).value).toBe("1. one\n2. two");
	});
});

describe("blockEdit", () => {
	it("separates the block from surrounding text with blank lines", () => {
		const edit = blockEdit("intro", 5, 5, () => "---");
		expect(apply("intro", edit)).toEqual({
			value: "intro\n\n---\n",
			selected: "---",
		});
	});

	it("adds no leading newlines at the start of the document", () => {
		const edit = blockEdit(
			"",
			0,
			0,
			(selected) => `\`\`\`\n${selected}\n\`\`\``,
		);
		expect(apply("", edit).value).toBe("```\n\n```\n");
	});
});

describe("continueListEdit", () => {
	const enter = (value: string) => {
		const edit = continueListEdit(value, value.length);
		return edit && apply(value, edit).value;
	};

	it("continues bullets, numbers, quotes, and unchecked tasks", () => {
		expect(enter("- item")).toBe("- item\n- ");
		expect(enter("  1. first")).toBe("  1. first\n  2. ");
		expect(enter("> quote")).toBe("> quote\n> ");
		expect(enter("- [x] done")).toBe("- [x] done\n- [ ] ");
	});

	it("ends the list when the current item is empty", () => {
		expect(enter("- item\n- ")).toBe("- item\n");
	});

	it("leaves plain lines to the browser", () => {
		expect(continueListEdit("plain text", 10)).toBeUndefined();
	});
});
