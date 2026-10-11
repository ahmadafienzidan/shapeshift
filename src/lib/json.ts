// `token` is the offending character, or undefined when the input ended early.
export type JsonError = {
	token?: string;
	line: number;
	column: number;
	trailingComma?: boolean;
};

export type JsonResult =
	| { ok: true; value: unknown }
	| { ok: false; error: JsonError };

function locate(text: string, position: number): JsonError {
	const before = text.slice(0, position);
	return {
		token: text[position],
		line: before.split("\n").length,
		column: position - before.lastIndexOf("\n"),
	};
}

// JSON.parse error messages differ between browsers and recent Chrome no
// longer includes a position, so a small validating scanner finds the exact
// character where the input stops being valid JSON.
function findError(text: string): number {
	let index = 0;
	const fail = (): never => {
		throw index;
	};
	const space = () => {
		while (/\s/.test(text[index] ?? "")) index++;
	};
	const expect = (word: string) => {
		for (const char of word) {
			if (text[index] !== char) fail();
			index++;
		}
	};
	const string = () => {
		expect('"');
		while (text[index] !== '"') {
			const char = text[index];
			if (char === undefined || char < " ") fail();
			if (char === "\\") {
				index++;
				const escaped = text[index] ?? "";
				if (escaped === "u") {
					for (let digit = 1; digit <= 4; digit++) {
						if (!/[0-9a-fA-F]/.test(text[index + digit] ?? "")) {
							index += digit;
							fail();
						}
					}
					index += 4;
				} else if (!'"\\/bfnrt'.includes(escaped) || escaped === "") fail();
			}
			index++;
		}
		index++;
	};
	const number = () => {
		const match = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(
			text.slice(index),
		);
		if (!match) fail();
		index += match?.[0].length ?? 0;
	};
	const value = (): void => {
		space();
		const char = text[index];
		if (char === "{") {
			index++;
			space();
			if (text[index] === "}") {
				index++;
				return;
			}
			for (;;) {
				space();
				string();
				space();
				expect(":");
				value();
				space();
				if (text[index] === ",") index++;
				else if (text[index] === "}") {
					index++;
					return;
				} else fail();
			}
		}
		if (char === "[") {
			index++;
			space();
			if (text[index] === "]") {
				index++;
				return;
			}
			for (;;) {
				value();
				space();
				if (text[index] === ",") index++;
				else if (text[index] === "]") {
					index++;
					return;
				} else fail();
			}
		}
		if (char === '"') string();
		else if (char === "t") expect("true");
		else if (char === "f") expect("false");
		else if (char === "n") expect("null");
		else if (char === "-" || /\d/.test(char ?? "")) number();
		else fail();
	};

	try {
		value();
		space();
		if (index < text.length) fail();
	} catch (position) {
		return position as number;
	}
	return text.length;
}

export function parseJson(text: string): JsonResult {
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch {
		const position = findError(text);
		// `[1, 2,]` fails at the bracket, but the comma is what needs deleting.
		if (text[position] === "}" || text[position] === "]") {
			const comma = text.slice(0, position).trimEnd().length - 1;
			if (text[comma] === ",") {
				return {
					ok: false,
					error: { ...locate(text, comma), trailingComma: true },
				};
			}
		}
		return { ok: false, error: locate(text, position) };
	}
}

export function sortKeys(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortKeys);
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.keys(value)
				.sort((a, b) => a.localeCompare(b))
				.map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
		);
	}
	return value;
}

export type JsonStats = {
	keys: number;
	objects: number;
	arrays: number;
	depth: number;
};

export function jsonStats(value: unknown, depth = 0): JsonStats {
	if (Array.isArray(value)) {
		return value.reduce<JsonStats>(
			(total, item) => {
				const child = jsonStats(item, depth + 1);
				return {
					keys: total.keys + child.keys,
					objects: total.objects + child.objects,
					arrays: total.arrays + child.arrays,
					depth: Math.max(total.depth, child.depth),
				};
			},
			{ keys: 0, objects: 0, arrays: 1, depth: depth + 1 },
		);
	}
	if (value && typeof value === "object") {
		return Object.values(value).reduce<JsonStats>(
			(total, item) => {
				const child = jsonStats(item, depth + 1);
				return {
					keys: total.keys + child.keys,
					objects: total.objects + child.objects,
					arrays: total.arrays + child.arrays,
					depth: Math.max(total.depth, child.depth),
				};
			},
			{
				keys: Object.keys(value).length,
				objects: 1,
				arrays: 0,
				depth: depth + 1,
			},
		);
	}
	return { keys: 0, objects: 0, arrays: 0, depth };
}

export type TokenType =
	| "key"
	| "string"
	| "number"
	| "literal"
	| "punctuation"
	| "space";

const TOKEN =
	/("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],])|(\s+)/g;

// Tokenizes output that came from JSON.stringify, so the input is already
// known to be valid JSON and a single regular expression is enough.
export function tokenize(json: string): { type: TokenType; text: string }[] {
	const tokens: { type: TokenType; text: string }[] = [];
	for (const match of json.matchAll(TOKEN)) {
		const [, string, colon, number, literal, punctuation, space] = match;
		if (string !== undefined) {
			tokens.push({ type: colon ? "key" : "string", text: string });
			if (colon) tokens.push({ type: "punctuation", text: colon });
		} else if (number !== undefined)
			tokens.push({ type: "number", text: number });
		else if (literal !== undefined)
			tokens.push({ type: "literal", text: literal });
		else if (punctuation !== undefined) {
			tokens.push({ type: "punctuation", text: punctuation });
		} else if (space !== undefined) tokens.push({ type: "space", text: space });
	}
	return tokens;
}
