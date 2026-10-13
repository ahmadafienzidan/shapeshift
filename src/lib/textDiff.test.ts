import { describe, expect, it } from "vitest";
import { diffInline, diffRows } from "./textDiff";

const strict = { ignoreWhitespace: false, ignoreCase: false };

describe("diffRows", () => {
	it("pairs a changed line side by side with word-level changes", () => {
		const { rows, added, removed } = diffRows(
			"a\nold line\nc\n",
			"a\nnew line\nc\n",
			strict,
		);
		expect({ added, removed }).toEqual({ added: 1, removed: 1 });
		expect(rows.map((row) => row.type)).toEqual(["same", "changed", "same"]);
		const changed = rows[1];
		expect(changed?.type === "changed" && changed.left?.text).toBe("old line");
		expect(changed?.type === "changed" && changed.right?.text).toBe("new line");
		expect(
			changed?.type === "changed" &&
				changed.words?.filter((part) => part.added).map((part) => part.value),
		).toEqual(["new"]);
	});

	it("keeps line numbers aligned across additions and removals", () => {
		const { rows } = diffRows("a\nb\n", "a\nx\ny\nb\n", strict);
		expect(
			rows.map(
				(row) => `${row.left?.number ?? "-"}:${row.right?.number ?? "-"}`,
			),
		).toEqual(["1:1", "-:2", "-:3", "2:4"]);
	});

	it("ignores case while showing the original text", () => {
		const { rows, added } = diffRows("Hello\n", "HELLO\n", {
			...strict,
			ignoreCase: true,
		});
		expect(added).toBe(0);
		expect(rows[0]?.left?.text).toBe("Hello");
		expect(rows[0]?.right?.text).toBe("HELLO");
	});

	it("treats CRLF and LF as the same line ending", () => {
		expect(diffRows("a\r\nb\r\n", "a\nb\n", strict).added).toBe(0);
	});
});

describe("diffInline", () => {
	it("diffs by characters", () => {
		const parts = diffInline("kitten", "sitten", "chars", strict);
		expect(
			parts.filter((part) => part.added).map((part) => part.value),
		).toEqual(["s"]);
	});
});
