import { Input, Label, TextField } from "@heroui/react";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BatchTool } from "../components/BatchTool";
import { ColorInput, FormatPicker, QualitySlider } from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import { EXTENSIONS, IMAGE_KIND, type OutputType } from "../lib/image";
import { type Fit, resizeImage } from "../lib/resize";
import { RESIZE_TOOL } from "../tools";

type Preset = { id: string; group: string; width: number; height: number };

const PRESETS: Preset[] = [
	{ id: "ig-square", group: "instagram", width: 1080, height: 1080 },
	{ id: "ig-portrait", group: "instagram", width: 1080, height: 1350 },
	{ id: "ig-landscape", group: "instagram", width: 1080, height: 566 },
	{ id: "ig-story", group: "instagram", width: 1080, height: 1920 },
	{ id: "youtube", group: "other", width: 1280, height: 720 },
	{ id: "x", group: "other", width: 1600, height: 900 },
	{ id: "link", group: "other", width: 1200, height: 630 },
	{ id: "custom", group: "other", width: 0, height: 0 },
];

function PresetPicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	const intl = useIntl();
	return (
		<fieldset className="flex flex-col gap-3">
			<legend className="mb-2 font-medium text-sm">
				<FormattedMessage id="resize.preset" />
			</legend>
			{["instagram", "other"].map((group) => (
				<div key={group} className="flex flex-col gap-1.5">
					<p className="eyebrow text-[0.6875rem] text-muted">
						<FormattedMessage id={`resize.group.${group}`} />
					</p>
					<div className="grid grid-cols-2 gap-1.5">
						{PRESETS.filter((preset) => preset.group === group).map(
							(preset) => {
								const selected = value === preset.id;
								const ratio = preset.width ? preset.width / preset.height : 1;
								return (
									<label
										key={preset.id}
										className={`flex cursor-pointer items-center gap-2.5 rounded border p-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-electric ${selected ? "border-electric bg-electric/10" : "border-border hover:bg-default"}`}
									>
										<input
											type="radio"
											name="resize-preset"
											value={preset.id}
											checked={selected}
											onChange={() => onChange(preset.id)}
											className="sr-only"
										/>
										<span className="grid size-7 shrink-0 place-items-center">
											<span
												className={`block rounded-[2px] border-2 ${selected ? "border-electric" : "border-muted/60"} ${preset.width ? "" : "border-dashed"}`}
												style={
													ratio >= 1
														? { width: 28, height: 28 / ratio }
														: { width: 28 * ratio, height: 28 }
												}
											/>
										</span>
										<span className="flex min-w-0 flex-col">
											<span className="truncate font-semibold text-xs">
												{intl.formatMessage({
													id: `resize.preset.${preset.id}`,
												})}
											</span>
											{preset.width > 0 && (
												<span className="font-mono text-[0.625rem] text-muted">
													{preset.width}×{preset.height}
												</span>
											)}
										</span>
									</label>
								);
							},
						)}
					</div>
				</div>
			))}
		</fieldset>
	);
}

function DimensionField({
	labelId,
	value,
	onChange,
}: {
	labelId: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<TextField value={value} onChange={onChange} className="flex-1">
			<Label>
				<FormattedMessage id={labelId} />
			</Label>
			<Input type="number" min={1} max={8192} className="font-mono" />
		</TextField>
	);
}

export function ResizePage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [presetId, setPresetId] = useState("ig-portrait");
	const [customWidth, setCustomWidth] = useState("1080");
	const [customHeight, setCustomHeight] = useState("1080");
	const [fit, setFit] = useState<Fit>("cover");
	const [focus, setFocus] = useState<"0" | "0.5" | "1">("0.5");
	const [background, setBackground] = useState("#ffffff");
	const [format, setFormat] = useState<OutputType>("image/jpeg");
	const [quality, setQuality] = useState(90);

	const preset = PRESETS.find((item) => item.id === presetId);
	const width =
		presetId === "custom" ? Math.round(Number(customWidth)) : preset?.width;
	const height =
		presetId === "custom" ? Math.round(Number(customHeight)) : preset?.height;
	const valid =
		width !== undefined &&
		height !== undefined &&
		width >= 1 &&
		height >= 1 &&
		width <= 8192 &&
		height <= 8192;

	return (
		<ToolPage
			tool={RESIZE_TOOL}
			optionsHint="options.appliesToNew"
			options={
				<>
					<PresetPicker value={presetId} onChange={setPresetId} />
					{presetId === "custom" && (
						<div className="flex gap-3">
							<DimensionField
								labelId="resize.width"
								value={customWidth}
								onChange={setCustomWidth}
							/>
							<DimensionField
								labelId="resize.height"
								value={customHeight}
								onChange={setCustomHeight}
							/>
						</div>
					)}
					<FormatPicker
						labelId="resize.fit"
						value={fit}
						onChange={setFit}
						options={[
							{ id: "cover", label: t("resize.fit.cover") },
							{ id: "blur", label: t("resize.fit.blur") },
							{ id: "color", label: t("resize.fit.color") },
						]}
					/>
					{fit === "cover" && (
						<FormatPicker
							labelId="resize.focus"
							value={focus}
							onChange={setFocus}
							options={[
								{ id: "0", label: t("resize.focus.start") },
								{ id: "0.5", label: t("resize.focus.center") },
								{ id: "1", label: t("resize.focus.end") },
							]}
						/>
					)}
					{fit === "color" && (
						<ColorInput
							labelId="icons.backgroundColor"
							value={background}
							onChange={setBackground}
						/>
					)}
					<p className="text-muted text-xs">
						<FormattedMessage id={`resize.fit.${fit}.hint`} />
					</p>
					<FormatPicker
						value={format}
						onChange={setFormat}
						options={[
							{ id: "image/jpeg", label: "JPG" },
							{ id: "image/png", label: "PNG" },
							{ id: "image/webp", label: "WEBP" },
						]}
					/>
					<QualitySlider
						value={quality}
						onChange={setQuality}
						isDisabled={format === "image/png"}
					/>
				</>
			}
		>
			{!valid && (
				<p className="rounded-xl border border-warning/40 bg-warning-soft p-3 text-center text-sm text-warning-soft-foreground">
					<FormattedMessage id="resize.invalidSize" />
				</p>
			)}
			<BatchTool
				kind={IMAGE_KIND}
				zipName="shapeshift-resized.zip"
				process={async (file) => {
					if (!valid) throw new Error("resize.invalidSize");
					const base = file.name.includes(".")
						? file.name.slice(0, file.name.lastIndexOf("."))
						: file.name;
					return [
						{
							blob: await resizeImage(
								file,
								{ width, height, fit, focus: Number(focus), background },
								format,
								quality / 100,
							),
							name: `${base}-${width}x${height}.${EXTENSIONS[format]}`,
						},
					];
				}}
			/>
		</ToolPage>
	);
}
