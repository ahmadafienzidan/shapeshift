import { useState } from "react";
import { useIntl } from "react-intl";
import { BatchTool } from "../components/BatchTool";
import {
	FormatPicker,
	MaxDimensionSelect,
	QualitySlider,
} from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import {
	decodeImage,
	encodeImage,
	IMAGE_KIND,
	type OutputType,
	renameExtension,
	resolveFormat,
} from "../lib/image";
import { COMPRESS_TOOL } from "../tools";

type CompressFormat = OutputType | "original";

export function CompressPage() {
	const intl = useIntl();
	const [format, setFormat] = useState<CompressFormat>("original");
	const [quality, setQuality] = useState(75);
	const [maxDimension, setMaxDimension] = useState(1920);

	return (
		<ToolPage
			tool={COMPRESS_TOOL}
			optionsHint="options.appliesToNew"
			options={
				<>
					<FormatPicker
						value={format}
						onChange={setFormat}
						options={[
							{
								id: "original",
								label: intl.formatMessage({ id: "options.format.original" }),
							},
							{ id: "image/jpeg", label: "JPG" },
							{ id: "image/webp", label: "WEBP" },
						]}
					/>
					<QualitySlider value={quality} onChange={setQuality} />
					<MaxDimensionSelect value={maxDimension} onChange={setMaxDimension} />
				</>
			}
		>
			<BatchTool
				kind={IMAGE_KIND}
				zipName="shapeshift-compress.zip"
				process={async (file) => {
					const type = resolveFormat(file, format);
					return [
						{
							blob: await encodeImage(
								await decodeImage(file),
								type,
								quality / 100,
								maxDimension || undefined,
							),
							name: renameExtension(file.name, type),
						},
					];
				}}
			/>
		</ToolPage>
	);
}
