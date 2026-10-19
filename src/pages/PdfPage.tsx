import { Input, Label, TextField, ToggleButton } from "@heroui/react";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useSearchParams } from "react-router";
import { BatchTool } from "../components/BatchTool";
import { CombineTool } from "../components/CombineTool";
import { ModeTabs } from "../components/ModeTabs";
import {
	FormatPicker,
	QualitySlider,
	RangeSlider,
} from "../components/Options";
import { PdfOrganizer } from "../components/PdfOrganizer";
import { PdfSigner } from "../components/PdfSigner";
import { ToolPage } from "../components/ToolPage";
import { IMAGE_KIND, type OutputType } from "../lib/image";
import {
	imagesToPdf,
	mergePdfs,
	type NumberPosition,
	type PageSize,
	type Permissions,
	pdfToImages,
	protectPdf,
	stampPdf,
	unlockPdf,
} from "../lib/pdf";
import {
	type CompressLevel,
	type CompressMethod,
	compressPdf,
} from "../lib/pdfCompress";
import { PDF_KIND } from "../lib/pdfKind";
import { PDF_MODES, PDF_TOOL, type PdfMode } from "../tools";

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

	// The mode lives in the URL so search and opened files can link to one.
	const [params, setParams] = useSearchParams();
	const mode: PdfMode =
		PDF_MODES.find((entry) => entry.id === params.get("mode"))?.id ??
		"images-to-pdf";
	const setMode = (next: PdfMode) =>
		setParams({ mode: next }, { replace: true });
	const [pageSize, setPageSize] = useState<PageSize>("fit");
	const [margin, setMargin] = useState<Margin>("none");
	const [quality, setQuality] = useState(90);
	const [imageType, setImageType] = useState<OutputType>("image/png");
	const [dpi, setDpi] = useState("150");
	const [watermark, setWatermark] = useState("");
	const [opacity, setOpacity] = useState(20);
	const [numbers, setNumbers] = useState<NumberPosition>("bottom-center");
	const [numberFormat, setNumberFormat] = useState<string>("{n} / {total}");
	const [compressLevel, setCompressLevel] =
		useState<CompressLevel>("recommended");
	const [compressMethod, setCompressMethod] =
		useState<CompressMethod>("images");
	const [protectAction, setProtectAction] = useState<"lock" | "unlock">("lock");
	const [password, setPassword] = useState("");
	const [permissions, setPermissions] = useState<Permissions>({
		printing: true,
		copying: false,
		modifying: false,
	});

	const toolbar = (
		<ModeTabs
			label={t("tool.pdf.name")}
			value={mode}
			onChange={setMode}
			modes={PDF_MODES}
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

	if (mode === "sign") {
		return (
			<ToolPage tool={PDF_TOOL} toolbar={toolbar}>
				<PdfSigner />
			</ToolPage>
		);
	}

	if (mode === "compress") {
		return (
			<ToolPage
				tool={PDF_TOOL}
				toolbar={toolbar}
				optionsHint="options.appliesToNew"
				options={
					<>
						<FormatPicker
							labelId="compress.level"
							value={compressLevel}
							onChange={setCompressLevel}
							options={[
								{ id: "light", label: t("compress.level.light") },
								{ id: "recommended", label: t("compress.level.recommended") },
								{ id: "strong", label: t("compress.level.strong") },
							]}
						/>
						<p className="text-muted text-xs">
							<FormattedMessage id={`compress.level.${compressLevel}.hint`} />
						</p>
						<FormatPicker
							labelId="compress.method"
							value={compressMethod}
							onChange={setCompressMethod}
							options={[
								{ id: "images", label: t("compress.method.images") },
								{ id: "flatten", label: t("compress.method.flatten") },
							]}
						/>
						<p className="text-muted text-xs">
							<FormattedMessage id={`compress.method.${compressMethod}.hint`} />
						</p>
					</>
				}
			>
				<BatchTool
					key={mode}
					kind={PDF_KIND}
					zipName="shapeshift-compressed.zip"
					process={async (file) => [
						{
							blob: await compressPdf(file, compressLevel, compressMethod),
							name: file.name.replace(/\.pdf$/i, "-compressed.pdf"),
						},
					]}
				/>
			</ToolPage>
		);
	}

	if (mode === "protect") {
		return (
			<ToolPage
				tool={PDF_TOOL}
				toolbar={toolbar}
				optionsHint="options.appliesToNew"
				options={
					<>
						<FormatPicker
							labelId="protect.action"
							value={protectAction}
							onChange={setProtectAction}
							options={[
								{ id: "lock", label: t("protect.lock") },
								{ id: "unlock", label: t("protect.unlock") },
							]}
						/>
						<TextField value={password} onChange={setPassword} type="password">
							<Label>
								<FormattedMessage
									id={
										protectAction === "lock"
											? "protect.newPassword"
											: "protect.currentPassword"
									}
								/>
							</Label>
							<Input autoComplete="off" />
						</TextField>
						{protectAction === "lock" ? (
							<div className="flex flex-col gap-2">
								<p className="font-medium text-sm">
									<FormattedMessage id="protect.allow" />
								</p>
								{(["printing", "copying", "modifying"] as const).map((key) => (
									<ToggleButton
										key={key}
										isSelected={permissions[key]}
										onChange={(value) =>
											setPermissions((current) => ({
												...current,
												[key]: value,
											}))
										}
									>
										<FormattedMessage id={`protect.allow.${key}`} />
									</ToggleButton>
								))}
								<p className="text-muted text-xs">
									<FormattedMessage id="protect.lockHint" />
								</p>
							</div>
						) : (
							<p className="text-muted text-xs">
								<FormattedMessage id="protect.unlockHint" />
							</p>
						)}
					</>
				}
			>
				<BatchTool
					key={mode}
					kind={PDF_KIND}
					zipName={`shapeshift-${protectAction}ed.zip`}
					process={async (file) => {
						if (protectAction === "lock" && password === "") {
							throw new Error("protect.error.noPassword");
						}
						const blob =
							protectAction === "lock"
								? await protectPdf(file, password, permissions)
								: await unlockPdf(file, password);
						return [
							{
								blob,
								name: file.name.replace(
									/\.pdf$/i,
									protectAction === "lock" ? "-protected.pdf" : "-unlocked.pdf",
								),
							},
						];
					}}
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
