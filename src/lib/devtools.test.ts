import { describe, expect, it } from "vitest";
import { encodeText } from "./base64";
import {
	decodeJwt,
	parseTimestamp,
	parseUrl,
	relativeTime,
	uuidV7,
} from "./devtools";

const segment = (value: object) => encodeText(JSON.stringify(value), true);

describe("decodeJwt", () => {
	const token = `${segment({ alg: "HS256" })}.${segment({ sub: "42", exp: 1_700_000_000 })}.sig`;

	it("decodes the header and payload, ignoring a Bearer prefix", () => {
		expect(decodeJwt(`Bearer ${token}`)).toEqual({
			header: { alg: "HS256" },
			payload: { sub: "42", exp: 1_700_000_000 },
			signature: "sig",
		});
	});

	it("rejects tokens without three parts", () => {
		expect(() => decodeJwt("abc.def")).toThrow("jwt.error.parts");
	});
});

describe("uuidV7", () => {
	it("is a version 7, variant 1 UUID", () => {
		expect(uuidV7()).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	});

	it("starts with the current millisecond timestamp", () => {
		const before = Date.now();
		const id = uuidV7();
		const millis = Number.parseInt(id.replace(/-/g, "").slice(0, 12), 16);
		expect(millis).toBeGreaterThanOrEqual(before);
		expect(millis).toBeLessThanOrEqual(Date.now());
	});
});

describe("parseTimestamp", () => {
	it("reads Unix seconds and milliseconds", () => {
		expect(parseTimestamp("1700000000")?.toISOString()).toBe(
			"2023-11-14T22:13:20.000Z",
		);
		expect(parseTimestamp("1700000000123")?.toISOString()).toBe(
			"2023-11-14T22:13:20.123Z",
		);
	});

	it("reads ISO dates and rejects nonsense", () => {
		expect(parseTimestamp(" 2024-02-29T12:00:00Z ")?.getTime()).toBe(
			Date.UTC(2024, 1, 29, 12),
		);
		expect(parseTimestamp("not a date")).toBeUndefined();
		expect(parseTimestamp("")).toBeUndefined();
	});
});

describe("relativeTime", () => {
	const now = Date.UTC(2024, 0, 10);

	it("picks the largest fitting unit", () => {
		expect(relativeTime(new Date(now - 2 * 3600_000), "en", now)).toBe(
			"2 hours ago",
		);
		expect(relativeTime(new Date(now + 86_400_000), "en", now)).toBe(
			"tomorrow",
		);
		expect(relativeTime(new Date(now - 3 * 86_400_000), "id", now)).toBe(
			"3 hari yang lalu",
		);
	});
});

describe("parseUrl", () => {
	it("parses trimmed absolute URLs only", () => {
		expect(parseUrl(" https://example.com/a?b=1 ")?.searchParams.get("b")).toBe(
			"1",
		);
		expect(parseUrl("example.com")).toBeUndefined();
	});
});
