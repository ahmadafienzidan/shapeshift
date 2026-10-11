import { base64ToBytes } from "./base64";

export function parseUrl(input: string): URL | undefined {
	return URL.canParse(input.trim()) ? new URL(input.trim()) : undefined;
}

export type JwtParts = {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string;
};

function decodeSegment(segment: string): Record<string, unknown> {
	const json = new TextDecoder("utf-8", { fatal: true }).decode(
		base64ToBytes(segment),
	);
	return JSON.parse(json);
}

export function decodeJwt(token: string): JwtParts {
	const parts = token
		.trim()
		.replace(/^Bearer\s+/i, "")
		.split(".");
	if (parts.length !== 3) throw new Error("jwt.error.parts");
	const [header = "", payload = "", signature = ""] = parts;
	return {
		header: decodeSegment(header),
		payload: decodeSegment(payload),
		signature,
	};
}

export const JWT_TIME_CLAIMS = ["exp", "iat", "nbf", "auth_time"];

// UUID v7 puts a millisecond timestamp in the first 48 bits, so IDs sort by
// creation time — the reason it is now preferred for database keys.
export function uuidV7(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	const now = Date.now();
	for (let index = 0; index < 6; index++) {
		bytes[index] = Math.floor(now / 2 ** (8 * (5 - index))) & 0xff;
	}
	bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
	bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
	const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
	return [
		hex.slice(0, 4),
		hex.slice(4, 6),
		hex.slice(6, 8),
		hex.slice(8, 10),
		hex.slice(10, 16),
	]
		.map((group) => group.join(""))
		.join("-");
}

export function parseTimestamp(input: string): Date | undefined {
	const value = input.trim();
	if (value === "") return undefined;
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		const number = Number(value);
		// Values below ~5138 AD in seconds are treated as seconds, larger ones
		// as milliseconds, matching how APIs usually send them.
		return new Date(Math.abs(number) < 1e11 ? number * 1000 : number);
	}
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	["year", 365 * 24 * 3600],
	["month", 30 * 24 * 3600],
	["week", 7 * 24 * 3600],
	["day", 24 * 3600],
	["hour", 3600],
	["minute", 60],
	["second", 1],
];

export function relativeTime(
	date: Date,
	locale: string,
	now = Date.now(),
): string {
	const seconds = (date.getTime() - now) / 1000;
	const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
	for (const [unit, size] of RELATIVE_UNITS) {
		if (Math.abs(seconds) >= size || unit === "second") {
			return format.format(Math.round(seconds / size), unit);
		}
	}
	return format.format(0, "second");
}
