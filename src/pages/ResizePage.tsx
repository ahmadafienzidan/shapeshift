import { Button, Input, Label, Spinner, TextField } from "@heroui/react";
import { Download, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Dropzone } from "../components/Dropzone";
import { ColorInput, FormatPicker, QualitySlider } from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import { createZip, downloadBlob } from "../lib/files";
import {
	decodeImage,
	EXTENSIONS,
	IMAGE_KIND,
	type OutputType,
} from "../lib/image";
import {
	drawResized,
	type Fit,
	type ResizeOptions,
	resizeImage,
} from "../lib/resize";
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

type Entry = { id: string; file: File; bitmap: ImageBitmap };

const PREVIEW_SIZE = 480;

async function previewBitmap(file: File): Promise<ImageBitmap> {
	const full = await decodeImage(file);
	const scale = Math.min(
		1,
		(PREVIEW_SIZE * 2) / Math.max(full.width, full.height),
	);
	const bitmap = await createImageBitmap(full, {
		resizeWidth: Math.round(full.width * scale),
		resizeHeight: Math.round(full.height * scale),
		resizeQuality: "high",
	});
	full.close();
	return bitmap;
}

function ResizePreview({
	entry,
	width,
	height,
	options,
	onRemove,
}: {
	entry: Entry;
	width: number;
	height: number;
	options: ResizeOptions;
	onRemove: () => void;
}) {
	const intl = useIntl();
	const canvas = useRef<HTMLCanvasElement>(null);
	const { fit, focus, background } = options;

	useEffect(() => {
		const element = canvas.current;
		const context = element?.getContext("2d");
		if (!element || !context) return;
		const scale = PREVIEW_SIZE / Math.max(width, height);
		element.width = Math.max(1, Math.round(width * scale));
		element.height = Math.max(1, Math.round(height * scale));
		drawResized(context, entry.bitmap, { fit, focus, background });
	}, [entry.bitmap, width, height, fit, focus, background]);

	return (
		<li className="group flex min-w-0 flex-col gap-2">
			<div className="relative grid aspect-square place-items-center rounded border border-border bg-surface-secondary p-2">
				<canvas
					ref={canvas}
					className="max-h-full max-w-full shadow-md"
					style={{ aspectRatio: `${width} / ${height}` }}
				/>
				<Button
					isIconOnly
					size="sm"
					variant="tertiary"
					aria-label={intl.formatMessage({ id: "combine.remove" })}
					onPress={onRemove}
					className="absolute top-1.5 right-1.5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
				>
					<X size={14} />
				</Button>
			</div>
			<p className="truncate font-mono text-muted text-xs">{entry.file.name}</p>
		</li>
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
	const options: ResizeOptions = { fit, focus: Number(focus), background };

	const [entries, setEntries] = useState<Entry[]>([]);
	const [busy, setBusy] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string>();

	const add = async (files: File[]) => {
		setError(undefined);
		try {
			const added = await Promise.all(
				files.map(async (file) => ({
					id: crypto.randomUUID(),
					file,
					bitmap: await previewBitmap(file),
				})),
			);
			setEntries((current) => [...current, ...added]);
		} catch (caught) {
			setError(String(caught));
		}
	};

	const remove = (removed: Entry[]) => {
		for (const entry of removed) entry.bitmap.close();
		setEntries((current) =>
			current.filter((entry) => !removed.includes(entry)),
		);
	};

	const run = async () => {
		if (!valid) return;
		setBusy(true);
		setError(undefined);
		setProgress(0);
		try {
			const outputs = [];
			for (const entry of entries) {
				const base = entry.file.name.includes(".")
					? entry.file.name.slice(0, entry.file.name.lastIndexOf("."))
					: entry.file.name;
				outputs.push({
					blob: await resizeImage(
						entry.file,
						width,
						height,
						options,
						format,
						quality / 100,
					),
					name: `${base}-${width}x${height}.${EXTENSIONS[format]}`,
				});
				setProgress(outputs.length);
			}
			const [only] = outputs;
			if (outputs.length === 1 && only) downloadBlob(only.blob, only.name);
			else downloadBlob(await createZip(outputs), "shapeshift-resized.zip");
		} catch (caught) {
			setError(String(caught));
		} finally {
			setBusy(false);
		}
	};

	return (
		<ToolPage
			tool={RESIZE_TOOL}
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
			<Dropzone kind={IMAGE_KIND} onFiles={add} />
			{!valid && (
				<p className="rounded-xl border border-warning/40 bg-warning-soft p-3 text-center text-sm text-warning-soft-foreground">
					<FormattedMessage id="resize.invalidSize" />
				</p>
			)}
			{entries.length > 0 && (
				<section className="overflow-hidden rounded-xl border border-border bg-surface">
					<div className="flex flex-wrap items-center justify-between gap-3 border-separator border-b p-5">
						<div className="flex flex-col gap-1">
							<p className="eyebrow text-muted">
								<FormattedMessage id="resize.previewTitle" />
							</p>
							<p className="font-mono text-sm">
								{valid && `${width} × ${height} px · `}
								<FormattedMessage
									id="combine.count"
									values={{ count: entries.length }}
								/>
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onPress={() => remove(entries)}
							isDisabled={busy}
						>
							<RotateCcw size={16} />
							<FormattedMessage id="combine.clear" />
						</Button>
					</div>
					{valid && (
						<ul className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 xl:grid-cols-4">
							{entries.map((entry) => (
								<ResizePreview
									key={entry.id}
									entry={entry}
									width={width}
									height={height}
									options={options}
									onRemove={() => remove([entry])}
								/>
							))}
						</ul>
					)}
					<div className="flex flex-wrap items-center justify-between gap-4 border-separator border-t bg-surface-secondary p-5">
						{error ? (
							<p className="min-w-0 flex-1 truncate text-danger text-sm">
								{error}
							</p>
						) : (
							<p className="text-muted text-sm">
								<FormattedMessage id="resize.previewHint" />
							</p>
						)}
						<Button
							variant="primary"
							className="font-semibold"
							isDisabled={busy || !valid}
							onPress={run}
						>
							{busy ? (
								<Spinner size="sm" color="current" />
							) : (
								<Download size={16} />
							)}
							{busy ? (
								<FormattedMessage
									id="resize.progress"
									values={{ done: progress, total: entries.length }}
								/>
							) : (
								<FormattedMessage
									id="resize.action"
									values={{ count: entries.length }}
								/>
							)}
						</Button>
					</div>
				</section>
			)}
		</ToolPage>
	);
}
