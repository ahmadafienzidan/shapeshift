import { type ChangeObject, diffChars, diffLines, diffWords } from "diff";

export type DiffOptions = { ignoreWhitespace: boolean; ignoreCase: boolean };

export type Side = { number: number; text: string };

export type DiffRow =
	| { type: "same"; left: Side; right: Side }
	| {
			type: "changed";
			left?: Side;
			right?: Side;
			// Word-level changes inside a modified line, for highlighting.
			words?: ChangeObject<string>[];
	  };

function splitLines(value: string): string[] {
	const lines = value.split("\n");
	if (lines.at(-1) === "") lines.pop();
	return lines;
}

export function diffRows(
	before: string,
	after: string,
	options: DiffOptions,
): { rows: DiffRow[]; added: number; removed: number } {
	// diffLines has no ignoreCase option, so lower-cased copies are compared and
	// the original lines are looked up by line number for display.
	const fold = (text: string) =>
		options.ignoreCase ? text.toLowerCase() : text;
	const changes = diffLines(fold(before), fold(after), {
		ignoreWhitespace: options.ignoreWhitespace,
		stripTrailingCr: true,
	});
	const oldLines = splitLines(before.replace(/\r\n/g, "\n"));
	const newLines = splitLines(after.replace(/\r\n/g, "\n"));
	const rows: DiffRow[] = [];
	let left = 1;
	let right = 1;
	let added = 0;
	let removed = 0;

	const oldSide = (): Side => ({
		number: left,
		text: oldLines[left++ - 1] ?? "",
	});
	const newSide = (): Side => ({
		number: right,
		text: newLines[right++ - 1] ?? "",
	});

	for (let index = 0; index < changes.length; index++) {
		const change = changes[index];
		if (!change) continue;
		const count = splitLines(change.value).length;

		if (!change.added && !change.removed) {
			for (let line = 0; line < count; line++) {
				rows.push({ type: "same", left: oldSide(), right: newSide() });
			}
			continue;
		}

		// A removal directly followed by an addition is a modification: pair the
		// lines up so they sit side by side.
		const next = changes[index + 1];
		const removedCount = change.removed ? count : 0;
		const addedCount = change.added
			? count
			: next?.added
				? splitLines(next.value).length
				: 0;
		if (change.removed && next?.added) index++;

		removed += removedCount;
		added += addedCount;
		for (let line = 0; line < Math.max(removedCount, addedCount); line++) {
			const oldText = line < removedCount ? oldSide() : undefined;
			const newText = line < addedCount ? newSide() : undefined;
			rows.push({
				type: "changed",
				left: oldText,
				right: newText,
				words:
					oldText && newText
						? diffWords(oldText.text, newText.text, {
								ignoreCase: options.ignoreCase,
							})
						: undefined,
			});
		}
	}

	return { rows, added, removed };
}

export function diffInline(
	before: string,
	after: string,
	granularity: "words" | "chars",
	options: DiffOptions,
): ChangeObject<string>[] {
	return granularity === "words"
		? diffWords(before, after, { ignoreCase: options.ignoreCase })
		: diffChars(before, after, { ignoreCase: options.ignoreCase });
}
