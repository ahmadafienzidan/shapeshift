import { describe, expect, it } from "vitest";
import {
	base64ToBytes,
	bytesToBase64,
	decodeText,
	encodeText,
	extensionFor,
	fileToBase64,
	parseBase64Input,
} from "./base64";

describe("text encoding", () => {
	it("round-trips emoji and non-Latin scripts as UTF-8", () => {
		const text = "Halo dunia 👋 — こんにちは";
		expect(decodeText(encodeText(text, false))).toBe(text);
	});

	it("uses the URL-safe alphabet without padding when asked", () => {
		expect(encodeText("??>", false)).toBe("Pz8+");
		expect(encodeText("??>", true)).toBe("Pz8-");
		expect(encodeText("a", true)).toBe("YQ");
	});

	it("decodes URL-safe input, missing padding, and whitespace", () => {
		expect(decodeText("Pz8-")).toBe("??>");
		expect(decodeText("YQ")).toBe("a");
		expect(decodeText("SGVs\nbG8=")).toBe("Hello");
	});

	it("rejects bytes that are not valid UTF-8", () => {
		expect(() =>
			decodeText(bytesToBase64(new Uint8Array([0xff, 0xfe]))),
		).toThrow();
	});
});

describe("bytes", () => {
	it("handles inputs larger than one conversion chunk", () => {
		const bytes = Uint8Array.from(
			{ length: 100_000 },
			(_, index) => index % 256,
		);
		expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
	});
});

describe("files", () => {
	it("builds a data URI with the file type", async () => {
		const file = new File(["hi"], "hi.txt", { type: "text/plain" });
		expect(await fileToBase64(file, true)).toBe("data:text/plain;base64,aGk=");
		expect(await fileToBase64(file, false)).toBe("aGk=");
	});

	it("parses data URIs and plain Base64", () => {
		const parsed = parseBase64Input("data:image/png;charset=x;base64,aGk=");
		expect(parsed.mime).toBe("image/png");
		expect(new TextDecoder().decode(parsed.bytes)).toBe("hi");
		expect(parseBase64Input("aGk=").mime).toBeUndefined();
	});

	it("picks an extension for known MIME types", () => {
		expect(extensionFor("image/jpeg")).toBe("jpg");
		expect(extensionFor("application/x-unknown")).toBe("bin");
	});
});
