import { Button } from "@heroui/react";
import {
	Download,
	FlipHorizontal2,
	FlipVertical2,
	ImagePlus,
	RotateCcw,
	RotateCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { FormattedMessage, useIntl } from "react-intl";
import { Dropzone } from "../components/Dropzone";
import {
	FormatPicker,
	QualitySlider,
	RangeSlider,
} from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import { type Area, cropImage, type Flip, rotateQuarter } from "../lib/crop";
import { downloadBlob } from "../lib/files";
import {
	decodeImage,
	IMAGE_KIND,
	isHeic,
	isSvg,
	type OutputType,
	renameExtension,
} from "../lib/image";
import { CROP_TOOL } from "../tools";

const ASPECTS = [
	{ id: "original", label: "crop.aspect.original" },
	{ id: "1:1", label: "1:1" },
	{ id: "4:5", label: "4:5" },
	{ id: "3:4", label: "3:4" },
	{ id: "16:9", label: "16:9" },
	{ id: "9:16", label: "9:16" },
	{ id: "3:2", label: "3:2" },
] as const;

type Aspect = (typeof ASPECTS)[number]["id"];

type Source = { file: File; bitmap: ImageBitmap; transparent: boolean };

type View = { bitmap: ImageBitmap; preview: string };

export function CropPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [source, setSource] = useState<Source>();
	const [view, setView] = useState<View>();
	const [error, setError] = useState<string>();
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [turns, setTurns] = useState(0);
	const [flip, setFlip] = useState<Flip>({
		horizontal: false,
		vertical: false,
	});
	const [aspect, setAspect] = useState<Aspect>("original");
	const [area, setArea] = useState<Area>();
	const [format, setFormat] = useState<OutputType>("image/jpeg");
	const [quality, setQuality] = useState(92);

	// The cropper shows an <img> whose pixel size must match the bitmap that is
	// cropped, so the upright (rotated) picture gets its own preview.
	useEffect(() => {
		if (!source) return;
		let cancelled = false;
		let url: string | undefined;
		(async () => {
			const displayable = !isHeic(source.file) && !isSvg(source.file);
			const bitmap =
				turns === 0 ? source.bitmap : await rotateQuarter(source.bitmap, turns);
			if (turns === 0 && displayable) {
				url = URL.createObjectURL(source.file);
			} else {
				const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
				canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
				url = URL.createObjectURL(
					await canvas.convertToBlob({
						type: source.transparent ? "image/png" : "image/jpeg",
						quality: 0.92,
					}),
				);
			}
			if (cancelled) URL.revokeObjectURL(url);
			else setView({ bitmap, preview: url });
		})();
		return () => {
			cancelled = true;
			if (url) URL.revokeObjectURL(url);
		};
	}, [source, turns]);

	const load = async ([file]: File[]) => {
		if (!file) return;
		setError(undefined);
		try {
			const transparent = file.type === "image/png" || isSvg(file);
			setSource({ file, bitmap: await decodeImage(file, 2048), transparent });
			setFormat(transparent ? "image/png" : "image/jpeg");
			setCrop({ x: 0, y: 0 });
			setZoom(1);
			setTurns(0);
			setFlip({ horizontal: false, vertical: false });
		} catch (caught) {
			setError(String(caught));
		}
	};

	const ratio = (() => {
		if (!view) return 1;
		if (aspect === "original") return view.bitmap.width / view.bitmap.height;
		const [width = 1, height = 1] = aspect.split(":").map(Number);
		return width / height;
	})();

	const download = async () => {
		if (!source || !view || !area) return;
		const blob = await cropImage(
			view.bitmap,
			area,
			flip,
			format,
			quality / 100,
		);
		downloadBlob(blob, renameExtension(source.file.name, format));
	};

	return (
		<ToolPage
			tool={CROP_TOOL}
			options={
				<>
					<div className="flex flex-col gap-2">
						<p className="font-medium text-sm">
							<FormattedMessage id="crop.aspect" />
						</p>
						<div className="grid grid-cols-4 gap-1.5">
							{ASPECTS.map((option) => (
								<Button
									key={option.id}
									size="sm"
									variant={aspect === option.id ? "primary" : "tertiary"}
									className={option.id === "original" ? "col-span-2" : ""}
									onPress={() => setAspect(option.id)}
								>
									{option.id === "original" ? t(option.label) : option.label}
								</Button>
							))}
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<p className="font-medium text-sm">
							<FormattedMessage id="crop.transform" />
						</p>
						<div className="grid grid-cols-4 gap-1.5">
							<Button
								isIconOnly
								variant="tertiary"
								aria-label={t("crop.rotateLeft")}
								onPress={() => setTurns((value) => (value + 3) % 4)}
							>
								<RotateCcw size={16} />
							</Button>
							<Button
								isIconOnly
								variant="tertiary"
								aria-label={t("crop.rotateRight")}
								onPress={() => setTurns((value) => (value + 1) % 4)}
							>
								<RotateCw size={16} />
							</Button>
							<Button
								isIconOnly
								variant={flip.horizontal ? "primary" : "tertiary"}
								aria-label={t("crop.flipHorizontal")}
								onPress={() =>
									setFlip((value) => ({
										...value,
										horizontal: !value.horizontal,
									}))
								}
							>
								<FlipHorizontal2 size={16} />
							</Button>
							<Button
								isIconOnly
								variant={flip.vertical ? "primary" : "tertiary"}
								aria-label={t("crop.flipVertical")}
								onPress={() =>
									setFlip((value) => ({ ...value, vertical: !value.vertical }))
								}
							>
								<FlipVertical2 size={16} />
							</Button>
						</div>
					</div>
					<RangeSlider
						labelId="crop.zoom"
						value={Math.round(zoom * 100)}
						onChange={(value) => setZoom(value / 100)}
						min={100}
						max={400}
					/>
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
			{!source ? (
				<>
					<Dropzone kind={IMAGE_KIND} onFiles={load} />
					{error && <p className="text-center text-danger text-sm">{error}</p>}
				</>
			) : (
				<section className="overflow-hidden rounded-xl border border-border bg-surface">
					<div className="relative h-[60vh] min-h-80 [background-image:conic-gradient(var(--default)_25%,transparent_0_50%,var(--default)_0_75%,transparent_0)] [background-size:20px_20px]">
						<Cropper
							image={view?.preview}
							crop={crop}
							zoom={zoom}
							aspect={ratio}
							minZoom={1}
							maxZoom={4}
							onCropChange={setCrop}
							onZoomChange={setZoom}
							onCropComplete={(_, pixels) => setArea(pixels)}
							transform={`translate(${crop.x}px, ${crop.y}px) scale(${zoom * (flip.horizontal ? -1 : 1)}, ${zoom * (flip.vertical ? -1 : 1)})`}
							style={{
								cropAreaStyle: { borderColor: "var(--color-electric)" },
							}}
						/>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-3 border-separator border-t p-4">
						<div className="flex min-w-0 flex-col">
							<p className="truncate font-medium text-sm">{source.file.name}</p>
							<p className="font-mono text-muted text-xs">
								{area
									? `${Math.round(area.width)} × ${Math.round(area.height)} px`
									: "…"}
							</p>
						</div>
						<div className="flex gap-2">
							<Button
								variant="ghost"
								onPress={() => {
									setSource(undefined);
									setArea(undefined);
								}}
							>
								<ImagePlus size={16} />
								<FormattedMessage id="crop.another" />
							</Button>
							<Button
								variant="primary"
								className="font-semibold"
								isDisabled={!area}
								onPress={download}
							>
								<Download size={16} />
								<FormattedMessage id="queue.download" />
							</Button>
						</div>
					</div>
				</section>
			)}
		</ToolPage>
	);
}
