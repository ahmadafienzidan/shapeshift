import { useState } from "react";
import { BatchTool } from "../components/BatchTool";
import { FormatPicker, QualitySlider } from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import {
	decodeImage,
	encodeImage,
	IMAGE_KIND,
	type OutputType,
	renameExtension,
} from "../lib/image";
import { CONVERT_TOOL } from "../tools";

const FORMATS: { id: OutputType; label: string }[] = [
	{ id: "image/jpeg", label: "JPG" },
	{ id: "image/png", label: "PNG" },
	{ id: "image/webp", label: "WEBP" },
];

export function ConvertPage() {
	const [format, setFormat] = useState<OutputType>("image/jpeg");
	const [quality, setQuality] = useState(92);

	return (
		<ToolPage
			tool={CONVERT_TOOL}
			optionsHint="options.appliesToNew"
			options={
				<>
					<FormatPicker value={format} options={FORMATS} onChange={setFormat} />
					<QualitySlider
						value={quality}
						onChange={setQuality}
						isDisabled={format === "image/png"}
					/>
				</>
			}
		>
			<BatchTool
				kind={IMAGE_KIND}
				zipName="shapeshift-convert.zip"
				process={async (file) => [
					{
						blob: await encodeImage(
							await decodeImage(file),
							format,
							quality / 100,
						),
						name: renameExtension(file.name, format),
					},
				]}
			/>
		</ToolPage>
	);
}
