import {
	Braces,
	FileText,
	type LucideIcon,
	Minimize2,
	RefreshCcw,
} from "lucide-react";

export type Tool = {
	id: string;
	path: string;
	icon: LucideIcon;
	tile: string;
};

export const CONVERT_TOOL: Tool = {
	id: "convert",
	path: "/convert",
	icon: RefreshCcw,
	tile: "bg-electric text-ink",
};

export const COMPRESS_TOOL: Tool = {
	id: "compress",
	path: "/compress",
	icon: Minimize2,
	tile: "bg-iris text-white",
};

export const PDF_TOOL: Tool = {
	id: "pdf",
	path: "/pdf",
	icon: FileText,
	tile: "bg-coral text-ink",
};

export const DATA_TOOL: Tool = {
	id: "data",
	path: "/data",
	icon: Braces,
	tile: "bg-sun text-ink",
};

export const TOOLS: Tool[] = [CONVERT_TOOL, COMPRESS_TOOL, PDF_TOOL, DATA_TOOL];
