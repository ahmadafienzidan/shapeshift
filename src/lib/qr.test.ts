import { describe, expect, it } from "vitest";
import { normalizeHash } from "./checksum";
import { wifiPayload } from "./qr";

describe("wifiPayload", () => {
	it("escapes special characters in the network name and password", () => {
		expect(wifiPayload('Cafe;"Kopi"', "pa:ss,word\\", "WPA")).toBe(
			'WIFI:T:WPA;S:Cafe\\;\\"Kopi\\";P:pa\\:ss\\,word\\\\;;',
		);
	});

	it("leaves out the password for open networks", () => {
		expect(wifiPayload("Free", "ignored", "nopass")).toBe(
			"WIFI:T:nopass;S:Free;;",
		);
	});
});

describe("normalizeHash", () => {
	it("pulls the hash out of a sha256sum line", () => {
		const hash = "a".repeat(64);
		expect(normalizeHash(`  ${hash.toUpperCase()}  shapeshift.zip\n`)).toBe(
			hash,
		);
	});
});
