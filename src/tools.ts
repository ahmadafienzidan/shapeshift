import {
	Binary,
	Braces,
	FileText,
	Fingerprint,
	type LucideIcon,
	Minimize2,
	QrCode,
	RefreshCcw,
	ScanEye,
	Sparkle,
} from "lucide-react";

export type ToolGroup = "images" | "documents" | "data";

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

export const TOOLS: Tool[] = [
	CONVERT_TOOL,
	COMPRESS_TOOL,
	ICONS_TOOL,
	METADATA_TOOL,
	PDF_TOOL,
	QR_TOOL,
	DATA_TOOL,
	BASE64_TOOL,
	CHECKSUM_TOOL,
];

export const TOOL_GROUPS: ToolGroup[] = ["images", "documents", "data"];
