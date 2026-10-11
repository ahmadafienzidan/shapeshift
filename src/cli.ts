#!/usr/bin/env bun
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { parseArgs } from "node:util";
import convert from "heic-convert";

const USAGE = `Usage: heic-convert <file|dir>... [options]

Options:
  -f, --format <png|jpg>   Output format (default: jpg)
  -q, --quality <0-1>      JPEG quality (default: 0.92)
  -o, --out <dir>          Output directory (default: next to input)
  -r, --recursive          Walk directories recursively
  -h, --help               Show this help`;

const FORMATS = { png: "PNG", jpg: "JPEG", jpeg: "JPEG" } as const;

type Format = keyof typeof FORMATS;

function isHeic(path: string): boolean {
	return /\.(heic|heif)$/i.test(path);
}

async function collect(path: string, recursive: boolean): Promise<string[]> {
	if (!(await stat(path)).isDirectory()) return [path];
	const entries = await readdir(path, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map((entry) => {
			const full = join(path, entry.name);
			if (entry.isDirectory()) return recursive ? collect(full, true) : [];
			return isHeic(entry.name) ? [full] : [];
		}),
	);
	return nested.flat();
}

async function convertFile(
	input: string,
	format: Format,
	quality: number,
	outDir: string | undefined,
): Promise<string> {
	const buffer = await readFile(input);
	const output = await convert({
		buffer: new Uint8Array(buffer),
		format: FORMATS[format],
		quality,
	});
	const ext = format === "png" ? "png" : "jpg";
	const target = join(
		outDir ?? dirname(input),
		`${basename(input, extname(input))}.${ext}`,
	);
	await writeFile(target, output);
	return target;
}

async function main(): Promise<void> {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			format: { type: "string", short: "f", default: "jpg" },
			quality: { type: "string", short: "q", default: "0.92" },
			out: { type: "string", short: "o" },
			recursive: { type: "boolean", short: "r", default: false },
			help: { type: "boolean", short: "h", default: false },
		},
	});

	if (values.help || positionals.length === 0) {
		console.log(USAGE);
		process.exit(values.help ? 0 : 1);
	}

	const format = values.format.toLowerCase();
	if (!(format in FORMATS)) {
		throw new Error(`Unsupported format "${values.format}". Use png or jpg.`);
	}

	const quality = Number(values.quality);
	if (Number.isNaN(quality) || quality < 0 || quality > 1) {
		throw new Error(
			`Quality must be between 0 and 1, got "${values.quality}".`,
		);
	}

	if (values.out) await mkdir(values.out, { recursive: true });

	const files = (
		await Promise.all(positionals.map((p) => collect(p, values.recursive)))
	).flat();
	if (files.length === 0) throw new Error("No HEIC/HEIF files found.");

	for (const file of files) {
		const target = await convertFile(
			file,
			format as Format,
			quality,
			values.out,
		);
		console.log(`${file} -> ${target}`);
	}
}

await main();
