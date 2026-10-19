import { describe, expect, it, vi } from "vitest";
import { PAGE_IDS, pageUrl, SITE_URL } from "./routes";

vi.mock("../i18n/messages", async (importOriginal) => {
	const { MESSAGES } =
		await importOriginal<typeof import("../i18n/messages")>();
	return {
		MESSAGES: {
			...MESSAGES,
			en: {
				...MESSAGES.en,
				"tool.diff.name": 'Diff <A> & "B"',
				"seo.diff.title": 'Diff <A> & "B"',
				"seo.diff.description": 'Compare <A> & "B".',
			},
		},
	};
});

const { renderPage } = await import("./html");

const TEMPLATE = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<title>Shapeshift</title>
		<script type="module" src="/shapeshift/assets/index-abc.js"></script>
	</head>
	<body>
		<div id="root"></div>
	</body>
</html>
`;

const head = (html: string) => html.slice(0, html.indexOf("</head>"));
const root = (html: string) =>
	html.slice(html.indexOf('<div id="root">'), html.indexOf("</body>"));

describe("renderPage", () => {
	it("sets the language, title, and description", () => {
		const html = renderPage(TEMPLATE, "compress", "id");
		expect(html).toContain('<html lang="id">');
		expect(head(html)).toContain(
			"<title>Kompres Gambar Online Gratis Tanpa Upload | Shapeshift</title>",
		);
		expect(head(html)).toContain(
			'<meta name="description" content="Perkecil ukuran file JPG',
		);
		expect(html).not.toContain("<title>Shapeshift</title>");
		expect(html).toContain('src="/shapeshift/assets/index-abc.js"');
	});

	it("links the canonical URL and both language versions", () => {
		const html = head(renderPage(TEMPLATE, "compress", "id"));
		expect(html).toContain(
			`<link rel="canonical" href="${SITE_URL}id/compress" />`,
		);
		expect(html).toContain(
			`<link rel="alternate" hreflang="en" href="${SITE_URL}compress" />`,
		);
		expect(html).toContain(
			`<link rel="alternate" hreflang="id" href="${SITE_URL}id/compress" />`,
		);
		expect(html).toContain(
			`<link rel="alternate" hreflang="x-default" href="${SITE_URL}compress" />`,
		);
	});

	it("adds Open Graph and Twitter tags for link previews", () => {
		const id = head(renderPage(TEMPLATE, "home", "id"));
		expect(id).toContain('<meta property="og:locale" content="id_ID" />');
		expect(id).toContain(`<meta property="og:url" content="${SITE_URL}id/" />`);
		expect(id).toContain(
			'<meta property="og:site_name" content="Shapeshift" />',
		);
		expect(id).toContain('<meta name="twitter:card" content="summary" />');
		const en = head(renderPage(TEMPLATE, "home", "en"));
		expect(en).toContain('<meta property="og:locale" content="en_US" />');
		expect(en).toContain(
			'<meta property="og:title" content="Free Private File Tools, No Upload | Shapeshift" />',
		);
	});

	it("fills #root with the page heading, summary, and links to every other page", () => {
		const html = root(renderPage(TEMPLATE, "compress", "en"));
		expect(html).toContain("<h1>Compress</h1>");
		expect(html).toContain("<p>Shrink file size, cap dimensions");
		expect(html).toContain(`<a href="${pageUrl("home", "en")}">Home</a>`);
		expect(html).toContain(
			`<a href="${pageUrl("convert", "en")}">Image Converter</a>`,
		);
		expect(html).not.toContain(`href="${pageUrl("compress", "en")}"`);
		expect(html.match(/<a /g)).toHaveLength(PAGE_IDS.length);
	});

	it("headlines the home page with its search title, without the suffix", () => {
		expect(root(renderPage(TEMPLATE, "home", "en"))).toContain(
			"<h1>Free Private File Tools, No Upload</h1>",
		);
	});

	it("links Indonesian pages to Indonesian pages", () => {
		const html = root(renderPage(TEMPLATE, "home", "id"));
		expect(html).toContain(`<a href="${SITE_URL}id/compress">Kompres</a>`);
		expect(html).not.toContain(`href="${SITE_URL}compress"`);
	});

	it("escapes markup characters in the copy", () => {
		const html = renderPage(TEMPLATE, "diff", "en");
		expect(html).toContain(
			"<title>Diff &lt;A&gt; &amp; &quot;B&quot; | Shapeshift</title>",
		);
		expect(html).toContain('content="Compare &lt;A&gt; &amp; &quot;B&quot;."');
		expect(html).toContain("<h1>Diff &lt;A&gt; &amp; &quot;B&quot;</h1>");
		expect(html).not.toContain("<A>");
	});

	it("refuses a template it does not recognize", () => {
		for (const part of [
			'<html lang="en">',
			"<title>Shapeshift</title>",
			'<div id="root"></div>',
		])
			expect(() =>
				renderPage(TEMPLATE.replace(part, ""), "home", "en"),
			).toThrow(part);
	});
});
