import { describe, expect, it } from "vitest";
import { hashFile, normalizeHash } from "./checksum";

describe("hashFile", () => {
	it("computes every requested digest in one pass and reports progress", async () => {
		const progress: number[] = [];
		const hashes = await hashFile(
			new File(["abc"], "abc.txt"),
			["md5", "sha1", "sha256"],
			(fraction) => progress.push(fraction),
		);
		expect(hashes).toEqual({
			md5: "900150983cd24fb0d6963f7d28e17f72",
			sha1: "a9993e364706816aba3e25717850c26c9cd0d89d",
			sha256:
				"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		});
		expect(progress.at(-1)).toBe(1);
	});

	it("hashes an empty file", async () => {
		expect(await hashFile(new File([], "empty"), ["md5"], () => {})).toEqual({
			md5: "d41d8cd98f00b204e9800998ecf8427e",
		});
	});
});

describe("normalizeHash", () => {
	it("pulls the digest out of a pasted checksum line", () => {
		expect(
			normalizeHash("  D41D8CD98F00B204E9800998ECF8427E  ubuntu.iso\n"),
		).toBe("d41d8cd98f00b204e9800998ecf8427e");
		expect(
			normalizeHash("SHA1 (file) = a9993e364706816aba3e25717850c26c9cd0d89d"),
		).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
	});
});
