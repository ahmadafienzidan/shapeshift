import { useState } from "react";
import { useIntl } from "react-intl";
import { CombineTool } from "../components/CombineTool";
import {
	ColorInput,
	FormatPicker,
	QualitySlider,
	RangeSlider,
} from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import { EXTENSIONS, IMAGE_KIND, type OutputType } from "../lib/image";
import { mergeImages } from "../lib/merge";
import { MERGE_TOOL } from "../tools";

export function MergePage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [direction, setDirection] = useState<"vertical" | "horizontal">(
		"vertical",
	);
	const [size, setSize] = useState<"same" | "original">("same");
	const [gap, setGap] = useState(0);
	const [backgroundMode, setBackgroundMode] = useState<"none" | "color">(
		"none",
	);
	const [background, setBackground] = useState("#ffffff");
	const [format, setFormat] = useState<OutputType>("image/jpeg");
	const [quality, setQuality] = useState(90);

	return (
		<ToolPage
			tool={MERGE_TOOL}
			options={
				<>
					<FormatPicker
						labelId="merge.direction"
						value={direction}
						onChange={setDirection}
						options={[
							{ id: "vertical", label: t("merge.vertical") },
							{ id: "horizontal", label: t("merge.horizontal") },
						]}
					/>
					<FormatPicker
						labelId="merge.size"
						value={size}
						onChange={setSize}
						options={[
							{
								id: "same",
								label: t(
									direction === "vertical"
										? "merge.size.sameWidth"
										: "merge.size.sameHeight",
								),
							},
							{ id: "original", label: t("merge.size.original") },
						]}
					/>
					<RangeSlider
						labelId="merge.gap"
						value={gap}
						onChange={setGap}
						min={0}
						max={100}
						unit="px"
					/>
					<FormatPicker
						labelId="merge.background"
						value={backgroundMode}
						onChange={setBackgroundMode}
						options={[
							{ id: "none", label: t("merge.background.none") },
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
			<CombineTool
				kind={IMAGE_KIND}
				actionLabel={t("merge.action")}
				outputName={`shapeshift-merged.${EXTENSIONS[format]}`}
				combine={(files) =>
					mergeImages(files, {
						direction,
						gap,
						background: backgroundMode === "color" ? background : null,
						sameSize: size === "same",
						type: format,
						quality: quality / 100,
					})
				}
			/>
		</ToolPage>
	);
}
