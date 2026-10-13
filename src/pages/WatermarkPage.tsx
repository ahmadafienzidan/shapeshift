import { Button, Input, Label, TextField } from "@heroui/react";
import { Grid3x3, ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { FileTrigger } from "react-aria-components";
import { FormattedMessage, useIntl } from "react-intl";
import {
	ColorInput,
	FormatPicker,
	QualitySlider,
	RangeSlider,
} from "../components/Options";
import { PreviewBatch } from "../components/PreviewBatch";
import { ToolPage } from "../components/ToolPage";
import {
	ACCEPTED_IMAGES,
	decodeImage,
	IMAGE_KIND,
	type OutputType,
	renameExtension,
	resolveFormat,
} from "../lib/image";
import {
	drawWatermark,
	POSITIONS,
	type Position,
	type WatermarkOptions,
	watermarkImage,
} from "../lib/watermark";
import { WATERMARK_TOOL } from "../tools";

function PositionPicker({
	value,
	onChange,
}: {
	value: Position;
	onChange: (value: Position) => void;
}) {
	const intl = useIntl();
	return (
		<fieldset className="flex flex-col gap-2">
			<legend className="mb-2 font-medium text-sm">
				<FormattedMessage id="watermark.position" />
			</legend>
			<div className="flex items-stretch gap-2">
				<div className="grid flex-1 grid-cols-3 gap-1 rounded border border-border bg-default/40 p-1">
					{POSITIONS.filter((position) => position !== "tile").map(
						(position) => (
							<label
								key={position}
								className="grid h-8 cursor-pointer place-items-center rounded-sm hover:bg-default has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-electric"
							>
								<input
									type="radio"
									name="watermark-position"
									value={position}
									checked={value === position}
									onChange={() => onChange(position)}
									aria-label={intl.formatMessage({
										id: `watermark.position.${position}`,
									})}
									className="sr-only"
								/>
								<span
									className={`size-2.5 rounded-full ${value === position ? "bg-electric" : "bg-muted/40"}`}
								/>
							</label>
						),
					)}
				</div>
				<Button
					variant={value === "tile" ? "primary" : "tertiary"}
					className="h-auto flex-col gap-1 px-3 text-xs"
					onPress={() => onChange("tile")}
				>
					<Grid3x3 size={18} />
					<FormattedMessage id="watermark.position.tile" />
				</Button>
			</div>
		</fieldset>
	);
}

export function WatermarkPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [kind, setKind] = useState<"text" | "logo">("text");
	const [text, setText] = useState("© Shapeshift");
	const [color, setColor] = useState("#ffffff");
	const [logoFile, setLogoFile] = useState<File>();
	const [logo, setLogo] = useState<ImageBitmap>();
	const [size, setSize] = useState(30);
	const [opacity, setOpacity] = useState(60);
	const [position, setPosition] = useState<Position>("bottom-right");
	const [format, setFormat] = useState<OutputType | "original">("original");
	const [quality, setQuality] = useState(90);

	useEffect(() => {
		if (!logoFile) return;
		let cancelled = false;
		decodeImage(logoFile, 1024).then((bitmap) => {
			if (cancelled) bitmap.close();
			else setLogo(bitmap);
		});
		return () => {
			cancelled = true;
		};
	}, [logoFile]);

	const ready = kind === "text" ? text.trim() !== "" : logo !== undefined;
	const options: WatermarkOptions = {
		text,
		logo: kind === "logo" ? logo : undefined,
		color,
		size: size / 100,
		opacity: opacity / 100,
		position,
	};

	return (
		<ToolPage
			tool={WATERMARK_TOOL}
			options={
				<>
					<FormatPicker
						labelId="watermark.kind"
						value={kind}
						onChange={setKind}
						options={[
							{ id: "text", label: t("watermark.kind.text") },
							{ id: "logo", label: t("watermark.kind.logo") },
						]}
					/>
					{kind === "text" ? (
						<>
							<TextField value={text} onChange={setText}>
								<Label>
									<FormattedMessage id="watermark.text" />
								</Label>
								<Input />
							</TextField>
							<ColorInput
								labelId="watermark.color"
								value={color}
								onChange={setColor}
							/>
						</>
					) : (
						<div className="flex flex-col gap-2">
							<FileTrigger
								acceptedFileTypes={ACCEPTED_IMAGES}
								onSelect={(list) => setLogoFile(list?.[0] ?? undefined)}
							>
								<Button variant="outline" className="font-semibold">
									<ImagePlus size={16} />
									{logoFile ? (
										<span className="truncate">{logoFile.name}</span>
									) : (
										<FormattedMessage id="watermark.chooseLogo" />
									)}
								</Button>
							</FileTrigger>
							<p className="text-muted text-xs">
								<FormattedMessage id="watermark.logoHint" />
							</p>
						</div>
					)}
					<RangeSlider
						labelId="watermark.size"
						value={size}
						onChange={setSize}
						min={5}
						max={80}
					/>
					<RangeSlider
						labelId="watermark.opacity"
						value={opacity}
						onChange={setOpacity}
						min={10}
						max={100}
					/>
					<PositionPicker value={position} onChange={setPosition} />
					<FormatPicker
						value={format}
						onChange={setFormat}
						options={[
							{ id: "original", label: t("options.format.original") },
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
			{!ready && (
				<p className="rounded-xl border border-warning/40 bg-warning-soft p-3 text-center text-sm text-warning-soft-foreground">
					<FormattedMessage
						id={kind === "text" ? "watermark.needText" : "watermark.needLogo"}
					/>
				</p>
			)}
			<PreviewBatch
				kind={IMAGE_KIND}
				ready
				actionId="watermark.action"
				zipName="shapeshift-watermarked.zip"
				frame={(bitmap) => bitmap}
				draw={(context, bitmap) => {
					if (ready) drawWatermark(context, bitmap, options);
					else
						context.drawImage(
							bitmap,
							0,
							0,
							context.canvas.width,
							context.canvas.height,
						);
				}}
				process={async (file) => {
					if (!ready)
						throw new Error(
							kind === "text" ? "watermark.needText" : "watermark.needLogo",
						);
					const type = resolveFormat(file, format);
					return {
						blob: await watermarkImage(file, options, type, quality / 100),
						name: renameExtension(file.name, type),
					};
				}}
			/>
		</ToolPage>
	);
}
