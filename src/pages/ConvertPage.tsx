import { useState } from "react";
import { FormatPicker, QualitySlider } from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import {
	decodeImage,
	encodeImage,
	type OutputType,
	renameExtension,
} from "../lib/image";
import { useBatch } from "../lib/useBatch";
import { CONVERT_TOOL } from "../tools";

const tool = CONVERT_TOOL;

const FORMATS: { id: OutputType; label: string }[] = [
	{ id: "image/jpeg", label: "JPG" },
	{ id: "image/png", label: "PNG" },
	{ id: "image/webp", label: "WEBP" },
];

export function ConvertPage() {
	const [format, setFormat] = useState<OutputType>("image/jpeg");
	const [quality, setQuality] = useState(92);
	const { items, add, clear } = useBatch();

	const handleFiles = (files: File[]) =>
		add(files, async (file) => ({
			blob: await encodeImage(await decodeImage(file), format, quality / 100),
			name: renameExtension(file.name, format),
		}));

	return (
		<ToolPage
			tool={tool}
			items={items}
			onFiles={handleFiles}
			onClear={clear}
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
		/>
	);
}
