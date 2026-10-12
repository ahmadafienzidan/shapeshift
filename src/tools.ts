import {
	Binary,
	Braces,
	Combine,
	Crop,
	Droplet,
	FileJson,
	FileText,
	Fingerprint,
	GitCompare,
	type LucideIcon,
	Minimize2,
	Palette,
	QrCode,
	RefreshCcw,
	ScanEye,
	Sparkle,
	Type,
	Wrench,
} from "lucide-react";

export type ToolGroup = "images" | "documents" | "data" | "developer";

export type Tool = {
	id: string;
	path: string;
	icon: LucideIcon;
	tile: string;
	group: ToolGroup;
};

export const CONVERT_TOOL: Tool = {
	id: "convert",
	path: "/convert",
	icon: RefreshCcw,
	tile: "bg-electric text-ink",
	group: "images",
};

export const COMPRESS_TOOL: Tool = {
	id: "compress",
	path: "/compress",
	icon: Minimize2,
	tile: "bg-iris text-white",
	group: "images",
};

export const ICONS_TOOL: Tool = {
	id: "icons",
	path: "/icons",
	icon: Sparkle,
	tile: "bg-electric text-ink",
	group: "images",
};

export const METADATA_TOOL: Tool = {
	id: "metadata",
	path: "/metadata",
	icon: ScanEye,
	tile: "bg-sun text-ink",
	group: "images",
};

export const PDF_TOOL: Tool = {
	id: "pdf",
	path: "/pdf",
	icon: FileText,
	tile: "bg-coral text-ink",
	group: "documents",
};

export const QR_TOOL: Tool = {
	id: "qr",
	path: "/qr",
	icon: QrCode,
	tile: "bg-iris text-white",
	group: "documents",
};

export const DATA_TOOL: Tool = {
	id: "data",
	path: "/data",
	icon: Braces,
	tile: "bg-sun text-ink",
	group: "data",
};

export const BASE64_TOOL: Tool = {
	id: "base64",
	path: "/base64",
	icon: Binary,
	tile: "bg-coral text-ink",
	group: "data",
};

export const CHECKSUM_TOOL: Tool = {
	id: "checksum",
	path: "/checksum",
	icon: Fingerprint,
	tile: "bg-electric text-ink",
	group: "data",
};

export const MERGE_TOOL: Tool = {
	id: "merge",
	path: "/merge",
	icon: Combine,
	tile: "bg-sun text-ink",
	group: "images",
};

export const WATERMARK_TOOL: Tool = {
	id: "watermark",
	path: "/watermark",
	icon: Droplet,
	tile: "bg-iris text-white",
	group: "images",
};

export const CROP_TOOL: Tool = {
	id: "crop",
	path: "/crop",
	icon: Crop,
	tile: "bg-iris text-white",
	group: "images",
};

export const TEXT_TOOL: Tool = {
	id: "text",
	path: "/text",
	icon: Type,
	tile: "bg-coral text-ink",
	group: "data",
};

export const COLOR_TOOL: Tool = {
	id: "color",
	path: "/color",
	icon: Palette,
	tile: "bg-coral text-ink",
	group: "images",
};

export const JSON_TOOL: Tool = {
	id: "json",
	path: "/json",
	icon: FileJson,
	tile: "bg-sun text-ink",
	group: "developer",
};

export const DIFF_TOOL: Tool = {
	id: "diff",
	path: "/diff",
	icon: GitCompare,
	tile: "bg-iris text-white",
	group: "developer",
};

export const DEVTOOLS_TOOL: Tool = {
	id: "devtools",
	path: "/devtools",
	icon: Wrench,
	tile: "bg-electric text-ink",
	group: "developer",
};

export const TOOLS: Tool[] = [
	CONVERT_TOOL,
	COMPRESS_TOOL,
	CROP_TOOL,
	MERGE_TOOL,
	WATERMARK_TOOL,
	ICONS_TOOL,
	METADATA_TOOL,
	COLOR_TOOL,
	PDF_TOOL,
	QR_TOOL,
	DATA_TOOL,
	TEXT_TOOL,
	BASE64_TOOL,
	CHECKSUM_TOOL,
	JSON_TOOL,
	DIFF_TOOL,
	DEVTOOLS_TOOL,
];

export const TOOL_GROUPS: ToolGroup[] = [
	"images",
	"documents",
	"data",
	"developer",
];
