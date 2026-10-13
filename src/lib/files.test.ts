import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { createZip, formatBytes } from "./files";

describe("formatBytes", () => {
	it("picks B, KB, or MB", () => {
		expect(formatBytes(512)).toBe("512 B");
		expect(formatBytes(2048)).toBe("2 KB");
		expect(formatBytes(5 * 1024 * 1024 + 300_000)).toBe("5.3 MB");
	});
});

describe("createZip", () => {
	it("keeps every file when names collide", async () => {
		const zip = await createZip([
			{ name: "photo.jpg", blob: new Blob(["a"]) },
			{ name: "photo.jpg", blob: new Blob(["b"]) },
			{ name: "photo (2).jpg", blob: new Blob(["c"]) },
		]);
		const files = unzipSync(new Uint8Array(await zip.arrayBuffer()));
		const contents = Object.fromEntries(
			Object.entries(files).map(([name, bytes]) => [
				name,
				new TextDecoder().decode(bytes),
			]),
		);
		expect(contents).toEqual({
			"photo.jpg": "a",
			"photo (2).jpg": "b",
			"photo (2) (2).jpg": "c",
		});
	});
});
