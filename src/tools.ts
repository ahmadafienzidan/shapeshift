import {
	Binary,
	Braces,
	Combine,
	Crop,
	Droplet,
	FileImage,
	FileJson,
	Files,
	FileText,
	Fingerprint,
	FolderOpen,
	GitCompare,
	Images,
	LayoutGrid,
	LockKeyhole,
	type LucideIcon,
	Minimize2,
	NotebookPen,
	Palette,
	Proportions,
	QrCode,
	RefreshCcw,
	ScanEye,
	ScanText,
	Signature,
	Sparkle,
	Stamp,
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

export const RESIZE_TOOL: Tool = {
	id: "resize",
	path: "/resize",
	icon: Proportions,
	tile: "bg-coral text-ink",
	group: "images",
};

export const OCR_TOOL: Tool = {
	id: "ocr",
	path: "/ocr",
	icon: ScanText,
	tile: "bg-electric text-ink",
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

export type PdfMode =
	| "images-to-pdf"
	| "pdf-to-images"
	| "merge"
	| "compress"
	| "organize"
	| "stamp"
	| "sign"
	| "protect";

export const PDF_MODES = [
	{ id: "images-to-pdf", icon: Images, labelId: "pdf.mode.images-to-pdf" },
	{ id: "pdf-to-images", icon: FileImage, labelId: "pdf.mode.pdf-to-images" },
	{ id: "merge", icon: Files, labelId: "pdf.mode.merge" },
	{ id: "compress", icon: Minimize2, labelId: "pdf.mode.compress" },
	{ id: "organize", icon: LayoutGrid, labelId: "pdf.mode.organize" },
	{ id: "stamp", icon: Stamp, labelId: "pdf.mode.stamp" },
	{ id: "sign", icon: Signature, labelId: "pdf.mode.sign" },
	{ id: "protect", icon: LockKeyhole, labelId: "pdf.mode.protect" },
] satisfies { id: PdfMode; icon: LucideIcon; labelId: string }[];

export const pdfModePath = (mode: PdfMode) => `${PDF_TOOL.path}?mode=${mode}`;

export const MARKDOWN_TOOL: Tool = {
	id: "markdown",
	path: "/markdown",
	icon: NotebookPen,
	tile: "bg-sun text-ink",
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

// Not listed with the tools: it is where files shared with or opened in the
// installed app land, before a tool is picked for them.
export const OPEN_TOOL: Tool = {
	id: "open",
	path: "/open",
	icon: FolderOpen,
	tile: "bg-electric text-ink",
	group: "images",
};

export const TOOLS: Tool[] = [
	CONVERT_TOOL,
	COMPRESS_TOOL,
	RESIZE_TOOL,
	CROP_TOOL,
	MERGE_TOOL,
	WATERMARK_TOOL,
	OCR_TOOL,
	ICONS_TOOL,
	METADATA_TOOL,
	COLOR_TOOL,
	PDF_TOOL,
	MARKDOWN_TOOL,
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
