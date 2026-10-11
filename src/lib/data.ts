import Papa from "papaparse";
import YAML from "yaml";

export type DataFormat = "json" | "csv" | "yaml";

export type DataOptions = { indent: number; delimiter: string };

export const DATA_EXTENSIONS: Record<DataFormat, string> = {
	json: "json",
	csv: "csv",
	yaml: "yaml",
};

export const DATA_MIME: Record<DataFormat, string> = {
	json: "application/json",
	csv: "text/csv",
	yaml: "application/yaml",
};

export function detectFormat(name: string): DataFormat | undefined {
	const extension = name.split(".").pop()?.toLowerCase();
	if (extension === "json") return "json";
	if (extension === "csv" || extension === "tsv") return "csv";
	if (extension === "yaml" || extension === "yml") return "yaml";
	return undefined;
}

function parse(
	text: string,
	format: DataFormat,
	options: DataOptions,
): unknown {
	if (format === "json") return JSON.parse(text);
	if (format === "yaml") return YAML.parse(text);

	const result = Papa.parse(text.trim(), {
		header: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		delimiter: options.delimiter,
	});
	const [error] = result.errors;
	if (error) {
		throw new Error(
			error.row === undefined
				? error.message
				: `${error.message} (row ${error.row + 1})`,
		);
	}
	return (result.data as Record<string, unknown>[]).map(unflatten);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

// CSV is flat, so nested objects become dot-separated columns ("address.city")
// and arrays are kept as JSON text inside a single cell.
function flatten(
	value: Record<string, unknown>,
	prefix = "",
	target: Record<string, unknown> = {},
): Record<string, unknown> {
	for (const [key, child] of Object.entries(value)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (isRecord(child)) flatten(child, path, target);
		else target[path] = Array.isArray(child) ? JSON.stringify(child) : child;
	}
	return target;
}

function parseCell(value: unknown): unknown {
	if (typeof value !== "string" || !/^[[{]/.test(value)) return value;
	// A cell like "[draft] notes" is plain text, not a JSON array.
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

function unflatten(row: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [path, value] of Object.entries(row)) {
		const keys = path.split(".");
		const last = keys.pop() as string;
		let target = result;
		for (const key of keys) {
			if (!isRecord(target[key])) target[key] = {};
			target = target[key] as Record<string, unknown>;
		}
		target[last] = parseCell(value);
	}
	return result;
}

function toRows(value: unknown): Record<string, unknown>[] {
	const list = Array.isArray(value) ? value : [value];
	return list.map((row, index) => {
		if (!isRecord(row)) {
			throw new Error(
				`CSV needs a list of objects, but item ${index + 1} is ${row === null ? "null" : typeof row}.`,
			);
		}
		return flatten(row);
	});
}

function serialize(
	value: unknown,
	format: DataFormat,
	options: DataOptions,
): string {
	if (format === "json") return JSON.stringify(value, null, options.indent);
	if (format === "yaml")
		return YAML.stringify(value, { indent: options.indent });

	const rows = toRows(value);
	const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
	return Papa.unparse(rows, { columns, delimiter: options.delimiter });
}

export function convertData(
	text: string,
	from: DataFormat,
	to: DataFormat,
	options: DataOptions,
): string {
	if (text.trim() === "") return "";
	return serialize(parse(text, from, options), to, options);
}

export const SAMPLE = `[
  {
    "name": "Ayu",
    "city": "Bandung",
    "skills": ["design", "react"],
    "contact": { "email": "ayu@example.com", "phone": "0812-0000-0001" }
  },
  {
    "name": "Budi",
    "city": "Surabaya",
    "skills": ["go"],
    "contact": { "email": "budi@example.com", "phone": "0812-0000-0002" }
  }
]
`;
