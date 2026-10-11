import { FileImage, Files, Images, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";
import { BatchTool } from "../components/BatchTool";
import { CombineTool } from "../components/CombineTool";
import { ModeTabs } from "../components/ModeTabs";
import { FormatPicker, QualitySlider } from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import { IMAGE_KIND, type OutputType } from "../lib/image";
import {
	imagesToPdf,
	mergePdfs,
	type PageSize,
	PDF_KIND,
	pdfToImages,
} from "../lib/pdf";
import { PDF_TOOL } from "../tools";

type Mode = "images-to-pdf" | "pdf-to-images" | "merge";

const MODES = [
	{ id: "images-to-pdf", icon: Images, labelId: "pdf.mode.images-to-pdf" },
	{ id: "pdf-to-images", icon: FileImage, labelId: "pdf.mode.pdf-to-images" },
	{ id: "merge", icon: Files, labelId: "pdf.mode.merge" },
] satisfies { id: Mode; icon: LucideIcon; labelId: string }[];

const MARGINS = { none: 0, small: 18, large: 36 };

type Margin = keyof typeof MARGINS;

export function PdfPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });

	const [mode, setMode] = useState<Mode>("images-to-pdf");
	const [pageSize, setPageSize] = useState<PageSize>("fit");
	const [margin, setMargin] = useState<Margin>("none");
	const [quality, setQuality] = useState(90);
	const [imageType, setImageType] = useState<OutputType>("image/png");
	const [dpi, setDpi] = useState("150");

	const toolbar = (
		<ModeTabs
			label={t("tool.pdf.name")}
			value={mode}
			onChange={setMode}
			modes={MODES}
		/>
	);

	if (mode === "images-to-pdf") {
		return (
			<ToolPage
				tool={PDF_TOOL}
				toolbar={toolbar}
				options={
					<>
						<FormatPicker
							labelId="pdf.pageSize"
							value={pageSize}
							onChange={setPageSize}
							options={[
								{ id: "fit", label: t("pdf.pageSize.fit") },
								{ id: "a4", label: "A4" },
								{ id: "letter", label: "Letter" },
							]}
						/>
						<FormatPicker
							labelId="pdf.margin"
							value={margin}
							onChange={setMargin}
							options={[
								{ id: "none", label: t("pdf.margin.none") },
								{ id: "small", label: t("pdf.margin.small") },
								{ id: "large", label: t("pdf.margin.large") },
							]}
						/>
						<QualitySlider value={quality} onChange={setQuality} />
					</>
				}
			>
				<CombineTool
					key={mode}
					kind={IMAGE_KIND}
					actionLabel={t("pdf.create")}
					outputName="shapeshift-images.pdf"
					combine={(files) =>
						imagesToPdf(files, {
							pageSize,
							margin: MARGINS[margin],
							quality: quality / 100,
						})
					}
				/>
			</ToolPage>
		);
	}

	if (mode === "pdf-to-images") {
		return (
			<ToolPage
				tool={PDF_TOOL}
				toolbar={toolbar}
				optionsHint="options.appliesToNew"
				options={
					<>
						<FormatPicker
							value={imageType}
							onChange={setImageType}
							options={[
								{ id: "image/png", label: "PNG" },
								{ id: "image/jpeg", label: "JPG" },
								{ id: "image/webp", label: "WEBP" },
							]}
						/>
						<FormatPicker
							labelId="pdf.resolution"
							value={dpi}
							onChange={setDpi}
							options={[
								{ id: "72", label: "72 DPI" },
								{ id: "150", label: "150 DPI" },
								{ id: "300", label: "300 DPI" },
							]}
						/>
						<QualitySlider
							value={quality}
							onChange={setQuality}
							isDisabled={imageType === "image/png"}
						/>
					</>
				}
			>
				<BatchTool
					key={mode}
					kind={PDF_KIND}
					zipName="shapeshift-pdf-pages.zip"
					process={(file) =>
						pdfToImages(file, {
							type: imageType,
							dpi: Number(dpi),
							quality: quality / 100,
						})
					}
				/>
			</ToolPage>
		);
	}

	return (
		<ToolPage tool={PDF_TOOL} toolbar={toolbar}>
			<CombineTool
				key={mode}
				kind={PDF_KIND}
				actionLabel={t("pdf.merge")}
				outputName="shapeshift-merged.pdf"
				combine={mergePdfs}
			/>
		</ToolPage>
	);
}
