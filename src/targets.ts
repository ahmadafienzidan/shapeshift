import type { LucideIcon } from "lucide-react";
import { isImage } from "./lib/image";
import { PDF_KIND } from "./lib/pdf";
import { PDF_MODES, PDF_TOOL, pdfModePath, QR_TOOL, TOOLS } from "./tools";

// A tool (or PDF mode) that files can be handed to.
export type Target = {
	id: string;
	path: string;
	icon: LucideIcon;
	tile: string;
	nameId: string;
	contextId?: string;
};

const pdfTarget = (mode: (typeof PDF_MODES)[number]): Target => ({
	id: `pdf-${mode.id}`,
	path: pdfModePath(mode.id),
	icon: mode.icon,
	tile: PDF_TOOL.tile,
	nameId: mode.labelId,
	contextId: "tool.pdf.name",
});

export const IMAGE_TARGETS: Target[] = [
	...[...TOOLS.filter((tool) => tool.group === "images"), QR_TOOL].map(
		(tool) => ({
			id: tool.id,
			path: tool.path,
			icon: tool.icon,
			tile: tool.tile,
			nameId: `tool.${tool.id}.name`,
		}),
	),
	...PDF_MODES.filter((mode) => mode.id === "images-to-pdf").map(pdfTarget),
];

export const PDF_TARGETS = PDF_MODES.filter(
	(mode) => mode.id !== "images-to-pdf",
).map(pdfTarget);

export const TARGET_GROUPS = [
	{ titleId: "open.images", targets: IMAGE_TARGETS, matches: isImage },
	{ titleId: "open.pdfs", targets: PDF_TARGETS, matches: PDF_KIND.matches },
];
