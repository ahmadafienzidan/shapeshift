import { describe, expect, it } from "vitest";
import { jsonStats, parseJson, sortKeys, tokenize } from "./json";

describe("parseJson", () => {
	it("parses valid JSON", () => {
		expect(parseJson('{"a":[1,true,null]}')).toEqual({
			ok: true,
			value: { a: [1, true, null] },
		});
	});

	it("points at the offending character with line and column", () => {
		expect(parseJson('{\n  "a": 1,\n  b: 2\n}')).toEqual({
			ok: false,
			error: { token: "b", line: 3, column: 3 },
		});
	});

	it("points at a trailing comma instead of the closing bracket", () => {
		expect(parseJson("[1, 2,]")).toEqual({
			ok: false,
			error: { token: ",", line: 1, column: 6, trailingComma: true },
		});
	});

	it("reports input that ends early with no token", () => {
		const result = parseJson('{"a": ');
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.token).toBeUndefined();
	});

	it("rejects invalid escapes and single quotes", () => {
		expect(parseJson('"\\x"').ok).toBe(false);
		expect(parseJson("{'a': 1}").ok).toBe(false);
	});
});

describe("sortKeys", () => {
	it("sorts object keys recursively and keeps array order", () => {
		const sorted = sortKeys({ b: 1, a: { d: [{ z: 1, y: 2 }], c: 2 } });
		expect(JSON.stringify(sorted)).toBe(
			'{"a":{"c":2,"d":[{"y":2,"z":1}]},"b":1}',
		);
	});
});

describe("jsonStats", () => {
	it("counts keys, objects, arrays, and depth", () => {
		expect(jsonStats({ a: 1, b: { c: [1, { d: 2 }] } })).toEqual({
			keys: 4,
			objects: 3,
			arrays: 1,
			depth: 4,
		});
		expect(jsonStats(5)).toEqual({ keys: 0, objects: 0, arrays: 0, depth: 0 });
	});
});

describe("tokenize", () => {
	it("tells keys from string values", () => {
		const types = tokenize('{"a": "b", "n": -1.5e3, "t": true}')
			.filter((token) => token.type !== "space")
			.map((token) => `${token.type}:${token.text}`);
		expect(types).toEqual([
			"punctuation:{",
			'key:"a"',
			"punctuation::",
			'string:"b"',
			"punctuation:,",
			'key:"n"',
			"punctuation::",
			"number:-1.5e3",
			"punctuation:,",
			'key:"t"',
			"punctuation::",
			"literal:true",
			"punctuation:}",
		]);
	});
});
