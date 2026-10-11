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
	gradient: string;
	available: boolean;
};

export const CONVERT_TOOL: Tool = {
	id: "convert",
	path: "/convert",
	icon: RefreshCcw,
	gradient: "from-violet-500 to-fuchsia-500",
	available: true,
};

export const COMPRESS_TOOL: Tool = {
	id: "compress",
	path: "/compress",
	icon: Minimize2,
	gradient: "from-sky-500 to-emerald-500",
	available: true,
};

export const TOOLS: Tool[] = [
	CONVERT_TOOL,
	COMPRESS_TOOL,
	{
		id: "pdf",
		path: "/pdf",
		icon: FileText,
		gradient: "from-rose-500 to-orange-500",
		available: false,
	},
	{
		id: "data",
		path: "/data",
		icon: Braces,
		gradient: "from-amber-500 to-lime-500",
		available: false,
	},
];
