import { Chip, Input, Label, TextField } from "@heroui/react";
import { ImageIcon, type LucideIcon, Palette } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { Dropzone } from "../components/Dropzone";
import { KeepAlive } from "../components/KeepAlive";
import { ModeTabs } from "../components/ModeTabs";
import { ToolPage } from "../components/ToolPage";
import {
	contrastRatio,
	extractPalette,
	type PaletteColor,
	parseColor,
	type Rgb,
	shades,
	toCmyk,
	toHex,
	toHsl,
	toOklchString,
	toRgbString,
} from "../lib/color";
import { IMAGE_KIND } from "../lib/image";
import { useCopy } from "../lib/useCopy";
import { COLOR_TOOL } from "../tools";

type Mode = "convert" | "palette";

const MODES = [
	{ id: "convert", icon: Palette, labelId: "color.mode.convert" },
	{ id: "palette", icon: ImageIcon, labelId: "color.mode.palette" },
] satisfies { id: Mode; icon: LucideIcon; labelId: string }[];

const WHITE: Rgb = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: Rgb = { r: 0, g: 0, b: 0, a: 1 };

function Swatch({ rgb, label }: { rgb: Rgb; label: string }) {
	const { copied, copy } = useCopy();
	const hex = toHex(rgb);
	const textColor =
		contrastRatio(WHITE, rgb) > contrastRatio(BLACK, rgb)
			? "#ffffff"
			: "#001e2b";
	return (
		<button
			type="button"
			onClick={() => copy(hex)}
			title={hex}
			className="group flex h-20 min-w-0 flex-1 flex-col justify-end rounded p-2 text-left transition-transform hover:-translate-y-1"
			style={{ background: hex, color: textColor }}
		>
			<span className="font-mono font-semibold text-[0.6875rem]">{label}</span>
			<span className="font-mono text-[0.625rem] opacity-80">
				{copied ? <FormattedMessage id="data.copied" /> : hex}
			</span>
		</button>
	);
}

function ContrastCard({ rgb, background }: { rgb: Rgb; background: Rgb }) {
	const ratio = contrastRatio(rgb, background);
	const levels = [
		["AA", ratio >= 4.5],
		["AAA", ratio >= 7],
		["AA Large", ratio >= 3],
	] as const;
	return (
		<div
			className="flex flex-col gap-3 rounded-xl border border-border p-4"
			style={{ background: toHex(background) }}
		>
			<p className="headline text-3xl" style={{ color: toHex(rgb) }}>
				Aa {ratio.toFixed(2)}:1
			</p>
			<div className="flex flex-wrap gap-1.5">
				{levels.map(([level, pass]) => (
					<Chip
						key={level}
						size="sm"
						variant="primary"
						color={pass ? "success" : "danger"}
						className="font-mono text-[0.625rem]"
					>
						{pass ? "✓" : "✕"} {level}
					</Chip>
				))}
			</div>
		</div>
	);
}

function Converter() {
	const intl = useIntl();
	const [input, setInput] = useState("#3ddcff");
	// Keeps showing the last valid colour while the user is mid-way through
	// typing a new one.
	const [rgb, setRgb] = useState<Rgb>({ r: 61, g: 220, b: 255, a: 1 });
	const deferred = useDeferredValue(rgb);
	const valid = parseColor(input) !== undefined;

	const update = (value: string) => {
		setInput(value);
		const parsed = parseColor(value);
		if (parsed) setRgb(parsed);
	};

	const formats = [
		["HEX", toHex(deferred)],
		["RGB", toRgbString(deferred)],
		["HSL", toHsl(deferred)],
		["OKLCH", toOklchString(deferred)],
		["CMYK", toCmyk(deferred)],
	];

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
				<div className="flex flex-col gap-3">
					<label
						className="relative block aspect-square cursor-pointer overflow-hidden rounded-xl border border-border"
						style={{ background: toRgbString(rgb) }}
					>
						<input
							type="color"
							value={toHex({ ...rgb, a: 1 })}
							onChange={(event) => update(event.target.value)}
							aria-label={intl.formatMessage({ id: "color.pick" })}
							className="absolute inset-0 size-full cursor-pointer opacity-0"
						/>
						<span className="absolute right-2 bottom-2 rounded bg-surface/90 px-2 py-1 font-mono text-xs backdrop-blur">
							<FormattedMessage id="color.pick" />
						</span>
					</label>
					<TextField value={input} onChange={update} isInvalid={!valid}>
						<Label>
							<FormattedMessage id="color.input" />
						</Label>
						<Input
							className="font-mono"
							placeholder="tomato, #3ddcff, hsl(…)"
						/>
					</TextField>
					{!valid && (
						<p className="text-danger text-xs">
							<FormattedMessage id="color.invalid" />
						</p>
					)}
				</div>

				<ul className="flex flex-col divide-y divide-separator overflow-hidden rounded-xl border border-border bg-surface">
					{formats.map(([name, value]) => (
						<li key={name} className="flex items-center gap-4 px-5 py-3">
							<span className="eyebrow w-14 shrink-0 text-[0.6875rem] text-muted">
								{name}
							</span>
							<code className="min-w-0 flex-1 truncate font-mono text-sm">
								{value}
							</code>
							<CopyButton text={value ?? ""} />
						</li>
					))}
				</ul>
			</div>

			<section className="flex flex-col gap-3">
				<p className="eyebrow text-muted">
					<FormattedMessage id="color.contrast" />
				</p>
				<div className="grid gap-4 sm:grid-cols-2">
					<ContrastCard rgb={deferred} background={WHITE} />
					<ContrastCard rgb={deferred} background={BLACK} />
				</div>
			</section>

			<section className="flex flex-col gap-3">
				<p className="eyebrow text-muted">
					<FormattedMessage id="color.shades" />
				</p>
				<div className="flex gap-1.5 overflow-x-auto">
					{shades(deferred).map((shade) => (
						<Swatch key={shade.name} rgb={shade.rgb} label={shade.name} />
					))}
				</div>
				<p className="text-muted text-xs">
					<FormattedMessage id="color.clickToCopy" />
				</p>
			</section>
		</div>
	);
}

function PaletteFromImage() {
	const intl = useIntl();
	const [image, setImage] = useState<{ url: string; name: string }>();
	const [palette, setPalette] = useState<PaletteColor[]>([]);
	const [error, setError] = useState<string>();

	const load = async ([file]: File[]) => {
		if (!file) return;
		if (image) URL.revokeObjectURL(image.url);
		setError(undefined);
		setImage({ url: URL.createObjectURL(file), name: file.name });
		try {
			setPalette(await extractPalette(file, 8));
		} catch (caught) {
			setPalette([]);
			setError(String(caught));
		}
	};

	const css = palette
		.map((color, index) => `  --palette-${index + 1}: ${toHex(color.rgb)};`)
		.join("\n");

	return (
		<>
			<Dropzone kind={IMAGE_KIND} onFiles={load} />
			{error && <p className="text-center text-danger text-sm">{error}</p>}
			{image && palette.length > 0 && (
				<section className="grid gap-4 overflow-hidden rounded-xl border border-border bg-surface p-5 lg:grid-cols-[18rem_1fr]">
					<img
						src={image.url}
						alt={image.name}
						className="max-h-72 w-full rounded object-contain"
					/>
					<div className="flex min-w-0 flex-col gap-4">
						<div className="flex h-10 overflow-hidden rounded">
							{palette.map((color) => (
								<div
									key={toHex(color.rgb)}
									style={{
										background: toHex(color.rgb),
										width: `${color.share * 100}%`,
									}}
									title={`${toHex(color.rgb)} · ${intl.formatNumber(color.share, { style: "percent" })}`}
								/>
							))}
						</div>
						<div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
							{palette.map((color) => (
								<Swatch
									key={toHex(color.rgb)}
									rgb={color.rgb}
									label={intl.formatNumber(color.share, {
										style: "percent",
									})}
								/>
							))}
						</div>
						<div className="flex items-center justify-between gap-3">
							<p className="text-muted text-xs">
								<FormattedMessage id="color.clickToCopy" />
							</p>
							<CopyButton text={`:root {\n${css}\n}`} variant="outline" />
						</div>
					</div>
				</section>
			)}
		</>
	);
}

export function ColorPage() {
	const intl = useIntl();
	const [mode, setMode] = useState<Mode>("convert");

	return (
		<ToolPage
			tool={COLOR_TOOL}
			toolbar={
				<ModeTabs
					label={intl.formatMessage({ id: "tool.color.name" })}
					value={mode}
					onChange={setMode}
					modes={MODES}
				/>
			}
		>
			<KeepAlive
				active={mode}
				render={(mode) =>
					mode === "convert" ? <Converter /> : <PaletteFromImage />
				}
			/>
		</ToolPage>
	);
}
