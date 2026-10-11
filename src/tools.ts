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
	available: boolean;
};

export const CONVERT_TOOL: Tool = {
	id: "convert",
	path: "/convert",
	icon: RefreshCcw,
	tile: "bg-electric text-ink",
	available: true,
};

export const COMPRESS_TOOL: Tool = {
	id: "compress",
	path: "/compress",
	icon: Minimize2,
	tile: "bg-iris text-white",
	available: true,
};

export const TOOLS: Tool[] = [
	CONVERT_TOOL,
	COMPRESS_TOOL,
	{
		id: "pdf",
		path: "/pdf",
		icon: FileText,
		tile: "bg-default text-muted",
		available: false,
	},
	{
		id: "data",
		path: "/data",
		icon: Braces,
		tile: "bg-default text-muted",
		available: false,
	},
];
