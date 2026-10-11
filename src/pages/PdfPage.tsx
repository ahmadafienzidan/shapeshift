import { Input, Label, TextField } from "@heroui/react";
import {
	FileImage,
	Files,
	Images,
	LayoutGrid,
	type LucideIcon,
	Stamp,
} from "lucide-react";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BatchTool } from "../components/BatchTool";
import { CombineTool } from "../components/CombineTool";
import { ModeTabs } from "../components/ModeTabs";
import {
	FormatPicker,
	QualitySlider,
	RangeSlider,
} from "../components/Options";
import { PdfOrganizer } from "../components/PdfOrganizer";
import { ToolPage } from "../components/ToolPage";
import { IMAGE_KIND, type OutputType } from "../lib/image";
import {
	imagesToPdf,
	mergePdfs,
	type NumberPosition,
	type PageSize,
	PDF_KIND,
	pdfToImages,
	stampPdf,
} from "../lib/pdf";
import { PDF_TOOL } from "../tools";

type Mode = "images-to-pdf" | "pdf-to-images" | "merge" | "organize" | "stamp";

const MODES = [
	{ id: "images-to-pdf", icon: Images, labelId: "pdf.mode.images-to-pdf" },
	{ id: "pdf-to-images", icon: FileImage, labelId: "pdf.mode.pdf-to-images" },
	{ id: "merge", icon: Files, labelId: "pdf.mode.merge" },
	{ id: "organize", icon: LayoutGrid, labelId: "pdf.mode.organize" },
	{ id: "stamp", icon: Stamp, labelId: "pdf.mode.stamp" },
] satisfies { id: Mode; icon: LucideIcon; labelId: string }[];

const NUMBER_FORMATS = [
	"{n}",
	"{n} / {total}",
	"Page {n} of {total}",
	"Hal. {n} dari {total}",
];

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
	const [watermark, setWatermark] = useState("");
	const [opacity, setOpacity] = useState(20);
	const [numbers, setNumbers] = useState<NumberPosition>("bottom-center");
	const [numberFormat, setNumberFormat] = useState<string>("{n} / {total}");

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

	if (mode === "organize") {
		return (
			<ToolPage tool={PDF_TOOL} toolbar={toolbar}>
				<PdfOrganizer />
			</ToolPage>
		);
	}

	if (mode === "stamp") {
		return (
			<ToolPage
				tool={PDF_TOOL}
				toolbar={toolbar}
				optionsHint="options.appliesToNew"
				options={
					<>
						<TextField value={watermark} onChange={setWatermark}>
							<Label>
								<FormattedMessage id="stamp.watermark" />
							</Label>
							<Input placeholder={t("stamp.watermarkPlaceholder")} />
						</TextField>
						<RangeSlider
							labelId="stamp.opacity"
							value={opacity}
							onChange={setOpacity}
							min={5}
							max={60}
							isDisabled={watermark.trim() === ""}
						/>
						<FormatPicker
							labelId="stamp.numbers"
							value={numbers}
							onChange={setNumbers}
							options={[
								{ id: "none", label: t("stamp.numbers.none") },
								{ id: "bottom-center", label: t("stamp.numbers.center") },
								{ id: "bottom-right", label: t("stamp.numbers.right") },
							]}
						/>
						{numbers !== "none" && (
							<FormatPicker
								labelId="stamp.format"
								value={numberFormat}
								onChange={setNumberFormat}
								options={NUMBER_FORMATS.map((format) => ({
									id: format,
									label: format.replace("{n}", "3").replace("{total}", "10"),
								}))}
							/>
						)}
					</>
				}
			>
				<BatchTool
					key={mode}
					kind={PDF_KIND}
					zipName="shapeshift-stamped.zip"
					process={async (file) => [
						{
							blob: await stampPdf(file, {
								watermark,
								opacity: opacity / 100,
								numbers,
								numberFormat,
							}),
							name: file.name.replace(/\.pdf$/i, "-stamped.pdf"),
						},
					]}
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
