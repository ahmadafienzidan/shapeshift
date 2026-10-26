// Positions are in PDF points with y growing upward, as pdf.js reports them.
export type PdfTextItem = {
	str: string;
	x: number;
	y: number;
	width: number;
	size: number;
};

export type PdfText = { items: PdfTextItem[] };

type Line = { text: string; x: number; y: number; size: number; page: number };

type ListItem = { marker: string; text: string; x: number };

type Block =
	| { kind: "heading"; level: number; text: string }
	| { kind: "paragraph"; text: string }
	| { kind: "list"; ordered: boolean; items: ListItem[] };

const BULLET = /^[•◦▪●‣·*–-]\s+/;
const NUMBERED = /^(\d+)[.)]\s+/;

// Text this much larger than the body text is a heading.
const HEADING_RATIO = 1.15;
// Lines further apart than this many font sizes start a new block.
const BLOCK_GAP = 1.8;

function toLines(items: PdfTextItem[], page: number): Line[] {
	const sorted = items
		.filter((item) => item.str.trim())
		.sort((a, b) => b.y - a.y || a.x - b.x);
	const rows: { y: number; size: number; items: PdfTextItem[] }[] = [];
	for (const item of sorted) {
		const row = rows.at(-1);
		if (row && Math.abs(row.y - item.y) < row.size / 2) row.items.push(item);
		else rows.push({ y: item.y, size: item.size, items: [item] });
	}
	return rows.map(({ y, items }) => {
		items.sort((a, b) => a.x - b.x);
		let text = "";
		let end = Number.NEGATIVE_INFINITY;
		for (const item of items) {
			if (text && item.x - end > item.size * 0.15) text += " ";
			text += item.str;
			end = item.x + item.width;
		}
		return {
			text: text.trim().replace(/\s+/g, " "),
			x: Math.min(...items.map((item) => item.x)),
			y,
			size: Math.max(...items.map((item) => item.size)),
			page,
		};
	});
}

// Running headers, footers, and page numbers sit at the top or bottom of a
// page and repeat with only their numbers changing.
function dropPageChrome(pages: Line[][]): Line[][] {
	const pattern = (text: string) => text.replace(/\d+/g, "#");
	const isEdge = (lines: Line[], index: number) =>
		index === 0 || index === lines.length - 1;
	const counts = new Map<string, number>();
	for (const lines of pages) {
		const edges = new Set(
			lines
				.filter((_, index) => isEdge(lines, index))
				.map((line) => pattern(line.text)),
		);
		for (const edge of edges) counts.set(edge, (counts.get(edge) ?? 0) + 1);
	}
	const repeated = Math.max(2, Math.ceil(pages.length / 2));
	return pages.map((lines) =>
		lines.filter(
			(line, index) =>
				!isEdge(lines, index) ||
				!(
					/^\d+$/.test(line.text) ||
					(counts.get(pattern(line.text)) ?? 0) >= repeated
				),
		),
	);
}

function headingLevels(lines: Line[]): (size: number) => number {
	const round = (size: number) => Math.round(size * 2) / 2;
	const chars = new Map<number, number>();
	for (const line of lines) {
		const size = round(line.size);
		chars.set(size, (chars.get(size) ?? 0) + line.text.length);
	}
	const body = [...chars].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
	const headings = [...chars.keys()]
		.filter((size) => size >= body * HEADING_RATIO)
		.sort((a, b) => b - a);
	return (size) => Math.min(headings.indexOf(round(size)) + 1, 6);
}

function join(before: string, after: string): string {
	if (!/\p{L}-$/u.test(before)) return `${before} ${after}`;
	return /^\p{Ll}/u.test(after) ? before.slice(0, -1) + after : before + after;
}

function toBlocks(lines: Line[]): Block[] {
	const level = headingLevels(lines);
	const blocks: Block[] = [];
	let previous: Line | undefined;
	for (const line of lines) {
		const separated =
			!previous ||
			(previous.page === line.page
				? previous.y - line.y > Math.max(previous.size, line.size) * BLOCK_GAP
				: !(/\p{L}-$/u.test(previous.text) || /^\p{Ll}/u.test(line.text)));
		const block = blocks.at(-1);
		const listItem = block?.kind === "list" ? block.items.at(-1) : undefined;
		const heading = level(line.size);
		const marker = line.text.match(BULLET) ?? line.text.match(NUMBERED);
		if (heading) {
			if (block?.kind === "heading" && block.level === heading && !separated)
				block.text = join(block.text, line.text);
			else blocks.push({ kind: "heading", level: heading, text: line.text });
		} else if (marker) {
			const ordered = marker[1] !== undefined;
			const item = {
				marker: ordered ? `${marker[1]}.` : "-",
				text: line.text.slice(marker[0].length),
				x: line.x,
			};
			if (block?.kind === "list" && block.ordered === ordered && !separated)
				block.items.push(item);
			else blocks.push({ kind: "list", ordered, items: [item] });
		} else if (listItem && !separated && line.x > listItem.x + 2) {
			listItem.text = join(listItem.text, line.text);
		} else if (block?.kind === "paragraph" && !separated) {
			block.text = join(block.text, line.text);
		} else {
			blocks.push({ kind: "paragraph", text: line.text });
		}
		previous = line;
	}
	return blocks;
}

function render(block: Block): string {
	if (block.kind === "heading")
		return `${"#".repeat(block.level)} ${block.text}`;
	if (block.kind === "list")
		return block.items.map((item) => `${item.marker} ${item.text}`).join("\n");
	return block.text.replace(/^#/, "\\#");
}

export function itemsToMarkdown(pages: PdfText[]): string {
	const lines = pages.map((page, index) => toLines(page.items, index));
	if (lines.every((page) => page.length === 0))
		throw new Error("pdf.error.noText");
	const blocks = toBlocks(dropPageChrome(lines).flat());
	return `${blocks.map(render).join("\n\n")}\n`;
}
