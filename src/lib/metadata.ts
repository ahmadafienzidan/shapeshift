import ExifReader from "exifreader";

export type MetadataSummary = {
	camera?: string;
	lens?: string;
	taken?: string;
	software?: string;
	exposure?: string;
	gps?: { latitude: number; longitude: number; altitude?: number };
	groups: { name: string; fields: [string, string][] }[];
	count: number;
};

// Groups that describe how to decode the pixels (or are binary blobs) rather
// than anything about the photo or the person who took it. Cleaning keeps the
// colour profile and format headers, so counting them would look like leftovers.
const HIDDEN_GROUPS = new Set([
	"Thumbnail",
	"metadataRange",
	"file",
	"pngFile",
	"png",
	"jfif",
	"icc",
	"riff",
	"gif",
]);

type Tag = { description?: unknown; value?: unknown };

function describe(tag: unknown): string | undefined {
	if (typeof tag !== "object" || tag === null) return undefined;
	const { description, value } = tag as Tag;
	const text = description ?? value;
	if (text === undefined || text === null) return undefined;
	const string = (typeof text === "string" ? text : JSON.stringify(text))
		.replaceAll("\0", "")
		.trim();
	if (string === "") return undefined;
	return string.length > 300 ? `${string.slice(0, 300)}…` : string;
}

export async function readMetadata(file: File): Promise<MetadataSummary> {
	const tags = await ExifReader.load(await file.arrayBuffer(), {
		expanded: true,
	});
	const exif = (tags.exif ?? {}) as Record<string, unknown>;
	const text = (name: string) => describe(exif[name]);

	const groups = Object.entries(tags)
		.filter(([name]) => !HIDDEN_GROUPS.has(name))
		.map(([name, group]) => ({
			name,
			fields: Object.entries(group as Record<string, unknown>)
				.filter(([key]) => key !== "_raw")
				.flatMap(([key, tag]): [string, string][] => {
					if (name === "gps" && typeof tag === "number") {
						return [[key, String(tag)]];
					}
					const value = describe(tag);
					return value === undefined ? [] : [[key, value]];
				}),
		}))
		.filter((group) => group.fields.length > 0);

	const exposure = [
		text("ExposureTime") && `${text("ExposureTime")} s`,
		text("FNumber"),
		text("ISOSpeedRatings") && `ISO ${text("ISOSpeedRatings")}`,
		text("FocalLength"),
	]
		.filter(Boolean)
		.join(" · ");

	const { Latitude, Longitude, Altitude } = tags.gps ?? {};

	return {
		camera:
			[text("Make"), text("Model")].filter(Boolean).join(" ") || undefined,
		lens: text("LensModel"),
		taken: text("DateTimeOriginal") ?? text("DateTime"),
		software: text("Software"),
		exposure: exposure || undefined,
		gps:
			Latitude !== undefined && Longitude !== undefined
				? { latitude: Latitude, longitude: Longitude, altitude: Altitude }
				: undefined,
		groups,
		count: groups.reduce((sum, group) => sum + group.fields.length, 0),
	};
}

function readOrientation(exif: DataView): number | undefined {
	// exif starts at "Exif\0\0"; the TIFF header follows.
	const tiff = 6;
	const little = exif.getUint16(tiff) === 0x4949;
	const ifd = tiff + exif.getUint32(tiff + 4, little);
	const count = exif.getUint16(ifd, little);
	for (let index = 0; index < count; index++) {
		const entry = ifd + 2 + index * 12;
		if (exif.getUint16(entry, little) === 0x0112) {
			return exif.getUint16(entry + 8, little);
		}
	}
	return undefined;
}

// A minimal big-endian EXIF block holding only the Orientation tag, so photos
// taken sideways still display upright after everything else is removed.
function orientationSegment(orientation: number): Uint8Array {
	const bytes = new Uint8Array(2 + 2 + 6 + 8 + 2 + 12 + 4);
	const view = new DataView(bytes.buffer);
	view.setUint16(0, 0xffe1);
	view.setUint16(2, bytes.length - 2);
	bytes.set([0x45, 0x78, 0x69, 0x66, 0, 0], 4);
	bytes.set([0x4d, 0x4d, 0x00, 0x2a], 10);
	view.setUint32(14, 8);
	view.setUint16(18, 1);
	view.setUint16(20, 0x0112);
	view.setUint16(22, 3);
	view.setUint32(24, 1);
	view.setUint16(28, orientation);
	view.setUint32(32, 0);
	return bytes;
}

function stripJpeg(bytes: Uint8Array): Uint8Array {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const kept: Uint8Array[] = [bytes.subarray(0, 2)];
	let orientation: number | undefined;
	let offset = 2;

	while (offset < bytes.length) {
		const marker = view.getUint16(offset);
		// Start of scan: the compressed image data runs to the end of the file.
		if (marker === 0xffda) {
			kept.push(bytes.subarray(offset));
			break;
		}
		const length = view.getUint16(offset + 2);
		const segment = bytes.subarray(offset, offset + 2 + length);
		const isExif =
			marker === 0xffe1 &&
			String.fromCharCode(...segment.subarray(4, 8)) === "Exif";
		if (isExif && orientation === undefined) {
			orientation = readOrientation(
				new DataView(bytes.buffer, bytes.byteOffset + offset + 4, length - 2),
			);
		}
		const isIccProfile =
			marker === 0xffe2 &&
			String.fromCharCode(...segment.subarray(4, 15)) === "ICC_PROFILE";
		// APP0 (JFIF) and APP14 (Adobe colour transform) change how pixels are
		// decoded, and the ICC profile changes colours, so they stay.
		const removable =
			(marker >= 0xffe1 &&
				marker <= 0xffef &&
				marker !== 0xffee &&
				!isIccProfile) ||
			marker === 0xfffe;
		if (!removable) kept.push(segment);
		offset += 2 + length;
	}

	if (orientation && orientation !== 1) {
		kept.splice(1, 0, orientationSegment(orientation));
	}
	return concat(kept);
}

const PNG_METADATA = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);

function stripPng(bytes: Uint8Array): Uint8Array {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const kept: Uint8Array[] = [bytes.subarray(0, 8)];
	let offset = 8;
	while (offset < bytes.length) {
		const length = view.getUint32(offset);
		const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
		const end = offset + 12 + length;
		if (!PNG_METADATA.has(type)) kept.push(bytes.subarray(offset, end));
		offset = end;
	}
	return concat(kept);
}

function stripWebp(bytes: Uint8Array): Uint8Array {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const kept: Uint8Array[] = [];
	let offset = 12;
	while (offset < bytes.length) {
		const type = String.fromCharCode(...bytes.subarray(offset, offset + 4));
		const size = view.getUint32(offset + 4, true);
		const end = offset + 8 + size + (size % 2);
		if (type !== "EXIF" && type !== "XMP ") {
			const chunk = bytes.slice(offset, end);
			// VP8X advertises EXIF (bit 3) and XMP (bit 2) in its flags byte.
			if (type === "VP8X") chunk[8] = (chunk[8] ?? 0) & ~0b1100;
			kept.push(chunk);
		}
		offset = end;
	}
	const body = concat(kept);
	const header = new Uint8Array(12);
	header.set(bytes.subarray(0, 12));
	new DataView(header.buffer).setUint32(4, body.length + 4, true);
	return concat([header, body]);
}

function concat(parts: Uint8Array[]): Uint8Array {
	const result = new Uint8Array(
		parts.reduce((sum, part) => sum + part.length, 0),
	);
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}
	return result;
}

export function canStrip(file: File): boolean {
	return (
		/\.(jpe?g|png|webp)$/i.test(file.name) ||
		["image/jpeg", "image/png", "image/webp"].includes(file.type)
	);
}

export async function stripMetadata(file: File): Promise<Blob> {
	const bytes = new Uint8Array(await file.arrayBuffer());
	const signature = bytes.subarray(0, 4);
	let stripped: Uint8Array;
	if (signature[0] === 0xff && signature[1] === 0xd8)
		stripped = stripJpeg(bytes);
	else if (signature[0] === 0x89 && signature[1] === 0x50)
		stripped = stripPng(bytes);
	else if (String.fromCharCode(...signature) === "RIFF")
		stripped = stripWebp(bytes);
	else
		throw new Error(
			"Only JPEG, PNG, and WebP can be cleaned without re-encoding.",
		);
	return new Blob([stripped as Uint8Array<ArrayBuffer>], { type: file.type });
}
