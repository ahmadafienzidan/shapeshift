import { Button, Input, Label, TextField } from "@heroui/react";
import { Archive } from "lucide-react";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { Dropzone } from "../components/Dropzone";
import { ColorInput, FormatPicker, RangeSlider } from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import { createZip, downloadBlob } from "../lib/files";
import { generateIcons, iconSnippet } from "../lib/icons";
import { decodeImage, IMAGE_KIND } from "../lib/image";
import type { BatchResult } from "../lib/useBatch";
import { ICONS_TOOL } from "../tools";

const PREVIEWS: Record<string, { display: number; label: string }> = {
	"favicon-16x16.png": { display: 16, label: "16×16" },
	"favicon-32x32.png": { display: 32, label: "32×32" },
	"apple-touch-icon.png": { display: 90, label: "180×180" },
	"android-chrome-192x192.png": { display: 96, label: "192×192" },
	"android-chrome-512x512.png": { display: 128, label: "512×512" },
};

export function IconsPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });

	const [source, setSource] = useState<{ name: string; bitmap: ImageBitmap }>();
	const [error, setError] = useState<string>();
	const [backgroundMode, setBackgroundMode] = useState<"transparent" | "color">(
		"transparent",
	);
	const [background, setBackground] = useState("#001e2b");
	const [padding, setPadding] = useState(0);
	const [radius, setRadius] = useState(0);
	const [name, setName] = useState("My App");
	const [themeColor, setThemeColor] = useState("#001e2b");
	const [icons, setIcons] = useState<BatchResult[]>([]);

	const load = async ([file]: File[]) => {
		if (!file) return;
		setError(undefined);
		try {
			setSource({ name: file.name, bitmap: await decodeImage(file, 1024) });
		} catch (caught) {
			setError(String(caught));
		}
	};

	useEffect(() => {
		if (!source) return;
		let cancelled = false;
		let created: BatchResult[] = [];
		generateIcons(source.bitmap, {
			background: backgroundMode === "color" ? background : null,
			padding: padding / 100,
			radius: radius / 100,
			name,
			themeColor,
		}).then((outputs) => {
			if (cancelled) return;
			created = outputs.map((output) => ({
				...output,
				url: URL.createObjectURL(output.blob),
			}));
			setIcons(created);
		});
		return () => {
			cancelled = true;
			for (const icon of created) URL.revokeObjectURL(icon.url);
		};
	}, [source, backgroundMode, background, padding, radius, name, themeColor]);

	const pngs = icons.flatMap((icon) => {
		const preview = PREVIEWS[icon.name];
		return preview ? [{ ...icon, ...preview }] : [];
	});
	const favicon = icons.find((icon) => icon.name === "favicon-32x32.png");
	const touch = icons.find((icon) => icon.name === "apple-touch-icon.png");
	const snippet = iconSnippet(themeColor);

	return (
		<ToolPage
			tool={ICONS_TOOL}
			options={
				<>
					<FormatPicker
						labelId="icons.background"
						value={backgroundMode}
						onChange={setBackgroundMode}
						options={[
							{ id: "transparent", label: t("icons.background.transparent") },
							{ id: "color", label: t("icons.background.color") },
						]}
					/>
					{backgroundMode === "color" && (
						<ColorInput
							labelId="icons.backgroundColor"
							value={background}
							onChange={setBackground}
						/>
					)}
					<RangeSlider
						labelId="icons.padding"
						value={padding}
						onChange={setPadding}
						min={0}
						max={30}
					/>
					<RangeSlider
						labelId="icons.radius"
						value={radius}
						onChange={setRadius}
						min={0}
						max={100}
					/>
					<TextField value={name} onChange={setName}>
						<Label>
							<FormattedMessage id="icons.name" />
						</Label>
						<Input />
					</TextField>
					<ColorInput
						labelId="icons.themeColor"
						value={themeColor}
						onChange={setThemeColor}
					/>
				</>
			}
		>
			<Dropzone kind={IMAGE_KIND} onFiles={load} />
			{error && <p className="text-center text-danger text-sm">{error}</p>}

			{source && icons.length > 0 && (
				<>
					<section className="overflow-hidden rounded-xl border border-border bg-surface">
						<div className="flex flex-wrap items-center justify-between gap-4 border-separator border-b p-5">
							<div className="flex min-w-0 flex-col gap-1">
								<p className="eyebrow text-muted">
									<FormattedMessage id="icons.preview" />
								</p>
								<p className="truncate font-mono text-sm">{source.name}</p>
							</div>
							<Button
								variant="primary"
								className="font-semibold"
								onPress={async () =>
									downloadBlob(await createZip(icons), "shapeshift-icons.zip")
								}
							>
								<Archive size={16} />
								<FormattedMessage id="icons.download" />
							</Button>
						</div>

						<div className="flex flex-wrap items-end gap-6 p-6 [background-image:conic-gradient(var(--default)_25%,transparent_0_50%,var(--default)_0_75%,transparent_0)] [background-size:16px_16px]">
							{pngs.map((icon) => (
								<figure
									key={icon.name}
									className="flex flex-col items-center gap-2"
								>
									<img
										src={icon.url}
										alt=""
										style={{ width: icon.display, height: icon.display }}
										className="[image-rendering:pixelated]"
									/>
									<figcaption className="rounded bg-surface px-1.5 font-mono text-[0.625rem] text-muted">
										{icon.label}
									</figcaption>
								</figure>
							))}
						</div>

						<div className="grid gap-4 border-separator border-t p-5 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<p className="eyebrow text-[0.6875rem] text-muted">
									<FormattedMessage id="icons.mock.tab" />
								</p>
								<div className="flex items-center gap-2 rounded-t-lg border border-border border-b-0 bg-surface-secondary px-3 py-2">
									{favicon && (
										<img src={favicon.url} alt="" className="size-4" />
									)}
									<span className="truncate text-sm">{name}</span>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<p className="eyebrow text-[0.6875rem] text-muted">
									<FormattedMessage id="icons.mock.home" />
								</p>
								<div className="flex items-center gap-3">
									{touch && (
										<img
											src={touch.url}
											alt=""
											className="size-14 rounded-[22%] shadow-md"
										/>
									)}
									<span className="text-sm">{name}</span>
								</div>
							</div>
						</div>
					</section>

					<section className="overflow-hidden rounded-xl border border-border bg-surface">
						<div className="flex items-center justify-between gap-4 border-separator border-b px-5 py-3">
							<p className="eyebrow text-muted">
								<FormattedMessage
									id="icons.snippet"
									values={{ tag: "<head>" }}
								/>
							</p>
							<CopyButton text={snippet} />
						</div>
						<pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed">
							{snippet}
						</pre>
					</section>
				</>
			)}
		</ToolPage>
	);
}
