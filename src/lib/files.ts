import { zipSync } from "fflate";
import type { DropItem } from "react-aria-components";

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function collectItem(item: DropItem): Promise<File[]> {
	if (item.kind === "file") return [await item.getFile()];
	if (item.kind === "directory") {
		const files: File[] = [];
		for await (const entry of item.getEntries()) {
			files.push(...(await collectItem(entry)));
		}
		return files;
	}
	return [];
}

export async function collectDropItems(items: DropItem[]): Promise<File[]> {
	return (await Promise.all(items.map(collectItem))).flat();
}

function uniqueName(name: string, taken: Set<string>): string {
	if (!taken.has(name)) return name;
	const dot = name.lastIndexOf(".");
	const base = dot === -1 ? name : name.slice(0, dot);
	const ext = dot === -1 ? "" : name.slice(dot);
	let index = 2;
	while (taken.has(`${base} (${index})${ext}`)) index++;
	return `${base} (${index})${ext}`;
}

export async function createZip(
	files: { name: string; blob: Blob }[],
): Promise<Blob> {
	const taken = new Set<string>();
	const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
	for (const file of files) {
		const name = uniqueName(file.name, taken);
		taken.add(name);
		entries[name] = [
			new Uint8Array(await file.blob.arrayBuffer()),
			{ level: 0 },
		];
	}
	return new Blob([zipSync(entries)], { type: "application/zip" });
}

export function downloadBlob(blob: Blob, name: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = name;
	link.click();
	URL.revokeObjectURL(url);
}
