import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";

for (const [name, language] of Object.entries({
	bash,
	css,
	javascript,
	json,
	markdown,
	python,
	sql,
	typescript,
	xml,
	yaml,
})) {
	hljs.registerLanguage(name, language);
}

const marked = new Marked(
	markedHighlight({
		emptyLangClass: "hljs",
		langPrefix: "hljs language-",
		highlight: (code, lang) =>
			hljs.getLanguage(lang)
				? hljs.highlight(code, { language: lang }).value
				: hljs.highlightAuto(code).value,
	}),
	{ gfm: true },
);

// Links open in a new tab so clicking one never navigates away from the editor.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
	if (node.tagName === "A" && node.getAttribute("href")) {
		node.setAttribute("target", "_blank");
		node.setAttribute("rel", "noopener noreferrer");
	}
});

export function renderMarkdown(source: string): string {
	return DOMPurify.sanitize(marked.parse(source, { async: false }));
}

export function markdownStats(source: string) {
	const words = source.trim() === "" ? 0 : source.trim().split(/\s+/).length;
	return {
		words,
		characters: source.length,
		minutes: Math.max(1, Math.ceil(words / 200)),
	};
}

export function documentTitle(source: string, fallback: string): string {
	return source.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fallback;
}

const EXPORT_CSS = `
*{box-sizing:border-box}
body{margin:0;background:#fff;color:#1f2328;font:16px/1.65 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:46rem;margin:0 auto;padding:3rem 1.5rem}
h1,h2,h3,h4{line-height:1.25;margin:2rem 0 1rem;font-weight:700}
h1{font-size:2.1rem;padding-bottom:.4rem;border-bottom:1px solid #d1d9e0}
h2{font-size:1.6rem;padding-bottom:.3rem;border-bottom:1px solid #d1d9e0}
h3{font-size:1.25rem}
p,ul,ol,blockquote,pre,table{margin:0 0 1rem}
a{color:#0969da}
img{max-width:100%}
blockquote{margin-left:0;padding:.25rem 1rem;border-left:.25rem solid #d1d9e0;color:#59636e}
code{font:.875em/1.5 "JetBrains Mono",ui-monospace,monospace;background:#eff2f5;padding:.15em .35em;border-radius:4px}
pre{background:#f6f8fa;padding:1rem;border-radius:6px;overflow:auto}
pre code{background:none;padding:0}
table{border-collapse:collapse;display:block;overflow:auto}
th,td{border:1px solid #d1d9e0;padding:.4rem .8rem}
th{background:#f6f8fa}
hr{border:0;border-top:1px solid #d1d9e0;margin:2rem 0}
li:has(>input[type=checkbox]){list-style:none}
li>input[type=checkbox]{margin:0 .5rem 0 -1.4rem}
.hljs-comment,.hljs-quote{color:#6e7781;font-style:italic}
.hljs-keyword,.hljs-selector-tag,.hljs-literal,.hljs-type{color:#cf222e}
.hljs-string,.hljs-regexp,.hljs-addition{color:#0a3069}
.hljs-number,.hljs-attr,.hljs-attribute,.hljs-variable,.hljs-property{color:#0550ae}
.hljs-title,.hljs-section,.hljs-built_in,.hljs-name,.hljs-tag{color:#8250df}
.hljs-meta,.hljs-symbol,.hljs-bullet{color:#953800}
.hljs-deletion{color:#82071e}
@media print{main{padding:0}pre{white-space:pre-wrap}}
`;

export function standaloneHtml(title: string, body: string): string {
	const safeTitle = title.replace(
		/[<>&"]/g,
		(char) => `&#${char.charCodeAt(0)};`,
	);
	return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>${EXPORT_CSS}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}

export type Edit = {
	from: number;
	to: number;
	text: string;
	selectStart: number;
	selectEnd: number;
};

export function wrapEdit(
	value: string,
	start: number,
	end: number,
	before: string,
	after: string,
	placeholder: string,
): Edit {
	const selected = value.slice(start, end) || placeholder;
	return {
		from: start,
		to: end,
		text: `${before}${selected}${after}`,
		selectStart: start + before.length,
		selectEnd: start + before.length + selected.length,
	};
}

export function linkEdit(
	value: string,
	start: number,
	end: number,
	image: boolean,
	placeholder: string,
): Edit {
	const selected = value.slice(start, end);
	const label = selected || placeholder;
	const prefix = `${image ? "!" : ""}[${label}](`;
	const url = "https://";
	const urlStart = start + prefix.length;
	return {
		from: start,
		to: end,
		text: `${prefix}${url})`,
		selectStart: selected ? urlStart : start + (image ? 2 : 1),
		selectEnd: selected
			? urlStart + url.length
			: start + (image ? 2 : 1) + label.length,
	};
}

function lineRange(value: string, start: number, end: number) {
	const from = value.lastIndexOf("\n", start - 1) + 1;
	const newline = value.indexOf("\n", end);
	return { from, to: newline === -1 ? value.length : newline };
}

const LINE_PREFIX = /^(#{1,6} |> |[-*+] \[[ xX]\] |[-*+] |\d+\. )/;

// Applies a prefix to every selected line, or removes it when all of them
// already have it. Any other list or heading marker is replaced.
export function prefixEdit(
	value: string,
	start: number,
	end: number,
	prefix: (index: number) => string,
): Edit {
	const { from, to } = lineRange(value, start, end);
	const lines = value.slice(from, to).split("\n");
	const active = lines.every((line, index) => line.startsWith(prefix(index)));
	const text = lines
		.map((line, index) =>
			active
				? line.slice(prefix(index).length)
				: prefix(index) + line.replace(LINE_PREFIX, ""),
		)
		.join("\n");
	return { from, to, text, selectStart: from, selectEnd: from + text.length };
}

export function blockEdit(
	value: string,
	start: number,
	end: number,
	block: (selected: string) => string,
): Edit {
	const before = value.slice(Math.max(0, start - 2), start);
	const lead =
		start === 0 || before === "\n\n"
			? ""
			: before.endsWith("\n")
				? "\n"
				: "\n\n";
	const after = value.slice(end, end + 1);
	const trail = after === "" || after === "\n" ? "\n" : "\n\n";
	const body = block(value.slice(start, end));
	const text = `${lead}${body}${trail}`;
	return {
		from: start,
		to: end,
		text,
		selectStart: start + lead.length,
		selectEnd: start + lead.length + body.length,
	};
}

const CONTINUATION = /^(\s*)([-*+] \[[ xX]\] |[-*+] |(\d+)\. |> )/;

// Continues a list or quote when Enter is pressed at the end of its line, and
// ends it when the item is still empty.
export function continueListEdit(
	value: string,
	caret: number,
): Edit | undefined {
	const { from } = lineRange(value, caret, caret);
	const line = value.slice(from, caret);
	const match = line.match(CONTINUATION);
	if (!match) return undefined;
	const [marker, indent = "", bullet = "", number] = match;
	if (line === marker) {
		return { from, to: caret, text: "", selectStart: from, selectEnd: from };
	}
	const next = number
		? `${Number(number) + 1}. `
		: bullet.replace(/\[[xX]\]/, "[ ]");
	const text = `\n${indent}${next}`;
	return {
		from: caret,
		to: caret,
		text,
		selectStart: caret + text.length,
		selectEnd: caret + text.length,
	};
}
